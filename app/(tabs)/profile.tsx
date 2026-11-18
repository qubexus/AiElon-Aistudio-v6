import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { Button, Card, Field, Header, Pill, Screen, SectionTitle } from "../../src/components/ui";
import { formatDate, localeLabels, type TranslationKey } from "../../src/i18n/translations";
import { useApp } from "../../src/store/AppContext";
import {
  colors,
  createThemedStyles,
  radius,
  spacing,
  typography,
  type ThemeMode,
} from "../../src/theme/tokens";
import type { ContractType, Locale, SentLetter, UserProfile } from "../../src/types";
import { exportLetterToPdf } from "../../src/utils/pdf";
import {
  ensureNotificationPermission,
  scheduledCount,
  sendTestNotification,
} from "../../src/utils/notifications";

const LOCALES: Locale[] = ["en", "pl", "ro"];
const THEMES: ThemeMode[] = ["light", "dark", "system"];
const CONTRACTS: ContractType[] = ["permanent", "zero_hours", "agency", "fixed_term"];

export default function ProfileScreen() {
  const {
    t,
    locale,
    setLocale,
    theme,
    setTheme,
    profile,
    updateProfile,
    serviceLength,
    letters,
    deleteLetter,
    backendUrl,
    online,
    reminders,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useApp();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [selectedLetter, setSelectedLetter] = useState<SentLetter | null>(null);
  const [scheduled, setScheduled] = useState(0);
  const [notifBusy, setNotifBusy] = useState(false);

  // Keep the "scheduled" counter in sync with what the OS actually queued.
  useEffect(() => {
    if (Platform.OS === "web") return;
    scheduledCount()
      .then(setScheduled)
      .catch(() => {});
  }, [reminders.length]);

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(t("notifications.title"), t("notifications.denied"));
        return;
      }
    }
    setNotificationsEnabled(value);
    Haptics.selectionAsync().catch(() => {});
  };

  const testNotification = async () => {
    setNotifBusy(true);
    try {
      const ok = await sendTestNotification(
        t("notifications.testTitle"),
        t("notifications.testBody")
      );
      Alert.alert(
        t("notifications.title"),
        ok ? t("notifications.testSent") : t("notifications.testFailed")
      );
    } finally {
      setNotifBusy(false);
    }
  };

  const copySelected = async () => {
    if (!selectedLetter) return;
    await Clipboard.setStringAsync(selectedLetter.content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t("templates.copied"));
  };

  const pdfSelected = async () => {
    if (!selectedLetter) return;
    try {
      const title =
        locale === "pl"
          ? selectedLetter.titlePl || selectedLetter.title
          : locale === "ro"
            ? selectedLetter.titleRo || selectedLetter.title
            : selectedLetter.title;
      await exportLetterToPdf(title, selectedLetter.content, t("pdf.footer"));
    } catch {
      Alert.alert(t("common.error"), t("templates.pdfError"));
    }
  };

  const deleteSelected = () => {
    if (!selectedLetter) return;
    Alert.alert(t("common.delete"), selectedLetter.title, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          deleteLetter(selectedLetter.id);
          setSelectedLetter(null);
        },
      },
    ]);
  };

  useEffect(() => setDraft(profile), [profile]);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    updateProfile({ ...draft, onboarded: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t("profile.saved"));
  };

  const letterTitle = (l: SentLetter) =>
    locale === "pl" && l.titlePl ? l.titlePl : locale === "ro" && l.titleRo ? l.titleRo : l.title;

  const initials =
    (profile.fullName || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <View style={styles.container}>
      <Header title={t("profile.title")} />
      <Screen scroll>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{profile.fullName || "—"}</Text>
            <Text style={styles.sub}>{profile.jobTitle || profile.employerName || ""}</Text>
            {serviceLength ? (
              <Pill
                tone="brand"
                label={`${t("profile.service")}: ${serviceLength.years} ${t("profile.years")} ${serviceLength.months} ${t("profile.months")}`}
              />
            ) : null}
          </View>
        </View>

        <SectionTitle>{t("profile.language")}</SectionTitle>
        <View style={styles.segment}>
          {LOCALES.map((l) => {
            const active = l === locale;
            return (
              <Pressable
                key={l}
                onPress={() => setLocale(l)}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {localeLabels[l]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>{t("profile.appearance")}</SectionTitle>
        <View style={styles.segment}>
          {THEMES.map((mode) => {
            const active = mode === theme;
            return (
              <Pressable
                key={mode}
                onPress={() => setTheme(mode)}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {t(`theme.${mode}` as TranslationKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle>{t("notifications.title")}</SectionTitle>
        <Card style={styles.notifCard}>
          <View style={styles.notifRow}>
            <View style={styles.notifTextWrap}>
              <Text style={styles.notifTitle}>{t("notifications.enable")}</Text>
              <Text style={styles.notifHint}>{t("notifications.enableHint")}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.borderStrong, true: colors.brand }}
              thumbColor={colors.surface}
              accessibilityLabel={t("notifications.enable")}
            />
          </View>

          {Platform.OS === "web" ? (
            <Text style={styles.notifHint}>{t("notifications.webUnavailable")}</Text>
          ) : (
            <>
              <Text style={styles.notifHint}>
                {t("notifications.scheduled").replace("{count}", String(scheduled))}
              </Text>
              <Button
                label={t("notifications.test")}
                onPress={testNotification}
                variant="secondary"
                icon="notifications-outline"
                loading={notifBusy}
                disabled={!notificationsEnabled}
              />
            </>
          )}
        </Card>

        <SectionTitle>{t("profile.personal")}</SectionTitle>
        <Field label={t("profile.fullName")} value={draft.fullName} onChangeText={(v) => set("fullName", v)} />
        <Field
          label={t("profile.email")}
          value={draft.email}
          onChangeText={(v) => set("email", v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Field label={t("profile.phone")} value={draft.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
        <Field label={t("profile.homeAddress")} value={draft.homeAddress} onChangeText={(v) => set("homeAddress", v)} />

        <SectionTitle>{t("profile.employment")}</SectionTitle>
        <Field label={t("profile.employerName")} value={draft.employerName} onChangeText={(v) => set("employerName", v)} />
        <Field label={t("profile.companyNumber")} value={draft.companyNumber} onChangeText={(v) => set("companyNumber", v)} />
        <Field label={t("profile.employerAddress")} value={draft.employerAddress} onChangeText={(v) => set("employerAddress", v)} />
        <Field label={t("profile.jobTitle")} value={draft.jobTitle} onChangeText={(v) => set("jobTitle", v)} />
        <Field
          label={t("profile.startDate")}
          value={draft.startDate}
          onChangeText={(v) => set("startDate", v)}
          placeholder="2024-03-15"
        />
        <Field
          label={t("profile.hourlyRate")}
          value={draft.hourlyRate ? String(draft.hourlyRate) : ""}
          onChangeText={(v) => set("hourlyRate", Number(v.replace(",", ".")) || 0)}
          keyboardType="decimal-pad"
        />
        <Field
          label={t("profile.hoursPerWeek")}
          value={draft.hoursPerWeek ? String(draft.hoursPerWeek) : ""}
          onChangeText={(v) => set("hoursPerWeek", Number(v) || 0)}
          keyboardType="number-pad"
        />

        <Text style={styles.label}>{t("profile.contractType")}</Text>
        <View style={styles.contractWrap}>
          {CONTRACTS.map((c) => {
            const active = draft.contractType === c;
            return (
              <Pressable
                key={c}
                onPress={() => set("contractType", c)}
                style={[styles.contractChip, active && styles.contractChipActive]}
              >
                <Text style={[styles.contractText, active && styles.contractTextActive]}>
                  {t(`contract.${c}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button label={t("profile.save")} onPress={save} icon="checkmark" fullWidth />

        <SectionTitle>{t("profile.sentLetters")}</SectionTitle>
        {letters.length === 0 ? (
          <Text style={styles.empty}>{t("profile.noLetters")}</Text>
        ) : (
          <View style={styles.lettersList}>
            {letters.map((l) => (
              <Card key={l.id} style={styles.letterCard} onPress={() => setSelectedLetter(l)}>
                <View style={styles.letterRow}>
                  <View style={styles.flex}>
                    <Text style={styles.letterTitle} numberOfLines={2}>
                      {letterTitle(l)}
                    </Text>
                    <Text style={styles.letterMeta}>
                      {l.recipient} · {formatDate(locale, l.date)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </View>
              </Card>
            ))}
          </View>
        )}

        <SectionTitle>{t("profile.about")}</SectionTitle>
        <Card style={styles.aboutCard}>
          <Text style={styles.aboutLine}>
            {t("profile.backend")}: {backendUrl}
          </Text>
          <Pill
            label={online ? t("common.online") : t("common.offline")}
            tone={online ? "success" : "warning"}
          />
        </Card>
      </Screen>

      <Modal
        visible={!!selectedLetter}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedLetter(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle} numberOfLines={2}>
              {selectedLetter ? letterTitle(selectedLetter) : ""}
            </Text>
            <Text style={styles.letterMeta}>
              {selectedLetter ? `${selectedLetter.recipient} · ${formatDate(locale, selectedLetter.date)}` : ""}
            </Text>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalLetterText} selectable>
                {selectedLetter?.content ?? ""}
              </Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button label={t("profile.copyLetter")} onPress={copySelected} icon="copy-outline" variant="secondary" />
              <Button label={t("profile.exportPdf")} onPress={pdfSelected} icon="download-outline" variant="secondary" />
              <Button label={t("common.delete")} onPress={deleteSelected} icon="trash-outline" variant="danger" />
            </View>
            <Button label={t("common.close")} onPress={() => setSelectedLetter(null)} variant="ghost" fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = createThemedStyles(() => ({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  hero: { flexDirection: "row", alignItems: "center", gap: spacing.lg, paddingTop: spacing.xl },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...typography.title, color: colors.onBrand },
  heroText: { flex: 1, gap: 4 },
  name: { ...typography.heading, color: colors.onSurface },
  sub: { ...typography.base, color: colors.muted },

  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceTertiary,
    borderRadius: radius.md,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md - 2,
  },
  segmentItemActive: { backgroundColor: colors.surfaceSecondary },
  segmentText: { ...typography.base, color: colors.muted, fontWeight: "600" },
  segmentTextActive: { color: colors.brand },

  label: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  contractWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  contractChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  contractChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  contractText: { ...typography.sm, color: colors.muted, fontWeight: "600" },
  contractTextActive: { color: colors.onBrand },

  empty: { ...typography.base, color: colors.muted },
  lettersList: { gap: spacing.sm },
  letterCard: { padding: spacing.md },
  letterRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  letterTitle: { ...typography.base, color: colors.onSurface, fontWeight: "700" },
  letterMeta: { ...typography.sm, color: colors.muted, fontWeight: "400", marginTop: 2 },
  deleteText: { ...typography.sm, color: colors.onErrorSoft, fontWeight: "700" },

  notifCard: { gap: spacing.md },
  notifRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  notifTextWrap: { flex: 1, gap: 2 },
  notifTitle: { ...typography.base, color: colors.onSurface, fontWeight: "700" },
  notifHint: { ...typography.sm, color: colors.muted, fontWeight: "400", lineHeight: 18 },

  aboutCard: { gap: spacing.sm },
  aboutLine: { ...typography.sm, color: colors.muted, fontWeight: "400" },

  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing["2xl"],
    maxHeight: "92%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.heading, color: colors.onSurface, marginBottom: spacing.md },
  modalScroll: { maxHeight: 360 },
  modalScrollContent: { paddingVertical: spacing.sm },
  modalLetterText: { ...typography.base, color: colors.onSurface, lineHeight: 21 },
  modalActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginVertical: spacing.md },
}));
