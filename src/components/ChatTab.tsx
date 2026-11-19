import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  Locale,
  ConversationLegalSummary,
  UnsavedChatIconType,
  RecentUnsavedChat,
  ChatSessionTag,
  ElonVoicePreset,
  ChatMessage,
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
import { AskElonShieldLogo, analyzeAiResponseSentiment } from "./AskElonShieldLogo";
import { ElonPeekingBubbleGrip, PeekEdgeSide } from "./ElonPeekingBubbleGrip";
import { LegalLetterFooter } from "./LegalLetterFooter";
import { Tooltip } from "./Tooltip";
import { CameraScannerModal } from "./CameraScannerModal";
import { analyzeUploadedDocument, DOCUMENT_TAG_STYLES } from "../utils/documentClassifier";
import {
  computeCaseDocumentProgress,
  getCaseProgressWidthClass,
} from "../utils/caseProgress";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Trash2,
  BookmarkPlus,
  BookmarkCheck,
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
  Sparkles,
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
  Headphones,
  Tag,
  Plus,
  Filter,
  Archive,
  ArchiveRestore,
  Camera,
  Paperclip,
  Loader2,
  FileCheck2,
  FileSearch,
  FileLock2,
  Eye,
  Flag,
  Pin,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";

const SPEECH_RATES = [0.92, 1.0, 1.15] as const;

const CHAT_SESSION_TAG_LIST: ChatSessionTag[] = [
  "Grievance",
  "Pay Dispute",
  "Contract",
  "Dismissal",
  "Sick Pay",
  "Settlement",
  "GDPR",
];

const CHAT_SESSION_TAG_STYLES: Record<
  ChatSessionTag,
  {
    dotClass: string;
    pillClass: string;
    activeFilterClass: string;
    shortLabelPl: string;
    shortLabelRo: string;
  }
> = {
  Grievance: {
    dotClass: "bg-[#D97724]",
    pillClass: "bg-[#D97724]/20 text-[#FF9E58] border-[#D97724]/50",
    activeFilterClass: "bg-[#D97724] text-white border-[#FF9E58] shadow-sm",
    shortLabelPl: "Grievance · Skarga",
    shortLabelRo: "Grievance · Plângere",
  },
  "Pay Dispute": {
    dotClass: "bg-[#FBBF24]",
    pillClass: "bg-[#FBBF24]/20 text-[#FDE68A] border-[#FBBF24]/50",
    activeFilterClass: "bg-[#D97706] text-white border-[#FBBF24] shadow-sm",
    shortLabelPl: "Pay Dispute · Płace",
    shortLabelRo: "Pay Dispute · Salariu",
  },
  Contract: {
    dotClass: "bg-[#38BDF8]",
    pillClass: "bg-[#38BDF8]/20 text-[#7DD3FC] border-[#38BDF8]/50",
    activeFilterClass: "bg-[#0284C7] text-white border-[#38BDF8] shadow-sm",
    shortLabelPl: "Contract · Umowa",
    shortLabelRo: "Contract · Contract",
  },
  Dismissal: {
    dotClass: "bg-[#EF4444]",
    pillClass: "bg-[#EF4444]/20 text-[#FCA5A5] border-[#EF4444]/50",
    activeFilterClass: "bg-[#DC2626] text-white border-[#FCA5A5] shadow-sm",
    shortLabelPl: "Dismissal · Zwolnienie",
    shortLabelRo: "Dismissal · Concediere",
  },
  "Sick Pay": {
    dotClass: "bg-[#A78BFA]",
    pillClass: "bg-[#A78BFA]/20 text-[#DDD6FE] border-[#A78BFA]/50",
    activeFilterClass: "bg-[#7C3AED] text-white border-[#C4B5FD] shadow-sm",
    shortLabelPl: "Sick Pay · SSP",
    shortLabelRo: "Sick Pay · SSP",
  },
  Settlement: {
    dotClass: "bg-[#38B28B]",
    pillClass: "bg-[#38B28B]/20 text-[#6EE7B7] border-[#38B28B]/50",
    activeFilterClass: "bg-[#1D6852] text-white border-[#38B28B] shadow-sm",
    shortLabelPl: "Settlement · Ugoda",
    shortLabelRo: "Settlement · Acord",
  },
  GDPR: {
    dotClass: "bg-[#34D399]",
    pillClass: "bg-[#34D399]/20 text-[#A7F3D0] border-[#34D399]/50",
    activeFilterClass: "bg-[#059669] text-white border-[#34D399] shadow-sm",
    shortLabelPl: "GDPR · RODO",
    shortLabelRo: "GDPR · GDPR",
  },
};

const SPEECH_VISUALIZER_BARS = [
  { id: 1, heightPx: 10, harmonic: 0, delayMs: 0 },
  { id: 2, heightPx: 14, harmonic: 1, delayMs: 45 },
  { id: 3, heightPx: 18, harmonic: 2, delayMs: 90 },
  { id: 4, heightPx: 22, harmonic: 3, delayMs: 135 },
  { id: 5, heightPx: 16, harmonic: 0, delayMs: 180 },
  { id: 6, heightPx: 25, harmonic: 1, delayMs: 60 },
  { id: 7, heightPx: 28, harmonic: 2, delayMs: 110 },
  { id: 8, heightPx: 20, harmonic: 3, delayMs: 160 },
  { id: 9, heightPx: 24, harmonic: 0, delayMs: 30 },
  { id: 10, heightPx: 30, harmonic: 1, delayMs: 85 },
  { id: 11, heightPx: 26, harmonic: 2, delayMs: 140 },
  { id: 12, heightPx: 19, harmonic: 3, delayMs: 195 },
  { id: 13, heightPx: 27, harmonic: 0, delayMs: 50 },
  { id: 14, heightPx: 32, harmonic: 1, delayMs: 100 },
  { id: 15, heightPx: 29, harmonic: 2, delayMs: 150 },
  { id: 16, heightPx: 23, harmonic: 3, delayMs: 70 },
  { id: 17, heightPx: 30, harmonic: 0, delayMs: 120 },
  { id: 18, heightPx: 26, harmonic: 1, delayMs: 170 },
  { id: 19, heightPx: 21, harmonic: 2, delayMs: 40 },
  { id: 20, heightPx: 28, harmonic: 3, delayMs: 95 },
  { id: 21, heightPx: 24, harmonic: 0, delayMs: 145 },
  { id: 22, heightPx: 18, harmonic: 1, delayMs: 190 },
  { id: 23, heightPx: 22, harmonic: 2, delayMs: 65 },
  { id: 24, heightPx: 16, harmonic: 3, delayMs: 115 },
  { id: 25, heightPx: 19, harmonic: 0, delayMs: 165 },
  { id: 26, heightPx: 14, harmonic: 1, delayMs: 80 },
  { id: 27, heightPx: 12, harmonic: 2, delayMs: 130 },
  { id: 28, heightPx: 9, harmonic: 3, delayMs: 175 },
] as const;

/**
 * Selects the best available natural, warm MALE voice for Elon
 * tuned to sound like a pleasant young adult male in his late 20s ("mężczyzna przed trzydziestką").
 * Strongly filters out harsh/screeching robotic voices and strictly avoids female voices.
 */
