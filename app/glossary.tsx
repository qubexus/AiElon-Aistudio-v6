import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
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

type Term = (typeof TERMS)[number];

export default function GlossaryScreen() {
  const { t } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TERMS.map((id) => ({
      id,
      title: t(`glossary.t.${id}` as TranslationKey),
      body: t(`glossary.d.${id}` as TranslationKey),
    })).filter(
      (item) =>
        !needle ||
        item.title.toLowerCase().includes(needle) ||
        item.body.toLowerCase().includes(needle),
    );
  }, [query, t]);

  return (
    <View style={styles.root}>
      <Header title={t("glossary.title")} subtitle={t("glossary.subtitle")} onBack={() => router.back()} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing["2xl"] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.searchShell}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("glossary.search")}
              placeholderTextColor={colors.placeholder}
              style={styles.searchInput}
              accessibilityLabel={t("glossary.search")}
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
        }
        ListEmptyComponent={<Text style={styles.empty}>{t("glossary.empty")}</Text>}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.term}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = createThemedStyles(() => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.onSurface, paddingVertical: 0 },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  term: { ...typography.body, fontWeight: "700", color: colors.onSurface },
  body: { ...typography.base, color: colors.muted, lineHeight: 21 },
  empty: { ...typography.base, color: colors.muted, paddingVertical: spacing.xl },
}));
