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
  Image,
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
} from "../src/api/client";
import { QuickActionRow, QuickActionsSheet } from "../src/components/QuickActions";
import { Sheet } from "../src/components/Sheet";
import { RobotWatermark } from "../src/components/ui";
import { hasEnoughContext, matchSuggestions, SUGGESTIONS } from "../src/data/suggestions";
import { localeLabels, type TranslationKey } from "../src/i18n/translations";
import { newId, nowLabel, useApp } from "../src/store/AppContext";
import {
  ACTION_HEIGHT,
  colors,
  createThemedStyles,
  fontFamily,
  HIT_SLOP,
  MIN_TOUCH,
  radius,
  spacing,
  typography,
} from "../src/theme/tokens";
import type { ChatMessage } from "../src/types";
import {
  captureFromUri,
  captureWithSystemCamera,
  pickDocuments,
  toCaseAttachment,
  type PickedAttachment,
} from "../src/utils/attachments";
import { setPhotoHandler } from "../src/utils/cameraBus";
import { parseAnswer } from "../src/utils/letter";
import { exportLetterToPdf } from "../src/utils/pdf";
import { speak, stopSpeaking } from "../src/utils/speech";
import { readRecordingAsBase64 } from "../src/utils/voice";

const STEP_KEYS = [
  "chat.path.step1",
  "chat.path.step2",
  "chat.path.step3",
  "chat.path.step4",
] as const satisfies ReadonlyArray<TranslationKey>;

const isNative = Platform.OS !== "web";

