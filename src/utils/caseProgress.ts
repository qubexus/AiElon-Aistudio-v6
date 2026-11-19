import {
  Locale,
  SentLetter,
  UserProfile,
  WorkplaceCase,
  UserDocument,
} from "../types";

export interface CaseRequiredDocItem {
  id: string;
  label: string;
  shortLabel: string;
  completed: boolean;
  actionKind: "upload_doc" | "draft_letter" | "add_note";
  recommendedTemplateId?: string;
}

export interface CaseDocumentProgress {
  completedCount: number;
  totalCount: number;
  percentage: number;
  statusLabel: string;
  nextMissingDocLabel: string | null;
  items: CaseRequiredDocItem[];
}

export const MANUAL_CASE_DOCS_STORAGE_KEY = "ask_elon_manual_case_docs_v1";

export function getStoredManualCompletedDocs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MANUAL_CASE_DOCS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCaseProgressWidthClass(percentage: number): string {
  if (percentage <= 0) return "w-[0%]";
  if (percentage <= 25) return "w-[25%]";
  if (percentage <= 34) return "w-[33.333%]";
  if (percentage <= 50) return "w-[50%]";
  if (percentage <= 67) return "w-[66.667%]";
  if (percentage <= 75) return "w-[75%]";
  return "w-[100%]";
}

