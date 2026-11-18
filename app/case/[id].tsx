import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Button,
  Card,
  EmptyState,
  Header,
  Pill,
  Screen,
  SectionTitle,
} from "../../src/components/ui";
import { formatDate, formatDateTime } from "../../src/i18n/translations";
import type { TranslationKey } from "../../src/i18n/translations";
import { useApp } from "../../src/store/AppContext";
import { colors, createThemedStyles, radius, spacing, typography } from "../../src/theme/tokens";
import {
  captureFromUri,
  captureWithSystemCamera,
  formatBytes,
  isImage,
  pickDocuments,
  pickPhotos,
  toCaseAttachment,
  type PickedAttachment,
} from "../../src/utils/attachments";
import { setPhotoHandler } from "../../src/utils/cameraBus";
import { deadlineReminderDates, scheduleNotification } from "../../src/utils/notifications";

const LEGACY_SECTORS: Record<string, string> = {
  Warehouse: "warehouse",
  "Healthcare / NHS": "healthcare",
  Construction: "construction",
  Hospitality: "hospitality",
  Agency: "agency",
  Other: "other",
};

const sectorLabel = (t: (key: TranslationKey) => string, sector: string) => {
  const key = LEGACY_SECTORS[sector] ?? sector;
  const translated = t(`cases.sectors.${key}` as TranslationKey);
  return translated === `cases.sectors.${key}` ? sector : translated;
};

