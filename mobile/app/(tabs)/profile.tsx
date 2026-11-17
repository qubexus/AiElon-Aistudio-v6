import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, Card, Field, Header, Pill, Screen, SectionTitle } from "../../src/components/ui";
import { localeLabels } from "../../src/i18n/translations";
import { useApp } from "../../src/store/AppContext";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";
import type { ContractType, Locale, UserProfile } from "../../src/types";

const LOCALES: Locale[] = ["pl", "en", "ro"];
const CONTRACTS: ContractType[] = ["permanent", "zero_hours", "agency", "fixed_term"];

export default function ProfileScreen() {
  const { t, locale, setLocale, profile, updateProfile, serviceLength, letters, deleteLetter, backendUrl, online } =
    useApp();
  const [draft, setDraft] = useState<UserProfile>(profile);

  useEffect(() => setDraft(profile), [profile]);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    updateProfile({ ...draft, onboarded: true });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t("profile.saved"));
  };

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
              <Card key={l.id} style={styles.letterCard}>
                <View style={styles.letterRow}>
                  <View style={styles.flex}>
                    <Text style={styles.letterTitle} numberOfLines={2}>
                      {locale === "pl" && l.titlePl ? l.titlePl : l.title}
                    </Text>
                    <Text style={styles.letterMeta}>
                      {l.recipient} · {new Date(l.date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Pressable onPress={() => deleteLetter(l.id)} hitSlop={10}>
                    <Text style={styles.deleteText}>{t("common.delete")}</Text>
                  </Pressable>
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
          <Pill label={online ? "online" : "offline"} tone={online ? "success" : "warning"} />
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
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
  deleteText: { ...typography.sm, color: "#B91C1C", fontWeight: "700" },

  aboutCard: { gap: spacing.sm },
  aboutLine: { ...typography.sm, color: colors.muted, fontWeight: "400" },
});
