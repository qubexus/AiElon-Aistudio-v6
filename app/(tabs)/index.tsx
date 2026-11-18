import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RobotWatermark, Wordmark } from "../../src/components/ui";
import { formatDate } from "../../src/i18n/translations";
import { useApp } from "../../src/store/AppContext";
import {
  colors,
  createThemedStyles,
  fontFamily,
  radius,
  spacing,
  typography,
} from "../../src/theme/tokens";

type ActionId = "newCase" | "glossary" | "search";

export default function HomeScreen() {
  const { t, locale, cases } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const recent = useMemo(
    () => [...cases].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 3),
    [cases],
  );

  const actions: {
    id: ActionId;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    desc: string;
  }[] = [
    {
      id: "newCase",
      icon: "add-circle-outline",
      label: t("chat.menu.newCase"),
      desc: t("chat.menu.newCaseDesc"),
    },
    {
      id: "glossary",
      icon: "book-outline",
      label: t("chat.menu.glossary"),
      desc: t("chat.menu.glossaryDesc"),
    },
    {
      id: "search",
      icon: "search-outline",
      label: t("chat.menu.search"),
      desc: t("chat.menu.searchDesc"),
    },
  ];

  const run = (id: ActionId) => {
    if (id === "newCase") router.push({ pathname: "/(tabs)/cases", params: { new: "1" } });
    else if (id === "glossary") router.push("/glossary");
    else router.push("/search");
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: spacing["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Image
              source={require("../../assets/logo-mark.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Wordmark size={22} />
        </View>

        <Pressable
          onPress={() => router.push("/chat")}
          accessibilityRole="button"
          accessibilityLabel={t("home.openChat")}
          style={({ pressed }) => [styles.hero, pressed && styles.heroPressed]}
        >
          <RobotWatermark />
          <View style={styles.heroBadge}>
            <View style={styles.heroDot} />
            <Text style={styles.heroBadgeText}>{t("chat.title")}</Text>
          </View>
          <Text style={styles.heroTitle}>{t("home.heroTitle")}</Text>
          <Text style={styles.heroBody}>{t("home.heroBody")}</Text>
          <View style={styles.heroCta}>
            <Text style={styles.heroCtaText}>{t("home.openChat")}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>{t("home.quickActions")}</Text>
        <View style={styles.actionList}>
          {actions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => run(action.id)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={20} color={colors.brand} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc} numberOfLines={1}>
                  {action.desc}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t("home.recent")}</Text>
          {cases.length > 0 ? (
            <Pressable
              onPress={() => router.push("/(tabs)/cases")}
              accessibilityRole="button"
              accessibilityLabel={t("home.viewAll")}
              hitSlop={8}
            >
              <Text style={styles.link}>{t("home.viewAll")}</Text>
            </Pressable>
          ) : null}
        </View>

        {recent.length === 0 ? (
          <Text style={styles.empty}>{t("home.noCases")}</Text>
        ) : (
          <View style={styles.caseList}>
            {recent.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/case/${item.id}`)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                style={({ pressed }) => [styles.caseRow, pressed && styles.rowPressed]}
              >
                <View
                  style={[
                    styles.caseAccent,
                    { backgroundColor: item.status === "open" ? colors.brand : colors.success },
                  ]}
                />
                <View style={styles.caseBody}>
                  <Text style={styles.caseTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.caseMeta} numberOfLines={1}>
                    {item.employer || t("cases.unknownEmployer")} ·{" "}
                    {formatDate(locale, item.updatedAt)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.casePill,
                    {
                      backgroundColor:
                        item.status === "open" ? colors.brandSoft : colors.successSoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.casePillText,
                      {
                        color:
                          item.status === "open" ? colors.onBrandSoft : colors.onSuccessSoft,
                      },
                    ]}
                  >
                    {item.status === "open" ? t("cases.open") : t("cases.resolved")}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.shortcutRow}>
          <Pressable
            onPress={() => router.push("/(tabs)/templates")}
            accessibilityRole="button"
            accessibilityLabel={t("home.templates")}
            style={({ pressed }) => [styles.shortcut, pressed && styles.rowPressed]}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.brand} />
            <Text style={styles.shortcutTitle}>{t("home.templates")}</Text>
            <Text style={styles.shortcutDesc} numberOfLines={2}>
              {t("home.templatesDesc")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityRole="button"
            accessibilityLabel={t("home.profile")}
            style={({ pressed }) => [styles.shortcut, pressed && styles.rowPressed]}
          >
            <Ionicons name="person-outline" size={20} color={colors.brand} />
            <Text style={styles.shortcutTitle}>{t("home.profile")}</Text>
            <Text style={styles.shortcutDesc} numberOfLines={2}>
              {t("home.profileDesc")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = createThemedStyles(() => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.logoBadge,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.logoBadgeBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 24, height: 24 },

  hero: {
    overflow: "hidden",
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroPressed: { opacity: 0.94 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brand },
  heroBadgeText: { ...typography.sm, fontWeight: "700", color: colors.onBrandSoft },
  heroTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  heroBody: { ...typography.body, color: colors.muted, lineHeight: 23, maxWidth: 420 },
  heroCta: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  heroCtaText: { ...typography.body, fontWeight: "700", color: colors.onAccent },

  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: {
    ...typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: colors.muted,
    fontWeight: "700",
  },
  link: { ...typography.sm, fontWeight: "700", color: colors.brand },

  actionList: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  actionRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rowPressed: { opacity: 0.7 },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, gap: 2 },
  actionLabel: { ...typography.body, fontWeight: "600", color: colors.onSurface },
  actionDesc: { ...typography.sm, color: colors.muted },

  empty: { ...typography.base, color: colors.muted },
  caseList: { gap: spacing.sm },
  caseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 64,
    paddingRight: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  caseAccent: { width: 3, alignSelf: "stretch" },
  caseBody: { flex: 1, gap: 3, paddingVertical: spacing.md },
  caseTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.onSurface },
  caseMeta: { ...typography.sm, color: colors.muted },
  casePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  casePillText: { ...typography.sm, fontWeight: "700" },

  shortcutRow: { flexDirection: "row", gap: spacing.md },
  shortcut: {
    flex: 1,
    gap: 4,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutTitle: {
    ...typography.base,
    fontWeight: "700",
    color: colors.onSurface,
    marginTop: 2,
  },
  shortcutDesc: { ...typography.sm, color: colors.muted },
}));
