import { Platform } from "react-native";

/**
 * Local notifications wrapper.
 *
 * expo-notifications has no web implementation, so every call is a no-op on web
 * and the module is imported lazily — that keeps the web bundle from touching
 * native-only code paths.
 */

const isNative = Platform.OS !== "web";

let configured = false;

type NotificationsModule = typeof import("expo-notifications");

async function load(): Promise<NotificationsModule | null> {
  if (!isNative) return null;
  try {
    return await import("expo-notifications");
  } catch {
    return null;
  }
}

/** Install the foreground handler and the Android channel. Call once at boot. */
export async function configureNotifications(): Promise<void> {
  if (configured) return;
  const N = await load();
  if (!N) return;

  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    try {
      await N.setNotificationChannelAsync("deadlines", {
        name: "Deadlines",
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#F59E42",
      });
    } catch {
      // Channel setup is best-effort.
    }
  }
  configured = true;
}

/** Ask for permission if we do not have it yet. Returns the final decision. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const N = await load();
  if (!N) return false;

  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await N.requestPermissionsAsync();
  return asked.granted;
}

export interface ScheduleInput {
  title: string;
  body: string;
  /** When the notification should fire. Past dates fire 10 seconds from now. */
  date: Date;
  data?: Record<string, unknown>;
}

/** Schedule a one-off local notification. Returns its id, or null on failure. */
export async function scheduleNotification(input: ScheduleInput): Promise<string | null> {
  const N = await load();
  if (!N) return null;

  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  const fireAt = input.date.getTime() > Date.now() ? input.date : new Date(Date.now() + 10_000);

  try {
    return await N.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        sound: "default",
        data: input.data ?? {},
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: Platform.OS === "android" ? "deadlines" : undefined,
      },
    });
  } catch {
    return null;
  }
}

/** Fire a notification in a few seconds — used by the "test" button. */
export async function sendTestNotification(title: string, body: string): Promise<boolean> {
  const id = await scheduleNotification({
    title,
    body,
    date: new Date(Date.now() + 5_000),
  });
  return id !== null;
}

export async function cancelNotification(id: string | null): Promise<void> {
  if (!id) return;
  const N = await load();
  if (!N) return;
  try {
    await N.cancelScheduledNotificationAsync(id);
  } catch {
    // Already fired or removed.
  }
}

export async function cancelAllNotifications(): Promise<void> {
  const N = await load();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled.
  }
}

/** How many notifications are queued (0 on web). */
export async function scheduledCount(): Promise<number> {
  const N = await load();
  if (!N) return 0;
  try {
    const all = await N.getAllScheduledNotificationsAsync();
    return all.length;
  } catch {
    return 0;
  }
}

/**
 * Two reminders for a case deadline: one week before and one day before, both
 * at 09:00 local time. Dates already in the past are skipped.
 */
export function deadlineReminderDates(deadline: string): Date[] {
  const parsed = new Date(`${deadline}T09:00:00`);
  if (Number.isNaN(parsed.getTime())) return [];

  const week = new Date(parsed);
  week.setDate(week.getDate() - 7);
  const day = new Date(parsed);
  day.setDate(day.getDate() - 1);

  const now = Date.now();
  return [week, day].filter((d) => d.getTime() > now);
}