function pickConfidentMaleVoice(
  voices: SpeechSynthesisVoice[],
  langTag: string,
  preset: ElonVoicePreset = "young_professional"
): { voice: SpeechSynthesisVoice | null; isExplicitMale: boolean } {
  if (!voices || voices.length === 0) {
    return { voice: null, isExplicitMale: false };
  }

  const langPrefix = langTag.split("-")[0].toLowerCase();
  const matchingLangVoices = voices.filter((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix)
  );

  // If we have language-matching voices, prefer them; otherwise consider the full pool
  const candidates = matchingLangVoices.length > 0 ? matchingLangVoices : voices;

  // Standard AI Assistant preset: pick clean system/neural voice without gender filtering
  if (preset === "standard") {
    let standardBest: SpeechSynthesisVoice | null = null;
    let standardBestScore = -9999;
    for (const v of candidates) {
      const nameLower = `${v.name} ${v.voiceURI}`.toLowerCase();
      const vLang = v.lang.toLowerCase().replace("_", "-");
      let score = 0;
      if (vLang === langTag.toLowerCase()) score += 50;
      else if (vLang.startsWith(langPrefix)) score += 25;
      if (
        nameLower.includes("natural") ||
        nameLower.includes("neural") ||
        nameLower.includes("online") ||
        nameLower.includes("google")
      ) {
        score += 150;
      }
      if (nameLower.includes("espeak") || nameLower.includes("compact")) {
        score -= 150;
      }
      if (score > standardBestScore) {
        standardBestScore = score;
        standardBest = v;
      }
    }
    return { voice: standardBest, isExplicitMale: false };
  }

  // Top-tier young adult male voices (warm, friendly, pleasant, 25-29 years old)
  const premierYoungMaleKeywords = [
    // Polish top natural male voices
    "krzysztof", // Microsoft Krzysztof Online (Natural) — benchmark young Polish professional male
    "marek",     // Microsoft Marek
    "jan",       // Microsoft Jan Online (Natural)
    // UK English top natural male voices
    "ryan",      // Microsoft Ryan Online (Natural) — young British male
    "oliver",    // Microsoft Oliver Online (Natural)
    "george",    // Microsoft George Online (Natural)
    "daniel",    // Apple / Google Daniel (young British male)
    // Romanian top natural male voices
    "emil",      // Microsoft Emil Online (Natural)
    "andrei",    // Microsoft Andrei Online (Natural)
    // Android TTS high-quality male voice tags
    "pl-pl-x-plb",
    "pl-pl-x-pld",
    "en-gb-x-rjs",
    "en-gb-x-gbd",
  ];

  const generalMaleKeywords = [
    "male",
    "męski",
    "man",
    // Polish male names
    "adam",
    "piotr",
    "tomasz",
    "maciej",
    "mateusz",
    "bartosz",
    "kacper",
    "jakub",
    "szymon",
    "filip",
    "wojciech",
    "łukasz",
    "stanislaw",
    "zbigniew",
    "jacek",
    // UK / English male names
    "arthur",
    "thomas",
    "david",
    "mark",
    "guy",
    "christopher",
    "brian",
    "james",
    "richard",
    "alex",
    "fred",
    "aaron",
    // Romanian male names
    "vlad",
    "radu",
    "raducu",
    "ion",
    "mihai",
  ];

  const femaleKeywords = [
    "female",
    "kobieta",
    "woman",
    // Polish female voices
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
    "ola",
    "monika",
    // English female voices
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
    "sarah",
    // Romanian female voices
    "alina",
    "carmen",
    "ioana",
    "elena",
    "daria",
  ];

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -9999;
  let bestIsExplicitMale = false;

  for (const v of candidates) {
    const nameLower = `${v.name} ${v.voiceURI}`.toLowerCase();
    const vLang = v.lang.toLowerCase().replace("_", "-");
    let score = 0;

    if (vLang === langTag.toLowerCase()) {
      score += 40;
    } else if (vLang.startsWith(langPrefix)) {
      score += 25;
    }

    const hasPremierYoungMale = premierYoungMaleKeywords.some((kw) => nameLower.includes(kw));
    const hasGeneralMale = generalMaleKeywords.some((kw) => nameLower.includes(kw));
    const hasFemaleName = femaleKeywords.some((kw) => nameLower.includes(kw));

    if (hasFemaleName) {
      // Heavily penalize female voices so they are NEVER selected for Elon
      score -= 2000;
    }

    if (hasPremierYoungMale) {
      // Highest priority for pleasant, friendly young male voices (late 20s)
      score += 300;
    } else if (hasGeneralMale) {
      score += 150;
    }

    // Huge boost for modern Natural / Neural / Studio / WaveNet / Google high-fidelity voices
    if (
      !hasFemaleName &&
      (nameLower.includes("natural") ||
        nameLower.includes("neural") ||
        nameLower.includes("online") ||
        nameLower.includes("wavenet") ||
        nameLower.includes("google"))
    ) {
      score += 100;
    }

    // Deprioritize robotic legacy / screechy engines like espeak or compact
    if (nameLower.includes("espeak") || nameLower.includes("compact")) {
      score -= 150;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = v;
      bestIsExplicitMale = (hasPremierYoungMale || hasGeneralMale) && !hasFemaleName;
    }
  }

  // If candidate search yielded only a female voice (score < 0), fallback to any male voice in the global pool
  if (bestScore < 0 && matchingLangVoices.length > 0) {
    const fallbackMale = voices.find((v) => {
      const n = `${v.name} ${v.voiceURI}`.toLowerCase();
      const isFem = femaleKeywords.some((kw) => n.includes(kw));
      const isM = premierYoungMaleKeywords.some((kw) => n.includes(kw)) || generalMaleKeywords.some((kw) => n.includes(kw));
      return isM && !isFem;
    });
    if (fallbackMale) {
      return { voice: fallbackMale, isExplicitMale: true };
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
 * Cleans text for Elon's speech synthesis:
 * Strips markdown, emojis, code blocks, raw URLs, and special symbols,
 * converts colons, semicolons, and dashes into natural breath-pauses (commas),
 * and preserves natural sentence cadence so the voice sounds like a friendly, calm young man
 * in his late 20s having an authentic conversation ("mężczyzna przed trzydziestką").
 */
function normalizeLegalTextForSpeech(text: string, locale: Locale): string {
  const withoutLetter = stripEmbeddedEnglishLetter(text);

  const cleaned = withoutLetter
    // Remove markdown bold/italic/code/headers
    .replace(/[*#_~`>]/g, " ")
    // Remove decorative emojis & symbols
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}•]/gu, " ")
    // Convert formal section headers into confident buddy-to-buddy spoken transitions with natural pauses
    .replace(/Twoje prawa w świetle brytyjskiego prawa:?/gi, "Słuchaj stary, tak wyglądają Twoje twarde prawa w UK: ")
    .replace(/Strategia działania:?/gi, "A teraz nasz konkretny plan działania: ")
    .replace(/Opcja A\s*\([^)]*\):?/gi, "Opcja pierwsza, na spokojnie: ")
    .replace(/Opcja B\s*\([^)]*\):?/gi, "Opcja druga, twardo z paragrafu: ")
    .replace(/Your Legal Rights Under UK Law:?/gi, "Listen mate, here is where you stand under UK law: ")
    .replace(/Strategic Options:?/gi, "Here is our game plan: ")
    // Expand s.13 / s.9 / s.23 / s.44 / s.10 / s.1 statutory shorthand before punctuation tuning
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
    // Turn hyphens, colons, semicolons, bullets and dashes into natural breath pauses (comma)
    .replace(/[:;—–\-\/\\|]/g, ", ")
    // Remove brackets, quotes, braces, math symbols and weird characters
    .replace(/[\[\]{}"'„”«»*#_~`<>•…§&@+=^]/g, " ")
    // Collapse repeating punctuation and spaces for clean delivery
    .replace(/,\s*,+/g, ", ")
    .replace(/\.\s*\.+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

interface MessageTimeMeta {
  epochMs: number | null;
  dayMinutes: number | null;
}

function parseChatMessageTimeMeta(msg: ChatMessage): MessageTimeMeta {
  let epochMs: number | null = null;
  const epochMatch = msg.id.match(/(\d{13})/);
  if (epochMatch) {
    const parsed = Number(epochMatch[1]);
    if (Number.isFinite(parsed) && parsed > 1_000_000_000_000) {
      epochMs = parsed;
    }
  }

  let dayMinutes: number | null = null;
  if (typeof msg.timestamp === "string") {
    const match = msg.timestamp.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
    if (match) {
      let hours = Number(match[1]);
      const mins = Number(match[2]);
      const ampm = match[3]?.toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
        dayMinutes = hours * 60 + mins;
      }
    }
  }

  if (dayMinutes === null && epochMs !== null) {
    const d = new Date(epochMs);
    dayMinutes = d.getHours() * 60 + d.getMinutes();
  }

  return { epochMs, dayMinutes };
}

function areMessagesWithinFiveMinutes(prev: ChatMessage, curr: ChatMessage): boolean {
  if (prev.isSystemBroadcast || curr.isSystemBroadcast) return false;
  const prevMeta = parseChatMessageTimeMeta(prev);
  const currMeta = parseChatMessageTimeMeta(curr);

  if (prevMeta.epochMs !== null && currMeta.epochMs !== null) {
    return Math.abs(currMeta.epochMs - prevMeta.epochMs) <= FIVE_MINUTES_MS;
  }

  if (prevMeta.epochMs !== null || currMeta.epochMs !== null) {
    const knownEpoch = prevMeta.epochMs ?? currMeta.epochMs!;
    const now = new Date();
    const knownDate = new Date(knownEpoch);
    const sameLocalDay =
      knownDate.getFullYear() === now.getFullYear() &&
      knownDate.getMonth() === now.getMonth() &&
      knownDate.getDate() === now.getDate();
    if (!sameLocalDay) return false;
  }

  if (prevMeta.dayMinutes !== null && currMeta.dayMinutes !== null) {
    const diff = currMeta.dayMinutes - prevMeta.dayMinutes;
    return (diff >= 0 && diff <= 5) || (diff < -1434 && diff + 1440 <= 5);
  }

  return false;
}

interface ChatMessageTimeGroup {
  id: string;
  startTimestamp: string;
  endTimestamp: string;
  items: Array<{ msg: ChatMessage; idx: number }>;
  isSystemGroup: boolean;
}

export const ChatTab: React.FC = () => {
  const {
    t,
    chatMessages,
    isChatLoading,
    sendChatMessage,
    clearChatMessages,
    deleteChatMessage,
    toggleFlagChatMessage,
    pinChatMessageToCase,
    saveCurrentChatAsCase,
    locale,
    user,
    updateUser,
    setProfileSubTab,
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
    closeChat,
    saveSentLetter,
    sentLetters,
    cases,
    activeCaseId,
    setActiveCaseId,
    recentUnsavedChats,
    activeUnsavedChatId,
    restoreUnsavedChat,
    removeUnsavedChat,
    saveUnsavedChatAsCase,
    toggleUnsavedChatTag,
    toggleArchiveUnsavedChat,
    voiceConfig,
    updateVoiceConfig,
    setIsVoicePreferencesModalOpen,
    robotState,
    setIsElonSpeaking,
    setIsUserDictating,
    triggerRobotReaction,
    documents,
    addDocument,
  } = useApp();

  const [isAnalyzingAttachment, setIsAnalyzingAttachment] = useState(false);
  const [isChatCameraOpen, setIsChatCameraOpen] = useState(false);
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>([]);
  const [dismissedAutoDocIds, setDismissedAutoDocIds] = useState<string[]>([]);
  const [expandedThumbnailDocId, setExpandedThumbnailDocId] = useState<string | null>(null);
  const [showAllStackThumbs, setShowAllStackThumbs] = useState(false);
  const [isContextPreviewOpen, setIsContextPreviewOpen] = useState(false);
  const contextPreviewRef = useRef<HTMLDivElement | null>(null);
  const [allowDocLibraryContext, setAllowDocLibraryContext] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("ask_elon_ai_doc_access");
      return saved !== "false";
    } catch {
      return true;
    }
  });
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Randomly assigns 'left' or 'right' edge for the peeking robot head + metallic gripping fingers per bot message ID
  const botPeekSideMapRef = useRef<Record<string, PeekEdgeSide>>({});
  const getBotBubblePeekSide = useCallback((msgId: string): PeekEdgeSide => {
    if (!botPeekSideMapRef.current[msgId]) {
      botPeekSideMapRef.current[msgId] = Math.random() < 0.5 ? "left" : "right";
    }
    return botPeekSideMapRef.current[msgId];
  }, []);

  // Context Menu state for individual chat bubbles (triggered on long-press or right-click)
  const [bubbleContextMenu, setBubbleContextMenu] = useState<{
    msgId: string;
    x: number;
    y: number;
  } | null>(null);
  const bubbleLongPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bubbleLongPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const bubbleContextMenuRef = useRef<HTMLDivElement | null>(null);

  const clearBubbleLongPress = useCallback(() => {
    if (bubbleLongPressTimerRef.current) {
      clearTimeout(bubbleLongPressTimerRef.current);
      bubbleLongPressTimerRef.current = null;
    }
    bubbleLongPressStartRef.current = null;
  }, []);

  const openBubbleContextMenu = useCallback((msgId: string, clientX: number, clientY: number) => {
    const menuWidth = 244;
    const menuHeight = 216;
    const vw = typeof window !== "undefined" ? window.innerWidth : 390;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const clampedX = Math.max(12, Math.min(clientX, vw - menuWidth - 12));
    const clampedY = Math.max(56, Math.min(clientY, vh - menuHeight - 84));
    setBubbleContextMenu({ msgId, x: clampedX, y: clampedY });
    try {
      navigator.vibrate?.(15);
    } catch {
      // ignore if unsupported
    }
  }, []);

  useEffect(() => {
    if (!bubbleContextMenu) return;
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (
        bubbleContextMenuRef.current &&
        !bubbleContextMenuRef.current.contains(e.target as Node)
      ) {
        setBubbleContextMenu(null);
      }
    };
    const handleKeyDownEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBubbleContextMenu(null);
      }
    };
    window.addEventListener("pointerdown", handlePointerDownOutside);
    window.addEventListener("keydown", handleKeyDownEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDownOutside);
      window.removeEventListener("keydown", handleKeyDownEscape);
    };
  }, [bubbleContextMenu]);

  useEffect(() => {
    return () => {
      clearBubbleLongPress();
    };
  }, [clearBubbleLongPress]);

  const handleToggleDocLibraryContext = useCallback(() => {
    setAllowDocLibraryContext((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ask_elon_ai_doc_access", String(next));
      } catch {
        // ignore storage errors
      }
      showToast(
        next
          ? locale === "pl"
            ? "Dostęp AI do kontekstu biblioteki dokumentów został włączony."
            : locale === "ro"
            ? "Accesul AI la contextul bibliotecii de documente a fost activat."
            : "AI access to your document library context is now enabled."
          : locale === "pl"
          ? "Tryb prywatny: AI nie ma teraz dostępu do kontekstu Twojej biblioteki dokumentów."
          : locale === "ro"
          ? "Mod privat: accesul AI la contextul bibliotecii de documente a fost dezactivat."
          : "Private mode: AI access to your document library context is now disabled."
      );
      return next;
    });
  }, [locale, showToast]);

  const processChatAttachment = useCallback(
    async (
      fileOrBlob: File | Blob,
      sourceMethod: "system_upload" | "camera",
      explicitFileName?: string
    ) => {
      const labelName =
        explicitFileName ||
        (fileOrBlob instanceof File && fileOrBlob.name) ||
        "Camera_Document.jpg";
      setIsAnalyzingAttachment(true);
      try {
        const result = await analyzeUploadedDocument(fileOrBlob, {
          fileName: labelName,
          sourceMethod,
          locale,
        });
        const savedDoc = addDocument({
          name: result.fileName,
          type: result.detectionMeta.mappedType,
          categoryTag: result.detectionMeta.categoryTag,
          fileSize: result.fileSize,
          uploadSource: sourceMethod === "camera" ? "camera" : "system",
          mimeType: result.mimeType,
          previewDataUrl: result.previewDataUrl,
          detectionMeta: result.detectionMeta,
        });

        setAttachedDocIds((prev) =>
          prev.includes(savedDoc.id) ? prev : [savedDoc.id, ...prev]
        );
        setDismissedAutoDocIds((prev) => prev.filter((id) => id !== savedDoc.id));

        if (!allowDocLibraryContext) {
          showToast(
            locale === "pl"
              ? "Dokument zapisano w bibliotece. Dostęp AI do dokumentów jest obecnie wyłączony."
              : locale === "ro"
              ? "Document salvat în bibliotecă. Accesul AI la documente este dezactivat."
              : "Document saved to your library. AI document context access is currently disabled."
          );
          triggerRobotReaction("success", 1000);
          return;
        }

        const resolvedTag = savedDoc.categoryTag || result.detectionMeta.categoryTag;
        const tagLabel =
          locale === "pl"
            ? DOCUMENT_TAG_STYLES[resolvedTag]?.labelPl || resolvedTag
            : locale === "ro"
            ? DOCUMENT_TAG_STYLES[resolvedTag]?.labelRo || resolvedTag
            : resolvedTag;

        const signalsLine =
          result.detectionMeta.detectedSignals.length > 0
            ? ` (${result.detectionMeta.detectedSignals.slice(0, 3).join(", ")})`
            : "";

        const summaryPart = result.detectionMeta.contentSummary
          ? ` ${result.detectionMeta.contentSummary}`
          : "";

        const contextSnippet =
          locale === "pl"
            ? `[Dokument: ${savedDoc.name} | Kategoria: ${resolvedTag} (${tagLabel})${signalsLine}]${summaryPart}`
            : locale === "ro"
            ? `[Document: ${savedDoc.name} | Categorie: ${resolvedTag} (${tagLabel})${signalsLine}]${summaryPart}`
            : `[Document: ${savedDoc.name} | Category: ${resolvedTag}${signalsLine}]${summaryPart}`;

        const nextDraft = chatDraft.trim()
          ? `${chatDraft.trim()}\n${contextSnippet}`
          : contextSnippet;
        setChatDraft(nextDraft);
        triggerRobotReaction("success", 1200);
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : locale === "pl"
            ? "Nie udało się przeanalizować dokumentu."
            : "Could not analyze document."
        );
      } finally {
        setIsAnalyzingAttachment(false);
      }
    },
    [addDocument, allowDocLibraryContext, chatDraft, locale, setChatDraft, showToast, triggerRobotReaction]
  );

  const handleChatFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      e.target.value = "";
      if (files.length === 0) return;
      for (const file of files) {
        await processChatAttachment(file, "system_upload", file.name);
      }
    },
    [processChatAttachment]
  );

  const [isDictating, setIsDictating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micAudioLevels, setMicAudioLevels] = useState<number[]>(() => Array(18).fill(0.12));
  const [micRmsLevel, setMicRmsLevel] = useState<number>(0);
  const [isVoiceDetected, setIsVoiceDetected] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(voiceConfig?.speed ?? 1.0);
  const [autoReadAloud, setAutoReadAloud] = useState<boolean>(voiceConfig?.autoReadAloud ?? true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Synchronize local voice reader & dictation state with global robotState in AppContext
  useEffect(() => {
    setIsElonSpeaking(Boolean(speakingMsgId) && !isSpeechPaused);
  }, [speakingMsgId, isSpeechPaused, setIsElonSpeaking]);

  useEffect(() => {
    setIsUserDictating(isDictating || isTranscribing);
  }, [isDictating, isTranscribing, setIsUserDictating]);

  // Synchronize local voice reader state with global persisted voiceConfig
  useEffect(() => {
    if (typeof voiceConfig?.speed === "number") {
      setSpeechRate(voiceConfig.speed);
      speechRateRef.current = voiceConfig.speed;
    }
    if (typeof voiceConfig?.autoReadAloud === "boolean") {
      setAutoReadAloud(voiceConfig.autoReadAloud);
    }
  }, [voiceConfig?.speed, voiceConfig?.autoReadAloud]);
  const [revealedCharsById, setRevealedCharsById] = useState<Record<string, number>>({});
  const [previewModalLetter, setPreviewModalLetter] = useState<
    (GeneratedChatLetter & { msgId: string }) | null
  >(null);
  const [copiedEnvelopeId, setCopiedEnvelopeId] = useState<string | null>(null);
  const [savedEnvelopeIds, setSavedEnvelopeIds] = useState<Record<string, boolean>>({});

  // Email Transcript Dialog State (Resend API integration)
  const [isEmailTranscriptModalOpen, setIsEmailTranscriptModalOpen] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>(user.email || "");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailMarkdownPreview, setEmailMarkdownPreview] = useState<string>("");
  const [emailFilename, setEmailFilename] = useState<string>("ask-elon-consultation.md");
  const [isSendingTranscriptEmail, setIsSendingTranscriptEmail] = useState<boolean>(false);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<{
    type: "success" | "error";
    message: string;
    deliveryId?: string;
  } | null>(null);

  // Options Bottom Sheet State (houses Summary, History, Voice, Persona, Smart Context, Path, Follow-Ups, Actions)
  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState<boolean>(false);
  const [optionsSheetDragY, setOptionsSheetDragY] = useState<number>(0);
  const optionsSheetStartYRef = useRef<number | null>(null);
  const optionsSheetScrollRef = useRef<HTMLDivElement | null>(null);
  const [historyViewTab, setHistoryViewTab] = useState<"active" | "archived">("active");
  const [selectedHistoryTagFilter, setSelectedHistoryTagFilter] = useState<ChatSessionTag | "ALL">("ALL");
  const [openTagPickerChatId, setOpenTagPickerChatId] = useState<string | null>(null);
  const [legalSummary, setLegalSummary] = useState<ConversationLegalSummary>(() =>
    extractInstantLegalSummary(chatMessages, locale)
  );
  const [isUpdatingSummary, setIsUpdatingSummary] = useState<boolean>(false);

  const hasUserMessages = useMemo(
    () => chatMessages.some((m) => m.role === "user"),
    [chatMessages]
  );
  const hasElonReplied = useMemo(
    () =>
      chatMessages.some(
        (m) => m.role === "assistant" && m.id !== "msg_init" && !m.isSystemBroadcast
      ),
    [chatMessages]
  );

  useEffect(() => {
    if (!isOptionsSheetOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOptionsSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOptionsSheetOpen]);

  // Orientation path metadata (current legal category, linked case/thread, and full date range)
  const conversationPathMeta = useMemo(() => {
    const activeSession = recentUnsavedChats.find((c) => c.id === activeUnsavedChatId);
    const linkedCase = activeCaseId ? cases.find((c) => c.id === activeCaseId) : undefined;
    const combinedText = `${chatMessages.map((m) => m.text).join(" ")} ${
      linkedCase ? `${linkedCase.title} ${linkedCase.description}` : ""
    }`.toLowerCase();

    let categoryType: UnsavedChatIconType = activeSession?.iconType || "general";
    if (
      /\b(ugod\w*|porozumieni\w*|settlement|section 111a|rekompensat\w*|early conciliation|acas)\b/i.test(
        combinedText
      )
    ) {
      categoryType = "settlement";
    } else if (
      /\b(nadgodzin\w*|wypłat\w*|pensj\w*|payslip\w*|wage\w*|pay|potrąc\w*|deduct\w*|overtime|minimum wage|section 13|funt\w*)\b/i.test(
        combinedText
      )
    ) {
      categoryType = "wages";
    } else if (
      /\b(ssp|ssp1|choro\w*|zasił\w*|sick\w*|lekarz\w*|fit note|zwolnieni\w* lekarsk\w*|wypad\w*)\b/i.test(
        combinedText
      )
    ) {
      categoryType = "sick_pay";
    } else if (
      /\b(zwolni\w*|wyrzuc\w*|wypowiedzeni\w*|dismiss\w*|fired|sacked|redundant|dyscyplin\w*|section 95|section 98)\b/i.test(
        combinedText
      )
    ) {
      categoryType = "dismissal";
    } else if (
      /\b(skarg\w*|grievance|mobbing\w*|bullying|harassment|traktow\w*|bhp|health and safety)\b/i.test(
        combinedText
      )
    ) {
      categoryType = "grievance";
    } else if (
      /\b(sar|rodo|gdpr|dane|data|bramk\w*|clock\w*|akt\w* osobow\w*|records)\b/i.test(combinedText)
    ) {
      categoryType = "data";
    } else if (
      /\b(umow\w*|contract\w*|grafik\w*|zmian\w*|godzin\w*|urlop\w*|holiday|przerw\w*|break|zero-hours)\b/i.test(
        combinedText
      )
    ) {
      categoryType = "contract";
    }

    const categoryLabels: Record<UnsavedChatIconType, { pl: string; en: string; ro: string }> = {
      settlement: {
        pl: "Ugoda i ACAS",
        en: "Settlement & ACAS",
        ro: "Acord & ACAS",
      },
      wages: {
        pl: "Płace i Nadgodziny",
        en: "Pay & Wages",
        ro: "Salarii & Ore suplimentare",
      },
      sick_pay: {
        pl: "Zwolnienie lekarskie (SSP)",
        en: "Sick Pay (SSP)",
        ro: "Concediu medical (SSP)",
      },
      dismissal: {
        pl: "Wypowiedzenie i Zwolnienie",
        en: "Dismissal & Redundancy",
        ro: "Concediere & Preaviz",
      },
      grievance: {
        pl: "Skarga Formalna (Grievance)",
        en: "Formal Grievance",
        ro: "Plângere (Grievance)",
      },
      data: {
        pl: "Dane Osobowe (SAR / GDPR)",
        en: "Data Access (SAR / GDPR)",
        ro: "Date personale (SAR / GDPR)",
      },
      contract: {
        pl: "Umowa i Czas Pracy",
        en: "Contract & Working Time",
        ro: "Contract & Program",
      },
      general: {
        pl: "Konsultacja Ogólna UK",
        en: "General UK Employment",
        ro: "Consultanță Generală UK",
      },
    };

    const categoryIconMap: Record<UnsavedChatIconType, React.ReactNode> = {
      settlement: <Scale className="w-3.5 h-3.5 text-[#38B28B]" />,
      wages: <Banknote className="w-3.5 h-3.5 text-[#FBBF24]" />,
      sick_pay: <HeartPulse className="w-3.5 h-3.5 text-[#A78BFA]" />,
      dismissal: <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />,
      grievance: <ShieldAlert className="w-3.5 h-3.5 text-[#D97724]" />,
      data: <Database className="w-3.5 h-3.5 text-[#34D399]" />,
      contract: <Briefcase className="w-3.5 h-3.5 text-[#38BDF8]" />,
      general: <MessageSquare className="w-3.5 h-3.5 text-[#38B28B]" />,
    };

    const formatDDMMYYYY = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}.${d.getFullYear()}`;

    const parseLocalDate = (raw?: string): Date | null => {
      if (!raw) return null;
      const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
      }
      const dotMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
      if (dotMatch) {
        return new Date(Number(dotMatch[3]), Number(dotMatch[2]) - 1, Number(dotMatch[1]));
      }
      return null;
    };

    const candidateDates: Date[] = [];
    if (linkedCase) {
      const cStart = parseLocalDate(linkedCase.createdAt);
      const cEnd = parseLocalDate(linkedCase.updatedAt);
      if (cStart) candidateDates.push(cStart);
      if (cEnd) candidateDates.push(cEnd);
    }
    if (activeSession) {
      const sDate =
        parseLocalDate(activeSession.dateISO) || parseLocalDate(activeSession.dateLabel);
      if (sDate) candidateDates.push(sDate);
    }
    chatMessages.forEach((m) => {
      const epochMatch = m.id.match(/(\d{13})/);
      if (epochMatch) {
        const dt = new Date(Number(epochMatch[1]));
        if (!Number.isNaN(dt.getTime())) {
          candidateDates.push(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()));
        }
      }
    });

    const todayLocal = new Date();
    const fallbackToday = new Date(
      todayLocal.getFullYear(),
      todayLocal.getMonth(),
      todayLocal.getDate()
    );
    if (candidateDates.length === 0) {
      candidateDates.push(fallbackToday);
    }

    const sortedMs = candidateDates.map((d) => d.getTime()).sort((a, b) => a - b);
    const earliestDate = new Date(sortedMs[0]);
    const latestDate = new Date(sortedMs[sortedMs.length - 1]);
    const startStr = formatDDMMYYYY(earliestDate);
    const endStr = formatDDMMYYYY(latestDate);

    const firstMsgTime = chatMessages[0]?.timestamp;
    const lastMsgTime = chatMessages[chatMessages.length - 1]?.timestamp;

    const dateRangeText =
      startStr !== endStr
        ? `${startStr} – ${endStr}`
        : firstMsgTime && lastMsgTime && firstMsgTime !== lastMsgTime
        ? `${startStr} · ${firstMsgTime} – ${lastMsgTime}`
        : `${startStr}${lastMsgTime ? ` · ${lastMsgTime}` : ""}`;

    const firstUserMsg = chatMessages.find((m) => m.role === "user" && !m.isSystemBroadcast);
    const rawLeaf =
      linkedCase?.title ||
      activeSession?.title ||
      firstUserMsg?.text.trim() ||
      (locale === "pl"
        ? "Bieżąca konsultacja"
        : locale === "ro"
        ? "Consultație activă"
        : "Active session");
    const threadLeafLabel = rawLeaf.length > 42 ? `${rawLeaf.slice(0, 40).trim()}…` : rawLeaf;

    const tagLine =
      activeSession?.tags && activeSession.tags.length > 0
        ? activeSession.tags
            .map((tg) => {
              const meta = CHAT_SESSION_TAG_STYLES[tg];
              if (!meta) return tg;
              return locale === "pl"
                ? meta.shortLabelPl
                : locale === "ro"
                ? meta.shortLabelRo
                : tg;
            })
            .join(", ")
        : "";

    const messageCount = chatMessages.filter((m) => !m.isSystemBroadcast).length;
    const realUserMsgs = chatMessages.filter(
      (m) => m.role === "user" && !m.isSystemBroadcast
    );
    const fullContextLower = `${combinedText} ${chatDraft.toLowerCase()}`;

    type CasePathSentimentTone =
      | "info_calm"
      | "warning_amber"
      | "critical_coral"
      | "constructive_emerald";

    let sentimentTone: CasePathSentimentTone = "info_calm";

    const hasCriticalSignals =
      categoryType === "dismissal" ||
      /\b(zwolni\w*|wyrzuc\w*|dyscyplin\w*|dismiss\w*|fired|sacked|tribunal|sąd\w*|3 miesiące minus 1 dzień|3 months minus 1 day|natychmiast\w*|gross misconduct)\b/i.test(
        fullContextLower
      );

    const hasUrgentDisputeSignals =
      categoryType === "wages" ||
      categoryType === "sick_pay" ||
      categoryType === "grievance" ||
      linkedCase?.priority === "high" ||
      /\b(nie zapłaci\w*|brak wypłat\w*|nadgodzin\w*|potrąc\w*|odmawia\w*|unpaid|deduct\w*|overtime|skarg\w*|grievance|mobbing\w*|harass\w*|ssp1|wezwani\w*|spór|dispute|obcię\w*)\b/i.test(
        fullContextLower
      );

    const hasConstructiveResolutionSignals =
      linkedCase?.status === "resolved" ||
      categoryType === "settlement" ||
      /\b(wypłacono|rozwiązano|ugod\w*|settlement|porozumieni\w*|resolved)\b/i.test(
        fullContextLower
      );

    if (realUserMsgs.length === 0 && !chatDraft.trim() && !linkedCase) {
      sentimentTone = "info_calm";
    } else if (hasCriticalSignals && linkedCase?.status !== "resolved") {
      sentimentTone = "critical_coral";
    } else if (hasUrgentDisputeSignals && linkedCase?.status !== "resolved") {
      sentimentTone = "warning_amber";
    } else if (hasConstructiveResolutionSignals) {
      sentimentTone = "constructive_emerald";
    } else {
      sentimentTone = "info_calm";
    }

    const sentimentConfigMap: Record<
      CasePathSentimentTone,
      {
        labelPl: string;
        labelEn: string;
        labelRo: string;
        descPl: string;
        descEn: string;
        descRo: string;
        navTintClass: string;
        badgeClass: string;
        dotClass: string;
        activeStepClass: string;
        lastStepTextClass: string;
        iconAccentClass: string;
      }
    > = {
      info_calm: {
        labelPl: "Zbieranie informacji",
        labelEn: "Information Gathering",
        labelRo: "Colectare informații",
        descPl:
          "Spokojny tryb informacyjny — zbieranie faktów, analiza umowy i weryfikacja przysługujących praw w UK.",
        descEn:
          "Calm information gathering — reviewing facts, contract terms, and UK statutory rights.",
        descRo:
          "Mod calm de informare — colectarea faptelor și verificarea drepturilor legale în UK.",
        navTintClass:
          "bg-gradient-to-r from-[#0C2540]/90 via-[#111E34]/95 to-[#131B2E]/90 border-[#38BDF8]/30 border-l-2 border-l-[#38BDF8] shadow-[0_2px_14px_rgba(56,189,248,0.08)]",
        badgeClass: "bg-[#38BDF8]/12 border-[#38BDF8]/35 text-[#7DD3FC]",
        dotClass: "bg-[#38BDF8]",
        activeStepClass:
          "text-[#E0F2FE] font-bold bg-[#38BDF8]/15 border border-[#38BDF8]/30",
        lastStepTextClass: "text-[#7DD3FC] hover:text-[#F1F5F9] hover:bg-[#38BDF8]/10 font-semibold",
        iconAccentClass: "text-[#38BDF8]",
      },
      warning_amber: {
        labelPl: "Pilny spór",
        labelEn: "Urgent Dispute",
        labelRo: "Litigiu urgent",
        descPl:
          "Wykryto pilny spór pracowniczy (np. niewypłacone nadgodziny, SSP lub skarga HR) — zalecane pisemne wezwanie i pilnowanie terminów ACAS.",
        descEn:
          "Urgent workplace dispute detected (unpaid wages, SSP, or HR grievance) — written notice and ACAS time limits apply.",
        descRo:
          "Litigiu urgent detectat (salarii neplătite, SSP sau plângere HR) — se recomandă notificare scrisă și atenție la termenele ACAS.",
        navTintClass:
          "bg-gradient-to-r from-[#2D1C0B]/90 via-[#1D1B2A]/95 to-[#131B2E]/90 border-[#F59E0B]/35 border-l-2 border-l-[#F59E0B] shadow-[0_2px_14px_rgba(245,158,11,0.10)]",
        badgeClass: "bg-[#F59E0B]/15 border-[#F59E0B]/40 text-[#FCD34D]",
        dotClass: "bg-[#F59E0B] animate-pulse",
        activeStepClass:
          "text-[#FEF3C7] font-bold bg-[#F59E0B]/15 border border-[#F59E0B]/35",
        lastStepTextClass: "text-[#FBBF24] hover:text-[#F1F5F9] hover:bg-[#F59E0B]/10 font-semibold",
        iconAccentClass: "text-[#F59E0B]",
      },
      critical_coral: {
        labelPl: "Pilna eskalacja",
        labelEn: "Critical Escalation",
        labelRo: "Escaladare critică",
        descPl:
          "Sprawa o wysokim priorytecie (zwolnienie, spotkanie dyscyplinarne lub termin 3 mies. minus 1 dzień do ACAS / Trybunału).",
        descEn:
          "High-urgency escalation (dismissal, disciplinary hearing, or strict 3-months-minus-1-day ACAS / Tribunal deadline).",
        descRo:
          "Urgență ridicată (concediere, ședință disciplinară sau termen strict de 3 luni minus o zi la ACAS).",
        navTintClass:
          "bg-gradient-to-r from-[#311316]/90 via-[#1F1726]/95 to-[#131B2E]/90 border-[#F97316]/40 border-l-2 border-l-[#EF4444] shadow-[0_2px_16px_rgba(239,68,68,0.11)]",
        badgeClass: "bg-[#EF4444]/15 border-[#F97316]/45 text-[#FDA4AF]",
        dotClass: "bg-[#EF4444] animate-pulse",
        activeStepClass:
          "text-[#FFE4E6] font-bold bg-[#EF4444]/15 border border-[#F97316]/35",
        lastStepTextClass: "text-[#FB923C] hover:text-[#F1F5F9] hover:bg-[#EF4444]/10 font-semibold",
        iconAccentClass: "text-[#F97316]",
      },
      constructive_emerald: {
        labelPl: "Aktywne rozwiązanie",
        labelEn: "Constructive Resolution",
        labelRo: "Soluționare activă",
        descPl:
          "Konstruktywny etap sprawy — przygotowywanie ugody, porozumienia ACAS lub sfinalizowanie roszczenia.",
        descEn:
          "Constructive resolution stage — settlement negotiation, ACAS conciliation, or claim completion.",
        descRo:
          "Etapă constructivă — negocierea unui acord, conciliere ACAS sau finalizarea cererii.",
        navTintClass:
          "bg-gradient-to-r from-[#0D2B24]/90 via-[#12202F]/95 to-[#131B2E]/90 border-[#38B28B]/35 border-l-2 border-l-[#38B28B] shadow-[0_2px_14px_rgba(56,178,139,0.09)]",
        badgeClass: "bg-[#38B28B]/15 border-[#38B28B]/40 text-[#6EE7B7]",
        dotClass: "bg-[#38B28B]",
        activeStepClass:
          "text-[#ECFDF5] font-bold bg-[#38B28B]/15 border border-[#38B28B]/30",
        lastStepTextClass: "text-[#38B28B] hover:text-[#F1F5F9] hover:bg-[#38B28B]/10 font-semibold",
        iconAccentClass: "text-[#38B28B]",
      },
    };

    const sentimentMeta = sentimentConfigMap[sentimentTone];

    return {
      rootLabel:
        locale === "pl" ? "Sprawy UK" : locale === "ro" ? "Cazuri UK" : "UK Cases",
      categoryType,
      categoryLabel: categoryLabels[categoryType][locale],
      categoryIcon: categoryIconMap[categoryType],
      tagLine,
      threadLeafLabel,
      dateRangeText,
      messageCount,
      isArchived: Boolean(activeSession?.isArchived),
      sentimentTone,
      sentimentLabel:
        locale === "pl"
          ? sentimentMeta.labelPl
          : locale === "ro"
          ? sentimentMeta.labelRo
          : sentimentMeta.labelEn,
      sentimentDescription:
        locale === "pl"
          ? sentimentMeta.descPl
          : locale === "ro"
          ? sentimentMeta.descRo
          : sentimentMeta.descEn,
      sentimentNavTintClass: sentimentMeta.navTintClass,
      sentimentBadgeClass: sentimentMeta.badgeClass,
      sentimentDotClass: sentimentMeta.dotClass,
      sentimentActiveStepClass: sentimentMeta.activeStepClass,
      sentimentLastStepTextClass: sentimentMeta.lastStepTextClass,
      sentimentIconAccentClass: sentimentMeta.iconAccentClass,
    };
  }, [
    activeCaseId,
    activeUnsavedChatId,
    cases,
    chatDraft,
    chatMessages,
    locale,
    recentUnsavedChats,
  ]);

  const prevPathCategoryRef = useRef<UnsavedChatIconType>(conversationPathMeta.categoryType);
  const [animatePathCategory, setAnimatePathCategory] = useState(false);

  useEffect(() => {
    if (prevPathCategoryRef.current !== conversationPathMeta.categoryType) {
      prevPathCategoryRef.current = conversationPathMeta.categoryType;
      setAnimatePathCategory(true);
    }
  }, [conversationPathMeta.categoryType]);

  // Dynamic AI Document Context Detection: matches analyzed user-provided docs & explicit chat attachments
  const activeDocumentContext = useMemo(() => {
    if (!allowDocLibraryContext) {
      return {
        docs: [] as (typeof documents)[number][],
        items: [] as Array<{ doc: (typeof documents)[number]; reason: "attached" | "topic_match" }>,
        primaryDoc: null as (typeof documents)[number] | null,
        primaryReason: null as "attached" | "topic_match" | null,
        extraCount: 0,
      };
    }

    const draftLower = chatDraft.toLowerCase();
    const recentMsgsText = chatMessages
      .filter((m) => !m.isSystemBroadcast)
      .slice(-8)
      .map((m) => m.text)
      .join(" ")
      .toLowerCase();
    const combinedTopicText = `${draftLower} ${recentMsgsText}`;
    const hasDocMention = /\b(dokument\w*|document\w*|plik\w*|payslip\w*|odcin\w*|umow\w*|contract\w*|pismo\w*|letter\w*|l4|fit note|dyscyplin\w*|p45|p60|grafik\w*|rota\w*|timesheet\w*|skan\w*|załącz\w*)\b/i.test(
      combinedTopicText
    );

    const isAnalyzedUserDoc = (d: (typeof documents)[number]) =>
      d.uploadSource !== "sample";

    const matchedDocs: Array<{
      doc: (typeof documents)[number];
      reason: "attached" | "topic_match";
    }> = [];
    const seenDocIds = new Set<string>();

    // 1. Explicitly attached docs in current composer or already referenced by name in draft/recent messages
    for (const doc of documents) {
      const lowerName = doc.name.toLowerCase();
      const inDraftOrChat =
        (lowerName.length >= 4 && draftLower.includes(lowerName)) ||
        (lowerName.length >= 4 && recentMsgsText.includes(lowerName));
      if (
        (attachedDocIds.includes(doc.id) || inDraftOrChat) &&
        !dismissedAutoDocIds.includes(doc.id)
      ) {
        matchedDocs.push({ doc, reason: "attached" });
        seenDocIds.add(doc.id);
      }
    }

    // 2. Relevant analyzed/audited user-provided documents matching active conversation category or query
    const cat = conversationPathMeta.categoryType;
    const categoryTagsByTopic: Record<string, string[]> = {
      wages: ["PDF Paystub", "Image Paystub", "P45 / P60 Tax Form", "Rota / Timesheet"],
      contract: ["Employment Contract", "Rota / Timesheet"],
      sick_pay: ["Sick Note / Fit Note", "Letter to HR"],
      dismissal: ["Letter to HR", "Disciplinary / Grievance", "Employment Contract"],
      grievance: ["Disciplinary / Grievance", "Letter to HR", "Employment Contract"],
      settlement: ["Letter to HR", "Employment Contract", "Disciplinary / Grievance"],
      data: ["Letter to HR", "Employment Contract", "Workplace Document"],
    };
    const preferredTags = categoryTagsByTopic[cat] || [];

    for (const doc of documents) {
      if (seenDocIds.has(doc.id) || dismissedAutoDocIds.includes(doc.id)) continue;
      if (!isAnalyzedUserDoc(doc)) continue;

      const docTag = doc.categoryTag || "";
      const matchesTopic = preferredTags.includes(docTag);
      const isFreshUserUpload =
        (doc.uploadSource === "camera" || doc.uploadSource === "system") &&
        Boolean(doc.detectionMeta);

      if (matchesTopic || (hasDocMention && isFreshUserUpload)) {
        matchedDocs.push({ doc, reason: "topic_match" });
        seenDocIds.add(doc.id);
      }
    }

    const docs = matchedDocs.map((m) => m.doc);
    const primary = matchedDocs[0] || null;
    return {
      docs,
      items: matchedDocs,
      primaryDoc: primary?.doc || null,
      primaryReason: primary?.reason || null,
      extraCount: Math.max(0, docs.length - 1),
    };
  }, [
    allowDocLibraryContext,
    documents,
    attachedDocIds,
    dismissedAutoDocIds,
    chatDraft,
    chatMessages,
    conversationPathMeta.categoryType,
  ]);

  useEffect(() => {
    if (!allowDocLibraryContext || activeDocumentContext.docs.length === 0) {
      setIsContextPreviewOpen(false);
    }
  }, [allowDocLibraryContext, activeDocumentContext.docs.length]);

  useEffect(() => {
    if (!isContextPreviewOpen) return;
    const handlePointerDownOutside = (e: MouseEvent) => {
      if (
        contextPreviewRef.current &&
        !contextPreviewRef.current.contains(e.target as Node)
      ) {
        setIsContextPreviewOpen(false);
      }
    };
    const handleEscClose = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsContextPreviewOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDownOutside);
    window.addEventListener("keydown", handleEscClose);
    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      window.removeEventListener("keydown", handleEscClose);
    };
  }, [isContextPreviewOpen]);

  const [isAutoScrollPinned, setIsAutoScrollPinned] = useState<boolean>(true);
  const [unreadBelowCount, setUnreadBelowCount] = useState<number>(0);

  // Ordered stack of user-uploaded/scanned or explicitly attached documents
  const processedThumbnailDocs = useMemo(() => {
    const activeIds = new Set(activeDocumentContext.docs.map((d) => d.id));
    const ordered: (typeof documents)[number][] = [...activeDocumentContext.docs];
    for (const doc of documents) {
      if (activeIds.has(doc.id)) continue;
      if (doc.uploadSource !== "sample") {
        ordered.push(doc);
      }
    }
    return ordered;
  }, [documents, activeDocumentContext.docs]);

  const expandedThumbnailDoc = useMemo(
    () => processedThumbnailDocs.find((d) => d.id === expandedThumbnailDocId) || null,
    [processedThumbnailDocs, expandedThumbnailDocId]
  );

  useEffect(() => {
    if (expandedThumbnailDocId && !expandedThumbnailDoc) {
      setExpandedThumbnailDocId(null);
    }
  }, [expandedThumbnailDocId, expandedThumbnailDoc]);

  // 5-Minute Time-Based Visual Grouping for Chat History
  const [groupCollapseOverrides, setGroupCollapseOverrides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setGroupCollapseOverrides({});
  }, [activeCaseId, activeUnsavedChatId]);

  useEffect(() => {
    if (chatMessages.length <= 1) {
      setGroupCollapseOverrides({});
    }
  }, [chatMessages.length]);

  const chatMessageGroups = useMemo<ChatMessageTimeGroup[]>(() => {
    const groups: ChatMessageTimeGroup[] = [];
    for (let idx = 0; idx < chatMessages.length; idx++) {
      const msg = chatMessages[idx];
      const currentGroup = groups[groups.length - 1];
      const prevEntry = currentGroup?.items[currentGroup.items.length - 1];

      if (
        currentGroup &&
        !currentGroup.isSystemGroup &&
        !msg.isSystemBroadcast &&
        prevEntry &&
        areMessagesWithinFiveMinutes(prevEntry.msg, msg)
      ) {
        currentGroup.items.push({ msg, idx });
        currentGroup.endTimestamp = msg.timestamp;
      } else {
        groups.push({
          id: `grp_${msg.id}`,
          startTimestamp: msg.timestamp,
          endTimestamp: msg.timestamp,
          items: [{ msg, idx }],
          isSystemGroup: Boolean(msg.isSystemBroadcast),
        });
      }
    }
    return groups;
  }, [chatMessages]);

  const toggleGroupCollapsed = useCallback((groupId: string, currentlyCollapsed: boolean) => {
    setGroupCollapseOverrides((prev) => ({
      ...prev,
      [groupId]: !currentlyCollapsed,
    }));
  }, []);

  // Breadcrumb Navigation Trail Refs & State (Selected Issue -> Consultation Stages -> Drafted Letter)
  const messageRefsMap = useRef<Record<string, HTMLDivElement | null>>({});
  const letterEnvelopeRefsMap = useRef<Record<string, HTMLDivElement | null>>({});
  const stageHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeBreadcrumbStageId, setActiveBreadcrumbStageId] = useState<string>("stage_issue");
  const [highlightedStageTargetKey, setHighlightedStageTargetKey] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (stageHighlightTimerRef.current) {
        clearTimeout(stageHighlightTimerRef.current);
      }
    };
  }, []);

  interface ConversationBreadcrumbStage {
    id: string;
    kind: "issue" | "inquiry" | "advice" | "letter";
    label: string;
    tooltip: string;
    hint?: string;
    targetMsgId?: string;
    targetKey: string;
  }

  const conversationBreadcrumbs = useMemo<ConversationBreadcrumbStage[]>(() => {
    const stages: ConversationBreadcrumbStage[] = [];
    const firstMsgId = chatMessages[0]?.id;

    // 1. Selected Employment Issue
    stages.push({
      id: "stage_issue",
      kind: "issue",
      label: conversationPathMeta.categoryLabel,
      tooltip:
        locale === "pl"
          ? "Przejdź do wybranej sprawy i początku rozmowy"
          : locale === "ro"
          ? "Mergi la problema selectată și începutul conversației"
          : "Jump to selected employment issue & start",
      hint: conversationPathMeta.tagLine || undefined,
      targetMsgId: firstMsgId,
      targetKey: firstMsgId || "top",
    });

    // 2. Initial Inquiry (First real user message)
    const firstUserEntry = chatMessages.find(
      (m) => m.role === "user" && !m.isSystemBroadcast
    );
    if (firstUserEntry) {
      stages.push({
        id: "stage_inquiry",
        kind: "inquiry",
        label: conversationPathMeta.threadLeafLabel,
        tooltip:
          locale === "pl"
            ? "Wróć do pierwszego opisu problemu"
            : locale === "ro"
            ? "Înapoi la întrebarea inițială"
            : "Jump to initial problem description",
        hint: firstUserEntry.timestamp,
        targetMsgId: firstUserEntry.id,
        targetKey: firstUserEntry.id,
      });
    }

    // Collect substantive AI responses and any drafted English letters
    const substantiveAiEntries: Array<{
      msg: ChatMessage;
      idx: number;
      prevUserText: string;
      letter: GeneratedChatLetter | null;
    }> = [];

    chatMessages.forEach((msg, idx) => {
      if (
        msg.role !== "assistant" ||
        msg.id === "msg_init" ||
        msg.id.startsWith("msg_reset_") ||
        msg.id.startsWith("msg_sys_") ||
        msg.isSystemBroadcast
      ) {
        return;
      }
      const prevUserText =
        idx > 0
          ? chatMessages
              .slice(0, idx)
              .reverse()
              .find((m) => m.role === "user")?.text || ""
          : "";
      if (!prevUserText.trim()) return;

      const isCurrentlyStreamingMsg =
        isChatLoading && idx === chatMessages.length - 1;
      const isCurrentlySpeakingMsg = speakingMsgId === msg.id;
      const letter =
        !isCurrentlyStreamingMsg && !isCurrentlySpeakingMsg
          ? buildPersonalizedEnglishLetterForChat(prevUserText, msg.text, user)
          : null;

      substantiveAiEntries.push({ msg, idx, prevUserText, letter });
    });

    // 3. Legal Analysis stage (first substantive AI guidance turn)
    if (substantiveAiEntries.length > 0) {
      const firstAdvice = substantiveAiEntries[0];
      stages.push({
        id: "stage_advice",
        kind: "advice",
        label:
          locale === "pl"
            ? "Analiza prawna"
            : locale === "ro"
            ? "Analiză juridică"
            : "Legal Advice",
        tooltip:
          locale === "pl"
            ? "Przejdź do analizy prawnej Elona"
            : locale === "ro"
            ? "Mergi la analiza juridică Elon"
            : "Jump to Elon's legal analysis",
        hint: firstAdvice.msg.timestamp,
        targetMsgId: firstAdvice.msg.id,
        targetKey: firstAdvice.msg.id,
      });
    }

    // 4. Specific Drafted Letter stage (latest drafted personalized English letter)
    const latestDraftedEntry = [...substantiveAiEntries]
      .reverse()
      .find((entry) => Boolean(entry.letter));

    if (latestDraftedEntry?.letter) {
      const letterTitleRaw =
        locale === "pl"
          ? latestDraftedEntry.letter.titlePl
          : locale === "ro"
          ? latestDraftedEntry.letter.titleRo
          : latestDraftedEntry.letter.titleEn;
      const shortLetterTitle =
        letterTitleRaw.length > 34
          ? `${letterTitleRaw.slice(0, 32).trim()}…`
          : letterTitleRaw;

      stages.push({
        id: "stage_letter",
        kind: "letter",
        label: shortLetterTitle,
        tooltip:
          locale === "pl"
            ? `Przejdź do wygenerowanego pisma: ${letterTitleRaw}`
            : locale === "ro"
            ? `Mergi la scrisoarea redactată: ${letterTitleRaw}`
            : `Jump to drafted letter: ${letterTitleRaw}`,
        hint: latestDraftedEntry.letter.statutoryReference,
        targetMsgId: latestDraftedEntry.msg.id,
        targetKey: `letter_${latestDraftedEntry.msg.id}`,
      });
    }

    return stages;
  }, [
    chatMessages,
    conversationPathMeta.categoryLabel,
    conversationPathMeta.tagLine,
    conversationPathMeta.threadLeafLabel,
    isChatLoading,
    locale,
    speakingMsgId,
    user,
  ]);

  // Default active breadcrumb to the latest milestone whenever stages progress
  useEffect(() => {
    if (conversationBreadcrumbs.length > 0) {
      setActiveBreadcrumbStageId(
        conversationBreadcrumbs[conversationBreadcrumbs.length - 1].id
      );
    }
  }, [conversationBreadcrumbs.length, activeCaseId, activeUnsavedChatId]);

  const navigateToBreadcrumbStage = useCallback(
    (stage: ConversationBreadcrumbStage) => {
      setActiveBreadcrumbStageId(stage.id);

      const container = scrollContainerRef.current;
      if (!container) return;

      // Pause auto-scroll pinning when navigating to earlier stages so scroll isn't snapped back
      const isLastStage =
        conversationBreadcrumbs[conversationBreadcrumbs.length - 1]?.id === stage.id;
      isAutoScrollPinnedRef.current = isLastStage;
      setIsAutoScrollPinned(isLastStage);
      if (isLastStage) {
        setUnreadBelowCount(0);
      }

      // Auto-expand collapsed 5-minute cluster if target message lives inside one
      let expandedCollapsedGroup = false;
      if (stage.targetMsgId) {
        const ownerGroupIdx = chatMessageGroups.findIndex((g) =>
          g.items.some((item) => item.msg.id === stage.targetMsgId)
        );
        const ownerGroup = ownerGroupIdx >= 0 ? chatMessageGroups[ownerGroupIdx] : undefined;
        if (ownerGroup && ownerGroup.items.length > 1) {
          const isLatestGroup = ownerGroupIdx === chatMessageGroups.length - 1;
          const currentlyCollapsed =
            groupCollapseOverrides[ownerGroup.id] ?? !isLatestGroup;
          if (currentlyCollapsed) {
            expandedCollapsedGroup = true;
            setGroupCollapseOverrides((prev) => ({
              ...prev,
              [ownerGroup.id]: false,
            }));
          }
        }
      }

      const performScroll = () => {
        const scroller = scrollContainerRef.current;
        if (!scroller) return;

        isProgrammaticScrollRef.current = true;
        if (programmaticScrollTimeoutRef.current) {
          clearTimeout(programmaticScrollTimeoutRef.current);
        }

        if (stage.kind === "issue") {
          const firstEl = stage.targetMsgId
            ? messageRefsMap.current[stage.targetMsgId]
            : null;
          if (!firstEl) {
            scroller.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            const containerRect = scroller.getBoundingClientRect();
            const targetRect = firstEl.getBoundingClientRect();
            const offsetTop = scroller.scrollTop + (targetRect.top - containerRect.top) - 8;
            scroller.scrollTo({ top: Math.max(0, offsetTop), behavior: "smooth" });
          }
        } else {
          const targetEl =
            stage.kind === "letter" && stage.targetMsgId
              ? letterEnvelopeRefsMap.current[stage.targetMsgId] ||
                messageRefsMap.current[stage.targetMsgId]
              : stage.targetMsgId
              ? messageRefsMap.current[stage.targetMsgId]
              : null;

          if (targetEl) {
            const containerRect = scroller.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();
            const offsetTop = scroller.scrollTop + (targetRect.top - containerRect.top) - 10;
            scroller.scrollTo({ top: Math.max(0, offsetTop), behavior: "smooth" });
          }
        }

        setHighlightedStageTargetKey(stage.targetKey);
        if (stageHighlightTimerRef.current) {
          clearTimeout(stageHighlightTimerRef.current);
        }
        stageHighlightTimerRef.current = setTimeout(() => {
          setHighlightedStageTargetKey(null);
        }, 1600);

        programmaticScrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 420);
      };

      if (expandedCollapsedGroup) {
        requestAnimationFrame(() => requestAnimationFrame(performScroll));
      } else {
        requestAnimationFrame(performScroll);
      }
    },
    [chatMessageGroups, conversationBreadcrumbs, groupCollapseOverrides]
  );

  // Smart Context state: strictly appears once we understand what the user wants and adapts to details they gave
  const [dismissedSmartChipIds, setDismissedSmartChipIds] = useState<string[]>([]);
  const [activeSmartChipId, setActiveSmartChipId] = useState<string | null>(null);
  const [smartFieldDraftValue, setSmartFieldDraftValue] = useState<string>("");

  const smartContextSuggestions = React.useMemo(() => {
    const userMessages = chatMessages.filter(
      (m) => m.role === "user" && !m.isSystemBroadcast
    );
    const trimmedDraft = chatDraft.trim();

    // Do NOT show Smart Context on an empty conversation before knowing what the user wants
    if (userMessages.length === 0 && trimmedDraft.length < 6) {
      return [];
    }

    const userInputText = `${userMessages.map((m) => m.text).join(" ")} ${trimmedDraft}`.trim();
    const normalizedUserText = userInputText.toLowerCase();

    const isWagesIntent =
      /wypłat|pensj|nadgodzin|potrąc|payslip|wage|pay\b|overtime|deduct|underpaid|unpaid|minimum wage|urlop|holiday pay|brak płacy|£/i.test(
        normalizedUserText
      );
    const isDismissalIntent =
      /zwolni|wyrzuc|wypowiedzeni|dyscyplin|dismiss|fired|sacked|redundant|redundancy|notice period|odpraw/i.test(
        normalizedUserText
      );
    const isSickPayIntent =
      /\bssp\b|ssp1|choro|zasił|sick|fit note|\bl4\b|lekarz|wypadek|medical|zwolnieni\w* lekarsk/i.test(
        normalizedUserText
      );
    const isGrievanceIntent =
      /mobbing|nękan|dyskryminac|bully|harass|skarg|grievance|unfair|traktow|manager|kierownik/i.test(
        normalizedUserText
      );
    const isDataIntent =
      /\bsar\b|gdpr|rodo|dane osobowe|monitoring|kamera|bramk|clock|akta|records|personal data/i.test(
        normalizedUserText
      );
    const isSettlementIntent =
      /ugod|porozumien|settlement|\bacas\b|conciliation|rekompensat|odszkodowan|tribunal/i.test(
        normalizedUserText
      );
    const isLetterIntent =
      /pismo|list\b|wniosek|odwołan|wezwanie|letter|template|write|napisz|przygotuj|wyślij|wysłać|formaln/i.test(
        normalizedUserText
      );

    const hasRecognizedTopic =
      isWagesIntent ||
      isDismissalIntent ||
      isSickPayIntent ||
      isGrievanceIntent ||
      isDataIntent ||
      isSettlementIntent ||
      isLetterIntent;

    // Wait until either a clear legal intent is recognized OR the user sent a substantive message
    if (!hasRecognizedTopic && (userMessages.length === 0 || normalizedUserText.length < 18)) {
      return [];
    }

    interface SmartSuggestion {
      id: string;
      mode: "profile_field" | "chat_detail";
      fieldKey?: keyof typeof user;
      appendPrefix?: string;
      chipLabel: string;
      promptTitle: string;
      placeholder: string;
      currentValue: string;
      priority: number;
    }

    const candidates: SmartSuggestion[] = [];

    // 1. Contextual CASE FACTS missing from what the user already provided
    if (isWagesIntent) {
      const alreadyGaveAmountOrHours =
        /£\s*\d+|\d+\s*(funt|pound|gbp|godz|h\b|hr|hours|dni|days)/i.test(normalizedUserText);
      if (!alreadyGaveAmountOrHours) {
        candidates.push({
          id: "detail_wages_amount",
          mode: "chat_detail",
          appendPrefix:
            locale === "pl"
              ? "Brakująca kwota / godziny: "
              : locale === "ro"
              ? "Sumă lipsă / ore: "
              : "Missing amount / hours: ",
          chipLabel:
            locale === "pl"
              ? "Podaj kwotę (£) i brakujące godziny"
              : locale === "ro"
              ? "Adaugă suma (£) și orele lipsă"
              : "Add missing amount (£) & hours",
          promptTitle:
            locale === "pl"
              ? "Ile dokładnie brakuje (£) lub za ile godzin/dni pracodawca nie zapłacił?"
              : locale === "ro"
              ? "Care este suma exactă lipsă (£) sau câte ore nu au fost plătite?"
              : "How much is owed (£) or how many hours/days are unpaid?",
          placeholder:
            locale === "pl" ? "np. £420 za 24h nadgodzin w zeszłym miesiącu" : "e.g. £420 for 24h overtime last month",
          currentValue: "",
          priority: 12,
        });
      }
    }

    if (isDismissalIntent) {
      const alreadyGaveTenureOrDate =
        /\b\d+\s*(lat|rok|lata|miesi|tygod|year|month|week)|\b\d{1,2}[./-]\d{1,2}\b|wczoraj|dzisiaj|yesterday|today/i.test(
          normalizedUserText
        );
      if (!alreadyGaveTenureOrDate) {
        candidates.push({
          id: "detail_dismissal_tenure",
          mode: "chat_detail",
          appendPrefix:
            locale === "pl"
              ? "Staż pracy i data zwolnienia: "
              : locale === "ro"
              ? "Vechime și data concedierii: "
              : "Length of service & dismissal date: ",
          chipLabel:
            locale === "pl"
              ? "Podaj staż pracy i datę zwolnienia"
              : locale === "ro"
              ? "Adaugă vechimea și data concedierii"
              : "Add service length & dismissal date",
          promptTitle:
            locale === "pl"
              ? "Jak długo tam pracujesz i kiedy dokładnie nastąpiło zwolnienie?"
              : locale === "ro"
              ? "De cât timp lucrezi acolo și când ai fost concediat?"
              : "How long have you worked there and when were you dismissed?",
          placeholder:
            locale === "pl" ? "np. 2 lata i 4 miesiące, zwolniony 14.11" : "e.g. 2 years 4 months, dismissed 14 Nov",
          currentValue: "",
          priority: 12,
        });
      }
    }

    if (isSickPayIntent) {
      const alreadyGaveFitNoteOrDays =
        /fit note|zwolnien|dni|days|od\s+\d|since\s+\d|\b\d+\s*(dni|days|tygod|weeks)/i.test(
          normalizedUserText
        );
      if (!alreadyGaveFitNoteOrDays) {
        candidates.push({
          id: "detail_sick_dates",
          mode: "chat_detail",
          appendPrefix:
            locale === "pl"
              ? "Okres choroby / Fit Note: "
              : locale === "ro"
              ? "Perioada medicală / Fit Note: "
              : "Sick leave dates & Fit Note: ",
          chipLabel:
            locale === "pl"
              ? "Podaj daty choroby i czy masz Fit Note"
              : locale === "ro"
              ? "Adaugă datele medicale și Fit Note"
              : "Add sick dates & Fit Note status",
          promptTitle:
            locale === "pl"
              ? "Od kiedy jesteś chory i czy dostarczyłeś Fit Note od GP?"
              : locale === "ro"
              ? "De când ești în concediu medical și dacă ai Fit Note?"
              : "When did your sickness start and have you provided a GP Fit Note?",
          placeholder:
            locale === "pl" ? "np. od 10 dni, mam Fit Note od lekarza GP" : "e.g. off sick 10 days, GP Fit Note sent",
          currentValue: "",
          priority: 12,
        });
      }
    }

    if (isGrievanceIntent) {
      const alreadyGaveDatesOrEvidence =
        /świad|nagran|email|wiadomoś|screenshot|date|when|witness|hr|zgłosił/i.test(
          normalizedUserText
        );
      if (!alreadyGaveDatesOrEvidence) {
        candidates.push({
          id: "detail_grievance_evidence",
          mode: "chat_detail",
          appendPrefix:
            locale === "pl"
              ? "Daty zdarzeń i dowody/świadkowie: "
              : locale === "ro"
              ? "Date incidente și dovezi: "
              : "Incident dates & evidence: ",
          chipLabel:
            locale === "pl"
              ? "Dodaj daty zdarzeń i dowody/świadków"
              : locale === "ro"
              ? "Adaugă datele și dovezile/martorii"
              : "Add incident dates & evidence",
          promptTitle:
            locale === "pl"
              ? "Kiedy miały miejsce zdarzenia i czy masz maile, wiadomości lub świadków?"
              : locale === "ro"
              ? "Când au avut loc incidentele și ce dovezi/martori ai?"
              : "When did incidents occur and do you have emails, messages, or witnesses?",
          placeholder:
            locale === "pl" ? "np. zmiany w październiku, mam SMS-y i 2 świadków" : "e.g. October shifts, texts & 2 witnesses",
          currentValue: "",
          priority: 11,
        });
      }
    }

    if (isDataIntent) {
      const alreadySpecifiedRecords =
        /cctv|monitoring|bramk|clock|payslip|email|hr file|akta/i.test(normalizedUserText);
      if (!alreadySpecifiedRecords) {
        candidates.push({
          id: "detail_sar_scope",
          mode: "chat_detail",
          appendPrefix:
            locale === "pl"
              ? "Zakres żądanych danych (SAR): "
              : locale === "ro"
              ? "Date solicitate (SAR): "
              : "Requested SAR records: ",
          chipLabel:
            locale === "pl"
              ? "Doprecyzuj jakie dane chcesz uzyskać"
              : locale === "ro"
              ? "Precizează datele dorite"
              : "Specify which records to request",
          promptTitle:
            locale === "pl"
              ? "Jakie konkretnie dane chcesz wydobyć (np. wejścia na bramki, CCTV, notatki HR)?"
              : locale === "ro"
              ? "Ce înregistrări specifice dorești (pontaj, CCTV, dosar HR)?"
              : "Which records do you need (clocking logs, CCTV, HR emails, appraisals)?",
          placeholder:
            locale === "pl" ? "np. logi z bramek od stycznia + korespondencja HR" : "e.g. clocking logs since Jan + HR notes",
          currentValue: "",
          priority: 11,
        });
      }
    }

    if (isSettlementIntent) {
      const alreadyGaveOffer = /£\s*\d+|termin|deadline|tydzień|dni|days/i.test(normalizedUserText);
      if (!alreadyGaveOffer) {
        candidates.push({
          id: "detail_settlement_offer",
          mode: "chat_detail",
          appendPrefix:
            locale === "pl"
              ? "Propozycja ugody i termin odpowiedzi: "
              : locale === "ro"
              ? "Oferta de acord și termenul: "
              : "Offer amount & response deadline: ",
          chipLabel:
            locale === "pl"
              ? "Podaj kwotę propozycji i termin odpowiedzi"
              : locale === "ro"
              ? "Adaugă suma propusă și termenul"
              : "Add offer amount & deadline",
          promptTitle:
            locale === "pl"
              ? "Jaką kwotę zaproponował pracodawca i do kiedy masz odpowiedzieć?"
              : locale === "ro"
              ? "Ce sumă a propus angajatorul și până când trebuie să răspunzi?"
              : "What amount did the employer offer and what is your deadline?",
          placeholder:
            locale === "pl" ? "np. zaproponowali £2,500, odpowiedź do piątku" : "e.g. offered £2,500, reply by Friday",
          currentValue: "",
          priority: 11,
        });
      }
    }

    // 2. Targeted PROFILE FIELDS only when needed for the user's specific request
    const needsEmployerContext =
      isLetterIntent || isWagesIntent || isDismissalIntent || isGrievanceIntent || isDataIntent || isSettlementIntent;

    const cleanEmployerName = (user.employerName || "").trim();
    if (needsEmployerContext && (!cleanEmployerName || cleanEmployerName.includes("["))) {
      candidates.push({
        id: "missing_employer_name",
        mode: "profile_field",
        fieldKey: "employerName",
        chipLabel:
          locale === "pl"
            ? "Podaj nazwę pracodawcy do tej sprawy"
            : locale === "ro"
            ? "Adaugă numele angajatorului"
            : "Add employer name for this case",
        promptTitle:
          locale === "pl"
            ? "Jak nazywa się firma / agencja pracodawcy?"
            : "What is the employer or agency name?",
        placeholder: "LogiPro UK Ltd",
        currentValue: cleanEmployerName,
        priority: 10,
      });
    }

    const cleanEmpAddr = (user.employerAddress || "").trim();
    const hasUkPostcode = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(cleanEmpAddr);
    if (needsEmployerContext && (!cleanEmpAddr || cleanEmpAddr.length < 18 || !hasUkPostcode)) {
      candidates.push({
        id: "incomplete_employer_address",
        mode: "profile_field",
        fieldKey: "employerAddress",
        chipLabel: isDataIntent
          ? locale === "pl"
            ? "Adres pracodawcy (do wniosku SAR)"
            : "Employer address (for SAR)"
          : isWagesIntent
          ? locale === "pl"
            ? "Adres HR / firmy (do wezwania o zapłatę)"
            : "Employer address (for pay demand)"
          : locale === "pl"
          ? "Adres pracodawcy (z kodem pocztowym UK)"
          : "Employer UK address (for notice)",
        promptTitle:
          locale === "pl"
            ? "Uzupełnij adres pracodawcy z kodem pocztowym UK do oficjalnej korespondencji:"
            : "Complete employer registered address (with UK Postcode):",
        placeholder: "Unit 4 Logistics Park, Dartford, Kent, DA1 5PR",
        currentValue: cleanEmpAddr,
        priority: isLetterIntent ? 10 : 8,
      });
    }

    const cleanPhone = (user.phone || "").trim();
    if (
      (isLetterIntent || isSettlementIntent || isGrievanceIntent || isDismissalIntent) &&
      (!cleanPhone || cleanPhone.length < 9 || cleanPhone.includes("["))
    ) {
      candidates.push({
        id: "missing_phone",
        mode: "profile_field",
        fieldKey: "phone",
        chipLabel:
          locale === "pl"
            ? "Telefon kontaktowy dla HR / ACAS"
            : locale === "ro"
            ? "Telefon contact pentru HR / ACAS"
            : "Contact phone for HR / ACAS",
        promptTitle:
          locale === "pl"
            ? "Podaj brytyjski numer telefonu do nagłówka pisma lub kontaktu z ACAS:"
            : "Enter your UK phone number for correspondence / ACAS:",
        placeholder: "+44 7700 900412",
        currentValue: cleanPhone,
        priority: 8,
      });
    }

    const cleanHomeAddr = (user.homeAddress || "").trim();
    const homeHasPostcode = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(cleanHomeAddr);
    if (
      (isLetterIntent || isDataIntent || isGrievanceIntent) &&
      (!cleanHomeAddr || cleanHomeAddr.length < 15 || !homeHasPostcode)
    ) {
      candidates.push({
        id: "incomplete_home_address",
        mode: "profile_field",
        fieldKey: "homeAddress",
        chipLabel:
          locale === "pl"
            ? "Twój adres UK do nagłówka pisma"
            : locale === "ro"
            ? "Adresa ta UK pentru scrisoare"
            : "Your UK address for letter header",
        promptTitle:
          locale === "pl"
            ? "Uzupełnij swój adres korespondencyjny w UK (z kodem pocztowym):"
            : "Enter your full UK correspondence address:",
        placeholder: "24 Highfield Road, Dartford, DA1 2JS",
        currentValue: cleanHomeAddr,
        priority: 7,
      });
    }

    if (
      (isWagesIntent || isDismissalIntent || isSettlementIntent) &&
      (!user.companyNumber || user.companyNumber.trim().length < 6)
    ) {
      candidates.push({
        id: "missing_company_number",
        mode: "profile_field",
        fieldKey: "companyNumber",
        chipLabel:
          locale === "pl"
            ? "Numer Companies House pracodawcy"
            : "Employer Companies House No.",
        promptTitle:
          locale === "pl"
            ? "Podaj numer rejestracyjny firmy (Companies House) do wezwania / ACAS:"
            : "Enter employer Companies House number:",
        placeholder: "08492104",
        currentValue: user.companyNumber || "",
        priority: 6,
      });
    }

    const seenIds = new Set<string>();
    return candidates
      .filter((item) => {
        if (dismissedSmartChipIds.includes(item.id)) return false;
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return true;
      })
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3);
  }, [chatMessages, chatDraft, user, locale, dismissedSmartChipIds]);

  const activeSmartSuggestion = smartContextSuggestions.find(
    (s) => s.id === activeSmartChipId
  );

  // Dynamic follow-up question & action chips derived from the last message received from the AI
  interface DynamicFollowUpChip {
    id: string;
    label: string;
    promptText?: string;
    actionType: "send_prompt" | "pin_last_ai" | "open_template" | "switch_persona";
    templateId?: string;
    targetMsgId?: string;
    accent: "green" | "orange" | "blue";
  }

  const dynamicFollowUpChips = useMemo<DynamicFollowUpChip[]>(() => {
    const aiMessages = chatMessages.filter(
      (m) => m.role === "assistant" && !m.isSystemBroadcast
    );
    const lastAiMsg = aiMessages[aiMessages.length - 1];
    if (!lastAiMsg) return [];

    // Initial welcome banner state (before first AI response)
    if (lastAiMsg.id === "msg_init" && chatMessages.length <= 1) {
      return [
        {
          id: "init_unpaid_wages",
          label:
            locale === "pl"
              ? "Brak wypłaty za nadgodziny (ERA 1996 s.13)"
              : locale === "ro"
              ? "Ore suplimentare neplătite (ERA 1996 s.13)"
              : "Unpaid overtime & wage deductions (ERA 1996 s.13)",
          promptText:
            locale === "pl"
              ? "Pracodawca nie zapłacił mi za 12 nadgodzin w zeszłym miesiącu. Jakie mam prawa i jak napisać wezwanie do HR?"
              : locale === "ro"
              ? "Angajatorul nu mi-a plătit 12 ore suplimentare luna trecută. Ce drepturi am și cum trimit o scrisoare la HR?"
              : "My employer didn't pay me for 12 hours of overtime last month. What are my rights and how do I write to HR?",
          actionType: "send_prompt",
          accent: "green",
        },
        {
          id: "init_cut_hours",
          label:
            locale === "pl"
              ? "Obcięcie godzin / Zero-hours"
              : locale === "ro"
              ? "Reducerea orelor / Zero-hours"
              : "Cut hours / Zero-hours contract",
          promptText:
            locale === "pl"
              ? "Mam umowę zero-hours i kierownik nagle obciął mi wszystkie zmiany w grafiku. Co mogę zrobić?"
              : locale === "ro"
              ? "Am contract zero-hours și managerul mi-a tăiat brusc toate turele. Ce pot face?"
              : "I'm on a zero-hours contract and my manager suddenly cut all my shifts. What can I do?",
          actionType: "send_prompt",
          accent: "blue",
        },
        {
          id: "init_ssp",
          label:
            locale === "pl"
              ? "Chorobowe SSP i Fit Note"
              : locale === "ro"
              ? "Concediu medical SSP & Fit Note"
              : "Statutory Sick Pay (SSP) & Fit Note",
          promptText:
            locale === "pl"
              ? "Oddałem zwolnienie lekarskie (Fit Note), ale HR odmawia wypłaty chorobowego SSP. Jak wymusić wypłatę lub formularz SSP1?"
              : locale === "ro"
              ? "Am trimis Fit Note, dar HR refuză plata SSP. Cum solicit plata sau formularul SSP1?"
              : "I submitted a Fit Note, but HR refuses to pay Statutory Sick Pay (SSP). How do I claim it or request form SSP1?",
          actionType: "send_prompt",
          accent: "orange",
        },
        {
          id: "init_grievance",
          label:
            locale === "pl"
              ? "Skarga Formal Grievance (ACAS)"
              : locale === "ro"
              ? "Plângere Formal Grievance (ACAS)"
              : "Formal Grievance letter (ACAS)",
          promptText:
            locale === "pl"
              ? "Chcę złożyć oficjalną skargę (Formal Grievance) na niesprawiedliwe traktowanie przez przełożonego. Przygotuj wzór pisma."
              : locale === "ro"
              ? "Vreau să depun o plângere oficială (Formal Grievance) împotriva managerului. Pregătește scrisoarea."
              : "I want to raise a Formal Grievance about unfair treatment by my manager. Please draft the letter.",
          actionType: "send_prompt",
          accent: "green",
        },
      ];
    }

    const aiTextLower = (lastAiMsg.text || "").toLowerCase();
    const recentUserMsg =
      [...chatMessages]
        .reverse()
        .find((m) => m.role === "user" && !m.isSystemBroadcast)?.text || "";
    const combinedLower = `${aiTextLower} ${recentUserMsg.toLowerCase()}`;

    const chips: DynamicFollowUpChip[] = [];

    // Topic-specific follow-up questions based on the last AI response
    if (
      /wypłat|nadgodzin|payslip|potrąc|pensj|stawk|unpaid|wage|deduct|overtime|section 13|nmw|holiday pay|salari/i.test(
        combinedLower
      )
    ) {
      chips.push(
        {
          id: "fu_wages_lba",
          label:
            locale === "pl"
              ? "Napisz przedsądowe wezwanie (7 dni na przelew)"
              : locale === "ro"
              ? "Redactează somație de plată (termen 7 zile)"
              : "Draft Letter Before Action (7-day deadline)",
          promptText:
            locale === "pl"
              ? "Przygotuj bardziej stanowcze przedsądowe wezwanie do zapłaty (Letter Before Action) z terminem 7 dni przed zgłoszeniem do ACAS."
              : locale === "ro"
              ? "Pregătește o somație oficială (Letter Before Action) cu termen de 7 zile înainte de sesizarea ACAS."
              : "Draft a firm Letter Before Action giving HR 7 days to pay the arrears before I start ACAS Early Conciliation.",
          actionType: "send_prompt",
          accent: "orange",
        },
        {
          id: "fu_wages_acas",
          label:
            locale === "pl"
              ? "Jak zgłosić sprawę do ACAS Early Conciliation?"
              : locale === "ro"
              ? "Cum deschid procedura ACAS Early Conciliation?"
              : "How do I start ACAS Early Conciliation?",
          promptText:
            locale === "pl"
              ? "Wyjaśnij krok po kroku, jak bezpłatnie zgłosić brak wypłaty do ACAS Early Conciliation i jak liczyć termin 3 miesięcy minus 1 dzień."
              : locale === "ro"
              ? "Explică pas cu pas cum sesizez gratuit ACAS Early Conciliation și cum se calculează termenul de 3 luni minus o zi."
              : "Explain step-by-step how to start free ACAS Early Conciliation and how the 3-months-minus-1-day deadline works.",
          actionType: "send_prompt",
          accent: "green",
        },
        {
          id: "fu_wages_holiday",
          label:
            locale === "pl"
              ? "Przelicz też wpływ nadgodzin na Holiday Pay"
              : locale === "ro"
              ? "Calculează și impactul asupra Holiday Pay"
              : "Include overtime impact on Holiday Pay",
          promptText:
            locale === "pl"
              ? "Czy regularne nadgodziny powinny być też wliczane do mojej stawki urlopowej (Holiday Pay) w UK? Dopisz to roszczenie do pisma."
              : locale === "ro"
              ? "Orele suplimentare regulate trebuie incluse și în calculul Holiday Pay în UK? Adaugă această solicitare în scrisoare."
              : "Should regular overtime also be included in my UK Holiday Pay rate? Please add that claim to my letter.",
          actionType: "send_prompt",
          accent: "blue",
        }
      );
    } else if (
      /zwolni|wypowiedzen|dyscyplin|dismiss|disciplinary|redundan|hearing|tribunal|concedier/i.test(
        combinedLower
      )
    ) {
      chips.push(
        {
          id: "fu_dismiss_appeal",
          label:
            locale === "pl"
              ? "Przygotuj oficjalne odwołanie od decyzji (Appeal)"
              : locale === "ro"
              ? "Redactează contestația oficială (Appeal)"
              : "Draft a formal Dismissal Appeal letter",
          promptText:
            locale === "pl"
              ? "Napisz oficjalne odwołanie od decyzji pracodawcy (Formal Appeal Letter) powołując się na naruszenie procedury ACAS Code of Practice."
              : locale === "ro"
              ? "Redactează o contestație oficială (Formal Appeal Letter) invocând încălcarea procedurii ACAS Code of Practice."
              : "Draft a formal Appeal Letter citing procedural breaches of the ACAS Code of Practice on Disciplinary and Grievance Procedures.",
          actionType: "send_prompt",
          accent: "orange",
        },
        {
          id: "fu_dismiss_sec10",
          label:
            locale === "pl"
              ? "Wniosek o przełożenie spotkania i reprezentanta (s.10)"
              : locale === "ro"
              ? "Cerere amânare ședință + reprezentant (s.10)"
              : "Request hearing postponement & union rep (s.10)",
          promptText:
            locale === "pl"
              ? "Przygotuj pismo o przesunięcie spotkania dyscyplinarnego o 5 dni roboczych, abym mógł skorzystać z prawa do reprezentanta (Section 10 ERA 1999)."
              : locale === "ro"
              ? "Pregătește o cerere de amânare a ședinței disciplinare cu 5 zile lucrătoare pentru a fi însoțit de reprezentant (Section 10 ERA 1999)."
              : "Draft a request to postpone the disciplinary hearing by 5 working days so my companion can attend under Section 10 of the Employment Relations Act 1999.",
          actionType: "send_prompt",
          accent: "green",
        },
        {
          id: "fu_dismiss_sar",
          label:
            locale === "pl"
              ? "Zażądaj pełnych akt i notatek HR (wniosek SAR)"
              : locale === "ro"
              ? "Solicită dosarul HR complet (cerere SAR)"
              : "Request all HR notes & evidence via SAR",
          promptText:
            locale === "pl"
              ? "Przygotuj wniosek Subject Access Request (UK GDPR Art. 15) o wydanie wszystkich notatek ze spotkań, wiadomości e-mail i dowodów w mojej sprawie."
              : locale === "ro"
              ? "Pregătește o cerere Subject Access Request (UK GDPR Art. 15) pentru toate notele HR, e-mailurile și probele din dosarul meu."
              : "Draft a Subject Access Request (UK GDPR Art. 15) demanding copies of all HR meeting notes, internal emails, and disciplinary evidence.",
          actionType: "send_prompt",
          accent: "blue",
        }
      );
    } else if (
      /chorob|ssp|fit note|l4|sick|zdrow|wypadek|medical|ssp1/i.test(combinedLower)
    ) {
      chips.push(
        {
          id: "fu_sick_ssp1",
          label:
            locale === "pl"
              ? "Wezwij HR do wypłaty SSP lub wydania druku SSP1"
              : locale === "ro"
              ? "Solicită plata SSP sau formularul SSP1"
              : "Demand SSP payment or statutory form SSP1",
          promptText:
            locale === "pl"
              ? "Napisz oficjalne wezwanie do HR o natychmiastowe naliczenie Statutory Sick Pay (SSP) albo wydanie formularza SSP1 z pisemnym uzasadnieniem."
              : locale === "ro"
              ? "Redactează o cerere oficială către HR pentru plata imediată a SSP sau eliberarea formularului SSP1 cu motivarea în scris."
              : "Draft a formal notice to HR requiring immediate payment of Statutory Sick Pay (SSP) or issuance of form SSP1 with written reasons.",
          actionType: "send_prompt",
          accent: "orange",
        },
        {
          id: "fu_sick_hmrc",
          label:
            locale === "pl"
              ? "Jak zgłosić odmowę SSP do HMRC Statutory Dispute Team?"
              : locale === "ro"
              ? "Cum reclam refuzul SSP la HMRC?"
              : "How to escalate unpaid SSP to HMRC Dispute Team?",
          promptText:
            locale === "pl"
              ? "Podaj dokładną instrukcję i numer do HMRC Statutory Payment Dispute Team, jeśli pracodawca nadal odmawia wypłaty SSP."
              : locale === "ro"
              ? "Oferă instrucțiunile exacte pentru sesizarea HMRC Statutory Payment Dispute Team dacă angajatorul refuză plata SSP."
              : "Provide step-by-step instructions for escalating an SSP refusal to the HMRC Statutory Payment Dispute Team.",
          actionType: "send_prompt",
          accent: "green",
        }
      );
    } else if (
      /skarg|grievance|mobbing|dyskrymin|harass|bully|equality act|traktowan/i.test(
        combinedLower
      )
    ) {
      chips.push(
        {
          id: "fu_grievance_letter",
          label:
            locale === "pl"
              ? "Wygeneruj pełną skargę Formal Grievance do HR"
              : locale === "ro"
              ? "Generează plângerea Formal Grievance către HR"
              : "Draft full Formal Grievance letter to HR",
          promptText:
            locale === "pl"
              ? "Sformułuj pełne pismo Formal Grievance zgodne z ACAS Code of Practice, wzywające pracodawcę do wyznaczenia spotkania wyjaśniającego w ciągu 5 dni."
              : locale === "ro"
              ? "Redactează o scrisoare Formal Grievance conformă cu ACAS Code of Practice, solicitând o ședință oficială în 5 zile."
              : "Draft a complete Formal Grievance letter under the ACAS Code of Practice requesting a grievance hearing within 5 working days.",
          actionType: "send_prompt",
          accent: "orange",
        },
        {
          id: "fu_grievance_evidence",
          label:
            locale === "pl"
              ? "Jakie dowody przygotować na spotkanie Grievance?"
              : locale === "ro"
              ? "Ce dovezi să pregătesc pentru ședința Grievance?"
              : "What evidence should I prepare for the hearing?",
          promptText:
            locale === "pl"
              ? "Stwórz listę kontrolną dowodów (świadkowie, wiadomości, dziennik zdarzeń), które powinienem zabrać na spotkanie Grievance Hearing."
              : locale === "ro"
              ? "Creează o listă de verificare cu dovezile (martori, mesaje, jurnal) pe care trebuie să le prezint la Grievance Hearing."
              : "Create an evidence checklist (witnesses, messages, incident log) that I should bring to the Grievance Hearing.",
          actionType: "send_prompt",
          accent: "green",
        }
      );
    } else {
      // General legal follow-ups for any other AI advice
      chips.push(
        {
          id: "fu_gen_steps",
          label:
            locale === "pl"
              ? "Wyjaśnij krok po kroku, co zrobić najpierw"
              : locale === "ro"
              ? "Explică pas cu pas ce trebuie făcut mai întâi"
              : "Explain step-by-step what to do first",
          promptText:
            locale === "pl"
              ? "Rozpisz mi w 3 prostych krokach, co dokładnie powinienem zrobić w pierwszej kolejności i jakich terminów pilnować."
              : locale === "ro"
              ? "Descrie în 3 pași simpli ce trebuie să fac mai întâi și ce termene legale trebuie să respect."
              : "Break down in 3 clear steps what I should do first and which statutory deadlines I must watch.",
          actionType: "send_prompt",
          accent: "green",
        },
        {
          id: "fu_gen_letter",
          label:
            locale === "pl"
              ? "Przygotuj oficjalne pismo po angielsku do HR"
              : locale === "ro"
              ? "Redactează scrisoarea oficială în engleză către HR"
              : "Draft an official English letter to HR",
          promptText:
            locale === "pl"
              ? "Przygotuj na podstawie tej porady gotowe, oficjalne pismo po angielsku do działu HR z powołaniem na odpowiednie przepisy UK."
              : locale === "ro"
              ? "Pe baza acestui sfat, redactează o scrisoare oficială în limba engleză către HR invocând legislația UK aplicabilă."
              : "Based on this advice, draft a formal English letter to HR citing the relevant UK statutory provisions.",
          actionType: "send_prompt",
          accent: "orange",
        }
      );
    }

    // Add contextual action chips (Pin last AI advice to Case / Switch Persona tone)
    if (lastAiMsg.id !== "msg_init" && !lastAiMsg.pinnedToCaseId) {
      chips.push({
        id: `fu_pin_${lastAiMsg.id}`,
        label:
          locale === "pl"
            ? "Przypnij odpowiedź do sprawy"
            : locale === "ro"
            ? "Fixează răspunsul la dosar"
            : "Pin response to Case",
        actionType: "pin_last_ai",
        targetMsgId: lastAiMsg.id,
        accent: "green",
      });
    }

    if (lastAiMsg.id !== "msg_init") {
      const currentPersona =
        voiceConfig?.preset === "standard" ? "trade_union" : "employment_law";
      chips.push({
        id: "fu_persona_tone",
        label:
          currentPersona === "employment_law"
            ? locale === "pl"
              ? "Przełącz na taktykę związkową (Trade Union)"
              : locale === "ro"
              ? "Comută pe tactica sindicală (Trade Union)"
              : "Switch to Trade Union Rep tactics"
            : locale === "pl"
            ? "Przełącz na tryb ustawowy (Employment Law)"
            : locale === "ro"
            ? "Comută pe modul legislativ (Employment Law)"
            : "Switch to statutory Employment Law mode",
        actionType: "switch_persona",
        accent: "blue",
      });
    }

    return chips.slice(0, 4);
  }, [chatMessages, locale, voiceConfig?.preset]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeMessageRef = useRef<HTMLDivElement | null>(null);
  const isAutoScrollPinnedRef = useRef<boolean>(true);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const lastScrollTopRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);
  const programmaticScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const prevMsgCountRef = useRef<number>(chatMessages.length);
  const prevLastMsgIdRef = useRef<string | null>(
    chatMessages[chatMessages.length - 1]?.id ?? null
  );
  const prevSpeakingMsgIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micRafRef = useRef<number | null>(null);
  const lastMicUiUpdateRef = useRef<number>(0);
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
    spokenCursor: number;
    progressiveReveal: boolean;
    streamActive: boolean;
    rate: number;
  }

  const [speechWaveMeta, setSpeechWaveMeta] = useState<{
    cursor: number;
    total: number;
    activeWord: string;
    energy: number;
    cadence: "peak" | "normal" | "breath";
  }>({
    cursor: 0,
    total: 100,
    activeWord: "",
    energy: 0.9,
    cadence: "normal",
  });

  const analyzeSpeechPhonetics = useCallback((rawText: string, cursorIndex: number) => {
    const total = Math.max(1, rawText.length);
    const clamped = Math.min(Math.max(0, Math.floor(cursorIndex)), total);
    const windowSlice = rawText.slice(Math.max(0, clamped - 2), Math.min(total, clamped + 3));

    // Check if the synthesizer is currently on a clause/sentence breath pause
    const isBreathPause = /[.,!?;:—–\n]/.test(windowSlice);

    // Extract the word currently being spoken around clamped cursor
    const before = rawText.slice(0, clamped);
    const after = rawText.slice(clamped);
    const leftWordMatch = before.match(/([\p{L}\p{N}£%.,-]+)\s*$/u);
    const rightWordMatch = after.match(/^([\p{L}\p{N}£%.,-]+)/u);

    let activeWord = "";
    if (leftWordMatch && rightWordMatch && !/\s$/.test(before)) {
      activeWord = `${leftWordMatch[1]}${rightWordMatch[1]}`;
    } else if (rightWordMatch) {
      activeWord = rightWordMatch[1];
    } else if (leftWordMatch) {
      activeWord = leftWordMatch[1];
    }
    activeWord = activeWord.replace(/[*#_~`>[\]()"']/g, "").trim().slice(0, 24);

    if (isBreathPause) {
      return {
        cursor: clamped,
        total,
        activeWord,
        energy: 0.38,
        cadence: "breath" as const,
      };
    }

    const vowelCount = (activeWord.match(/[aąeęioóuăâîy]/gi) || []).length;
    const emphaticCount = (activeWord.match(/[rzszcscz£0-9!]/gi) || []).length;
    const rawEnergy = 0.72 + Math.min(0.42, vowelCount * 0.09 + emphaticCount * 0.06);
    const cadence: "peak" | "normal" = rawEnergy >= 0.98 ? "peak" : "normal";

    return {
      cursor: clamped,
      total,
      activeWord,
      energy: Number(rawEnergy.toFixed(2)),
      cadence,
    };
  }, []);

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

    const currentScrollTop = container.scrollTop;
    const prevScrollTop = lastScrollTopRef.current;
    lastScrollTopRef.current = currentScrollTop;

    const distanceFromBottom =
      container.scrollHeight - currentScrollTop - container.clientHeight;

    // Detect explicit upward scroll delta by the user (even if a streaming/speech programmatic scroll was recently active)
    const scrolledUpward = currentScrollTop < prevScrollTop - 4;
    if (scrolledUpward && distanceFromBottom > 48) {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      isProgrammaticScrollRef.current = false;
      if (isAutoScrollPinnedRef.current) {
        isAutoScrollPinnedRef.current = false;
        setIsAutoScrollPinned(false);
      }
      return;
    }

    // Ignore downward scroll events triggered by our own programmatic auto-scroller unless already at bottom
    if (isProgrammaticScrollRef.current) {
      if (distanceFromBottom <= 72 && !isAutoScrollPinnedRef.current) {
        isAutoScrollPinnedRef.current = true;
        setIsAutoScrollPinned(true);
        setUnreadBelowCount(0);
      }
      return;
    }

    const shouldPin = distanceFromBottom <= 88;
    if (shouldPin !== isAutoScrollPinnedRef.current) {
      isAutoScrollPinnedRef.current = shouldPin;
      setIsAutoScrollPinned(shouldPin);
      if (shouldPin) {
        setUnreadBelowCount(0);
      }
    }
  }, []);

  // Immediate manual override when the user scrolls up with mouse wheel / trackpad
  const handleUserWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < -2) {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      isProgrammaticScrollRef.current = false;
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distanceFromBottom > 16 || container.scrollTop > 0) {
        isAutoScrollPinnedRef.current = false;
        setIsAutoScrollPinned(false);
      }
    }
  }, []);

  // Immediate manual override when the user drags downward (scrolling up to older messages) on touch screens
  const handleUserTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleUserTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || e.touches.length === 0) return;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;
    // Finger moving down (deltaY > 10) scrolls the chat viewport up toward earlier history
    if (deltaY > 10) {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      isProgrammaticScrollRef.current = false;
      if (container.scrollTop > 0 && isAutoScrollPinnedRef.current) {
        isAutoScrollPinnedRef.current = false;
        setIsAutoScrollPinned(false);
      }
    }
  }, []);

  // Smooth, non-canceling auto-scroll helper that anchors to the latest message and follows streaming/speech ticks when pinned
  const scrollToActiveStreamOrBottom = useCallback(
    (mode: "follow" | "smooth" = "follow", forcePin: boolean = false) => {
      if (forcePin) {
        isAutoScrollPinnedRef.current = true;
        setIsAutoScrollPinned(true);
        setUnreadBelowCount(0);
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
            if (mode === "smooth") {
              container.scrollTo({ top: targetTop, behavior: "smooth" });
            } else {
              // During 20Hz speech-synchronized text reveal & streaming chunks, smoothly advance scrollTop without resetting browser smooth-scroll velocity
              const step = delta > 140 ? delta * 0.55 : delta;
              container.scrollTop = container.scrollTop + step;
            }
          }
          lastScrollTopRef.current = container.scrollTop;
        }

        programmaticScrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScrollRef.current = false;
          if (scrollContainerRef.current) {
            lastScrollTopRef.current = scrollContainerRef.current.scrollTop;
          }
        }, mode === "smooth" ? 360 : 80);
      });
    },
    [chatMessages, speakingMsgId]
  );

  // Smoothly anchor when a new message arrives (unless the user manually scrolled up to review history)
  useEffect(() => {
    const lastMsg = chatMessages[chatMessages.length - 1];
    const lastMsgId = lastMsg?.id ?? null;
    const msgCountIncreased = chatMessages.length > prevMsgCountRef.current;
    const newLastMsgArrived =
      msgCountIncreased || (lastMsgId !== null && lastMsgId !== prevLastMsgIdRef.current);
    const speakingChanged = speakingMsgId !== prevSpeakingMsgIdRef.current;

    prevMsgCountRef.current = chatMessages.length;
    prevLastMsgIdRef.current = lastMsgId;
    prevSpeakingMsgIdRef.current = speakingMsgId;

    if (newLastMsgArrived) {
      const isUserSentMessage =
        lastMsg?.role === "user" && !lastMsg?.isSystemBroadcast;
      const isConversationReset = chatMessages.length <= 1;

      if (isUserSentMessage || isConversationReset) {
        // User just sent a message or reset the chat: always re-pin and smoothly anchor to bottom
        scrollToActiveStreamOrBottom("smooth", true);
      } else if (isAutoScrollPinnedRef.current) {
        // User is anchored at the bottom: smoothly scroll to the newly arrived message
        scrollToActiveStreamOrBottom("smooth", false);
      } else {
        // User manually scrolled up to review previous messages: respect their override and surface unread indicator
        setUnreadBelowCount((prev) => prev + 1);
      }
      return;
    }

    if (speakingChanged) {
      // When speech starts on a message or finishes (revealing the English statutory letter envelope), keep view aligned if pinned
      if (isAutoScrollPinnedRef.current) {
        scrollToActiveStreamOrBottom("smooth", false);
      }
      return;
    }

    // High-frequency streaming chunks or speech-paced character reveal (only scrolls if isAutoScrollPinnedRef.current is true)
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

  // Build clean Markdown document from the current chat transcript & legal analysis
  const buildChatTranscriptMarkdown = useCallback(() => {
    const now = new Date();
    const dateISO = now.toISOString().slice(0, 10);
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const headerTitle =
      locale === "pl"
        ? "# Ask Elon — Transkrypcja Konsultacji Prawa Pracy w UK"
        : locale === "ro"
        ? "# Ask Elon — Transcrierea Consultației privind Dreptul Muncii în UK"
        : "# Ask Elon — UK Employment Law Consultation Transcript";

    const metaBlock = [
      headerTitle,
      "",
      `- **${locale === "pl" ? "Data eksportu" : "Export Date"}:** ${dateISO} (${timeStr})`,
      `- **${locale === "pl" ? "Pracownik" : "Employee"}:** ${user.fullName || "N/A"} (${user.jobTitle || "N/A"})`,
      user.email ? `- **E-mail:** ${user.email}` : null,
      `- **${locale === "pl" ? "Pracodawca / Agencja" : "Employer / Agency"}:** ${user.employerName || "N/A"}`,
      user.employerAddress
        ? `- **${locale === "pl" ? "Adres pracodawcy" : "Employer Address"}:** ${user.employerAddress}`
        : null,
      user.hourlyRate
        ? `- **${locale === "pl" ? "Stawka godzinowa" : "Hourly Rate"}:** £${user.hourlyRate}/h`
        : null,
      "",
      "---",
      "",
    ]
      .filter((line) => line !== null)
      .join("\n");

    const summarySectionLines: string[] = [
      `## 1. ${locale === "pl" ? "Podsumowanie i Kontekst (ACAS / ERA 1996)" : locale === "ro" ? "Rezumat & Context (ACAS / ERA 1996)" : "Summary & Statutory Context"}`,
      "",
      `*${t("aiDisclaimer")}*`,
      "",
      `> ${legalSummary.topicSummary}`,
      "",
    ];

    if (legalSummary.deadlines.length > 0) {
      summarySectionLines.push(
        `### ${locale === "pl" ? "Terminy ustawowe (Statutory Deadlines)" : "Statutory Deadlines"}`,
        ""
      );
      legalSummary.deadlines.forEach((dl) => {
        summarySectionLines.push(
          `- **[${dl.timeframe}] ${dl.label}** (*${dl.authority}*) — ${dl.explanation}`
        );
      });
      summarySectionLines.push("");
    }

    if (legalSummary.rights.length > 0) {
      summarySectionLines.push(
        `### ${locale === "pl" ? "Kluczowe prawa pracownika w UK" : "Key UK Statutory Rights"}`,
        ""
      );
      legalSummary.rights.forEach((right) => {
        summarySectionLines.push(
          `- **${right.title}** (\`${right.statute}\`): ${right.explanation}`
        );
      });
      summarySectionLines.push("");
    }

    summarySectionLines.push("---", "");

    const transcriptLines: string[] = [
      `## 2. ${locale === "pl" ? "Pełny Zapis Rozmowy (Chat Transcript)" : "Consultation Chat Transcript"}`,
      "",
    ];

    chatMessages.forEach((msg, idx) => {
      const isAI = msg.role === "assistant";
      const speakerLabel = msg.isSystemBroadcast
        ? `System Broadcast (${msg.senderLabel || "Admin Hub"})`
        : isAI
        ? "Elon (UK Workplace AI Assistant)"
        : user.fullName || (locale === "pl" ? "Pracownik" : "Employee");

      const cleanBody = isAI ? stripEmbeddedEnglishLetter(msg.text).trim() : msg.text.trim();

      transcriptLines.push(`### ${isAI ? "🤖" : "👤"} ${speakerLabel} · \`${msg.timestamp}\``);
      transcriptLines.push("");
      transcriptLines.push(cleanBody);
      transcriptLines.push("");

      // Include generated official English letter if applicable for this turn
      const prevUserMsg =
        isAI && idx > 0
          ? chatMessages
              .slice(0, idx)
              .reverse()
              .find((m) => m.role === "user")?.text || ""
          : "";

      if (
        isAI &&
        msg.id !== "msg_init" &&
        !msg.id.startsWith("msg_reset_") &&
        !msg.id.startsWith("msg_sys_") &&
        !msg.isSystemBroadcast &&
        prevUserMsg.trim().length > 0
      ) {
        const letter = buildPersonalizedEnglishLetterForChat(prevUserMsg, msg.text, user);
        if (letter && letter.contentEn) {
          transcriptLines.push(
            `#### 📄 ${letter.titleEn} (${letter.statutoryReference})`,
            "",
            "```text",
            letter.contentEn.trim(),
            "```",
            ""
          );
        }
      }
    });

    transcriptLines.push(
      "---",
      "",
      `*${t("aiDisclaimer")}*`,
      ""
    );

    const fullMarkdown = [
      metaBlock,
      summarySectionLines.join("\n"),
      transcriptLines.join("\n"),
    ].join("\n");

    const filename = `ask-elon-consultation-${dateISO}.md`;
    const defaultSubject =
      locale === "pl"
        ? `Ask Elon — Zapis Konsultacji Prawa Pracy UK (${dateISO})`
        : locale === "ro"
        ? `Ask Elon — Transcrierea Consultației UK (${dateISO})`
        : `Ask Elon — UK Employment Law Consultation Transcript (${dateISO})`;

    return { fullMarkdown, filename, defaultSubject, dateISO };
  }, [chatMessages, legalSummary, locale, t, user]);

  // Export the current chat transcript & legal analysis as a clean Markdown (.md) file
  const handleExportChatMarkdown = () => {
    const { fullMarkdown, filename } = buildChatTranscriptMarkdown();

    const blob = new Blob([fullMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerRobotReaction("happy", 3200);
    showToast(
      locale === "pl"
        ? "Wyeksportowano zapis czatu do pliku Markdown (.md)!"
        : locale === "ro"
        ? "Conversația a fost exportată în format Markdown (.md)!"
        : "Exported chat consultation as a clean Markdown (.md) file!"
    );
  };

  // Open the 'Email Transcript' dialog pre-populated with user's registered email & Markdown transcript
  const handleOpenEmailTranscriptDialog = () => {
    const { fullMarkdown, filename, defaultSubject } = buildChatTranscriptMarkdown();
    setEmailRecipient(user.email || "");
    setEmailSubject(defaultSubject);
    setEmailMarkdownPreview(fullMarkdown);
    setEmailFilename(filename);
    setEmailDeliveryStatus(null);
    setIsEmailTranscriptModalOpen(true);
  };

  // Dispatch the exported Markdown transcript to the user's registered email via the Resend API backend route
  const handleSendTranscriptEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTargetEmail = emailRecipient.trim();
    if (!cleanTargetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanTargetEmail)) {
      setEmailDeliveryStatus({
        type: "error",
        message:
          locale === "pl"
            ? "Podaj poprawny adres e-mail odbiorcy."
            : "Please enter a valid recipient email address.",
      });
      return;
    }

    // If user updated their email address in the dialog, sync it to their registered profile
    if (cleanTargetEmail !== user.email) {
      updateUser({ email: cleanTargetEmail });
    }

    setIsSendingTranscriptEmail(true);
    setEmailDeliveryStatus(null);

    try {
      const response = await fetch("/api/email/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: cleanTargetEmail,
          recipientName: user.fullName || "Employee",
          subject:
            emailSubject.trim() || "Ask Elon — UK Employment Law Consultation Transcript",
          markdownContent: emailMarkdownPreview,
          filename: emailFilename,
          locale,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.error) {
        setEmailDeliveryStatus({
          type: "error",
          message:
            data?.error ||
            (locale === "pl"
              ? "Nie udało się wysłać wiadomości przez Resend API."
              : "Failed to send email via Resend API."),
        });
        return;
      }

      triggerRobotReaction("happy", 3600);
      setEmailDeliveryStatus({
        type: "success",
        deliveryId: data?.deliveryId,
        message:
          locale === "pl"
            ? `Wysłano transkrypcję Markdown (.md) na adres ${cleanTargetEmail} przez Resend API!`
            : locale === "ro"
            ? `Transcrierea Markdown (.md) a fost trimisă la ${cleanTargetEmail} prin Resend API!`
            : `Markdown transcript (.md) sent to ${cleanTargetEmail} via Resend API!`,
      });
      showToast(
        locale === "pl"
          ? `Wysłano zapis czatu na ${cleanTargetEmail}!`
          : `Sent chat transcript to ${cleanTargetEmail}!`
      );
    } catch (err: any) {
      setEmailDeliveryStatus({
        type: "error",
        message:
          err?.message ||
          (locale === "pl"
            ? "Błąd połączenia podczas wysyłki e-mail."
            : "Network error while sending transcript email."),
      });
    } finally {
      setIsSendingTranscriptEmail(false);
    }
  };

  // Navigate directly to a recommended statutory letter template
  const handleOpenTemplate = (templateId: string) => {
    setActiveTemplateId(templateId);
    setActiveTab("templates");
    setIsOptionsSheetOpen(false);
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
    session.spokenCursor = Math.max(session.spokenCursor, seg.rawStart);
    setSpeechWaveMeta(analyzeSpeechPhonetics(session.fullRawText, session.spokenCursor));

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

    const effectivePreset = voiceConfig?.preset || "young_professional";
    const voicePool =
      availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    const { voice: chosenVoice } = pickConfidentMaleVoice(voicePool, langTag, effectivePreset);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }
    // Dynamic pitch according to configured voice preset & fine-tuning
    utterance.pitch =
      typeof voiceConfig?.pitch === "number"
        ? voiceConfig.pitch
        : effectivePreset === "young_professional"
        ? 0.98
        : 1.0;
    utterance.volume = 1.0;

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      const active = liveSpeechRef.current;
      if (!active || active.msgId !== session.msgId) return;
      if (typeof event.charIndex === "number" && seg.spokenText.length > 0) {
        const charLen = (event as any).charLength || 5;
        const fraction = Math.min(1, (event.charIndex + charLen) / seg.spokenText.length);
        const mappedRaw = seg.rawStart + Math.ceil(fraction * (seg.rawEnd - seg.rawStart));
        const wordAligned = snapToWordEnd(active.fullRawText, mappedRaw, seg.rawEnd);
        if (wordAligned > active.spokenCursor) {
          active.spokenCursor = wordAligned;
          setSpeechWaveMeta(analyzeSpeechPhonetics(active.fullRawText, active.spokenCursor));
        }
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
      active.spokenCursor = Math.max(active.spokenCursor, seg.rawEnd);
      active.revealedChars = Math.max(active.revealedChars, seg.rawEnd);
      setSpeechWaveMeta(analyzeSpeechPhonetics(active.fullRawText, active.spokenCursor));
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
  }, [availableVoices, locale, voiceConfig?.preset, voiceConfig?.pitch, analyzeSpeechPhonetics]);

  // Smooth 45ms pacer timer so written words & dynamic audio wave visualizer flow in lockstep with Elon's speech
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

      // Advance characters & spoken cursor smoothly at natural speaking speed (~16 chars/sec * rate)
      const charsPerTick = 0.72 * session.rate;
      if (session.spokenCursor < seg.rawEnd) {
        session.spokenCursor = Math.min(seg.rawEnd, session.spokenCursor + charsPerTick);
        setSpeechWaveMeta(analyzeSpeechPhonetics(session.fullRawText, session.spokenCursor));
      }
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
        session.spokenCursor >= seg.rawEnd &&
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
  }, [speakingMsgId, isSpeechPaused, speakActiveSegment, analyzeSpeechPhonetics]);

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
        spokenCursor: 0,
        progressiveReveal,
        streamActive: false,
        rate: effectiveRate,
      };

      setSpeechWaveMeta(analyzeSpeechPhonetics(cleanSpokenSource, 0));

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
    [enqueueAvailableSegments, speakActiveSegment, showToast, t, analyzeSpeechPhonetics]
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

  // Cycle playback speed (0.92x -> 1.0x -> 1.15x)
  const handleCycleSpeed = (msgText: string, msgId: string) => {
    const currentIndex = SPEECH_RATES.indexOf(speechRate as any);
    const nextRate = SPEECH_RATES[(currentIndex + 1) % SPEECH_RATES.length];
    setSpeechRate(nextRate);
    speechRateRef.current = nextRate;
    updateVoiceConfig({ speed: nextRate });

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
        spokenCursor: 0,
        progressiveReveal: true,
        streamActive: isChatLoading,
        rate: speechRateRef.current,
      };

      setSpeechWaveMeta(analyzeSpeechPhonetics(cleanLastText, 0));
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
  }, [chatMessages, isChatLoading, autoReadAloud, enqueueAvailableSegments, speakActiveSegment, analyzeSpeechPhonetics]);

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

  const stopMicAnalyser = useCallback(() => {
    if (micRafRef.current !== null) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = null;
    }
    if (micSourceNodeRef.current) {
      try {
        micSourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      micSourceNodeRef.current = null;
    }
    if (analyserNodeRef.current) {
      try {
        analyserNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      analyserNodeRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== "closed") {
          audioContextRef.current.close().catch(() => {});
        }
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setMicAudioLevels(Array(18).fill(0.12));
    setMicRmsLevel(0);
    setIsVoiceDetected(false);
  }, []);

  const startMicAnalyser = useCallback(
    (stream: MediaStream) => {
      stopMicAnalyser();
      if (typeof window === "undefined") return;
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      try {
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.72;
        analyser.minDecibels = -85;
        analyser.maxDecibels = -18;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = ctx;
        analyserNodeRef.current = analyser;
        micSourceNodeRef.current = source;

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const timeData = new Uint8Array(analyser.fftSize);
        const BAR_COUNT = 18;

        const tick = (now: number) => {
          const activeAnalyser = analyserNodeRef.current;
          if (!activeAnalyser) return;

          if (now - lastMicUiUpdateRef.current >= 48) {
            lastMicUiUpdateRef.current = now;
            activeAnalyser.getByteFrequencyData(freqData);
            activeAnalyser.getByteTimeDomainData(timeData);

            // Compute normalized RMS amplitude from time-domain waveform
            let sumSquares = 0;
            for (let i = 0; i < timeData.length; i++) {
              const centered = (timeData[i] - 128) / 128;
              sumSquares += centered * centered;
            }
            const rms = Math.sqrt(sumSquares / timeData.length);
            const scaledRms = Math.min(100, Math.round(rms * 340));

            // Map vocal frequency bins (focusing on speech fundamentals & formants) into 18 symmetric bars
            const half = BAR_COUNT / 2;
            const halfBands: number[] = [];
            for (let i = 0; i < half; i++) {
              const binIdx = Math.min(freqData.length - 1, 1 + i * 2);
              const binNext = Math.min(freqData.length - 1, binIdx + 1);
              const avgVal = (freqData[binIdx] + freqData[binNext]) / 2;
              const normalized = Math.max(0.12, Math.min(1, Math.pow(avgVal / 255, 0.85) * 1.15 + rms * 0.65));
              halfBands.push(Number(normalized.toFixed(2)));
            }
            // Mirror center-outward for a balanced real-time speech spectrum
            const symmetricalBars = [...[...halfBands].reverse(), ...halfBands];

            setMicAudioLevels(symmetricalBars);
            setMicRmsLevel(scaledRms);
            setIsVoiceDetected(scaledRms >= 8);
          }

          micRafRef.current = requestAnimationFrame(tick);
        };

        micRafRef.current = requestAnimationFrame(tick);
      } catch {
        // Ignore AudioContext initialization failures in restricted environments
      }
    },
    [stopMicAnalyser]
  );

  const stopMediaStreams = useCallback(() => {
    stopMicAnalyser();
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
  }, [stopMicAnalyser]);

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

  const [isInputInvalidShake, setIsInputInvalidShake] = useState(false);
  const [showEmptyInputError, setShowEmptyInputError] = useState(false);
  const inputShakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emptyErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatInputTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Active AI Persona ('employment_law' vs 'trade_union'): auto-detected from conversation/voice preset with 1-click toggle
  const [personaOverride, setPersonaOverride] = useState<"employment_law" | "trade_union" | null>(
    null
  );

  const detectedAiPersona = useMemo<"employment_law" | "trade_union">(() => {
    const recentText = [
      ...chatMessages
        .filter((m) => m.id !== "msg_init" && !m.isSystemBroadcast)
        .slice(-4)
        .map((m) => m.text),
      chatDraft,
    ]
      .join(" ")
      .toLowerCase();

    if (
      /związk|związek|reprezentant|union|shop steward|dyscyplin|disciplinary|grievance|skarg|mobbing|nękan|bully|harass|hearing|przesłuchan|spotkanie z hr|section 10|towarzyszeni|negocjacj|strajk|collective/i.test(
        recentText
      )
    ) {
      return "trade_union";
    }
    if (
      /era 1996|section 13|wypłat|pensj|nadgodzin|potrąc|payslip|wage|overtime|deduct|underpaid|unpaid|minimum wage|urlop|holiday pay|ssp|fit note|tribunal|et1|p45|p60|gdpr|sar\b|contract|umow/i.test(
        recentText
      )
    ) {
      return "employment_law";
    }
    return voiceConfig?.preset === "standard" ? "trade_union" : "employment_law";
  }, [chatMessages, chatDraft, voiceConfig?.preset]);

  const activeAiPersona: "employment_law" | "trade_union" =
    personaOverride ?? detectedAiPersona;

  const handleToggleAiPersona = useCallback(() => {
    const nextPersona =
      activeAiPersona === "employment_law" ? "trade_union" : "employment_law";
    setPersonaOverride(nextPersona);
    updateVoiceConfig({
      preset: nextPersona === "trade_union" ? "standard" : "young_professional",
    });
    triggerRobotReaction(nextPersona === "trade_union" ? "thinking" : "happy", 1200);
  }, [activeAiPersona, updateVoiceConfig, triggerRobotReaction]);

  useEffect(() => {
    return () => {
      if (inputShakeTimerRef.current) clearTimeout(inputShakeTimerRef.current);
      if (emptyErrorTimerRef.current) clearTimeout(emptyErrorTimerRef.current);
    };
  }, []);

  const triggerEmptyInputFeedback = useCallback(() => {
    if (inputShakeTimerRef.current) {
      clearTimeout(inputShakeTimerRef.current);
      inputShakeTimerRef.current = null;
    }
    if (emptyErrorTimerRef.current) {
      clearTimeout(emptyErrorTimerRef.current);
      emptyErrorTimerRef.current = null;
    }

    // Re-trigger CSS keyframe animation cleanly even on rapid repeated attempts
    setIsInputInvalidShake(false);
    requestAnimationFrame(() => {
      setIsInputInvalidShake(true);
      inputShakeTimerRef.current = setTimeout(() => {
        setIsInputInvalidShake(false);
        inputShakeTimerRef.current = null;
      }, 400);
    });

    setShowEmptyInputError(true);
    emptyErrorTimerRef.current = setTimeout(() => {
      setShowEmptyInputError(false);
      emptyErrorTimerRef.current = null;
    }, 2200);

    try {
      navigator.vibrate?.(12);
    } catch {
      // ignore if vibration is unsupported
    }

    chatInputTextareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (isChatLoading) return;

    if (isDictating) {
      // If the user taps Send while actively recording, stop recording and auto-send once final transcription completes
      sendAfterTranscribeRef.current = true;
      stopDictationSession();
      return;
    }

    const activeAttachedIds = allowDocLibraryContext
      ? activeDocumentContext.docs.map((d) => d.id)
      : [];
    const trimmedDraft = chatDraft.trim();

    // Client-side validation: prevent sending empty or whitespace-only messages without attached context
    if (!trimmedDraft && activeAttachedIds.length === 0) {
      if (chatDraft.length > 0) {
        setChatDraft("");
      }
      triggerEmptyInputFeedback();
      return;
    }

    setShowEmptyInputError(false);
    setIsInputInvalidShake(false);
    isAutoScrollPinnedRef.current = true;
    setIsAutoScrollPinned(true);

    const primaryDoc = allowDocLibraryContext ? activeDocumentContext.primaryDoc : null;
    const textToSend = trimmedDraft
      ? trimmedDraft
      : primaryDoc
      ? locale === "pl"
        ? `Przeanalizuj proszę załączony dokument (${primaryDoc.name} — ${
            primaryDoc.categoryTag || primaryDoc.type
          }) pod kątem moich praw w UK.`
        : locale === "ro"
        ? `Te rog să analizezi documentul atașat (${primaryDoc.name} — ${
            primaryDoc.categoryTag || primaryDoc.type
          }) privind drepturile mele în UK.`
        : `Please review the attached document (${primaryDoc.name} — ${
            primaryDoc.categoryTag || primaryDoc.type
          }) regarding my UK employment rights.`
      : "";

    if (!textToSend) {
      triggerEmptyInputFeedback();
      return;
    }
    sendChatMessage(textToSend, activeAttachedIds);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const liveRecognizedTextRef = useRef<string>("");
  const lastTranscribedTextRef = useRef<string>("");

  // Instant Hybrid Voice Dictation:
  // 1) Runs native Web Speech API (interimResults: true) in parallel for 0ms real-time word-by-word streaming
  // 2) Runs 16kbps MediaRecorder + /api/gemini/transcribe (gemini-3.5-transcribe) for live audio visualizer & fallback
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
    liveRecognizedTextRef.current = "";
    lastTranscribedTextRef.current = "";
    lastTranscribedChunkCountRef.current = 0;
    sendAfterTranscribeRef.current = false;
    setShowEmptyInputError(false);
    setIsInputInvalidShake(false);

    // Start instant real-time browser SpeechRecognition in parallel whenever available
    let nativeRecognitionStarted = false;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = locale === "pl" ? "pl-PL" : locale === "ro" ? "ro-RO" : "en-GB";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + " ";
          }
          const spoken = transcript.trim();
          if (spoken) {
            speechProducedTextRef.current = true;
            liveRecognizedTextRef.current = spoken;
            const prefix = dictationBaseDraftRef.current;
            const combined = prefix ? `${prefix} ${spoken}` : spoken;
            setChatDraft(combined);
            setShowEmptyInputError(false);
            setIsInputInvalidShake(false);
            if (!mediaStreamRef.current) {
              setIsVoiceDetected(true);
              setMicRmsLevel(64);
              setMicAudioLevels(
                Array.from({ length: 18 }, (_, idx) => {
                  const centerWeight = 1 - Math.abs(idx - 8.5) / 10;
                  return Number(Math.max(0.2, Math.min(1, 0.35 + centerWeight * 0.55)).toFixed(2));
                })
              );
            }
          }
        };

        recognition.onspeechstart = () => {
          if (!mediaStreamRef.current) {
            setIsVoiceDetected(true);
            setMicRmsLevel(52);
          }
        };

        recognition.onspeechend = () => {
          if (!mediaStreamRef.current) {
            setIsVoiceDetected(false);
            setMicRmsLevel(4);
            setMicAudioLevels(Array(18).fill(0.14));
          }
        };

        recognition.onerror = () => {
          if (!canRecordMedia) {
            stopDictationSession();
          }
        };

        recognition.onend = () => {
          if (!canRecordMedia) {
            setIsDictating(false);
            stopMicAnalyser();
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
            if (sendAfterTranscribeRef.current) {
              sendAfterTranscribeRef.current = false;
              const prefix = dictationBaseDraftRef.current;
              const spoken = liveRecognizedTextRef.current.trim();
              const combined = spoken ? (prefix ? `${prefix} ${spoken}` : spoken) : "";
              if (combined) {
                isAutoScrollPinnedRef.current = true;
                setIsAutoScrollPinned(true);
                sendChatMessage(combined);
              }
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        nativeRecognitionStarted = true;
      } catch {
        recognitionRef.current = null;
      }
    }

    if (canRecordMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 16000,
          },
        });
        mediaStreamRef.current = stream;
        audioChunksRef.current = [];
        setRecordingSeconds(0);
        setIsDictating(true);
        startMicAnalyser(stream);

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
          ? new MediaRecorder(stream, {
              mimeType: preferredMime,
              audioBitsPerSecond: 16000,
            })
          : new MediaRecorder(stream, { audioBitsPerSecond: 16000 });

        recorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        // Fast progressive transcription fallback every 1.3s when native SpeechRecognition hasn't emitted text yet
        liveTranscribeTimerRef.current = setInterval(async () => {
          if (
            liveRecognizedTextRef.current.trim().length > 0 ||
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
            if (partialText && !liveRecognizedTextRef.current.trim()) {
              lastTranscribedChunkCountRef.current = snapshotCount;
              lastTranscribedTextRef.current = partialText;
              speechProducedTextRef.current = true;
              const prefix = dictationBaseDraftRef.current;
              setChatDraft(prefix ? `${prefix} ${partialText}` : partialText);
              setShowEmptyInputError(false);
              setIsInputInvalidShake(false);
            }
          } finally {
            isLiveTranscribingRef.current = false;
          }
        }, 1300);

        recorder.onstop = async () => {
          const mimeType = recorder.mimeType || preferredMime || "audio/webm";
          const chunks = [...audioChunksRef.current];
          audioChunksRef.current = [];
          stopMediaStreams();
          mediaRecorderRef.current = null;

          const prefix = dictationBaseDraftRef.current;
          const instantSpoken =
            liveRecognizedTextRef.current.trim() ||
            (lastTranscribedChunkCountRef.current >= chunks.length
              ? lastTranscribedTextRef.current.trim()
              : "");

          // Zero-latency path: if real-time SpeechRecognition or the latest live chunk already captured the text, finish immediately!
          if (instantSpoken) {
            const combined = prefix ? `${prefix} ${instantSpoken}` : instantSpoken;
            setChatDraft(combined);
            if (sendAfterTranscribeRef.current) {
              sendAfterTranscribeRef.current = false;
              isAutoScrollPinnedRef.current = true;
              setIsAutoScrollPinned(true);
              sendChatMessage(combined);
            }
            return;
          }

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
            const fallbackSpoken =
              finalText.trim() ||
              liveRecognizedTextRef.current.trim() ||
              lastTranscribedTextRef.current.trim();
            const combined = fallbackSpoken
              ? prefix
                ? `${prefix} ${fallbackSpoken}`
                : fallbackSpoken
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
        recorder.start(250);
        return;
      } catch {
        if (nativeRecognitionStarted) {
          setRecordingSeconds(0);
          setIsDictating(true);
          recordingTimerRef.current = setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
          }, 1000);
          return;
        }
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

    if (nativeRecognitionStarted) {
      setRecordingSeconds(0);
      setIsDictating(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const totalExtractedCount = legalSummary.rights.length + legalSummary.deadlines.length;

  const recommendedTemplatesList = legalSummary.recommendedTemplateIds
    .map((id) => templates.find((tpl) => tpl.id === id))
    .filter(Boolean);

  // Partition chat history into Active vs. Archived sessions
  const activeUnsavedChats = useMemo(
    () => recentUnsavedChats.filter((chat) => !chat.isArchived).slice(0, 10),
    [recentUnsavedChats]
  );

  const archivedUnsavedChats = useMemo(
    () => recentUnsavedChats.filter((chat) => Boolean(chat.isArchived)),
    [recentUnsavedChats]
  );

  const visibleTabChats = useMemo(
    () => (historyViewTab === "archived" ? archivedUnsavedChats : activeUnsavedChats),
    [historyViewTab, archivedUnsavedChats, activeUnsavedChats]
  );

  // Count how many chats in the currently selected view carry each color-coded tag
  const historyTagCounts = useMemo(() => {
    const counts: Record<ChatSessionTag, number> = {
      Grievance: 0,
      "Pay Dispute": 0,
      Contract: 0,
      Dismissal: 0,
      "Sick Pay": 0,
      Settlement: 0,
      GDPR: 0,
    };
    visibleTabChats.forEach((chat) => {
      (chat.tags || []).forEach((tag) => {
        if (counts[tag] !== undefined) {
          counts[tag] += 1;
        }
      });
    });
    return counts;
  }, [visibleTabChats]);

  // Group chats in the active view (Active or Archived) by date (dateISO), filtered by selectedHistoryTagFilter
  const groupedUnsavedChats = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const yesterdayISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const groupsMap = new Map<
      string,
      { dateISO: string; displayDate: string; items: RecentUnsavedChat[] }
    >();

    const filteredChats = visibleTabChats.filter((chat) => {
      if (selectedHistoryTagFilter === "ALL") return true;
      return Array.isArray(chat.tags) && chat.tags.includes(selectedHistoryTagFilter);
    });

    filteredChats.forEach((chat) => {
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
  }, [visibleTabChats, locale, selectedHistoryTagFilter]);

  const formatChatSessionTagLabel = (tag: ChatSessionTag) => {
    const meta = CHAT_SESSION_TAG_STYLES[tag];
    if (!meta) return tag;
    if (locale === "pl") return meta.shortLabelPl;
    if (locale === "ro") return meta.shortLabelRo;
    return tag;
  };

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
          icon: <ShieldAlert className="w-4 h-4 text-[#D97724]" />,
          bg: "bg-[#D97724]/15 border-[#D97724]/40",
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
          icon: <Scale className="w-4 h-4 text-[#38B28B]" />,
          bg: "bg-[#38B28B]/15 border-[#38B28B]/40",
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
          icon: <MessageSquare className="w-4 h-4 text-[#38B28B]" />,
          bg: "bg-[#38B28B]/15 border-[#38B28B]/35",
          label: locale === "pl" ? "Rozmowa" : "Chat",
        };
    }
  };

  // Reusable Legal Summary & Conversation History Content (embedded cleanly in Options Bottom Sheet)
  const renderLegalSummaryContent = (isInsideSheet: boolean = false) => (
    <div className="flex flex-col bg-[#0B2038] border border-white/10 rounded-2xl overflow-hidden shadow-md">
      {/* Summary Header */}
      <div className="px-4 py-3 bg-[#131B2E] border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#1D6852]/30 border border-[#38B28B]/40 flex items-center justify-center text-[#38B28B] shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold text-white tracking-tight truncate">
              {t("chat.legalSummary")} ·{" "}
              {locale === "pl"
                ? "Historia i Analiza"
                : locale === "ro"
                ? "Istoric & Analiză"
                : "History & Legal Analysis"}
            </h3>
            <p className="text-[11px] text-[#94A3B8] truncate flex items-center gap-1.5">
              {isChatLoading ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D97724] animate-pulse shrink-0" />
                  <span className="text-[#D97724] font-medium truncate">
                    {t("waitingForStreamBadge")}
                  </span>
                </>
              ) : isUpdatingSummary ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#38B28B] animate-pulse shrink-0" />
                  <span className="text-[#38B28B] font-medium truncate">
                    {t("analyzingContextBadge")}
                  </span>
                </>
              ) : (
                <span>
                  {locale === "pl"
                    ? `Aktywne (${activeUnsavedChats.length}/10) · Archiwum (${archivedUnsavedChats.length})`
                    : locale === "ro"
                    ? `Active (${activeUnsavedChats.length}/10) · Arhivate (${archivedUnsavedChats.length})`
                    : `Active (${activeUnsavedChats.length}/10) · Archived (${archivedUnsavedChats.length})`}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Tooltip
            side="bottom"
            wrap
            content={t("refreshLegalSummary")}
          >
            <button
              type="button"
              disabled={isChatLoading}
              onClick={() => runLegalSummaryExtraction(true)}
              aria-label={t("refreshLegalSummary")}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-[#94A3B8] hover:text-[#38B28B] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingSummary ? "animate-spin text-[#38B28B]" : ""}`} />
            </button>
          </Tooltip>

          <Tooltip
            side="bottom"
            content={t("copyLegalSummary")}
          >
            <button
              type="button"
              onClick={handleCopyLegalSummary}
              aria-label={t("copyLegalSummary")}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {!isInsideSheet && (
            <button
              type="button"
              onClick={() => setIsOptionsSheetOpen(false)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              aria-label="Close Summary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="p-3.5 space-y-4">
        {/* SECTION 0: HISTORY OF CONVERSATIONS WITH ACTIVE / ARCHIVED TABS & COLOR-CODED TAGS */}
        <div className="rounded-2xl bg-[#131B2E]/90 border border-[#D97724]/40 p-3 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#D97724]" />
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-white">
                {locale === "pl"
                  ? "Historia sesji czatu"
                  : locale === "ro"
                  ? "Istoric sesiuni chat"
                  : "Chat Session History"}
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#D97724]/20 border border-[#D97724]/40 text-[10px] font-mono font-extrabold text-[#FF9E58] tabular-nums">
              {historyViewTab === "archived"
                ? `${archivedUnsavedChats.length}`
                : `${activeUnsavedChats.length}/10`}
            </span>
          </div>

          {/* ACTIVE / ARCHIVED SEGMENTED TABS */}
          <div
            role="tablist"
            aria-label={locale === "pl" ? "Zakładki historii czatu" : "Chat history view tabs"}
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#0B2038] border border-white/10"
          >
            <button
              type="button"
              role="tab"
              aria-selected={historyViewTab === "active"}
              onClick={() => {
                setHistoryViewTab("active");
                setOpenTagPickerChatId(null);
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                historyViewTab === "active"
                  ? "bg-[#1D6852] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>{locale === "pl" ? "Aktywne" : locale === "ro" ? "Active" : "Active"}</span>
              <span className="text-[10px] font-mono tabular-nums opacity-85">
                ({activeUnsavedChats.length})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={historyViewTab === "archived"}
              onClick={() => {
                setHistoryViewTab("archived");
                setOpenTagPickerChatId(null);
              }}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                historyViewTab === "archived"
                  ? "bg-[#D97724] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <Archive className="w-3.5 h-3.5 shrink-0" />
              <span>
                {locale === "pl"
                  ? "Zarchiwizowane"
                  : locale === "ro"
                  ? "Arhivate"
                  : "Archived"}
              </span>
              <span className="text-[10px] font-mono tabular-nums opacity-85">
                ({archivedUnsavedChats.length})
              </span>
            </button>
          </div>

          <p className="text-[10px] text-[#94A3B8] leading-snug">
            {historyViewTab === "archived"
              ? locale === "pl"
                ? "Zarchiwizowane i zakończone rozmowy ukryte z głównej listy. Kliknij ikonę przywracania, aby przywrócić do aktywnych."
                : locale === "ro"
                ? "Conversații finalizate și arhivate. Faceți clic pe restaurare pentru a le readuce în lista activă."
                : "Completed cases hidden from the main view. Click restore to move a chat back to Active."
              : locale === "pl"
              ? "Przypisuj etykiety lub archiwizuj zakończone rozmowy, aby zachować porządek na głównej liście."
              : locale === "ro"
              ? "Atașați etichete sau arhivați cazurile finalizate pentru a păstra lista principală curată."
              : "Attach color-coded tags or archive completed sessions to keep your main history clean."}
          </p>

          {/* TAG FILTER BAR */}
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                <Filter className="w-2.5 h-2.5 text-[#38B28B]" />
                {locale === "pl"
                  ? "Filtruj po etykiecie:"
                  : locale === "ro"
                  ? "Filtrează după etichetă:"
                  : "Filter by label:"}
              </span>
              {selectedHistoryTagFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedHistoryTagFilter("ALL")}
                  className="text-[9px] font-bold text-[#FF9E58] hover:text-white transition-colors cursor-pointer"
                >
                  {locale === "pl" ? "Wyczyść filtr" : locale === "ro" ? "Resetează" : "Reset filter"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedHistoryTagFilter("ALL")}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                  selectedHistoryTagFilter === "ALL"
                    ? "bg-[#1D6852] text-white border-[#38B28B] shadow-sm"
                    : "bg-[#0B2038]/80 text-[#94A3B8] border-white/10 hover:border-white/25 hover:text-white"
                }`}
              >
                <span>{locale === "pl" ? "Wszystkie" : locale === "ro" ? "Toate" : "All"}</span>
                <span className="text-[9px] font-mono tabular-nums opacity-80">
                  ({visibleTabChats.length})
                </span>
              </button>

              {CHAT_SESSION_TAG_LIST.map((tag) => {
                const styleMeta = CHAT_SESSION_TAG_STYLES[tag];
                const isSelected = selectedHistoryTagFilter === tag;
                const count = historyTagCounts[tag] || 0;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedHistoryTagFilter((prev) => (prev === tag ? "ALL" : tag))
                    }
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? styleMeta.activeFilterClass
                        : "bg-[#0B2038]/80 text-[#CBD5E1] border-white/10 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styleMeta.dotClass}`} />
                    <span>{tag}</span>
                    {count > 0 && (
                      <span className="text-[9px] font-mono opacity-85">({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {groupedUnsavedChats.length > 0 ? (
            <div className="space-y-3 pt-1">
              {groupedUnsavedChats.map((group) => (
                <div key={group.dateISO} className="space-y-1.5">
                  {/* Date Group Header */}
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#38B28B] px-1">
                    <Calendar className="w-3 h-3 text-[#D97724] shrink-0" />
                    <span>{group.displayDate}</span>
                  </div>

                  {/* Conversation Items under this Date */}
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const iconMeta = renderUnsavedChatIcon(item.iconType);
                      const isActiveSession = item.id === activeUnsavedChatId;
                      const itemTags = Array.isArray(item.tags) ? item.tags : [];
                      const isTagPickerOpen = openTagPickerChatId === item.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            handleStopSpeech();
                            item.messages.forEach((m) =>
                              fullyRevealedMsgIdsRef.current.add(m.id)
                            );
                            restoreUnsavedChat(item.id);
                            setIsOptionsSheetOpen(false);
                          }}
                          className={`group rounded-xl p-2.5 border transition-all cursor-pointer flex flex-col gap-2 ${
                            isActiveSession
                              ? "bg-[#143A66] border-[#38B28B]/60 shadow-sm"
                              : "bg-[#0B2038]/85 hover:bg-[#1A243B] border-white/10 hover:border-[#D97724]/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              {/* Topic Icon Badge */}
                              <Tooltip side="top" content={iconMeta.label}>
                                <div
                                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconMeta.bg}`}
                                  aria-label={iconMeta.label}
                                >
                                  {iconMeta.icon}
                                </div>
                              </Tooltip>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/5 text-[#94A3B8] border border-white/10">
                                    {iconMeta.label}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#94A3B8]/80">
                                    {item.updatedAtTime}
                                  </span>
                                  {item.isArchived && (
                                    <span className="text-[9px] font-bold text-[#FF9E58]">
                                      ·{" "}
                                      {locale === "pl"
                                        ? `Archiwum${item.archivedAt ? ` (${item.archivedAt})` : ""}`
                                        : locale === "ro"
                                        ? `Arhivat${item.archivedAt ? ` (${item.archivedAt})` : ""}`
                                        : `Archived${item.archivedAt ? ` (${item.archivedAt})` : ""}`}
                                    </span>
                                  )}
                                  {isActiveSession && !item.isArchived && (
                                    <span className="text-[9px] font-extrabold text-[#38B28B]">
                                      • {locale === "pl" ? "Aktywna" : locale === "ro" ? "Activă" : "Active"}
                                    </span>
                                  )}
                                </div>

                                <div className="text-xs font-bold text-white group-hover:text-[#38B28B] transition-colors truncate mt-0.5">
                                  {item.title}
                                </div>

                                <p className="text-[10px] text-[#94A3B8] line-clamp-1 mt-0.5">
                                  {item.preview}
                                </p>
                              </div>
                            </div>

                            {/* Quick Tag Toggle, Save as Case, Archive/Restore & Remove Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <Tooltip
                                side="top"
                                disabled={isTagPickerOpen}
                                content={
                                  locale === "pl"
                                    ? "Dodaj lub zmień etykiety"
                                    : locale === "ro"
                                    ? "Gestionează etichetele"
                                    : "Attach or edit color tags"
                                }
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenTagPickerChatId((prev) =>
                                      prev === item.id ? null : item.id
                                    );
                                  }}
                                  aria-label="Manage session tags"
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isTagPickerOpen
                                      ? "bg-[#D97724] border-[#FF9E58] text-white"
                                      : "bg-white/5 hover:bg-white/10 border-white/10 text-[#94A3B8] hover:text-white"
                                  }`}
                                >
                                  <Tag className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>

                              <Tooltip side="top" content={t("saveAsCase")}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveUnsavedChatAsCase(item.id);
                                  }}
                                  aria-label={t("saveAsCase")}
                                  className="p-1.5 rounded-lg bg-[#1D6852]/30 hover:bg-[#1D6852] border border-[#38B28B]/30 text-[#38B28B] hover:text-white transition-colors cursor-pointer"
                                >
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>

                              <Tooltip
                                side="top"
                                content={
                                  item.isArchived
                                    ? locale === "pl"
                                      ? "Przywróć z archiwum"
                                      : locale === "ro"
                                      ? "Restaurează din arhivă"
                                      : "Restore from Archive"
                                    : locale === "pl"
                                    ? "Archiwizuj zakończoną rozmowę"
                                    : locale === "ro"
                                    ? "Arhivează conversația"
                                    : "Archive chat session"
                                }
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleArchiveUnsavedChat(item.id);
                                  }}
                                  aria-label={
                                    item.isArchived
                                      ? "Restore chat session from archive"
                                      : "Archive chat session"
                                  }
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    item.isArchived
                                      ? "bg-[#38B28B]/20 hover:bg-[#1D6852] border-[#38B28B]/40 text-[#38B28B] hover:text-white"
                                      : "bg-[#D97724]/15 hover:bg-[#D97724] border-[#D97724]/40 text-[#FF9E58] hover:text-white"
                                  }`}
                                >
                                  {item.isArchived ? (
                                    <ArchiveRestore className="w-3.5 h-3.5" />
                                  ) : (
                                    <Archive className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </Tooltip>

                              <Tooltip
                                side="top"
                                content={
                                  locale === "pl"
                                    ? "Usuń z historii"
                                    : locale === "ro"
                                    ? "Șterge din istoric"
                                    : "Remove from history"
                                }
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeUnsavedChat(item.id);
                                  }}
                                  aria-label={
                                    locale === "pl" ? "Usuń z historii" : "Remove from history"
                                  }
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-[#EF4444]/25 text-[#94A3B8] hover:text-[#FF8A8A] transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>
                            </div>
                          </div>

                          {/* Color-Coded Tags Row */}
                          <div
                            className="flex items-center gap-1.5 flex-wrap pl-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {itemTags.map((tag) => {
                              const tagStyle = CHAT_SESSION_TAG_STYLES[tag];
                              if (!tagStyle) return null;
                              return (
                                <span
                                  key={tag}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold border ${tagStyle.pillClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${tagStyle.dotClass}`} />
                                  <span>{formatChatSessionTagLabel(tag)}</span>
                                  <Tooltip
                                    side="top"
                                    content={
                                      locale === "pl"
                                        ? `Usuń etykietę ${tag}`
                                        : locale === "ro"
                                        ? `Elimină eticheta ${tag}`
                                        : `Remove ${tag} tag`
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleUnsavedChatTag(item.id, tag);
                                      }}
                                      aria-label={
                                        locale === "pl" ? `Usuń etykietę ${tag}` : `Remove ${tag} tag`
                                      }
                                      className="ml-0.5 hover:text-white opacity-75 hover:opacity-100 cursor-pointer"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </Tooltip>
                                </span>
                              );
                            })}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenTagPickerChatId((prev) =>
                                  prev === item.id ? null : item.id
                                );
                              }}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white border border-dashed border-white/20 transition-colors cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>{locale === "pl" ? "Etykieta" : locale === "ro" ? "Etichetă" : "Tag"}</span>
                            </button>
                          </div>

                          {/* Expandable Inline Color-Coded Tag Selector */}
                          {isTagPickerOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 pt-2 border-t border-white/10 pl-2 pr-1 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                                  {locale === "pl"
                                    ? "Przypisz etykiety do tej rozmowy:"
                                    : locale === "ro"
                                    ? "Atașați etichete acestei sesiuni:"
                                    : "Attach color-coded tags to this chat:"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setOpenTagPickerChatId(null)}
                                  className="text-[9px] font-bold text-[#38B28B] hover:text-white cursor-pointer"
                                >
                                  {locale === "pl" ? "Gotowe" : locale === "ro" ? "Gata" : "Done"}
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {CHAT_SESSION_TAG_LIST.map((tag) => {
                                  const tagStyle = CHAT_SESSION_TAG_STYLES[tag];
                                  const isAttached = itemTags.includes(tag);
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => toggleUnsavedChatTag(item.id, tag)}
                                      className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                                        isAttached
                                          ? tagStyle.pillClass
                                          : "bg-[#0B0F17]/70 text-[#94A3B8] border-white/10 hover:border-white/25 hover:text-white"
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${tagStyle.dotClass}`} />
                                      <span>{formatChatSessionTagLabel(tag)}</span>
                                      {isAttached && <CheckCircle2 className="w-2.5 h-2.5 ml-0.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 space-y-2 text-[11px] text-[#94A3B8]/80">
              <p>
                {selectedHistoryTagFilter !== "ALL"
                  ? locale === "pl"
                    ? `Brak rozmów z etykietą „${selectedHistoryTagFilter}” w tej zakładce.`
                    : locale === "ro"
                    ? `Nicio conversație cu eticheta „${selectedHistoryTagFilter}” în această filă.`
                    : `No chat sessions tagged with "${selectedHistoryTagFilter}" in this tab.`
                  : historyViewTab === "archived"
                  ? locale === "pl"
                    ? "Brak zarchiwizowanych rozmów. Użyj ikony archiwum na aktywnej rozmowie, aby ukryć ją z głównego widoku."
                    : locale === "ro"
                    ? "Nu există conversații arhivate."
                    : "No archived chat sessions yet. Use the Archive button on any completed chat to move it here."
                  : locale === "pl"
                  ? "Brak aktywnych rozmów w historii."
                  : "No active conversations in history."}
              </p>
              {selectedHistoryTagFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedHistoryTagFilter("ALL")}
                  className="px-2.5 py-1 rounded-lg bg-[#1D6852]/40 hover:bg-[#1D6852] border border-[#38B28B]/40 text-[10px] font-bold text-white transition-colors cursor-pointer"
                >
                  {locale === "pl"
                    ? "Pokaż wszystkie rozmowy"
                    : locale === "ro"
                    ? "Afișează toate conversațiile"
                    : "Show all chat sessions"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ACTIVE LEGAL CASES · SUBTLE REQUIRED DOCUMENTS PROGRESS SIDEBAR CARDS */}
        {cases.length > 0 && (
          <div className="rounded-xl bg-[#131B2E]/95 border border-white/15 p-3 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Scale className="w-3.5 h-3.5 text-[#D97724] shrink-0" />
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-white truncate">
                  {locale === "pl"
                    ? "Twoje Sprawy · Dokumenty"
                    : locale === "ro"
                    ? "Cazurile Tale · Documente"
                    : "Your Cases · Document Progress"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("cases");
                  setIsOptionsSheetOpen(false);
                }}
                className="text-[10px] font-bold text-[#D97724] hover:text-[#F59E0B] transition-colors cursor-pointer shrink-0"
              >
                {locale === "pl"
                  ? "Wszystkie →"
                  : locale === "ro"
                  ? "Toate →"
                  : "View all →"}
              </button>
            </div>

            <div className="space-y-2">
              {cases.map((c) => {
                const progress = computeCaseDocumentProgress(
                  c,
                  documents,
                  sentLetters,
                  user,
                  locale
                );
                const isSelected = (activeCaseId || cases[0]?.id) === c.id;
                const isReady = progress.percentage === 100;

                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setActiveCaseId(c.id);
                      setActiveTab("cases");
                      setIsOptionsSheetOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveCaseId(c.id);
                        setActiveTab("cases");
                        setIsOptionsSheetOpen(false);
                      }
                    }}
                    className={`group rounded-xl p-2.5 border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#1A2438] border-[#D97724]/50 shadow-sm"
                        : "bg-[#0B0F19]/80 border-white/10 hover:border-white/25 hover:bg-[#131B2E]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-[11px] font-bold text-white leading-snug line-clamp-1 group-hover:text-[#FBBF24] transition-colors">
                        {c.title}
                      </p>
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono tabular-nums font-extrabold ${
                          isReady
                            ? "bg-[#1D6852]/30 text-[#38B28B] border border-[#38B28B]/30"
                            : "bg-[#D97724]/15 text-[#FBBF24] border border-[#D97724]/30"
                        }`}
                      >
                        {progress.completedCount}/{progress.totalCount} ({progress.percentage}%)
                      </span>
                    </div>

                    {/* Smooth Width-Animated Document Progress Bar + Step Track */}
                    <div
                      role="progressbar"
                      aria-valuenow={progress.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Postęp dokumentów: ${progress.percentage}%`}
                      className="space-y-1 mb-1.5"
                    >
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full case-progress-bar-fill ${getCaseProgressWidthClass(
                            progress.percentage
                          )} ${
                            isReady
                              ? "bg-[#38B28B] shadow-[0_0_8px_rgba(56,178,139,0.45)]"
                              : "bg-gradient-to-r from-[#D97724] to-[#38B28B]"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-1 h-1">
                        {progress.items.map((item) => (
                          <div
                            key={item.id}
                            title={`${item.label}: ${item.completed ? "Gotowe" : "Brakuje"}`}
                            className="h-full rounded-full bg-white/10 overflow-hidden"
                          >
                            <div
                              className={`h-full rounded-full case-progress-segment-fill ${
                                item.completed
                                  ? isReady
                                    ? "w-full bg-[#38B28B]"
                                    : "w-full bg-gradient-to-r from-[#D97724] to-[#38B28B]"
                                  : "w-0 bg-transparent"
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-[#94A3B8] truncate">
                        {progress.nextMissingDocLabel ? (
                          <>
                            <span className="text-[#FBBF24] font-semibold">
                              {locale === "pl"
                                ? "Brakuje: "
                                : locale === "ro"
                                ? "Lipsește: "
                                : "Missing: "}
                            </span>
                            {progress.nextMissingDocLabel}
                          </>
                        ) : (
                          <span className="text-[#38B28B] font-semibold">
                            {progress.statusLabel}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="w-3 h-3 text-[#94A3B8] group-hover:text-white shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contextual Summary Digest */}
        <div className="rounded-xl bg-[#131B2E]/90 border border-white/10 p-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#94A3B8] mb-1">
            <span className="font-semibold text-[#38B28B]">
              {legalSummary.isBaseline ? "ACAS · ERA 1996" : "Active Context Analysis"}
            </span>
            <span className="font-mono tabular-nums text-[10px] text-[#94A3B8]/80">
              {legalSummary.updatedAt}
            </span>
          </div>
          <p className="text-xs text-[#F1F5F9] leading-relaxed">{legalSummary.topicSummary}</p>
          <p className="mt-2 pt-2 border-t border-white/10 text-[11px] text-[#94A3B8] italic">
            {t("aiDisclaimer")}
          </p>
        </div>

        {/* SECTION 1: STATUTORY DEADLINES & TIME LIMITS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-[#D97724]" />
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                {t("legalSummaryDeadlinesHeader")}
              </h4>
            </div>
            <span className="text-[11px] font-mono tabular-nums font-bold text-[#D97724]">
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
                      ? "bg-[#131B2E] border-[#D97724]/35"
                      : "bg-[#131B2E]/80 border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white leading-snug">{dl.label}</span>
                    <span
                      className={`font-mono tabular-nums text-xs font-extrabold whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md border ${
                        isCritical
                          ? "bg-[#EF4444]/20 border-[#EF4444]/50 text-[#FF8A8A]"
                          : isImportant
                          ? "bg-[#D97724]/20 border-[#D97724]/50 text-[#FFB074]"
                          : "bg-[#1D6852]/25 border-[#38B28B]/30 text-[#38B28B]"
                      }`}
                    >
                      {dl.timeframe}
                    </span>
                  </div>

                  {/* Unboxed Metadata Line with middle-dot separator */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] mb-1.5">
                    {isCritical && <AlertTriangle className="w-3 h-3 text-[#EF4444] shrink-0" />}
                    <span
                      className={
                        isCritical
                          ? "font-semibold text-[#FF8A8A]"
                          : isImportant
                          ? "font-semibold text-[#D97724]"
                          : "font-semibold text-[#38B28B]"
                      }
                    >
                      {urgencyText}
                    </span>
                    <span>·</span>
                    <span className="truncate">{dl.authority}</span>
                  </div>

                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">{dl.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: KEY UK STATUTORY RIGHTS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38B28B]" />
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                {t("legalSummaryRightsHeader")}
              </h4>
            </div>
            <span className="text-[11px] font-mono tabular-nums font-bold text-[#38B28B]">
              {legalSummary.rights.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {legalSummary.rights.map((right) => (
              <div
                key={right.id}
                className="rounded-xl bg-[#131B2E] border border-white/10 p-3 hover:border-[#38B28B]/30 transition-colors"
              >
                <h5 className="text-xs font-bold text-white leading-snug mb-1">{right.title}</h5>
                <div className="text-[11px] font-mono text-[#38B28B] mb-1.5">{right.statute}</div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">{right.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: RECOMMENDED STATUTORY LETTERS */}
        {recommendedTemplatesList.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-[#D97724]" />
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
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
                    className="w-full text-left rounded-xl bg-[#1A243B] hover:bg-[#163a5f] border border-white/10 hover:border-[#D97724]/50 p-2.5 flex items-center justify-between gap-2 transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white group-hover:text-[#D97724] transition-colors truncate">
                        {tplTitle}
                      </div>
                      <div className="text-[10px] font-mono text-[#94A3B8] truncate mt-0.5">
                        {tpl.statutoryReference}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#D97724] shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Side-Panel Footer Action */}
      {chatMessages.length > 1 && (
        <div className="p-3 bg-[#131B2E] border-t border-white/10 flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-1.5">
            <Tooltip
              side="top"
              content={
                locale === "pl"
                  ? "Zapisz rozmowę jako sprawę"
                  : locale === "ro"
                  ? "Salvează conversația ca dosar"
                  : "Save Conversation as Legal Case"
              }
            >
              <button
                type="button"
                onClick={() => {
                  saveCurrentChatAsCase();
                  setIsOptionsSheetOpen(false);
                }}
                className="py-2 px-2 rounded-xl bg-[#1D6852] hover:bg-[#1D6852]/90 border border-[#38B28B]/30 text-[11px] font-extrabold text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5 text-[#38B28B] shrink-0" />
                <span className="truncate">{t("saveAsCase")}</span>
              </button>
            </Tooltip>

            <Tooltip
              side="top"
              content={
                locale === "pl"
                  ? "Eksportuj do Markdown (.md)"
                  : locale === "ro"
                  ? "Exportă în Markdown (.md)"
                  : "Export to Markdown"
              }
            >
              <button
                type="button"
                onClick={handleExportChatMarkdown}
                className="py-2 px-2 rounded-xl bg-[#1A243B] hover:bg-[#163a5f] border border-[#D97724]/40 text-[11px] font-extrabold text-[#F1F5F9] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D97724] shrink-0" />
                <span className="truncate">
                  {locale === "pl" ? "Eksport .MD" : "Export .MD"}
                </span>
              </button>
            </Tooltip>

            <Tooltip
              side="top"
              content={
                locale === "pl"
                  ? "Wyślij transkrypcję na e-mail"
                  : locale === "ro"
                  ? "Trimite transcrierea pe e-mail"
                  : "Email Transcript (Markdown)"
              }
            >
              <button
                type="button"
                onClick={() => {
                  setIsOptionsSheetOpen(false);
                  handleOpenEmailTranscriptDialog();
                }}
                className="py-2 px-2 rounded-xl bg-[#1A243B] hover:bg-[#163a5f] border border-[#38B28B]/40 text-[11px] font-extrabold text-[#38B28B] hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-[#38B28B] shrink-0" />
                <span className="truncate">
                  {locale === "pl" ? "E-mail .MD" : "Email Transcript"}
                </span>
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-40 w-full h-[100dvh] flex flex-col bg-[#F8FAFC] dark:bg-[#141B23] text-[#1E293B] dark:text-[#F1F5F9] overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Clean 52px Full-Screen Chat Top Bar: Back + 28px Robot + "Elon" | Right: "⋯ Opcje" */}
      <header className="h-[52px] min-h-[52px] shrink-0 px-2.5 sm:px-4 border-b border-[#E2E8F0] dark:border-[#2C3847] bg-[#FFFFFF]/95 dark:bg-[#1E2732]/95 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              handleStopSpeech();
              closeChat();
            }}
            aria-label={t("chatBackBtn")}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#1E293B] dark:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 shrink-0 flex items-center justify-center">
              <AskElonShieldLogo
                variant="head-only"
                className="w-7 h-7"
                active
                activityState={robotState}
              />
            </div>
            <span className="text-base font-bold tracking-tight text-[#1E293B] dark:text-[#F1F5F9] truncate">
              Elon
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOptionsSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOptionsSheetOpen}
          aria-label={t("chatOptionsBtn")}
          className="min-h-[44px] px-3 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847] bg-[#F8FAFC] dark:bg-[#141B23] hover:border-[#0D9488] dark:hover:border-[#2DD4BF] text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] inline-flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" aria-hidden="true" />
          <span>{t("chatOptionsBtn")}</span>
        </button>
      </header>

      {/* Contextual Offline Protection Alert Banner during Chat */}
      {!isOnline && (
        <div className="shrink-0 mx-4 mt-2 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/40 p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff className="w-4 h-4 text-[#EF4444] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] block truncate">
                {t("chatOfflineBannerTitle")}
                {queuedMessagesCount > 0 ? ` · ${queuedMessagesCount} queued` : ""}
              </span>
            </div>
          </div>
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
            className="min-h-[36px] flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] text-xs font-bold text-[#2E6F57] dark:text-[#52B798] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isSimulatedOffline ? t("netRestoreOnline") : t("netCheckNow")}</span>
          </button>
        </div>
      )}

      {/* MIDDLE: Message Stream Only (stationary Robot Watermark behind scrollable message list) */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="chat-robot-watermark" aria-hidden="true">
          <img
            src="/brand/elon-robot-oryginal-przezroczysty.png"
            alt=""
            draggable={false}
            referrerPolicy="no-referrer"
            className="chat-robot-watermark-img"
          />
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScrollContainer}
          onWheel={handleUserWheel}
          onTouchStart={handleUserTouchStart}
          onTouchMove={handleUserTouchMove}
          className="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 py-3"
        >
          <div ref={messagesContentRef} className="max-w-3xl mx-auto space-y-3.5 pb-2">
          {(() => {
            const renderChatMessageItem = (
              msg: ChatMessage,
              idx: number,
              isGroupedInsideCard: boolean
            ) => {
              if (msg.id === "msg_init") {
                const initPeekSide = getBotBubblePeekSide(msg.id);
                const initMarginClass =
                  initPeekSide === "left"
                    ? "ml-6 sm:ml-7 mr-1"
                    : "mr-6 sm:mr-7 ml-1";
                const initPaddingClass =
                  initPeekSide === "left"
                    ? "pl-6 sm:pl-7 pr-4 sm:pr-5 py-4"
                    : "pl-4 sm:pl-5 pr-6 sm:pr-7 py-4";

                return (
                  <div
                    key={msg.id}
                    ref={(el) => {
                      messageRefsMap.current[msg.id] = el;
                    }}
                    className={`chat-bubble-elon relative overflow-visible rounded-2xl shadow-xs ${initMarginClass} ${initPaddingClass}`}
                  >
                    <ElonPeekingBubbleGrip side={initPeekSide} activityState={robotState} />
                    <div className="relative z-10 flex items-start gap-3.5">
                      <div className="w-13 h-13 sm:w-15 sm:h-15 flex items-center justify-center shrink-0">
                        <img
                          src="/brand/elon-robot-oryginal-przezroczysty.png"
                          alt="ask Elon Robot"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain drop-shadow-sm select-none"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] tracking-tight leading-snug">
                            {locale === "pl"
                              ? "Rozmowa z Elonem — Prawa Pracy w UK"
                              : locale === "ro"
                              ? "Conversație cu Elon — Dreptul Muncii în UK"
                              : "Chat with Elon — UK Employment Rights"}
                          </h2>
                          <span className="badge-demo-pill">DEMO</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed mt-1.5">
                          {locale === "pl"
                            ? "Opisz swoją sytuację w pracy (brak wypłaty, nadgodziny, chorobowe SSP, wypowiedzenie) albo załącz payslip. Wyjaśnię Twoje prawa w UK (ACAS / ERA 1996) i od razu przygotuję oficjalne pismo po angielsku."
                            : locale === "ro"
                            ? "Descrie situația de la muncă (ore neplătite, reducere ore, concediu medical SSP, concediere) sau atașează un fluturaș. Îți explic drepturile în UK (ACAS / ERA 1996) și pregătesc scrisoarea oficială în engleză."
                            : "Describe your workplace issue (unpaid wages, overtime, sick pay SSP, dismissal) or attach a payslip. I'll explain your UK rights (ACAS / ERA 1996) and draft a ready-to-send English letter."}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

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

              const botPeekSide: PeekEdgeSide | null = isAI ? getBotBubblePeekSide(msg.id) : null;
              const botActivityState = isAI
                ? isCurrentSpeaking && !isSpeechPaused
                  ? "speaking"
                  : isActivelyStreaming
                  ? "thinking"
                  : idx === chatMessages.length - 1 &&
                    (robotState === "typing" ||
                      robotState === "listening" ||
                      robotState === "happy" ||
                      robotState === "concerned")
                  ? robotState
                  : analyzeAiResponseSentiment(msg.text, prevUserMsg) || "idle"
                : "idle";

              const botSidePaddingClass = isAI
                ? botPeekSide === "left"
                  ? "pl-6 sm:pl-7 pr-4 py-3.5"
                  : "pl-4 pr-6 sm:pr-7 py-3.5"
                : "px-4 py-3.5";

              const botOuterMarginClass =
                isAI && !isGroupedInsideCard
                  ? botPeekSide === "left"
                    ? "ml-6 sm:ml-7 mr-1"
                    : "mr-6 sm:mr-7 ml-1"
                  : "";

              const bubbleClassName = isGroupedInsideCard
                ? `relative overflow-visible w-full ${botSidePaddingClass} transition-colors duration-200 ${
                    isAI
                      ? isCurrentSpeaking
                        ? isSpeechPaused
                          ? "chat-bubble-elon !rounded-none border-l-2 !border-l-[var(--accent-green)]"
                          : "chat-bubble-elon !rounded-none border-l-2 !border-l-[var(--accent-orange)]"
                        : "chat-bubble-elon !rounded-none !border-0"
                      : isQueued
                      ? "chat-bubble-user !rounded-none border-l-2 !border-l-[var(--accent-orange)]"
                      : "chat-bubble-user !rounded-none border-l-2 !border-l-[var(--accent-green)]"
                  }`
                : `${
                    isAI ? "w-[calc(100%-2rem)] sm:max-w-[92%]" : "max-w-[92%] sm:max-w-[85%]"
                  } ${botOuterMarginClass} ${botSidePaddingClass} rounded-2xl transition-all duration-300 ${
                    msg.isSystemBroadcast
                      ? "bg-gradient-to-r from-[#2B1608] via-[#1E2732] to-[#141B23] border-2 border-[var(--accent-orange)]/70 text-[var(--text-primary)]"
                      : isAI
                      ? isCurrentSpeaking
                        ? isSpeechPaused
                          ? "chat-bubble-elon !border-2 !border-[var(--accent-green)] shadow-[0_0_20px_rgba(82,183,152,0.2)]"
                          : "chat-bubble-elon !border-2 !border-[var(--accent-orange)] glow-orange"
                        : "chat-bubble-elon"
                      : isQueued
                      ? "chat-bubble-user !border-[var(--accent-orange)]/60"
                      : "chat-bubble-user"
                  }`;

              return (
                <div
                  key={msg.id}
                  ref={(el) => {
                    messageRefsMap.current[msg.id] = el;
                    if (isCurrentSpeaking || isActivelyStreaming) {
                      activeMessageRef.current = el;
                    }
                  }}
                  className={`flex flex-col ${
                    isGroupedInsideCard ? "items-stretch" : isAI ? "items-start" : "items-end"
                  } gap-2.5 ${
                    highlightedStageTargetKey === msg.id
                      ? "rounded-2xl ring-2 ring-[var(--accent-green)] ring-offset-2 ring-offset-[var(--bg-main)] transition-shadow duration-300"
                      : ""
                  }`}
                >
                  <div
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearBubbleLongPress();
                      openBubbleContextMenu(msg.id, e.clientX, e.clientY);
                    }}
                    onPointerDown={(e) => {
                      if (e.button === 2) return;
                      const targetEl = e.target as HTMLElement | null;
                      if (targetEl?.closest("button, a, input, textarea")) return;
                      clearBubbleLongPress();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      bubbleLongPressStartRef.current = { x: startX, y: startY };
                      bubbleLongPressTimerRef.current = setTimeout(() => {
                        bubbleLongPressTimerRef.current = null;
                        openBubbleContextMenu(msg.id, startX, startY);
                      }, 430);
                    }}
                    onPointerMove={(e) => {
                      if (!bubbleLongPressStartRef.current || !bubbleLongPressTimerRef.current) {
                        return;
                      }
                      const dx = e.clientX - bubbleLongPressStartRef.current.x;
                      const dy = e.clientY - bubbleLongPressStartRef.current.y;
                      if (dx * dx + dy * dy > 100) {
                        clearBubbleLongPress();
                      }
                    }}
                    onPointerUp={clearBubbleLongPress}
                    onPointerCancel={clearBubbleLongPress}
                    onPointerLeave={clearBubbleLongPress}
                    className={`${bubbleClassName} ${
                      bubbleContextMenu?.msgId === msg.id
                        ? "ring-2 ring-[var(--accent-green)] ring-offset-1 ring-offset-[var(--bg-main)]"
                        : ""
                    }`}
                  >
                    {/* Conditional Left/Right Peeking Robot Head + Metallic Fingers Gripping the Bubble Edge */}
                    {isAI && botPeekSide && (
                      <ElonPeekingBubbleGrip
                        side={botPeekSide}
                        activityState={botActivityState}
                      />
                    )}

                    {/* Header inside bubble */}
                    <div className="relative z-10 flex items-center justify-between gap-3 mb-1.5 text-[11px] text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {msg.isSystemBroadcast ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--accent-orange)]/20 border border-[var(--accent-orange)]/50 text-[var(--accent-orange)] font-extrabold text-[10px] uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{msg.senderLabel || "ADMIN HUB · KOMUNIKAT SYSTEMOWY"}</span>
                          </span>
                        ) : isAI ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-[var(--accent-green)]">
                            <AskElonShieldLogo
                              className="w-6 h-6 shrink-0"
                              activityState={botActivityState}
                            />
                            <span>Elon</span>
                          </span>
                        ) : (
                          <span className="font-bold text-[var(--accent-green)]">
                            {user.fullName ? user.fullName.split(" ")[0] : "Marek"}
                          </span>
                        )}

                        {msg.pinnedToCaseId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCaseId(msg.pinnedToCaseId!);
                              setActiveTab("cases");
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[var(--accent-green)]/15 hover:bg-[var(--accent-green)]/25 border border-[var(--accent-green)]/40 text-[10px] font-bold text-[var(--accent-green)] transition-colors cursor-pointer"
                            title={
                              locale === "pl"
                                ? "Otwórz przypięty element w zakładce Sprawy"
                                : "Open pinned item in Cases workspace"
                            }
                          >
                            <Pin className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                            <span>
                              {locale === "pl"
                                ? "Przypięto do sprawy"
                                : locale === "ro"
                                ? "Fixat la caz"
                                : "Pinned to Case"}
                            </span>
                          </button>
                        )}

                        {msg.flaggedAsIncorrect && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#D97724]/20 border border-[#D97724]/50 text-[10px] font-bold text-[#FBBF24]">
                            <Flag className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                            <span>
                              {locale === "pl"
                                ? "Zgłoszono błąd"
                                : locale === "ro"
                                ? "Marcat incorect"
                                : "Flagged as incorrect"}
                            </span>
                          </span>
                        )}

                        {/* Animated 5-Bar Audio Wave Indicator when speaking this bubble */}
                        {isCurrentSpeaking && (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${
                              isSpeechPaused
                                ? "bg-[#38B28B]/15 border-[#38B28B]/40 text-[#38B28B]"
                                : "bg-[#D97724]/20 border-[#D97724]/50 text-[#D97724]"
                            }`}
                            aria-live="polite"
                          >
                            <span className="inline-flex items-center gap-0.5 h-3" aria-hidden="true">
                              {[1, 2, 3, 4, 5].map((bar) => (
                                <span
                                  key={bar}
                                  className={`w-0.5 h-3 rounded-full origin-bottom transition-transform ${
                                    isSpeechPaused
                                      ? "bg-[#38B28B] scale-y-50"
                                      : `bg-[#D97724] audio-wave-bar-${bar}`
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

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono tabular-nums">{msg.timestamp}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            openBubbleContextMenu(msg.id, rect.left - 180, rect.bottom + 4);
                          }}
                          aria-haspopup="menu"
                          aria-expanded={bubbleContextMenu?.msgId === msg.id}
                          aria-label={
                            locale === "pl"
                              ? "Opcje wiadomości (przytrzymaj lub prawy klik)"
                              : locale === "ro"
                              ? "Opțiuni mesaj"
                              : "Message options"
                          }
                          className="p-1 rounded-md text-[#94A3B8]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Message Body synchronized with Elon's speech (strictly in user's native language) */}
                    <div className="relative z-10 text-body text-[15px] sm:text-base leading-[1.5] whitespace-pre-wrap font-normal text-[var(--text-primary)]">
                      {displayedText}
                      {(isActivelyStreaming || (isCurrentSpeaking && !isSpeechPaused && isProgressiveRevealing)) && (
                        <span
                          className="inline-block w-1.5 h-4 ml-1 align-middle bg-[var(--accent-green)] animate-pulse"
                          aria-hidden="true"
                        />
                      )}
                    </div>

                    {/* Dynamic Audio Wave Visualizer inside the Active Chat Message Bubble when Read-Aloud is playing */}
                    {isCurrentSpeaking && (
                      <Tooltip
                        side="top"
                        content={isSpeechPaused ? t("resumeListen") : t("pauseListen")}
                      >
                        <div
                          onClick={handlePauseResumeSpeech}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handlePauseResumeSpeech();
                            }
                          }}
                          style={
                            {
                              "--speech-rate-mult": speechRate,
                              "--speech-energy": isSpeechPaused ? 0.24 : speechWaveMeta.energy,
                            } as React.CSSProperties
                          }
                          className={`mt-3 rounded-xl px-3 py-2.5 border transition-all cursor-pointer select-none ${
                            isSpeechPaused
                              ? "bg-[#0B0F17]/65 border-[#38B28B]/40"
                              : "bg-[#0B0F17]/80 border-[#D97724]/50 shadow-[0_2px_14px_rgba(217,119,36,0.16)]"
                          }`}
                          aria-label={
                            locale === "pl"
                              ? "Wizualizator fali dźwiękowej czytania na głos"
                              : "Read-Aloud Dynamic Audio Wave Visualizer"
                          }
                        >
                        {/* Top Status Row of the Audio Wave Visualizer */}
                        <div className="flex items-center justify-between gap-2 mb-2 text-[10px]">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`inline-flex items-center gap-1 font-extrabold uppercase tracking-wider ${
                                isSpeechPaused ? "text-[#38B28B]" : "text-[#D97724]"
                              }`}
                            >
                              <Headphones className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {isSpeechPaused
                                  ? t("speechPaused")
                                  : locale === "pl"
                                  ? "Strumień audio na żywo"
                                  : locale === "ro"
                                  ? "Flux audio activ"
                                  : "Live Audio Stream"}
                              </span>
                            </span>

                            <span className="text-[#94A3B8]/60">·</span>

                            <span className="font-mono text-[#94A3B8] truncate">
                              {voiceConfig?.preset === "standard"
                                ? "Standard AI"
                                : locale === "pl"
                                ? "Młody Profesjonalny (28 l.)"
                                : "Young Pro (28yo)"}{" "}
                              ({speechRate}x)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!isSpeechPaused && speechWaveMeta.activeWord && (
                              <span className="px-2 py-0.5 rounded-md bg-[#131B2E] border border-white/10 text-[#F1F5F9] font-semibold truncate max-w-[130px] sm:max-w-[180px]">
                                „{speechWaveMeta.activeWord}”
                              </span>
                            )}
                            <span className="font-mono tabular-nums font-extrabold text-[#38B28B]">
                              {Math.min(
                                100,
                                Math.max(
                                  1,
                                  Math.round(
                                    (speechWaveMeta.cursor /
                                      Math.max(1, cleanNativeMsgText.length)) *
                                      100
                                  )
                                )
                              )}
                              %
                            </span>
                          </div>
                        </div>

                        {/* 28-Bar Symmetrical Dynamic CSS Audio Waveform synced with Synthesized Speech */}
                        <div
                          className="h-9 flex items-center justify-between gap-1 px-1"
                          aria-hidden="true"
                        >
                          {SPEECH_VISUALIZER_BARS.map((bar, barIdx) => {
                            const progressRatio =
                              speechWaveMeta.cursor /
                              Math.max(1, cleanNativeMsgText.length);
                            const barPositionRatio =
                              (barIdx + 1) / SPEECH_VISUALIZER_BARS.length;
                            const isPlayed = barPositionRatio <= progressRatio;
                            const isPlayhead =
                              Math.abs(barPositionRatio - progressRatio) < 0.045;

                            const cadenceClass =
                              !isSpeechPaused && speechWaveMeta.cadence === "breath"
                                ? "cadence-breath"
                                : "";

                            return (
                              <span
                                key={bar.id}
                                style={{
                                  height: `${bar.heightPx}px`,
                                  animationDelay: `${bar.delayMs}ms`,
                                }}
                                className={`flex-1 max-w-[5px] min-w-[2px] rounded-full read-aloud-wave-bar harmonic-${
                                  bar.harmonic
                                } ${cadenceClass} ${
                                  isSpeechPaused
                                    ? "is-paused bg-[#38B28B]/60"
                                    : isPlayhead
                                    ? "bg-[#D97724] shadow-[0_0_8px_rgba(217,119,36,0.8)]"
                                    : isPlayed
                                    ? "bg-gradient-to-t from-[#1D6852] via-[#38B28B] to-[#D97724]"
                                    : "bg-[#38B28B]/35"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                      </Tooltip>
                    )}

                    {/* Read Aloud Control Bar for AI Messages (Always visible at the bottom of the bubble during streaming & speaking) */}
                    {isAI && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Play / Pause Toggle Button */}
                          <Tooltip
                            side="top"
                            content={
                              !isCurrentSpeaking
                                ? locale === "pl"
                                  ? "Odsłuchaj odpowiedź głosem Elona"
                                  : locale === "ro"
                                  ? "Ascultă răspunsul lui Elon"
                                  : "Read Response Aloud"
                                : isSpeechPaused
                                ? t("resumeListen")
                                : t("pauseListen")
                            }
                          >
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
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                                isCurrentSpeaking
                                  ? isSpeechPaused
                                    ? "bg-[#38B28B] text-black shadow-[0_0_12px_rgba(46,229,157,0.35)]"
                                    : "bg-[#D97724] text-black shadow-[0_0_12px_rgba(255,106,0,0.4)]"
                                  : "bg-[#1A243B] hover:bg-[#163a5f] border border-[#38B28B]/35 text-[#38B28B] hover:text-white"
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
                          </Tooltip>

                          {/* Stop Button */}
                          <Tooltip
                            side="top"
                            wrap
                            content={t("stopListen")}
                          >
                            <button
                              type="button"
                              onClick={handleStopSpeech}
                              disabled={!isCurrentSpeaking}
                              aria-label={t("stopListen")}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                                isCurrentSpeaking
                                  ? "bg-white/10 hover:bg-[#EF4444]/20 border-white/15 hover:border-[#EF4444]/40 text-white hover:text-[#EF4444] cursor-pointer"
                                  : "bg-white/5 border-white/10 text-[#94A3B8]/40 cursor-not-allowed"
                              }`}
                            >
                              <Square className="w-3 h-3 fill-current shrink-0" />
                              <span>{t("stopListen")}</span>
                            </button>
                          </Tooltip>

                          {/* Inline Animated Audio Wave Indicator on Bottom Control Bar (Visible on mobile & desktop while speaking) */}
                          {isCurrentSpeaking && (
                            <div
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B0F17]/75 border border-[#D97724]/40"
                              aria-hidden="true"
                            >
                              <Volume2
                                className={`w-3.5 h-3.5 ${
                                  isSpeechPaused ? "text-[#38B28B]" : "text-[#D97724]"
                                }`}
                              />
                              <div className="flex items-center gap-0.5 h-3">
                                {[1, 2, 3, 4, 5].map((bar) => (
                                  <span
                                    key={bar}
                                    className={`w-0.5 h-3 rounded-full origin-bottom ${
                                      isSpeechPaused
                                        ? "bg-[#38B28B] scale-y-40"
                                        : `bg-[#D97724] audio-wave-bar-${bar}`
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-extrabold text-[#F1F5F9]">
                                {isSpeechPaused ? t("speechPaused") : t("speakingNow")}
                              </span>
                            </div>
                          )}

                          {/* Live Document Generation / Stream Indicator when generating long documents */}
                          {isActivelyStreaming && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1D6852]/25 border border-[#38B28B]/40 text-[10px] font-extrabold text-[#38B28B]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#38B28B] animate-ping" />
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
                        <Tooltip
                          side="top"
                          content={t("speechSpeed")}
                          hint="0.92x · 1.0x · 1.15x"
                        >
                          <button
                            type="button"
                            onClick={() => handleCycleSpeed(cleanNativeMsgText, msg.id)}
                            aria-label={`${t("speechSpeed")}: ${speechRate}x`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono tabular-nums font-bold text-[#94A3B8] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Gauge className="w-3.5 h-3.5 text-[#38B28B] shrink-0" />
                            <span>{speechRate}x</span>
                          </button>
                        </Tooltip>
                      </div>
                    )}

                    {/* Queued / Syncing Footer for Offline Messages */}
                    {(isQueued || isSending) && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-[11px]">
                        <span className="inline-flex items-center gap-1.5 text-[#D97724] font-semibold">
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
                            className="px-2 py-0.5 rounded bg-[#1D6852] hover:bg-[#1D6852]/90 text-white font-bold text-[10px] transition-colors whitespace-nowrap shrink-0"
                          >
                            {t("retryNowBtn")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Animated Appearing Envelope with Personalized English Document Preview, Save & Copy */}
                  {isConversationTurnFinished && generatedLetter && (
                    <div
                      ref={(el) => {
                        letterEnvelopeRefsMap.current[msg.id] = el;
                      }}
                      className={`${
                        isGroupedInsideCard ? "mx-3.5 mb-3" : "w-full sm:max-w-[97%]"
                      } envelope-card-enter rounded-2xl bg-gradient-to-br from-[#131B2E] via-[#12335A] to-[#0B2038] border-2 shadow-[0_10px_28px_rgba(0,0,0,0.45)] overflow-hidden transition-all duration-300 ${
                        highlightedStageTargetKey === `letter_${msg.id}`
                          ? "border-[#38B28B] ring-2 ring-[#38B28B] ring-offset-2 ring-offset-[#0B0F17]"
                          : "border-[#D97724]/60"
                      }`}
                    >
                      {/* Top Envelope Header with Animated Opening Envelope Graphic */}
                      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B2038]/80 border-b border-white/10">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Animated SVG Envelope with Rising Letter */}
                          <div className="relative w-14 h-14 rounded-2xl bg-[#143A66] border border-[#D97724]/50 flex items-center justify-center shrink-0 envelope-badge-float shadow-inner">
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
                                stroke="#D97724"
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
                                  stroke="#38B28B"
                                  strokeWidth="1.5"
                                />
                                <line
                                  x1="18"
                                  y1="17"
                                  x2="36"
                                  y2="17"
                                  stroke="#D97724"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                />
                                <line
                                  x1="18"
                                  y1="23"
                                  x2="45"
                                  y2="23"
                                  stroke="#131B2E"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                                <line
                                  x1="18"
                                  y1="28"
                                  x2="42"
                                  y2="28"
                                  stroke="#131B2E"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                              </g>
                              {/* Envelope front pocket */}
                              <path
                                d="M6 22 L32 40 L58 22 L58 51 C58 53.76 55.76 56 53 56 L11 56 C8.24 56 6 53.76 6 51 Z"
                                fill="#131B2E"
                                stroke="#D97724"
                                strokeWidth="2"
                              />
                              {/* Envelope top flap opening animation */}
                              <path
                                d="M6 22 L32 6 L58 22 Z"
                                fill="#D97724"
                                fillOpacity="0.88"
                                stroke="#D97724"
                                strokeWidth="1.5"
                                className="envelope-flap-anim"
                              />
                            </svg>
                            <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-[#38B28B] text-[#0B0F17] font-extrabold text-[9px] tracking-wider uppercase shadow">
                              EN
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#38B28B] flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-[#D97724]" />
                                {locale === "pl"
                                  ? "Gotowe Pismo Urzędowe (Język Angielski)"
                                  : locale === "ro"
                                  ? "Scrisoare Oficială Pregătită (Limba Engleză)"
                                  : "Official UK Legal Letter Ready (English)"}
                              </span>
                              <span className="text-[10px] font-mono text-[#94A3B8] bg-white/5 px-2 py-0.5 rounded border border-white/10">
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
                            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
                              <span className="text-[#38B28B] font-semibold">
                                {locale === "pl" ? "Wypełniono z profilu:" : "Auto-filled:"}
                              </span>{" "}
                              {user.fullName} · {user.homeAddress} · {user.phone} →{" "}
                              <span className="text-white font-semibold">{user.employerName}</span>
                            </p>
                          </div>
                        </div>

                        {/* Envelope Action Buttons: Full-Screen Preview Popup, Copy, Save */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Tooltip
                            side="top"
                            content={
                              locale === "pl"
                                ? "Pełny podgląd gotowego pisma EN"
                                : locale === "ro"
                                ? "Previzualizare completă scrisoare EN"
                                : "Preview Full English Letter"
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewModalLetter({
                                  ...generatedLetter,
                                  msgId: msg.id,
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1D6852] to-[#38B28B] hover:opacity-95 text-black text-xs font-extrabold transition-all shadow-md cursor-pointer"
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
                          </Tooltip>

                          {/* Copy English Letter Button */}
                          <Tooltip
                            side="top"
                            content={
                              locale === "pl"
                                ? "Kopiuj pismo po angielsku"
                                : locale === "ro"
                                ? "Copiază scrisoarea în engleză"
                                : "Copy English Letter to Clipboard"
                            }
                          >
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
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D97724] hover:bg-[#D97724]/90 text-black text-xs font-extrabold transition-all shadow-sm cursor-pointer"
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
                          </Tooltip>

                          {/* Save / Open in Pisma Tab */}
                          <Tooltip
                            side="top"
                            content={
                              locale === "pl"
                                ? "Zapisz pismo w archiwum Pism UK"
                                : locale === "ro"
                                ? "Salvează în arhiva de scrisori"
                                : "Save to Saved Letters Archive"
                            }
                          >
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
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A243B] hover:bg-[#163a5f] border border-[#38B28B]/40 text-white text-xs font-extrabold transition-all shadow-sm cursor-pointer"
                            >
                              <BookmarkCheck className="w-3.5 h-3.5 text-[#38B28B]" />
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
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            };

            return chatMessageGroups.map((group, groupIdx) => {
              if (group.items.length === 1 || group.isSystemGroup) {
                const { msg, idx } = group.items[0];
                return renderChatMessageItem(msg, idx, false);
              }

              const hasActiveChild = group.items.some(({ msg, idx }) => {
                const isAI = msg.role === "assistant";
                const isSpeakingHere = isAI && speakingMsgId === msg.id;
                const isStreamingHere =
                  isAI && isChatLoading && idx === chatMessages.length - 1 && msg.id !== "msg_init";
                const isQueuedHere = msg.status === "queued" || msg.status === "sending";
                return isSpeakingHere || isStreamingHere || isQueuedHere;
              });

              const isLatestGroup = groupIdx === chatMessageGroups.length - 1;
              const defaultCollapsed = !isLatestGroup && !hasActiveChild;
              const isCollapsed = hasActiveChild
                ? false
                : groupCollapseOverrides[group.id] ?? defaultCollapsed;

              const timeRangeLabel =
                group.startTimestamp === group.endTimestamp
                  ? group.startTimestamp
                  : `${group.startTimestamp} – ${group.endTimestamp}`;

              const hasUserMsg = group.items.some(({ msg }) => msg.role === "user");
              const hasAiMsg = group.items.some(({ msg }) => msg.role === "assistant");
              const participantsLabel =
                hasUserMsg && hasAiMsg
                  ? `${user.fullName ? user.fullName.split(" ")[0] : locale === "pl" ? "Ty" : "You"} & Elon`
                  : hasAiMsg
                  ? "Elon"
                  : user.fullName || (locale === "pl" ? "Ty" : "You");

              const firstTopicSource =
                group.items.find(({ msg }) => msg.role === "user")?.msg.text ||
                group.items[0].msg.text;
              const compactPreviewText = stripEmbeddedEnglishLetter(firstTopicSource)
                .replace(/\s+/g, " ")
                .trim();

              const countLabel =
                locale === "pl"
                  ? `${group.items.length} wiad.`
                  : locale === "ro"
                  ? `${group.items.length} mes.`
                  : `${group.items.length} msgs`;

              return (
                <div
                  key={group.id}
                  className={`${
                    hasAiMsg ? "mx-6 sm:mx-7 w-[calc(100%-3rem)] sm:w-[calc(100%-3.5rem)]" : "w-full sm:max-w-[97%]"
                  } rounded-2xl ${
                    isCollapsed ? "bg-[var(--bubble-elon)] backdrop-blur-[6px]" : "bg-transparent"
                  } border shadow-xs overflow-visible transition-all duration-300 ${
                    hasActiveChild
                      ? "border-[var(--accent-orange)]/60 shadow-[0_0_20px_rgba(245,158,66,0.12)]"
                      : "border-[var(--border-color)]"
                  }`}
                >
                  {/* Unified 5-Minute Cluster Header Bar */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={!isCollapsed}
                    onClick={() => {
                      if (!hasActiveChild) toggleGroupCollapsed(group.id, isCollapsed);
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !hasActiveChild) {
                        e.preventDefault();
                        toggleGroupCollapsed(group.id, isCollapsed);
                      }
                    }}
                    className={`px-3.5 py-2 rounded-t-2xl ${
                      isCollapsed ? "bg-transparent" : "bg-[var(--bubble-elon)] backdrop-blur-[6px]"
                    } border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2 transition-colors ${
                      hasActiveChild ? "cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-wrap text-[11px] text-[#94A3B8]">
                      <Clock className="w-3.5 h-3.5 text-[#D97724] shrink-0" />
                      <span className="font-mono tabular-nums font-semibold text-[#F1F5F9]">
                        {timeRangeLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#38B28B]">{countLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium truncate">{participantsLabel}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!hasActiveChild && (
                        <Tooltip
                          side="top"
                          content={
                            isCollapsed
                              ? locale === "pl"
                                ? "Rozwiń wiadomości z tego okna 5 min"
                                : locale === "ro"
                                ? "Extinde mesajele din această fereastră de 5 min"
                                : "Expand messages in this 5-min group"
                              : locale === "pl"
                              ? "Zwiń grupę do kompaktowej karty"
                              : locale === "ro"
                              ? "Restrânge grupul într-un card compact"
                              : "Collapse group into compact card"
                          }
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroupCollapsed(group.id, isCollapsed);
                            }}
                            aria-label={
                              isCollapsed
                                ? locale === "pl"
                                  ? "Rozwiń grupę"
                                  : "Expand group"
                                : locale === "pl"
                                ? "Zwiń grupę"
                                : "Collapse group"
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-[#F1F5F9] transition-colors cursor-pointer"
                          >
                            {isCollapsed ? (
                              <>
                                <ChevronDown className="w-3.5 h-3.5 text-[#38B28B]" />
                                <span>
                                  {locale === "pl"
                                    ? "Rozwiń"
                                    : locale === "ro"
                                    ? "Extinde"
                                    : "Expand"}
                                </span>
                              </>
                            ) : (
                              <>
                                <ChevronUp className="w-3.5 h-3.5 text-[#94A3B8]" />
                                <span>
                                  {locale === "pl"
                                    ? "Zwiń"
                                    : locale === "ro"
                                    ? "Restrânge"
                                    : "Collapse"}
                                </span>
                              </>
                            )}
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Collapsed Compact Summary Strip OR Expanded Unified Message Stack */}
                  {isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapsed(group.id, true)}
                      className="w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <p className="text-xs text-[#94A3B8] truncate min-w-0">
                        <span className="font-semibold text-[#F1F5F9] mr-1.5">
                          {locale === "pl" ? "Temat:" : locale === "ro" ? "Subiect:" : "Topic:"}
                        </span>
                        {compactPreviewText || "..."}
                      </p>
                      <span className="text-[10px] font-mono text-[#38B28B] shrink-0">
                        {locale === "pl"
                          ? `Pokaż (${group.items.length})`
                          : `Show (${group.items.length})`}
                      </span>
                    </button>
                  ) : (
                    <div className="divide-y divide-white/10">
                      {group.items.map(({ msg, idx }) => renderChatMessageItem(msg, idx, true))}
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Loading Indicator before first stream chunk arrives */}
          {isChatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
            <div className="flex items-start">
              <div className="chat-bubble-elon rounded-2xl px-4 py-3 text-sm text-[var(--text-secondary)] flex items-center gap-2 shadow-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-[#38B28B] animate-bounce"></span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#38B28B] animate-bounce [animation-delay:0.2s]"></span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#38B28B] animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs font-medium ml-1">Elon analizuje prawo pracy UK...</span>
              </div>
            </div>
          )}

          {/* Clear Quick-Start Topic Prompts ONLY on Empty Chat (disappears after first user message) */}
          {!hasUserMessages && !isChatLoading && (
            <div className="pt-1 space-y-2">
              <div className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] px-1">
                {locale === "pl"
                  ? "Wybierz temat rozmowy lub opisz własną sytuację poniżej:"
                  : locale === "ro"
                  ? "Alege un subiect sau descrie situația ta mai jos:"
                  : "Pick a UK workplace topic or describe your situation below:"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "q1", icon: <Banknote className="w-4 h-4 text-[#FBBF24] shrink-0" /> },
                  { key: "q2", icon: <Briefcase className="w-4 h-4 text-[#38BDF8] shrink-0" /> },
                  { key: "q3", icon: <HeartPulse className="w-4 h-4 text-[#A78BFA] shrink-0" /> },
                  { key: "q4", icon: <ShieldAlert className="w-4 h-4 text-[#D97724] shrink-0" /> },
                ].map(({ key, icon }) => {
                  const label = t(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        isAutoScrollPinnedRef.current = true;
                        setIsAutoScrollPinned(true);
                        sendChatMessage(label);
                      }}
                      className="text-left p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E2732] hover:border-[#0D9488] dark:hover:border-[#2DD4BF] border border-[#E2E8F0] dark:border-[#2C3847] transition-all flex items-start gap-2.5 cursor-pointer group shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-none"
                    >
                      <span className="mt-0.5">{icon}</span>
                      <span className="text-xs font-medium text-[#1E293B] dark:text-[#F1F5F9] leading-snug">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Clean Bottom Dock: optional Scroll-to-latest round button, Voice Visualizer, max 1 row CO DALEJ, Input + Send, 11px disclaimer */}
      <div className="shrink-0 bg-[#F8FAFC] dark:bg-[#141B23] border-t border-[#E2E8F0] dark:border-[#2C3847] px-3 sm:px-4 pt-2 pb-2.5 z-20">
        <div className="max-w-3xl mx-auto space-y-1.5">
          {/* Non-overlapping Scroll-to-latest + compact analyzing chip row above input */}
          {(!isAutoScrollPinned || isAnalyzingAttachment) && (
            <div className="flex items-center justify-between gap-2 min-h-[36px]">
              <div className="min-w-0 flex-1">
                {isAnalyzingAttachment && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFFFFF] dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] text-[11px] font-semibold text-[#1E293B] dark:text-[#F1F5F9] max-w-full"
                  >
                    <Loader2 className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF] animate-spin shrink-0" />
                    <span className="truncate">
                      {locale === "pl"
                        ? "AI analizuje załącznik..."
                        : locale === "ro"
                        ? "AI analizează atașamentul..."
                        : "Analyzing attachment..."}
                    </span>
                  </div>
                )}
              </div>

              {!isAutoScrollPinned && (
                <button
                  type="button"
                  onClick={() => scrollToActiveStreamOrBottom("smooth", true)}
                  aria-label={t("chatScrollToLatest")}
                  title={t("chatScrollToLatest")}
                  className="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#FFFFFF] dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] hover:border-[#0D9488] dark:hover:border-[#2DD4BF] text-[#0D9488] dark:text-[#2DD4BF] shadow-md flex items-center justify-center transition-colors shrink-0 ml-auto cursor-pointer"
                >
                  <ChevronDown className="w-5 h-5" />
                  {unreadBelowCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F59E42] dark:bg-[#FBB063] text-[#141B23] font-mono text-[10px] font-extrabold flex items-center justify-center leading-none">
                      {unreadBelowCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Real-Time Speech-to-Text Audio Level Visualizer Strip (Active during Voice Dictation / Transcription) */}
          {(isDictating || isTranscribing) && (
            <div
              role="status"
              aria-live="polite"
              aria-label={
                locale === "pl"
                  ? "Wizualizator poziomu dźwięku mikrofonu w czasie rzeczywistym"
                  : "Real-time speech-to-text microphone audio level visualizer"
              }
              className={`rounded-2xl px-3 py-2.5 border transition-colors shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                isTranscribing
                  ? "bg-[#131B2E] border-[#D97724]/50"
                  : isVoiceDetected
                  ? "bg-[#131B2E] border-[#38B28B]/60"
                  : "bg-[#131B2E] border-[#EF4444]/50"
              }`}
            >
              {/* Left: Capture Status & Tabular Recording Clock */}
              <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-transform ${
                      isTranscribing
                        ? "bg-[#D97724]/20 border-[#D97724]/50 text-[#D97724]"
                        : isVoiceDetected
                        ? "bg-[#1D6852]/30 border-[#38B28B]/60 text-[#38B28B]"
                        : "bg-[#EF4444]/20 border-[#EF4444]/50 text-[#FCA5A5]"
                    }`}
                    style={
                      isDictating
                        ? {
                            transform: `scale(${(1 + Math.min(0.14, micRmsLevel / 650)).toFixed(3)})`,
                          }
                        : undefined
                    }
                  >
                    {isTranscribing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#F1F5F9]">
                      <span className="truncate">
                        {isTranscribing
                          ? locale === "pl"
                            ? "Przetwarzanie mowy na tekst..."
                            : locale === "ro"
                            ? "Se transcrie vocea..."
                            : "Converting speech to text..."
                          : isVoiceDetected
                          ? locale === "pl"
                            ? "Przechwytywanie głosu aktywne"
                            : locale === "ro"
                            ? "Captură vocală activă"
                            : "Capturing your voice"
                          : locale === "pl"
                          ? "Mikrofon gotowy — mów teraz"
                          : locale === "ro"
                          ? "Microfon activ — vorbește acum"
                          : "Mic active — speak now"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#94A3B8]">
                      <span>0:{String(recordingSeconds).padStart(2, "0")}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          isTranscribing
                            ? "text-[#D97724]"
                            : isVoiceDetected
                            ? "text-[#38B28B]"
                            : "text-[#94A3B8]"
                        }
                      >
                        {isTranscribing
                          ? "STT"
                          : `${locale === "pl" ? "Poziom" : "Level"} ${micRmsLevel}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile quick stop button */}
                {isDictating && (
                  <button
                    type="button"
                    onClick={() => {
                      sendAfterTranscribeRef.current = false;
                      stopDictationSession();
                    }}
                    className="sm:hidden px-2.5 py-1 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 border border-[#EF4444]/40 text-[#FCA5A5] text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t("stopListen")}
                  </button>
                )}
              </div>

              {/* Center: 18-Bar Real-Time Live Frequency Spectrum Meter */}
              <div
                className="flex-1 h-8 px-2 py-1 rounded-xl bg-[#0B0F17]/80 border border-white/10 flex items-center justify-center gap-1 min-w-[140px] max-w-md"
                aria-hidden="true"
              >
                {micAudioLevels.map((level, idx) => {
                  const barScale = isTranscribing
                    ? 0.25 + ((idx % 4) * 0.12)
                    : Math.max(0.12, Math.min(1, level));
                  const barColor = isTranscribing
                    ? "bg-[#D97724]/80"
                    : level > 0.78
                    ? "bg-[#EF4444]"
                    : level > 0.45
                    ? "bg-[#FBBF24]"
                    : level > 0.18
                    ? "bg-[#38B28B]"
                    : "bg-[#38B28B]/35";

                  return (
                    <span
                      key={idx}
                      style={{
                        transform: `scaleY(${barScale})`,
                        opacity: isTranscribing ? 0.75 : Math.max(0.42, level),
                      }}
                      className={`flex-1 max-w-[6px] min-w-[2px] h-6 rounded-full stt-mic-bar ${barColor}`}
                    />
                  );
                })}
              </div>

              {/* Right: Quick Action Controls */}
              {isDictating && (
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      sendAfterTranscribeRef.current = false;
                      stopDictationSession();
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#EF4444]/20 border border-white/10 hover:border-[#EF4444]/40 text-[#F1F5F9] text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    {t("stopListen")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSend}
                    className="px-2.5 py-1.5 rounded-lg bg-[#1D6852] hover:bg-[#258066] text-white text-[11px] font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                  >
                    {locale === "pl" ? "Wyślij głos" : locale === "ro" ? "Trimite" : "Send voice"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Max 1 horizontally scrollable row of 2-3 CO DALEJ chips, ONLY after Elon has answered */}
          {hasElonReplied &&
            !isChatLoading &&
            dynamicFollowUpChips.length > 0 &&
            !isDictating &&
            !isTranscribing && (
              <div
                role="region"
                aria-label={t("chatFollowUpsSection")}
                className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar"
              >
                {dynamicFollowUpChips.slice(0, 3).map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    disabled={isChatLoading && chip.actionType === "send_prompt"}
                    onClick={() => {
                      if (chip.actionType === "send_prompt" && chip.promptText) {
                        isAutoScrollPinnedRef.current = true;
                        setIsAutoScrollPinned(true);
                        setUnreadBelowCount(0);
                        sendChatMessage(chip.promptText);
                      } else if (chip.actionType === "pin_last_ai" && chip.targetMsgId) {
                        pinChatMessageToCase(chip.targetMsgId);
                      } else if (chip.actionType === "open_template" && chip.templateId) {
                        handleOpenTemplate(chip.templateId);
                      } else if (chip.actionType === "switch_persona") {
                        handleToggleAiPersona();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-full border border-[#E2E8F0] dark:border-[#2C3847] hover:border-[#0D9488] dark:hover:border-[#2DD4BF] bg-[#FFFFFF] dark:bg-[#1E2732] text-[#1E293B] dark:text-[#F1F5F9] text-[12px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#0D9488] dark:bg-[#2DD4BF] shrink-0"
                      aria-hidden="true"
                    />
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

          {/* Input Row: Mic / Clip / Camera + Textarea + Turquoise Send Button */}
          <div
            className={`flex items-end gap-1.5 bg-[#FFFFFF] dark:bg-[#1E2732] border rounded-2xl px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-none transition-colors ${
              isInputInvalidShake ? "chat-input-shake" : ""
            } ${
              isDictating
                ? isVoiceDetected
                  ? "border-[#52B798]"
                  : "border-[#EF4444]"
                : showEmptyInputError
                ? "border-[#F87171]"
                : !isOnline
                ? "border-[#F59E42]/60 dark:border-[#FBB063]/60"
                : "border-[#E2E8F0] dark:border-[#2C3847] focus-within:border-[#0D9488] dark:focus-within:border-[#2DD4BF]"
            }`}
          >
            {/* Voice Recording / Dictation Button with Reactive Mini Audio Meter */}
            <Tooltip
              side="top"
              content={
                isDictating
                  ? locale === "pl"
                    ? "Zatrzymaj nagrywanie"
                    : locale === "ro"
                    ? "Oprește înregistrarea"
                    : "Stop Voice Recording"
                  : locale === "pl"
                  ? "Nagraj wiadomość głosem"
                  : locale === "ro"
                  ? "Dictează mesaj vocal"
                  : "Dictate Message with Voice"
              }
            >
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
                aria-label={isDictating ? "Stop recording" : "Voice dictation"}
                className={`flex items-center justify-center gap-1.5 min-h-[44px] h-11 ${
                  isDictating ? "px-2.5" : "w-10 sm:w-11"
                } rounded-xl transition-all shrink-0 cursor-pointer ${
                  isDictating
                    ? "bg-[#EF4444] text-white shadow-[0_0_12px_rgba(239,68,68,0.45)]"
                    : isTranscribing
                    ? "bg-[#F59E42]/20 border border-[#F59E42]/50 text-[#F59E42] dark:text-[#FBB063]"
                    : "bg-[#F8FAFC] dark:bg-[#141B23] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#25303E] text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]"
                }`}
              >
                {isTranscribing ? (
                  <RefreshCw className="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-spin" />
                ) : isDictating ? (
                  <>
                    <MicOff className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
                    <span className="inline-flex items-end gap-0.5 h-3.5" aria-hidden="true">
                      {[6, 9, 12].map((barIdx, i) => (
                        <span
                          key={i}
                          style={{
                            transform: `scaleY(${Math.max(0.22, micAudioLevels[barIdx] || 0.22)})`,
                          }}
                          className="w-0.5 h-3.5 rounded-full bg-white stt-mic-bar-bottom"
                        />
                      ))}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums font-extrabold pr-0.5">
                      0:{String(recordingSeconds).padStart(2, "0")}
                    </span>
                  </>
                ) : (
                  <Mic className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                )}
              </button>
            </Tooltip>

            {/* Hidden System File Input for Instant Document Classification */}
            <input
              ref={chatFileInputRef}
              type="file"
              accept=".pdf,image/*,.txt,.md,.doc,.docx,.csv,.rtf,.eml"
              multiple
              onChange={handleChatFileChange}
              className="hidden"
            />

            {/* Attach Document via System File Picker */}
            <Tooltip
              side="top"
              content={
                locale === "pl"
                  ? "Załącz dokument z dysku (auto-rozpoznawanie PDF/umów/payslipów)"
                  : locale === "ro"
                  ? "Atașează document (detectare automată categorie)"
                  : "Attach Document from Device (Auto-Classify)"
              }
            >
              <button
                type="button"
                disabled={isAnalyzingAttachment}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  chatFileInputRef.current?.click();
                }}
                aria-label={
                  locale === "pl"
                    ? "Załącz dokument z systemu"
                    : "Attach document from system"
                }
                className="flex items-center justify-center w-10 sm:w-11 h-11 min-h-[44px] rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#25303E] text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9] transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingAttachment ? (
                  <Loader2 className="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-spin text-[#38B28B]" />
                ) : (
                  <Paperclip className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                )}
              </button>
            </Tooltip>

            {/* Scan Document via Camera */}
            <Tooltip
              side="top"
              content={
                locale === "pl"
                  ? "Zrób zdjęcie dokumentu aparatem (auto-kategoryzacja)"
                  : locale === "ro"
                  ? "Scanează document cu camera"
                  : "Scan Document with Camera"
              }
            >
              <button
                type="button"
                disabled={isAnalyzingAttachment}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsChatCameraOpen(true);
                }}
                aria-label={
                  locale === "pl" ? "Skanuj dokument aparatem" : "Scan document with camera"
                }
                className="flex items-center justify-center w-10 sm:w-11 h-11 min-h-[44px] rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] hover:bg-[#E2E8F0]/60 dark:hover:bg-[#25303E] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0D9488] dark:hover:text-[#2DD4BF] transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </Tooltip>

            <textarea
              ref={chatInputTextareaRef}
              value={chatDraft}
              onChange={(e) => {
                const nextVal = e.target.value;
                setChatDraft(nextVal);
                if (nextVal.trim().length > 0 && showEmptyInputError) {
                  setShowEmptyInputError(false);
                  setIsInputInvalidShake(false);
                }
              }}
              onKeyDown={handleKeyDown}
              aria-invalid={showEmptyInputError}
              aria-describedby={showEmptyInputError ? "chat-empty-input-error" : undefined}
              placeholder={
                isAnalyzingAttachment
                  ? locale === "pl"
                    ? "Analizowanie zawartości dokumentu..."
                    : "Analyzing document content..."
                  : isTranscribing
                  ? "Przetwarzanie nagrania..."
                  : isDictating
                  ? t("listening")
                  : showEmptyInputError
                  ? locale === "pl"
                    ? "Wpisz treść wiadomości przed wysłaniem..."
                    : locale === "ro"
                    ? "Scrie un mesaj înainte de a trimite..."
                    : "Please enter a message before sending..."
                  : locale === "pl"
                  ? "Napisz pytanie do Elona..."
                  : locale === "ro"
                  ? "Scrie întrebarea pentru Elon..."
                  : "Ask Elon a question..."
              }
              rows={1}
              className={`flex-1 min-w-0 bg-transparent border-0 resize-none text-[15px] leading-[1.45] text-[#1E293B] dark:text-[#F1F5F9] focus:ring-0 focus:outline-none min-h-[44px] max-h-28 py-2.5 px-1.5 overflow-y-auto no-scrollbar transition-colors ${
                showEmptyInputError
                  ? "placeholder-[#F87171]/85"
                  : "placeholder-[#64748B] dark:placeholder-[#94A3B8]"
              }`}
            />
            {showEmptyInputError && (
              <span id="chat-empty-input-error" role="alert" className="sr-only">
                {locale === "pl"
                  ? "Pole wiadomości nie może być puste."
                  : locale === "ro"
                  ? "Câmpul mesajului nu poate fi gol."
                  : "Message field cannot be empty."}
              </span>
            )}

            {/* Turquoise Send Button */}
            {(() => {
              const hasSendableInput =
                chatDraft.trim().length > 0 ||
                isDictating ||
                (allowDocLibraryContext && activeDocumentContext.docs.length > 0);
              const isSendInactive = !hasSendableInput || isChatLoading;

              return (
                <button
                  type="button"
                  onClick={(e) => {
                    if (isSendInactive) {
                      e.preventDefault();
                      return;
                    }
                    handleSend();
                  }}
                  disabled={isSendInactive}
                  aria-disabled={isSendInactive}
                  aria-label={!isOnline ? t("msgQueuedBadge") : t("send")}
                  title={!isOnline ? t("msgQueuedBadge") : t("send")}
                  className={`flex items-center justify-center min-w-[44px] h-11 min-h-[44px] px-3 rounded-xl font-bold text-xs transition-colors shrink-0 ${
                    isInputInvalidShake ? "chat-input-shake" : ""
                  } ${
                    !isSendInactive
                      ? "bg-[#0D9488] hover:bg-[#0F766E] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#141B23] cursor-pointer shadow-xs"
                      : "bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] text-[#64748B] dark:text-[#94A3B8] cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4 shrink-0" />
                </button>
              );
            })()}
          </div>

          <p className="text-[11px] leading-tight text-center text-[#64748B] dark:text-[#94A3B8] px-1">
            {t("aiDisclaimer")}
          </p>
        </div>
      </div>

      {/* SLIDE-UP OPTIONS BOTTOM SHEET ("⋯ Opcje", max 75% height, swipe down or tap outside to close) */}
      {isOptionsSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 backdrop-blur-xs"
          onClick={() => {
            setOptionsSheetDragY(0);
            setIsOptionsSheetOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("chatOptionsTitle")}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              const scrollTop = optionsSheetScrollRef.current?.scrollTop ?? 0;
              if (scrollTop <= 2) {
                optionsSheetStartYRef.current = e.touches[0].clientY;
              } else {
                optionsSheetStartYRef.current = null;
              }
            }}
            onTouchMove={(e) => {
              if (optionsSheetStartYRef.current === null) return;
              const delta = e.touches[0].clientY - optionsSheetStartYRef.current;
              if (delta > 0) {
                setOptionsSheetDragY(Math.min(delta, 240));
              }
            }}
            onTouchEnd={() => {
              if (optionsSheetDragY > 64) {
                setOptionsSheetDragY(0);
                setIsOptionsSheetOpen(false);
              } else {
                setOptionsSheetDragY(0);
              }
              optionsSheetStartYRef.current = null;
            }}
            style={{
              transform: optionsSheetDragY > 0 ? `translateY(${optionsSheetDragY}px)` : undefined,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
            className="w-full max-w-2xl mx-auto max-h-[75dvh] rounded-t-3xl bg-[#FFFFFF] dark:bg-[#1E2732] border-t border-x border-[#E2E8F0] dark:border-[#2C3847] shadow-2xl flex flex-col overflow-hidden transition-transform duration-200"
          >
            {/* Drag Handle + Header */}
            <div className="shrink-0 pt-2.5 pb-2 px-4 border-b border-[#E2E8F0] dark:border-[#2C3847] flex flex-col gap-2">
              <div className="w-10 h-1 rounded-full bg-[#CBD5E1] dark:bg-[#2C3847] mx-auto" aria-hidden="true" />
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-extrabold text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">
                  {t("chatOptionsTitle")}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOptionsSheetOpen(false)}
                  aria-label={locale === "pl" ? "Zamknij opcje" : locale === "ro" ? "Închide opțiunile" : "Close options"}
                  className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Options Sections */}
            <div
              ref={optionsSheetScrollRef}
              className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5"
            >
              {/* 1. Conversation Actions (Usuń / Zapisz / Ściągnij / Email .MD) */}
              <section className="space-y-2">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  {t("chatActionsSection")}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleStopSpeech();
                      setAttachedDocIds([]);
                      setDismissedAutoDocIds([]);
                      setShowEmptyInputError(false);
                      setIsInputInvalidShake(false);
                      clearChatMessages();
                      setIsOptionsSheetOpen(false);
                    }}
                    className="h-[44px] min-h-[44px] px-2.5 rounded-[14px] bg-[#F8FAFC] dark:bg-[#141B23] hover:border-[#F87171] border border-[#E2E8F0] dark:border-[#2C3847] text-[#1E293B] dark:text-[#F1F5F9] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-[#F87171] shrink-0" />
                    <span className="truncate">{t("chatClearBtnShort")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      saveCurrentChatAsCase();
                      setIsOptionsSheetOpen(false);
                    }}
                    className="h-[44px] min-h-[44px] px-2.5 rounded-[14px] bg-[#F8FAFC] dark:bg-[#141B23] border border-[#2E6F57] dark:border-[#52B798] text-[#1E293B] dark:text-[#F1F5F9] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4 text-[#2E6F57] dark:text-[#52B798] shrink-0" />
                    <span className="truncate">{t("chatSaveBtnShort")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleExportChatMarkdown();
                      setIsOptionsSheetOpen(false);
                    }}
                    className="h-[44px] min-h-[44px] px-2.5 rounded-[14px] bg-[#F8FAFC] dark:bg-[#141B23] hover:border-[#F59E42] border border-[#E2E8F0] dark:border-[#2C3847] text-[#1E293B] dark:text-[#F1F5F9] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#F59E42] dark:text-[#FBB063] shrink-0" />
                    <span className="truncate">{t("chatDownloadBtnShort")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsSheetOpen(false);
                      handleOpenEmailTranscriptDialog();
                    }}
                    className="h-[44px] min-h-[44px] px-2.5 rounded-[14px] bg-[#F8FAFC] dark:bg-[#141B23] hover:border-[#0D9488] dark:hover:border-[#2DD4BF] border border-[#E2E8F0] dark:border-[#2C3847] text-[#1E293B] dark:text-[#F1F5F9] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                    <span className="truncate">E-mail .MD</span>
                  </button>
                </div>
              </section>

              {/* 2. Voice & Privacy Toggles (Tryb głośny / Słuchawki / Dok. AI WŁ.) */}
              <section className="space-y-2">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  {t("chatVoiceSection")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoReadAloud;
                      setAutoReadAloud(next);
                      updateVoiceConfig({ autoReadAloud: next });
                      if (!next) {
                        handleStopSpeech();
                      }
                    }}
                    className={`min-h-[44px] px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      autoReadAloud
                        ? "bg-[#0D9488]/10 dark:bg-[#2DD4BF]/15 border-[#0D9488] dark:border-[#2DD4BF] text-[#0D9488] dark:text-[#2DD4BF]"
                        : "bg-[#F8FAFC] dark:bg-[#141B23] border-[#E2E8F0] dark:border-[#2C3847] text-[#64748B] dark:text-[#94A3B8]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {locale === "pl" ? "Tryb głośny" : locale === "ro" ? "Citire vocală" : "Read aloud"}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] uppercase shrink-0">
                      {autoReadAloud ? "ON" : "OFF"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOptionsSheetOpen(false);
                      setIsVoicePreferencesModalOpen(true);
                    }}
                    className="min-h-[44px] px-3 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847] bg-[#F8FAFC] dark:bg-[#141B23] hover:border-[#0D9488] dark:hover:border-[#2DD4BF] text-[#1E293B] dark:text-[#F1F5F9] text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <Headphones className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                      <span className="truncate">
                        {locale === "pl" ? "Głos i słuchawki" : locale === "ro" ? "Setări voce" : "Voice & headphones"}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8] shrink-0">
                      {speechRate}x
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleDocLibraryContext}
                    className={`min-h-[44px] px-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      allowDocLibraryContext
                        ? "bg-[#2E6F57]/10 dark:bg-[#52B798]/15 border-[#2E6F57] dark:border-[#52B798] text-[#2E6F57] dark:text-[#52B798]"
                        : "bg-[#F8FAFC] dark:bg-[#141B23] border-[#F59E42] dark:border-[#FBB063] text-[#F59E42] dark:text-[#FBB063]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      {allowDocLibraryContext ? (
                        <FileCheck2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <FileLock2 className="w-4 h-4 shrink-0" />
                      )}
                      <span className="truncate">
                        {locale === "pl" ? "Dok. AI" : locale === "ro" ? "Doc. AI" : "AI Docs"}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] uppercase shrink-0">
                      {allowDocLibraryContext
                        ? locale === "pl"
                          ? "WŁ."
                          : "ON"
                        : locale === "pl"
                        ? "WYŁ."
                        : "OFF"}
                    </span>
                  </button>
                </div>
              </section>

              {/* 3. AI Persona & Document Context & Smart Context */}
              <section className="space-y-2.5">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  {t("chatTopicsSection")}
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleAiPersona}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                      activeAiPersona === "employment_law"
                        ? "bg-[#0D9488]/10 dark:bg-[#2DD4BF]/15 border-[#0D9488] dark:border-[#2DD4BF] text-[#0D9488] dark:text-[#2DD4BF]"
                        : "bg-[#F59E42]/10 dark:bg-[#FBB063]/15 border-[#F59E42] dark:border-[#FBB063] text-[#F59E42] dark:text-[#FBB063]"
                    }`}
                  >
                    {activeAiPersona === "employment_law" ? (
                      <Scale className="w-4 h-4 shrink-0" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                    )}
                    <span>
                      {activeAiPersona === "employment_law" ? "Employment Law" : "Trade Union"}
                    </span>
                  </button>

                  {allowDocLibraryContext && activeDocumentContext.primaryDoc && (
                    <div className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] text-xs">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF] shrink-0" />
                      <span className="font-semibold text-[#1E293B] dark:text-[#F1F5F9] truncate max-w-[180px]">
                        {activeDocumentContext.primaryDoc.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const idsToDismiss = activeDocumentContext.docs.map((d) => d.id);
                          setAttachedDocIds((prev) => prev.filter((id) => !idsToDismiss.includes(id)));
                          setDismissedAutoDocIds((prev) =>
                            Array.from(new Set([...prev, ...idsToDismiss]))
                          );
                        }}
                        aria-label="Detach context"
                        className="p-1 text-[#64748B] dark:text-[#94A3B8] hover:text-[#F87171] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {smartContextSuggestions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {activeSmartSuggestion && (
                      <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#0D9488]/40 dark:border-[#2DD4BF]/40 flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <label className="text-xs font-semibold text-[#1E293B] dark:text-[#F1F5F9] block">
                            {activeSmartSuggestion.promptTitle}
                          </label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={smartFieldDraftValue}
                            onChange={(e) => setSmartFieldDraftValue(e.target.value)}
                            placeholder={activeSmartSuggestion.placeholder}
                            className="flex-1 bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] rounded-lg px-2.5 py-1.5 text-xs text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none focus:border-[#0D9488] dark:focus:border-[#2DD4BF]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = smartFieldDraftValue.trim();
                              if (val) {
                                if (
                                  activeSmartSuggestion.mode === "profile_field" &&
                                  activeSmartSuggestion.fieldKey
                                ) {
                                  updateUser({ [activeSmartSuggestion.fieldKey]: val });
                                  showToast(
                                    locale === "pl"
                                      ? "Zapisano informację w aktach sprawy i profilu!"
                                      : "Saved detail to your case profile!"
                                  );
                                } else {
                                  const entry = `${activeSmartSuggestion.appendPrefix || ""}${val}`;
                                  const existing = chatDraft.trim();
                                  setChatDraft(existing ? `${existing}\n${entry}` : entry);
                                  showToast(
                                    locale === "pl"
                                      ? "Dodano kontekst do Twojej wiadomości!"
                                      : "Added context to your message!"
                                  );
                                }
                              }
                              setDismissedSmartChipIds((prev) => [...prev, activeSmartSuggestion.id]);
                              setActiveSmartChipId(null);
                            }}
                            className="min-h-[36px] px-3 py-1 rounded-lg bg-[#0D9488] dark:bg-[#2DD4BF] text-white dark:text-[#141B23] text-xs font-bold cursor-pointer"
                          >
                            {locale === "pl" ? "Zapisz" : "Save"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {smartContextSuggestions.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => {
                            if (activeSmartChipId === chip.id) {
                              setActiveSmartChipId(null);
                            } else {
                              setActiveSmartChipId(chip.id);
                              setSmartFieldDraftValue(chip.currentValue || "");
                            }
                          }}
                          className="min-h-[36px] px-3 py-1 rounded-full bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] text-xs font-semibold text-[#1E293B] dark:text-[#F1F5F9] cursor-pointer"
                        >
                          + {chip.chipLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* 4. Ścieżka sprawy (Breadcrumb milestones) */}
              {conversationBreadcrumbs.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    {t("chatPathSection")}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {conversationBreadcrumbs.map((stage, idx) => {
                      const isActiveStage = activeBreadcrumbStageId === stage.id;
                      return (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            navigateToBreadcrumbStage(stage);
                            setIsOptionsSheetOpen(false);
                          }}
                          className={`min-h-[36px] px-3 py-1 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isActiveStage
                              ? "bg-[#0D9488]/10 dark:bg-[#2DD4BF]/15 border-[#0D9488] dark:border-[#2DD4BF] text-[#0D9488] dark:text-[#2DD4BF]"
                              : "bg-[#F8FAFC] dark:bg-[#141B23] border-[#E2E8F0] dark:border-[#2C3847] text-[#1E293B] dark:text-[#F1F5F9]"
                          }`}
                        >
                          <span className="font-mono text-[10px] opacity-70">{idx + 1}.</span>
                          <span>{stage.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 5. Full Follow-Up List (CO DALEJ) */}
              {dynamicFollowUpChips.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    {t("chatFollowUpsSection")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dynamicFollowUpChips.map((chip) => (
                      <button
                        key={`sheet_${chip.id}`}
                        type="button"
                        disabled={isChatLoading && chip.actionType === "send_prompt"}
                        onClick={() => {
                          if (chip.actionType === "send_prompt" && chip.promptText) {
                            isAutoScrollPinnedRef.current = true;
                            setIsAutoScrollPinned(true);
                            setUnreadBelowCount(0);
                            sendChatMessage(chip.promptText);
                          } else if (chip.actionType === "pin_last_ai" && chip.targetMsgId) {
                            pinChatMessageToCase(chip.targetMsgId);
                          } else if (chip.actionType === "open_template" && chip.templateId) {
                            handleOpenTemplate(chip.templateId);
                          } else if (chip.actionType === "switch_persona") {
                            handleToggleAiPersona();
                          }
                          setIsOptionsSheetOpen(false);
                        }}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] hover:border-[#0D9488] dark:hover:border-[#2DD4BF] text-xs font-semibold text-[#1E293B] dark:text-[#F1F5F9] cursor-pointer text-left"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* 6. Podsumowanie & Historia rozmów */}
              <section className="space-y-2">
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  {t("chat.legalSummary")}
                </h3>
                {renderLegalSummaryContent(true)}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN DOCUMENT PREVIEW POPUP MODAL (Mobile Full-Screen & Desktop Sheet) */}
      {previewModalLetter && (
        <div
          className="fixed inset-0 z-[80] bg-[#0B0F17]/95 backdrop-blur-md flex flex-col sm:items-center sm:justify-center sm:p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full h-full sm:h-[92vh] sm:max-w-3xl bg-[#131B2E] sm:border-2 sm:border-[#D97724]/60 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Popup Top Bar with Close (X) Button */}
            <div className="shrink-0 px-4 py-3.5 bg-[#0B2038] border-b border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-[#38B28B] text-[#0B0F17] font-extrabold text-[10px] uppercase tracking-wider">
                    GOTOWY DOKUMENT (EN)
                  </span>
                  <span className="text-[11px] font-mono text-[#94A3B8] truncate">
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
              <Tooltip
                side="bottom"
                content={locale === "pl" ? "Zamknij podgląd" : locale === "ro" ? "Închide previzualizarea" : "Close Preview"}
              >
                <button
                  type="button"
                  onClick={() => setPreviewModalLetter(null)}
                  aria-label="Zamknij podgląd"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            {/* Full-Screen Scrollable Paper Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-[#0B0F17]">
              <div className="rounded-2xl bg-[#FFF6EF] text-[#161B22] p-4 sm:p-7 border-2 border-[#D97724]/40 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#161B22]/15 text-[11px] font-mono text-[#161B22]/80">
                  <span className="font-extrabold text-[#1D6852]">
                    OFFICIAL UK STATUTORY NOTICE · 100% COMPLETED
                  </span>
                  <span>
                    {user.fullName} → {user.employerName}
                  </span>
                </div>
                <pre className="text-xs sm:text-sm leading-relaxed font-mono whitespace-pre-wrap text-[#161B22] select-all">
                  {previewModalLetter.contentEn}
                </pre>
                <LegalLetterFooter locale={locale} page={1} totalPages={1} paperSurface={true} />
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
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#D97724] hover:bg-[#D97724]/90 text-black text-xs font-extrabold transition-all shadow-md cursor-pointer"
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
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1D6852] hover:bg-[#1D6852]/90 border border-[#38B28B]/40 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#38B28B] shrink-0" />
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
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#143A66] hover:bg-[#19477d] border border-[#38B28B]/40 text-[#38B28B] text-xs font-extrabold transition-all shadow-md cursor-pointer"
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

      {/* EMAIL TRANSCRIPT DIALOG MODAL (Sends exported Markdown consultation via Resend API) */}
      {isEmailTranscriptModalOpen && (
        <div
          className="fixed inset-0 z-[85] bg-[#0B0F17]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-transcript-dialog-title"
        >
          <div className="w-full max-w-2xl bg-[#131B2E] border-2 border-[#38B28B]/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Dialog Header */}
            <div className="px-5 py-4 bg-[#0B2038] border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#1D6852]/30 border border-[#38B28B]/50 flex items-center justify-center text-[#38B28B] shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-[#38B28B]/20 border border-[#38B28B]/40 text-[#38B28B] font-extrabold text-[10px] uppercase tracking-wider">
                      RESEND API · MARKDOWN (.MD)
                    </span>
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      {emailFilename}
                    </span>
                  </div>
                  <h3
                    id="email-transcript-dialog-title"
                    className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate"
                  >
                    {locale === "pl"
                      ? "Wyślij transkrypcję czatu na e-mail (Email Transcript)"
                      : locale === "ro"
                      ? "Trimite transcrierea conversației pe e-mail (Email Transcript)"
                      : "Email Consultation Transcript (Markdown)"}
                  </h3>
                </div>
              </div>

              <Tooltip
                side="bottom"
                content={locale === "pl" ? "Zamknij okno" : locale === "ro" ? "Închide fereastra" : "Close Window"}
              >
                <button
                  type="button"
                  onClick={() => setIsEmailTranscriptModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </Tooltip>
            </div>

            {/* Dialog Body */}
            <form
              onSubmit={handleSendTranscriptEmail}
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4"
            >
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {locale === "pl"
                  ? "Wyślij wyeksportowany zapis bieżącej konsultacji prawnej (wraz z analizą ACAS/ERA 1996 i wygenerowanymi pismami) w formacie Markdown bezpośrednio na swój zarejestrowany adres e-mail za pośrednictwem Resend API."
                  : "Send the exported Markdown content of your current legal consultation (including statutory analysis and generated letters) directly to your registered email address via the Resend API."}
              </p>

              {/* Recipient Registered Email Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#38B28B] mb-1">
                    {locale === "pl"
                      ? "Zarejestrowany adres e-mail odbiorcy"
                      : "Registered Recipient Email"}
                  </label>
                  <input
                    type="email"
                    required
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="twoj.email@example.com"
                    className="w-full rounded-xl bg-[#0B0F17] border border-white/15 focus:border-[#38B28B] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                    {locale === "pl" ? "Temat wiadomości" : "Email Subject"}
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl bg-[#0B0F17] border border-white/15 focus:border-[#38B28B] px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Exported Markdown Content Preview */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    {locale === "pl"
                      ? "Podgląd zawartości Markdown (.md)"
                      : "Exported Markdown Content Preview (.md)"}
                  </span>
                  <span className="text-[10px] font-mono text-[#38B28B]">
                    {chatMessages.length}{" "}
                    {locale === "pl" ? "wiadomości" : "messages"} ·{" "}
                    {emailMarkdownPreview.length} chars
                  </span>
                </div>
                <textarea
                  value={emailMarkdownPreview}
                  onChange={(e) => setEmailMarkdownPreview(e.target.value)}
                  rows={9}
                  className="w-full rounded-xl bg-[#0B0F17] border border-white/15 focus:border-[#38B28B] p-3 text-[11px] font-mono text-[#F1F5F9] leading-relaxed focus:outline-none resize-y"
                />
              </div>

              {/* Status Banner after Send attempt */}
              {emailDeliveryStatus && (
                <div
                  className={`rounded-xl p-3 border text-xs flex items-start gap-2.5 ${
                    emailDeliveryStatus.type === "success"
                      ? "bg-[#1D6852]/25 border-[#38B28B]/50 text-[#F1F5F9]"
                      : "bg-[#EF4444]/15 border-[#EF4444]/50 text-[#FF8A8A]"
                  }`}
                >
                  {emailDeliveryStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-[#38B28B] shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{emailDeliveryStatus.message}</div>
                    {emailDeliveryStatus.deliveryId && (
                      <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">
                        Resend Delivery ID: {emailDeliveryStatus.deliveryId}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dialog Footer Actions */}
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <Tooltip
                  side="top"
                  content={
                    locale === "pl"
                      ? "Eksportuj do Markdown (.md)"
                      : locale === "ro"
                      ? "Exportă în Markdown (.md)"
                      : "Export to Markdown"
                  }
                >
                  <button
                    type="button"
                    onClick={handleExportChatMarkdown}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#D97724]" />
                    <span>
                      {locale === "pl" ? "Pobierz plik .MD" : "Download .MD File"}
                    </span>
                  </button>
                </Tooltip>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailTranscriptModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                  >
                    {t("cancel")}
                  </button>

                  <button
                    type="submit"
                    disabled={isSendingTranscriptEmail}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1D6852] to-[#38B28B] hover:opacity-95 disabled:opacity-50 text-black text-xs font-extrabold shadow-md transition-all cursor-pointer"
                  >
                    {isSendingTranscriptEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {locale === "pl" ? "Wysyłanie (Resend)..." : "Sending (Resend)..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>
                          {locale === "pl"
                            ? "Wyślij przez Resend API"
                            : "Send via Resend API"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Bubble Context Menu (Long-Press or Right-Click on any Chat Bubble) */}
      {bubbleContextMenu && (() => {
        const targetMsg = chatMessages.find((m) => m.id === bubbleContextMenu.msgId);
        if (!targetMsg) return null;
        const cleanCopyText =
          targetMsg.role === "assistant"
            ? stripEmbeddedEnglishLetter(targetMsg.text).trim()
            : targetMsg.text.trim();
        const isFlagged = Boolean(targetMsg.flaggedAsIncorrect);
        const associatedCase =
          (targetMsg.pinnedToCaseId && cases.find((c) => c.id === targetMsg.pinnedToCaseId)) ||
          (targetMsg.threadId && cases.find((c) => c.id === targetMsg.threadId)) ||
          (activeCaseId && cases.find((c) => c.id === activeCaseId)) ||
          cases.find((c) => c.status === "open") ||
          cases[0];

        return (
          <div
            ref={bubbleContextMenuRef}
            role="menu"
            aria-label={
              locale === "pl"
                ? "Menu kontekstowe wiadomości"
                : locale === "ro"
                ? "Meniu contextual mesaj"
                : "Message context menu"
            }
            style={{
              left: `${bubbleContextMenu.x}px`,
              top: `${bubbleContextMenu.y}px`,
            }}
            className="fixed z-50 w-[244px] rounded-2xl bg-[#131B2E]/98 backdrop-blur-xl border border-[#38B28B]/45 shadow-[0_18px_40px_rgba(0,0,0,0.65)] p-1.5 select-none"
          >
            <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center justify-between gap-2 text-[10px] font-bold text-[#94A3B8]">
              <span className="truncate">
                {targetMsg.role === "assistant"
                  ? "Elon · AI"
                  : user.fullName || (locale === "pl" ? "Twoja wiadomość" : "Your message")}
              </span>
              <span className="font-mono tabular-nums shrink-0">{targetMsg.timestamp}</span>
            </div>

            <div className="py-1 flex flex-col gap-0.5">
              {/* 1. Copy Text */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  navigator.clipboard?.writeText(cleanCopyText);
                  setBubbleContextMenu(null);
                  showToast(
                    locale === "pl"
                      ? "Skopiowano tekst wiadomości do schowka."
                      : locale === "ro"
                      ? "Textul mesajului a fost copiat."
                      : "Copied message text to clipboard."
                  );
                }}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-left text-xs font-semibold text-[#F1F5F9] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#38B28B] shrink-0" aria-hidden="true" />
                <span>
                  {locale === "pl"
                    ? "Kopiuj tekst"
                    : locale === "ro"
                    ? "Copiază textul"
                    : "Copy text"}
                </span>
              </button>

              {/* 2. Pin to Case */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  const pinnedCase = pinChatMessageToCase(targetMsg.id);
                  setBubbleContextMenu(null);
                  if (pinnedCase) {
                    triggerRobotReaction("success", 1500);
                    showToast(
                      locale === "pl"
                        ? `Przypięto wiadomość do sprawy: „${pinnedCase.title.slice(0, 42)}${
                            pinnedCase.title.length > 42 ? "…" : ""
                          }” (sekcja Pinned Items)`
                        : locale === "ro"
                        ? `Mesaj fixat la cazul: „${pinnedCase.title.slice(0, 42)}”`
                        : `Pinned message to case: "${pinnedCase.title.slice(0, 42)}" (Pinned Items)`
                    );
                  }
                }}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-[#38B28B]/15 text-left text-xs font-semibold text-[#F1F5F9] flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <Pin className="w-3.5 h-3.5 text-[#38B28B] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="leading-snug">
                    {targetMsg.pinnedToCaseId
                      ? locale === "pl"
                        ? "Aktualizuj przypięcie w sprawie (Pin to Case)"
                        : locale === "ro"
                        ? "Actualizează în caz (Pin to Case)"
                        : "Update in Case (Pin to Case)"
                      : locale === "pl"
                      ? "Przypnij do sprawy (Pin to Case)"
                      : locale === "ro"
                      ? "Fixează la caz (Pin to Case)"
                      : "Pin to Case"}
                  </div>
                  {associatedCase && (
                    <div className="text-[10px] font-normal text-[#94A3B8] truncate mt-0.5">
                      → {associatedCase.title}
                    </div>
                  )}
                </div>
              </button>

              {/* 3. Flag as Incorrect */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  const nowFlagged = toggleFlagChatMessage(targetMsg.id);
                  setBubbleContextMenu(null);
                  triggerRobotReaction(nowFlagged ? "concerned" : "happy", 1200);
                  showToast(
                    nowFlagged
                      ? locale === "pl"
                        ? "Wiadomość oznaczona jako niepoprawna (Flagged as incorrect)."
                        : locale === "ro"
                        ? "Mesaj marcat ca incorect."
                        : "Message flagged as incorrect."
                      : locale === "pl"
                      ? "Usunięto oznaczenie błędu z wiadomości."
                      : locale === "ro"
                      ? "Marcajul de eroare a fost eliminat."
                      : "Removed incorrect flag from message."
                  );
                }}
                className={`w-full px-2.5 py-2 rounded-xl hover:bg-[#D97724]/20 text-left text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  isFlagged ? "text-[#FBBF24]" : "text-[#F1F5F9]"
                }`}
              >
                <Flag className="w-3.5 h-3.5 text-[#D97724] shrink-0" aria-hidden="true" />
                <span>
                  {isFlagged
                    ? locale === "pl"
                      ? "Cofnij zgłoszenie błędu"
                      : locale === "ro"
                      ? "Anulează marcajul incorect"
                      : "Unflag as incorrect"
                    : locale === "pl"
                    ? "Zgłoś jako niepoprawne"
                    : locale === "ro"
                    ? "Marchează ca incorect"
                    : "Flag as incorrect"}
                </span>
              </button>

              <div className="my-0.5 border-t border-white/10" />

              {/* 3. Delete Message */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  if (speakingMsgId === targetMsg.id) {
                    handleStopSpeech();
                  }
                  deleteChatMessage(targetMsg.id);
                  setBubbleContextMenu(null);
                  showToast(
                    locale === "pl"
                      ? "Usunięto wiadomość z czatu."
                      : locale === "ro"
                      ? "Mesajul a fost șters din conversație."
                      : "Message deleted from chat."
                  );
                }}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-[#EF4444]/20 text-left text-xs font-semibold text-[#F87171] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#EF4444] shrink-0" aria-hidden="true" />
                <span>
                  {locale === "pl"
                    ? "Usuń wiadomość"
                    : locale === "ro"
                    ? "Șterge mesajul"
                    : "Delete message"}
                </span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Camera Scanner Modal for Quick Chat Document Upload */}
      <CameraScannerModal
        isOpen={isChatCameraOpen}
        onClose={() => setIsChatCameraOpen(false)}
        onCaptureBlob={(blob, fileName) => {
          void processChatAttachment(blob, "camera", fileName);
        }}
      />
    </div>
  );
};
