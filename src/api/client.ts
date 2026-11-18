import Constants from "expo-constants";
import type {
  ConversationLegalSummary,
  LegalDeadlineItem,
  LegalRightItem,
  LetterSentimentResult,
  Locale,
} from "../types";

export interface AIUserContext {
  name?: string;
  email?: string;
  phone?: string;
  homeAddress?: string;
  employer?: string;
  companyNumber?: string;
  employerAddress?: string;
  jobTitle?: string;
  startDate?: string;
  hourlyRate?: number;
  hoursPerWeek?: number;
  contractType?: string;
  accountId?: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/**
 * Resolves the backend base URL.
 * 1. EXPO_PUBLIC_BACKEND_URL (production / explicit override)
 * 2. Metro dev-server host with port 3000 (so a phone on the same Wi-Fi reaches the
 *    local Express server without hardcoding an IP address).
 */
export function getBackendUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:3000`;
  }

  return "http://localhost:3000";
}

export const BACKEND_URL = getBackendUrl();

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function postJson<T>(path: string, body: unknown, timeoutMs = 45_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const data = await res.json();
        if (data?.error) message = String(data.error);
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(message, res.status);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Lightweight connectivity probe used by the offline banner. */
export async function checkHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${BACKEND_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/** Non-streaming chat completion (used as a fallback path). */
export async function askElon(
  prompt: string,
  history: ChatTurn[],
  locale: Locale,
  userContext?: AIUserContext
): Promise<string> {
  const data = await postJson<{ text?: string }>("/api/gemini/chat", {
    prompt,
    history,
    locale,
    userContext,
  });
  return data.text ?? "";
}

/**
 * Streams the AI answer via SSE.
 *
 * React Native's fetch has no ReadableStream, so we use XMLHttpRequest and parse
 * `data: {...}` frames from `responseText` as they arrive.
 */
export function streamElon(
  prompt: string,
  history: ChatTurn[],
  locale: Locale,
  userContext: AIUserContext | undefined,
  onChunk: (accumulated: string) => void,
  signal?: { aborted: boolean }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let consumed = 0;
    let buffer = "";
    let accumulated = "";
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const parseFrames = () => {
      const text = xhr.responseText ?? "";
      if (text.length <= consumed) return;
      buffer += text.slice(consumed);
      consumed = text.length;

      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const line = frame.trim();
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        try {
          const parsed = JSON.parse(json) as { chunk?: string; error?: string; done?: boolean };
          if (parsed.error) {
            finish(() => reject(new Error(parsed.error)));
            return;
          }
          if (parsed.chunk) {
            accumulated += parsed.chunk;
            onChunk(accumulated);
          }
        } catch {
          /* ignore malformed frame */
        }
      }
    };

    xhr.open("POST", `${BACKEND_URL}/api/gemini/chat-stream`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "text/event-stream");
    xhr.timeout = 120_000;

    xhr.onprogress = () => {
      if (signal?.aborted) {
        xhr.abort();
        return;
      }
      parseFrames();
    };

    xhr.onload = () => {
      parseFrames();
      if (xhr.status >= 200 && xhr.status < 300) {
        finish(() => resolve(accumulated));
      } else {
        let message = `Stream failed (${xhr.status})`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.error) message = String(data.error);
        } catch {
          /* ignore */
        }
        finish(() => reject(new ApiError(message, xhr.status)));
      }
    };

    xhr.onerror = () => finish(() => reject(new Error("Network error while streaming")));
    xhr.ontimeout = () => finish(() => reject(new Error("Stream timed out")));
    xhr.onabort = () => finish(() => resolve(accumulated));

    xhr.send(JSON.stringify({ prompt, history, locale, userContext }));
  });
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  locale: Locale
): Promise<string> {
  const data = await postJson<{ text?: string }>(
    "/api/gemini/transcribe",
    { audioBase64, mimeType, locale },
    90_000
  );
  return data.text ?? "";
}

export async function analyzeLetterSentiment(
  letterText: string,
  locale: Locale
): Promise<LetterSentimentResult> {
  // The server reads the letter from `letterPreview`.
  return postJson<LetterSentimentResult>("/api/gemini/analyze-letter-sentiment", {
    letterPreview: letterText,
    locale,
  });
}

export async function fetchLegalSummary(
  messages: ChatTurn[],
  locale: Locale,
  userContext?: AIUserContext
): Promise<ConversationLegalSummary> {
  const data = await postJson<{
    topicSummary?: string;
    rights?: LegalRightItem[];
    deadlines?: LegalDeadlineItem[];
    recommendedTemplateIds?: string[];
  }>("/api/gemini/legal-summary", { messages, locale, userContext });

  return {
    topicSummary: data.topicSummary ?? "",
    rights: Array.isArray(data.rights) ? data.rights : [],
    deadlines: Array.isArray(data.deadlines) ? data.deadlines : [],
    recommendedTemplateIds: Array.isArray(data.recommendedTemplateIds)
      ? data.recommendedTemplateIds
      : [],
    isBaseline: false,
    updatedAt: new Date().toISOString(),
    source: "ai",
  };
}
