import {
  UserProfile,
  WorkplaceCase,
  ForumPost,
  UserDocument,
  WorkplaceNote,
  ChatMessage,
  SentLetter,
  Locale,
  BroadcastMessage,
  SavedLetterDraft,
  RecentUnsavedChat,
  UnsavedChatIconType,
  ChatSessionTag,
  AdminManagedUser,
  PromoCodeItem,
  MarketingPopupConfig,
  AdminChatDeliveryLog,
  ElonVoiceConfig,
  ThemeMode
} from "../types";
import {
  initialUserProfile,
  initialCases,
  initialForumPosts,
  initialDocuments,
  initialNotes,
  initialBroadcastMessages,
  initialSentLetters,
  initialAdminUsers,
  initialPromoCodes,
  initialMarketingPopupConfig
} from "../data/mockData";
import { ensureSentLetterTagged } from "../data/legalTemplates";

const STORAGE_KEYS = {
  USER: "ask_elon_user_profile",
  USER_ADMIN_MIGRATED: "ask_elon_admin_role_migrated_v2",
  NOTES_SPEC_MIGRATED: "ask_elon_notes_spec_migrated_v2",
  LOCALE: "ask_elon_locale",
  CASES: "ask_elon_cases",
  FORUM: "ask_elon_qa_v2",
  DOCS: "ask_elon_docs",
  NOTES: "ask_elon_notes",
  CHAT: "ask_elon_chat_history",
  SENT_LETTERS: "ask_elon_sent_letters",
  MESSAGES: "ask_elon_messages",
  CHAT_DRAFT: "ask_elon_chat_draft",
  LETTER_DRAFT: "ask_elon_letter_draft",
  RECENT_UNSAVED_CHATS: "ask_elon_recent_unsaved_chats",
  ADMIN_USERS: "ask_elon_admin_users",
  PROMO_CODES: "ask_elon_promo_codes",
  MARKETING_POPUP: "ask_elon_marketing_popup",
  ADMIN_CHAT_LOGS: "ask_elon_admin_chat_logs",
  VOICE_CONFIG: "ask_elon_voice_config",
  THEME: "ask_elon_theme_mode"
};

export const MAX_RECENT_UNSAVED_CHATS = 30;

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfile;
      const migrated = localStorage.getItem(STORAGE_KEYS.USER_ADMIN_MIGRATED);
      if (!migrated) {
        parsed.role = "admin";
        if (parsed.fullName === "Artur Kowalski" || !parsed.fullName) {
          parsed.fullName = initialUserProfile.fullName;
        }
        if (parsed.accountId === "ELON-89241" || !parsed.accountId) {
          parsed.accountId = initialUserProfile.accountId;
        }
        parsed.registeredAt = initialUserProfile.registeredAt;
        parsed.contractType = initialUserProfile.contractType;
        parsed.city = parsed.city || initialUserProfile.city;
        parsed.sessionsToday = parsed.sessionsToday ?? initialUserProfile.sessionsToday;
        parsed.sessionsLast7Days = parsed.sessionsLast7Days ?? initialUserProfile.sessionsLast7Days;
        parsed.sessionsTotal = parsed.sessionsTotal ?? initialUserProfile.sessionsTotal;
        parsed.dailyQueriesCount = parsed.dailyQueriesCount ?? initialUserProfile.dailyQueriesCount;
        parsed.chatQueriesCount = parsed.chatQueriesCount ?? initialUserProfile.chatQueriesCount;
        parsed.formalCasesCount = parsed.formalCasesCount ?? initialUserProfile.formalCasesCount;
        localStorage.setItem(STORAGE_KEYS.USER_ADMIN_MIGRATED, "true");
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
      }
      return {
        ...initialUserProfile,
        ...parsed,
      };
    }
    localStorage.setItem(STORAGE_KEYS.USER_ADMIN_MIGRATED, "true");
  } catch {}
  return initialUserProfile;
}

export function saveUserProfile(user: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {}
}

export function loadLocale(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCALE);
    if (raw === "pl" || raw === "en" || raw === "ro") return raw;
  } catch {}
  return "pl";
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCALE, locale);
  } catch {}
}

export function loadCases(): WorkplaceCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CASES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialCases;
}

export function saveCases(cases: WorkplaceCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  } catch {}
}

export function loadForumPosts(): ForumPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FORUM);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialForumPosts;
}

export function saveForumPosts(posts: ForumPost[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FORUM, JSON.stringify(posts));
  } catch {}
}

export function loadDocuments(): UserDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DOCS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialDocuments;
}

export function saveDocuments(docs: UserDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
  } catch {}
}

