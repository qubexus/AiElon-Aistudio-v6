import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, Share, StyleSheet, Text, View } from "react-native";
import { analyzeLetterSentiment } from "../../src/api/client";
import { Button, Card, EmptyState, Field, Header, Pill, Screen, SectionTitle } from "../../src/components/ui";
import { defaultTemplates, renderTemplateLetter } from "../../src/data/legalTemplates";
import { newId, useApp } from "../../src/store/AppContext";
import { exportLetterToPdf } from "../../src/utils/pdf";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";
import type { LetterSentimentResult, SentLetterCategoryTag } from "../../src/types";

const labelFor = (locale: string, f: { labelEn: string; labelPl: string; labelRo: string }) =>
  locale === "pl" ? f.labelPl : locale === "ro" ? f.labelRo : f.labelEn;

export default function TemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, locale, profile, addLetter } = useApp();

  const template = defaultTemplates.find((tpl) => tpl.id === id);

  // Pre-fill from the saved profile instead of the template's demo defaults.
  const initial = useMemo(() => {
    const out: Record<string, string> = {};
    if (!template) return out;
    for (const f of template.fields) {
      const fromProfile: Record<string, string> = {
        employee_name: profile.fullName,
        job_title: profile.jobTitle,
        employer_name: profile.employerName,
        employee_address: profile.homeAddress,
        employee_phone: profile.phone,
        employee_email: profile.email,
        employer_address: profile.employerAddress,
      };
      out[f.key] = fromProfile[f.key] ?? "";
    }
    return out;
  }, [template, profile]);

  const [values, setValues] = useState<Record<string, string>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [letter, setLetter] = useState<string | null>(null);
  const [tone, setTone] = useState<LetterSentimentResult | null>(null);
  const [checking, setChecking] = useState(false);

  if (!template) {
    return (
      <View style={styles.container}>
        <Header title={t("templates.title")} onBack={() => router.back()} showLogo={false} />
        <EmptyState icon="alert-circle-outline" title={t("common.error")} />
      </View>
    );
  }

  const title = locale === "pl" ? template.titlePl : locale === "ro" ? template.titleRo : template.titleEn;

  const generate = () => {
    // Every field must be filled by the user: never let demo defaults leak into a legal letter.
    const nextErrors: Record<string, string> = {};
    for (const f of template.fields) {
      if (!(values[f.key] ?? "").trim()) nextErrors[f.key] = t("common.required");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const rendered = renderTemplateLetter(template, values, {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      homeAddress: profile.homeAddress,
      employerName: profile.employerName,
      companyNumber: profile.companyNumber,
      employerAddress: profile.employerAddress,
      jobTitle: profile.jobTitle,
      startDate: profile.startDate,
      hourlyRate: profile.hourlyRate || undefined,
      accountId: profile.accountId,
    });
    setLetter(rendered);
    setTone(null);
  };

  const copy = async () => {
    if (!letter) return;
    await Clipboard.setStringAsync(letter);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t("templates.copied"));
  };

  const share = async () => {
    if (letter) await Share.share({ message: letter, title });
  };

  const exportPdf = async () => {
    if (!letter) return;
    try {
      await exportLetterToPdf(title, letter);
    } catch {
      Alert.alert(t("common.error"), t("templates.pdfError"));
    }
  };

  const save = () => {
    if (!letter) return;
    addLetter({
      id: newId("letter"),
      templateId: template.id,
      title: template.titleEn,
      titlePl: template.titlePl,
      recipient: values.employer_name || profile.employerName,
      date: new Date().toISOString(),
      content: letter,
      primaryTag: template.category as SentLetterCategoryTag,
      statutoryReference: template.statutoryReference,
    });
    Alert.alert(t("templates.saved"));
  };

  const checkTone = async () => {
    if (!letter) return;
    setChecking(true);
    try {
      setTone(await analyzeLetterSentiment(letter, locale));
    } catch (err) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : "");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={letter ? t("templates.step2") : t("templates.step1")}
        subtitle={title}
        onBack={() => (letter ? setLetter(null) : router.back())}
        showLogo={false}
      />

      <Screen scroll>
        {!letter ? (
          <View style={styles.formWrap}>
            {template.fields.map((f) => (
              <Field
                key={f.key}
                label={labelFor(locale, f)}
                value={values[f.key] ?? ""}
                onChangeText={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                placeholder={f.placeholder}
                error={errors[f.key]}
                multiline={f.key.includes("description") || f.key.includes("details")}
              />
            ))}
            <Button label={t("templates.generate")} onPress={generate} icon="sparkles-outline" fullWidth />
          </View>
        ) : (
          <View style={styles.previewWrap}>
            <Card style={styles.paper}>
              <Text style={styles.letterText} selectable>
                {letter}
              </Text>
            </Card>

            <View style={styles.actions}>
              <Button label={t("templates.copy")} onPress={copy} icon="copy-outline" />
              <Button label={t("templates.share")} onPress={share} icon="share-outline" variant="secondary" />
              <Button label={t("templates.save")} onPress={save} icon="bookmark-outline" variant="secondary" />
            </View>

            <SectionTitle>{t("templates.checkTone")}</SectionTitle>
            <Button
              label={checking ? t("templates.toneChecking") : t("templates.checkTone")}
              onPress={checkTone}
              loading={checking}
              variant="secondary"
              icon="pulse-outline"
              fullWidth
            />

            {tone ? (
              <Card style={styles.toneCard}>
                <Pill
                  label={`${tone.overallStatus} · ${tone.toneScore}/100`}
                  tone={
                    tone.overallStatus === "professional"
                      ? "success"
                      : tone.overallStatus === "cautionary"
                        ? "warning"
                        : "error"
                  }
                />
                <Text style={styles.toneSummary}>{tone.summary}</Text>
                {tone.flaggedItems.map((item, idx) => (
                  <View key={`${item.originalText}-${idx}`} style={styles.flag}>
                    <Text style={styles.flagOriginal}>“{item.originalText}”</Text>
                    <Text style={styles.flagReason}>{item.reason}</Text>
                    <Text style={styles.flagFix}>→ {item.suggestedReplacement}</Text>
                  </View>
                ))}
              </Card>
            ) : null}

            <Button label={t("templates.back")} onPress={() => setLetter(null)} variant="ghost" />
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  formWrap: { paddingTop: spacing.lg },
  previewWrap: { paddingTop: spacing.lg, gap: spacing.md },
  paper: { backgroundColor: "#FFFFFF", padding: spacing.lg },
  letterText: { ...typography.base, color: colors.onSurface, lineHeight: 21, fontFamily: undefined },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  toneCard: { gap: spacing.sm, marginTop: spacing.sm },
  toneSummary: { ...typography.base, color: colors.onSurface, lineHeight: 20 },
  flag: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: 2,
  },
  flagOriginal: { ...typography.base, color: "#B91C1C", fontWeight: "600" },
  flagReason: { ...typography.sm, color: colors.muted, fontWeight: "400" },
  flagFix: { ...typography.base, color: colors.brand, fontWeight: "600", borderRadius: radius.sm },
});
