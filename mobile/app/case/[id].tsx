import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import {
  Button,
  Card,
  EmptyState,
  Header,
  Pill,
  Screen,
  SectionTitle,
} from "../../src/components/ui";
import { useApp } from "../../src/store/AppContext";
import { colors, radius, spacing, typography } from "../../src/theme/tokens";

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, cases, updateCase, deleteCase, addCaseNote } = useApp();
  const [note, setNote] = useState("");

  const item = cases.find((c) => c.id === id);

  if (!item) {
    return (
      <View style={styles.container}>
        <Header title={t("cases.title")} onBack={() => router.back()} />
        <EmptyState
          icon="alert-circle-outline"
          title={t("common.error")}
          description={t("cases.empty")}
          actionLabel={t("common.close")}
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const submitNote = () => {
    if (!note.trim()) return;
    addCaseNote(item.id, note);
    setNote("");
  };

  const askElon = () => {
    const prompt = `${item.title}. ${item.description} (Pracodawca: ${
      item.employer || "nieznany"
    }, branża: ${item.sector}). Co mogę zrobić zgodnie z prawem UK?`;
    router.push({ pathname: "/(tabs)", params: { prompt } });
  };

  return (
    <View style={styles.container}>
      <Header
        title={t("cases.title")}
        onBack={() => router.back()}
        right={
          <View style={styles.headerActions}>
            <Ionicons
              name={item.status === "open" ? "checkmark-circle-outline" : "refresh-outline"}
              size={22}
              color={colors.brand}
              onPress={() =>
                updateCase(item.id, { status: item.status === "open" ? "resolved" : "open" })
              }
            />
            <Ionicons
              name="trash-outline"
              size={20}
              color={colors.muted}
              onPress={() =>
                Alert.alert(t("common.delete"), item.title, [
                  { text: t("common.cancel"), style: "cancel" },
                  {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: () => {
                      deleteCase(item.id);
                      router.back();
                    },
                  },
                ])
              }
            />
          </View>
        }
      />

      <Screen scroll>
        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.pillsRow}>
          <Pill
            label={item.status === "open" ? t("cases.open") : t("cases.resolved")}
            tone={item.status === "open" ? "warning" : "success"}
          />
          <Pill label={item.sector} tone="neutral" />
          <Pill label={t(`cases.priority.${item.priority}`)} tone="brand" />
        </View>

        <Card style={styles.descriptionCard}>
          <Text style={styles.description}>{item.description}</Text>
          {item.employer ? (
            <Text style={styles.meta}>
              {t("cases.form.employer")}: {item.employer}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {new Date(item.createdAt).toLocaleDateString()} · {item.notes.length}{" "}
            {t("cases.notes").toLowerCase()}
          </Text>
        </Card>

        <View style={styles.ctaRow}>
          <Button
            label={t("cases.askElon")}
            onPress={askElon}
            icon="chatbubbles-outline"
            fullWidth
          />
        </View>

        <SectionTitle>{t("cases.notes")}</SectionTitle>

        <View style={styles.noteInputWrap}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t("cases.notePlaceholder")}
            placeholderTextColor="#9AA9B4"
            style={styles.noteInput}
            multiline
          />
          <Button
            label={t("cases.addNote")}
            onPress={submitNote}
            disabled={!note.trim()}
            icon="add"
          />
        </View>

        {item.notes.length === 0 ? (
          <Text style={styles.noNotes}>{t("cases.notes")}: 0</Text>
        ) : (
          <View style={styles.notesList}>
            {item.notes.map((n) => (
              <View key={n.id} style={styles.noteRow}>
                <View style={styles.timelineDot} />
                <View style={styles.noteBody}>
                  <Text style={styles.noteText}>{n.text}</Text>
                  <Text style={styles.noteDate}>
                    {new Date(n.date).toLocaleString([], {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  title: { ...typography.title, color: colors.onSurface, marginTop: spacing.lg },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  descriptionCard: { marginTop: spacing.lg, gap: spacing.sm },
  description: { ...typography.body, color: colors.onSurface, lineHeight: 23 },
  meta: { ...typography.sm, color: colors.muted, fontWeight: "400" },
  ctaRow: { marginTop: spacing.lg },

  noteInputWrap: { gap: spacing.sm, marginBottom: spacing.lg },
  noteInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    ...typography.base,
    color: colors.onSurface,
    textAlignVertical: "top",
  },
  noNotes: { ...typography.base, color: colors.muted },
  notesList: { gap: spacing.lg },
  noteRow: { flexDirection: "row", gap: spacing.md },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 6,
  },
  noteBody: { flex: 1 },
  noteText: { ...typography.base, color: colors.onSurface, lineHeight: 21 },
  noteDate: { ...typography.sm, color: colors.muted, marginTop: 2, fontWeight: "400" },
});
