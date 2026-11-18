import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { streamElon, type AIUserContext, type ChatTurn } from "../../src/api/client";
import { Header, Pill } from "../../src/components/ui";
import { localeLabels } from "../../src/i18n/translations";
import { newId, nowLabel, useApp } from "../../src/store/AppContext";
import { colors, HIT_SLOP, MIN_TOUCH, radius, spacing, typography } from "../../src/theme/tokens";
import type { ChatMessage } from "../../src/types";
import { parseAnswer } from "../../src/utils/letter";
import { speak, stopSpeaking } from "../../src/utils/speech";

const CHIPS = [
  { key: "chat.chip.overtime", prompt: "Pracodawca nie zapłacił mi za nadgodziny. Co mogę zrobić?" },
  { key: "chat.chip.ssp", prompt: "Pracodawca odmawia wypłaty wynagrodzenia chorobowego (SSP)." },
  { key: "chat.chip.hours", prompt: "Pracodawca obciął mi godziny bez mojej zgody." },
  { key: "chat.chip.grievance", prompt: "Chcę złożyć formalną skargę (grievance) na menedżera." },
  { key: "chat.chip.dismissal", prompt: "Zostałem zwolniony z pracy. Czy to było legalne?" },
  { key: "chat.chip.holiday", prompt: "Mam problem z wypłatą za urlop (holiday pay)." },
];

