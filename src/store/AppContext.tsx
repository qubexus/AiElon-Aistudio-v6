import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { translate, type TranslationKey } from "../i18n/translations";
import { setActiveTheme, type ThemeMode } from "../theme/tokens";
import { BACKEND_URL, checkHealth } from "../api/client";
import type {
  CaseAttachment,
  CaseReminder,
  ChatMessage,
  Locale,
  SentLetter,
  UserProfile,
  WorkplaceCase,
} from "../types";
import { configureNotifications, cancelNotification } from "../utils/notifications";
import { deleteAttachmentFile } from "../utils/attachments";

const STORAGE_KEY = "ask-elon/state/v1";

export const emptyProfile: UserProfile = {
  id: "local-user",
  accountId: "local-account",
  fullName: "",
  email: "",
  phone: "",
  homeAddress: "",
  employerName: "",
  companyNumber: "",
  employerAddress: "",
  jobTitle: "",
  startDate: "",
  hourlyRate: 0,
  hoursPerWeek: 0,
  contractType: "permanent",
  industry: "",
  isPro: false,
  role: "user",
  onboarded: false,
};

interface PersistedState {
  locale: Locale;
  theme: ThemeMode;
  autoRead: boolean;
  profile: UserProfile;
  cases: WorkplaceCase[];
  letters: SentLetter[];
  messages: ChatMessage[];
  attachments: CaseAttachment[];
  reminders: CaseReminder[];
  notificationsEnabled: boolean;
}

