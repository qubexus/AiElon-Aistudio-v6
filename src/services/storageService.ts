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
  SavedLetterDraft
} from "../types";
import {
  initialUserProfile,
  initialCases,
  initialForumPosts,
  initialDocuments,
  initialNotes,
  initialBroadcastMessages,
  initialSentLetters
} from "../data/mockData";
import { ensureSentLetterTagged } from "../data/legalTemplates";

const STORAGE_KEYS = {
  USER: "ask_elon_user_profile",
  LOCALE: "ask_elon_locale",
  CASES: "ask_elon_cases",
  FORUM: "ask_elon_forum",
  DOCS: "ask_elon_docs",
  NOTES: "ask_elon_notes",
  CHAT: "ask_elon_chat_history",
  SENT_LETTERS: "ask_elon_sent_letters",
  MESSAGES: "ask_elon_messages",
  CHAT_DRAFT: "ask_elon_chat_draft",
  LETTER_DRAFT: "ask_elon_letter_draft"
};

export function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) return JSON.parse(raw);
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

export function resetAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch {}
}

