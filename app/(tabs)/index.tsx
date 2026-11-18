import { Ionicons } from "@expo/vector-icons";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import {
  streamElon,
  transcribeAudio,
  type AIUserContext,
  type ChatTurn,
} from "../../src/api/client";
import { Header, RobotWatermark } from "../../src/components/ui";
import { localeLabels, type TranslationKey } from "../../src/i18n/translations";
import { newId, nowLabel, useApp } from "../../src/store/AppContext";
import {
  ACTION_HEIGHT,
  colors,
  createThemedStyles,
  HIT_SLOP,
  MIN_TOUCH,
  radius,
  spacing,
  typography,
} from "../../src/theme/tokens";
import type { ChatMessage } from "../../src/types";
import { parseAnswer } from "../../src/utils/letter";
import { exportLetterToPdf } from "../../src/utils/pdf";
import { speak, stopSpeaking } from "../../src/utils/speech";
import { readRecordingAsBase64 } from "../../src/utils/voice";

const CHIPS = [
  { key: "chat.chip.overtime", prompt: "chat.prompt.overtime" },
  { key: "chat.chip.ssp", prompt: "chat.prompt.ssp" },
  { key: "chat.chip.hours", prompt: "chat.prompt.hours" },
  { key: "chat.chip.grievance", prompt: "chat.prompt.grievance" },
  { key: "chat.chip.dismissal", prompt: "chat.prompt.dismissal" },
  { key: "chat.chip.holiday", prompt: "chat.prompt.holiday" },
] as const satisfies ReadonlyArray<{ key: TranslationKey; prompt: TranslationKey }>;

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
    autoRead,
    setAutoRead,
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
  const [onboardName, setOnboardName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

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
        const answer = full.trim() || parsed.chat;
        addMessage({
          id: assistantId,
          role: "assistant",
          text: answer,
          timestamp: nowLabel(),
        });

        if (autoRead && answer.trim()) {
          setSpeakingId(assistantId);
          speak(parseAnswer(answer).chat || answer, locale, () =>
            setSpeakingId((cur) => (cur === assistantId ? null : cur))
          );
        }

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
      autoRead,
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

  /* ------------------------------- Voice input ------------------------------ */

  const startRecording = useCallback(async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t("chat.micDenied"));
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {
      Alert.alert(t("chat.micFailed"));
    }
  }, [recorder, t]);

  const stopRecording = useCallback(async () => {
    setRecording(false);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      setTranscribing(true);
      const { audioBase64, mimeType } = await readRecordingAsBase64(uri);
      const text = (await transcribeAudio(audioBase64, mimeType, locale)).trim();
      if (text) {
        setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      } else {
        Alert.alert(t("chat.emptyTranscript"));
      }
    } catch {
      Alert.alert(t("chat.micFailed"));
    } finally {
      setTranscribing(false);
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  }, [locale, recorder, t]);

  const toggleMic = useCallback(() => {
    if (transcribing) return;
    if (recording) void stopRecording();
    else void startRecording();
  }, [recording, startRecording, stopRecording, transcribing]);

  /* ------------------------------ Menu actions ----------------------------- */

  const transcript = useMemo(
    () =>
      messages
        .map((m) => {
          const body = m.role === "user" ? m.text : parseAnswer(m.text).chat || m.text;
          const who = m.role === "user" ? "You" : "Elon";
          return `${who}${m.timestamp ? ` (${m.timestamp})` : ""}:\n${body}`;
        })
        .join("\n\n"),
    [messages]
  );

  const lastAnswer = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return null;
    return { id: last.id, text: parseAnswer(last.text).chat || last.text };
  }, [messages]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const runMenuAction = useCallback((action: () => void | Promise<void>) => {
    setMenuOpen(false);
    // Let the sheet close before an alert or share sheet appears.
    setTimeout(() => void action(), 180);
  }, []);

  const saveAsCase = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      Alert.alert(t("common.error"), t("cases.empty"));
      return;
    }
    addCase({
      title: lastUser.text.slice(0, 60),
      description: lastUser.text,
      sector: profile.industry || "other",
      employer: profile.employerName,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t("cases.created"));
  }, [addCase, messages, profile.employerName, profile.industry, t]);

  const exportConversation = useCallback(async () => {
    if (!transcript.trim()) {
      Alert.alert(t("chat.noMessages"));
      return;
    }
    try {
      await exportLetterToPdf(`${t("chat.title")} — ${t("chat.title")}`, transcript, t("pdf.footer"));
    } catch {
      Alert.alert(t("chat.exportFailed"));
    }
  }, [t, transcript]);

  const copyTranscript = useCallback(async () => {
    if (!transcript.trim()) {
      Alert.alert(t("chat.noMessages"));
      return;
    }
    await Clipboard.setStringAsync(transcript);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(t("chat.copied"));
  }, [t, transcript]);

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
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          {!isUser ? <RobotWatermark /> : null}
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
              <Ionicons name="document-text-outline" size={15} color={colors.onBrandSoft} />
              <Text style={styles.letterChipText}>{t("templates.copy")}</Text>
            </Pressable>
          ) : null}

          <View style={styles.metaRow}>
            {item.timestamp ? <Text style={styles.time}>{item.timestamp}</Text> : null}
            {!isUser ? (
              <Pressable
                onPress={() => toggleSpeak(item.id, body)}
                style={({ pressed }) => [styles.speakIcon, pressed && styles.speakIconPressed]}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t(
                  speakingId === item.id ? "chat.stopReading" : "chat.readAloud"
                )}
              >
                <Ionicons
                  name={speakingId === item.id ? "stop" : "volume-medium-outline"}
                  size={15}
                  color={speakingId === item.id ? colors.brand : colors.muted}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        wordmark
        right={
          <Pressable
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={t("chat.menu")}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.onSurface} />
            <View
              style={[
                styles.statusDot,
                { backgroundColor: online ? colors.success : colors.warning },
              ]}
            />
          </Pressable>
        }
      />

      {!online ? (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={15} color={colors.onWarningSoft} />
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
              <View style={styles.emptyWrap}>
                <View style={styles.chipsWrap}>
                  {CHIPS.map((chip) => (
                    <Pressable
                      key={chip.key}
                      onPress={() => send(t(chip.prompt))}
                      style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.chipText}>{t(chip.key)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.hint}>{t("chat.emptyHint")}</Text>
              </View>
            ) : undefined
          }
          ListFooterComponent={
            <>
              {isStreaming ? (
                <View style={[styles.bubbleRow, styles.rowAssistant]}>
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
                  <Ionicons name="alert-circle-outline" size={18} color={colors.onErrorSoft} />
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
            </>
          }
        />

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          {transcribing ? (
            <View style={styles.inputStatus}>
              <ActivityIndicator size="small" color={colors.brand} />
              <Text style={styles.inputStatusText}>{t("chat.transcribing")}</Text>
            </View>
          ) : recording ? (
            <View style={styles.inputStatus}>
              <View style={styles.recordingDot} />
              <Text style={styles.inputStatusText}>{t("chat.listening")}</Text>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={recording ? t("chat.listening") : t("chat.placeholder")}
              placeholderTextColor={colors.placeholder}
              style={styles.textInput}
              multiline
              maxLength={2000}
              accessibilityLabel={t("chat.placeholder")}
            />

            <Pressable
              onPress={toggleMic}
              disabled={transcribing}
              style={({ pressed }) => [
                styles.iconButton,
                recording && styles.iconButtonRecording,
                pressed && styles.iconButtonPressed,
              ]}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={recording ? t("chat.stop") : t("chat.voice")}
            >
              <Ionicons
                name={recording ? "stop" : "mic-outline"}
                size={20}
                color={recording ? colors.onErrorSoft : colors.onSurfaceSecondary}
              />
            </Pressable>

            {isStreaming ? (
              <Pressable onPress={stop} style={styles.sendButton} accessibilityLabel={t("chat.stop")}>
                <Ionicons name="stop" size={18} color={colors.onBrand} />
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
        </View>
      </KeyboardAvoidingView>

      {/* ------------------------------- Chat menu ------------------------------ */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.sheetBackdrop} onPress={closeMenu}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHandle} />
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {messages.length > 0 ? (
                <>
                  <MenuItem
                    icon="add-circle-outline"
                    label={t("chat.newChat")}
                    onPress={() => runMenuAction(clearChat)}
                  />
                  <MenuItem
                    icon="briefcase-outline"
                    label={t("chat.saveAsCase")}
                    onPress={() => runMenuAction(saveAsCase)}
                  />
                  <MenuItem
                    icon="document-text-outline"
                    label={t("chat.exportPdf")}
                    onPress={() => runMenuAction(exportConversation)}
                  />
                  <MenuItem
                    icon="copy-outline"
                    label={t("chat.copyTranscript")}
                    onPress={() => runMenuAction(copyTranscript)}
                  />
                  <MenuItem
                    icon="list-outline"
                    label={t("chat.summarize")}
                    onPress={() => runMenuAction(() => send(t("chat.summaryPrompt")))}
                  />
                  <View style={styles.sheetDivider} />
                </>
              ) : null}

              <Text style={styles.sheetSection}>{t("chat.voice")}</Text>
              <MenuItem
                icon={autoRead ? "volume-high-outline" : "volume-mute-outline"}
                label={t("chat.autoRead")}
                active={autoRead}
                onPress={() => setAutoRead(!autoRead)}
              />
              {lastAnswer ? (
                <MenuItem
                  icon={speakingId ? "stop-circle-outline" : "play-circle-outline"}
                  label={t(speakingId ? "chat.stopReading" : "chat.readAloud")}
                  onPress={() => runMenuAction(() => toggleSpeak(lastAnswer.id, lastAnswer.text))}
                />
              ) : null}

              <Pressable
                onPress={closeMenu}
                style={({ pressed }) => [styles.sheetClose, pressed && styles.sheetClosePressed]}
                accessibilityRole="button"
              >
                <Text style={styles.sheetCloseText}>{t("common.close")}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ------------------------------- Onboarding ---------------------------- */}
      <Modal
        visible={!profile.onboarded && messages.length === 0}
        transparent
        animationType="fade"
        onRequestClose={() => updateProfile({ onboarded: true })}
      >
        <View style={styles.onboardBackdrop}>
          <View style={styles.onboardCard}>
            <View style={styles.onboardBadge}>
              <Ionicons name="shield-checkmark" size={26} color={colors.onBrand} />
            </View>
            <Text style={styles.onboardTitle}>{t("onboarding.title")}</Text>
            <Text style={styles.onboardBody}>{t("onboarding.body")}</Text>

            <Text style={styles.onboardLabel}>{t("onboarding.name")}</Text>
            <TextInput
              value={onboardName}
              onChangeText={setOnboardName}
              placeholder={t("profile.fullName")}
              placeholderTextColor={colors.placeholder}
              style={styles.onboardInput}
              accessibilityLabel={t("onboarding.name")}
            />

            <Text style={[styles.onboardLabel, { marginTop: spacing.lg }]}>
              {t("profile.language")}
            </Text>
            <View style={styles.onboardLangs}>
              {(["en", "pl", "ro"] as const).map((l) => {
                const active = locale === l;
                return (
                  <Pressable
                    key={l}
                    onPress={() => setLocale(l)}
                    style={[styles.onboardLang, active && styles.onboardLangActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.onboardLangText, active && styles.onboardLangTextActive]}>
                      {localeLabels[l]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => {
                updateProfile({
                  onboarded: true,
                  ...(onboardName.trim() ? { fullName: onboardName.trim() } : {}),
                });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }}
              style={styles.onboardStart}
              accessibilityRole="button"
            >
              <Text style={styles.onboardStartText}>{t("onboarding.start")}</Text>
            </Pressable>

            <Pressable
              onPress={() => updateProfile({ onboarded: true })}
              style={styles.onboardSkip}
              accessibilityRole="button"
            >
              <Text style={styles.onboardSkipText}>{t("onboarding.skip")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* --------------------------------- Menu row -------------------------------- */

const MenuItem: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  active?: boolean;
}> = ({ icon, label, onPress, active }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    accessibilityRole="button"
    accessibilityState={active === undefined ? undefined : { selected: active }}
  >
    <Ionicons name={icon} size={19} color={active ? colors.brand : colors.onSurfaceSecondary} />
    <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>{label}</Text>
    {active ? <Ionicons name="checkmark" size={18} color={colors.brand} /> : null}
  </Pressable>
);

const styles = createThemedStyles(() => ({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },

  menuButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuButtonPressed: { backgroundColor: colors.surfaceTertiary },
  statusDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.surfaceSecondary,
  },

  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  offlineText: { ...typography.sm, color: colors.onWarningSoft, flex: 1 },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },

  emptyWrap: { marginBottom: spacing.lg },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: "center",
  },
  chipPressed: { backgroundColor: colors.surfaceTertiary },
  chipText: { ...typography.base, color: colors.onSurfaceSecondary, fontWeight: "500" },
  hint: {
    ...typography.sm,
    color: colors.muted,
    marginTop: spacing.md,
    fontWeight: "400",
    lineHeight: 18,
  },

  bubbleRow: { flexDirection: "row", marginBottom: spacing.lg, alignItems: "flex-end" },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "86%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.md,
  },
  bubbleUser: {
    backgroundColor: colors.bubbleUser,
    borderBottomRightRadius: radius.sm,
  },
  bubbleAssistant: {
    backgroundColor: colors.bubbleBot,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bubbleText: { ...typography.body, color: colors.onBubbleBot, lineHeight: 24 },
  bubbleTextUser: { color: colors.onBubbleUser },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  time: { ...typography.sm, color: colors.muted, fontWeight: "400", opacity: 0.75 },
  speakIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  speakIconPressed: { backgroundColor: colors.brandSoft },

  letterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignSelf: "flex-start",
  },
  letterChipText: { ...typography.sm, color: colors.onBrandSoft, fontWeight: "700" },

  thinkingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  thinkingText: { ...typography.base, color: colors.muted },

  errorCard: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { ...typography.base, color: colors.onErrorSoft },
  retryText: { ...typography.base, color: colors.onErrorSoft, fontWeight: "700", marginTop: 4 },

  inputBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  inputStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  inputStatusText: { ...typography.sm, color: colors.muted, fontWeight: "500" },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  textInput: {
    flex: 1,
    minHeight: ACTION_HEIGHT,
    maxHeight: 120,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: 13,
    paddingBottom: 13,
    ...typography.body,
    color: colors.onSurface,
  },
  iconButton: {
    width: ACTION_HEIGHT,
    height: ACTION_HEIGHT,
    borderRadius: ACTION_HEIGHT / 2,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: { backgroundColor: colors.surfaceTertiary },
  iconButtonRecording: { backgroundColor: colors.errorSoft, borderColor: colors.error },
  sendButton: {
    width: ACTION_HEIGHT,
    height: ACTION_HEIGHT,
    borderRadius: ACTION_HEIGHT / 2,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.35 },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetSection: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: ACTION_HEIGHT + 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  menuItemPressed: { backgroundColor: colors.surfaceTertiary },
  menuItemText: { ...typography.body, color: colors.onSurface, flex: 1 },
  menuItemTextActive: { color: colors.brand, fontWeight: "600" },
  sheetClose: {
    minHeight: ACTION_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
  },
  sheetClosePressed: { opacity: 0.7 },
  sheetCloseText: { ...typography.base, color: colors.onSurfaceSecondary, fontWeight: "600" },

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
}));