const isNative = Platform.OS !== "web";

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    t,
    locale,
    cases,
    updateCase,
    deleteCase,
    addCaseNote,
    attachments,
    addAttachment,
    removeAttachment,
    reminders,
    addReminder,
    removeReminder,
  } = useApp();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState("");

  const item = cases.find((c) => c.id === id);

  if (!item) {
    return (
      <View style={styles.container}>
        <Header title={t("cases.title")} onBack={() => router.back()} showLogo={false} />
        <EmptyState
          icon="alert-circle-outline"
          title={t("common.error")}
          description={t("cases.empty")}
          actionLabel={t("common.close")}
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const caseAttachments = attachments.filter((a) => a.caseId === item.id);
  const caseReminders = reminders.filter((r) => r.caseId === item.id);

  const submitNote = () => {
    if (!note.trim()) return;
    addCaseNote(item.id, note);
    setNote("");
  };

  const askElon = () => {
    const prompt = t("cases.askElonPrompt")
      .replace("{title}", item.title)
      .replace("{description}", item.description)
      .replace("{employer}", item.employer || t("cases.unknownEmployer"))
      .replace("{sector}", sectorLabel(t, item.sector));
    router.push({ pathname: "/chat", params: { prompt, caseId: item.id } });
  };

  /** Persist a batch of picked files against this case. */
  const commit = (picked: PickedAttachment[]) => {
    if (!picked.length) return;
    const createdAt = new Date().toISOString();
    for (const file of picked) {
      addAttachment(toCaseAttachment(item.id, file, newId(), createdAt));
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const runPick = async (task: () => Promise<PickedAttachment[]>) => {
    if (busy) return;
    setBusy(true);
    try {
      commit(await task());
    } catch {
      Alert.alert(t("common.error"), t("attachments.failed"));
    } finally {
      setBusy(false);
    }
  };

  const takePhoto = async () => {
    if (!isNative) {
      // Web has no in-app camera view: ImagePicker falls back to a file input.
      await runPick(async () => {
        const shot = await captureWithSystemCamera();
        return shot ? [shot] : [];
      });
      return;
    }
    setPhotoHandler(async (uri) => {
      await runPick(async () => [await captureFromUri(uri)]);
    });
    router.push("/camera");
  };

  const fromGallery = () => runPick(pickPhotos);
  const fromFiles = () => runPick(pickDocuments);

  const saveDeadline = () => {
    const value = deadlineDraft.trim();
    if (!value) {
      updateCase(item.id, { deadline: undefined });
      Alert.alert(t("cases.deadlineSaved"));
      return;
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(new Date(`${value}T09:00:00`).getTime())
    ) {
      Alert.alert(t("common.error"), t("cases.deadlineInvalid"));
      return;
    }
    updateCase(item.id, { deadline: value });
    Haptics.selectionAsync().catch(() => {});
    Alert.alert(t("cases.deadlineSaved"));
  };

  const remindMe = async () => {
    if (!item.deadline) {
      Alert.alert(t("cases.deadline"), t("cases.deadlineHint"));
      return;
    }
    const dates = deadlineReminderDates(item.deadline);
    if (!dates.length) {
      Alert.alert(t("notifications.title"), t("notifications.none"));
      return;
    }
    setBusy(true);
    try {
      let scheduled = 0;
      for (const date of dates) {
        const notificationId = await scheduleNotification({
          title: item.title,
          body: `${t("cases.deadline")}: ${formatDate(locale, item.deadline)}`,
          date,
          data: { caseId: item.id },
        });
        if (!notificationId) continue;
        scheduled += 1;
        addReminder({
          id: newId(),
          caseId: item.id,
          title: item.title,
          body: `${t("cases.deadline")}: ${formatDate(locale, item.deadline)}`,
          fireAt: date.toISOString(),
          notificationId,
          createdAt: new Date().toISOString(),
        });
      }
      if (!scheduled) {
        Alert.alert(t("notifications.title"), t("notifications.testFailed"));
      } else {
        Alert.alert(
          t("notifications.title"),
          t("cases.reminderSet").replace("{date}", formatDate(locale, dates[0].toISOString()))
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmRemoveAttachment = (attachmentId: string, name: string) => {
    Alert.alert(t("attachments.remove"), name, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => removeAttachment(attachmentId),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title={t("cases.title")}
        onBack={() => router.back()}
        showLogo={false}
        right={
          <View style={styles.headerActions}>
            <Ionicons
              name={item.status === "open" ? "checkmark-circle-outline" : "refresh-outline"}
              size={22}
              color={colors.brand}
              onPress={() =>
                updateCase(item.id, { status: item.status === "open" ? "resolved" : "open" })
              }
            />
            <Ionicons
              name="trash-outline"
              size={20}
              color={colors.muted}
              onPress={() =>
                Alert.alert(t("common.delete"), item.title, [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: () => {
                      deleteCase(item.id);
                      router.back();
                    },
                  },
                ])
              }
            />
          </View>
        }
      />

      <Screen scroll>
        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.pillsRow}>
          <Pill
            label={item.status === "open" ? t("cases.open") : t("cases.resolved")}
            tone={item.status === "open" ? "warning" : "success"}
          />
          <Pill label={sectorLabel(t, item.sector)} tone="neutral" />
          <Pill label={t(`cases.priority.${item.priority}`)} tone="brand" />
        </View>

        <Text style={styles.fieldLabel}>{t("cases.priority")}</Text>
        <View style={styles.priorityWrap}>
          {(["low", "medium", "high"] as const).map((p) => {
            const active = item.priority === p;
            return (
              <Pressable
                key={p}
                onPress={() => updateCase(item.id, { priority: p })}
                style={[styles.priorityChip, active && styles.priorityChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.priorityText, active && styles.priorityTextActive]}>
                  {t(`cases.priority.${p}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card style={styles.descriptionCard}>
          <Text style={styles.description}>{item.description}</Text>
          {item.employer ? (
            <Text style={styles.meta}>
              {t("cases.form.employer")}: {item.employer}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {formatDate(locale, item.createdAt)} · {item.notes.length}{" "}
            {t("cases.notes").toLowerCase()}
          </Text>
        </Card>

        <View style={styles.ctaRow}>
          <Button
            label={t("cases.askElon")}
            onPress={askElon}
            icon="chatbubbles-outline"
            fullWidth
          />
        </View>

        {/* Deadline + native reminders */}
        <SectionTitle>{t("cases.deadline")}</SectionTitle>
        <Card style={styles.deadlineCard}>
          <View style={styles.deadlineRow}>
            <TextInput
              value={deadlineDraft || item.deadline || ""}
              onChangeText={setDeadlineDraft}
              placeholder={t("cases.deadlinePlaceholder")}
              placeholderTextColor={colors.placeholder}
              style={styles.deadlineInput}
              autoCapitalize="none"
            />
            <Pressable
              onPress={saveDeadline}
              style={styles.iconAction}
              accessibilityRole="button"
              accessibilityLabel={t("cases.deadlineSave")}
            >
              <Ionicons name="checkmark" size={20} color={colors.onBrand} />
            </Pressable>
          </View>
          <Text style={styles.hint}>{t("cases.deadlineHint")}</Text>

          <View style={styles.deadlineActions}>
            <Button
              label={t("cases.remindMe")}
              onPress={remindMe}
              icon="notifications-outline"
              variant="secondary"
              disabled={busy}
            />
          </View>

          {caseReminders.length ? (
            <View style={styles.reminderList}>
              {caseReminders.map((r) => (
                <View key={r.id} style={styles.reminderRow}>
                  <Ionicons name="alarm-outline" size={16} color={colors.brand} />
                  <Text style={styles.reminderText}>{formatDateTime(locale, r.fireAt)}</Text>
                  <Pressable
                    onPress={() => removeReminder(r.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={t("notifications.cancel")}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Attachments: camera, gallery, files */}
        <SectionTitle right={<Text style={styles.count}>{caseAttachments.length}</Text>}>
          {t("attachments.title")}
        </SectionTitle>

        <View style={styles.pickerRow}>
          <PickerButton
            icon="camera-outline"
            label={t("attachments.camera")}
            onPress={takePhoto}
            disabled={busy}
          />
          <PickerButton
            icon="images-outline"
            label={t("attachments.gallery")}
            onPress={fromGallery}
            disabled={busy}
          />
          <PickerButton
            icon="folder-open-outline"
            label={t("attachments.files")}
            onPress={fromFiles}
            disabled={busy}
          />
        </View>

        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.hint}>{t("common.loading")}</Text>
          </View>
        ) : null}

        {caseAttachments.length === 0 ? (
          <Text style={styles.emptyAttachments}>{t("attachments.empty")}</Text>
        ) : (
          <View style={styles.attachmentList}>
            {caseAttachments.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => confirmRemoveAttachment(a.id, a.name)}
                style={styles.attachmentRow}
                accessibilityRole="button"
                accessibilityLabel={t("attachments.remove")}
              >
                {isImage(a.mimeType) ? (
                  <Image source={{ uri: a.uri }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbDoc]}>
                    <Ionicons name="document-text-outline" size={22} color={colors.brand} />
                  </View>
                )}
                <View style={styles.attachmentBody}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {a.name}
                  </Text>
                  <Text style={styles.attachmentMeta} numberOfLines={1}>
                    {t(`attachments.source.${a.source}` as TranslationKey)}
                    {formatBytes(a.size) ? ` · ${formatBytes(a.size)}` : ""}
                    {` · ${formatDate(locale, a.createdAt)}`}
                  </Text>
                </View>
                <Ionicons name="trash-outline" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}

        <SectionTitle>{t("cases.notes")}</SectionTitle>

        <View style={styles.noteInputWrap}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("cases.notePlaceholder")}
            placeholderTextColor={colors.placeholder}
            style={styles.noteInput}
            multiline
          />
          <Button
            label={t("cases.addNote")}
            onPress={submitNote}
            disabled={!note.trim()}
            icon="add"
          />
        </View>

        {item.notes.length === 0 ? (
          <Text style={styles.noNotes}>{t("cases.notes")}: 0</Text>
        ) : (
          <View style={styles.notesList}>
            {item.notes.map((n) => (
              <View key={n.id} style={styles.noteRow}>
                <View style={styles.timelineDot} />
                <View style={styles.noteBody}>
                  <Text style={styles.noteText}>{n.text}</Text>
                  <Text style={styles.noteDate}>{formatDateTime(locale, n.date)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

function PickerButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        pickerStyles.button,
        pressed && pickerStyles.pressed,
        disabled && pickerStyles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={22} color={colors.brand} />
      <Text style={pickerStyles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const pickerStyles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 84,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  label: {
    ...typography.sm,
    color: colors.onSurface,
    fontWeight: "600",
    textAlign: "center",
  },
});

const styles = createThemedStyles(() => ({
  container: { flex: 1, backgroundColor: colors.surface },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  title: { ...typography.title, color: colors.onSurface, marginTop: spacing.lg },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  descriptionCard: { marginTop: spacing.lg, gap: spacing.sm },
  description: { ...typography.body, color: colors.onSurface, lineHeight: 23 },
  meta: { ...typography.sm, color: colors.muted, fontWeight: "400" },
  ctaRow: { marginTop: spacing.lg },

  fieldLabel: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  priorityWrap: { flexDirection: "row", gap: spacing.sm },
  priorityChip: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  priorityChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  priorityText: { ...typography.sm, color: colors.muted, fontWeight: "600" },
  priorityTextActive: { color: colors.onBrand },

  deadlineCard: { gap: spacing.sm },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  deadlineInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    ...typography.base,
    color: colors.onSurface,
  },
  iconAction: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.brand,
  },
  hint: { ...typography.sm, color: colors.muted, fontWeight: "400" },
  deadlineActions: { marginTop: spacing.xs },
  reminderList: { gap: spacing.xs, marginTop: spacing.xs },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  reminderText: { ...typography.sm, color: colors.onSurface, flex: 1 },

  count: { ...typography.sm, color: colors.muted, fontWeight: "600" },
  pickerRow: { flexDirection: "row", gap: spacing.sm },
  busyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  emptyAttachments: {
    ...typography.sm,
    color: colors.muted,
    fontWeight: "400",
    marginTop: spacing.md,
    lineHeight: 20,
  },
  attachmentList: { gap: spacing.sm, marginTop: spacing.md },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  thumb: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.surface },
  thumbDoc: { alignItems: "center", justifyContent: "center" },
  attachmentBody: { flex: 1 },
  attachmentName: { ...typography.base, color: colors.onSurface, fontWeight: "600" },
  attachmentMeta: { ...typography.sm, color: colors.muted, fontWeight: "400", marginTop: 1 },

  noteInputWrap: { gap: spacing.sm, marginBottom: spacing.lg },
  noteInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    ...typography.base,
    color: colors.onSurface,
    textAlignVertical: "top",
  },
  noNotes: { ...typography.base, color: colors.muted },
  notesList: { gap: spacing.lg },
  noteRow: { flexDirection: "row", gap: spacing.md },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 6,
  },
  noteBody: { flex: 1 },
  noteText: { ...typography.base, color: colors.onSurface, lineHeight: 21 },
  noteDate: { ...typography.sm, color: colors.muted, marginTop: 2, fontWeight: "400" },
}));
