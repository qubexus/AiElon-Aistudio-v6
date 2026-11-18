import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header } from "../src/components/ui";
import type { TranslationKey } from "../src/i18n/translations";
import { useApp } from "../src/store/AppContext";
import { colors, createThemedStyles, radius, spacing, typography } from "../src/theme/tokens";

const TERMS = [
  "acas",
  "tribunal",
  "era",
  "ssp",
  "holiday",
  "grievance",
  "payslip",
  "notice",
  "constructive",
  "whistle",
  "zero",
  "tupe",
] as const;

type Result = {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export default function SearchScreen() {
  const { t, cases, messages, letters } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();

  const results = useMemo<Result[]>(() => {
    if (needle.length < 2) return [];
    const hits: Result[] = [];

    cases.forEach((item) => {
      const haystack = [item.title, item.description, item.employer, ...item.notes.map((n) => n.text)]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(needle)) {
        hits.push({
          id: `case-${item.id}`,
          group: t("search.cases"),
          title: item.title,
          subtitle: item.employer || t("cases.unknownEmployer"),
          icon: "briefcase-outline",
          onPress: () => router.push(`/case/${item.id}`),
        });
      }
    });

    messages.forEach((item) => {
      if (item.text.toLowerCase().includes(needle)) {
        hits.push({
          id: `msg-${item.id}`,
          group: t("search.messages"),
          title: item.text.slice(0, 90),
          subtitle: item.role === "user" ? t("search.you") : t("chat.title"),
          icon: "chatbubble-outline",
          onPress: () => router.push("/chat"),
        });
      }
    });

    letters.forEach((item) => {
      const haystack = [item.title, item.recipient, item.content].join(" ").toLowerCase();
      if (haystack.includes(needle)) {
        hits.push({
          id: `letter-${item.id}`,
          group: t("search.letters"),
          title: item.title,
          subtitle: item.recipient,
          icon: "document-text-outline",
          onPress: () => router.push("/(tabs)/templates"),
        });
      }
    });

    TERMS.forEach((id) => {
      const title = t(`glossary.t.${id}` as TranslationKey);
      const body = t(`glossary.d.${id}` as TranslationKey);
      if (`${title} ${body}`.toLowerCase().includes(needle)) {
        hits.push({
          id: `term-${id}`,
          group: t("search.glossary"),
          title,
          subtitle: body.slice(0, 90),
          icon: "book-outline",
          onPress: () => router.push("/glossary"),
        });
      }
    });

    return hits.slice(0, 40);
  }, [cases, letters, messages, needle, router, t]);

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    results.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [results]);

  return (
    <View style={styles.root}>
      <Header title={t("search.title")} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchShell}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("search.placeholder")}
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
            accessibilityLabel={t("search.placeholder")}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.muted}
              onPress={() => setQuery("")}
              accessibilityLabel={t("common.cancel")}
            />
          ) : null}
        </View>

        {needle.length < 2 ? (
          <Text style={styles.hint}>{t("search.hint")}</Text>
        ) : results.length === 0 ? (
          <Text style={styles.hint}>{t("search.empty")}</Text>
        ) : (
          grouped.map(([group, items]) => (
            <View key={group} style={styles.group}>
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={styles.groupCard}>
                {items.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={item.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && styles.rowBorder,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <Ionicons name={item.icon} size={18} color={colors.brand} />
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.rowSubtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = createThemedStyles(() => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.onSurface, paddingVertical: 0 },
  hint: { ...typography.base, color: colors.muted },
  group: { gap: spacing.sm },
  groupTitle: {
    ...typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
    color: colors.muted,
  },
  groupCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowPressed: { opacity: 0.7 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.base, fontWeight: "600", color: colors.onSurface },
  rowSubtitle: { ...typography.sm, color: colors.muted },
}));
