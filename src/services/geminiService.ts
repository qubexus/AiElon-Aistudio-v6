import {
  Locale,
  LetterSentimentResult,
  SentimentFlagItem,
  ChatMessage,
  ConversationLegalSummary,
  LegalRightItem,
  LegalDeadlineItem,
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

export async function askElonAI(
  prompt: string,
  history: { role: "user" | "assistant"; text: string }[],
  locale: Locale = "pl",
  userContext?: AIUserContext
): Promise<string> {
  try {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, history, locale, userContext }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.text) {
        return data.text;
      }
    }
  } catch (e) {
    console.warn("Server /api/gemini/chat call failed, using UK labor law legal engine fallback:", e);
  }

  return generateExpertLegalResponse(prompt, locale, userContext);
}

/**
 * Streams AI response chunks in real time via SSE (/api/gemini/chat-stream)
 * or progressive fallback chunks, invoking `onChunk(accumulatedText)` as tokens arrive
 * and resolving with the complete response text only after the stream finishes.
 */
export async function askElonAIStream(
  prompt: string,
  history: { role: "user" | "assistant"; text: string }[],
  locale: Locale = "pl",
  userContext?: AIUserContext,
  onChunk?: (accumulatedText: string) => void
): Promise<string> {
  try {
    const response = await fetch("/api/gemini/chat-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, history, locale, userContext }),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.chunk) {
              accumulated += parsed.chunk;
              onChunk?.(accumulated);
            }
          } catch {
            // Ignore malformed SSE frame
          }
        }
      }

      if (accumulated.trim().length > 0) {
        return accumulated;
      }
    }
  } catch (e) {
    console.warn("Server /api/gemini/chat-stream failed, streaming from UK labor law fallback engine:", e);
  }

  // Fallback progressive stream so the UI streams smoothly and completes deterministically
  const fullFallback = generateExpertLegalResponse(prompt, locale, userContext);
  if (onChunk) {
    const tokens = fullFallback.split(/(?=\s+)/);
    let current = "";
    const stepSize = Math.max(3, Math.ceil(tokens.length / 18));
    for (let i = 0; i < tokens.length; i += stepSize) {
      current += tokens.slice(i, i + stepSize).join("");
      onChunk(current);
      await new Promise((r) => setTimeout(r, 28));
    }
  }
  return fullFallback;
}

/**
 * Instant client-side lexical & tone pre-scanner for zero-latency background detection
 * while the full Gemini AI analysis runs on the server.
 */
