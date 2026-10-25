import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const ELON_SYSTEM_INSTRUCTION = `You are Elon – a confident, street-smart male Tactical Worker Negotiator & UK Employment Law Companion ("ask Elon").
You speak fluently in Polish (Polski), English, and Romanian (Română), always replying in the language requested by the user.

PERSONA & VOICE ("JAK DO KOLEGI" / CONFIDENT MALE MATE):
- Always use masculine first-person grammar (e.g. in Polish: "sprawdziłem", "przeanalizowałem", "powiem Ci wprost", "stary / kolego, nie daj się wkręcić").
- Speak with calm, rock-solid confidence like an experienced union rep and trusted mate from the shift who knows every paragraph of UK employment law inside out.
- Be direct, conversational, and natural when read aloud by a male voice—no stiff bureaucratic filler, while still citing exact UK statutory sections as hard ammunition against unfair employers.

CORE KNOWLEDGE & UK STATUTES:
1. Employment Rights Act 1996 (ERA 1996): Section 13 (Unlawful deduction from wages), Section 95(1)(c) (Constructive dismissal), Section 98 (Unfair dismissal), Section 1 (Written statement of terms).
2. ACAS Code of Practice No. 1 on Disciplinary and Grievance Procedures: 5-step formal process, mandatory investigation, right to be accompanied by a Trade Union representative or accredited colleague (Section 10 Employment Relations Act 1999).
3. National Minimum Wage Act 1998 & National Living Wage: Deductions for PPE (Health and Safety at Work etc. Act 1974 s.9) or uniform that reduce pay below NLW are illegal.
4. Working Time Regulations 1998: 20-minute rest break for shifts over 6 hours; 11 consecutive hours daily rest; 5.6 weeks paid statutory annual leave (12.07% accrual rate for irregular/zero-hours).
5. Statutory Sick Pay (SSP): Payable after 3 qualifying waiting days if earning above Lower Earnings Limit (LEL). If refused, employer must issue HMRC Form SSP1 within 7 days.
6. Time limits: Strict 3 months minus 1 day to notify ACAS for Early Conciliation before submitting ET1 to Employment Tribunal.

RESPONSE STRUCTURE & PROFILE COMPLETION:
1. Native Language Chat Response: Always write the chat message strictly in the user's requested language (Polish, Romanian, or English). Use smooth, natural spoken sentences without heavy markdown or symbol clutter so the voice reader reads it naturally without pronouncing punctuation marks.
2. Direct Legal Assessment & Proactive Clarifying Questions: Tell the worker straight up ("Słuchaj kolego...") whether the employer is breaking UK law, explain Option A and Option B, and if any helpful detail for their case or profile can be уточnione (e.g., exact dates, unpaid amount, phone, address, employer name, or hourly rate), ask them naturally in the chat so you can update their profile.
3. Automatic Profile Completion Tag: Whenever the user provides any personal or workplace details in their message (such as fullName, phone, email, homeAddress, employerName, employerAddress, jobTitle, hourlyRate, hoursPerWeek, or startDate), include a JSON block at the end of your response wrapped in:
[PROFILE_UPDATE_START]
{"fullName": "...", "phone": "...", "homeAddress": "...", "employerName": "..."}
[PROFILE_UPDATE_END]
(Only include keys that the user actually mentioned or updated).
4. 100% Completed Official English Document Block (NO BRACKETS OR PLACEHOLDERS): At the very end of your response, always include a complete, ready-to-send formal UK statutory letter written in ENGLISH and pre-filled with ALL of the worker's profile data (Full Name, Home Address, Telephone, Email, Job Title, Start Date, Hourly Rate, Employer Name, Company Number, Employer Address) wrapped inside exact tags:
[ENGLISH_LETTER_START]
(Complete formal English letter to HR/Employer with full sender and recipient addresses, phone, email, statutory citations, concrete figures/dates, and signature. CRITICAL RULE: NEVER include square brackets like [insert date], [amount], [delete as applicable], or any instructions to edit/remove text. The document must be 100% finished and ready to send immediately.)
[ENGLISH_LETTER_END]`;