/** Stored messages use "HH:MM"; imported/seed data may carry an ISO timestamp. */
const formatClock = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

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
    addAttachment,
    attachments,
    letters,
    cases,
    online,
    autoRead,
    setAutoRead,
    resolvedTheme,
  } = useApp();

  const turquoise = resolvedTheme === "dark" ? "#2DD4BF" : "#0D9488";
  const onTurquoise = resolvedTheme === "dark" ? "#062A26" : "#FFFFFF";

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ prompt?: string; caseId?: string; menu?: string }>();

  const activeCase = useMemo(
    () => (params.caseId ? cases.find((c) => c.id === params.caseId) ?? null : null),
    [cases, params.caseId]
  );

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const abortRef = useRef<{ aborted: boolean } | null>(null);

  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [onboardName, setOnboardName] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showFab, setShowFab] = useState(false);
  const [attachNote, setAttachNote] = useState<string | null>(null);
  const [busyAttach, setBusyAttach] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => () => stopSpeaking(), []);

  /* ------------------------------ Context helpers ---------------------------- */

  const caseText = useMemo(
    () =>
      activeCase
        ? `${activeCase.title} ${activeCase.description} ${activeCase.employer} ${activeCase.sector}`
        : "",
    [activeCase]
  );

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

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  /* --------------------------------- Sending -------------------------------- */

  const send = useCallback(
    async (rawPrompt?: string) => {
      const prompt = (rawPrompt ?? input).trim();
      if (!prompt || isStreaming) return;

      setError(null);
      setInput("");
      setDebounced("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      addMessage({ id: newId("msg"), role: "user", text: prompt, timestamp: nowLabel() });
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
        addMessage({ id: assistantId, role: "assistant", text: answer, timestamp: nowLabel() });

        if (autoRead && soundOn && answer.trim()) {
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
      soundOn,
      t,
      updateProfile,
      userContext,
    ]
  );

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.aborted = true;
  }, []);

  const toggleSpeak = useCallback(
    (id: string, text: string) => {
      if (!soundOn) return;
      if (speakingId === id) {
        stopSpeaking();
        setSpeakingId(null);
        return;
      }
      setSpeakingId(id);
      speak(text, locale, () => setSpeakingId((cur) => (cur === id ? null : cur)));
    },
    [locale, soundOn, speakingId]
  );

  /* ------------------------------- Deep links -------------------------------- */

  const handledPrompt = useRef<string | null>(null);
  useEffect(() => {
    const incoming = typeof params.prompt === "string" ? params.prompt : null;
    if (incoming && handledPrompt.current !== incoming && !isStreaming) {
      handledPrompt.current = incoming;
      router.setParams({ prompt: "" });
      void send(incoming);
    }
  }, [params.prompt, isStreaming, router, send]);

  // "Chat about this case": put the case brief in the field, ready to send.
  const prefilledCase = useRef<string | null>(null);
  useEffect(() => {
    if (!activeCase || prefilledCase.current === activeCase.id) return;
    if (messages.length > 0) return;
    prefilledCase.current = activeCase.id;
    const prompt = t("cases.askElonPrompt")
      .replace("{title}", activeCase.title)
      .replace("{description}", activeCase.description)
      .replace("{employer}", activeCase.employer || t("cases.unknownEmployer"))
      .replace("{sector}", activeCase.sector);
    setInput(prompt);
  }, [activeCase, messages.length, t]);

  useEffect(() => {
    if (params.menu === "1") {
      setQuickOpen(true);
      router.setParams({ menu: "" });
    }
  }, [params.menu, router]);

  /* ------------------------------- Voice input ------------------------------- */

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
      if (text) setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      else Alert.alert(t("chat.emptyTranscript"));
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

  /* ------------------------------ Attachments -------------------------------- */

  const targetCase = activeCase ?? cases[0] ?? null;

  const commitAttachments = useCallback(
    (picked: PickedAttachment[]) => {
      if (!targetCase || picked.length === 0) return;
      const createdAt = new Date().toISOString();
      for (const file of picked) {
        addAttachment(toCaseAttachment(targetCase.id, file, newId("att"), createdAt));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAttachNote(t("chat.saved"));
      setTimeout(() => setAttachNote(null), 2200);
    },
    [addAttachment, t, targetCase]
  );

  const runPick = useCallback(
    async (task: () => Promise<PickedAttachment[]>) => {
      if (busyAttach) return;
      if (!targetCase) {
        Alert.alert(t("cases.new"), t("chat.pathEmpty"), [
          { text: t("common.close"), style: "cancel" },
          { text: t("cases.new"), onPress: () => router.push({ pathname: "/(tabs)/cases", params: { new: "1" } }) },
        ]);
        return;
      }
      setBusyAttach(true);
      try {
        commitAttachments(await task());
      } catch {
        Alert.alert(t("common.error"), t("chat.attachFailed"));
      } finally {
        setBusyAttach(false);
      }
    },
    [busyAttach, commitAttachments, router, t, targetCase]
  );

  const attachFile = useCallback(() => {
    void runPick(pickDocuments);
  }, [runPick]);

  const attachPhoto = useCallback(() => {
    if (!isNative) {
      void runPick(async () => {
        const shot = await captureWithSystemCamera();
        return shot ? [shot] : [];
      });
      return;
    }
    setPhotoHandler(async (uri) => {
      await runPick(async () => [await captureFromUri(uri)]);
    });
    router.push("/camera");
  }, [router, runPick]);

  /* ------------------------------ Suggestions -------------------------------- */

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), 450);
    return () => clearTimeout(timer);
  }, [input]);

  const suggestions = useMemo(() => {
    if (!hasEnoughContext(debounced)) return [];
    return matchSuggestions(debounced, caseText, 3);
  }, [caseText, debounced]);

  const lastAnswer = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last) return null;
    return { id: last.id, text: parseAnswer(last.text).chat || last.text };
  }, [messages]);

  /** CO DALEJ chips after an answer: matched from that answer, hidden while typing. */
  const nextSteps = useMemo(() => {
    if (!lastAnswer) return [];
    return matchSuggestions(lastAnswer.text, caseText, 3);
  }, [caseText, lastAnswer]);

  const insertSuggestion = useCallback((prompt: TranslationKey) => {
    setInput(t(prompt));
    Haptics.selectionAsync().catch(() => {});
  }, [t]);

  /* ------------------------------- Menu actions ------------------------------ */

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

  const deleteConversation = useCallback(() => {
    Alert.alert(t("chat.delete"), t("chat.clear"), [
      { text: t("common.close"), style: "cancel" },
      {
        text: t("chat.delete"),
        style: "destructive",
        onPress: () => {
          clearChat();
          setOptionsOpen(false);
        },
      },
    ]);
  }, [clearChat, t]);

  /* ---------------------------------- Path ---------------------------------- */

  const pathStep = useMemo(() => {
    if (!activeCase) return 0;
    if (activeCase.status === "resolved") return 4;
    const docs = attachments.filter((a) => a.caseId === activeCase.id).length;
    if (activeCase.notes.length > 0) return 3;
    if (docs > 0) return 2;
    return 1;
  }, [activeCase, attachments]);

  /* --------------------------------- Render --------------------------------- */

  const greeting = useMemo<ChatMessage>(
    () => ({ id: "greeting", role: "assistant", text: t("chat.greeting"), timestamp: "" }),
    [t]
  );

  const data = messages.length === 0 ? [greeting] : messages;
  const hasMessages = messages.length > 0;
  const canSend = input.trim().length > 0 && !isStreaming;

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
              accessibilityLabel={t("templates.copy")}
            >
              <Ionicons name="document-text-outline" size={15} color={colors.onBrandSoft} />
              <Text style={styles.letterChipText}>{t("templates.copy")}</Text>
            </Pressable>
          ) : null}

          <View style={styles.metaRow}>
            {item.timestamp ? (
              <Text style={styles.time}>{formatClock(item.timestamp)}</Text>
            ) : null}
            {!isUser ? (
              <Pressable
                onPress={() => toggleSpeak(item.id, body)}
                style={({ pressed }) => [styles.speakIcon, pressed && styles.speakIconPressed]}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t(speakingId === item.id ? "chat.stopReading" : "chat.readAloud")}
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
      {/* ------------------------------- Top bar -------------------------------- */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={t("chat.back")}
          >
            <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
          </Pressable>

          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Image
                source={require("../assets/logo-mark.png")}
                style={styles.avatarImage}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <Text style={styles.identityName} numberOfLines={1}>
              {t("chat.title")}
            </Text>
            <View
              style={[styles.statusDot, { backgroundColor: online ? colors.success : colors.warning }]}
              accessibilityElementsHidden
            />
          </View>

          <Pressable
            onPress={() => setOptionsOpen(true)}
            style={({ pressed }) => [styles.optionsButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t("chat.options")}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.onSurfaceSecondary} />
            <Text style={styles.optionsText} numberOfLines={1}>
              {t("chat.options")}
            </Text>
          </Pressable>
        </View>
      </View>

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
        <View style={styles.flex}>
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => {
              if (!showFab) scrollToEnd();
            }}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              const distance = contentSize.height - layoutMeasurement.height - contentOffset.y;
              setShowFab(distance > 140);
            }}
            scrollEventThrottle={32}
            keyboardShouldPersistTaps="handled"
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
                        accessibilityRole="button"
                        accessibilityLabel={t("chat.retry")}
                      >
                        <Text style={styles.retryText}>{t("chat.retry")}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </>
            }
          />

          {showFab ? (
            <Pressable
              onPress={() => {
                setShowFab(false);
                scrollToEnd();
              }}
              style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={t("chat.scrollToLatest")}
            >
              <Ionicons name="arrow-down" size={18} color={colors.onSurfaceSecondary} />
            </Pressable>
          ) : null}
        </View>

        {/* --------------------------- Contextual chips -------------------------- */}
        {suggestions.length > 0 && !isStreaming ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.suggestionRow}
            style={styles.suggestionScroll}
          >
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.id}
                onPress={() => insertSuggestion(suggestion.prompt)}
                style={({ pressed }) => [styles.suggestionChip, pressed && styles.suggestionChipPressed]}
                accessibilityRole="button"
                accessibilityLabel={t(suggestion.title)}
              >
                <Ionicons name="sparkles-outline" size={13} color={colors.brand} />
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {t(suggestion.title)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* ----------------------------- CO DALEJ chips -------------------------- */}
        {nextSteps.length > 0 && input.trim().length === 0 && !isStreaming ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.suggestionRow}
            style={styles.suggestionScroll}
          >
            {nextSteps.map((step) => (
              <Pressable
                key={`next-${step.id}`}
                onPress={() => insertSuggestion(step.prompt)}
                style={({ pressed }) => [styles.nextChip, pressed && styles.suggestionChipPressed]}
                accessibilityRole="button"
                accessibilityLabel={`${t("chat.nextSteps")}: ${t(step.title)}`}
              >
                <Ionicons name="arrow-forward-circle-outline" size={14} color={colors.onBrandSoft} />
                <Text style={styles.nextChipText} numberOfLines={1}>
                  {t(step.title)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        {/* -------------------------------- Input -------------------------------- */}
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
          ) : attachNote ? (
            <View style={styles.inputStatus}>
              <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
              <Text style={styles.inputStatusText}>{attachNote}</Text>
            </View>
          ) : null}

          <View style={styles.inputRow}>
            <View style={styles.inputShell}>
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
                  styles.fieldIcon,
                  recording && styles.fieldIconRecording,
                  pressed && styles.pressed,
                ]}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={recording ? t("chat.stop") : t("chat.voice")}
              >
                <Ionicons
                  name={recording ? "stop" : "mic-outline"}
                  size={19}
                  color={recording ? colors.onErrorSoft : colors.onSurfaceSecondary}
                />
              </Pressable>
              <Pressable
                onPress={attachFile}
                disabled={busyAttach}
                style={({ pressed }) => [styles.fieldIcon, pressed && styles.pressed]}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t("chat.attach")}
              >
                <Ionicons name="attach" size={20} color={colors.onSurfaceSecondary} />
              </Pressable>
              <Pressable
                onPress={attachPhoto}
                disabled={busyAttach}
                style={({ pressed }) => [styles.fieldIcon, pressed && styles.pressed]}
                hitSlop={HIT_SLOP}
                accessibilityRole="button"
                accessibilityLabel={t("chat.camera")}
              >
                <Ionicons name="camera-outline" size={20} color={colors.onSurfaceSecondary} />
              </Pressable>
            </View>

            {isStreaming ? (
              <Pressable
                onPress={stop}
                style={({ pressed }) => [
                  styles.sendButton,
                  { backgroundColor: turquoise },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("chat.stop")}
              >
                <Ionicons name="stop" size={18} color={onTurquoise} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => send()}
                disabled={!canSend}
                style={({ pressed }) => [
                  styles.sendButton,
                  { backgroundColor: turquoise },
                  !canSend && styles.sendButtonDisabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSend }}
                accessibilityLabel={t("chat.send")}
              >
                <Ionicons name="arrow-up" size={20} color={onTurquoise} />
              </Pressable>
            )}
          </View>

          <Text style={styles.disclaimer}>{t("chat.disclaimer")}</Text>
        </View>
      </KeyboardAvoidingView>

      {/* ------------------------------- Options -------------------------------- */}
      <Sheet
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        maxHeight={0.75}
        title={t("chat.optionsTitle")}
      >
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetContent}
        >
          <Text style={styles.sheetSection}>{t("chat.quickActions")}</Text>
          <QuickActionRow
            icon="add-circle-outline"
            label={t("chat.menu.newCase")}
            description={t("chat.menu.newCaseDesc")}
            onPress={() => {
              setOptionsOpen(false);
              setTimeout(() => setQuickOpen(true), 210);
            }}
          />
          <QuickActionRow
            icon="book-outline"
            label={t("chat.menu.glossary")}
            description={t("chat.menu.glossaryDesc")}
            onPress={() => {
              setOptionsOpen(false);
              setTimeout(() => router.push("/glossary"), 210);
            }}
          />
          <QuickActionRow
            icon="search-outline"
            label={t("chat.menu.search")}
            description={t("chat.menu.searchDesc")}
            onPress={() => {
              setOptionsOpen(false);
              setTimeout(() => router.push("/search"), 210);
            }}
          />

          <View style={styles.sheetDivider} />

          {/* Case path */}
          <Text style={styles.sheetSection}>{t("chat.path")}</Text>
          {activeCase && pathStep > 0 ? (
            <View style={styles.pathCard}>
              <View style={styles.pathHeader}>
                <Text style={styles.pathStep} numberOfLines={1}>
                  {t("cases.step")
                    .replace("{current}", String(pathStep))
                    .replace("{total}", "4")}
                  {" · "}
                  {t(STEP_KEYS[pathStep - 1])}
                </Text>
              </View>
              <View style={styles.pathDots}>
                {STEP_KEYS.map((key, index) => (
                  <View
                    key={key}
                    style={[styles.pathDot, index < pathStep && styles.pathDotActive]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.sheetHint}>{t("chat.pathEmpty")}</Text>
          )}

          <View style={styles.sheetDivider} />

          {/* Summary */}
          <Text style={styles.sheetSection}>{t("chat.legalSummary")}</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText} numberOfLines={4}>
              {lastAnswer ? lastAnswer.text : t("chat.summaryEmpty")}
            </Text>
            <Pressable
              onPress={() => {
                setOptionsOpen(false);
                setTimeout(() => send(t("chat.summaryPrompt")), 210);
              }}
              disabled={!hasMessages || isStreaming}
              style={({ pressed }) => [
                styles.summaryAction,
                (!hasMessages || isStreaming) && styles.disabled,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("chat.summarize")}
            >
              <Ionicons name="list-outline" size={15} color={colors.brand} />
              <Text style={styles.summaryActionText}>{t("chat.summarize")}</Text>
            </Pressable>
          </View>

          <View style={styles.sheetDivider} />

          {/* Voice */}
          <Text style={styles.sheetSection}>{t("chat.voice")}</Text>
          <ToggleRow
            icon="volume-high-outline"
            label={t("chat.speaker")}
            value={lastAnswer ? speakingId === lastAnswer.id : false}
            disabled={!lastAnswer || !soundOn}
            onPress={() => lastAnswer && toggleSpeak(lastAnswer.id, lastAnswer.text)}
            valueLabel={t(speakingId ? "chat.stopReading" : "chat.readAloud")}
          />
          <ToggleRow
            icon="headset-outline"
            label={t("chat.headphones")}
            value={autoRead}
            onPress={() => setAutoRead(!autoRead)}
            valueLabel={t(autoRead ? "chat.voiceOn" : "chat.voiceOff")}
          />
          <ToggleRow
            icon="power-outline"
            label={t("chat.sound")}
            value={soundOn}
            onPress={() => {
              if (soundOn) {
                stopSpeaking();
                setSpeakingId(null);
              }
              setSoundOn(!soundOn);
            }}
            valueLabel={t(soundOn ? "chat.voiceOn" : "chat.voiceOff")}
          />

          <View style={styles.sheetDivider} />

          {/* Next steps */}
          <Text style={styles.sheetSection}>{t("chat.nextSteps")}</Text>
          {nextSteps.length > 0 ? (
            <View style={styles.chipWrap}>
              {nextSteps.map((step) => (
                <Pressable
                  key={`opt-next-${step.id}`}
                  onPress={() => {
                    insertSuggestion(step.prompt);
                    setOptionsOpen(false);
                  }}
                  style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={t(step.title)}
                >
                  <Text style={styles.chipText} numberOfLines={1}>
                    {t(step.title)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.sheetHint}>{t("chat.nextEmpty")}</Text>
          )}

          <View style={styles.sheetDivider} />

          {/* Topics */}
          <Text style={styles.sheetSection}>{t("chat.topics")}</Text>
          <Text style={styles.sheetHint}>{t("chat.topicHint")}</Text>
          <View style={styles.chipWrap}>
            {SUGGESTIONS.map((topic) => (
              <Pressable
                key={`topic-${topic.id}`}
                onPress={() => {
                  insertSuggestion(topic.prompt);
                  setOptionsOpen(false);
                }}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                accessibilityRole="button"
                accessibilityLabel={t(topic.title)}
              >
                <Text style={styles.chipText} numberOfLines={1}>
                  {t(topic.title)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sheetDivider} />

          {/* Delete / Save / Download */}
          <View style={styles.actionRow}>
            <SheetAction
              icon="trash-outline"
              label={t("chat.delete")}
              onPress={deleteConversation}
              disabled={!hasMessages}
            />
            <SheetAction
              icon="bookmark-outline"
              label={t("chat.save")}
              onPress={() => {
                setOptionsOpen(false);
                setTimeout(saveAsCase, 210);
              }}
              disabled={!hasMessages}
            />
            <SheetAction
              icon="download-outline"
              label={t("chat.download")}
              onPress={() => {
                setOptionsOpen(false);
                setTimeout(() => void exportConversation(), 210);
              }}
              disabled={!hasMessages}
            />
          </View>
        </ScrollView>
      </Sheet>

      {/* ---------------------------- Quick actions ----------------------------- */}
      <QuickActionsSheet visible={quickOpen} onClose={() => setQuickOpen(false)} />

      {/* ------------------------------- Onboarding ----------------------------- */}
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

            <Text style={[styles.onboardLabel, { marginTop: spacing.lg }]}>{t("profile.language")}</Text>
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

/* --------------------------------- Sub-rows -------------------------------- */

const ToggleRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  valueLabel: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({ icon, label, value, valueLabel, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [styles.toggleRow, pressed && !disabled && styles.rowPressed, disabled && styles.disabled]}
    accessibilityRole="switch"
    accessibilityState={{ checked: value, disabled }}
    accessibilityLabel={label}
  >
    <Ionicons name={icon} size={19} color={value ? colors.brand : colors.muted} />
    <Text style={styles.toggleLabel} numberOfLines={1}>
      {label}
    </Text>
    <Text style={styles.toggleValue} numberOfLines={1}>
      {valueLabel}
    </Text>
    <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
      <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
    </View>
  </Pressable>
);

const SheetAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}> = ({ icon, label, onPress, disabled }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [styles.sheetAction, pressed && !disabled && styles.sheetActionPressed, disabled && styles.disabled]}
    accessibilityRole="button"
    accessibilityState={{ disabled }}
    accessibilityLabel={label}
  >
    <Ionicons name={icon} size={19} color={disabled ? colors.muted : colors.onSurfaceSecondary} />
    <Text style={styles.sheetActionText} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

const styles = createThemedStyles(() => ({
  container: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },

  topBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topBarRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  backButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, minWidth: 0 },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.logoBadge,
    borderWidth: 1,
    borderColor: colors.logoBadgeBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 22, height: 22 },
  identityName: { ...typography.body, fontFamily: fontFamily.bold, fontWeight: "700", color: colors.onSurface },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  optionsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  optionsText: { ...typography.sm, color: colors.onSurfaceSecondary, fontWeight: "600" },

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
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },

  bubbleRow: { flexDirection: "row", marginBottom: spacing.md, alignItems: "flex-end" },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "88%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  bubbleUser: { backgroundColor: colors.bubbleUser, borderBottomRightRadius: radius.sm },
  bubbleAssistant: {
    backgroundColor: colors.bubbleBot,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
    overflow: "hidden",
  },
  bubbleText: {
    fontSize: 15.5,
    lineHeight: 23,
    fontFamily: fontFamily.regular,
    color: colors.onBubbleBot,
  },
  bubbleTextUser: { color: colors.onBubbleUser },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xs,
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

  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  suggestionScroll: { flexGrow: 0, maxHeight: 44 },
  suggestionRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 280,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  suggestionChipPressed: { backgroundColor: colors.surfaceTertiary },
  suggestionText: { ...typography.sm, color: colors.onSurfaceSecondary, fontWeight: "600", flexShrink: 1 },
  nextChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 280,
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  nextChipText: { ...typography.sm, color: colors.onBrandSoft, fontWeight: "700", flexShrink: 1 },

  inputBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  inputStatus: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingBottom: spacing.sm },
  inputStatusText: { ...typography.sm, color: colors.muted, fontWeight: "500" },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  inputShell: {
    flex: 1,
    minHeight: ACTION_HEIGHT,
    maxHeight: 140,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 130,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15.5,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
    color: colors.onSurface,
  },
  fieldIcon: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  fieldIconRecording: { backgroundColor: colors.errorSoft },
  sendButton: {
    width: ACTION_HEIGHT,
    height: ACTION_HEIGHT,
    borderRadius: ACTION_HEIGHT / 2,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.35 },
  disclaimer: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamily.regular,
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: spacing.xs,
  },

  sheetScroll: { flexShrink: 1 },
  sheetContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  sheetSection: {
    ...typography.label,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sheetHint: { ...typography.sm, color: colors.muted, fontWeight: "400", lineHeight: 18, marginBottom: spacing.sm },
  sheetDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginVertical: spacing.md },

  pathCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pathHeader: { flexDirection: "row", alignItems: "center" },
  pathStep: { ...typography.base, color: colors.onSurface, fontWeight: "600", flex: 1 },
  pathDots: { flexDirection: "row", gap: 6 },
  pathDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  pathDotActive: { backgroundColor: colors.brand },

  summaryCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryText: { ...typography.base, color: colors.onSurfaceSecondary, lineHeight: 20 },
  summaryAction: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", minHeight: 32 },
  summaryActionText: { ...typography.sm, color: colors.brand, fontWeight: "700" },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: colors.surfaceTertiary },
  toggleLabel: { ...typography.body, color: colors.onSurface, flex: 1 },
  toggleValue: { ...typography.sm, color: colors.muted, fontWeight: "500" },
  toggleTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 3,
    justifyContent: "center",
  },
  toggleTrackOn: { backgroundColor: colors.brand },
  toggleKnob: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surfaceSecondary },
  toggleKnobOn: { alignSelf: "flex-end", backgroundColor: colors.onBrand },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    maxWidth: "100%",
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipPressed: { backgroundColor: colors.surfaceTertiary },
  chipText: { ...typography.sm, color: colors.onSurfaceSecondary, fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: spacing.sm },
  sheetAction: {
    flex: 1,
    minHeight: ACTION_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  sheetActionPressed: { backgroundColor: colors.surfaceTertiary },
  sheetActionText: { ...typography.sm, color: colors.onSurfaceSecondary, fontWeight: "600" },

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