interface AppContextValue extends PersistedState {
  hydrated: boolean;
  online: boolean;
  backendUrl: string;
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => void;
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  autoRead: boolean;
  setAutoRead: (value: boolean) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  addCase: (
    input: Pick<WorkplaceCase, "title" | "description" | "sector" | "employer">
  ) => WorkplaceCase;
  updateCase: (id: string, patch: Partial<WorkplaceCase>) => void;
  deleteCase: (id: string) => void;
  addCaseNote: (caseId: string, text: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, text: string) => void;
  clearChat: () => void;
  addLetter: (letter: SentLetter) => void;
  deleteLetter: (id: string) => void;
  addAttachment: (attachment: CaseAttachment) => void;
  removeAttachment: (id: string) => void;
  addReminder: (reminder: CaseReminder) => void;
  removeReminder: (id: string) => void;
  setNotificationsEnabled: (value: boolean) => void;
  serviceLength: { years: number; months: number; days: number } | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Length of service from startDate, used for statutory entitlement hints. */
export function computeServiceLength(startDate: string) {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;

  const now = new Date();
  if (start > now) return { years: 0, months: 0, days: 0 };

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>({
    locale: "en",
    theme: "system",
    autoRead: false,
    profile: emptyProfile,
    cases: [],
    letters: [],
    messages: [],
    attachments: [],
    reminders: [],
    notificationsEnabled: true,
  });
  const [hydrated, setHydrated] = useState(false);
  const [online, setOnline] = useState(true);
  const hydratedRef = useRef(false);

  // Hydrate from disk once.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          const parsed = JSON.parse(raw) as Partial<PersistedState>;
          setState((prev) => ({
            locale: parsed.locale ?? prev.locale,
            theme: parsed.theme ?? prev.theme,
            autoRead: typeof parsed.autoRead === "boolean" ? parsed.autoRead : prev.autoRead,
            profile: { ...emptyProfile, ...(parsed.profile ?? {}) },
            cases: Array.isArray(parsed.cases) ? parsed.cases : [],
            letters: Array.isArray(parsed.letters) ? parsed.letters : [],
            messages: Array.isArray(parsed.messages) ? parsed.messages : [],
            attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [],
            reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
            notificationsEnabled:
              typeof parsed.notificationsEnabled === "boolean"
                ? parsed.notificationsEnabled
                : prev.notificationsEnabled,
          }));
        }
      } catch (err) {
        console.warn("Failed to hydrate local state:", err);
      } finally {
        if (mounted) {
          hydratedRef.current = true;
          setHydrated(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist on change.
  useEffect(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((err) =>
      console.warn("Failed to persist local state:", err)
    );
  }, [state]);

  // Native notification handler + Android channel, once per launch.
  useEffect(() => {
    configureNotifications().catch(() => {});
  }, []);

  // Connectivity probe.
  useEffect(() => {
    let active = true;
    const probe = async () => {
      const ok = await checkHealth();
      if (active) setOnline(ok);
    };
    probe();
    const interval = setInterval(probe, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const setLocale = useCallback((locale: Locale) => {
    setState((prev) => ({ ...prev, locale }));
  }, []);

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const addCase = useCallback<AppContextValue["addCase"]>((input) => {
    const timestamp = new Date().toISOString();
    const created: WorkplaceCase = {
      id: newId("case"),
      title: input.title.trim(),
      description: input.description.trim(),
      sector: input.sector,
      employer: input.employer.trim(),
      status: "open",
      priority: "medium",
      createdAt: timestamp,
      updatedAt: timestamp,
      notes: [],
    };
    setState((prev) => ({ ...prev, cases: [created, ...prev.cases] }));
    return created;
  }, []);

  const updateCase = useCallback((id: string, patch: Partial<WorkplaceCase>) => {
    setState((prev) => ({
      ...prev,
      cases: prev.cases.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c
      ),
    }));
  }, []);

  const deleteCase = useCallback((id: string) => {
    setState((prev) => ({ ...prev, cases: prev.cases.filter((c) => c.id !== id) }));
  }, []);

  const addCaseNote = useCallback((caseId: string, text: string) => {
    const note = {
      id: newId("note"),
      text: text.trim(),
      date: new Date().toISOString(),
      author: "You",
    };
    setState((prev) => ({
      ...prev,
      cases: prev.cases.map((c) =>
        c.id === caseId
          ? { ...c, notes: [note, ...c.notes], updatedAt: new Date().toISOString() }
          : c
      ),
    }));
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setState((prev) => ({ ...prev, messages: [...prev.messages, message] }));
  }, []);

  const updateMessage = useCallback((id: string, text: string) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === id ? { ...m, text } : m)),
    }));
  }, []);

  const setAutoRead = useCallback(
    (autoRead: boolean) => setState((prev) => ({ ...prev, autoRead })),
    []
  );

  const clearChat = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] }));
  }, []);

  const addLetter = useCallback((letter: SentLetter) => {
    setState((prev) => ({ ...prev, letters: [letter, ...prev.letters] }));
  }, []);

  const deleteLetter = useCallback((id: string) => {
    setState((prev) => ({ ...prev, letters: prev.letters.filter((l) => l.id !== id) }));
  }, []);

  const addAttachment = useCallback((attachment: CaseAttachment) => {
    setState((prev) => ({ ...prev, attachments: [attachment, ...prev.attachments] }));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.attachments.find((a) => a.id === id);
      if (target) void deleteAttachmentFile(target.uri);
      return { ...prev, attachments: prev.attachments.filter((a) => a.id !== id) };
    });
  }, []);

  const addReminder = useCallback((reminder: CaseReminder) => {
    setState((prev) => ({ ...prev, reminders: [reminder, ...prev.reminders] }));
  }, []);

  const removeReminder = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.reminders.find((r) => r.id === id);
      if (target) void cancelNotification(target.notificationId);
      return { ...prev, reminders: prev.reminders.filter((r) => r.id !== id) };
    });
  }, []);

  const setNotificationsEnabled = useCallback((notificationsEnabled: boolean) => {
    setState((prev) => ({ ...prev, notificationsEnabled }));
  }, []);

  const t = useCallback((key: TranslationKey) => translate(state.locale, key), [state.locale]);

  const systemScheme = useColorScheme();
  const resolvedTheme: "light" | "dark" =
    state.theme === "system" ? (systemScheme === "dark" ? "dark" : "light") : state.theme;

  // Repaint the palette before children render, so a theme switch is atomic.
  setActiveTheme(resolvedTheme);

  const serviceLength = useMemo(
    () => computeServiceLength(state.profile.startDate),
    [state.profile.startDate]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      resolvedTheme,
      hydrated,
      online,
      backendUrl: BACKEND_URL,
      t,
      setLocale,
      setTheme,
      setAutoRead,
      updateProfile,
      addCase,
      updateCase,
      deleteCase,
      addCaseNote,
      addMessage,
      updateMessage,
      clearChat,
      addLetter,
      deleteLetter,
      addAttachment,
      removeAttachment,
      addReminder,
      removeReminder,
      setNotificationsEnabled,
      serviceLength,
    }),
    [
      state,
      resolvedTheme,
      hydrated,
      online,
      t,
      setLocale,
      setTheme,
      setAutoRead,
      updateProfile,
      addCase,
      updateCase,
      deleteCase,
      addCaseNote,
      addMessage,
      updateMessage,
      clearChat,
      addLetter,
      deleteLetter,
      addAttachment,
      removeAttachment,
      addReminder,
      removeReminder,
      setNotificationsEnabled,
      serviceLength,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
