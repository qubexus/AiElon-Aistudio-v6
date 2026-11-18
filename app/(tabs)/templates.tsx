import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Card, EmptyState, Header, Pill, Screen } from "../../src/components/ui";
import { defaultTemplates } from "../../src/data/legalTemplates";
import { useApp } from "../../src/store/AppContext";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";
import type { LegalTemplate, Locale } from "../../src/types";
import type { TranslationKey } from "../../src/i18n/translations";

export function pickLocalized(template: LegalTemplate, locale: Locale) {
  if (locale === "pl") return { title: template.titlePl, description: template.descriptionPl };
  if (locale === "ro") return { title: template.titleRo, description: template.descriptionRo };
  return { title: template.titleEn, description: template.descriptionEn };
}

export default function TemplatesScreen() {
  const { t, locale } = useApp();
  const router = useRouter();
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(defaultTemplates.map((tpl) => tpl.category)))],
    []
  );

  const visible = useMemo(
    () =>
      category === "all" ? defaultTemplates : defaultTemplates.filter((tpl) => tpl.category === category),
    [category]
  );

  return (
    <View style={styles.container}>
      <Header title={t("templates.title")} subtitle={t("templates.subtitle")} />

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("templates.search")}
          placeholderTextColor="#9AA9B4"
          style={styles.searchInput}
          autoCorrect={false}
          accessibilityLabel={t("templates.search")}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityLabel={t("common.close")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {categories.map((cat) => {
          const active = cat === category;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat === "all" ? t("templates.all") : t(`templates.cat.${cat}` as TranslationKey)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Screen scroll>
        {visible.length === 0 ? (
          <EmptyState icon="document-text-outline" title={t("templates.empty")} />
        ) : (
          <View style={styles.list}>
            {visible.map((tpl) => {
              const text = pickLocalized(tpl, locale);
              return (
                <Card key={tpl.id} onPress={() => router.push(`/template/${tpl.id}`)} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="document-text" size={20} color={colors.brand} />
                    </View>
                    <Text style={styles.cardTitle}>{text.title}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </View>
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {text.description}
                  </Text>
                  <View style={styles.pillRow}>
                    <Pill label={t(`templates.cat.${tpl.category}` as TranslationKey)} tone="brand" />
                  </View>
                  <Text style={styles.statute} numberOfLines={2}>
                    {tpl.statutoryReference}
                  </Text>
                </Card>
              );
            })}
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  searchInput: { flex: 1, ...typography.base, color: colors.onSurface, paddingVertical: 10 },
  chipScroll: { flexGrow: 0 },
  chipRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { ...typography.sm, color: colors.muted, fontWeight: "600" },
  chipTextActive: { color: colors.onBrand },

  list: { gap: spacing.md, paddingTop: spacing.xs },
  card: { gap: spacing.sm },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: "#E8F1EC",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { ...typography.body, fontWeight: "700", color: colors.onSurface, flex: 1 },
  cardDescription: { ...typography.base, color: colors.muted, lineHeight: 20 },
  pillRow: { flexDirection: "row", gap: spacing.sm },
  statute: { ...typography.sm, color: colors.muted, fontWeight: "400" },
});
