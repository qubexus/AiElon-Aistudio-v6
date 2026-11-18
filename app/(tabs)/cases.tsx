import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Button, Card, EmptyState, Field, Header, Pill, Screen } from "../../src/components/ui";
import { useApp } from "../../src/store/AppContext";
import { colors, HIT_SLOP, radius, spacing, typography } from "../../src/theme/tokens";
import type { WorkplaceCase } from "../../src/types";

type Filter = "all" | "open" | "resolved";

const SECTORS = ["Warehouse", "Healthcare / NHS", "Construction", "Hospitality", "Agency", "Other"];

export default function CasesScreen() {
  const { t, cases, addCase } = useApp();
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employer, setEmployer] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!q) return true;
      return `${c.title} ${c.description} ${c.employer} ${c.sector}`.toLowerCase().includes(q);
    });
  }, [cases, filter, query]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEmployer("");
    setSector(SECTORS[0]);
    setErrors({});
  };

  const submit = () => {
    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = t("common.required");
    if (!description.trim()) nextErrors.description = t("common.required");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    addCase({ title, description, employer, sector });
    setModalOpen(false);
    resetForm();
  };

  const renderCase = (item: WorkplaceCase) => (
    <Card key={item.id} onPress={() => router.push(`/case/${item.id}`)} style={styles.caseCard}>
      <View style={styles.caseHeader}>
        <Text style={styles.caseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>

      <Text style={styles.caseDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.pillsRow}>
        <Pill
          label={item.status === "open" ? t("cases.open") : t("cases.resolved")}
          tone={item.status === "open" ? "warning" : "success"}
          icon={item.status === "open" ? "time-outline" : "checkmark-circle-outline"}
        />
        <Pill label={item.sector} tone="neutral" />
        {item.notes.length > 0 ? (
          <Pill label={`${item.notes.length} ${t("cases.notes").toLowerCase()}`} tone="brand" />
        ) : null}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title={t("cases.title")}
        right={
          <Pressable
            onPress={() => setModalOpen(true)}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={t("cases.new")}
            style={styles.addButton}
          >
            <Ionicons name="add" size={22} color={colors.onBrand} />
          </Pressable>
        }
      />

      <Screen scroll>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("cases.search")}
            placeholderTextColor="#9AA9B4"
            style={styles.searchInput}
            autoCorrect={false}
            accessibilityLabel={t("cases.search")}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={HIT_SLOP} accessibilityLabel={t("common.close")}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filters}>
          {(["all", "open", "resolved"] as Filter[]).map((key) => {
            const active = filter === key;
            const label =
              key === "all"
                ? t("templates.all")
                : key === "open"
                  ? t("cases.open")
                  : t("cases.resolved");
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
                accessibilityRole="button"
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title={t("cases.empty")}
            actionLabel={t("cases.new")}
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <View style={styles.list}>{visible.map(renderCase)}</View>
        )}
      </Screen>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t("cases.new")}</Text>

            <Screen scroll padded={false}>
              <Field
                label={t("cases.form.title")}
                value={title}
                onChangeText={setTitle}
                placeholder="Np. Brak wypłaty nadgodzin w marcu"
                error={errors.title}
              />
              <Field
                label={t("cases.form.description")}
                value={description}
                onChangeText={setDescription}
                placeholder={t("cases.form.description")}
                multiline
                numberOfLines={4}
                style={styles.textarea}
                error={errors.description}
              />
              <Field
                label={t("cases.form.employer")}
                value={employer}
                onChangeText={setEmployer}
                placeholder="Np. Amazon LCY2"
              />

              <Text style={styles.fieldLabel}>{t("cases.form.sector")}</Text>
              <View style={styles.sectorWrap}>
                {SECTORS.map((item) => {
                  const active = sector === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => setSector(item)}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <Button
                  label={t("cases.form.cancel")}
                  onPress={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  variant="secondary"
                />
                <Button label={t("cases.form.create")} onPress={submit} icon="checkmark" />
              </View>
            </Screen>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  searchInput: { flex: 1, ...typography.base, color: colors.onSurface, paddingVertical: 10 },
  filters: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    minHeight: 36,
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { ...typography.sm, color: colors.muted, fontWeight: "600" },
  filterTextActive: { color: colors.onBrand },

  list: { gap: spacing.md },
  caseCard: { gap: spacing.sm },
  caseHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  caseTitle: { ...typography.body, fontWeight: "700", color: colors.onSurface, flex: 1 },
  caseDescription: { ...typography.base, color: colors.muted, lineHeight: 20 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },

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
  modalTitle: { ...typography.heading, color: colors.onSurface, marginBottom: spacing.lg },
  textarea: { minHeight: 100, textAlignVertical: "top" },
  fieldLabel: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  sectorWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.md },
});
