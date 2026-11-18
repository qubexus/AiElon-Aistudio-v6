import type { TranslationKey } from "../i18n/translations";

/**
 * Contextual suggestions.
 *
 * Matching is purely local: the message the user is typing (plus the current
 * case text) is normalised and scored against a small keyword table. No AI call
 * is made per keystroke, which keeps the input completely free of latency.
 */
export interface SuggestionDef {
  id: string;
  title: TranslationKey;
  prompt: TranslationKey;
  /** Lowercase keywords in EN/PL/RO; a hit anywhere in the text scores a point. */
  keywords: string[];
}

export const SUGGESTIONS: SuggestionDef[] = [
  {
    id: "overtime",
    title: "chat.suggest.overtime.title",
    prompt: "chat.suggest.overtime.prompt",
    keywords: [
      "overtime",
      "extra hours",
      "nadgodzin",
      "nadgodziny",
      "dodatkowe godziny",
      "ore suplimentare",
      "suplimentar",
      "unpaid",
      "nie zaplaci",
      "neplatit",
    ],
  },
  {
    id: "overtimeCalc",
    title: "chat.suggest.overtimeCalc.title",
    prompt: "chat.suggest.overtimeCalc.prompt",
    keywords: [
      "calculate",
      "how much",
      "policzyc",
      "policzyć",
      "ile",
      "zalegle",
      "zaległe",
      "restante",
      "owed",
      "nalezy",
      "należy",
      "datoreaza",
    ],
  },
  {
    id: "ssp",
    title: "chat.suggest.ssp.title",
    prompt: "chat.suggest.ssp.prompt",
    keywords: [
      "ssp",
      "sick pay",
      "sick",
      "ill",
      "l4",
      "zwolnienie lekarskie",
      "chorobow",
      "boli",
      "concediu medical",
      "boala",
    ],
  },
  {
    id: "hours",
    title: "chat.suggest.hours.title",
    prompt: "chat.suggest.hours.prompt",
    keywords: [
      "hours cut",
      "cut my hours",
      "reduced hours",
      "rota",
      "obcial",
      "obciął",
      "godziny",
      "redukcj",
      "orele",
      "redus",
      "ture",
      "shift",
      "zmian",
    ],
  },
  {
    id: "holiday",
    title: "chat.suggest.holiday.title",
    prompt: "chat.suggest.holiday.prompt",
    keywords: [
      "holiday",
      "annual leave",
      "vacation",
      "urlop",
      "wakacj",
      "concediu",
      "vacanta",
      "wypłata za urlop",
    ],
  },
  {
    id: "grievance",
    title: "chat.suggest.grievance.title",
    prompt: "chat.suggest.grievance.prompt",
    keywords: [
      "grievance",
      "complaint",
      "skarg",
      "zazalen",
      "zażalen",
      "plangere",
      "plângere",
      "reclamat",
      "manager",
      "menedzer",
    ],
  },
  {
    id: "dismissal",
    title: "chat.suggest.dismissal.title",
    prompt: "chat.suggest.dismissal.prompt",
    keywords: [
      "dismiss",
      "fired",
      "sacked",
      "redundancy",
      "zwoln",
      "wyrzuc",
      "concedi",
      "dat afara",
      "notice pay",
      "wypowiedzen",
    ],
  },
  {
    id: "payslip",
    title: "chat.suggest.payslip.title",
    prompt: "chat.suggest.payslip.prompt",
    keywords: [
      "payslip",
      "deduction",
      "deducted",
      "pasek",
      "potrac",
      "potrąc",
      "wyplat",
      "wypłat",
      "fluturas",
      "fluturaș",
      "retiner",
      "reținer",
      "salariu",
      "wage",
      "wages",
    ],
  },
  {
    id: "acas",
    title: "chat.suggest.acas.title",
    prompt: "chat.suggest.acas.prompt",
    keywords: [
      "acas",
      "tribunal",
      "conciliation",
      "sad pracy",
      "sąd pracy",
      "pozew",
      "instanta",
      "instanț",
      "claim",
      "roszczenie",
      "reclamatie",
    ],
  },
  {
    id: "harassment",
    title: "chat.suggest.harassment.title",
    prompt: "chat.suggest.harassment.prompt",
    keywords: [
      "harass",
      "bully",
      "bullying",
      "discriminat",
      "nekan",
      "nękan",
      "mobbing",
      "znecan",
      "znęcan",
      "hartu",
      "hărțu",
      "discriminare",
      "rasism",
      "sexism",
    ],
  },
];

/** Lowercase + strip Polish/Romanian diacritics so "nadgodziny" matches "nadgodzin". */
export function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Return at most `limit` suggestions whose keywords appear in the text.
 * `extra` is the current case (title + description + employer), so suggestions
 * also follow the case the user is chatting about.
 */
export function matchSuggestions(text: string, extra = "", limit = 3): SuggestionDef[] {
  const haystack = normalise(`${text} ${extra}`);
  if (haystack.length < 3) return [];

  const scored = SUGGESTIONS.map((item) => {
    let score = 0;
    for (const keyword of item.keywords) {
      const needle = normalise(keyword);
      if (needle.length >= 3 && haystack.includes(needle)) score += 1;
    }
    return { item, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.item);
}

/** True once the user has typed roughly three words (spec: >= ~3 words). */
export function hasEnoughContext(text: string): boolean {
  return text.trim().split(/\s+/).filter(Boolean).length >= 3;
}
