import { DocumentCategoryTag, DocumentDetectionMeta, Locale } from "../types";

export const ALL_DOCUMENT_CATEGORY_TAGS: DocumentCategoryTag[] = [
  "PDF Paystub",
  "Image Paystub",
  "Employment Contract",
  "Letter to HR",
  "Disciplinary / Grievance",
  "Sick Note / Fit Note",
  "P45 / P60 Tax Form",
  "Rota / Timesheet",
  "Workplace Document",
];

export interface DocumentTagStyle {
  badgeClass: string;
  dotClass: string;
  labelPl: string;
  labelRo: string;
}

export const DOCUMENT_TAG_STYLES: Record<DocumentCategoryTag, DocumentTagStyle> = {
  "PDF Paystub": {
    badgeClass: "bg-[#1D6852]/20 text-[#38B28B] border-[#38B28B]/45",
    dotClass: "bg-[#38B28B]",
    labelPl: "PDF Paystub · Odcinek wypłaty",
    labelRo: "PDF Paystub · Fluturaș salariu",
  },
  "Image Paystub": {
    badgeClass: "bg-[#10B981]/20 text-[#6EE7B7] border-[#10B981]/45",
    dotClass: "bg-[#10B981]",
    labelPl: "Image Paystub · Zdjęcie wypłaty",
    labelRo: "Image Paystub · Poză fluturaș",
  },
  "Employment Contract": {
    badgeClass: "bg-[#0284C7]/20 text-[#38BDF8] border-[#38BDF8]/45",
    dotClass: "bg-[#38BDF8]",
    labelPl: "Employment Contract · Umowa o pracę",
    labelRo: "Employment Contract · Contract de muncă",
  },
  "Letter to HR": {
    badgeClass: "bg-[#D97724]/20 text-[#FF9E58] border-[#D97724]/45",
    dotClass: "bg-[#D97724]",
    labelPl: "Letter to HR · Pismo do HR",
    labelRo: "Letter to HR · Scrisoare către HR",
  },
  "Disciplinary / Grievance": {
    badgeClass: "bg-[#EF4444]/20 text-[#FCA5A5] border-[#EF4444]/45",
    dotClass: "bg-[#EF4444]",
    labelPl: "Disciplinary / Grievance · Dyscyplinarka / Skarga",
    labelRo: "Disciplinary / Grievance · Disciplinar / Plângere",
  },
  "Sick Note / Fit Note": {
    badgeClass: "bg-[#8B5CF6]/20 text-[#DDD6FE] border-[#A78BFA]/45",
    dotClass: "bg-[#A78BFA]",
    labelPl: "Sick Note / Fit Note · Zwolnienie MED3 / L4",
    labelRo: "Sick Note / Fit Note · Concediu medical",
  },
  "P45 / P60 Tax Form": {
    badgeClass: "bg-[#F59E0B]/20 text-[#FDE68A] border-[#FBBF24]/45",
    dotClass: "bg-[#FBBF24]",
    labelPl: "P45 / P60 Tax Form · Podatki HMRC",
    labelRo: "P45 / P60 Tax Form · Formular fiscal HMRC",
  },
  "Rota / Timesheet": {
    badgeClass: "bg-[#06B6D4]/20 text-[#67E8F9] border-[#22D3EE]/45",
    dotClass: "bg-[#22D3EE]",
    labelPl: "Rota / Timesheet · Grafik / Godziny",
    labelRo: "Rota / Timesheet · Program / Pontaj",
  },
  "Workplace Document": {
    badgeClass: "bg-slate-500/20 text-slate-300 border-slate-400/35",
    dotClass: "bg-slate-400",
    labelPl: "Workplace Document · Dokument pracowniczy",
    labelRo: "Workplace Document · Document de muncă",
  },
};

export function mapCategoryTagToDocType(
  tag: DocumentCategoryTag
): "payslip" | "contract" | "hr_letter" | "other" {
  if (tag === "PDF Paystub" || tag === "Image Paystub") return "payslip";
  if (tag === "Employment Contract") return "contract";
  if (tag === "Letter to HR" || tag === "Disciplinary / Grievance") return "hr_letter";
  return "other";
}

