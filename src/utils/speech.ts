import * as Speech from "expo-speech";
import type { Locale } from "../types";

const SPEECH_LANG: Record<Locale, string> = {
  pl: "pl-PL",
  en: "en-GB",
  ro: "ro-RO",
};

/**
 * Strips markdown/emoji noise and expands common UK statutory shorthand so the
 * native text-to-speech engine reads legal advice naturally instead of spelling
 * out symbols ("asterisk asterisk", "scales of justice", ...).
 */
export function cleanTextForSpeech(raw: string): string {
  return (raw ?? "")
    .replace(/\[ENGLISH_LETTER_START\][\s\S]*?\[ENGLISH_LETTER_END\]/gi, "")
    .replace(/\[PROFILE_UPDATE_START\][\s\S]*?\[PROFILE_UPDATE_END\]/gi, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_#>`~]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/\bs\.\s?(\d+)/gi, "section $1")
    .replace(/\bERA\s?1996\b/gi, "Employment Rights Act 1996")
    .replace(/\bNLW\b/g, "National Living Wage")
    .replace(/\bNMW\b/g, "National Minimum Wage")
    .replace(/\bSSP\b/g, "Statutory Sick Pay")
    .replace(/\bACAS\b/g, "A C A S")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function speak(text: string, locale: Locale, onDone?: () => void): void {
  const clean = cleanTextForSpeech(text);
  if (!clean) {
    onDone?.();
    return;
  }
  Speech.stop();
  Speech.speak(clean, {
    language: SPEECH_LANG[locale] ?? "en-GB",
    rate: 0.98,
    pitch: 1.0,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}
