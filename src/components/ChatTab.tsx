import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  Locale,
  ConversationLegalSummary,
  UnsavedChatIconType,
  RecentUnsavedChat,
} from "../types";
import {
  extractInstantLegalSummary,
  fetchConversationLegalSummaryAI,
} from "../services/geminiService";
import {
  stripEmbeddedEnglishLetter,
  buildPersonalizedEnglishLetterForChat,
  GeneratedChatLetter,
} from "../data/legalTemplates";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  BookmarkPlus,
  BookmarkCheck,
  Info,
  WifiOff,
  Clock,
  RefreshCw,
  CheckCircle2,
  Pause,
  Play,
  Square,
  Gauge,
  Scale,
  CalendarClock,
  ShieldCheck,
  ShieldAlert,
  FileText,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Mail,
  PanelRightClose,
  PanelRightOpen,
  X,
  AlertTriangle,
  History,
  Banknote,
  HeartPulse,
  Briefcase,
  Database,
  MessageSquare,
  Calendar,
} from "lucide-react";

const SPEECH_RATES = [0.9, 1.05, 1.25] as const;

/**
 * Selects the best available MALE voice for the target language across Windows, macOS, Android, iOS, and Chrome/Edge.
 * Returns both the chosen voice and whether it is an explicitly named male voice (used to tune masculine pitch).
 */
function pickConfidentMaleVoice(
  voices: SpeechSynthesisVoice[],
  langTag: string
): { voice: SpeechSynthesisVoice | null; isExplicitMale: boolean } {
  if (!voices || voices.length === 0) {
    return { voice: null, isExplicitMale: false };
  }

  const langPrefix = langTag.split("-")[0].toLowerCase();
  const matchingLangVoices = voices.filter((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix)
  );

  const candidates = matchingLangVoices.length > 0 ? matchingLangVoices : voices;

  const maleKeywords = [
    "male",
    "męski",
    "man",
    // Polish male TTS voices
    "marek",
    "krzysztof",
    "jacek",
    "jan",
    "adam",
    "piotr",
    "tomasz",
    "maciej",
    "stanislaw",
    "zbigniew",
    // UK / English male TTS voices
    "ryan",
    "george",
    "daniel",
    "oliver",
    "arthur",
    "thomas",
    "david",
    "mark",
    "guy",
    "christopher",
    "eric",
    "brian",
    "james",
    "richard",
    "alex",
    "fred",
    "aaron",
    "gordon",
    "malcolm",
    // Romanian male TTS voices
    "andrei",
    "emil",
    "ion",
    "mihai",
    "vlad",
    "raducu",
  ];

  const femaleKeywords = [
    "female",
    "kobieta",
    "woman",
    // Polish female TTS voices
    "paulina",
    "agnieszka",
    "zosia",
    "ewa",
    "maja",
    "karolina",
    "katarzyna",
    "magda",
    "zuzanna",
    "iwona",
    // English female TTS voices
    "hazel",
    "susan",
    "libby",
    "sonia",
    "maisie",
    "serena",
    "kate",
    "samantha",
    "victoria",
    "karen",
    "moira",
    "tessa",
    "zira",
    "aria",
    "jenny",
    // Romanian female TTS voices
    "alina",
    "carmen",
    "ioana",
    "elena",
  ];

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -999;
  let bestIsExplicitMale = false;

  for (const v of candidates) {
    const nameLower = `${v.name} ${v.voiceURI}`.toLowerCase();
    const vLang = v.lang.toLowerCase().replace("_", "-");
    let score = 0;

    if (vLang === langTag.toLowerCase()) {
      score += 25;
    } else if (vLang.startsWith(langPrefix)) {
      score += 15;
    }

    const hasMaleName = maleKeywords.some((kw) => nameLower.includes(kw));
    const hasFemaleName = femaleKeywords.some((kw) => nameLower.includes(kw));

    if (hasMaleName) {
      score += 120;
    }
    if (hasFemaleName) {
      score -= 150;
    }

    // Prefer Natural / Online / Neural high-clarity voices when not female
    if (!hasFemaleName && (nameLower.includes("natural") || nameLower.includes("neural") || nameLower.includes("google"))) {
      score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = v;
      bestIsExplicitMale = hasMaleName && !hasFemaleName;
    }
  }

  return { voice: bestVoice, isExplicitMale: bestIsExplicitMale };
}

/**
 * Automatically detects the language of an AI message based on diacritics and legal vocabulary,
 * falling back to the active UI locale.
 */
function detectMessageLanguage(
  text: string,
  fallbackLocale: Locale
): { langTag: string; detectedLocale: Locale } {
  const sample = text.toLowerCase();

  // Check Polish diacritics & common legal words
  const plScore =
    (sample.match(/[ąćęłńóśźż]/g)?.length || 0) * 2 +
    (sample.match(/\b(pracodawca|wynagrodzenia|zgodnie|ustaw|nadgodzin|cześć|twoje|prawa|wypłat|kolego|stary)\b/g)
      ?.length || 0) *
      3;

  // Check Romanian diacritics & common legal words
  const roScore =
    (sample.match(/[ăâîșț]/g)?.length || 0) * 2 +
    (sample.match(/\b(angajatorul|salariu|drepturile|conform|secțiunii|opțiunea|salut|muncă|prietene)\b/g)
      ?.length || 0) *
      3;

  // Check English common legal words
  const enScore =
    (sample.match(/\b(employer|unlawful|deduction|wages|statutory|employment|tribunal|hello|under|options|mate)\b/g)
      ?.length || 0) * 3;

  if (plScore > roScore && plScore > enScore && plScore >= 3) {
    return { langTag: "pl-PL", detectedLocale: "pl" };
  }
  if (roScore > plScore && roScore > enScore && roScore >= 3) {
    return { langTag: "ro-RO", detectedLocale: "ro" };
  }
  if (enScore > plScore && enScore > roScore && enScore >= 3) {
    return { langTag: "en-GB", detectedLocale: "en" };
  }

  return {
    langTag: fallbackLocale === "pl" ? "pl-PL" : fallbackLocale === "ro" ? "ro-RO" : "en-GB",
    detectedLocale: fallbackLocale,
  };
}

/**
 * Strips markdown, emojis, and all punctuation marks so the TTS voice reader
 * NEVER pronounces punctuation out loud (such as "kropka", "myślnik", "dwukropek", "nawias").
 * Also strips any embedded English letter block so the voice reader speaks only the user's native language.
 */