export function getDefaultCategoryTagForType(
  type: "payslip" | "contract" | "hr_letter" | "other",
  mimeType?: string
): DocumentCategoryTag {
  if (type === "payslip") {
    return mimeType?.startsWith("image/") ? "Image Paystub" : "PDF Paystub";
  }
  if (type === "contract") return "Employment Contract";
  if (type === "hr_letter") return "Letter to HR";
  return "Workplace Document";
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "1 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Inspects leading magic bytes of an ArrayBuffer so file-type detection
 * does not rely blindly on user-editable file extensions.
 */
function detectBinaryFormatFromBytes(
  bytes: Uint8Array,
  fallbackMime: string,
  fileName: string
): { mimeType: string; fileFormat: string } {
  // %PDF-
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return { mimeType: "application/pdf", fileFormat: "PDF" };
  }

  // PNG: 89 50 4E 47
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { mimeType: "image/png", fileFormat: "PNG" };
  }

  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: "image/jpeg", fileFormat: "JPEG" };
  }

  // WEBP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mimeType: "image/webp", fileFormat: "WEBP" };
  }

  // GIF: GIF87a / GIF89a
  if (bytes.length >= 4 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return { mimeType: "image/gif", fileFormat: "GIF" };
  }

  // ZIP / DOCX: PK\x03\x04
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    const headerScan = new TextDecoder("latin1").decode(bytes.slice(0, Math.min(bytes.length, 4096)));
    if (headerScan.includes("word/") || fileName.toLowerCase().endsWith(".docx")) {
      return {
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileFormat: "DOCX",
      };
    }
    return { mimeType: "application/zip", fileFormat: "ZIP" };
  }

  const ext = fileName.split(".").pop()?.toUpperCase() || "";
  const cleanFallback = (fallbackMime || "").split(";")[0].trim().toLowerCase();

  if (cleanFallback.startsWith("image/")) {
    return {
      mimeType: cleanFallback,
      fileFormat: ext || cleanFallback.replace("image/", "").toUpperCase(),
    };
  }
  if (cleanFallback.startsWith("text/") || ["TXT", "MD", "CSV", "RTF", "EML", "HTML"].includes(ext)) {
    return {
      mimeType: cleanFallback || "text/plain",
      fileFormat: ext || "TXT",
    };
  }

  return {
    mimeType: cleanFallback || "application/octet-stream",
    fileFormat: ext || "FILE",
  };
}

/**
 * Extracts human-readable text runs from text files, PDFs (uncompressed streams / literal strings),
 * and uncompressed DOCX/XML containers for local & hybrid content analysis.
 */