export function loadNotes(): WorkplaceNote[] {
  try {
    const migrated = localStorage.getItem(STORAGE_KEYS.NOTES_SPEC_MIGRATED);
    if (!migrated) {
      localStorage.setItem(STORAGE_KEYS.NOTES_SPEC_MIGRATED, "true");
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(initialNotes));
      return initialNotes;
    }
    const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialNotes;
}

export function saveNotes(notes: WorkplaceNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  } catch {}
}

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveChatHistory(chat: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(chat));
  } catch {}
}

export function loadChatDraft(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.CHAT_DRAFT) || "";
  } catch {
    return "";
  }
}

export function saveChatDraft(draft: string): void {
  try {
    if (!draft) {
      localStorage.removeItem(STORAGE_KEYS.CHAT_DRAFT);
    } else {
      localStorage.setItem(STORAGE_KEYS.CHAT_DRAFT, draft);
    }
  } catch {}
}

export function loadLetterDraft(): SavedLetterDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LETTER_DRAFT);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveLetterDraft(draft: SavedLetterDraft | null): void {
  try {
    if (!draft) {
      localStorage.removeItem(STORAGE_KEYS.LETTER_DRAFT);
    } else {
      localStorage.setItem(STORAGE_KEYS.LETTER_DRAFT, JSON.stringify(draft));
    }
  } catch {}
}

export function loadSentLetters(): SentLetter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SENT_LETTERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: SentLetter) => ensureSentLetterTagged(item));
      }
    }
  } catch {}
  return initialSentLetters.map((item) => ensureSentLetterTagged(item));
}

export function saveSentLetters(letters: SentLetter[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SENT_LETTERS, JSON.stringify(letters));
  } catch {}
}

export function loadBroadcastMessages(): BroadcastMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialBroadcastMessages;
}

export function saveBroadcastMessages(msgs: BroadcastMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(msgs));
  } catch {}
}

/**
 * Classifies a conversation's messages into a topic icon and concise title/preview
 */
export function getDefaultTagsForIconType(iconType: UnsavedChatIconType): ChatSessionTag[] {
  switch (iconType) {
    case "wages":
      return ["Pay Dispute"];
    case "grievance":
      return ["Grievance"];
    case "contract":
      return ["Contract"];
    case "dismissal":
      return ["Dismissal"];
    case "sick_pay":
      return ["Sick Pay"];
    case "settlement":
      return ["Settlement"];
    case "data":
      return ["GDPR"];
    default:
      return [];
  }
}

export function buildRecentUnsavedChatEntry(
  sessionId: string,
  messages: ChatMessage[],
  existingDateISO?: string,
  existingDateLabel?: string,
  existingTags?: ChatSessionTag[],
  existingIsArchived?: boolean,
  existingArchivedAt?: string
): RecentUnsavedChat | null {
  const userMessages = messages.filter((m) => m.role === "user" && m.text.trim().length > 0);
  if (userMessages.length === 0) return null;

  const firstUserText = userMessages[0].text.trim();
  const lastMsg = messages[messages.length - 1];
  const combined = messages.map((m) => m.text).join(" ").toLowerCase();

  let iconType: UnsavedChatIconType = "general";
  if (/\b(ugod\w*|porozumieni\w*|settlement|section 111a|rekompensat\w*|early conciliation)\b/i.test(combined)) {
    iconType = "settlement";
  } else if (/\b(nadgodzin\w*|wypłat\w*|pensj\w*|payslip\w*|wage\w*|pay|potrąc\w*|deduct\w*|overtime|minimum wage|section 13|funt\w*)\b/i.test(combined)) {
    iconType = "wages";
  } else if (/\b(ssp|ssp1|choro\w*|zasił\w*|sick\w*|lekarz\w*|fit note|zwolnieni\w* lekarsk\w*|wypad\w*)\b/i.test(combined)) {
    iconType = "sick_pay";
  } else if (/\b(zwolni\w*|wyrzuc\w*|wypowiedzeni\w*|dismiss\w*|fired|sacked|redundant|dyscyplin\w*|section 95|section 98)\b/i.test(combined)) {
    iconType = "dismissal";
  } else if (/\b(skarg\w*|grievance|mobbing\w*|bullying|harassment|traktow\w*|bhp|health and safety)\b/i.test(combined)) {
    iconType = "grievance";
  } else if (/\b(sar|rodo|gdpr|dane|data|bramk\w*|clock\w*|akt\w* osobow\w*|records)\b/i.test(combined)) {
    iconType = "data";
  } else if (/\b(umow\w*|contract\w*|grafik\w*|zmian\w*|godzin\w*|urlop\w*|holiday|przerw\w*|break|zero-hours)\b/i.test(combined)) {
    iconType = "contract";
  }

  const now = new Date();
  const dateISO = existingDateISO || now.toISOString().slice(0, 10);
  const dateLabel =
    existingDateLabel ||
    now.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  const updatedAtTime =
    lastMsg?.timestamp ||
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const cleanTitle =
    firstUserText.length > 54 ? `${firstUserText.slice(0, 52).trim()}…` : firstUserText;
  const rawPreview = (lastMsg?.text || firstUserText).replace(/\[ENGLISH_LETTER_START\][\s\S]*/i, "").trim();
  const cleanPreview =
    rawPreview.length > 76 ? `${rawPreview.slice(0, 74).trim()}…` : rawPreview;

  return {
    id: sessionId,
    title: cleanTitle,
    preview: cleanPreview,
    dateISO,
    dateLabel,
    updatedAtTime,
    iconType,
    tags: existingTags !== undefined ? existingTags : getDefaultTagsForIconType(iconType),
    isArchived: Boolean(existingIsArchived),
    archivedAt: existingArchivedAt,
    messages,
    messageCount: messages.length,
  };
}

