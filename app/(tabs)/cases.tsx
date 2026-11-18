import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sheet } from "../../src/components/Sheet";
import { Button, EmptyState, Field, Header, Pill, Screen } from "../../src/components/ui";
import { formatDate, type TranslationKey } from "../../src/i18n/translations";
import { newId, nowLabel, useApp } from "../../src/store/AppContext";
import {
  colors,
  createThemedStyles,
  fontFamily,
  HIT_SLOP,
  radius,
  spacing,
  typography,
} from "../../src/theme/tokens";
import type { CaseAttachment, WorkplaceCase } from "../../src/types";
import {
  captureFromUri,
  captureWithSystemCamera,
  isImage,
  pickDocuments,
  pickPhotos,
  toCaseAttachment,
  type PickedAttachment,
} from "../../src/utils/attachments";
import { setPhotoHandler } from "../../src/utils/cameraBus";

type Filter = "all" | "open" | "resolved";

const SECTORS = ["warehouse", "healthcare", "construction", "hospitality", "agency", "other"] as const;

const LEGACY_SECTORS: Record<string, string> = {
  Warehouse: "warehouse",
  "Healthcare / NHS": "healthcare",
  Construction: "construction",
  Hospitality: "hospitality",
  Agency: "agency",
  Other: "other",
};

const sectorLabel = (t: (key: TranslationKey) => string, sector: string) => {
  const key = LEGACY_SECTORS[sector] ?? sector;
  const translated = t(`cases.sectors.${key}` as TranslationKey);
  return translated === `cases.sectors.${key}` ? sector : translated;
};

const DAY = 86_400_000;

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

const daysUntil = (iso: string) => {
  const target = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((startOfDay(target) - startOfDay(new Date())) / DAY);
};

const daysSince = (iso: string) => {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 0;
  return Math.max(0, Math.round((startOfDay(new Date()) - startOfDay(then)) / DAY));
};

type DocCounts = {
  contracts: number;
  payslips: number;
  letters: number;
  evidence: number;
  notes: number;
  other: number;
};

const DOC_META: { key: keyof DocCounts; label: TranslationKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "contracts", label: "cases.docs.contracts", icon: "document-text-outline" },
  { key: "payslips", label: "cases.docs.payslips", icon: "receipt-outline" },
  { key: "letters", label: "cases.docs.letters", icon: "mail-outline" },
  { key: "evidence", label: "cases.docs.evidence", icon: "images-outline" },
  { key: "notes", label: "cases.docs.notes", icon: "create-outline" },
  { key: "other", label: "cases.docs.other", icon: "folder-outline" },
];

function countDocuments(item: WorkplaceCase, attachments: CaseAttachment[]): DocCounts {
  const own = attachments.filter((a) => a.caseId === item.id);
  const counts: DocCounts = {
    contracts: 0,
    payslips: 0,
    letters: 0,
    evidence: 0,
    notes: item.notes.length,
    other: 0,
  };

  own.forEach((attachment) => {
    if (attachment.kind === "photo") {
      counts.evidence += 1;
      return;
    }
    const name = attachment.name.toLowerCase();
    if (/contract|umow|agreement/.test(name)) counts.contracts += 1;
    else if (/payslip|pasek|wypłat|salary|payroll/.test(name)) counts.payslips += 1;
    else if (/letter|pismo|grievance|hr\b/.test(name)) counts.letters += 1;
    else counts.other += 1;
  });

  return counts;
}

function stepFor(item: WorkplaceCase, attachments: CaseAttachment[]) {
  const own = attachments.filter((a) => a.caseId === item.id);
  if (item.status === "resolved") return 4;
  if (item.notes.length > 0) return 3;
  if (own.length > 0) return 2;
  return 1;
}