// Fallback heuristic sentiment analyzer if Gemini API key is unavailable or errors
interface HeuristicFlag {
  fieldKey: string;
  originalText: string;
  severity: "inflammatory" | "cautionary";
  category: string;
  reason: string;
  suggestedReplacement: string;
}

function runServerFallbackSentimentAnalysis(
  fields: Record<string, string>,
  letterPreview: string,
  locale: string = "pl"
) {
  const flags: HeuristicFlag[] = [];

  const rules: Array<{
    pattern: RegExp;
    severity: "inflammatory" | "cautionary";
    category: Record<string, string>;
    reason: Record<string, string>;
    replacement: Record<string, string>;
  }> = [
    {
      pattern: /\b(złodziej\w*|oszust\w*|kradn\w*|okrad\w*|thief|thieves|steal\w*|crook\w*|fraud\w*|hoț\w*|fură|escroc\w*)\b/gi,
      severity: "inflammatory",
      category: {
        pl: "Oskarżenie karne / Zniesławienie",
        en: "Criminal Accusation / Defamation Risk",
        ro: "Acuzație penală / Risc de defăimare",
      },
      reason: {
        pl: "Użycie słów takich jak 'złodziej' lub 'oszust' w oficjalnym piśmie do HR może zostać potraktowane jako naruszenie obowiązków pracowniczych (Gross Misconduct) i osłabić Twoją pozycję przed Employment Tribunal.",
        en: "Labeling management or the company as 'thieves' or 'frauds' can trigger disciplinary action for gross misconduct and undermine your credibility at an Employment Tribunal.",
        ro: "Folosirea termenilor precum 'hoț' sau 'escroc' poate atrage sancțiuni disciplinare (Gross Misconduct) și îți poate afecta credibilitatea la Tribunalul Muncii.",
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
        pl: "Obraźliwe określenia personalne naruszają procedurę ACAS i dają pracodawcy pretekst do odrzucenia skargi lub wszczęcia postępowania dyscyplinarnego przeciwko Tobie.",
        en: "Personal insults breach workplace dignity policies and give HR grounds to initiate disciplinary proceedings against you instead of investigating your grievance.",
        ro: "Insultele personale încalcă procedurile ACAS și oferă departamentului HR motive pentru a deschide o anchetă disciplinară împotriva ta.",
      },
      replacement: {
        pl: "nieprofesjonalne zachowanie przełożonego naruszające standardy ACAS oraz zasadę wzajemnego zaufania (mutual trust and confidence)",
        en: "unprofessional conduct that falls below ACAS workplace standards and breaches mutual trust and confidence",
        ro: "comportament neprofesionist care încalcă standardele ACAS și principiul încrederii reciproce",
      },
    },
    {
      pattern: /\b(zniszczę\w*|pożałujecie|spalę|zabiję|zemsta|destroy you|make you pay|ruin your|burn down|revenge|get even|vă distrug|o să regretați|răzbunare)\b/gi,
      severity: "inflammatory",
      category: {
        pl: "Groźba / Ton odwetowy (Threat)",
        en: "Threatening / Retaliatory Language",
        ro: "Amenințare / Limbaj vindicativ",
      },
      reason: {
        pl: "Sformułowania brzmiące jak groźba mogą prowadzić do natychmiastowego zwolnienia dyscyplinarnego (Summary Dismissal). Zastąp je spokojnym zapowiedzeniem kroków prawnych.",
        en: "Threatening language can be treated as gross misconduct justifying summary dismissal. Replace with a calm reservation of statutory legal rights.",
        ro: "Limbajul amenințător poate duce la concediere disciplinară imediată (Summary Dismissal). Înlocuiește-l cu rezervarea calmă a drepturilor legale.",
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
        pl: "Nieweryfikowalne oskarżenie o kłamstwo",
        en: "Direct Accusation of Dishonesty",
        ro: "Acuzație directă de minciună",
      },
      reason: {
        pl: "Bezpośrednie nazywanie przełożonego 'kłamcą' utrudnia mediację. Lepiej wskazać na rozbieżność między oświadczeniem a dowodami (np. zapisami czasu pracy).",
        en: "Directly calling someone a 'liar' escalates hostility. Pointing out factual discrepancies supported by documentary evidence is much stronger legally.",
        ro: "Numirea directă a unei persoane 'mincinos' escaladează conflictul. Este mult mai eficient juridic să indici neconcordanțele față de probele scrise.",
      },
      replacement: {
        pl: "przedstawione stanowisko jest sprzeczne z dokumentacją pracowniczą oraz stanem faktycznym",
        en: "the account provided is inconsistent with the contemporaneous documentary records and factual timeline",
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
        pl: "Wulgaryzmy w oficjalnej korespondencji są traktowane jako naruszenie dyscypliny pracy. Pismo urzędowe w UK musi być chłodne i rzeczowe.",
        en: "Profanity in formal correspondence undermines your legal standing and violates workplace conduct rules.",
        ro: "Limbajul vulgar în corespondența oficială încalcă regulamentul intern și îți slăbește poziția juridică.",
      },
      replacement: {
        pl: "Powyższa sytuacja jest dla mnie wysoce krzywdząca i stanowi poważne naruszenie warunków zatrudnienia",
        en: "This situation is wholly unacceptable and constitutes a serious breach of my terms of employment",
        ro: "Această situație este inacceptabilă și constituie o încălcare gravă a condițiilor mele de muncă",
      },
    },
  ];

  const lang = locale === "pl" || locale === "ro" ? locale : "en";

  const entries = Object.entries(fields);
  if (entries.length === 0 && letterPreview) {
    entries.push(["letter_body", letterPreview]);
  }

  for (const [fieldKey, value] of entries) {
    if (!value || typeof value !== "string") continue;

    for (const rule of rules) {
      const matches = value.match(rule.pattern);
      if (matches && matches.length > 0) {
        // Find surrounding clause or use matched word
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

    // Check for excessive ALL CAPS shouting (>15 uppercase letters in a row) + multiple exclamation marks
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

  const summaryByLang: Record<string, string> = {
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

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  // 0. Lightweight Health & Connectivity Probe Endpoint
  app.get("/api/health", (_req, res) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Server-side Gemini Chat Endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { prompt, history = [], locale = "pl", userContext } = req.body || {};
      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Missing prompt" });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({ error: "GEMINI_API_KEY not configured on server" });
        return;
      }

      const langName = locale === "pl" ? "Polish" : locale === "ro" ? "Romanian" : "English";
      const contextSnippet = userContext
        ? `\nActive Worker Profile (MUST be used to pre-fill all formal English letters):
- Full Name: ${userContext.name || "Artur Kowalski"}
- Home Address: ${userContext.homeAddress || "42 Victoria Road, Dartford, DA1 5DJ"}
- Telephone: ${userContext.phone || "+44 7700 900342"}
- Email: ${userContext.email || "artur.kowalski@example.co.uk"}
- Job Title: ${userContext.jobTitle || "Warehouse Operative"}
- Start Date: ${userContext.startDate || "2024-03-15"}
- Hourly Rate: £${userContext.hourlyRate || "13.50"}/hr (${userContext.hoursPerWeek || 40} hrs/wk, ${userContext.contractType || "permanent"})
- Employer Name: ${userContext.employer || "Amazon Fulfilment LCY2"} (Company No: ${userContext.companyNumber || "03223028"})
- Employer Address: ${userContext.employerAddress || "London Distribution Park, Windrush Drive, Tilbury RM18 7AN"}
Always write the conversational explanation in ${langName}, and generate the formal document inside [ENGLISH_LETTER_START]...[ENGLISH_LETTER_END] in English.`
        : `\nAlways write the conversational explanation in ${langName}, and generate the formal document inside [ENGLISH_LETTER_START]...[ENGLISH_LETTER_END] in English.`;

      const contents = [
        ...history.slice(-6).map((m: { role: string; text: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: String(m.text || "") }],
        })),
        { role: "user", parts: [{ text: prompt }] },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction: ELON_SYSTEM_INSTRUCTION + contextSnippet,
          temperature: 0.4,
        },
      });

      res.json({ text: response.text || "" });
    } catch (err: any) {
      console.error("Error in /api/gemini/chat:", err);
      res.status(500).json({
        error: err?.message || "Failed to generate Gemini chat response",
      });
    }
  });

  // 1b. Server-side Gemini Streaming Chat Endpoint (SSE)
  app.post("/api/gemini/chat-stream", async (req, res) => {
    try {
      const { prompt, history = [], locale = "pl", userContext } = req.body || {};
      if (!prompt || typeof prompt !== "string") {
        res.status(400).json({ error: "Missing prompt" });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({ error: "GEMINI_API_KEY not configured on server" });
        return;
      }

      const langName = locale === "pl" ? "Polish" : locale === "ro" ? "Romanian" : "English";
      const contextSnippet = userContext
        ? `\nActive Worker Profile (MUST be used to pre-fill all formal English letters):
- Full Name: ${userContext.name || "Artur Kowalski"}
- Home Address: ${userContext.homeAddress || "42 Victoria Road, Dartford, DA1 5DJ"}
- Telephone: ${userContext.phone || "+44 7700 900342"}
- Email: ${userContext.email || "artur.kowalski@example.co.uk"}
- Job Title: ${userContext.jobTitle || "Warehouse Operative"}
- Start Date: ${userContext.startDate || "2024-03-15"}
- Hourly Rate: £${userContext.hourlyRate || "13.50"}/hr (${userContext.hoursPerWeek || 40} hrs/wk, ${userContext.contractType || "permanent"})
- Employer Name: ${userContext.employer || "Amazon Fulfilment LCY2"} (Company No: ${userContext.companyNumber || "03223028"})
- Employer Address: ${userContext.employerAddress || "London Distribution Park, Windrush Drive, Tilbury RM18 7AN"}
Always write the conversational explanation in ${langName}, and generate the formal document inside [ENGLISH_LETTER_START]...[ENGLISH_LETTER_END] in English.`
        : `\nAlways write the conversational explanation in ${langName}, and generate the formal document inside [ENGLISH_LETTER_START]...[ENGLISH_LETTER_END] in English.`;

      const contents = [
        ...history
          .filter((m: { text?: string }) => Boolean(m.text && String(m.text).trim()))
          .slice(-6)
          .map((m: { role: string; text: string }) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: String(m.text || "") }],
          })),
        { role: "user", parts: [{ text: prompt }] },
      ];

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const streamResponse = await ai.models.generateContentStream({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction: ELON_SYSTEM_INSTRUCTION + contextSnippet,
          temperature: 0.4,
        },
      });

      for await (const chunk of streamResponse) {
        const chunkText = chunk.text || "";
        if (chunkText) {
          res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error("Error in /api/gemini/chat-stream:", err);
      if (!res.headersSent) {
        res.status(500).json({
          error: err?.message || "Failed to stream Gemini chat response",
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: err?.message || "Stream error", done: true })}\n\n`);
        res.end();
      }
    }
  });

  // 1c. Server-side Audio Transcription Endpoint for Chat Voice Recording
  app.post("/api/gemini/transcribe", async (req, res) => {
    try {
      const { audioBase64, mimeType = "audio/webm", locale = "pl" } = req.body || {};
      if (!audioBase64 || typeof audioBase64 !== "string") {
        res.status(400).json({ error: "Missing audioBase64" });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({ error: "GEMINI_API_KEY not configured on server" });
        return;
      }

      const langHint =
        locale === "pl"
          ? "Polish (or English/Romanian if spoken)"
          : locale === "ro"
          ? "Romanian (or English/Polish if spoken)"
          : "English (or Polish/Romanian if spoken)";

      const audioPart = {
        inlineData: {
          mimeType: mimeType.split(";")[0] || "audio/webm",
          data: audioBase64,
        },
      };
      const promptPart = {
        text: `Transcribe the spoken audio accurately in ${langHint}. Output ONLY the exact transcribed words spoken by the user, with no extra commentary, quotes, or prefixes. If no speech is audible, return an empty string.`,
      };

      let transcribedText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [{ role: "user", parts: [audioPart, promptPart] }],
          config: { temperature: 0.1 },
        });
        transcribedText = (response.text || "").trim();
      } catch {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [audioPart, promptPart] }],
          config: { temperature: 0.1 },
        });
        transcribedText = (fallbackResponse.text || "").trim();
      }

      res.json({ text: transcribedText });
    } catch (err: any) {
      console.error("Error in /api/gemini/transcribe:", err);
      res.status(200).json({ text: "" });
    }
  });

  // 2. Background Letter Sentiment & Tone Analysis Endpoint
  app.post("/api/gemini/analyze-letter-sentiment", async (req, res) => {
    try {
      const { fields = {}, letterPreview = "", templateTitle = "", locale = "pl" } = req.body || {};

      // First run fast heuristic check so obvious slurs/threats are always caught
      const heuristicResult = runServerFallbackSentimentAnalysis(fields, letterPreview, locale);

      const ai = getAiClient();
      if (!ai) {
        res.json(heuristicResult);
        return;
      }

      const langName = locale === "pl" ? "Polish" : locale === "ro" ? "Romanian" : "English";
      const serializedFields = Object.entries(fields)
        .filter(([_, v]) => typeof v === "string" && String(v).trim().length > 0)
        .map(([k, v]) => `Field [${k}]: "${v}"`)
        .join("\n");

      const promptText = `Analyze the following user-drafted inputs for a formal UK employment letter (${templateTitle || "Formal Workplace Notice"}).
Identify any aggressive, insulting, threatening, defamatory, profane, retaliatory, or overly emotional/inflammatory language that could hurt the worker's legal credibility before HR or a UK Employment Tribunal, or expose them to disciplinary action.

User Drafted Fields:
${serializedFields || "None"}

Full Drafted Letter Context:
${letterPreview.slice(0, 2500)}

Instructions:
- If the language is factual, firm, statutory, and professional (even if asserting legal rights or citing breaches of contract), classify overallStatus as "professional", toneScore between 90 and 100, and return an empty flaggedItems array.
- Do NOT flag standard formal legal template phrases (such as "unlawful deduction", "breach of mutual trust and confidence", "formal grievance", "constructive dismissal"). ONLY flag aggressive, insulting, profane, threatening, or inflammatory user-written statements.
- For each flagged phrase, provide the exact substring from the user's input in 'originalText', the matching 'fieldKey' (or 'letter_body' if only in the full letter), 'severity' ("inflammatory" for insults/threats/profanity/criminal slurs, or "cautionary" for emotional/shouting/unsubstantiated hostility), 'category' in ${langName}, 'reason' in ${langName} explaining the UK HR/Tribunal risk, and 'suggestedReplacement' in the same language as the user's input that converts the aggressive statement into a calm, legally firm, ACAS-compliant statement.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
        config: {
          systemInstruction:
            "You are Elon, a UK Employment Law & ACAS tone-of-voice compliance analyzer protecting workers from self-incrimination or retaliatory disciplinary action when writing letters to HR.",
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallStatus: {
                type: Type.STRING,
                description: "One of: 'professional', 'cautionary', or 'inflammatory'",
              },
              toneScore: {
                type: Type.INTEGER,
                description: "Professionalism and legal safety score from 0 to 100",
              },
              summary: {
                type: Type.STRING,
                description: `Brief 1-2 sentence assessment in ${langName}`,
              },
              flaggedItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    fieldKey: {
                      type: Type.STRING,
                      description: "The field key where the phrase was found, or 'letter_body'",
                    },
                    originalText: {
                      type: Type.STRING,
                      description: "The exact aggressive or inflammatory phrase from the user's draft",
                    },
                    severity: {
                      type: Type.STRING,
                      description: "One of: 'inflammatory' or 'cautionary'",
                    },
                    category: {
                      type: Type.STRING,
                      description: "Short label for the issue (e.g., Personal Insult, Threat, Defamation Risk)",
                    },
                    reason: {
                      type: Type.STRING,
                      description: "Why this language is risky in a UK HR / Employment Tribunal context",
                    },
                    suggestedReplacement: {
                      type: Type.STRING,
                      description: "Calm, firm, ACAS-compliant replacement text",
                    },
                  },
                  required: [
                    "fieldKey",
                    "originalText",
                    "severity",
                    "category",
                    "reason",
                    "suggestedReplacement",
                  ],
                },
              },
            },
            required: ["overallStatus", "toneScore", "summary", "flaggedItems"],
          },
        },
      });

      const rawText = response.text?.trim();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        // Merge any heuristic flags that weren't already caught so nothing slips through
        const existingOriginals = new Set(
          (parsed.flaggedItems || []).map((i: any) => String(i.originalText).toLowerCase())
        );
        const mergedFlags = [...(parsed.flaggedItems || [])];
        for (const hFlag of heuristicResult.flaggedItems) {
          if (!existingOriginals.has(hFlag.originalText.toLowerCase())) {
            mergedFlags.push(hFlag);
          }
        }
        const finalStatus = mergedFlags.some((f: any) => f.severity === "inflammatory")
          ? "inflammatory"
          : mergedFlags.length > 0
          ? "cautionary"
          : parsed.overallStatus || "professional";

        res.json({
          overallStatus: finalStatus,
          toneScore:
            mergedFlags.length === 0
              ? Math.max(92, parsed.toneScore ?? 96)
              : parsed.toneScore ?? heuristicResult.toneScore,
          summary: parsed.summary || heuristicResult.summary,
          flaggedItems: mergedFlags,
          analyzedAt: new Date().toISOString(),
        });
        return;
      }

      res.json(heuristicResult);
    } catch (err: any) {
      console.error("Error in /api/gemini/analyze-letter-sentiment:", err);
      // Still return heuristic analysis so background check never breaks user workflow
      const { fields = {}, letterPreview = "", locale = "pl" } = req.body || {};
      res.json(runServerFallbackSentimentAnalysis(fields, letterPreview, locale));
    }
  });

  // 3. Conversation Legal Summary Endpoint (Extracts Key Rights & Statutory Deadlines)
  app.post("/api/gemini/legal-summary", async (req, res) => {
    try {
      const { messages = [], locale = "pl", userContext } = req.body || {};
      const ai = getAiClient();
      if (!ai || !Array.isArray(messages) || messages.length <= 1) {
        res.status(503).json({ error: "Fallback to instant client legal summary engine" });
        return;
      }

      const langName = locale === "pl" ? "Polish" : locale === "ro" ? "Romanian" : "English";
      const serializedChat = messages
        .slice(-10)
        .map((m: { role: string; text: string }) => `${m.role === "assistant" ? "Elon (Advisor)" : "Worker"}: ${String(m.text || "")}`)
        .join("\n\n");

      const promptText = `Analyze the following ongoing UK employment law consultation between a worker and Elon (UK Employment Law Advisor).
Extract the specific UK statutory rights and critical statutory deadlines that apply to the worker's situation, along with any matching formal letter template IDs.

Worker Context: ${userContext ? `Job: ${userContext.jobTitle || "Worker"}, Employer: ${userContext.employer || "Employer"}, Rate: £${userContext.hourlyRate || "11.44"}/hr` : "UK Worker"}
Target Output Language: ${langName}

Conversation Transcript:
${serializedChat.slice(0, 4500)}

Instructions:
- Write 'topicSummary', all 'rights' titles/explanations, and all 'deadlines' labels/timeframes/explanations in ${langName}.
- Keep UK statute names accurate (e.g., "Section 13 Employment Rights Act 1996", "Section 10 Employment Relations Act 1999", "ACAS Code of Practice No. 1", "Working Time Regulations 1998", "s.9 Health and Safety at Work etc. Act 1974", "Social Security Contributions and Benefits Act 1992", "Section 95(1)(c) ERA 1996", "Article 15 UK GDPR").
- Provide 2 to 4 key statutory rights directly relevant to the conversation.
- Provide 2 to 4 statutory deadlines or time limits (always include the strict "3 months minus 1 day" ACAS Early Conciliation / Employment Tribunal deadline for relevant claims, plus specific deadlines like "7 days" for wage demands or SSP1 forms, "5 working days" for grievance hearing, or "30 days" for SAR).
- For 'recommendedTemplateIds', select 1 to 3 IDs strictly from this list: ["formal_grievance", "unpaid_wages", "statutory_sick_pay", "sar_data_request", "flexible_working", "constructive_dismissal"].`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
        config: {
          systemInstruction:
            "You are Elon, a UK Employment Law structured legal extractor. You identify exact UK statutory rights, statutory time limits, and remedies from worker consultations.",
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topicSummary: {
                type: Type.STRING,
                description: `Concise 1-2 sentence summary of the legal issue and protection status in ${langName}`,
              },
              rights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING, description: `Short right title in ${langName}` },
                    statute: { type: Type.STRING, description: "Exact UK Act and Section citation" },
                    explanation: {
                      type: Type.STRING,
                      description: `Clear 1-2 sentence practical explanation in ${langName}`,
                    },
                    category: {
                      type: Type.STRING,
                      description:
                        "One of: 'wages', 'dismissal', 'sick_pay', 'working_time', 'grievance', 'data_protection'",
                    },
                  },
                  required: ["id", "title", "statute", "explanation", "category"],
                },
              },
              deadlines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING, description: `Action or claim name in ${langName}` },
                    timeframe: {
                      type: Type.STRING,
                      description: `Short numeric timeframe in ${langName}, e.g., '3 mies. - 1 dzień' or '3 mo - 1 day' or '7 dni'`,
                    },
                    urgency: {
                      type: Type.STRING,
                      description: "One of: 'critical', 'important', 'standard'",
                    },
                    authority: {
                      type: Type.STRING,
                      description: "Target body, e.g., 'ACAS / Employment Tribunal', 'HMRC / Payroll', 'HR / Employer'",
                    },
                    explanation: {
                      type: Type.STRING,
                      description: `When the clock starts and what happens if missed, in ${langName}`,
                    },
                  },
                  required: ["id", "label", "timeframe", "urgency", "authority", "explanation"],
                },
              },
              recommendedTemplateIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description:
                  "1 to 3 matching template IDs from: formal_grievance, unpaid_wages, statutory_sick_pay, sar_data_request, flexible_working, constructive_dismissal",
              },
            },
            required: ["topicSummary", "rights", "deadlines", "recommendedTemplateIds"],
          },
        },
      });

      const rawText = response.text?.trim();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        res.json({
          topicSummary: parsed.topicSummary || "",
          isBaseline: false,
          rights: Array.isArray(parsed.rights) ? parsed.rights : [],
          deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
          recommendedTemplateIds: Array.isArray(parsed.recommendedTemplateIds)
            ? parsed.recommendedTemplateIds
            : ["formal_grievance"],
          updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          source: "ai",
        });
        return;
      }

      res.status(503).json({ error: "Empty AI legal summary" });
    } catch (err: any) {
      console.error("Error in /api/gemini/legal-summary:", err);
      res.status(500).json({ error: err?.message || "Failed to generate legal summary" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ask Elon server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