function extractReadableTextFromBuffer(
  bytes: Uint8Array,
  mimeType: string,
  fileFormat: string
): string {
  if (mimeType.startsWith("image/")) return "";

  const maxScan = Math.min(bytes.length, 350_000);
  const slice = bytes.slice(0, maxScan);

  if (mimeType.startsWith("text/") || ["TXT", "MD", "CSV", "RTF", "EML", "HTML"].includes(fileFormat)) {
    try {
      const decoded = new TextDecoder("utf-8", { fatal: false }).decode(slice);
      return decoded
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000);
    } catch {
      return "";
    }
  }

  if (fileFormat === "PDF" || mimeType === "application/pdf") {
    const latin = new TextDecoder("latin1").decode(slice);
    const extractedSegments: string[] = [];

    // Pull literal PDF text strings inside (...) used by Tj / TJ operators
    const literalRegex = /\(([^()\\]{3,160}|(?:\\.|[^()\\]){3,160})\)/g;
    let m: RegExpExecArray | null;
    while ((m = literalRegex.exec(latin)) !== null && extractedSegments.length < 320) {
      const candidate = m[1]
        .replace(/\\n/g, " ")
        .replace(/\\r/g, " ")
        .replace(/\\([()\\])/g, "$1")
        .replace(/[^\x20-\x7E\u00A0-\u017F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (
        candidate.length >= 3 &&
        !/^(Adobe|ReportLab|PDF|Identity|Helvetica|Times|Courier|Type1|CIDFont|obj|endobj)$/i.test(
          candidate
        )
      ) {
        extractedSegments.push(candidate);
      }
    }

    if (extractedSegments.length > 0) {
      return extractedSegments.join(" ").slice(0, 12000);
    }

    // Fallback: extract printable ASCII words outside PDF binary tags
    const asciiRuns = latin.match(/[A-Za-z0-9£$.,:/\-@ ]{6,}/g) || [];
    const filtered = asciiRuns.filter(
      (run) =>
        !/^(obj|endobj|stream|endstream|xref|trailer|startxref|FontDescriptor|MediaBox|Resources|Filter|FlateDecode)/.test(
          run.trim()
        )
    );
    return filtered.join(" ").replace(/\s+/g, " ").trim().slice(0, 10000);
  }

  if (fileFormat === "DOCX") {
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(slice);
    const xmlTexts = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    if (xmlTexts.length > 0) {
      return xmlTexts
        .map((node) => node.replace(/<[^>]+>/g, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 12000);
    }
  }

  return "";
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function prepareImagePayloads(
  blob: Blob,
  fallbackMime: string
): Promise<{
  uploadBase64: string;
  uploadMimeType: string;
  previewDataUrl: string;
}> {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = (err) => reject(err);
      el.src = objectUrl;
    });

    // High-res normalized payload for Gemini OCR/Vision (max 1500px edge)
    const maxAnalysisDim = 1500;
    const analysisScale = Math.min(1, maxAnalysisDim / Math.max(img.width, img.height, 1));
    const aw = Math.max(1, Math.round(img.width * analysisScale));
    const ah = Math.max(1, Math.round(img.height * analysisScale));

    const analysisCanvas = document.createElement("canvas");
    analysisCanvas.width = aw;
    analysisCanvas.height = ah;
    const actx = analysisCanvas.getContext("2d");
    if (actx) {
      actx.drawImage(img, 0, 0, aw, ah);
    }
    const uploadDataUrl = analysisCanvas.toDataURL("image/jpeg", 0.85);
    const uploadBase64 = uploadDataUrl.split(",")[1] || "";

    // Lightweight thumbnail for localStorage UserDocument preview (max 400px edge)
    const maxThumbDim = 400;
    const thumbScale = Math.min(1, maxThumbDim / Math.max(img.width, img.height, 1));
    const tw = Math.max(1, Math.round(img.width * thumbScale));
    const th = Math.max(1, Math.round(img.height * thumbScale));

    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = tw;
    thumbCanvas.height = th;
    const tctx = thumbCanvas.getContext("2d");
    if (tctx) {
      tctx.drawImage(img, 0, 0, tw, th);
    }
    const previewDataUrl = thumbCanvas.toDataURL("image/jpeg", 0.72);

    return {
      uploadBase64,
      uploadMimeType: "image/jpeg",
      previewDataUrl,
    };
  } catch {
    const buf = await blob.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    const mime = fallbackMime || "image/jpeg";
    return {
      uploadBase64: b64,
      uploadMimeType: mime,
      previewDataUrl: `data:${mime};base64,${b64}`,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Content-based local heuristic classification engine used when offline or when
 * server-side multimodal AI is unavailable. Examines extracted document text,
 * binary format, and filename signals.
 */
export function runLocalContentClassification(params: {
  fileName: string;
  mimeType: string;
  fileFormat: string;
  sourceMethod: "camera" | "system_upload";
  extractedText: string;
  locale: Locale;
}): DocumentDetectionMeta {
  const { fileName, mimeType, fileFormat, sourceMethod, extractedText, locale } = params;
  const isPdf = fileFormat === "PDF" || mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");

  const contentLower = extractedText.toLowerCase();
  const nameLower = fileName.toLowerCase();
  // Primary weight on extracted text content, secondary tie-breaker on filename
  const weightedCheck = (patterns: { regex: RegExp; label: string; weight: number }[]) => {
    let score = 0;
    const matchedLabels: string[] = [];
    for (const p of patterns) {
      if (p.regex.test(contentLower)) {
        score += p.weight;
        matchedLabels.push(p.label);
      } else if (p.regex.test(nameLower)) {
        score += Math.max(1, Math.floor(p.weight * 0.45));
        matchedLabels.push(`${p.label} (filename)`);
      }
    }
    return { score, matchedLabels };
  };

  const paystubEval = weightedCheck([
    { regex: /\b(payslip|paystub|pay\s*slip|wage\s*slip|odcinek\s*wypłaty|fluturaș)\b/i, label: "Payslip Header", weight: 5 },
    { regex: /\b(gross\s*pay|net\s*pay|basic\s*pay|taxable\s*pay)\b/i, label: "Gross / Net Pay", weight: 5 },
    { regex: /\b(paye|tax\s*code|national\s*insurance|ni\s*number|ni\s*letter|ni\s*cat)\b/i, label: "PAYE / NI Deduction", weight: 4 },
    { regex: /\b(ytd|year\s*to\s*date|tax\s*period|pay\s*period|deductions|pension)\b/i, label: "Pay Period / YTD", weight: 3 },
    { regex: /\b(hourly\s*rate|overtime|holiday\s*pay|hours\s*worked)\b/i, label: "Hours & Rate Breakdown", weight: 2 },
  ]);

  const contractEval = weightedCheck([
    { regex: /\b(contract\s*of\s*employment|employment\s*contract|umowa\s*o\s*pracę|contract\s*de\s*muncă)\b/i, label: "Employment Contract Title", weight: 5 },
    { regex: /\b(statement\s*of\s*(main\s*)?terms|written\s*statement|section\s*1\b.*particulars)\b/i, label: "Section 1 Statement of Terms", weight: 5 },
    { regex: /\b(probationary\s*period|notice\s*period|place\s*of\s*work|job\s*title|commencement\s*date)\b/i, label: "Core Contract Clauses", weight: 3 },
    { regex: /\b(remuneration|holiday\s*entitlement|zero[- ]hours|fixed[- ]term|restrictive\s*covenant)\b/i, label: "Terms & Entitlements", weight: 3 },
  ]);

  const hrLetterEval = weightedCheck([
    { regex: /\b(dear\s*(hr|human\s*resources|sir|madam|manager)|to\s*whom\s*it\s*may\s*concern)\b/i, label: "Formal HR Salutation", weight: 4 },
    { regex: /\b(human\s*resources\s*department|hr\s*department|yours\s*(sincerely|faithfully))\b/i, label: "HR Correspondence Format", weight: 4 },
    { regex: /\b(subject\s*access\s*request|article\s*15\s*(uk\s*)?gdpr|unlawful\s*deduction|section\s*13\s*employment\s*rights\s*act)\b/i, label: "Statutory HR Notice", weight: 4 },
    { regex: /\b(resignation|flexible\s*working\s*request|letter\s*to\s*hr|pismo\s*do\s*hr)\b/i, label: "HR Letter Subject", weight: 4 },
  ]);

  const disciplinaryEval = weightedCheck([
    { regex: /\b(formal\s*grievance|grievance\s*(hearing|meeting|outcome)|skarga\s*formalna)\b/i, label: "Grievance Procedure", weight: 5 },
    { regex: /\b(disciplinary\s*(hearing|meeting|action)|written\s*warning|final\s*written\s*warning|gross\s*misconduct)\b/i, label: "Disciplinary Notice", weight: 5 },
    { regex: /\b(dismissal|termination\s*of\s*employment|right\s*to\s*be\s*accompanied|acas\s*code)\b/i, label: "Dismissal / ACAS Right", weight: 4 },
  ]);

  const sickNoteEval = weightedCheck([
    { regex: /\b(fit\s*note|med\s*3|statement\s*of\s*fitness\s*for\s*work|zwolnienie\s*lekarskie)\b/i, label: "MED3 Fit Note", weight: 5 },
    { regex: /\b(not\s*fit\s*for\s*work|may\s*be\s*fit\s*for\s*work|statutory\s*sick\s*pay|ssp1)\b/i, label: "Fitness Assessment / SSP1", weight: 5 },
    { regex: /\b(general\s*practitioner|nhs|doctor|medical\s*certificate|sick\s*note)\b/i, label: "Medical Certification", weight: 3 },
  ]);

  const taxFormEval = weightedCheck([
    { regex: /\b(p45|p60|p11d|end\s*of\s*year\s*certificate)\b/i, label: "HMRC Form Identifier", weight: 6 },
    { regex: /\b(hm\s*revenue|hmrc|details\s*of\s*employee\s*leaving|total\s*pay\s*to\s*date|total\s*tax\s*to\s*date)\b/i, label: "HMRC Tax Record", weight: 4 },
  ]);

  const rotaEval = weightedCheck([
    { regex: /\b(rota|timesheet|time\s*sheet|shift\s*schedule|grafik|pontaj)\b/i, label: "Rota / Timesheet Header", weight: 5 },
    { regex: /\b(clock\s*in|clock\s*out|shift\s*start|shift\s*end|total\s*hours)\b/i, label: "Shift Log Columns", weight: 4 },
  ]);

  const candidates: Array<{
    tag: DocumentCategoryTag;
    score: number;
    signals: string[];
  }> = [
    {
      tag: isImage && !isPdf ? "Image Paystub" : "PDF Paystub",
      score: paystubEval.score,
      signals: paystubEval.matchedLabels,
    },
    {
      tag: "Employment Contract",
      score: contractEval.score,
      signals: contractEval.matchedLabels,
    },
    {
      tag: "Letter to HR",
      score: hrLetterEval.score,
      signals: hrLetterEval.matchedLabels,
    },
    {
      tag: "Disciplinary / Grievance",
      score: disciplinaryEval.score,
      signals: disciplinaryEval.matchedLabels,
    },
    {
      tag: "Sick Note / Fit Note",
      score: sickNoteEval.score,
      signals: sickNoteEval.matchedLabels,
    },
    {
      tag: "P45 / P60 Tax Form",
      score: taxFormEval.score,
      signals: taxFormEval.matchedLabels,
    },
    {
      tag: "Rota / Timesheet",
      score: rotaEval.score,
      signals: rotaEval.matchedLabels,
    },
  ];

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  let chosenTag: DocumentCategoryTag = "Workplace Document";
  let confidence = 62;
  let signals: string[] = [`Format: ${fileFormat}`];

  if (best && best.score >= 3) {
    chosenTag = best.tag;
    confidence = Math.min(96, 68 + best.score * 3);
    signals = [`Format: ${fileFormat}`, ...best.signals].slice(0, 5);
  } else if (sourceMethod === "camera") {
    signals = [`Camera Capture (${fileFormat})`, "Visual scan saved"];
    confidence = 58;
  } else {
    signals = [`File Format: ${fileFormat}`, `MIME: ${mimeType}`];
    confidence = 60;
  }

  const summaryMap: Record<DocumentCategoryTag, Record<Locale, string>> = {
    "PDF Paystub": {
      pl: "Wykryto odcinek wypłaty (payslip) na podstawie analizy treści i struktury pliku.",
      en: "Detected paystub / payslip document from content and file structure analysis.",
      ro: "S-a detectat un fluturaș de salariu pe baza analizei conținutului.",
    },
    "Image Paystub": {
      pl: "Wykryto skan lub zdjęcie odcinka wypłaty (payslip).",
      en: "Detected photographed or scanned paystub image.",
      ro: "S-a detectat imaginea unui fluturaș de salariu.",
    },
    "Employment Contract": {
      pl: "Wykryto umowę o pracę / oświadczenie warunków zatrudnienia (Section 1 ERA 1996).",
      en: "Detected employment contract or Section 1 Written Statement of Terms.",
      ro: "S-a detectat un contract de muncă / declarație de condiții.",
    },
    "Letter to HR": {
      pl: "Wykryto oficjalne pismo pracownicze lub korespondencję do działu HR.",
      en: "Detected formal correspondence or letter addressed to HR.",
      ro: "S-a detectat o scrisoare oficială către departamentul HR.",
    },
    "Disciplinary / Grievance": {
      pl: "Wykryto dokument dotyczący procedury dyscyplinarnej, zwolnienia lub skargi (Grievance).",
      en: "Detected disciplinary, dismissal, or formal grievance document.",
      ro: "S-a detectat un document disciplinar, de concediere sau plângere formală.",
    },
    "Sick Note / Fit Note": {
      pl: "Wykryto zwolnienie lekarskie (NHS Fit Note / MED3 lub formularz SSP1).",
      en: "Detected medical fitness note (NHS MED3 Fit Note or SSP1 form).",
      ro: "S-a detectat un certificat medical (Fit Note / MED3 / SSP1).",
    },
    "P45 / P60 Tax Form": {
      pl: "Wykryto dokument podatkowy HMRC (P45 lub P60).",
      en: "Detected HMRC tax certificate (P45 or P60).",
      ro: "S-a detectat formularul fiscal HMRC (P45 / P60).",
    },
    "Rota / Timesheet": {
      pl: "Wykryto grafik zmianowy lub ewidencję czasu pracy (Rota / Timesheet).",
      en: "Detected shift schedule or hours timesheet.",
      ro: "S-a detectat un grafic de ture sau pontaj de ore.",
    },
    "Workplace Document": {
      pl: `Przeanalizowano plik (${fileFormat}) i przypisano ogólną kategorię dokumentu pracowniczego.`,
      en: `Inspected file (${fileFormat}) and assigned general workplace document category.`,
      ro: `Fișier (${fileFormat}) analizat și clasificat ca document de muncă.`,
    },
  };

  return {
    categoryTag: chosenTag,
    mappedType: mapCategoryTagToDocType(chosenTag),
    confidence,
    sourceMethod,
    detectedMimeType: mimeType,
    detectedFileFormat: fileFormat,
    analysisMethod: "content_heuristic",
    detectedSignals: signals,
    contentSummary: summaryMap[chosenTag][locale],
    extractedTextSnippet: extractedText.slice(0, 220),
    detectedAt: new Date().toISOString(),
  };
}

export interface AnalyzedDocumentResult {
  fileName: string;
  fileSize: string;
  mimeType: string;
  previewDataUrl?: string;
  detectionMeta: DocumentDetectionMeta;
  serverNotice?: string;
}

/**
 * Full file-type detection & content classification pipeline:
 * 1. Reads real binary bytes & magic headers (%PDF-, PNG, JPEG, WEBP, DOCX).
 * 2. Extracts readable text content from text/PDF/DOCX files and prepares scaled image payloads.
 * 3. Sends content + binary inlineData to /api/gemini/detect-document-type (gemini-4-hydrogen).
 * 4. Falls back cleanly to local content-heuristic analysis if offline or API key is absent,
 *    surfacing any server notice transparently.
 */
export async function analyzeUploadedDocument(
  fileOrBlob: File | Blob,
  options: {
    fileName?: string;
    sourceMethod: "camera" | "system_upload";
    locale: Locale;
  }
): Promise<AnalyzedDocumentResult> {
  const { sourceMethod, locale } = options;
  const fallbackExt =
    fileOrBlob.type === "image/png"
      ? "png"
      : fileOrBlob.type === "application/pdf"
      ? "pdf"
      : "jpg";
  const fileName =
    options.fileName ||
    (fileOrBlob instanceof File && fileOrBlob.name) ||
    `Camera_Scan_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.${fallbackExt}`;

  const buffer = await fileOrBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const { mimeType, fileFormat } = detectBinaryFormatFromBytes(bytes, fileOrBlob.type, fileName);
  const fileSize = formatFileSize(buffer.byteLength);

  const extractedText = extractReadableTextFromBuffer(bytes, mimeType, fileFormat);

  let base64Data: string | undefined;
  let uploadMimeType = mimeType;
  let previewDataUrl: string | undefined;

  if (mimeType.startsWith("image/")) {
    const imgPayloads = await prepareImagePayloads(fileOrBlob, mimeType);
    base64Data = imgPayloads.uploadBase64;
    uploadMimeType = imgPayloads.uploadMimeType;
    previewDataUrl = imgPayloads.previewDataUrl;
  } else if (mimeType === "application/pdf" && buffer.byteLength <= 7_500_000) {
    base64Data = arrayBufferToBase64(buffer);
  }

  let serverNotice: string | undefined;

  try {
    const resp = await fetch("/api/gemini/detect-document-type", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        mimeType: uploadMimeType,
        fileFormat,
        fileSize,
        sourceMethod,
        base64Data,
        extractedText,
        locale,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      const categoryTag: DocumentCategoryTag = ALL_DOCUMENT_CATEGORY_TAGS.includes(data.categoryTag)
        ? data.categoryTag
        : "Workplace Document";

      return {
        fileName,
        fileSize,
        mimeType: uploadMimeType,
        previewDataUrl,
        detectionMeta: {
          categoryTag,
          mappedType: data.mappedType || mapCategoryTagToDocType(categoryTag),
          confidence: Number(data.confidence) || 90,
          sourceMethod,
          detectedMimeType: uploadMimeType,
          detectedFileFormat: fileFormat,
          analysisMethod:
            data.analysisMethod === "ai_multimodal" ? "ai_multimodal" : "ai_text",
          detectedSignals: Array.isArray(data.detectedSignals)
            ? data.detectedSignals.slice(0, 5)
            : [`Format: ${fileFormat}`],
          contentSummary: data.contentSummary || undefined,
          extractedTextSnippet: data.extractedTextSnippet || extractedText.slice(0, 220),
          detectedAt: new Date().toISOString(),
        },
      };
    }

    const errPayload = await resp.json().catch(() => ({}));
    serverNotice = errPayload?.error || `Server returned ${resp.status}`;
  } catch (err: any) {
    serverNotice = err?.message || "Network unavailable";
  }

  const localMeta = runLocalContentClassification({
    fileName,
    mimeType: uploadMimeType,
    fileFormat,
    sourceMethod,
    extractedText,
    locale,
  });

  return {
    fileName,
    fileSize,
    mimeType: uploadMimeType,
    previewDataUrl,
    detectionMeta: localMeta,
    serverNotice,
  };
}