export default function CasesScreen() {
  const { t, locale, resolvedTheme, cases, attachments, messages, addCase, addCaseNote, addAttachment } =
    useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ new?: string }>();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employer, setEmployer] = useState("");
  const [sector, setSector] = useState<string>(SECTORS[0]);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [noteCaseId, setNoteCaseId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (params.new === "1") {
      setModalOpen(true);
      router.setParams({ new: undefined });
    }
  }, [params.new, router]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!q) return true;
      return `${c.title} ${c.description} ${c.employer} ${c.sector}`.toLowerCase().includes(q);
    });
  }, [cases, filter, query]);

  const stats = useMemo(() => {
    const open = cases.filter((c) => c.status === "open").length;
    const dueThisWeek = cases.filter((c) => {
      if (!c.deadline || c.status !== "open") return false;
      const days = daysUntil(c.deadline);
      return days !== null && days >= 0 && days <= 7;
    }).length;
    const docs = attachments.filter((a) => cases.some((c) => c.id === a.caseId)).length;
    return { open, dueThisWeek, docs };
  }, [attachments, cases]);

  const previewCase = previewId ? cases.find((c) => c.id === previewId) ?? null : null;

  const previewData = useMemo(() => {
    if (!previewCase) return null;
    const docs = attachments
      .filter((a) => a.caseId === previewCase.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    return {
      counts: countDocuments(previewCase, attachments),
      docs,
      lastMessage: lastAssistant?.text ?? "",
    };
  }, [attachments, messages, previewCase]);

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

  const commitAttachments = (caseId: string, picked: PickedAttachment[]) => {
    picked.forEach((item) => {
      addAttachment(toCaseAttachment(caseId, item, newId("att"), nowLabel()));
    });
  };

  const addPhotoTo = async (caseId: string, fromCamera: boolean) => {
    try {
      if (fromCamera && Platform.OS !== "web") {
        setPhotoHandler(async (uri) => {
          const picked = await captureFromUri(uri);
          commitAttachments(caseId, [picked]);
        });
        router.push("/camera");
        return;
      }
      if (fromCamera) {
        const picked = await captureWithSystemCamera();
        if (picked) commitAttachments(caseId, [picked]);
        return;
      }
      const picked = await pickPhotos();
      if (picked.length) commitAttachments(caseId, picked);
    } catch {
      Alert.alert(t("chat.attachFailed"));
    }
  };

  const addFileTo = async (caseId: string) => {
    try {
      const picked = await pickDocuments();
      if (picked.length) commitAttachments(caseId, picked);
    } catch {
      Alert.alert(t("chat.attachFailed"));
    }
  };

  const saveNote = () => {
    if (!noteCaseId || !noteText.trim()) return;
    addCaseNote(noteCaseId, noteText);
    setNoteText("");
    setNoteCaseId(null);
  };

  const renderCase = (item: WorkplaceCase) => {
    const counts = countDocuments(item, attachments);
    const step = stepFor(item, attachments);
    const updated = daysSince(item.updatedAt);
    const deadlineDays = item.deadline ? daysUntil(item.deadline) : null;
    const urgent = deadlineDays !== null && deadlineDays < 3;
    const accent =
      item.status === "open"
        ? resolvedTheme === "dark"
          ? "#2DD4BF"
          : "#0D9488"
        : colors.success;

    const deadlineText =
      deadlineDays === null
        ? null
        : deadlineDays < 0
          ? t("cases.deadlineOverdue").replace("{count}", String(Math.abs(deadlineDays)))
          : deadlineDays === 0
            ? t("cases.deadlineToday")
            : t("cases.deadlineIn").replace("{count}", String(deadlineDays));

    return (
      <Pressable
        key={item.id}
        onPress={() => router.push(`/case/${item.id}`)}
        onLongPress={() => setPreviewId(item.id)}
        delayLongPress={320}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        style={({ pressed }) => [styles.caseCard, pressed && styles.cardPressed]}
      >
        <View style={[styles.accentBar, { backgroundColor: accent }]} />

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.caseTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {Platform.OS === "web" ? (
              <Pressable
                onPress={() => setPreviewId(item.id)}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t("cases.preview")}
                style={styles.infoButton}
              >
                <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            {item.employer || t("cases.unknownEmployer")} · {sectorLabel(t, item.sector)} ·{" "}
            {updated === 0
              ? t("cases.updatedToday")
              : t("cases.updatedDays").replace("{count}", String(updated))}
          </Text>

          {deadlineText ? (
            <View style={styles.deadlineRow}>
              <Ionicons
                name="flag-outline"
                size={13}
                color={urgent ? "#F87171" : colors.warning}
              />
              <Text
                style={[
                  styles.deadlineText,
                  { color: urgent ? "#F87171" : colors.warning },
                ]}
              >
                {deadlineText}
              </Text>
              <Text style={styles.deadlineDate}>{formatDate(locale, item.deadline as string)}</Text>
            </View>
          ) : null}

          <Text style={styles.stepText}>
            {t("cases.step")
              .replace("{current}", String(step))
              .replace("{total}", "4")}
            {" · "}
            {t(`chat.path.step${step}` as TranslationKey)}
          </Text>

          <View style={styles.docRow}>
            {DOC_META.map((doc) => (
              <View key={doc.key} style={styles.docBox}>
                <Text style={styles.docCount}>{counts[doc.key]}</Text>
                <Text style={styles.docLabel} numberOfLines={1}>
                  {t(doc.label)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.cardFooter}>
            <Pill
              label={item.status === "open" ? t("cases.open") : t("cases.resolved")}
              tone={item.status === "open" ? "brand" : "success"}
              icon={item.status === "open" ? "time-outline" : "checkmark-circle-outline"}
            />
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </View>
        </View>
      </Pressable>
    );
  };

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
        <View style={styles.statsRow}>
          <Pressable
            onPress={() => setFilter("open")}
            style={styles.statItem}
            accessibilityRole="button"
            accessibilityLabel={t("cases.stats.open").replace("{count}", String(stats.open))}
          >
            <Text style={styles.statNumber}>{stats.open}</Text>
            <Text style={styles.statLabel}>{t("cases.stats.open").replace("{count}", "").trim()}</Text>
          </Pressable>
          <Text style={styles.statDot}>·</Text>
          <Pressable
            onPress={() => setFilter("open")}
            style={styles.statItem}
            accessibilityRole="button"
            accessibilityLabel={t("cases.stats.deadlines").replace(
              "{count}",
              String(stats.dueThisWeek),
            )}
          >
            <Text style={styles.statNumber}>{stats.dueThisWeek}</Text>
            <Text style={styles.statLabel}>
              {t("cases.stats.deadlines").replace("{count}", "").trim()}
            </Text>
          </Pressable>
          <Text style={styles.statDot}>·</Text>
          <Pressable
            onPress={() => setFilter("all")}
            style={styles.statItem}
            accessibilityRole="button"
            accessibilityLabel={t("cases.stats.documents").replace("{count}", String(stats.docs))}
          >
            <Text style={styles.statNumber}>{stats.docs}</Text>
            <Text style={styles.statLabel}>
              {t("cases.stats.documents").replace("{count}", "").trim()}
            </Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("cases.search")}
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
            autoCorrect={false}
            accessibilityLabel={t("cases.search")}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={HIT_SLOP}
              accessibilityLabel={t("common.close")}
            >
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
                accessibilityState={{ selected: active }}
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

      {/* ------------------------------- preview ------------------------------- */}
      <Sheet
        visible={Boolean(previewCase)}
        onClose={() => setPreviewId(null)}
        maxHeight={0.6}
        title={t("cases.preview")}
      >
        {previewCase && previewData ? (
          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>{previewCase.title}</Text>
              <Pill
                label={
                  previewCase.status === "open" ? t("cases.open") : t("cases.resolved")
                }
                tone={previewCase.status === "open" ? "brand" : "success"}
              />
            </View>
            <Text style={styles.previewMeta}>
              {previewCase.employer || t("cases.unknownEmployer")} ·{" "}
              {sectorLabel(t, previewCase.sector)}
            </Text>

            <Text style={styles.previewLabel}>{t("cases.previewAbout")}</Text>
            <Text style={styles.previewBody} numberOfLines={4}>
              {previewCase.description}
            </Text>

            {previewCase.deadline ? (
              <View style={styles.previewDeadline}>
                <Ionicons name="flag-outline" size={14} color={colors.warning} />
                <Text style={styles.previewDeadlineText}>
                  {formatDate(locale, previewCase.deadline)}
                </Text>
              </View>
            ) : null}

            <Text style={styles.previewLabel}>{t("cases.previewLastMessage")}</Text>
            <Text style={styles.previewBody} numberOfLines={2}>
              {previewData.lastMessage || t("cases.previewNoMessage")}
            </Text>

            <Text style={styles.previewLabel}>{t("cases.docs.title")}</Text>
            <View style={styles.previewGrid}>
              {DOC_META.map((doc) => (
                <View key={doc.key} style={styles.previewBox}>
                  <Ionicons name={doc.icon} size={16} color={colors.brand} />
                  <Text style={styles.previewCount}>{previewData.counts[doc.key]}</Text>
                  <Text style={styles.previewBoxLabel} numberOfLines={1}>
                    {t(doc.label)}
                  </Text>
                </View>
              ))}
            </View>

            {previewData.docs.length === 0 ? (
              <Text style={styles.previewEmpty}>{t("cases.previewNoDocuments")}</Text>
            ) : (
              <View style={styles.previewDocs}>
                {previewData.docs.slice(0, 3).map((doc) => (
                  <View key={doc.id} style={styles.previewDocRow}>
                    {isImage(doc.mimeType) ? (
                      <Image source={{ uri: doc.uri }} style={styles.previewThumb} />
                    ) : (
                      <View style={styles.previewDocIcon}>
                        <Ionicons name="document-outline" size={18} color={colors.brand} />
                      </View>
                    )}
                    <View style={styles.previewDocText}>
                      <Text style={styles.previewDocName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.previewDocDate}>
                        {formatDate(locale, doc.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.previewActions}>
              <Button
                label={t("cases.previewOpen")}
                icon="open-outline"
                onPress={() => {
                  const id = previewCase.id;
                  setPreviewId(null);
                  router.push(`/case/${id}`);
                }}
              />
              <Button
                label={t("cases.previewChat")}
                icon="chatbubble-ellipses-outline"
                variant="secondary"
                onPress={() => {
                  const id = previewCase.id;
                  setPreviewId(null);
                  router.push({ pathname: "/chat", params: { caseId: id } });
                }}
              />
            </View>

            <Text style={styles.previewLabel}>{t("cases.previewAdd")}</Text>
            <View style={styles.addDocRow}>
              {(
                [
                  { key: "camera", icon: "camera-outline", label: "cases.addDoc.camera" },
                  { key: "gallery", icon: "images-outline", label: "cases.addDoc.gallery" },
                  { key: "file", icon: "document-attach-outline", label: "cases.addDoc.file" },
                  { key: "note", icon: "create-outline", label: "cases.addDoc.note" },
                ] as const
              ).map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    const id = previewCase.id;
                    if (option.key === "camera") void addPhotoTo(id, true);
                    else if (option.key === "gallery") void addPhotoTo(id, false);
                    else if (option.key === "file") void addFileTo(id);
                    else {
                      setNoteCaseId(id);
                      setPreviewId(null);
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t(option.label)}
                  style={({ pressed }) => [styles.addDocButton, pressed && styles.cardPressed]}
                >
                  <Ionicons name={option.icon} size={20} color={colors.brand} />
                  <Text style={styles.addDocLabel}>{t(option.label)}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </Sheet>

      {/* ------------------------------ new case ------------------------------ */}
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
                placeholder={t("cases.form.titlePlaceholder")}
                error={errors.title}
              />
              <Field
                label={t("cases.form.description")}
                value={description}
                onChangeText={setDescription}
                placeholder={t("cases.form.descriptionPlaceholder")}
                multiline
                numberOfLines={4}
                style={styles.textarea}
                error={errors.description}
              />
              <Field
                label={t("cases.form.employer")}
                value={employer}
                onChangeText={setEmployer}
                placeholder={t("cases.form.employerPlaceholder")}
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
                        {sectorLabel(t, item)}
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

      {/* -------------------------------- note -------------------------------- */}
      <Modal
        visible={Boolean(noteCaseId)}
        animationType="fade"
        transparent
        onRequestClose={() => setNoteCaseId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.noteSheet}>
            <Text style={styles.modalTitle}>{t("cases.noteTitle")}</Text>
            <Text style={styles.noteHint}>{t("cases.notePrompt")}</Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              multiline
              style={styles.noteInput}
              placeholder={t("cases.notePlaceholder")}
              placeholderTextColor={colors.placeholder}
              accessibilityLabel={t("cases.notePrompt")}
            />
            <View style={styles.modalActions}>
              <Button
                label={t("cases.form.cancel")}
                onPress={() => {
                  setNoteCaseId(null);
                  setNoteText("");
                }}
                variant="secondary"
              />
              <Button label={t("cases.noteTitle")} onPress={saveNote} icon="checkmark" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = createThemedStyles(() => ({
  container: { flex: 1, backgroundColor: colors.surface },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44 },
  statNumber: { fontFamily: fontFamily.mono, fontSize: 14, color: colors.onSurface },
  statLabel: { fontSize: 11, color: colors.muted },
  statDot: { color: colors.borderStrong, fontSize: 14 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
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
  caseCard: {
    flexDirection: "row",
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardPressed: { opacity: 0.8 },
  accentBar: { width: 3, alignSelf: "stretch" },
  cardBody: { flex: 1, padding: spacing.lg, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  caseTitle: {
    flex: 1,
    fontFamily: fontFamily.bold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.onSurface,
  },
  infoButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  meta: { ...typography.sm, color: colors.muted },
  deadlineRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  deadlineText: { fontFamily: fontFamily.mono, fontSize: 12 },
  deadlineDate: { ...typography.sm, color: colors.muted, marginLeft: 2 },
  stepText: { ...typography.sm, color: colors.onSurfaceSecondary },

  docRow: { flexDirection: "row", gap: 4, marginTop: 2 },
  docBox: {
    flex: 1,
    alignItems: "center",
    gap: 1,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
  },
  docCount: { fontFamily: fontFamily.mono, fontSize: 13, color: colors.onSurface },
  docLabel: { fontSize: 9, color: colors.muted, letterSpacing: 0.1 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },

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
  modalTitle: { ...typography.heading, color: colors.onSurface, marginBottom: spacing.md },
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

  previewScroll: { flexShrink: 1 },
  previewContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  previewTitle: { flex: 1, ...typography.heading, color: colors.onSurface },
  previewMeta: { ...typography.sm, color: colors.muted },
  previewLabel: {
    ...typography.label,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.muted,
    marginTop: spacing.md,
  },
  previewBody: { ...typography.base, color: colors.onSurfaceSecondary, lineHeight: 20 },
  previewDeadline: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.xs },
  previewDeadlineText: { fontFamily: fontFamily.mono, fontSize: 12, color: colors.warning },
  previewGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  previewBox: {
    width: "31%",
    flexGrow: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
  },
  previewCount: { fontFamily: fontFamily.mono, fontSize: 14, color: colors.onSurface },
  previewBoxLabel: { fontSize: 10, color: colors.muted },
  previewEmpty: { ...typography.sm, color: colors.muted },
  previewDocs: { gap: spacing.sm },
  previewDocRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  previewThumb: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.surfaceTertiary },
  previewDocIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  previewDocText: { flex: 1, gap: 1 },
  previewDocName: { ...typography.base, color: colors.onSurface },
  previewDocDate: { ...typography.sm, color: colors.muted },
  previewActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  addDocRow: { flexDirection: "row", gap: spacing.sm },
  addDocButton: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    minHeight: 56,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
  },
  addDocLabel: { fontSize: 10, color: colors.onSurfaceSecondary, textAlign: "center" },

  noteSheet: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  noteHint: { ...typography.sm, color: colors.muted },
  noteInput: {
    minHeight: 90,
    textAlignVertical: "top",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    ...typography.base,
    color: colors.onSurface,
  },
}));