export function computeCaseDocumentProgress(
  caseItem: WorkplaceCase,
  documents: UserDocument[],
  sentLetters: SentLetter[],
  user: UserProfile,
  locale: Locale,
  manualCompletedDocIds?: string[]
): CaseDocumentProgress {
  const effectiveManualIds =
    manualCompletedDocIds !== undefined
      ? manualCompletedDocIds
      : getStoredManualCompletedDocs();
  const combinedText = `${caseItem.title} ${caseItem.description} ${caseItem.sector}`.toLowerCase();
  const isResolved = caseItem.status === "resolved";
  const notesText = caseItem.notes.map((n) => n.text.toLowerCase()).join(" ");
  const pinnedText = (caseItem.pinnedItems || [])
    .map((p) => p.text.toLowerCase())
    .join(" ");
  const allCaseContext = `${combinedText} ${notesText} ${pinnedText}`;

  const hasPayslipDoc =
    documents.some(
      (d) =>
        d.type === "payslip" ||
        d.categoryTag === "PDF Paystub" ||
        d.categoryTag === "Image Paystub" ||
        /payslip|odcinek/i.test(d.name)
    ) || /payslip|odcinek/i.test(notesText);

  const hasContractDoc =
    documents.some(
      (d) =>
        d.type === "contract" ||
        d.categoryTag === "Employment Contract" ||
        /contract|umow/i.test(d.name)
    ) || Boolean(user.contractType && user.startDate);

  const hasRotaOrTimesheet =
    documents.some(
      (d) =>
        d.categoryTag === "Rota / Timesheet" ||
        /rota|grafik|timesheet|godzin/i.test(d.name)
    ) ||
    /grafik|godzin|nadgodzin|172|160|zmian|shift|hours/i.test(
      `${notesText} ${pinnedText}`
    );

  const hasFitNoteDoc =
    documents.some(
      (d) =>
        d.categoryTag === "Sick Note / Fit Note" ||
        /fit note|l4|med 3|sick/i.test(d.name)
    ) || /fit note|zwolnien|l4|ssp/i.test(`${notesText} ${pinnedText}`);

  const hasHrCorrespondence =
    documents.some(
      (d) =>
        d.type === "hr_letter" ||
        d.categoryTag === "Letter to HR" ||
        d.categoryTag === "Disciplinary / Grievance"
    ) ||
    caseItem.notes.length >= 2 ||
    (caseItem.pinnedItems?.length || 0) >= 1;

  const hasFormalSentLetter =
    sentLetters.some((l) => {
      const empLower = (caseItem.employer || "").toLowerCase();
      return (
        (empLower && l.recipient.toLowerCase().includes(empLower)) ||
        (/wypłat|nadgodzin|wage/i.test(combinedText) &&
          (l.primaryTag === "Wages" || l.templateId === "tpl_unpaid_wages")) ||
        (/ssp|chorob|sick/i.test(combinedText) &&
          (l.primaryTag === "Sick Pay" || l.templateId === "tpl_ssp_claim")) ||
        (/zwolni|dismiss/i.test(combinedText) &&
          (l.primaryTag === "Dismissal" || l.templateId === "tpl_dismissal_appeal")) ||
        (/skarg|grievance|godzin/i.test(combinedText) &&
          (l.primaryTag === "Grievance" || l.templateId === "tpl_formal_grievance"))
      );
    }) || /wysłano|wezwanie|letter|pismo|ssp1/i.test(notesText);

  let rawItems: (Omit<CaseRequiredDocItem, "completed"> & { autoCompleted: boolean })[];

  if (/chorob|ssp|fit note|sick|l4/i.test(combinedText)) {
    rawItems = [
      {
        id: `${caseItem.id}_doc_fit_note`,
        label:
          locale === "pl"
            ? "Zwolnienie lekarskie (Fit Note / Med 3)"
            : locale === "ro"
            ? "Certificat medical (Fit Note / Med 3)"
            : "Medical Fit Note (Statement of Fitness for Work)",
        shortLabel: locale === "pl" ? "Fit Note (L4)" : "Fit Note",
        autoCompleted: isResolved || hasFitNoteDoc,
        actionKind: "upload_doc",
      },
      {
        id: `${caseItem.id}_doc_payslips_awe`,
        label:
          locale === "pl"
            ? "Odcinki wypłat z 8 tyg. (Payslips do wyliczenia AWE)"
            : locale === "ro"
            ? "Fluturași de salariu pe 8 săpt. (calcul AWE)"
            : "8-Week Payslips (Average Weekly Earnings proof)",
        shortLabel: locale === "pl" ? "Payslipy (8 tyg.)" : "Payslips (8w)",
        autoCompleted: isResolved || hasPayslipDoc,
        actionKind: "upload_doc",
      },
      {
        id: `${caseItem.id}_doc_ssp_letter`,
        label:
          locale === "pl"
            ? "Wezwanie o wypłatę SSP / wniosek o druk SSP1"
            : locale === "ro"
            ? "Cerere plată SSP / formular SSP1"
            : "Formal SSP Claim / SSP1 Request Letter",
        shortLabel: locale === "pl" ? "Wezwanie SSP / SSP1" : "SSP Claim Letter",
        autoCompleted: isResolved || hasFormalSentLetter,
        actionKind: "draft_letter",
        recommendedTemplateId: "tpl_ssp_claim",
      },
      {
        id: `${caseItem.id}_doc_hr_confirm`,
        label:
          locale === "pl"
            ? "Potwierdzenie z działu Payroll / odpowiedź HR"
            : locale === "ro"
            ? "Confirmare Payroll / răspuns HR"
            : "Payroll Confirmation / HR Response Log",
        shortLabel: locale === "pl" ? "Odpowiedź Payroll" : "Payroll Reply",
        autoCompleted: isResolved || caseItem.notes.length >= 2,
        actionKind: "add_note",
      },
    ];
  } else if (/zwolni|dyscyplin|dismiss|disciplinary|redundan/i.test(combinedText)) {
    rawItems = [
      {
        id: `${caseItem.id}_doc_dismiss_notice`,
        label:
          locale === "pl"
            ? "Pismo o zwolnieniu / zaproszenie na spotkanie dyscyplinarne"
            : locale === "ro"
            ? "Decizie concediere / invitație ședință disciplinară"
            : "Dismissal Notice / Disciplinary Invite Letter",
        shortLabel: locale === "pl" ? "Pismo z HR" : "HR Notice",
        autoCompleted: isResolved || hasHrCorrespondence,
        actionKind: "upload_doc",
      },
      {
        id: `${caseItem.id}_doc_contract`,
        label:
          locale === "pl"
            ? "Umowa o pracę i warunki zatrudnienia (Section 1)"
            : locale === "ro"
            ? "Contractul de muncă (Section 1 Statement)"
            : "Employment Contract & Section 1 Statement",
        shortLabel: locale === "pl" ? "Umowa o pracę" : "Contract",
        autoCompleted: isResolved || hasContractDoc,
        actionKind: "upload_doc",
      },
      {
        id: `${caseItem.id}_doc_appeal_letter`,
        label:
          locale === "pl"
            ? "Oficjalne odwołanie (Formal Dismissal Appeal Letter)"
            : locale === "ro"
            ? "Contestație oficială (Dismissal Appeal Letter)"
            : "Formal Dismissal Appeal Letter (ACAS Code)",
        shortLabel: locale === "pl" ? "Odwołanie (Appeal)" : "Appeal Letter",
        autoCompleted: isResolved || hasFormalSentLetter,
        actionKind: "draft_letter",
        recommendedTemplateId: "tpl_dismissal_appeal",
      },
      {
        id: `${caseItem.id}_doc_acas_sar`,
        label:
          locale === "pl"
            ? "Wniosek SAR o akta osobowe / zgłoszenie ACAS"
            : locale === "ro"
            ? "Cerere SAR dosar personal / sesizare ACAS"
            : "Subject Access Request (SAR) / ACAS Certificate",
        shortLabel: locale === "pl" ? "Wniosek SAR / ACAS" : "SAR / ACAS",
        autoCompleted: isResolved || /sar|gdpr|acas/i.test(allCaseContext),
        actionKind: "draft_letter",
        recommendedTemplateId: "tpl_sar_request",
      },
    ];
  } else {
    // Unpaid wages / overtime / cut hours / general workplace claim
    rawItems = [
      {
        id: `${caseItem.id}_doc_payslip`,
        label:
          locale === "pl"
            ? "Odcinek wypłaty (Payslip wykazujący brak godzin)"
            : locale === "ro"
            ? "Fluturaș de salariu (Payslip)"
            : "Itemised Payslip (ERA 1996 s.8)",
        shortLabel: locale === "pl" ? "Payslip" : "Payslip",
        autoCompleted: isResolved || hasPayslipDoc,
        actionKind: "upload_doc",
      },
      {
        id: `${caseItem.id}_doc_rota`,
        label:
          locale === "pl"
            ? "Ewidencja czasu pracy / grafik zmian (Rota / Timesheet)"
            : locale === "ro"
            ? "Pontaj / program de lucru (Rota / Timesheet)"
            : "Shift Rota / Timesheet Evidence",
        shortLabel: locale === "pl" ? "Grafik / Godziny" : "Rota / Hours",
        autoCompleted: isResolved || hasRotaOrTimesheet,
        actionKind: "upload_doc",
      },
      {
        id: `${caseItem.id}_doc_lba_letter`,
        label:
          locale === "pl"
            ? "Wezwanie do zapłaty (Letter Before Action — ERA 1996 s.13)"
            : locale === "ro"
            ? "Somație de plată (Letter Before Action — ERA 1996 s.13)"
            : "Letter Before Action (ERA 1996 s.13 Claim)",
        shortLabel: locale === "pl" ? "Wezwanie do HR" : "LBA Letter",
        autoCompleted: isResolved || hasFormalSentLetter,
        actionKind: "draft_letter",
        recommendedTemplateId: "tpl_unpaid_wages",
      },
      {
        id: `${caseItem.id}_doc_acas_ec`,
        label:
          locale === "pl"
            ? "Potwierdzenie odpowiedzi HR lub zgłoszenie ACAS EC"
            : locale === "ro"
            ? "Răspuns HR sau certificat ACAS Early Conciliation"
            : "HR Response Log or ACAS Early Conciliation Ref",
        shortLabel: locale === "pl" ? "Odpowiedź HR / ACAS" : "HR / ACAS Ref",
        autoCompleted:
          isResolved ||
          /acas|rozwiązan|wypłacon|potwierdz/i.test(allCaseContext) ||
          (caseItem.pinnedItems?.length || 0) >= 2,
        actionKind: "add_note",
      },
    ];
  }

  const items: CaseRequiredDocItem[] = rawItems.map((item) => ({
    id: item.id,
    label: item.label,
    shortLabel: item.shortLabel,
    completed: item.autoCompleted || effectiveManualIds.includes(item.id),
    actionKind: item.actionKind,
    recommendedTemplateId: item.recommendedTemplateId,
  }));

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / Math.max(1, totalCount)) * 100);
  const nextMissing = items.find((i) => !i.completed) || null;

  const statusLabel =
    percentage === 100
      ? locale === "pl"
        ? "Komplet dokumentów do roszczenia"
        : locale === "ro"
        ? "Dosar complet pentru cerere"
        : "All claim documents ready"
      : locale === "pl"
      ? `Dokumenty do roszczenia: ${completedCount}/${totalCount}`
      : locale === "ro"
      ? `Documente dosar: ${completedCount}/${totalCount}`
      : `Claim documents: ${completedCount}/${totalCount}`;

  return {
    completedCount,
    totalCount,
    percentage,
    statusLabel,
    nextMissingDocLabel: nextMissing ? nextMissing.shortLabel : null,
    items,
  };
}