export function loadRecentUnsavedChats(): RecentUnsavedChat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_UNSAVED_CHATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item: RecentUnsavedChat) => item && typeof item.id === "string" && !item.id.startsWith("unsaved_seed_"))
          .slice(0, MAX_RECENT_UNSAVED_CHATS)
          .map((item: RecentUnsavedChat) => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : getDefaultTagsForIconType(item.iconType),
            isArchived: Boolean(item.isArchived),
          }));
      }
    }
  } catch {}
  return [];
}

export function saveRecentUnsavedChats(chats: RecentUnsavedChat[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.RECENT_UNSAVED_CHATS,
      JSON.stringify(chats.slice(0, MAX_RECENT_UNSAVED_CHATS))
    );
  } catch {}
}

/**
 * Inserts or updates an unsaved conversation in the history list, keeping up to 10 active chats and preserving archived cases
 */
export function upsertRecentUnsavedChat(
  currentList: RecentUnsavedChat[],
  sessionId: string,
  messages: ChatMessage[]
): RecentUnsavedChat[] {
  const existing = currentList.find((c) => c.id === sessionId);
  const entry = buildRecentUnsavedChatEntry(
    sessionId,
    messages,
    existing?.dateISO,
    existing?.dateLabel,
    existing?.tags,
    existing?.isArchived,
    existing?.archivedAt
  );
  if (!entry) return currentList;

  const filtered = currentList.filter((c) => c.id !== sessionId);
  const merged = [entry, ...filtered];
  const activeItems = merged.filter((c) => !c.isArchived).slice(0, 10);
  const archivedItems = merged.filter((c) => c.isArchived).slice(0, 20);
  const next = [...activeItems, ...archivedItems].slice(0, MAX_RECENT_UNSAVED_CHATS);
  saveRecentUnsavedChats(next);
  return next;
}

export function loadAdminUsers(): AdminManagedUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initialAdminUsers;
}

export function saveAdminUsers(users: AdminManagedUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(users));
  } catch {}
}

export function loadPromoCodes(): PromoCodeItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMO_CODES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initialPromoCodes;
}

export function savePromoCodes(codes: PromoCodeItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROMO_CODES, JSON.stringify(codes));
  } catch {}
}

export function loadMarketingPopupConfig(): MarketingPopupConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MARKETING_POPUP);
    if (raw) {
      return { ...initialMarketingPopupConfig, ...JSON.parse(raw) };
    }
  } catch {}
  return initialMarketingPopupConfig;
}

export function saveMarketingPopupConfig(config: MarketingPopupConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MARKETING_POPUP, JSON.stringify(config));
  } catch {}
}

export function loadAdminChatDeliveryLogs(): AdminChatDeliveryLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_CHAT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveAdminChatDeliveryLogs(logs: AdminChatDeliveryLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_CHAT_LOGS, JSON.stringify(logs));
  } catch {}
}

export const defaultVoiceConfig: ElonVoiceConfig = {
  preset: "young_professional",
  pitch: 0.98,
  speed: 1.0,
  autoReadAloud: true,
};

export function loadVoiceConfig(): ElonVoiceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VOICE_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultVoiceConfig, ...parsed };
    }
  } catch {}
  return defaultVoiceConfig;
}

export function saveVoiceConfig(config: ElonVoiceConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VOICE_CONFIG, JSON.stringify(config));
  } catch {}
}

export function loadThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === "light" || raw === "dark") return raw;
  } catch {}
  return "dark";
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, mode);
  } catch {}
}

export function resetAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch {}
}