export default function ChatScreen() {
  const {
    t,
    locale,
    setLocale,
    messages,
    addMessage,
    clearChat,
    profile,
    updateProfile,
    addCase,
    online,
  } = useApp();

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ prompt?: string }>();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const abortRef = useRef<{ aborted: boolean } | null>(null);

  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Never let speech keep playing after leaving the chat.
  useEffect(() => () => stopSpeaking(), []);

  const toggleSpeak = useCallback(
    (id: string, text: string) => {
      if (speakingId === id) {
        stopSpeaking();
        setSpeakingId(null);
        return;
      }
      setSpeakingId(id);
      speak(text, locale, () => setSpeakingId((cur) => (cur === id ? null : cur)));
    },
    [locale, speakingId]
  );

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const userContext = useMemo<AIUserContext>(
    () => ({
      name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      homeAddress: profile.homeAddress,
      employer: profile.employerName,
      companyNumber: profile.companyNumber,
      employerAddress: profile.employerAddress,
      jobTitle: profile.jobTitle,
      startDate: profile.startDate,
      hourlyRate: profile.hourlyRate || undefined,
      hoursPerWeek: profile.hoursPerWeek || undefined,
      contractType: profile.contractType,
      accountId: profile.accountId,
    }),
    [profile]
  );

  const send = useCallback(
    async (rawPrompt?: string) => {
      const prompt = (rawPrompt ?? input).trim();
      if (!prompt || isStreaming) return;

      setError(null);
      setInput("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      addMessage({
        id: newId("msg"),
        role: "user",
        text: prompt,
        timestamp: nowLabel(),
      });
      scrollToEnd();

      const history: ChatTurn[] = messages
        .filter((m) => m.text.trim().length > 0)
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      const assistantId = newId("msg");
      setIsStreaming(true);
      setStreamingText("");
      const signal = { aborted: false };
      abortRef.current = signal;

      try {
        const full = await streamElon(
          prompt,
          history,
          locale,
          userContext,
          (accumulated) => {
            setStreamingText(accumulated);
            scrollToEnd();
          },
          signal
        );

        const parsed = parseAnswer(full);
        addMessage({
          id: assistantId,
          role: "assistant",
          text: full.trim() || parsed.chat,
          timestamp: nowLabel(),
        });

        if (parsed.profileUpdate) {
          const patch: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(parsed.profileUpdate)) {
            if (key === "hourlyRate" || key === "hoursPerWeek") {
              const num = Number(String(value).replace(/[^\d.]/g, ""));
              if (!Number.isNaN(num) && num > 0) patch[key] = num;
            } else {
              patch[key] = value;
            }
          }
          if (Object.keys(patch).length > 0) updateProfile(patch);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("common.error"));
      } finally {
        setIsStreaming(false);
        setStreamingText("");
        abortRef.current = null;
        scrollToEnd();
      }
    },
    [
      addMessage,
      input,
      isStreaming,
      locale,
      messages,
      scrollToEnd,
      t,
      updateProfile,
      userContext,
    ]
  );

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.aborted = true;
  }, []);

  // "Ask Elon about this case" deep-link: auto-send the pre-filled prompt once.
  const handledPrompt = useRef<string | null>(null);
  useEffect(() => {
    const incoming = typeof params.prompt === "string" ? params.prompt : null;
    if (incoming && handledPrompt.current !== incoming && !isStreaming) {
      handledPrompt.current = incoming;
      router.setParams({ prompt: "" });
      send(incoming);
    }
  }, [params.prompt, isStreaming, router, send]);

  const saveAsCase = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      Alert.alert(t("common.error"), t("cases.empty"));
      return;
    }
    addCase({
      title: lastUser.text.slice(0, 60),
      description: lastUser.text,
      sector: profile.industry || "Other",
      employer: profile.employerName,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t("cases.created"));
  }, [addCase, messages, profile.employerName, profile.industry, t]);

  const greeting = useMemo<ChatMessage>(
    () => ({
      id: "greeting",
      role: "assistant",
      text: t("chat.greeting"),
      timestamp: "",
    }),
    [t]
  );

  const data = messages.length === 0 ? [greeting] : messages;

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    const parsed = isUser ? null : parseAnswer(item.text);
    const body = isUser ? item.text : parsed?.chat || item.text;

    return (
      <View style={[styles.bubbleRow, isUser ? styles.rowUser : styles.rowAssistant]}>
        {!isUser ? (
          <View style={styles.avatar}>
            <Ionicons name="shield-checkmark" size={16} color={colors.onBrand} />
          </View>
        ) : null}

        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{body}</Text>

          {parsed?.letter ? (
            <Pressable
              onPress={async () => {
                await Clipboard.setStringAsync(parsed.letter!);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                Alert.alert(t("templates.copied"));
              }}
              style={styles.letterChip}
              accessibilityRole="button"
            >
              <Ionicons name="document-text-outline" size={16} color={colors.brand} />
              <Text style={styles.letterChipText}>{t("templates.copy")}</Text>
            </Pressable>
          ) : null}

          {item.timestamp ? <Text style={styles.time}>{item.timestamp}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={t("chat.title")}
        subtitle={t("chat.subtitle")}
        right={
          <View style={styles.headerRight}>
            {messages.length > 0 ? (
              <Pressable onPress={clearChat} hitSlop={HIT_SLOP} accessibilityLabel="Clear chat">
                <Ionicons name="refresh-outline" size={22} color={colors.muted} />
              </Pressable>
            ) : null}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: online ? colors.success : colors.warning },
              ]}
            />
          </View>
        }
      />

      {!online ? (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#A85C09" />
          <Text style={styles.offlineText}>{t("chat.offline")}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 8}
      >
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            messages.length === 0 ? (
              <View style={styles.chipsWrap}>
                {CHIPS.map((chip) => (
                  <Pressable
                    key={chip.key}
                    onPress={() => send(chip.prompt)}
                    style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                    accessibilityRole="button"
                  >
                    <Text style={styles.chipText}>{t(chip.key)}</Text>
                  </Pressable>
                ))}
                <Text style={styles.hint}>{t("chat.emptyHint")}</Text>
              </View>
            ) : undefined
          }
          ListFooterComponent={
            <>
              {isStreaming ? (
                <View style={[styles.bubbleRow, styles.rowAssistant]}>
                  <View style={styles.avatar}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.onBrand} />
                  </View>
                  <View style={[styles.bubble, styles.bubbleAssistant]}>
                    {streamingText ? (
                      <Text style={styles.bubbleText}>{parseAnswer(streamingText).chat}</Text>
                    ) : (
                      <View style={styles.thinkingRow}>
                        <ActivityIndicator size="small" color={colors.brand} />
                        <Text style={styles.thinkingText}>{t("chat.thinking")}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorCard}>
                  <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
                  <View style={styles.flex}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable
                      onPress={() => send(messages[messages.length - 1]?.text)}
                      hitSlop={HIT_SLOP}
                    >
                      <Text style={styles.retryText}>{t("chat.retry")}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {messages.length > 0 && !isStreaming ? (
                <View style={styles.actionsRow}>
                  <Pill label={t("chat.saveAsCase")} tone="brand" icon="briefcase-outline" />
                  <Pressable onPress={saveAsCase} hitSlop={HIT_SLOP} style={styles.actionLink}>
                    <Text style={styles.actionLinkText}>{t("chat.saveAsCase")}</Text>
                  </Pressable>
                </View>
              ) : null}
            </>
          }
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t("chat.placeholder")}
            placeholderTextColor="#9AA9B4"
            style={styles.textInput}
            multiline
            maxLength={2000}
            accessibilityLabel={t("chat.placeholder")}
          />
          {isStreaming ? (
            <Pressable onPress={stop} style={styles.sendButton} accessibilityLabel={t("chat.stop")}>
              <Ionicons name="stop" size={20} color={colors.onBrand} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => send()}
              disabled={!input.trim()}
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              accessibilityLabel={t("chat.send")}
            >
              <Ionicons name="arrow-up" size={20} color={colors.onBrand} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FDF1E3",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  offlineText: { ...typography.sm, color: "#A85C09", flex: 1 },

  listContent: { padding: spacing.lg, paddingBottom: spacing.xl },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  chipPressed: { backgroundColor: colors.surfaceTertiary },
  chipText: { ...typography.base, color: colors.onSurfaceTertiary, fontWeight: "500" },
  hint: { ...typography.sm, color: colors.muted, marginTop: spacing.sm, fontWeight: "400" },

  bubbleRow: { flexDirection: "row", marginBottom: spacing.md, alignItems: "flex-end" },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubbleUser: { backgroundColor: colors.brand, borderBottomRightRadius: radius.sm },
  bubbleAssistant: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  bubbleText: { ...typography.body, color: colors.onSurface, lineHeight: 23 },
  bubbleTextUser: { color: colors.onBrand },
  time: { ...typography.sm, color: colors.muted, marginTop: 6, fontWeight: "400", opacity: 0.8 },

  letterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: "#E8F1EC",
    alignSelf: "flex-start",
  },
  letterChipText: { ...typography.sm, color: colors.brand, fontWeight: "700" },

  speakButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "#E8F1EC",
  },
  speakText: { ...typography.sm, color: colors.brand, fontWeight: "600" },

  thinkingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thinkingText: { ...typography.base, color: colors.muted },

  errorCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "#FDECEC",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.base, color: "#B91C1C" },
  retryText: { ...typography.base, color: "#B91C1C", fontWeight: "700", marginTop: 4 },

  actionsRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
  actionLink: { paddingVertical: spacing.sm },
  actionLinkText: { ...typography.sm, color: colors.brand, fontWeight: "700" },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  textInput: {
    flex: 1,
    minHeight: MIN_TOUCH,
    maxHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 12,
    ...typography.body,
    color: colors.onSurface,
  },
  sendButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.35 },

  onboardBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  onboardCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "stretch",
  },
  onboardBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  onboardTitle: { ...typography.title, color: colors.onSurface, textAlign: "center" },
  onboardBody: {
    ...typography.base,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 21,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  onboardLabel: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  onboardInput: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.onSurface,
  },
  onboardLangs: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  onboardLang: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  onboardLangActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  onboardLangText: { ...typography.sm, color: colors.muted, fontWeight: "600" },
  onboardLangTextActive: { color: colors.onBrand },
  onboardStart: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  onboardStartText: { ...typography.body, color: colors.onBrand, fontWeight: "700" },
  onboardSkip: { alignItems: "center", paddingVertical: spacing.md },
  onboardSkipText: { ...typography.sm, color: colors.muted, fontWeight: "600" },
});