function normalizeLegalTextForSpeech(text: string, locale: Locale): string {
  const withoutLetter = stripEmbeddedEnglishLetter(text);

  const cleaned = withoutLetter
    // Remove markdown bold/italic/code/headers
    .replace(/[*#_~`>]/g, " ")
    // Remove decorative emojis & symbols
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}•]/gu, " ")
    // Convert formal section headers into confident buddy-to-buddy spoken transitions without colons
    .replace(/Twoje prawa w świetle brytyjskiego prawa:?/gi, "Słuchaj stary tak wyglądają Twoje twarde prawa w UK ")
    .replace(/Strategia działania:?/gi, "A teraz nasz konkretny plan działania ")
    .replace(/Opcja A\s*\([^)]*\):?/gi, "Opcja pierwsza na spokojnie ")
    .replace(/Opcja B\s*\([^)]*\):?/gi, "Opcja druga twardo z paragrafu ")
    .replace(/Your Legal Rights Under UK Law:?/gi, "Listen mate here is where you stand under UK law ")
    .replace(/Strategic Options:?/gi, "Here is our game plan ")
    // Expand s.13 / s.9 / s.23 / s.44 / s.10 / s.1 statutory shorthand before stripping dots
    .replace(/\bs\.?\s*(\d+)\b/gi, (_, num) =>
      locale === "pl" ? `artykuł ${num}` : locale === "ro" ? `secțiunea ${num}` : `section ${num}`
    )
    // Expand ERA 1996
    .replace(/\bERA\s+1996\b/g, "Employment Rights Act 1996")
    // Normalize £/h or /hr
    .replace(/£(\d+(?:[.,]\d+)?)\s*\/\s*h(?:r|godz\.?)?\b/gi, (_, amt) => {
      const spokenAmt = String(amt).replace(/[.,]/g, " ");
      return locale === "pl"
        ? `${spokenAmt} funtów na godzinę`
        : locale === "ro"
        ? `${spokenAmt} lire pe oră`
        : `${spokenAmt} pounds an hour`;
    })
    // Normalize standalone £ amounts so £ symbol is spoken as currency words
    .replace(/£\s*(\d+(?:[.,]\d+)?)/g, (_, amt) => {
      const spokenAmt = String(amt).replace(/[.,]/g, " ");
      return locale === "pl"
        ? `${spokenAmt} funtów`
        : locale === "ro"
        ? `${spokenAmt} lire`
        : `${spokenAmt} pounds`;
    })
    // Normalize percentages so % is spoken naturally
    .replace(/(\d+(?:[.,]\d+)?)\s*%/g, (_, pct) => {
      const spokenPct = String(pct).replace(/[.,]/g, " ");
      return locale === "pl"
        ? `${spokenPct} procent`
        : locale === "ro"
        ? `${spokenPct} la sută`
        : `${spokenPct} percent`;
    })
    // Strip ALL remaining punctuation marks so TTS never reads "myślnik", "dwukropek", "nawias", "ukośnik", "kropka", etc.
    .replace(/[.,!?;:()\[\]{}"'„”«»—–\-/\\|+*#_~`<>•…§&@+=^]/g, " ")
    // Collapse multiple spaces and newlines into clean spaces
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

export const ChatTab: React.FC = () => {
  const {
    t,
    chatMessages,
    isChatLoading,
    sendChatMessage,
    clearChatMessages,
    saveCurrentChatAsCase,
    locale,
    user,
    isOnline,
    networkStatus,
    isSimulatedOffline,
    setIsSimulatedOffline,
    chatDraft,
    setChatDraft,
    queuedMessagesCount,
    retryQueuedMessages,
    checkConnectionNow,
    showToast,
    templates,
    setActiveTemplateId,
    setActiveTab,
    saveSentLetter,
    recentUnsavedChats,
    activeUnsavedChatId,
    restoreUnsavedChat,
    removeUnsavedChat,
    saveUnsavedChatAsCase,
  } = useApp();

  const [isDictating, setIsDictating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.05);
  const [autoReadAloud, setAutoReadAloud] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [revealedCharsById, setRevealedCharsById] = useState<Record<string, number>>({});
  const [previewModalLetter, setPreviewModalLetter] = useState<
    (GeneratedChatLetter & { msgId: string }) | null
  >(null);
  const [copiedEnvelopeId, setCopiedEnvelopeId] = useState<string | null>(null);
  const [savedEnvelopeIds, setSavedEnvelopeIds] = useState<Record<string, boolean>>({});

  // Legal Summary Side-Panel State
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState<boolean>(true);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false);
  const [legalSummary, setLegalSummary] = useState<ConversationLegalSummary>(() =>
    extractInstantLegalSummary(chatMessages, locale)
  );
  const [isUpdatingSummary, setIsUpdatingSummary] = useState<boolean>(false);

  const [isAutoScrollPinned, setIsAutoScrollPinned] = useState<boolean>(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeMessageRef = useRef<HTMLDivElement | null>(null);
  const isAutoScrollPinnedRef = useRef<boolean>(true);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const programmaticScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const prevMsgCountRef = useRef<number>(chatMessages.length);
  const prevSpeakingMsgIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const dictationBaseDraftRef = useRef<string>("");
  const speechProducedTextRef = useRef<boolean>(false);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const summaryAbortRef = useRef<AbortController | null>(null);
  const summaryDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoReadMsgIdRef = useRef<string | null>(null);
  const fullyRevealedMsgIdsRef = useRef<Set<string>>(
    new Set(chatMessages.map((m) => m.id))
  );
  const pacerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  interface LiveSpeechSegment {
    rawStart: number;
    rawEnd: number;
    rawText: string;
    spokenText: string;
  }

  interface LiveSpeechSession {
    msgId: string;
    fullRawText: string;
    queuedRawLength: number;
    segments: LiveSpeechSegment[];
    currentSegmentIndex: number;
    isSpeakingSegment: boolean;
    segmentStartedAt: number;
    revealedChars: number;
    progressiveReveal: boolean;
    streamActive: boolean;
    rate: number;
  }

  const liveSpeechRef = useRef<LiveSpeechSession | null>(null);
  const speechRateRef = useRef<number>(speechRate);
  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  // Load available Web Speech API voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
      if (pacerTimerRef.current) {
        clearInterval(pacerTimerRef.current);
        pacerTimerRef.current = null;
      }
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      if (programmaticScrollTimeoutRef.current) {
        clearTimeout(programmaticScrollTimeoutRef.current);
        programmaticScrollTimeoutRef.current = null;
      }
    };
  }, []);

  // Track user scroll position inside the messages container to detect manual scroll-up vs. bottom-pinned state
  const handleScrollContainer = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    // Ignore scroll events triggered by our own programmatic auto-scroller unless already at bottom
    if (isProgrammaticScrollRef.current) {
      if (distanceFromBottom <= 80 && !isAutoScrollPinnedRef.current) {
        isAutoScrollPinnedRef.current = true;
        setIsAutoScrollPinned(true);
      }
      return;
    }

    const shouldPin = distanceFromBottom <= 96;
    if (shouldPin !== isAutoScrollPinnedRef.current) {
      isAutoScrollPinnedRef.current = shouldPin;
      setIsAutoScrollPinned(shouldPin);
    }
  }, []);

  // Smooth, non-canceling auto-scroll helper that follows both high-frequency streaming/speech ticks and discrete layout transitions
  const scrollToActiveStreamOrBottom = useCallback(
    (mode: "follow" | "smooth" = "follow", forcePin: boolean = false) => {
      if (forcePin) {
        isAutoScrollPinnedRef.current = true;
        setIsAutoScrollPinned(true);
      }

      if (!isAutoScrollPinnedRef.current && !forcePin) {
        return;
      }

      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
      }

      scrollRafRef.current = requestAnimationFrame(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        isProgrammaticScrollRef.current = true;
        if (programmaticScrollTimeoutRef.current) {
          clearTimeout(programmaticScrollTimeoutRef.current);
        }

        // Check if user is playing an older message's audio (not the last message in the list)
        const lastMsg = chatMessages[chatMessages.length - 1];
        const isSpeakingOlderMessage =
          Boolean(speakingMsgId) && lastMsg && speakingMsgId !== lastMsg.id;

        if (isSpeakingOlderMessage && activeMessageRef.current) {
          const msgEl = activeMessageRef.current;
          const msgBottom = msgEl.offsetTop + msgEl.offsetHeight;
          const visibleTop = container.scrollTop;
          const visibleBottom = visibleTop + container.clientHeight;

          // Keep the active message's bottom control bar & audio wave indicator comfortably in view
          if (msgBottom > visibleBottom - 24 || msgEl.offsetTop < visibleTop + 16) {
            const targetTop = Math.max(
              0,
              msgBottom - container.clientHeight + 36
            );
            container.scrollTo({
              top: targetTop,
              behavior: mode === "smooth" ? "smooth" : "auto",
            });
          }
        } else {
          const targetTop = Math.max(0, container.scrollHeight - container.clientHeight);
          const delta = targetTop - container.scrollTop;

          if (delta > 1) {
            if (mode === "smooth" && delta < 900) {
              container.scrollTo({ top: targetTop, behavior: "smooth" });
            } else {
              // During 20Hz speech-synchronized text reveal & streaming chunks, smoothly advance scrollTop without resetting browser smooth-scroll velocity
              const step = delta > 140 ? delta * 0.55 : delta;
              container.scrollTop = container.scrollTop + step;
            }
          }
        }

        programmaticScrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, mode === "smooth" ? 320 : 80);
      });
    },
    [chatMessages, speakingMsgId]
  );

  // Re-pin & smoothly scroll when a new message is added or when a message begins speaking / finishes into an envelope
  useEffect(() => {
    const msgCountChanged = chatMessages.length !== prevMsgCountRef.current;
    const speakingChanged = speakingMsgId !== prevSpeakingMsgIdRef.current;
    prevMsgCountRef.current = chatMessages.length;
    prevSpeakingMsgIdRef.current = speakingMsgId;

    if (msgCountChanged) {
      scrollToActiveStreamOrBottom("smooth", true);
      return;
    }

    if (speakingChanged) {
      // When speech starts on a message or finishes (revealing the English statutory letter envelope), keep view aligned
      scrollToActiveStreamOrBottom("smooth", isAutoScrollPinnedRef.current);
      return;
    }

    // High-frequency streaming chunks or speech-paced character reveal
    scrollToActiveStreamOrBottom("follow", false);
  }, [chatMessages, isChatLoading, revealedCharsById, speakingMsgId, scrollToActiveStreamOrBottom]);

  // Observe content height growth (e.g., long document generation, animated envelope mount, or wrapping lines) while pinned
  useEffect(() => {
    const contentEl = messagesContentRef.current;
    if (!contentEl || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      if (isAutoScrollPinnedRef.current) {
        scrollToActiveStreamOrBottom("follow", false);
      }
    });

    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [scrollToActiveStreamOrBottom]);

  // Core Legal Summary extraction runner (called only after AI stream has completed and debounce settles, or on manual refresh when idle)
  const runLegalSummaryExtraction = useCallback(
    async (forceAi: boolean = false) => {
      // 1. Update with complete-context local UK statutory extraction
      const instant = extractInstantLegalSummary(chatMessages, locale);
      setLegalSummary(instant);

      // 2. If online and conversation has user/assistant turns, enrich via server Gemini structured extractor
      if (!isOnline || (chatMessages.length <= 1 && !forceAi)) {
        setIsUpdatingSummary(false);
        return;
      }

      if (summaryAbortRef.current) {
        summaryAbortRef.current.abort();
      }
      const controller = new AbortController();
      summaryAbortRef.current = controller;
      setIsUpdatingSummary(true);

      try {
        const aiSummary = await fetchConversationLegalSummaryAI(
          chatMessages,
          locale,
          {
            name: user.fullName,
            employer: user.employerName,
            jobTitle: user.jobTitle,
            hourlyRate: user.hourlyRate,
          },
          controller.signal
        );
        if (!controller.signal.aborted) {
          setLegalSummary(aiSummary);
          setIsUpdatingSummary(false);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setIsUpdatingSummary(false);
        }
      }
    },
    [chatMessages, locale, isOnline, user.fullName, user.employerName, user.jobTitle, user.hourlyRate]
  );

  // Debounced post-stream Legal Summary synchronization:
  // Waits until `isChatLoading` (the AI response stream) is false before starting a 600ms debounce timer
  useEffect(() => {
    // 1. While the AI stream is actively in progress, pause extraction & cancel any pending timers
    if (isChatLoading) {
      if (summaryDebounceTimerRef.current) {
        clearTimeout(summaryDebounceTimerRef.current);
        summaryDebounceTimerRef.current = null;
      }
      if (summaryAbortRef.current) {
        summaryAbortRef.current.abort();
      }
      setIsUpdatingSummary(false);
      return;
    }

    // 2. If chat was cleared back to initial greeting, reset to baseline immediately
    if (chatMessages.length <= 1) {
      if (summaryDebounceTimerRef.current) {
        clearTimeout(summaryDebounceTimerRef.current);
        summaryDebounceTimerRef.current = null;
      }
      summaryAbortRef.current?.abort();
      setLegalSummary(extractInstantLegalSummary(chatMessages, locale));
      setIsUpdatingSummary(false);
      return;
    }

    // 3. AI stream has completed (`!isChatLoading`): perform a debounced (600ms) extraction on the full context
    setIsUpdatingSummary(true);
    if (summaryDebounceTimerRef.current) {
      clearTimeout(summaryDebounceTimerRef.current);
    }

    summaryDebounceTimerRef.current = setTimeout(() => {
      summaryDebounceTimerRef.current = null;
      runLegalSummaryExtraction(false);
    }, 600);

    return () => {
      if (summaryDebounceTimerRef.current) {
        clearTimeout(summaryDebounceTimerRef.current);
        summaryDebounceTimerRef.current = null;
      }
    };
  }, [chatMessages, isChatLoading, locale, runLegalSummaryExtraction]);

  // Cleanup any in-flight request on unmount
  useEffect(() => {
    return () => {
      if (summaryDebounceTimerRef.current) {
        clearTimeout(summaryDebounceTimerRef.current);
      }
      summaryAbortRef.current?.abort();
    };
  }, []);

  // Copy formatted Legal Summary & Deadlines to clipboard
  const handleCopyLegalSummary = () => {
    const rightsBlock = legalSummary.rights
      .map((r, i) => `${i + 1}. ${r.title} (${r.statute})\n   ${r.explanation}`)
      .join("\n\n");
    const deadlinesBlock = legalSummary.deadlines
      .map((d, i) => `${i + 1}. [${d.timeframe}] ${d.label} (${d.authority})\n   ${d.explanation}`)
      .join("\n\n");

    const fullText = `${t("legalSummaryTitle").toUpperCase()} — ask Elon\n\n${
      legalSummary.topicSummary
    }\n\n=== ${t("legalSummaryDeadlinesHeader").toUpperCase()} ===\n${deadlinesBlock}\n\n=== ${t(
      "legalSummaryRightsHeader"
    ).toUpperCase()} ===\n${rightsBlock}`;

    navigator.clipboard?.writeText(fullText);
    showToast(t("legalSummaryCopiedToast"));
  };

  // Navigate directly to a recommended statutory letter template
  const handleOpenTemplate = (templateId: string) => {
    setActiveTemplateId(templateId);
    setActiveTab("templates");
    setIsMobilePanelOpen(false);
  };

  // Snap a character index forward to the end of the current word so words appear cleanly
  const snapToWordEnd = (text: string, index: number, maxIndex: number): number => {
    let i = Math.min(Math.max(0, index), maxIndex);
    while (i < maxIndex && !/\s/.test(text[i])) {
      i++;
    }
    return i;
  };

  // Extract completed sentence/clause segments from raw streaming text
  const enqueueAvailableSegments = useCallback(
    (session: LiveSpeechSession, isStreamDone: boolean) => {
      const { detectedLocale } = detectMessageLanguage(session.fullRawText, locale);

      while (session.queuedRawLength < session.fullRawText.length) {
        const remaining = session.fullRawText.slice(session.queuedRawLength);
        const isFirstSegment = session.segments.length === 0;

        // For the very first segment, split on the first clause or sentence break after 16+ chars so speech starts immediately
        // For subsequent segments, split on sentence endings or line breaks
        const boundaryRegex = isFirstSegment
          ? /^([\s\S]{16,}?(?:[.!?…]+(?=\s|$)|\n+|[,;—–-]\s+))/
          : /^([\s\S]{20,}?(?:[.!?…]+(?=\s|$)|\n+))/;

        const match = remaining.match(boundaryRegex);
        if (match && match[1]) {
          const chunkRaw = match[1];
          const rawStart = session.queuedRawLength;
          const rawEnd = rawStart + chunkRaw.length;
          const spokenText = normalizeLegalTextForSpeech(chunkRaw, detectedLocale);
          session.segments.push({
            rawStart,
            rawEnd,
            rawText: chunkRaw,
            spokenText,
          });
          session.queuedRawLength = rawEnd;
        } else if (isStreamDone) {
          const rawStart = session.queuedRawLength;
          const rawEnd = session.fullRawText.length;
          const chunkRaw = session.fullRawText.slice(rawStart, rawEnd);
          const spokenText = normalizeLegalTextForSpeech(chunkRaw, detectedLocale);
          session.segments.push({
            rawStart,
            rawEnd,
            rawText: chunkRaw,
            spokenText,
          });
          session.queuedRawLength = rawEnd;
          break;
        } else {
          break;
        }
      }
    },
    [locale]
  );

  // Speak the active segment in `liveSpeechRef.current` and synchronize text progression
  const speakActiveSegment = useCallback(() => {
    const session = liveSpeechRef.current;
    if (!session) return;

    // Skip over any empty/whitespace-only segments
    while (
      session.currentSegmentIndex < session.segments.length &&
      session.segments[session.currentSegmentIndex].spokenText.trim().length === 0
    ) {
      const emptySeg = session.segments[session.currentSegmentIndex];
      session.revealedChars = Math.max(session.revealedChars, emptySeg.rawEnd);
      setRevealedCharsById((prev) => ({
        ...prev,
        [session.msgId]: Math.floor(session.revealedChars),
      }));
      session.currentSegmentIndex++;
    }

    if (session.currentSegmentIndex >= session.segments.length) {
      session.isSpeakingSegment = false;
      if (!session.streamActive && session.queuedRawLength >= session.fullRawText.length) {
        // Entire message has finished speaking & revealing
        fullyRevealedMsgIdsRef.current.add(session.msgId);
        setRevealedCharsById((prev) => ({
          ...prev,
          [session.msgId]: session.fullRawText.length,
        }));
        setSpeakingMsgId(null);
        setIsSpeechPaused(false);
        activeUtteranceRef.current = null;
        liveSpeechRef.current = null;
      }
      return;
    }

    const seg = session.segments[session.currentSegmentIndex];
    session.isSpeakingSegment = true;
    session.segmentStartedAt = Date.now();

    // Reveal the first word of the segment right as Elon begins speaking it
    if (session.progressiveReveal && session.revealedChars < seg.rawStart + 1) {
      const firstWordEnd = snapToWordEnd(session.fullRawText, seg.rawStart + 1, seg.rawEnd);
      session.revealedChars = Math.max(session.revealedChars, firstWordEnd);
      setRevealedCharsById((prev) => ({
        ...prev,
        [session.msgId]: Math.floor(session.revealedChars),
      }));
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const { langTag } = detectMessageLanguage(session.fullRawText, locale);
    const utterance = new SpeechSynthesisUtterance(seg.spokenText);
    utterance.lang = langTag;
    utterance.rate = session.rate;

    const voicePool =
      availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const { voice: chosenVoice, isExplicitMale } = pickConfidentMaleVoice(voicePool, langTag);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }
    utterance.pitch = isExplicitMale ? 0.85 : 0.72;
    utterance.volume = 1.0;

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      const active = liveSpeechRef.current;
      if (!active || active.msgId !== session.msgId) return;
      if (typeof event.charIndex === "number" && seg.spokenText.length > 0) {
        const charLen = (event as any).charLength || 5;
        const fraction = Math.min(1, (event.charIndex + charLen) / seg.spokenText.length);
        const mappedRaw = seg.rawStart + Math.ceil(fraction * (seg.rawEnd - seg.rawStart));
        const wordAligned = snapToWordEnd(active.fullRawText, mappedRaw, seg.rawEnd);
        if (wordAligned > active.revealedChars) {
          active.revealedChars = wordAligned;
          setRevealedCharsById((prev) => ({
            ...prev,
            [active.msgId]: Math.floor(active.revealedChars),
          }));
        }
      }
    };

    utterance.onend = () => {
      const active = liveSpeechRef.current;
      if (!active || active.msgId !== session.msgId) return;
      active.revealedChars = Math.max(active.revealedChars, seg.rawEnd);
      setRevealedCharsById((prev) => ({
        ...prev,
        [active.msgId]: Math.floor(active.revealedChars),
      }));
      active.isSpeakingSegment = false;
      active.currentSegmentIndex++;
      speakActiveSegment();
    };

    utterance.onerror = () => {
      const active = liveSpeechRef.current;
      if (!active || active.msgId !== session.msgId) return;
      // On TTS error (e.g. browser audio restriction), keep pacing smoothly via the pacer timer
      active.isSpeakingSegment = true;
    };

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [availableVoices, locale]);

  // Smooth 45ms pacer timer so written words flow in lockstep with Elon's speech
  useEffect(() => {
    if (!speakingMsgId || isSpeechPaused) {
      if (pacerTimerRef.current) {
        clearInterval(pacerTimerRef.current);
        pacerTimerRef.current = null;
      }
      return;
    }

    pacerTimerRef.current = setInterval(() => {
      const session = liveSpeechRef.current;
      if (!session || session.msgId !== speakingMsgId) return;

      const seg = session.segments[session.currentSegmentIndex];
      if (!seg) {
        if (!session.streamActive && session.queuedRawLength >= session.fullRawText.length) {
          fullyRevealedMsgIdsRef.current.add(session.msgId);
          setRevealedCharsById((prev) => ({
            ...prev,
            [session.msgId]: session.fullRawText.length,
          }));
          setSpeakingMsgId(null);
          setIsSpeechPaused(false);
          liveSpeechRef.current = null;
        }
        return;
      }

      // Advance characters smoothly at natural speaking speed (~16 chars/sec * rate)
      const charsPerTick = 0.72 * session.rate;
      if (session.revealedChars < seg.rawEnd) {
        session.revealedChars = Math.min(seg.rawEnd, session.revealedChars + charsPerTick);
        setRevealedCharsById((prev) => ({
          ...prev,
          [session.msgId]: Math.floor(session.revealedChars),
        }));
      }

      // Safety advancement if browser TTS did not fire `onend` after segment completed
      const elapsedMs = Date.now() - session.segmentStartedAt;
      const expectedMs = Math.max(900, (seg.spokenText.length / (14.5 * session.rate)) * 1000);
      const synthSpeaking =
        typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        (window.speechSynthesis.speaking || window.speechSynthesis.pending);

      if (
        session.revealedChars >= seg.rawEnd &&
        ((!synthSpeaking && elapsedMs > 350) || elapsedMs > expectedMs + 1500)
      ) {
        session.isSpeakingSegment = false;
        session.currentSegmentIndex++;
        speakActiveSegment();
      }
    }, 45);

    return () => {
      if (pacerTimerRef.current) {
        clearInterval(pacerTimerRef.current);
        pacerTimerRef.current = null;
      }
    };
  }, [speakingMsgId, isSpeechPaused, speakActiveSegment]);

  // Text-To-Speech (Web Speech API) core playback function
  const startSpeakingMessage = useCallback(
    (text: string, id: string, rateOverride?: number, progressiveReveal: boolean = false) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        showToast(t("speechUnsupported"));
        return;
      }

      window.speechSynthesis.cancel();
      setIsSpeechPaused(false);

      const cleanSpokenSource = stripEmbeddedEnglishLetter(text);
      const effectiveRate = rateOverride ?? speechRateRef.current;
      const session: LiveSpeechSession = {
        msgId: id,
        fullRawText: cleanSpokenSource,
        queuedRawLength: 0,
        segments: [],
        currentSegmentIndex: 0,
        isSpeakingSegment: false,
        segmentStartedAt: Date.now(),
        revealedChars: progressiveReveal ? 0 : cleanSpokenSource.length,
        progressiveReveal,
        streamActive: false,
        rate: effectiveRate,
      };

      if (!progressiveReveal) {
        fullyRevealedMsgIdsRef.current.add(id);
        setRevealedCharsById((prev) => ({ ...prev, [id]: cleanSpokenSource.length }));
      } else {
        fullyRevealedMsgIdsRef.current.delete(id);
        setRevealedCharsById((prev) => ({ ...prev, [id]: 0 }));
      }

      enqueueAvailableSegments(session, true);
      liveSpeechRef.current = session;
      setSpeakingMsgId(id);
      speakActiveSegment();
    },
    [enqueueAvailableSegments, speakActiveSegment, showToast, t]
  );

  // Pause or Resume active speech & synchronized text reveal
  const handlePauseResumeSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !speakingMsgId) return;

    if (isSpeechPaused) {
      window.speechSynthesis.resume();
      if (liveSpeechRef.current) {
        liveSpeechRef.current.segmentStartedAt = Date.now();
      }
      setIsSpeechPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
    }
  };

  // Stop active speech and immediately reveal full written message
  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (liveSpeechRef.current) {
      const stoppedId = liveSpeechRef.current.msgId;
      const fullLen = liveSpeechRef.current.fullRawText.length;
      fullyRevealedMsgIdsRef.current.add(stoppedId);
      setRevealedCharsById((prev) => ({ ...prev, [stoppedId]: fullLen }));
      liveSpeechRef.current = null;
    }
    if (speakingMsgId) {
      fullyRevealedMsgIdsRef.current.add(speakingMsgId);
    }
    setSpeakingMsgId(null);
    setIsSpeechPaused(false);
    activeUtteranceRef.current = null;
  };

  // Cycle playback speed (0.85x -> 1.05x -> 1.25x)
  const handleCycleSpeed = (msgText: string, msgId: string) => {
    const currentIndex = SPEECH_RATES.indexOf(speechRate as any);
    const nextRate = SPEECH_RATES[(currentIndex + 1) % SPEECH_RATES.length];
    setSpeechRate(nextRate);
    speechRateRef.current = nextRate;

    if (speakingMsgId === msgId && liveSpeechRef.current && liveSpeechRef.current.msgId === msgId) {
      liveSpeechRef.current.rate = nextRate;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      liveSpeechRef.current.isSpeakingSegment = false;
      speakActiveSegment();
    } else if (speakingMsgId === msgId) {
      startSpeakingMessage(msgText, msgId, nextRate, false);
    }
  };

  // Automatically start voice reader as soon as Elon begins responding and sync written text with speech
  useEffect(() => {
    if (chatMessages.length === 0) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg.role !== "assistant" || lastMsg.id === "msg_init") return;

    // If autoReadAloud is turned off, reveal full text immediately as it streams
    if (!autoReadAloud) {
      fullyRevealedMsgIdsRef.current.add(lastMsg.id);
      return;
    }

    const cleanLastText = stripEmbeddedEnglishLetter(lastMsg.text);

    // Brand-new AI message starting to arrive
    if (
      lastAutoReadMsgIdRef.current !== lastMsg.id &&
      !fullyRevealedMsgIdsRef.current.has(lastMsg.id)
    ) {
      lastAutoReadMsgIdRef.current = lastMsg.id;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeechPaused(false);

      const session: LiveSpeechSession = {
        msgId: lastMsg.id,
        fullRawText: cleanLastText,
        queuedRawLength: 0,
        segments: [],
        currentSegmentIndex: 0,
        isSpeakingSegment: false,
        segmentStartedAt: Date.now(),
        revealedChars: 0,
        progressiveReveal: true,
        streamActive: isChatLoading,
        rate: speechRateRef.current,
      };

      setRevealedCharsById((prev) => ({ ...prev, [lastMsg.id]: 0 }));
      enqueueAvailableSegments(session, !isChatLoading);
      liveSpeechRef.current = session;
      setSpeakingMsgId(lastMsg.id);
      speakActiveSegment();
      return;
    }

    // Ongoing stream update for the currently speaking AI message
    if (liveSpeechRef.current && liveSpeechRef.current.msgId === lastMsg.id) {
      const session = liveSpeechRef.current;
      session.fullRawText = cleanLastText;
      session.streamActive = isChatLoading;
      enqueueAvailableSegments(session, !isChatLoading);

      if (!session.isSpeakingSegment && session.currentSegmentIndex < session.segments.length) {
        speakActiveSegment();
      }
    }
  }, [chatMessages, isChatLoading, autoReadAloud, enqueueAvailableSegments, speakActiveSegment]);

  const liveTranscribeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLiveTranscribingRef = useRef<boolean>(false);
  const lastTranscribedChunkCountRef = useRef<number>(0);
  const sendAfterTranscribeRef = useRef<boolean>(false);

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = String(reader.result || "");
        const base64 = res.includes(",") ? res.split(",")[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const transcribeAudioBlob = useCallback(
    async (blob: Blob, mimeType: string): Promise<string> => {
      if (blob.size < 300) return "";
      try {
        const base64Audio = await blobToBase64(blob);
        const resp = await fetch("/api/gemini/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType,
            locale,
          }),
        });
        if (!resp.ok) return "";
        const data = await resp.json();
        return String(data?.text || "").trim();
      } catch {
        return "";
      }
    },
    [locale]
  );

  const stopMediaStreams = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (liveTranscribeTimerRef.current) {
      clearInterval(liveTranscribeTimerRef.current);
      liveTranscribeTimerRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMediaStreams();
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, [stopMediaStreams]);

  const stopDictationSession = useCallback(() => {
    setIsDictating(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (liveTranscribeTimerRef.current) {
      clearInterval(liveTranscribeTimerRef.current);
      liveTranscribeTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        stopMediaStreams();
      }
    } else {
      stopMediaStreams();
    }
  }, [stopMediaStreams]);

  const handleSend = () => {
    if (isDictating) {
      // If the user taps Send while actively recording, stop recording and auto-send once final transcription completes
      sendAfterTranscribeRef.current = true;
      stopDictationSession();
      return;
    }
    if (!chatDraft.trim() || isChatLoading) return;
    isAutoScrollPinnedRef.current = true;
    setIsAutoScrollPinned(true);
    const textToSend = chatDraft;
    sendChatMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Safe, iframe-friendly Voice Recording:
  // Uses pure in-browser MediaRecorder + /api/gemini/transcribe (without triggering OS SpeechRecognition overlays/conflicts that steal iframe focus on mobile)
  const toggleDictation = async () => {
    if (isDictating) {
      sendAfterTranscribeRef.current = false;
      stopDictationSession();
      return;
    }

    // Stop Elon's TTS if he is currently speaking so the mic records the user cleanly
    if (speakingMsgId) {
      try {
        handleStopSpeech();
      } catch {
        // ignore
      }
    }

    const canRecordMedia =
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
      typeof MediaRecorder !== "undefined";

    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!canRecordMedia && !SpeechRecognition) {
      showToast(
        locale === "pl"
          ? "Twoja przeglądarka nie wspiera nagrywania głosu."
          : locale === "ro"
          ? "Browserul tău nu suportă înregistrarea vocală."
          : "Your browser does not support voice recording."
      );
      return;
    }

    dictationBaseDraftRef.current = chatDraft.trim();
    speechProducedTextRef.current = false;
    lastTranscribedChunkCountRef.current = 0;
    sendAfterTranscribeRef.current = false;

    // PRIMARY ENGINE: Pure in-browser MediaRecorder (never conflicts with OS SpeechRecognizer or exits mobile preview iframe)
    if (canRecordMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        mediaStreamRef.current = stream;
        audioChunksRef.current = [];
        setRecordingSeconds(0);
        setIsDictating(true);

        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        const preferredMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";

        const recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        // Live progressive transcription while speaking (every 2.8 seconds)
        liveTranscribeTimerRef.current = setInterval(async () => {
          if (
            isLiveTranscribingRef.current ||
            audioChunksRef.current.length === 0 ||
            audioChunksRef.current.length === lastTranscribedChunkCountRef.current
          ) {
            return;
          }
          isLiveTranscribingRef.current = true;
          const snapshotCount = audioChunksRef.current.length;
          const mimeType = recorder.mimeType || preferredMime || "audio/webm";
          const snapshotBlob = new Blob([...audioChunksRef.current], { type: mimeType });

          try {
            const partialText = await transcribeAudioBlob(snapshotBlob, mimeType);
            if (partialText) {
              lastTranscribedChunkCountRef.current = snapshotCount;
              speechProducedTextRef.current = true;
              const prefix = dictationBaseDraftRef.current;
              setChatDraft(prefix ? `${prefix} ${partialText}` : partialText);
            }
          } finally {
            isLiveTranscribingRef.current = false;
          }
        }, 2800);

        recorder.onstop = async () => {
          const mimeType = recorder.mimeType || preferredMime || "audio/webm";
          const chunks = [...audioChunksRef.current];
          audioChunksRef.current = [];
          stopMediaStreams();
          mediaRecorderRef.current = null;

          if (chunks.length === 0) {
            sendAfterTranscribeRef.current = false;
            return;
          }

          const fullBlob = new Blob(chunks, { type: mimeType });
          if (fullBlob.size < 300) {
            sendAfterTranscribeRef.current = false;
            return;
          }

          setIsTranscribing(true);
          try {
            const finalText = await transcribeAudioBlob(fullBlob, mimeType);
            const prefix = dictationBaseDraftRef.current;
            const combined = finalText
              ? prefix
                ? `${prefix} ${finalText}`
                : finalText
              : chatDraft.trim();

            if (combined) {
              setChatDraft(combined);
              if (sendAfterTranscribeRef.current) {
                sendAfterTranscribeRef.current = false;
                isAutoScrollPinnedRef.current = true;
                setIsAutoScrollPinned(true);
                sendChatMessage(combined);
              }
            }
          } finally {
            sendAfterTranscribeRef.current = false;
            setIsTranscribing(false);
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(400);
        return;
      } catch (err: any) {
        stopMediaStreams();
        setIsDictating(false);
        showToast(
          locale === "pl"
            ? "Brak dostępu do mikrofonu — zezwól na mikrofon w przeglądarce."
            : locale === "ro"
            ? "Accesul la microfon este blocat — permite microfonul în browser."
            : "Microphone access denied — please allow microphone access in your browser."
        );
        return;
      }
    }

    // FALLBACK ENGINE: Only used if MediaRecorder is not available in the browser
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = locale === "pl" ? "pl-PL" : locale === "ro" ? "ro-RO" : "en-GB";
        recognition.continuous = false;
        recognition.interimResults = true;

        setRecordingSeconds(0);
        setIsDictating(true);
        recordingTimerRef.current = setInterval(() => {
          setRecordingSeconds((prev) => prev + 1);
        }, 1000);

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + " ";
          }
          const spoken = transcript.trim();
          if (spoken) {
            const prefix = dictationBaseDraftRef.current;
            setChatDraft(prefix ? `${prefix} ${spoken}` : spoken);
          }
        };

        recognition.onerror = () => {
          stopDictationSession();
        };

        recognition.onend = () => {
          setIsDictating(false);
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        stopDictationSession();
      }
    }
  };

  const totalExtractedCount = legalSummary.rights.length + legalSummary.deadlines.length;

  const recommendedTemplatesList = legalSummary.recommendedTemplateIds
    .map((id) => templates.find((tpl) => tpl.id === id))
    .filter(Boolean);

  // Group the 10 most recent unsaved conversations by date (dateISO)
  const groupedUnsavedChats = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const yesterdayISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const groupsMap = new Map<
      string,
      { dateISO: string; displayDate: string; items: RecentUnsavedChat[] }
    >();

    recentUnsavedChats.slice(0, 10).forEach((chat) => {
      const key = chat.dateISO || todayISO;
      if (!groupsMap.has(key)) {
        let displayDate = chat.dateLabel || key;
        if (key === todayISO) {
          displayDate =
            locale === "pl"
              ? `Dzisiaj · ${chat.dateLabel}`
              : locale === "ro"
              ? `Astăzi · ${chat.dateLabel}`
              : `Today · ${chat.dateLabel}`;
        } else if (key === yesterdayISO) {
          displayDate =
            locale === "pl"
              ? `Wczoraj · ${chat.dateLabel}`
              : locale === "ro"
              ? `Ieri · ${chat.dateLabel}`
              : `Yesterday · ${chat.dateLabel}`;
        }
        groupsMap.set(key, { dateISO: key, displayDate, items: [] });
      }
      groupsMap.get(key)!.items.push(chat);
    });

    return Array.from(groupsMap.values());
  }, [recentUnsavedChats, locale]);

  // Topic icon & badge styling helper for each unsaved conversation item
  const renderUnsavedChatIcon = (iconType: UnsavedChatIconType) => {
    switch (iconType) {
      case "wages":
        return {
          icon: <Banknote className="w-4 h-4 text-[#FBBF24]" />,
          bg: "bg-[#FBBF24]/15 border-[#FBBF24]/40",
          label: locale === "pl" ? "Płace" : "Wages",
        };
      case "grievance":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-[#FF6A00]" />,
          bg: "bg-[#FF6A00]/15 border-[#FF6A00]/40",
          label: locale === "pl" ? "Skarga" : "Grievance",
        };
      case "sick_pay":
        return {
          icon: <HeartPulse className="w-4 h-4 text-[#A78BFA]" />,
          bg: "bg-[#A78BFA]/15 border-[#A78BFA]/40",
          label: "SSP",
        };
      case "dismissal":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-[#EF4444]" />,
          bg: "bg-[#EF4444]/15 border-[#EF4444]/40",
          label: locale === "pl" ? "Zwolnienie" : "Dismissal",
        };
      case "contract":
        return {
          icon: <Briefcase className="w-4 h-4 text-[#38BDF8]" />,
          bg: "bg-[#38BDF8]/15 border-[#38BDF8]/40",
          label: locale === "pl" ? "Umowa" : "Contract",
        };
      case "settlement":
        return {
          icon: <Scale className="w-4 h-4 text-[#2EE59D]" />,
          bg: "bg-[#2EE59D]/15 border-[#2EE59D]/40",
          label: locale === "pl" ? "Ugoda" : "Settlement",
        };
      case "data":
        return {
          icon: <Database className="w-4 h-4 text-[#34D399]" />,
          bg: "bg-[#34D399]/15 border-[#34D399]/40",
          label: "GDPR",
        };
      default:
        return {
          icon: <MessageSquare className="w-4 h-4 text-[#2EE59D]" />,
          bg: "bg-[#2EE59D]/15 border-[#2EE59D]/35",
          label: locale === "pl" ? "Rozmowa" : "Chat",
        };
    }
  };

  // Reusable Side-Panel Content (10 Recent Unsaved Conversations History + Legal Summary)
  const renderLegalSummaryContent = (isMobileDrawer: boolean = false) => (
    <div className="flex flex-col h-full bg-[#0B2038] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      {/* Side-Panel Header */}
      <div className="px-4 py-3 bg-[#0F2C4D] border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0B6E4F]/30 border border-[#2EE59D]/40 flex items-center justify-center text-[#2EE59D] shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold text-white tracking-tight truncate">
              {locale === "pl"
                ? "Historia Rozmów i Analiza Prawna"
                : locale === "ro"
                ? "Istoric Conversații & Analiză"
                : "Recent Chats & Legal Summary"}
            </h3>
            <p className="text-[11px] text-[#BACADA] truncate flex items-center gap-1.5">
              {isChatLoading ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-pulse shrink-0" />
                  <span className="text-[#FF6A00] font-medium truncate">
                    {t("waitingForStreamBadge")}
                  </span>
                </>
              ) : isUpdatingSummary ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2EE59D] animate-pulse shrink-0" />
                  <span className="text-[#2EE59D] font-medium truncate">
                    {t("analyzingContextBadge")}
                  </span>
                </>
              ) : (
                <span>
                  {locale === "pl"
                    ? `Auto-zapis 10 ostatnich rozmów (${recentUnsavedChats.length}/10)`
                    : `Auto-saved last 10 unsaved chats (${recentUnsavedChats.length}/10)`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={isChatLoading}
            onClick={() => runLegalSummaryExtraction(true)}
            title={t("refreshLegalSummary")}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-[#BACADA] hover:text-[#2EE59D] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingSummary ? "animate-spin text-[#2EE59D]" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleCopyLegalSummary}
            title={t("copyLegalSummary")}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {isMobileDrawer ? (
            <button
              type="button"
              onClick={() => setIsMobilePanelOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
              aria-label="Close Legal Summary"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDesktopPanelOpen(false)}
              title="Hide Legal Summary"
              className="hidden lg:inline-flex p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* SECTION 0: HISTORY OF 10 MOST RECENT UNSAVED CONVERSATIONS (GROUPED BY DATES & ICONS) */}
        <div className="rounded-2xl bg-[#0F2C4D]/90 border border-[#FF6A00]/40 p-3 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#FF6A00]" />
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-white">
                {locale === "pl"
                  ? "Ostatnie niezapisane rozmowy"
                  : locale === "ro"
                  ? "Ultimele conversații nesalvate"
                  : "Recent Unsaved Conversations"}
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#FF6A00]/20 border border-[#FF6A00]/40 text-[10px] font-mono font-extrabold text-[#FF9E58]">
              {recentUnsavedChats.length}/10
            </span>
          </div>

          <p className="text-[10px] text-[#BACADA] leading-snug">
            {locale === "pl"
              ? "Niezapisane rozmowy zapisują się tu automatycznie w trakcie czatu, po resecie oraz przy wyjściu z aplikacji."
              : "Unsaved chats are automatically stored here on reset and when exiting the app."}
          </p>

          {groupedUnsavedChats.length > 0 ? (
            <div className="space-y-3 pt-1">
              {groupedUnsavedChats.map((group) => (
                <div key={group.dateISO} className="space-y-1.5">
                  {/* Date Group Header */}
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#2EE59D] px-1">
                    <Calendar className="w-3 h-3 text-[#FF6A00] shrink-0" />
                    <span>{group.displayDate}</span>
                  </div>

                  {/* Conversation Items under this Date */}
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const iconMeta = renderUnsavedChatIcon(item.iconType);
                      const isActiveSession = item.id === activeUnsavedChatId;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            handleStopSpeech();
                            item.messages.forEach((m) =>
                              fullyRevealedMsgIdsRef.current.add(m.id)
                            );
                            restoreUnsavedChat(item.id);
                            if (isMobileDrawer) setIsMobilePanelOpen(false);
                          }}
                          className={`group rounded-xl p-2.5 border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                            isActiveSession
                              ? "bg-[#143A66] border-[#2EE59D]/60 shadow-sm"
                              : "bg-[#0B2038]/85 hover:bg-[#12304F] border-white/10 hover:border-[#FF6A00]/50"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* Topic Icon Badge */}
                            <div
                              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconMeta.bg}`}
                              title={iconMeta.label}
                            >
                              {iconMeta.icon}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/5 text-[#BACADA] border border-white/10">
                                  {iconMeta.label}
                                </span>
                                <span className="text-[10px] font-mono text-[#BACADA]/80">
                                  {item.updatedAtTime}
                                </span>
                                {isActiveSession && (
                                  <span className="text-[9px] font-extrabold text-[#2EE59D]">
                                    • Aktywna
                                  </span>
                                )}
                              </div>

                              <div className="text-xs font-bold text-white group-hover:text-[#2EE59D] transition-colors truncate mt-0.5">
                                {item.title}
                              </div>

                              <p className="text-[10px] text-[#BACADA] line-clamp-1 mt-0.5">
                                {item.preview}
                              </p>
                            </div>
                          </div>

                          {/* Quick Save as Case & Remove Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveUnsavedChatAsCase(item.id);
                              }}
                              title={t("saveAsCase")}
                              aria-label={t("saveAsCase")}
                              className="p-1.5 rounded-lg bg-[#0B6E4F]/30 hover:bg-[#0B6E4F] border border-[#2EE59D]/30 text-[#2EE59D] hover:text-white transition-colors cursor-pointer"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUnsavedChat(item.id);
                              }}
                              title="Usuń z historii"
                              aria-label="Usuń z historii"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#EF4444]/25 text-[#BACADA] hover:text-[#FF8A8A] transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-[11px] text-[#BACADA]/70">
              {locale === "pl"
                ? "Brak niezapisanych rozmów w historii."
                : "No unsaved conversations in history."}
            </div>
          )}
        </div>
        {/* Contextual Summary Digest */}
        <div className="rounded-xl bg-[#0F2C4D]/90 border border-white/10 p-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#BACADA] mb-1">
            <span className="font-semibold text-[#2EE59D]">
              {legalSummary.isBaseline ? "ACAS · ERA 1996" : "Active Context Analysis"}
            </span>
            <span className="font-mono tabular-nums text-[10px] text-[#BACADA]/80">
              {legalSummary.updatedAt}
            </span>
          </div>
          <p className="text-xs text-[#F4F8FB] leading-relaxed">{legalSummary.topicSummary}</p>
        </div>

        {/* SECTION 1: STATUTORY DEADLINES & TIME LIMITS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-[#FF6A00]" />
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#BACADA]">
                {t("legalSummaryDeadlinesHeader")}
              </h4>
            </div>
            <span className="text-[11px] font-mono tabular-nums font-bold text-[#FF6A00]">
              {legalSummary.deadlines.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {legalSummary.deadlines.map((dl) => {
              const isCritical = dl.urgency === "critical";
              const isImportant = dl.urgency === "important";
              const urgencyText = isCritical
                ? t("urgencyCritical")
                : isImportant
                ? t("urgencyImportant")
                : t("urgencyStandard");

              return (
                <div
                  key={dl.id}
                  className={`rounded-xl p-3 border transition-colors ${
                    isCritical
                      ? "bg-[#1A1423] border-[#EF4444]/40"
                      : isImportant
                      ? "bg-[#0F2C4D] border-[#FF6A00]/35"
                      : "bg-[#0F2C4D]/80 border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white leading-snug">{dl.label}</span>
                    <span
                      className={`font-mono tabular-nums text-xs font-extrabold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md border ${
                        isCritical
                          ? "bg-[#EF4444]/20 border-[#EF4444]/50 text-[#FF8A8A]"
                          : isImportant
                          ? "bg-[#FF6A00]/20 border-[#FF6A00]/50 text-[#FFB074]"
                          : "bg-[#0B6E4F]/25 border-[#2EE59D]/30 text-[#2EE59D]"
                      }`}
                    >
                      {dl.timeframe}
                    </span>
                  </div>

                  {/* Unboxed Metadata Line with middle-dot separator */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#BACADA] mb-1.5">
                    {isCritical && <AlertTriangle className="w-3 h-3 text-[#EF4444] shrink-0" />}
                    <span
                      className={
                        isCritical
                          ? "font-semibold text-[#FF8A8A]"
                          : isImportant
                          ? "font-semibold text-[#FF6A00]"
                          : "font-semibold text-[#2EE59D]"
                      }
                    >
                      {urgencyText}
                    </span>
                    <span>·</span>
                    <span className="truncate">{dl.authority}</span>
                  </div>

                  <p className="text-[11px] text-[#BACADA] leading-relaxed">{dl.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: KEY UK STATUTORY RIGHTS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2EE59D]" />
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#BACADA]">
                {t("legalSummaryRightsHeader")}
              </h4>
            </div>
            <span className="text-[11px] font-mono tabular-nums font-bold text-[#2EE59D]">
              {legalSummary.rights.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {legalSummary.rights.map((right) => (
              <div
                key={right.id}
                className="rounded-xl bg-[#0F2C4D] border border-white/10 p-3 hover:border-[#2EE59D]/30 transition-colors"
              >
                <h5 className="text-xs font-bold text-white leading-snug mb-1">{right.title}</h5>
                <div className="text-[11px] font-mono text-[#2EE59D] mb-1.5">{right.statute}</div>
                <p className="text-[11px] text-[#BACADA] leading-relaxed">{right.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: RECOMMENDED STATUTORY LETTERS */}
        {recommendedTemplatesList.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-[#FF6A00]" />
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#BACADA]">
                {t("legalSummaryActionsHeader")}
              </h4>
            </div>

            <div className="space-y-2">
              {recommendedTemplatesList.map((tpl) => {
                if (!tpl) return null;
                const tplTitle =
                  locale === "pl" ? tpl.titlePl : locale === "ro" ? tpl.titleRo : tpl.titleEn;

                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleOpenTemplate(tpl.id)}
                    className="w-full text-left rounded-xl bg-[#12304F] hover:bg-[#163a5f] border border-white/10 hover:border-[#FF6A00]/50 p-2.5 flex items-center justify-between gap-2 transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-[#FF6A00] transition-colors truncate">
                        {tplTitle}
                      </div>
                      <div className="text-[10px] font-mono text-[#BACADA] truncate mt-0.5">
                        {tpl.statutoryReference}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#BACADA] group-hover:text-[#FF6A00] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Side-Panel Footer Action */}
      {chatMessages.length > 1 && (
        <div className="p-3 bg-[#0F2C4D] border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              saveCurrentChatAsCase();
              if (isMobileDrawer) setIsMobilePanelOpen(false);
            }}
            className="w-full py-2 px-3 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 border border-[#2EE59D]/30 text-xs font-extrabold text-white flex items-center justify-center gap-2 transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-[#2EE59D]" />
            <span>{t("saveAsCase")}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 min-h-0 h-full w-full flex flex-col lg:flex-row max-w-7xl mx-auto px-2 sm:px-4 pb-1 gap-3 sm:gap-4 relative overflow-hidden">
      {/* LEFT / MAIN COLUMN: Chat Stream & Hard-Pinned Composer */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        {/* Top Bar inside Chat */}
        <div className="shrink-0 flex items-center justify-between py-2 border-b border-white/10 mb-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 ${
                isOnline
                  ? "bg-[#0B6E4F]/20 border-[#2EE59D]/30 text-[#2EE59D]"
                  : "bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]"
              }`}
            >
              {isOnline ? (
                <span className="w-2 h-2 rounded-full bg-[#2EE59D]"></span>
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-[#EF4444]" />
              )}
              <span>
                {networkStatus === "reconnecting"
                  ? t("netReconnecting")
                  : isOnline
                  ? t("online")
                  : t("netOffline")}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextVal = !autoReadAloud;
                setAutoReadAloud(nextVal);
                if (!nextVal && speakingMsgId) {
                  handleStopSpeech();
                }
              }}
              aria-pressed={autoReadAloud}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                autoReadAloud
                  ? "bg-[#FF6A00]/20 border-[#FF6A00]/40 text-[#FF6A00]"
                  : "bg-white/5 border-white/10 text-[#BACADA] hover:text-white"
              }`}
              title={t("autoRead")}
            >
              {autoReadAloud ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{t("autoRead")}</span>
            </button>

            {chatDraft.trim().length > 0 && (
              <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-[#BACADA] whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3 text-[#2EE59D]" />
                <span>{t("draftAutoSaved")}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile / Tablet Legal Summary Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobilePanelOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0F2C4D] hover:bg-[#12304F] border border-[#2EE59D]/35 text-xs font-bold text-[#2EE59D] transition-colors whitespace-nowrap shrink-0"
            >
              <Scale className="w-3.5 h-3.5 shrink-0" />
              <span>{t("legalSummaryBtn")}</span>
              <span className="font-mono tabular-nums text-[11px] px-1.5 py-0.2 rounded bg-[#0B6E4F]/40 text-white">
                {totalExtractedCount}
              </span>
            </button>

            {/* Desktop Toggle Legal Summary Button */}
            <button
              type="button"
              onClick={() => setIsDesktopPanelOpen(!isDesktopPanelOpen)}
              aria-pressed={isDesktopPanelOpen}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                isDesktopPanelOpen
                  ? "bg-[#0F2C4D] border-[#2EE59D]/40 text-[#2EE59D]"
                  : "bg-white/5 border-white/10 text-[#BACADA] hover:text-white"
              }`}
              title={t("legalSummaryTitle")}
            >
              {isDesktopPanelOpen ? (
                <PanelRightClose className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <PanelRightOpen className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{t("legalSummaryBtn")}</span>
              <span className="font-mono tabular-nums text-[11px] text-[#FF6A00]">
                · {totalExtractedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Contextual Offline Protection Alert Banner during Chat */}
        {!isOnline && (
          <div className="shrink-0 mb-3 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] shrink-0 mt-0.5">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-extrabold text-white">
                    {t("chatOfflineBannerTitle")}
                  </h4>
                  {queuedMessagesCount > 0 && (
                    <span className="text-[11px] font-mono tabular-nums font-bold text-[#FF6A00]">
                      · {queuedMessagesCount} queued
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#BACADA] leading-relaxed mt-0.5">
                  {t("chatOfflineBannerSub")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  if (isSimulatedOffline) {
                    setIsSimulatedOffline(false);
                  } else {
                    const ok = await checkConnectionNow();
                    if (ok && queuedMessagesCount > 0) {
                      retryQueuedMessages();
                    }
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12304F] hover:bg-[#163a5f] border border-white/15 text-xs font-bold text-[#2EE59D] transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {isSimulatedOffline ? t("netRestoreOnline") : t("netCheckNow")}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Messages Stream (Scrolls independently above the hard-pinned composer) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScrollContainer}
          className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2"
        >
          <div ref={messagesContentRef} className="space-y-3.5 pb-2">
          {chatMessages.map((msg, idx) => {
            const isAI = msg.role === "assistant";
            const isQueued = msg.status === "queued";
            const isSending = msg.status === "sending";
            const isCurrentSpeaking = isAI && speakingMsgId === msg.id;
            const isActivelyStreaming =
              isAI && isChatLoading && idx === chatMessages.length - 1 && msg.id !== "msg_init";
            const isProgressiveRevealing =
              isAI &&
              msg.id !== "msg_init" &&
              !fullyRevealedMsgIdsRef.current.has(msg.id) &&
              (isCurrentSpeaking || isActivelyStreaming) &&
              autoReadAloud;
            const cleanNativeMsgText = isAI ? stripEmbeddedEnglishLetter(msg.text) : msg.text;
            const revealedCount = revealedCharsById[msg.id] ?? 0;
            const displayedText = isProgressiveRevealing
              ? cleanNativeMsgText.slice(0, Math.min(cleanNativeMsgText.length, Math.max(1, revealedCount)))
              : cleanNativeMsgText;

            // Find preceding user message for context when generating the personalized English letter
            const prevUserMsg =
              isAI && idx > 0
                ? chatMessages
                    .slice(0, idx)
                    .reverse()
                    .find((m) => m.role === "user")?.text || ""
                : "";

            // Show the animated English Letter Envelope after Elon finishes responding & speaking on a real user question turn
            const isConversationTurnFinished =
              isAI &&
              msg.id !== "msg_init" &&
              !msg.id.startsWith("msg_reset_") &&
              !msg.id.startsWith("msg_sys_") &&
              !msg.isSystemBroadcast &&
              prevUserMsg.trim().length > 0 &&
              !isActivelyStreaming &&
              !isCurrentSpeaking;

            const generatedLetter = isConversationTurnFinished
              ? buildPersonalizedEnglishLetterForChat(prevUserMsg, msg.text, user)
              : null;

            return (
              <div
                key={msg.id}
                ref={isCurrentSpeaking || isActivelyStreaming ? activeMessageRef : undefined}
                className={`flex flex-col ${isAI ? "items-start" : "items-end"} gap-2.5`}
              >
                <div
                  className={`${
                    isAI ? "w-full sm:max-w-[97%]" : "max-w-[92%] sm:max-w-[85%]"
                  } rounded-2xl px-4 py-3 shadow-md transition-all duration-300 ${
                    msg.isSystemBroadcast
                      ? "bg-gradient-to-r from-[#2B1608] via-[#122C4A] to-[#0F2C4D] border-2 border-[#FF6A00]/70 text-[#F4F8FB]"
                      : isAI
                      ? isCurrentSpeaking
                        ? isSpeechPaused
                          ? "bg-[#112C4A] border-2 border-[#2EE59D]/80 text-[#F4F8FB] shadow-[0_0_20px_rgba(46,229,157,0.2)]"
                          : "bg-[#123258] border-2 border-[#FF6A00] text-[#F4F8FB] glow-orange"
                        : "bg-[#0F2C4D] border border-white/10 text-[#F4F8FB]"
                      : isQueued
                      ? "bg-[#143A66]/80 border border-[#FF6A00]/50 text-white rounded-tr-none"
                      : "bg-[#143A66] border border-[#2EE59D]/20 text-white rounded-tr-none"
                  }`}
                >
                  {/* Header inside bubble */}
                  <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] text-[#BACADA]">
                    <div className="flex items-center gap-2 flex-wrap">
                      {msg.isSystemBroadcast ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FF6A00]/20 border border-[#FF6A00]/50 text-[#FF6A00] font-extrabold text-[10px] uppercase tracking-wider">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{msg.senderLabel || "ADMIN HUB · KOMUNIKAT SYSTEMOWY"}</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-[#2EE59D]">
                          {isAI ? "Elon" : user.fullName || "Ty"}
                        </span>
                      )}

                      {/* Animated 5-Bar Audio Wave Indicator when speaking this bubble */}
                      {isCurrentSpeaking && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${
                            isSpeechPaused
                              ? "bg-[#2EE59D]/15 border-[#2EE59D]/40 text-[#2EE59D]"
                              : "bg-[#FF6A00]/20 border-[#FF6A00]/50 text-[#FF6A00]"
                          }`}
                          aria-live="polite"
                        >
                          <span className="inline-flex items-center gap-0.5 h-3" aria-hidden="true">
                            {[1, 2, 3, 4, 5].map((bar) => (
                              <span
                                key={bar}
                                className={`w-0.5 h-3 rounded-full origin-bottom transition-transform ${
                                  isSpeechPaused
                                    ? "bg-[#2EE59D] scale-y-50"
                                    : `bg-[#FF6A00] audio-wave-bar-${bar}`
                                }`}
                              />
                            ))}
                          </span>
                          <span>
                            {isSpeechPaused ? t("speechPaused") : t("speakingNow")}
                          </span>
                        </span>
                      )}
                    </div>

                    <span className="font-mono tabular-nums shrink-0">{msg.timestamp}</span>
                  </div>

                  {/* Message Body synchronized with Elon's speech (strictly in user's native language) */}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-normal">
                    {displayedText}
                    {(isActivelyStreaming || (isCurrentSpeaking && !isSpeechPaused && isProgressiveRevealing)) && (
                      <span
                        className="inline-block w-1.5 h-4 ml-1 align-middle bg-[#2EE59D] animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* Read Aloud Control Bar for AI Messages (Always visible at the bottom of the bubble during streaming & speaking) */}
                  {isAI && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Play / Pause Toggle Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!isCurrentSpeaking) {
                              startSpeakingMessage(cleanNativeMsgText, msg.id);
                            } else {
                              handlePauseResumeSpeech();
                            }
                          }}
                          aria-label={
                            !isCurrentSpeaking
                              ? `${t("listen")} — Elon`
                              : isSpeechPaused
                              ? t("resumeListen")
                              : t("pauseListen")
                          }
                          aria-pressed={isCurrentSpeaking && !isSpeechPaused}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 ${
                            isCurrentSpeaking
                              ? isSpeechPaused
                                ? "bg-[#2EE59D] text-black shadow-[0_0_12px_rgba(46,229,157,0.35)]"
                                : "bg-[#FF6A00] text-black shadow-[0_0_12px_rgba(255,106,0,0.4)]"
                              : "bg-[#12304F] hover:bg-[#163a5f] border border-[#2EE59D]/35 text-[#2EE59D] hover:text-white"
                          }`}
                        >
                          {!isCurrentSpeaking ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                              <span>{t("listen")}</span>
                            </>
                          ) : isSpeechPaused ? (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                              <span>{t("resumeListen")}</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
                              <span>{t("pauseListen")}</span>
                            </>
                          )}
                        </button>

                        {/* Stop Button */}
                        <button
                          type="button"
                          onClick={handleStopSpeech}
                          disabled={!isCurrentSpeaking}
                          aria-label={t("stopListen")}
                          title={t("stopListen")}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                            isCurrentSpeaking
                              ? "bg-white/10 hover:bg-[#EF4444]/20 border-white/15 hover:border-[#EF4444]/40 text-white hover:text-[#EF4444] cursor-pointer"
                              : "bg-white/5 border-white/10 text-[#BACADA]/40 cursor-not-allowed"
                          }`}
                        >
                          <Square className="w-3 h-3 fill-current shrink-0" />
                          <span>{t("stopListen")}</span>
                        </button>

                        {/* Inline Animated Audio Wave Indicator on Bottom Control Bar (Visible on mobile & desktop while speaking) */}
                        {isCurrentSpeaking && (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070F1A]/75 border border-[#FF6A00]/40"
                            aria-hidden="true"
                          >
                            <Volume2
                              className={`w-3.5 h-3.5 ${
                                isSpeechPaused ? "text-[#2EE59D]" : "text-[#FF6A00]"
                              }`}
                            />
                            <div className="flex items-center gap-0.5 h-3">
                              {[1, 2, 3, 4, 5].map((bar) => (
                                <span
                                  key={bar}
                                  className={`w-0.5 h-3 rounded-full origin-bottom ${
                                    isSpeechPaused
                                      ? "bg-[#2EE59D] scale-y-40"
                                      : `bg-[#FF6A00] audio-wave-bar-${bar}`
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] font-extrabold text-[#F4F8FB]">
                              {isSpeechPaused ? t("speechPaused") : t("speakingNow")}
                            </span>
                          </div>
                        )}

                        {/* Live Document Generation / Stream Indicator when generating long documents */}
                        {isActivelyStreaming && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B6E4F]/25 border border-[#2EE59D]/40 text-[10px] font-extrabold text-[#2EE59D]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2EE59D] animate-ping" />
                            <span>
                              {locale === "pl"
                                ? "Generowanie odpowiedzi i pisma..."
                                : locale === "ro"
                                ? "Se generează răspunsul și documentul..."
                                : "Generating response & legal document..."}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Speed Adjustment Control */}
                      <button
                        type="button"
                        onClick={() => handleCycleSpeed(cleanNativeMsgText, msg.id)}
                        title={t("speechSpeed")}
                        aria-label={`${t("speechSpeed")}: ${speechRate}x`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono tabular-nums font-bold text-[#BACADA] hover:text-white transition-colors whitespace-nowrap shrink-0"
                      >
                        <Gauge className="w-3.5 h-3.5 text-[#2EE59D] shrink-0" />
                        <span>{speechRate}x</span>
                      </button>
                    </div>
                  )}

                  {/* Queued / Syncing Footer for Offline Messages */}
                  {(isQueued || isSending) && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 text-[#FF6A00] font-semibold">
                        {isSending ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>
                          {isSending ? t("msgSendingBadge") : t("msgQueuedBadge")}
                        </span>
                      </span>

                      {isQueued && isOnline && (
                        <button
                          type="button"
                          onClick={retryQueuedMessages}
                          className="px-2 py-0.5 rounded bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 text-white font-bold text-[10px] transition-colors whitespace-nowrap shrink-0"
                        >
                          {t("retryNowBtn")}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Animated Appearing Envelope with Personalized English Document Preview, Save & Copy */}
                {isConversationTurnFinished && generatedLetter && (
                  <div className="w-full sm:max-w-[97%] envelope-card-enter rounded-2xl bg-gradient-to-br from-[#0F2C4D] via-[#12335A] to-[#0B2038] border-2 border-[#FF6A00]/60 shadow-[0_10px_28px_rgba(0,0,0,0.45)] overflow-hidden">
                    {/* Top Envelope Header with Animated Opening Envelope Graphic */}
                    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B2038]/80 border-b border-white/10">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Animated SVG Envelope with Rising Letter */}
                        <div className="relative w-14 h-14 rounded-2xl bg-[#143A66] border border-[#FF6A00]/50 flex items-center justify-center shrink-0 envelope-badge-float shadow-inner">
                          <svg
                            viewBox="0 0 64 64"
                            className="w-11 h-11 overflow-visible"
                            aria-hidden="true"
                          >
                            {/* Back of envelope */}
                            <rect
                              x="6"
                              y="20"
                              width="52"
                              height="36"
                              rx="5"
                              fill="#163A5F"
                              stroke="#FF6A00"
                              strokeWidth="2"
                            />
                            {/* Rising paper document inside envelope */}
                            <g className="envelope-paper-anim">
                              <rect
                                x="13"
                                y="10"
                                width="38"
                                height="32"
                                rx="3"
                                fill="#FFF6EF"
                                stroke="#2EE59D"
                                strokeWidth="1.5"
                              />
                              <line
                                x1="18"
                                y1="17"
                                x2="36"
                                y2="17"
                                stroke="#FF6A00"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                              />
                              <line
                                x1="18"
                                y1="23"
                                x2="45"
                                y2="23"
                                stroke="#0F2C4D"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                              <line
                                x1="18"
                                y1="28"
                                x2="42"
                                y2="28"
                                stroke="#0F2C4D"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                              />
                            </g>
                            {/* Envelope front pocket */}
                            <path
                              d="M6 22 L32 40 L58 22 L58 51 C58 53.76 55.76 56 53 56 L11 56 C8.24 56 6 53.76 6 51 Z"
                              fill="#0F2C4D"
                              stroke="#FF6A00"
                              strokeWidth="2"
                            />
                            {/* Envelope top flap opening animation */}
                            <path
                              d="M6 22 L32 6 L58 22 Z"
                              fill="#FF6A00"
                              fillOpacity="0.88"
                              stroke="#FF6A00"
                              strokeWidth="1.5"
                              className="envelope-flap-anim"
                            />
                          </svg>
                          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-[#2EE59D] text-[#070F1A] font-extrabold text-[9px] tracking-wider uppercase shadow">
                            EN
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2EE59D] flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-[#FF6A00]" />
                              {locale === "pl"
                                ? "Gotowe Pismo Urzędowe (Język Angielski)"
                                : locale === "ro"
                                ? "Scrisoare Oficială Pregătită (Limba Engleză)"
                                : "Official UK Legal Letter Ready (English)"}
                            </span>
                            <span className="text-[10px] font-mono text-[#BACADA] bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              {generatedLetter.statutoryReference}
                            </span>
                          </div>

                          <h4 className="text-sm font-extrabold text-white mt-0.5 truncate">
                            {locale === "pl"
                              ? generatedLetter.titlePl
                              : locale === "ro"
                              ? generatedLetter.titleRo
                              : generatedLetter.titleEn}
                          </h4>

                          {/* Auto-filled User Profile Summary */}
                          <p className="text-[11px] text-[#BACADA] mt-0.5 truncate">
                            <span className="text-[#2EE59D] font-semibold">
                              {locale === "pl" ? "Wypełniono z profilu:" : "Auto-filled:"}
                            </span>{" "}
                            {user.fullName} · {user.homeAddress} · {user.phone} →{" "}
                            <span className="text-white font-semibold">{user.employerName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Envelope Action Buttons: Full-Screen Preview Popup, Copy, Save */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewModalLetter({
                              ...generatedLetter,
                              msgId: msg.id,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] hover:opacity-95 text-black text-xs font-extrabold transition-all shadow-md cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {locale === "pl"
                              ? "Podgląd"
                              : locale === "ro"
                              ? "Previzualizare"
                              : "Preview"}
                          </span>
                        </button>

                        {/* Copy English Letter Button */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLetter.contentEn);
                            setCopiedEnvelopeId(msg.id);
                            showToast(
                              locale === "pl"
                                ? "Skopiowano gotowe pismo po angielsku z danymi z profilu!"
                                : locale === "ro"
                                ? "Scrisoarea în engleză a fost copiată!"
                                : "Copied personalized English letter to clipboard!"
                            );
                            setTimeout(() => {
                              setCopiedEnvelopeId((prev) => (prev === msg.id ? null : prev));
                            }, 2500);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                        >
                          {copiedEnvelopeId === msg.id ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {locale === "pl"
                                  ? "Skopiowano!"
                                  : locale === "ro"
                                  ? "Copiat!"
                                  : "Copied!"}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>
                                {locale === "pl"
                                  ? "Kopiuj"
                                  : locale === "ro"
                                  ? "Copiază"
                                  : "Copy"}
                              </span>
                            </>
                          )}
                        </button>

                        {/* Save / Open in Pisma Tab */}
                        <button
                          type="button"
                          onClick={() => {
                            saveSentLetter({
                              templateId: generatedLetter.templateId,
                              title: generatedLetter.titleEn,
                              recipient: user.employerName || "UK Employer",
                              content: generatedLetter.contentEn,
                            });
                            setSavedEnvelopeIds((prev) => ({ ...prev, [msg.id]: true }));
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#12304F] hover:bg-[#163a5f] border border-[#2EE59D]/40 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                        >
                          <BookmarkCheck className="w-3.5 h-3.5 text-[#2EE59D]" />
                          <span>
                            {savedEnvelopeIds[msg.id]
                              ? locale === "pl"
                                ? "W zakładce Pisma"
                                : "Saved"
                              : locale === "pl"
                              ? "Zapisz w Pismach"
                              : "Save"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator before first stream chunk arrives */}
          {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
            <div className="flex items-start">
              <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl px-4 py-3 text-sm text-[#BACADA] flex items-center gap-2 shadow-md">
                <span className="inline-block w-2 h-2 rounded-full bg-[#2EE59D] animate-bounce"></span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#2EE59D] animate-bounce [animation-delay:0.2s]"></span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#2EE59D] animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs font-medium ml-1">Elon analizuje prawo pracy UK...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Floating Follow-Stream & Active Audio Indicator Bar (Appears if user scrolls up during streaming/speech or above composer) */}
        {(!isAutoScrollPinned || (speakingMsgId && isChatLoading)) && (
          <div className="shrink-0 flex items-center justify-center py-1 z-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#123258]/95 border border-[#FF6A00]/60 shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
              {speakingMsgId && (
                <>
                  <span className="inline-flex items-center gap-0.5 h-3" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <span
                        key={bar}
                        className={`w-0.5 h-3 rounded-full origin-bottom ${
                          isSpeechPaused
                            ? "bg-[#2EE59D] scale-y-50"
                            : `bg-[#FF6A00] audio-wave-bar-${bar}`
                        }`}
                      />
                    ))}
                  </span>
                  <button
                    type="button"
                    onClick={handlePauseResumeSpeech}
                    className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-extrabold text-white transition-colors cursor-pointer"
                  >
                    {isSpeechPaused ? t("resumeListen") : t("pauseListen")}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => scrollToActiveStreamOrBottom("smooth", true)}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2EE59D] hover:text-white transition-colors cursor-pointer"
              >
                <span>
                  {isChatLoading || speakingMsgId
                    ? locale === "pl"
                      ? "Podążaj za odpowiedzią Elona"
                      : locale === "ro"
                      ? "Urmărește răspunsul lui Elon"
                      : "Follow Elon's live response"
                    : locale === "pl"
                    ? "Przewiń na dół"
                    : locale === "ro"
                    ? "Derulează în jos"
                    : "Scroll to bottom"}
                </span>
                <ChevronDown className="w-4 h-4 text-[#FF6A00] animate-bounce" />
              </button>
            </div>
          </div>
        )}

        {/* Hard-Pinned Bottom Composer (Does not scroll with messages) */}
        <div className="shrink-0 pt-2 pb-1 bg-[#070F1A] border-t border-white/10 z-20">
          <div
            className={`flex items-end gap-1.5 sm:gap-2 bg-[#0F2C4D] border rounded-2xl p-1.5 shadow-lg transition-colors ${
              isDictating
                ? "border-[#EF4444] shadow-[0_0_16px_rgba(239,68,68,0.25)]"
                : !isOnline
                ? "border-[#FF6A00]/50 focus-within:border-[#FF6A00]"
                : "border-white/15 focus-within:border-[#2EE59D]"
            }`}
          >
            {/* Voice Recording / Dictation Button */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleDictation();
              }}
              aria-pressed={isDictating}
              className={`flex items-center gap-1.5 p-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                isDictating
                  ? "bg-[#EF4444] text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse"
                  : isTranscribing
                  ? "bg-[#FF6A00]/25 border border-[#FF6A00]/50 text-[#FF6A00]"
                  : "bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white"
              }`}
              title={isDictating ? "Zatrzymaj nagrywanie" : "Nagraj wiadomość głosem"}
            >
              {isTranscribing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : isDictating ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span className="text-[11px] font-mono tabular-nums font-extrabold pr-0.5">
                    0:{String(recordingSeconds).padStart(2, "0")}
                  </span>
                </>
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            <textarea
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isTranscribing
                  ? "Przetwarzanie nagrania..."
                  : isDictating
                  ? t("listening")
                  : ""
              }
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none text-sm text-white placeholder-[#BACADA]/60 focus:ring-0 focus:outline-none max-h-28 py-2 px-1"
            />

            {/* Two small action buttons directly to the left of Send: 1) Wyczyść czat, 2) Zapisz sprawę */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleStopSpeech();
                  clearChatMessages();
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-[#EF4444]/20 border border-white/10 hover:border-[#EF4444]/40 text-[#BACADA] hover:text-[#F26D6D] transition-colors shrink-0 cursor-pointer"
                title={t("clearChat")}
                aria-label={t("clearChat")}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={saveCurrentChatAsCase}
                className="p-2 rounded-xl bg-[#12304F] hover:bg-[#163a5f] border border-[#2EE59D]/30 text-[#2EE59D] hover:text-white transition-colors shrink-0 cursor-pointer"
                title={t("saveAsCase")}
                aria-label={t("saveAsCase")}
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={(!chatDraft.trim() && !isDictating) || isChatLoading}
                className={`p-2.5 rounded-xl font-extrabold disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-md shrink-0 cursor-pointer ${
                  !isOnline
                    ? "bg-[#FF6A00] text-black"
                    : "bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black"
                }`}
                title={!isOnline ? t("msgQueuedBadge") : t("send")}
                aria-label={t("send")}
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Legal Micro Disclaimer */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#BACADA]/70 mt-1 text-center">
            <Info className="w-3 h-3 text-[#2EE59D] shrink-0" />
            <span>{t("aiDisclaimer")}</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN (Desktop): Collapsible Legal Summary Side-Panel */}
      {isDesktopPanelOpen && (
        <aside
          aria-label={t("legalSummaryTitle")}
          className="hidden lg:block w-[340px] xl:w-[370px] shrink-0 h-full overflow-hidden"
        >
          {renderLegalSummaryContent(false)}
        </aside>
      )}

      {/* MOBILE / TABLET DRAWER: Legal Summary Slide-Over */}
      {isMobilePanelOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md h-full p-2 sm:p-3 flex flex-col">
            {renderLegalSummaryContent(true)}
          </div>
        </div>
      )}

      {/* FULL-SCREEN DOCUMENT PREVIEW POPUP MODAL (Mobile Full-Screen & Desktop Sheet) */}
      {previewModalLetter && (
        <div
          className="fixed inset-0 z-[80] bg-[#070F1A]/95 backdrop-blur-md flex flex-col sm:items-center sm:justify-center sm:p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full h-full sm:h-[92vh] sm:max-w-3xl bg-[#0F2C4D] sm:border-2 sm:border-[#FF6A00]/60 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Popup Top Bar with Close (X) Button */}
            <div className="shrink-0 px-4 py-3.5 bg-[#0B2038] border-b border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-[#2EE59D] text-[#070F1A] font-extrabold text-[10px] uppercase tracking-wider">
                    GOTOWY DOKUMENT (EN)
                  </span>
                  <span className="text-[11px] font-mono text-[#BACADA] truncate">
                    {previewModalLetter.statutoryReference}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">
                  {locale === "pl"
                    ? previewModalLetter.titlePl
                    : locale === "ro"
                    ? previewModalLetter.titleRo
                    : previewModalLetter.titleEn}
                </h3>
              </div>

              {/* Close with Cross (X) Button */}
              <button
                type="button"
                onClick={() => setPreviewModalLetter(null)}
                aria-label="Zamknij podgląd"
                title="Zamknij"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Full-Screen Scrollable Paper Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-[#070F1A]">
              <div className="rounded-2xl bg-[#FFF6EF] text-[#161B22] p-4 sm:p-7 border-2 border-[#FF6A00]/40 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#161B22]/15 text-[11px] font-mono text-[#161B22]/80">
                  <span className="font-extrabold text-[#0B6E4F]">
                    OFFICIAL UK STATUTORY NOTICE · 100% COMPLETED
                  </span>
                  <span>
                    {user.fullName} → {user.employerName}
                  </span>
                </div>
                <pre className="text-xs sm:text-sm leading-relaxed font-mono whitespace-pre-wrap text-[#161B22] select-all">
                  {previewModalLetter.contentEn}
                </pre>
              </div>
            </div>

            {/* Sticky Bottom Action Bar: Copy, Download, Send Email, Close (X) */}
            <div className="shrink-0 p-3 sm:p-4 bg-[#0B2038] border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* 1. Copy Button */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewModalLetter.contentEn);
                    showToast(
                      locale === "pl"
                        ? "Skopiowano gotowe pismo do schowka!"
                        : locale === "ro"
                        ? "Scrisoarea a fost copiată!"
                        : "Letter copied to clipboard!"
                    );
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <Copy className="w-4 h-4 shrink-0" />
                  <span>
                    {locale === "pl"
                      ? "Kopiuj"
                      : locale === "ro"
                      ? "Copiază"
                      : "Copy"}
                  </span>
                </button>

                {/* 2. Download Button */}
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const blob = new Blob([previewModalLetter.contentEn], {
                        type: "text/plain;charset=utf-8",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${previewModalLetter.titleEn
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showToast(
                        locale === "pl"
                          ? "Pobrano gotowe pismo (.txt)"
                          : "Downloaded letter (.txt)"
                      );
                    } catch {
                      // ignore
                    }
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 border border-[#2EE59D]/40 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#2EE59D] shrink-0" />
                  <span>
                    {locale === "pl"
                      ? "Pobierz"
                      : locale === "ro"
                      ? "Descarcă"
                      : "Download"}
                  </span>
                </button>

                {/* 3. Send via Email Button */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `${previewModalLetter.titleEn} - ${user.fullName}`
                  )}&body=${encodeURIComponent(previewModalLetter.contentEn)}`}
                  onClick={() => {
                    saveSentLetter(
                      {
                        templateId: previewModalLetter.templateId,
                        title: previewModalLetter.titleEn,
                        recipient: user.employerName || "UK Employer",
                        content: previewModalLetter.contentEn,
                      },
                      true
                    );
                    showToast(
                      locale === "pl"
                        ? "Otwieranie programu pocztowego z gotowym pismem..."
                        : "Opening email client with completed letter..."
                    );
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#143A66] hover:bg-[#19477d] border border-[#2EE59D]/40 text-[#2EE59D] text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>
                    {locale === "pl"
                      ? "Wyślij mailowo"
                      : locale === "ro"
                      ? "Trimite Email"
                      : "Send Email"}
                  </span>
                </a>
              </div>

              {/* 4. Close (X) Button */}
              <button
                type="button"
                onClick={() => setPreviewModalLetter(null)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-[#EF4444]/25 border border-white/15 hover:border-[#EF4444]/50 text-white hover:text-[#FF8A8A] text-xs font-extrabold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>
                  {locale === "pl"
                    ? "Zamknij"
                    : locale === "ro"
                    ? "Închide"
                    : "Close"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
