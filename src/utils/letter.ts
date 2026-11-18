export interface ParsedAnswer {
  /** Conversational part shown in the chat bubble. */
  chat: string;
  /** Formal English letter extracted from the AI answer, if present. */
  letter: string | null;
  /** Profile fields the AI detected in the conversation. */
  profileUpdate: Record<string, string> | null;
}

const LETTER_RE = /\[ENGLISH_LETTER_START\]([\s\S]*?)\[ENGLISH_LETTER_END\]/i;
const PROFILE_RE = /\[PROFILE_UPDATE_START\]([\s\S]*?)\[PROFILE_UPDATE_END\]/i;

/**
 * The backend asks the model to wrap the formal letter and detected profile data in
 * explicit tags. We split them out so the chat stays clean and the letter can be
 * copied / saved on its own.
 */
export function parseAnswer(raw: string): ParsedAnswer {
  let text = raw ?? "";
  let letter: string | null = null;
  let profileUpdate: Record<string, string> | null = null;

  const letterMatch = text.match(LETTER_RE);
  if (letterMatch) {
    letter = letterMatch[1].trim();
    text = text.replace(LETTER_RE, "").trim();
  }

  const profileMatch = text.match(PROFILE_RE);
  if (profileMatch) {
    try {
      const parsed = JSON.parse(profileMatch[1].trim());
      if (parsed && typeof parsed === "object") {
        profileUpdate = Object.fromEntries(
          Object.entries(parsed).map(([k, v]) => [k, String(v)])
        );
      }
    } catch {
      /* ignore malformed JSON */
    }
    text = text.replace(PROFILE_RE, "").trim();
  }

  return { chat: text, letter, profileUpdate };
}
