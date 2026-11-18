import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useApp } from "../store/AppContext";
import { colors, createThemedStyles, radius, spacing, typography } from "../theme/tokens";
import { Sheet } from "./Sheet";

export type QuickActionId = "newCase" | "glossary" | "search";

const ACTIONS: Array<{
  id: QuickActionId;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: "chat.menu.newCase" | "chat.menu.glossary" | "chat.menu.search";
  descKey:
    | "chat.menu.newCaseDesc"
    | "chat.menu.glossaryDesc"
    | "chat.menu.searchDesc";
}> = [
  { id: "newCase", icon: "add-circle-outline", labelKey: "chat.menu.newCase", descKey: "chat.menu.newCaseDesc" },
  { id: "glossary", icon: "book-outline", labelKey: "chat.menu.glossary", descKey: "chat.menu.glossaryDesc" },
  { id: "search", icon: "search-outline", labelKey: "chat.menu.search", descKey: "chat.menu.searchDesc" },
];

/** One 52 px menu row: coloured icon, name and a secondary-colour description. */
export const QuickActionRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}> = ({ icon, label, description, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    accessibilityRole="button"
    accessibilityLabel={`${label}. ${description}`}
  >
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={20} color={colors.brand} />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.rowDescription} numberOfLines={1}>
        {description}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.muted} />
  </Pressable>
);

/**
 * Slide-out quick actions (Nowa sprawa / Słownik / Szukaj).
 * Bottom sheet on phones, 320 px side panel on screens >= 768 px.
 */
export const QuickActionsSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { t } = useApp();
  const router = useRouter();

  const run = useCallback(
    (id: QuickActionId) => {
      onClose();
      // Let the panel animate out before the next screen appears.
      setTimeout(() => {
        if (id === "newCase") router.push({ pathname: "/(tabs)/cases", params: { new: "1" } });
        else if (id === "glossary") router.push("/glossary");
        else router.push("/search");
      }, 190);
    },
    [onClose, router]
  );

  return (
    <Sheet visible={visible} onClose={onClose} maxHeight={0.5} responsiveSide title={t("chat.quickActions")}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {ACTIONS.map((action) => (
          <QuickActionRow
            key={action.id}
            icon={action.icon}
            label={t(action.labelKey)}
            description={t(action.descKey)}
            onPress={() => run(action.id)}
          />
        ))}
      </ScrollView>
    </Sheet>
  );
};

const styles = createThemedStyles(() => ({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: colors.surfaceTertiary },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { ...typography.body, color: colors.onSurface, fontWeight: "600" },
  rowDescription: { ...typography.sm, color: colors.muted, fontWeight: "400", marginTop: 1 },
}));
