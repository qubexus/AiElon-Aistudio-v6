import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../store/AppContext";
import { colors, HIT_SLOP, MIN_TOUCH, radius, spacing, typography } from "../theme/tokens";

/* ---------------------------------- Screen --------------------------------- */

export const Screen: React.FC<{
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}> = ({ children, scroll, padded = true, style }) => {
  const contentStyle = [
    padded && { paddingHorizontal: spacing.lg },
    { paddingBottom: spacing["2xl"] },
    style,
  ];

  if (scroll) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={contentStyle}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.flex, contentStyle]}>{children}</View>;
};

/* ---------------------------------- Header --------------------------------- */

export const Header: React.FC<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Brand mark in the top bar. Hidden on nested screens that need the space. */
  showLogo?: boolean;
}> = ({ title, subtitle, onBack, right, showLogo = true }) => {
  const insets = useSafeAreaInsets();
  const { t } = useApp();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={HIT_SLOP}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
          >
            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
          </Pressable>
        ) : null}
        {showLogo ? (
          <View style={styles.logoBadge} accessibilityRole="image" accessibilityLabel="Ask Elon">
            <Image
              source={require("../../assets/logo-mark.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        ) : null}
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.headerRight}>{right}</View> : null}
      </View>
    </View>
  );
};

/* ----------------------------------- Card ---------------------------------- */

export const Card: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}> = ({ children, onPress, style }) => {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

/* ----------------------------------- Pill ---------------------------------- */

type PillTone = "brand" | "success" | "warning" | "error" | "neutral";

const pillTones: Record<PillTone, { bg: string; fg: string }> = {
  brand: { bg: "#E8F1EC", fg: colors.brand },
  success: { bg: "#E7F7F1", fg: "#0B7A5A" },
  warning: { bg: "#FDF1E3", fg: "#A85C09" },
  error: { bg: "#FDECEC", fg: "#B91C1C" },
  neutral: { bg: colors.surfaceTertiary, fg: colors.muted },
};

export const Pill: React.FC<{
  label: string;
  tone?: PillTone;
  icon?: keyof typeof Ionicons.glyphMap;
}> = ({ label, tone = "neutral", icon }) => {
  const palette = pillTones[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      {icon ? (
        <Ionicons name={icon} size={12} color={palette.fg} style={{ marginRight: 4 }} />
      ) : null}
      <Text style={[styles.pillText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
};

/* ---------------------------------- Button --------------------------------- */

export const Button: React.FC<{
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}> = ({ label, onPress, variant = "primary", icon, disabled, loading, fullWidth }) => {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const bg = isPrimary ? colors.brand : isDanger ? "#FDECEC" : "transparent";
  const fg = isPrimary ? colors.onBrand : isDanger ? "#B91C1C" : colors.brand;
  const borderColor = variant === "secondary" ? colors.borderStrong : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || loading) }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "secondary" ? 1 : 0,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} />
          ) : null}
          <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

/* ---------------------------------- Field ---------------------------------- */

export const Field: React.FC<TextInputProps & { label: string; hint?: string; error?: string }> = ({
  label,
  hint,
  error,
  style,
  ...inputProps
}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      {...inputProps}
      style={[styles.input, error ? styles.inputError : null, style]}
      placeholderTextColor="#9AA9B4"
      accessibilityLabel={label}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    {!error && hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
  </View>
);

/* -------------------------------- EmptyState ------------------------------- */

export const EmptyState: React.FC<{
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon = "document-text-outline", title, description, actionLabel, onAction }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIconWrap}>
      <Ionicons name={icon} size={30} color={colors.brand} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {description ? <Text style={styles.emptyDescription}>{description}</Text> : null}
    {actionLabel && onAction ? (
      <View style={{ marginTop: spacing.lg }}>
        <Button label={actionLabel} onPress={onAction} variant="secondary" />
      </View>
    ) : null}
  </View>
);

/* ------------------------------- SectionTitle ------------------------------ */

export const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({
  children,
  right,
}) => (
  <View style={styles.sectionTitleRow}>
    <Text style={styles.sectionTitle}>{children}</Text>
    {right}
  </View>
);

export const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: {
    backgroundColor: colors.glass,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerRow: { flexDirection: "row", alignItems: "center", minHeight: MIN_TOUCH },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FFF4EA",
    borderWidth: 1,
    borderColor: "#F3DCC8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    shadowColor: "#355645",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  logoImage: { width: 30, height: 30 },
  headerTextWrap: { flex: 1 },
  headerTitle: { ...typography.heading, color: colors.onSurface },
  headerSubtitle: { ...typography.sm, color: colors.muted, marginTop: 2, fontWeight: "400" },
  headerRight: { marginLeft: spacing.sm },
  backButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing.md,
  },

  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardPressed: { opacity: 0.9 },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  pillText: { ...typography.sm, fontWeight: "600" },

  button: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: { ...typography.body, fontWeight: "600" },

  field: { marginBottom: spacing.lg },
  fieldLabel: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.onSurface,
  },
  inputError: { borderColor: colors.error },
  fieldHint: { ...typography.sm, color: colors.muted, marginTop: spacing.xs, fontWeight: "400" },
  fieldError: { ...typography.sm, color: colors.error, marginTop: spacing.xs },

  empty: { alignItems: "center", paddingVertical: spacing["3xl"], paddingHorizontal: spacing.lg },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: "#E8F1EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.heading, color: colors.onSurface, textAlign: "center" },
  emptyDescription: {
    ...typography.base,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg },
});