export function runInstantClientSentimentScan(
  fields: Record<string, string>,
  letterPreview: string,
  locale: Locale = "pl"
): LetterSentimentResult {
  const flags: SentimentFlagItem[] = [];
  const lang = locale === "pl" || locale === "ro" ? locale : "en";

  const rules: Array<{
    pattern: RegExp;
    severity: "inflammatory" | "cautionary";
    category: Record<Locale, string>;
    reason: Record<Locale, string>;
    replacement: Record<Locale, string>;
  }> = [
    {
      pattern: /\b(złodziej\w*|oszust\w*|kradn\w*|okrad\w*|thief|thieves|steal\w*|crook\w*|fraud\w*|hoț\w*|fură|escroc\w*)\b/gi,
      severity: "inflammatory",
      category: {
        pl: "Oskarżenie karne / Ryzyko zniesławienia",
        en: "Criminal Accusation / Defamation Risk",
        ro: "Acuzație penală / Risc de defăimare",
      },
      reason: {
        pl: "Sformułowania typu 'złodziej' lub 'oszust' mogą zostać potraktowane przez HR jako ciężkie naruszenie obowiązków (Gross Misconduct) i osłabić Twoją wiarygodność przed Employment Tribunal.",
        en: "Calling the employer or manager a 'thief' or 'fraud' can trigger disciplinary action for gross misconduct and weaken your position at an Employment Tribunal.",
        ro: "Numirea angajatorului 'hoț' sau 'escroc' poate atrage sancțiuni disciplinare (Gross Misconduct) și îți poate afecta credibilitatea la Tribunalul Muncii.",
      },
      replacement: {
        pl: "bezprawne potrącenie wynagrodzenia stanowiące naruszenie Section 13 Employment Rights Act 1996",
        en: "an unauthorized deduction from wages in breach of Section 13 of the Employment Rights Act 1996",
        ro: "o reținere neautorizată din salariu care încalcă Secțiunea 13 din Employment Rights Act 1996",
      },
    },
    {
      pattern: /\b(idiot\w*|debil\w*|kretyn\w*|głup\w*|cham\w*|świni\w*|basta?rd\w*|moron\w*|stupid\w*|scum\w*|incompetent fool\w*|prost\w*|nesimțit\w*|gunoi\w*)\b/gi,
      severity: "inflammatory",
      category: {
        pl: "Atak personalny / Obraza (Insult)",
        en: "Personal Attack / Insult",
        ro: "Atac la persoană / Insultă",
      },
      reason: {
        pl: "Obraźliwe określenia personalne naruszają standardy ACAS i dają pracodawcy powód do wszczęcia postępowania dyscyplinarnego przeciwko Tobie.",
        en: "Personal insults breach workplace dignity policies and give HR grounds to initiate disciplinary proceedings against you.",
        ro: "Insultele personale încalcă procedurile ACAS și oferă departamentului HR motive pentru o anchetă disciplinară.",
      },
      replacement: {
        pl: "nieprofesjonalne zachowanie przełożonego naruszające standardy ACAS oraz zasadę wzajemnego zaufania (mutual trust and confidence)",
        en: "unprofessional conduct that falls below ACAS workplace standards and breaches the implied term of mutual trust and confidence",
        ro: "comportament neprofesionist care încalcă standardele ACAS și principiul încrederii reciproce",
      },
    },
    {
      pattern: /\b(zniszczę\w*|pożałujecie|spalę|zabiję|zemsta|destroy you|make you pay|ruin your|burn down|revenge|get even|vă distrug|o să regretați|răzbunare)\b/gi,
      severity: "inflammatory",
      category: {
        pl: "Groźba / Język odwetowy",
        en: "Threatening / Retaliatory Language",
        ro: "Amenințare / Limbaj vindicativ",
      },
      reason: {
        pl: "Język brzmiący jak groźba odwetu może być podstawą do natychmiastowego zwolnienia (Summary Dismissal). Zastąp go formalną zapowiedzią kroków prawnych.",
        en: "Threatening language can be treated as gross misconduct justifying summary dismissal. Replace with a calm reservation of statutory rights.",
        ro: "Limbajul amenințător poate duce la concediere disciplinară imediată. Înlocuiește-l cu rezervarea calmă a drepturilor legale.",
      },
      replacement: {
        pl: "W przypadku braku rozwiązania sprawy skorzystam z przysługujących mi środków prawnych, w tym zgłoszenia do ACAS Early Conciliation oraz Employment Tribunal",
        en: "Should this matter remain unresolved, I reserve the right to pursue statutory remedies via ACAS Early Conciliation and the Employment Tribunal",
        ro: "În cazul în care situația nu se rezolvă, îmi rezerv dreptul de a apela la ACAS Early Conciliation și la Tribunalul Muncii",
      },
    },
    {
      pattern: /\b(kłamc\w*|kłamie\w*|łgarz\w*|liar\w*|lying|fabricat\w*|mincino\w*|minte|vrăjeală)\b/gi,
      severity: "cautionary",
      category: {
        pl: "Bezpośrednie oskarżenie o kłamstwo",
        en: "Direct Accusation of Dishonesty",
        ro: "Acuzație directă de minciună",
      },
      reason: {
        pl: "Nazywanie przełożonego 'kłamcą' zaostrza spór. Dużo skuteczniejsze prawnie jest wskazanie na rozbieżność z dokumentacją i dowodami.",
        en: "Directly calling someone a 'liar' escalates hostility. Pointing out factual discrepancies supported by documentary records is stronger legally.",
        ro: "Numirea directă a cuiva 'mincinos' escaladează conflictul. Este mai eficient juridic să indici neconcordanțele față de probele scrise.",
      },
      replacement: {
        pl: "przedstawione stanowisko jest sprzeczne z dokumentacją pracowniczą oraz stanem faktycznym",
        en: "the account provided is inconsistent with contemporaneous documentary records and the factual timeline",
        ro: "poziția prezentată este în contradicție cu documentele de evidență și situația de fapt",
      },
    },
    {
      pattern: /\b(nienawidzę|rzygać|pieprzyć|kurw\w*|cholern\w*|fuck\w*|shit\w*|bullshit\w*|damn\w*|crap|hate you|dracu\w*|rahat|nenorocit\w*)\b/gi,
      severity: "inflammatory",
      category: {
        pl: "Wulgaryzmy / Język emocjonalny",
        en: "Profanity / Hostile Emotion",
        ro: "Limbaj vulgar / Emoțional",
      },
      reason: {
        pl: "Wulgaryzmy w oficjalnej korespondencji osłabiają Twoją wiarygodność przed sądem pracy. Pismo w UK musi być chłodne i rzeczowe.",
        en: "Profanity in formal correspondence undermines your credibility before a tribunal and violates workplace conduct rules.",
        ro: "Limbajul vulgar în corespondența oficială încalcă regulamentul intern și îți slăbește poziția juridică.",
      },
      replacement: {
        pl: "Powyższa sytuacja jest dla mnie wysoce krzywdząca i stanowi poważne naruszenie warunków zatrudnienia",
        en: "This situation is wholly unacceptable and constitutes a serious breach of my terms of employment",
        ro: "Această situație este inacceptabilă și constituie o încălcare gravă a condițiilor mele de muncă",
      },
    },
  ];

  const entries = Object.entries(fields);
  if (entries.length === 0 && letterPreview) {
    entries.push(["letter_body", letterPreview]);
  }

  for (const [fieldKey, value] of entries) {
    if (!value || typeof value !== "string") continue;

    for (const rule of rules) {
      const matches = value.match(rule.pattern);
      if (matches && matches.length > 0) {
        const matchWord = matches[0];
        const idx = value.toLowerCase().indexOf(matchWord.toLowerCase());
        const start = Math.max(0, idx - 25);
        const end = Math.min(value.length, idx + matchWord.length + 35);
        const snippet = value.slice(start, end).trim();

        flags.push({
          fieldKey,
          originalText: snippet,
          severity: rule.severity,
          category: rule.category[lang],
          reason: rule.reason[lang],
          suggestedReplacement: rule.replacement[lang],
        });
      }
    }

    const shoutingMatch = value.match(/[A-ZĄĆĘŁŃÓŚŹŻ]{5,}(?:\s+[A-ZĄĆĘŁŃÓŚŹŻ]{4,})+|[!]{2,}/);
    if (shoutingMatch) {
      flags.push({
        fieldKey,
        originalText: shoutingMatch[0],
        severity: "cautionary",
        category:
          lang === "pl"
            ? "Ton konfrontacyjny (Caps Lock / Wykrzykniki)"
            : lang === "ro"
            ? "Ton confruntațional (Majuscule / Exclamații)"
            : "Confrontational Formatting (All-Caps / Exclamations)",
        reason:
          lang === "pl"
            ? "Pisanie wielkimi literami i wieloma wykrzyknikami sprawia wrażenie agresji emocjonalnej w dokumentacji dla Employment Tribunal."
            : lang === "ro"
            ? "Folosirea majusculelor și a semnelor de exclamare multiple pare agresivă în fața Tribunalului Muncii."
            : "All-caps text and multiple exclamation marks appear overly emotional in formal HR and Employment Tribunal evidence.",
        suggestedReplacement: shoutingMatch[0]
          .replace(/!+/g, ".")
          .toLowerCase()
          .replace(/(^\w)/, (m) => m.toUpperCase()),
      });
    }
  }

  const hasInflammatory = flags.some((f) => f.severity === "inflammatory");
  const hasCautionary = flags.some((f) => f.severity === "cautionary");
  const overallStatus = hasInflammatory
    ? "inflammatory"
    : hasCautionary
    ? "cautionary"
    : "professional";

  const toneScore = hasInflammatory
    ? Math.max(20, 65 - flags.length * 20)
    : hasCautionary
    ? Math.max(55, 82 - flags.length * 10)
    : 98;

  const summaryByLang: Record<Locale, string> = {
    pl:
      overallStatus === "professional"
        ? "Ton pisma jest rzeczowy, spokojny i w pełni zgodny ze standardami ACAS. Pismo chroni Twoje interesy."
        : overallStatus === "inflammatory"
        ? `Wykryto ${flags.length} sformułowań o charakterze agresywnym lub zapalnym, które pracodawca mógłby wykorzystać przeciwko Tobie. Zalecamy ich zamianę na język prawny.`
        : `Wykryto ${flags.length} emocjonalnych zwrotów. Złagodzenie tonu zwiększy Twoją wiarygodność przed HR i Employment Tribunal.`,
    en:
      overallStatus === "professional"
        ? "Your letter's tone is calm, factual, and strictly compliant with ACAS guidelines. Safe to finalize."
        : overallStatus === "inflammatory"
        ? `Detected ${flags.length} potentially aggressive or inflammatory phrase(s) that HR could use against you. Review Elon's diplomatic legal rewrites below.`
        : `Detected ${flags.length} emotionally charged phrase(s). Adopting neutral statutory wording will strengthen your case.`,
    ro:
      overallStatus === "professional"
        ? "Tonul scrisorii este calm, obiectiv și conform cu normele ACAS. Sigur pentru finalizare."
        : overallStatus === "inflammatory"
        ? `S-au detectat ${flags.length} expresii agresive sau inflamatorii pe care HR-ul le-ar putea folosi împotriva ta. Aplică reformulările juridice de mai jos.`
        : `S-au detectat ${flags.length} formulări emoționale. Un ton neutru și legal îți va întări poziția.`,
  };

  return {
    overallStatus,
    toneScore,
    summary: summaryByLang[lang],
    flaggedItems: flags,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Calls server-side Gemini sentiment & inflammatory language analyzer
 * with fallback to instant lexical analyzer.
 */
export async function analyzeLetterSentimentAI(
  fields: Record<string, string>,
  letterPreview: string,
  templateTitle: string,
  locale: Locale = "pl",
  signal?: AbortSignal
): Promise<LetterSentimentResult> {
  try {
    const response = await fetch("/api/gemini/analyze-letter-sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields, letterPreview, templateTitle, locale }),
      signal,
    });

    if (response.ok) {
      const data: LetterSentimentResult = await response.json();
      return data;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw err;
    }
    console.warn("Background sentiment analysis server call fell back to local engine:", err);
  }

  return runInstantClientSentimentScan(fields, letterPreview, locale);
}

function generateExpertLegalResponse(
  query: string,
  locale: Locale,
  userContext?: AIUserContext
): string {
  const q = query.toLowerCase();
  const fullName = userContext?.name || "Artur Kowalski";
  const firstName = fullName.split(" ")[0] || (locale === "pl" ? "Kolego" : locale === "ro" ? "Prietene" : "Mate");
  const employer = userContext?.employer || "Amazon Fulfilment LCY2";
  const homeAddr = userContext?.homeAddress || "42 Victoria Road, Dartford, DA1 5DJ";
  const phone = userContext?.phone || "+44 7700 900342";

  if (
    q.includes("nadgodzin") ||
    q.includes("wypłat") ||
    q.includes("payslip") ||
    q.includes("wages") ||
    q.includes("potrąc") ||
    q.includes("salariu") ||
    q.includes("overtime") ||
    q.includes("funt") ||
    q.includes("pieni")
  ) {
    if (locale === "pl") {
      return `Siema ${firstName}! Sprawdziłem dokładnie Twoją sprawę z wypłatą w ${employer} i powiem Ci krótko: prawo stoi twardo po Twojej stronie.

Zgodnie z artykułem 13 Employment Rights Act 1996 pracodawca ani agencja nie mogą zabrać Ci ani jednego funta z pensji ani wstrzymać zapłaty za przepracowane nadgodziny bez Twojej wcześniejszej pisemnej zgody. Dodatkowo zgodnie z artykułem 9 Health and Safety at Work Act 1974 za wymagane buty ochronne i sprzęt BHP firma musi zapłacić sama.

Nasz plan działania:
Opcja pierwsza na spokojnie: Wyślij krótką wiadomość do przełożonego i działu kadr z wyliczeniem brakujących godzin.
Opcja druga twardo z paragrafu: Przygotowałem już dla Ciebie pod tą wiadomością gotowe oficjalne wezwanie do zapłaty po angielsku, automatycznie wypełnione Twoimi danymi z profilu (${fullName}, adres ${homeAddr}, telefon ${phone}) i zaadresowane bezpośrednio do ${employer}. Po zakończeniu mojej wypowiedzi otworzy się koperta z dokumentem, który możesz od razu skopiować lub zapisać.`;
    } else if (locale === "ro") {
      return `Salut ${firstName}! Am verificat situația ta cu salariul la ${employer} și îți spun direct că legea britanică este complet de partea ta.

Conform Secțiunii 13 din Employment Rights Act 1996 angajatorul nu are voie să îți rețină niciun ban din salariu sau ore suplimentare fără acordul tău scris în prealabil.

Am pregătit deja pentru tine mai jos scrisoarea oficială în limba engleză completată automat cu datele tale din profil (${fullName}, adresa ${homeAddr}, telefon ${phone}) către ${employer}. În plicul de mai jos poți vedea documentul complet, îl poți copia sau salva direct.`;
    } else {
      return `Listen mate ${firstName}, I have checked your pay situation with ${employer} and UK law backs you one hundred percent.

Under Section 13 of the Employment Rights Act 1996 your employer cannot withhold overtime pay or deduct a penny from your wages without your prior written consent, and under Section 9 of the Health and Safety at Work Act 1974 mandatory safety gear must be provided free of charge.

I have already prepared your formal English statutory demand letter below, pre-filled with all your profile details (${fullName}, ${homeAddr}, ${phone}) addressed to ${employer}. Use the envelope below to preview, copy, or save the document.`;
    }
  }

  if (
    q.includes("ssp") ||
    q.includes("choro") ||
    q.includes("sick") ||
    q.includes("medical") ||
    q.includes("lekarz") ||
    q.includes("doctor")
  ) {
    if (locale === "pl") {
      return `Słuchaj ${firstName}, nie daj się zbyć z chorobowym w ${employer}! Odmowa wypłaty Statutory Sick Pay to częsty trik, ale szybko to wyprostujemy.

Zgodnie z artykułem 151 Social Security Contributions and Benefits Act 1992 należy Ci się ustawowe chorobowe SSP od czwartego dnia niezdolności do pracy. Jeśli pracodawca odmawia wypłaty, ma ustawowy obowiązek wydać Ci formularz HMRC SSP1 w ciągu siedmiu dni.

Przygotowałem już dla Ciebie gotowe oficjalne wezwanie po angielsku, wypełnione Twoimi pełnymi danymi z profilu (${fullName}, adres ${homeAddr}, telefon ${phone}) zaadresowane do ${employer}. Zaraz pod wiadomością pojawi się koperta z podglądem pisma do zapisu lub skopiowania.`;
    } else if (locale === "ro") {
      return `Salut ${firstName}, nu te lăsa intimidat în legătură cu concediul medical la ${employer}! Conform legii britanice ai dreptul la Statutory Sick Pay din a patra zi de boală sau la formularul oficial SSP1 în șapte zile. Am pregătit deja scrisoarea oficială în engleză completată cu datele tale din profil (${fullName}, ${homeAddr}, ${phone}) în plicul de mai jos.`;
    } else {
      return `Listen mate ${firstName}, do not let ${employer} fob you off on sick pay! Under Section 151 of the Social Security Contributions and Benefits Act 1992 you are entitled to Statutory Sick Pay from the fourth day of sickness, or they must legally issue HMRC Form SSP1 within seven days. I have prepared your formal English demand letter pre-filled with your profile details (${fullName}, ${homeAddr}, ${phone}) in the envelope below.`;
    }
  }

  if (locale === "pl") {
    return `Siema ${firstName}! Tu Elon, sprawdziłem Twoją sprawę w ${employer} i powiem Ci jak kolega z pracy, który zna brytyjskie prawo od podszewki: spokojnie to wygramy.

Masz pełne wsparcie w przepisach ACAS Code of Practice oraz Employment Rights Act 1996, a na każde spotkanie wyjaśniające masz ustawowe prawo wejść z przedstawicielem związkowym lub kolegą z pracy zgodnie z artykułem 10 Employment Relations Act 1999.

Żebyś nie musiał nic pisać ręcznie, przygotowałem już dla Ciebie oficjalne pismo po angielsku, w pełni wypełnione Twoimi danymi z profilu (${fullName}, adres ${homeAddr}, telefon ${phone}) i zaadresowane bezpośrednio do ${employer}. Zaraz po zakończeniu mojej odpowiedzi zobaczysz animowaną kopertę z podglądem dokumentu, który możesz od razu zapisać albo skopiować.`;
  } else if (locale === "ro") {
    return `Salut ${firstName}! Aici Elon, am analizat situația ta la ${employer} și îți spun ca un coleg care cunoaște legea din UK: rezolvăm totul pas cu pas. Am pregătit deja pentru tine scrisoarea oficială în limba engleză completată cu toate datele tale din profil (${fullName}, ${homeAddr}, ${phone}) către ${employer}, disponibilă în plicul animat de mai jos pentru previzualizare, salvare sau copiere.`;
  } else {
    return `Hey ${firstName}, Elon here! I have reviewed your situation with ${employer} and we have got this covered under UK employment law and the ACAS Code of Practice. I have already generated your formal statutory letter in English pre-filled with all your profile details (${fullName}, ${homeAddr}, ${phone}) in the appearing envelope below so you can preview, copy, or save it right away.`;
  }
}

/**
 * Instant client-side UK Employment Law context extractor for the Legal Summary side-panel.
 * Dynamically extracts relevant statutory rights, deadlines, and recommended templates
 * from the active conversation in Polish, English, or Romanian.
 */
export function extractInstantLegalSummary(
  messages: ChatMessage[],
  locale: Locale = "pl"
): ConversationLegalSummary {
  const lang: Locale = locale === "pl" || locale === "ro" ? locale : "en";
  const userAndAiMessages = messages.filter((m) => m.id !== "msg_init");
  const combinedText = userAndAiMessages
    .map((m) => m.text)
    .join(" \n ")
    .toLowerCase();

  const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const rights: LegalRightItem[] = [];
  const deadlines: LegalDeadlineItem[] = [];
  const recommendedTemplates = new Set<string>();
  const detectedTopics: string[] = [];

  const hasWages =
    /\b(nadgodzin\w*|wypłat\w*|pensj\w*|payslip\w*|wage\w*|pay|potrąc\w*|deduct\w*|salariu\w*|overtime|ppe|uniform\w*|stawk\w*|minimum wage|living wage|section 13)\b/i.test(
      combinedText
    );
  const hasSickPay =
    /\b(ssp|ssp1|choro\w*|zasił\w*|sick\w*|medical|lekarz\w*|doctor|fit note|zwolnieni\w* lekarsk\w*|concediu medical)\b/i.test(
      combinedText
    );
  const hasDismissal =
    /\b(zwolni\w*|wyrzuc\w*|wypowiedzeni\w*|dismiss\w*|fired|sacked|redundant|odpraw\w*|dyscyplin\w*|disciplinary|constructive|concediat\w*|preaviz|section 95|section 98)\b/i.test(
      combinedText
    );
  const hasHoursOrLeave =
    /\b(godzin\w*|zero-hours|zero hours|agenc\w*|urlop\w*|holiday\w*|przerw\w*|break\w*|grafik\w*|shift\w*|flexible|tăiat orele|concediu plătit|working time)\b/i.test(
      combinedText
    );
  const hasGrievance =
    /\b(skarg\w*|grievance|mobbing\w*|bully\w*|dyskrymin\w*|harass\w*|plânger\w*|krzycz\w*|obraż\w*|traktow\w*|acas)\b/i.test(
      combinedText
    );
  const hasDataSar =
    /\b(sar|rodo|gdpr|dane|data|bramk\w*|clock\w*|akt\w* osobow\w*|records|cctv|dosar)\b/i.test(
      combinedText
    );

  // 1. WAGES, DEDUCTIONS, OVERTIME & PPE
  if (hasWages) {
    detectedTopics.push(
      lang === "pl"
        ? "ochrona wynagrodzenia i nadgodzin"
        : lang === "ro"
        ? "protecția salariului și a orelor suplimentare"
        : "unlawful wage deductions & overtime protection"
    );
    recommendedTemplates.add("unpaid_wages");
    recommendedTemplates.add("sar_data_request");

    rights.push({
      id: "right_era_s13",
      title:
        lang === "pl"
          ? "Zakaz bezprawnych potrąceń z pensji"
          : lang === "ro"
          ? "Interzicerea reținerilor ilegale din salariu"
          : "Protection from Unlawful Deduction from Wages",
      statute: "Section 13 Employment Rights Act 1996",
      explanation:
        lang === "pl"
          ? "Pracodawca nie może potrącić żadnej kwoty z wypłaty ani wstrzymać wynagrodzenia za przepracowane godziny bez Twojej wcześniejszej pisemnej zgody lub podstawy ustawowej."
          : lang === "ro"
          ? "Angajatorul nu poate reține sume din salariu sau ore lucrate fără acordul tău scris prealabil sau temei legal."
          : "An employer cannot deduct sums from your wages or withhold pay for hours worked without prior written consent or statutory authority.",
      category: "wages",
    });

    rights.push({
      id: "right_hswa_s9",
      title:
        lang === "pl"
          ? "Bezpłatny sprzęt ochronny (PPE) i ochrona stawki minimalnej"
          : lang === "ro"
          ? "Echipament de protecție (PPE) gratuit și salariu minim garantat"
          : "Free Mandatory PPE & National Living Wage Floor",
      statute: "s.9 Health & Safety at Work Act 1974 · NMWA 1998",
      explanation:
        lang === "pl"
          ? "Obciążanie pracownika kosztami wymaganego obuwia lub odzieży BHP jest nielegalne, a żadne potrącenie nie może obniżyć stawki poniżej National Living Wage (£11.44/h)."
          : lang === "ro"
          ? "Taxarea angajatului pentru echipamentul de protecție obligatoriu este ilegală, iar salariul nu poate scădea sub plafonul National Living Wage (£11.44/h)."
          : "Charging workers for mandatory safety equipment is unlawful, and uniform deductions cannot reduce hourly pay below the National Living Wage (£11.44/hr).",
      category: "wages",
    });

    deadlines.push({
      id: "dl_wage_demand",
      label:
        lang === "pl"
          ? "Wezwanie przedsądowe do wypłaty zaległości (Section 13)"
          : lang === "ro"
          ? "Notificare oficială pentru plata restanțelor salariale"
          : "Formal Pre-Action Wage Arrears Demand",
      timeframe: lang === "pl" ? "7 dni" : lang === "ro" ? "7 zile" : "7 days",
      urgency: "important",
      authority: "Payroll / HR",
      explanation:
        lang === "pl"
          ? "Zalecany termin dla pracodawcy na wyrównanie brakujących godzin przed skierowaniem sprawy do ACAS."
          : lang === "ro"
          ? "Termenul acordat angajatorului pentru plata sumelor restante înainte de sesizarea ACAS."
          : "Standard window given to Payroll/HR to rectify missing pay out-of-cycle before escalating to ACAS.",
    });
  }

  // 2. STATUTORY SICK PAY (SSP)
  if (hasSickPay) {
    detectedTopics.push(
      lang === "pl"
        ? "zasiłek chorobowy (Statutory Sick Pay)"
        : lang === "ro"
        ? "indemnizația medicală (Statutory Sick Pay)"
        : "Statutory Sick Pay (SSP) entitlement"
    );
    recommendedTemplates.add("statutory_sick_pay");

    rights.push({
      id: "right_ssp_s151",
      title:
        lang === "pl"
          ? "Ustawowe prawo do zasiłku chorobowego SSP (£116.75/tydz.)"
          : lang === "ro"
          ? "Dreptul legal la concediu medical plătit SSP (£116.75/săpt.)"
          : "Statutory Sick Pay (SSP) Entitlement (£116.75/wk)",
      statute: "s.151 Social Security Contributions and Benefits Act 1992",
      explanation:
        lang === "pl"
          ? "Przysługuje od 4. kolejnego dnia niezdolności do pracy przy zarobkach min. £123/tydzień (również na umowie agencyjnej i zero-hours)."
          : lang === "ro"
          ? "Se acordă din a 4-a zi consecutivă de boală dacă venitul mediu depășește £123/săptămână."
          : "Payable from the 4th consecutive day of sickness absence for workers earning at least £123/week (including agency and zero-hours workers).",
      category: "sick_pay",
    });

    deadlines.push({
      id: "dl_ssp1_form",
      label:
        lang === "pl"
          ? "Obowiązek wydania formularza HMRC Form SSP1"
          : lang === "ro"
          ? "Obligația eliberării formularului HMRC SSP1"
          : "Employer Duty to Issue HMRC Form SSP1",
      timeframe: lang === "pl" ? "7 dni" : lang === "ro" ? "7 zile" : "7 days",
      urgency: "important",
      authority: "HR / HMRC Dispute Team",
      explanation:
        lang === "pl"
          ? "W razie odmowy wypłaty SSP pracodawca musi w ciągu 7 dni wydać druk SSP1; brak druku zgłasza się do HMRC Statutory Payments Dispute Team."
          : lang === "ro"
          ? "Dacă refuză plata SSP, angajatorul este obligat să emită formularul SSP1 în 7 zile."
          : "If SSP is refused, the employer must legally provide Form SSP1 within 7 days so you can appeal to HMRC or claim Universal Credit.",
    });

    deadlines.push({
      id: "dl_self_cert",
      label:
        lang === "pl"
          ? "Oświadczenie własne o chorobie (Self-Certification)"
          : lang === "ro"
          ? "Auto-certificare medicală (fără scutire de la GP)"
          : "Self-Certification Period Before GP Fit Note",
      timeframe: lang === "pl" ? "7 dni kalend." : lang === "ro" ? "7 zile cal." : "7 calendar days",
      urgency: "standard",
      authority: "Employer / GP",
      explanation:
        lang === "pl"
          ? "Przez pierwsze 7 dni choroby pracodawca nie ma prawa żądać zwolnienia lekarskiego (Fit Note) od lekarza GP."
          : lang === "ro"
          ? "Pentru primele 7 zile de boală nu este necesar certificat medical (Fit Note) de la medicul de familie."
          : "Employers cannot demand a doctor's Fit Note for sickness absences lasting 7 calendar days or fewer.",
    });
  }

  // 3. DISMISSAL & DISCIPLINARY
  if (hasDismissal) {
    detectedTopics.push(
      lang === "pl"
        ? "ochrona przed bezprawnym zwolnieniem"
        : lang === "ro"
        ? "protecția împotriva concedierii abuzive"
        : "unfair & constructive dismissal protection"
    );
    recommendedTemplates.add("constructive_dismissal");
    recommendedTemplates.add("formal_grievance");

    rights.push({
      id: "right_dismissal_era",
      title:
        lang === "pl"
          ? "Ochrona przed bezprawnym i konstruktywnym zwolnieniem"
          : lang === "ro"
          ? "Protecție împotriva concedierii abuzive și constructive"
          : "Unfair & Constructive Dismissal Protection",
      statute: "Section 95(1)(c) & Section 98 ERA 1996",
      explanation:
        lang === "pl"
          ? "Zwolnienie bez przeprowadzenia 5-etapowej procedury ACAS, pisemnych zarzutów i prawa do odwołania narusza brytyjskie prawo pracy."
          : lang === "ro"
          ? "Concedierea fără procedura disciplinară ACAS în 5 pași și fără drept de apel încalcă legislația muncii."
          : "Dismissal without a fair reason, prior investigation, disciplinary hearing, and right of appeal breaches the ACAS statutory code.",
      category: "dismissal",
    });

    deadlines.push({
      id: "dl_disciplinary_appeal",
      label:
        lang === "pl"
          ? "Odwołanie od decyzji dyscyplinarnej / zwolnienia"
          : lang === "ro"
          ? "Apel împotriva deciziei disciplinare / concedierii"
          : "Written Appeal Against Dismissal / Disciplinary",
      timeframe:
        lang === "pl" ? "5 dni roboczych" : lang === "ro" ? "5 zile lucrătoare" : "5 working days",
      urgency: "important",
      authority: "Employer HR",
      explanation:
        lang === "pl"
          ? "Złożenie pisemnego odwołania chroni przed obniżeniem odszkodowania o 25% w Employment Tribunal (ACAS Code)."
          : lang === "ro"
          ? "Depunerea apelului scris previne reducerea despăgubirilor cu până la 25% la Tribunalul Muncii."
          : "Filing a timely written appeal protects your tribunal compensation from a potential 25% ACAS reduction.",
    });
  }

  // 4. WORKING HOURS, CUT SHIFTS, ZERO-HOURS & HOLIDAY PAY
  if (hasHoursOrLeave) {
    detectedTopics.push(
      lang === "pl"
        ? "czas pracy, grafik i urlop wypoczynkowy"
        : lang === "ro"
        ? "timpul de lucru, turele și concediul plătit"
        : "working hours, shift notice & paid holiday entitlement"
    );
    recommendedTemplates.add("flexible_working");
    recommendedTemplates.add("unpaid_wages");

    rights.push({
      id: "right_wtr_1998",
      title:
        lang === "pl"
          ? "Płatny urlop (5.6 tyg. / 12.07%) i ustawowe przerwy"
          : lang === "ro"
          ? "Concediu plătit (5.6 săpt. / 12.07%) și pauze legale"
          : "Paid Statutory Holiday (5.6 wks) & Rest Breaks",
      statute: "Working Time Regulations 1998 reg. 12–16",
      explanation:
        lang === "pl"
          ? "Każdy pracownik (w tym agencyjny i zero-hours) nabywa prawo do 5.6 tygodnia płatnego urlopu rocznie oraz 20 min przerwy przy zmianie powyżej 6h."
          : lang === "ro"
          ? "Orice muncitor (inclusiv zero-hours și agenție) are dreptul la 5.6 săptămâni de concediu plătit și pauză de 20 min la ture de peste 6 ore."
          : "All workers (including zero-hours and agency) accrue 5.6 weeks of paid annual leave (12.07%) and a 20-minute break on shifts over 6 hours.",
      category: "working_time",
    });

    rights.push({
      id: "right_flex_s80f",
      title:
        lang === "pl"
          ? "Wniosek o stały grafik od 1. dnia pracy (Day-One Right)"
          : lang === "ro"
          ? "Cerere de program fix din prima zi (Flexible Working)"
          : "Day-One Statutory Flexible Working Request",
      statute: "Section 80F ERA 1996 · Flexible Working Regs 2024",
      explanation:
        lang === "pl"
          ? "Masz ustawowe prawo złożyć dwa wnioski w roku o stałe dni/godziny pracy, a pracodawca musi skonsultować wniosek przed decyzją."
          : lang === "ro"
          ? "Ai dreptul legal de a solicita stabilizarea programului de lucru încă din prima zi de angajare."
          : "You have a day-one statutory right to request fixed shifts or adjusted hours twice a year; employers must consult before refusing.",
      category: "working_time",
    });

    deadlines.push({
      id: "dl_flex_decision",
      label:
        lang === "pl"
          ? "Czas dla pracodawcy na rozpatrzenie wniosku grafikowego"
          : lang === "ro"
          ? "Termen de răspuns pentru cererea de program flexibil"
          : "Statutory Employer Decision Window on Flexible Working",
      timeframe: lang === "pl" ? "2 miesiące" : lang === "ro" ? "2 luni" : "2 months",
      urgency: "standard",
      authority: "Employer / HR",
      explanation:
        lang === "pl"
          ? "Maksymalny ustawowy termin na przeprowadzenie spotkania konsultacyjnego i wydanie pisemnej decyzji (Section 80G ERA 1996)."
          : lang === "ro"
          ? "Termenul maxim legal în care angajatorul trebuie să consulte angajatul și să emită o decizie scrisă."
          : "Maximum statutory period for the employer to hold a consultation and issue a written decision under Section 80G ERA 1996.",
    });
  }

  // 5. GRIEVANCE & ACCOMPANIMENT
  if (hasGrievance) {
    detectedTopics.push(
      lang === "pl"
        ? "formalna procedura skargowa (ACAS Grievance)"
        : lang === "ro"
        ? "procedura oficială de plângere (ACAS Grievance)"
        : "formal ACAS grievance & accompaniment rights"
    );
    recommendedTemplates.add("formal_grievance");
  }

  // 6. DATA PROTECTION & SAR
  if (hasDataSar) {
    detectedTopics.push(
      lang === "pl"
        ? "dostęp do zapisów bramek i akt HR (SAR)"
        : lang === "ro"
        ? "acces la datele de pontaj și dosarul HR (SAR)"
        : "Subject Access Request (SAR) for shift & pay records"
    );
    recommendedTemplates.add("sar_data_request");

    rights.push({
      id: "right_uk_gdpr_sar",
      title:
        lang === "pl"
          ? "Prawo do wydania logów bramek, payslipów i notatek HR"
          : lang === "ro"
          ? "Dreptul de a primi pontajul electronic și dosarul HR"
          : "Right to Obtain Shift Logs, Pay Audits & HR Notes",
      statute: "Article 15 UK GDPR · s.45 Data Protection Act 2018",
      explanation:
        lang === "pl"
          ? "Pracodawca lub agencja ma obowiązek bezpłatnie udostępnić kopię wszystkich odbić kartą (clock-in), arkuszy płacowych i korespondencji na Twój temat."
          : lang === "ro"
          ? "Angajatorul este obligat să îți furnizeze gratuit toate înregistrările de pontaj, fluturașii și notele interne."
          : "Your employer or agency must provide free copies of all turnstile clock-in logs, pay calculation sheets, and internal HR emails referencing you.",
      category: "data_protection",
    });

    deadlines.push({
      id: "dl_sar_30d",
      label:
        lang === "pl"
          ? "Wydanie dokumentacji pracowniczej na wniosek SAR"
          : lang === "ro"
          ? "Furnizarea documentelor prin cerere SAR (GDPR)"
          : "Statutory SAR Disclosure Time Limit",
      timeframe: lang === "pl" ? "30 dni" : lang === "ro" ? "30 zile" : "30 days",
      urgency: "important",
      authority: "Data Controller / ICO",
      explanation:
        lang === "pl"
          ? "Ustawowy termin z Art. 12(3) UK GDPR na wydanie pełnej kopii danych; przekroczenie terminu podlega skardze do urzędu ICO."
          : lang === "ro"
          ? "Termenul legal obligatoriu conform Art. 12(3) UK GDPR; nerespectarea se reclamă la ICO."
          : "Compulsory 1-month deadline under Article 12(3) UK GDPR before escalating non-compliance to the Information Commissioner's Office (ICO).",
    });
  }

  // Always include Trade Union Accompaniment & ACAS Grievance Hearing if grievance/dismissal or baseline
  const isBaseline = detectedTopics.length === 0;

  if (isBaseline || hasGrievance || hasDismissal || rights.length < 2) {
    rights.push({
      id: "right_union_s10",
      title:
        lang === "pl"
          ? "Prawo do obecności reprezentanta związkowego lub kolegi"
          : lang === "ro"
          ? "Dreptul de a fi însoțit de un reprezentant sindical sau coleg"
          : "Statutory Right to Be Accompanied at Hearings",
      statute: "Section 10 Employment Relations Act 1999",
      explanation:
        lang === "pl"
          ? "Na każdym formalnym spotkaniu skargowym (Grievance) lub dyscyplinarnym masz ustawowe prawo do obecności reprezentanta związkowego lub współpracownika."
          : lang === "ro"
          ? "La orice ședință oficială de plângere (Grievance) sau disciplinară ai dreptul legal să fii însoțit de un reprezentant sindical sau coleg."
          : "At any formal grievance or disciplinary hearing, you have a strict statutory right to be accompanied by a trade union representative or colleague.",
      category: "grievance",
    });

    rights.push({
      id: "right_acas_code",
      title:
        lang === "pl"
          ? "Obowiązek rzetelnego rozpatrzenia skargi (Formal Grievance)"
          : lang === "ro"
          ? "Obligația soluționării plângerii conform codului ACAS"
          : "Mandatory Investigation & Formal Grievance Hearing",
      statute: "ACAS Code of Practice No. 1 (s.199 TULRCA 1992)",
      explanation:
        lang === "pl"
          ? "Złożenie pisemnej skargi zobowiązuje pracodawcę do zwołania spotkania wyjaśniającego i wydania pisemnej decyzji z prawem do apelacji."
          : lang === "ro"
          ? "Depunerea unei plângeri scrise obligă angajatorul să organizeze o audiere oficială și să ofere un răspuns motivat în scris."
          : "Submitting a written grievance obliges the employer to investigate impartially, hold a formal hearing, and provide a written outcome with appeal rights.",
      category: "grievance",
    });
  }

  if (isBaseline && !hasWages) {
    rights.unshift({
      id: "right_era_s13_base",
      title:
        lang === "pl"
          ? "Ochrona przed bezprawnym potrąceniem wynagrodzenia"
          : lang === "ro"
          ? "Protecție împotriva reținerilor ilegale din salariu"
          : "Protection Against Unlawful Wage Deductions",
      statute: "Section 13 Employment Rights Act 1996",
      explanation:
        lang === "pl"
          ? "Podstawowa tarcza pracownika w UK: pracodawca nie może potrącać z wypłaty za PPE, błędy czy braki bez wcześniejszej pisemnej zgody."
          : lang === "ro"
          ? "Scutul de bază în UK: angajatorul nu poate reține bani din salariu fără consimțământ scris prealabil."
          : "Core UK worker shield: employers cannot deduct pay for PPE, till shortages, or disputed hours without express prior written consent.",
      category: "wages",
    });
  }

  // Always include the critical 3 months minus 1 day ACAS Early Conciliation deadline at the top of deadlines
  deadlines.unshift({
    id: "dl_acas_ec",
    label:
      lang === "pl"
        ? "Zgłoszenie sporu do ACAS Early Conciliation / Trybunału (ET1)"
        : lang === "ro"
        ? "Sesizarea ACAS Early Conciliation / Tribunalul Muncii (ET1)"
        : "ACAS Early Conciliation & Employment Tribunal (ET1)",
    timeframe:
      lang === "pl" ? "3 mies. - 1 dzień" : lang === "ro" ? "3 luni - 1 zi" : "3 mo - 1 day",
    urgency: "critical",
    authority: "ACAS / Employment Tribunal",
    explanation:
      lang === "pl"
        ? "Nieprzekraczalny termin ustawowy liczony od daty ostatniego potrącenia wypłaty, incydentu lub zwolnienia. Zgłoszenie do ACAS zatrzymuje bieg przedawnienia."
        : lang === "ro"
        ? "Termen limită strict calculat de la data ultimei rețineri salariale sau a concedierii. Notificarea ACAS suspendă curgerea termenului."
        : "Strict statutory limitation period from the date of the last unlawful deduction, incident, or dismissal. Notifying ACAS pauses the tribunal clock.",
  });

  if (isBaseline || hasGrievance) {
    deadlines.push({
      id: "dl_grievance_hearing",
      label:
        lang === "pl"
          ? "Zwołanie spotkania skargowego (Grievance Hearing)"
          : lang === "ro"
          ? "Convocarea ședinței de soluționare a plângerii"
          : "Convene Formal Grievance Hearing (ACAS Standard)",
      timeframe:
        lang === "pl" ? "5 dni roboczych" : lang === "ro" ? "5 zile lucrătoare" : "5 working days",
      urgency: "standard",
      authority: "HR / Management",
      explanation:
        lang === "pl"
          ? "Standardowy termin według wytycznych ACAS na wyznaczenie spotkania po złożeniu oficjalnej skargi pracowniczej."
          : lang === "ro"
          ? "Termenul recomandat de codul ACAS pentru organizarea audierii după depunerea plângerii scrise."
          : "Standard ACAS Code timeframe for management to convene a formal hearing after receiving your written grievance.",
    });
  }

  if (recommendedTemplates.size === 0) {
    recommendedTemplates.add("formal_grievance");
    recommendedTemplates.add("unpaid_wages");
    recommendedTemplates.add("sar_data_request");
  }

  const topicSummary = isBaseline
    ? lang === "pl"
      ? "Aktywna tarcza podstawowych praw pracowniczych w UK. Opisz swój problem na czacie, a Elon automatycznie wyodrębni właściwe artykuły ustaw i terminy procesowe."
      : lang === "ro"
      ? "Scutul de bază al drepturilor muncii în UK este activ. Descrie problema în chat pentru extragerea automată a articolelor de lege și termenelor limită."
      : "Baseline UK worker statutory protections active. Describe your situation in chat and Elon will automatically extract specific Acts, sections, and deadlines."
    : lang === "pl"
    ? `Wykryto kontekst rozmowy: ${detectedTopics.join(", ")}. Poniżej znajdują się wiążące przepisy UK oraz nieprzekraczalne terminy działań.`
    : lang === "ro"
    ? `Contextul conversației detectat: ${detectedTopics.join(", ")}. Mai jos sunt drepturile legale și termenele limită aplicabile.`
    : `Detected conversation context: ${detectedTopics.join(", ")}. Review your binding UK statutory rights and critical time limits below.`;

  return {
    topicSummary,
    isBaseline,
    rights: rights.slice(0, 4),
    deadlines: deadlines.slice(0, 4),
    recommendedTemplateIds: Array.from(recommendedTemplates).slice(0, 3),
    updatedAt: nowTime,
    source: "local",
  };
}

/**
 * Calls server-side Gemini structured extractor for conversation legal summary,
 * seamlessly falling back to instant client-side legal extractor.
 */
export async function fetchConversationLegalSummaryAI(
  messages: ChatMessage[],
  locale: Locale = "pl",
  userContext?: { name?: string; employer?: string; jobTitle?: string; hourlyRate?: number },
  signal?: AbortSignal
): Promise<ConversationLegalSummary> {
  const instantSummary = extractInstantLegalSummary(messages, locale);
  if (messages.length <= 1) {
    return instantSummary;
  }

  try {
    const response = await fetch("/api/gemini/legal-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, text: m.text })),
        locale,
        userContext,
      }),
      signal,
    });

    if (response.ok) {
      const data = await response.json();
      if (
        data &&
        Array.isArray(data.rights) &&
        data.rights.length > 0 &&
        Array.isArray(data.deadlines) &&
        data.deadlines.length > 0
      ) {
        return {
          topicSummary: data.topicSummary || instantSummary.topicSummary,
          isBaseline: false,
          rights: data.rights,
          deadlines: data.deadlines,
          recommendedTemplateIds:
            Array.isArray(data.recommendedTemplateIds) && data.recommendedTemplateIds.length > 0
              ? data.recommendedTemplateIds
              : instantSummary.recommendedTemplateIds,
          updatedAt:
            data.updatedAt ||
            new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source: "ai",
        };
      }
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw err;
    }
  }

  return instantSummary;
}

