import { WorkplaceCase, UserDocument, SentLetter } from "../types";

export type CaseBoxCategoryId =
  | "contracts"
  | "payslips"
  | "letters"
  | "evidence"
  | "notes"
  | "other";

export interface CaseBoxDocumentItem {
  id: string;
  caseId: string;
  boxId: CaseBoxCategoryId;
  name: string;
  size: string;
  date: string;
  kind: "pdf" | "image" | "note" | "letter";
  previewText?: string;
  thumbnailDataUrl?: string;
}

export const CASE_BOX_DOCS_STORAGE_KEY = "ask_elon_case_box_docs_v1";
export const CASE_BOX_DOCS_UPDATED_EVENT = "ask-elon-case-box-docs-updated";

export interface CaseBoxDefinition {
  id: CaseBoxCategoryId;
  accent: "green" | "orange";
  labelEn: string;
  labelPl: string;
  labelRo: string;
  shortEn: string;
  shortPl: string;
  shortRo: string;
}

export const CASE_BOX_DEFINITIONS: CaseBoxDefinition[] = [
  {
    id: "contracts",
    accent: "green",
    labelEn: "Contracts",
    labelPl: "Umowy",
    labelRo: "Contracte",
    shortEn: "Contracts",
    shortPl: "Umowy",
    shortRo: "Contracte",
  },
  {
    id: "payslips",
    accent: "orange",
    labelEn: "Payslips",
    labelPl: "Paski wypłaty",
    labelRo: "Fluturași de salariu",
    shortEn: "Payslips",
    shortPl: "Paski",
    shortRo: "Fluturași",
  },
  {
    id: "letters",
    accent: "green",
    labelEn: "Letters",
    labelPl: "Pisma",
    labelRo: "Scrisori",
    shortEn: "Letters",
    shortPl: "Pisma",
    shortRo: "Scrisori",
  },
  {
    id: "evidence",
    accent: "orange",
    labelEn: "Evidence (photos)",
    labelPl: "Dowody (zdjęcia)",
    labelRo: "Dovezi (foto)",
    shortEn: "Evidence",
    shortPl: "Dowody",
    shortRo: "Dovezi",
  },
  {
    id: "notes",
    accent: "green",
    labelEn: "Notes",
    labelPl: "Notatki",
    labelRo: "Notițe",
    shortEn: "Notes",
    shortPl: "Notatki",
    shortRo: "Notițe",
  },
  {
    id: "other",
    accent: "orange",
    labelEn: "Other (PDF)",
    labelPl: "Inne (PDF)",
    labelRo: "Altele (PDF)",
    shortEn: "Other",
    shortPl: "Inne",
    shortRo: "Altele",
  },
];

export function buildDefaultBoxItemsForCase(
  caseItem: WorkplaceCase,
  documents: UserDocument[],
  sentLetters: SentLetter[]
): CaseBoxDocumentItem[] {
  const items: CaseBoxDocumentItem[] = [];

  for (const d of documents) {
    let boxId: CaseBoxCategoryId = "other";
    const lower = `${d.name} ${d.categoryTag || ""}`.toLowerCase();
    if (d.type === "contract" || lower.includes("contract") || lower.includes("umow")) {
      boxId = "contracts";
    } else if (
      d.type === "payslip" ||
      lower.includes("payslip") ||
      lower.includes("paystub") ||
      lower.includes("pasek")
    ) {
      boxId = "payslips";
    } else if (
      d.type === "hr_letter" ||
      lower.includes("letter") ||
      lower.includes("grievance") ||
      lower.includes("pismo")
    ) {
      boxId = "letters";
    } else if (
      lower.includes("image") ||
      lower.includes("photo") ||
      lower.includes("jpg") ||
      lower.includes("png")
    ) {
      boxId = "evidence";
    }

    items.push({
      id: `boxdoc_${caseItem.id}_${d.id}`,
      caseId: caseItem.id,
      boxId,
      name: d.name,
      size: d.fileSize || "240 KB",
      date: d.uploadDate || caseItem.updatedAt.slice(0, 10),
      kind: boxId === "evidence" ? "image" : "pdf",
      previewText:
        d.auditResult?.summary ||
        `Document attached to case "${caseItem.title}" (${caseItem.employer}).`,
    });
  }

  for (const l of sentLetters.slice(0, 3)) {
    items.push({
      id: `boxletter_${caseItem.id}_${l.id}`,
      caseId: caseItem.id,
      boxId: "letters",
      name: `${l.title || l.templateId || "HR_Letter"}.pdf`,
      size: "128 KB",
      date: l.date,
      kind: "letter",
      previewText: l.content,
    });
  }

  for (const n of caseItem.notes) {
    items.push({
      id: `boxnote_${caseItem.id}_${n.id}`,
      caseId: caseItem.id,
      boxId: "notes",
      name: n.text.slice(0, 42) + (n.text.length > 42 ? "…" : ""),
      size: "4 KB",
      date: n.date,
      kind: "note",
      previewText: n.text,
    });
  }

  return items;
}

export function readAllStoredBoxDocs(): CaseBoxDocumentItem[] {
  try {
    const raw = localStorage.getItem(CASE_BOX_DOCS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAllStoredBoxDocs(items: CaseBoxDocumentItem[]): void {
  try {
    localStorage.setItem(CASE_BOX_DOCS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CASE_BOX_DOCS_UPDATED_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function getOrSeedBoxDocsForCases(
  casesList: WorkplaceCase[],
  documents: UserDocument[],
  sentLetters: SentLetter[]
): CaseBoxDocumentItem[] {
  const existing = readAllStoredBoxDocs();
  let next = existing;
  let changed = false;

  for (const c of casesList) {
    if (!next.some((item) => item.caseId === c.id)) {
      const defaults = buildDefaultBoxItemsForCase(c, documents, sentLetters);
      if (defaults.length > 0) {
        next = [...next, ...defaults];
        changed = true;
      }
    }
  }

  if (changed) {
    try {
      localStorage.setItem(CASE_BOX_DOCS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  return next;
}

export function suggestBoxForFile(
  fileName: string,
  mimeType: string,
  source: "camera" | "gallery" | "files"
): CaseBoxCategoryId {
  const lower = fileName.toLowerCase();
  if (source === "camera" || source === "gallery" || mimeType.startsWith("image/")) {
    if (lower.includes("payslip") || lower.includes("pasek")) return "payslips";
    return "evidence";
  }
  if (lower.includes("contract") || lower.includes("umow") || lower.includes("agreement")) {
    return "contracts";
  }
  if (
    lower.includes("payslip") ||
    lower.includes("paystub") ||
    lower.includes("pasek") ||
    lower.includes("p60") ||
    lower.includes("p45")
  ) {
    return "payslips";
  }
  if (
    lower.includes("letter") ||
    lower.includes("grievance") ||
    lower.includes("pismo") ||
    lower.includes("appeal")
  ) {
    return "letters";
  }
  if (lower.includes("note") || lower.includes("notatk") || lower.endsWith(".txt")) {
    return "notes";
  }
  return "other";
}
