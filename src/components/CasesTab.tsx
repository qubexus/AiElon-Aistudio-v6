import React, { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import {
  computeCaseDocumentProgress,
  getCaseProgressWidthClass,
  MANUAL_CASE_DOCS_STORAGE_KEY,
} from "../utils/caseProgress";
import {
  CASE_BOX_DEFINITIONS,
  CASE_BOX_DOCS_UPDATED_EVENT,
  CaseBoxCategoryId,
  CaseBoxDocumentItem,
  getOrSeedBoxDocsForCases,
  writeAllStoredBoxDocs,
  suggestBoxForFile,
} from "../utils/caseBoxStorage";
import { CaseDocumentBoxesSection } from "./CaseDocumentBoxesSection";
import { WorkplaceCase, Locale } from "../types";
import {
  Briefcase,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  Search,
  FileText,
  Pin,
  Copy,
  Trash2,
  FileCheck2,
  Upload,
  ArrowUpRight,
  Info,
  Flag,
  Receipt,
  Mail,
  Camera,
  StickyNote,
  Folder,
  X,
} from "lucide-react";

function getBoxIcon(id: CaseBoxCategoryId) {
  switch (id) {
    case "contracts":
      return FileText;
    case "payslips":
      return Receipt;
    case "letters":
      return Mail;
    case "evidence":
      return Camera;
    case "notes":
      return StickyNote;
    case "other":
    default:
      return Folder;
  }
}

function formatBoxShortLabel(id: CaseBoxCategoryId, locale: Locale): string {
  const def = CASE_BOX_DEFINITIONS.find((b) => b.id === id);
  if (!def) return id;
  if (locale === "pl") return def.shortPl;
  if (locale === "ro") return def.shortRo;
  return def.shortEn;
}

function getDaysUntilDeadline(caseItem: WorkplaceCase): {
  days: number;
  isThisWeek: boolean;
  isUrgent: boolean;
} | null {
  if (!caseItem.deadlineDate) return null;
  const parsed = new Date(caseItem.deadlineDate);
  if (Number.isNaN(parsed.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetMidnight = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  ).getTime();
  const days = Math.round((targetMidnight - startOfToday) / 86400000);

  return {
    days,
    isThisWeek: caseItem.status === "open" && days <= 7,
    isUrgent: caseItem.status === "open" && days < 3,
  };
}

function formatDeadlineCountdown(days: number, locale: Locale): string {
  if (days < 0) {
    const overdue = Math.abs(days);
    if (locale === "pl") return `Po terminie ${overdue} dni`;
    if (locale === "ro") return `Depășit cu ${overdue} zile`;
    return `Overdue ${overdue}d`;
  }
  if (days === 0) {
    if (locale === "pl") return "Termin dzisiaj";
    if (locale === "ro") return "Termen azi";
    return "Deadline today";
  }
  if (days === 1) {
    if (locale === "pl") return "Termin za 1 dzień";
    if (locale === "ro") return "Termen în 1 zi";
    return "Due in 1 day";
  }
  if (locale === "pl") return `Termin za ${days} dni`;
  if (locale === "ro") return `Termen în ${days} zile`;
  return `Due in ${days} days`;
}

function formatRelativeUpdated(updatedAt: string, locale: Locale): string {
  const parsed = new Date(updatedAt);
  if (Number.isNaN(parsed.getTime())) return updatedAt;

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startTarget = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  ).getTime();
  const diffDays = Math.max(0, Math.round((startToday - startTarget) / 86400000));

  if (diffDays === 0) {
    if (locale === "pl") return "aktualizacja dzisiaj";
    if (locale === "ro") return "actualizat azi";
    return "updated today";
  }
  if (diffDays === 1) {
    if (locale === "pl") return "aktualizacja wczoraj";
    if (locale === "ro") return "actualizat ieri";
    return "updated yesterday";
  }
  if (locale === "pl") return `aktualizacja ${diffDays} dni temu`;
  if (locale === "ro") return `actualizat acum ${diffDays} zile`;
  return `updated ${diffDays}d ago`;
}

function formatBytesHuman(bytes: number): string {
  if (!bytes || bytes < 1024) return `${Math.max(1, bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export const CasesTab: React.FC = () => {
  const {
    cases,
    activeCaseId,
    setActiveCaseId,
    setIsNewCaseModalOpen,
    updateCaseStatus,
    addCaseNote,
    removeCasePinnedItem,
    startChatAboutCase,
    chatMessages,
    documents,
    sentLetters,
    user,
    setActiveTab,
    setProfileSubTab,
    setActiveTemplateId,
    showToast,
    locale,
    t,
  } = useApp();

  const [expandedId, setExpandedId] = useState<string | null>(activeCaseId || null);
  const [noteInputMap, setNoteInputMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved" | "deadline_week">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [manualCompletedDocs, setManualCompletedDocs] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(MANUAL_CASE_DOCS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Synced 6-box documents per case from shared caseBoxStorage
  const [storedBoxDocs, setStoredBoxDocs] = useState<CaseBoxDocumentItem[]>(() =>
    getOrSeedBoxDocsForCases(cases, documents, sentLetters)
  );

  // Quick Preview Bottom Sheet state
  const [previewCaseId, setPreviewCaseId] = useState<string | null>(null);
  const [previewDragY, setPreviewDragY] = useState<number>(0);
  const previewTouchStartYRef = useRef<number | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);
  const previewFileInputRef = useRef<HTMLInputElement | null>(null);

  // Long-press handling on cards
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressOriginRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    setStoredBoxDocs(getOrSeedBoxDocsForCases(cases, documents, sentLetters));
  }, [cases, documents, sentLetters]);

  useEffect(() => {
    const handleBoxSync = () => {
      setStoredBoxDocs(getOrSeedBoxDocsForCases(cases, documents, sentLetters));
    };
    window.addEventListener(CASE_BOX_DOCS_UPDATED_EVENT, handleBoxSync);
    return () => window.removeEventListener(CASE_BOX_DOCS_UPDATED_EVENT, handleBoxSync);
  }, [cases, documents, sentLetters]);

  useEffect(() => {
    if (activeCaseId) {
      setExpandedId(activeCaseId);
    }
  }, [activeCaseId]);

  useEffect(() => {
    if (!previewCaseId) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewDragY(0);
        setPreviewCaseId(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [previewCaseId]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const toggleManualDocCompletion = (docItemId: string) => {
    setManualCompletedDocs((prev) => {
      const next = prev.includes(docItemId)
        ? prev.filter((id) => id !== docItemId)
        : [...prev, docItemId];
      try {
        localStorage.setItem(MANUAL_CASE_DOCS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent("ask-elon-case-docs-updated"));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const boxDocsByCase = useMemo(() => {
    const grouped: Record<string, CaseBoxDocumentItem[]> = {};
    for (const item of storedBoxDocs) {
      if (!grouped[item.caseId]) grouped[item.caseId] = [];
      grouped[item.caseId].push(item);
    }
    return grouped;
  }, [storedBoxDocs]);

  const stats = useMemo(() => {
    const total = cases.length;
    const open = cases.filter((c) => c.status === "open").length;
    const resolved = cases.filter((c) => c.status === "resolved").length;
    const deadlinesThisWeek = cases.filter((c) => {
      const dl = getDaysUntilDeadline(c);
      return dl?.isThisWeek;
    }).length;
    const totalBoxDocs = cases.reduce(
      (acc, c) => acc + (boxDocsByCase[c.id]?.length || 0),
      0
    );
    return { total, open, resolved, deadlinesThisWeek, totalBoxDocs };
  }, [cases, boxDocsByCase]);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      if (statusFilter === "open" && item.status !== "open") return false;
      if (statusFilter === "resolved" && item.status !== "resolved") return false;
      if (statusFilter === "deadline_week") {
        const dl = getDaysUntilDeadline(item);
        if (!dl?.isThisWeek) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPinned = (item.pinnedItems || []).some((p) =>
          p.text.toLowerCase().includes(q)
        );
        return (
          item.title.toLowerCase().includes(q) ||
          item.employer.toLowerCase().includes(q) ||
          item.sector.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          matchesPinned
        );
      }
      return true;
    });
  }, [cases, statusFilter, searchQuery]);

  const caseProgressMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeCaseDocumentProgress>> = {};
    for (const c of cases) {
      map[c.id] = computeCaseDocumentProgress(
        c,
        documents,
        sentLetters,
        user,
        locale,
        manualCompletedDocs
      );
    }
    return map;
  }, [cases, documents, sentLetters, user, locale, manualCompletedDocs]);

  const computeRealCaseStep = (c: WorkplaceCase, cDocs: CaseBoxDocumentItem[]) => {
    const lettersInBoxes = cDocs.filter((d) => d.boxId === "letters").length;
    const employerMatchSentLetters = sentLetters.some((l) =>
      c.employer ? l.recipient.toLowerCase().includes(c.employer.toLowerCase().split(" ")[0]) : false
    );

    let step = 1;
    let label = t("casesStep1Label");

    if (c.status === "resolved") {
      step = 4;
      label = t("casesStep4Label");
    } else if (lettersInBoxes > 0 || employerMatchSentLetters) {
      step = 3;
      label = t("casesStep3Label");
    } else if (cDocs.length > 0 || c.notes.length > 0 || (c.pinnedItems?.length || 0) > 0) {
      step = 2;
      label = t("casesStep2Label");
    }

    const prefix =
      locale === "pl"
        ? `Krok ${step} z 4`
        : locale === "ro"
        ? `Pasul ${step} din 4`
        : `Step ${step} of 4`;

    return `${prefix} · ${label}`;
  };

  const handleAddNote = (caseId: string) => {
    const text = noteInputMap[caseId] || "";
    if (!text.trim()) return;
    addCaseNote(caseId, text.trim());
    setNoteInputMap((prev) => ({ ...prev, [caseId]: "" }));
  };

  const handlePreviewAddDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0 || !previewCaseId) return;

    const todayIso = new Date().toISOString().slice(0, 10);
    const addedItems: CaseBoxDocumentItem[] = [];

    for (const file of files) {
      const boxId = suggestBoxForFile(file.name, file.type, "files");
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      let thumbnailDataUrl: string | undefined;
      if (isImage) {
        thumbnailDataUrl = await new Promise<string | undefined>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(typeof reader.result === "string" ? reader.result : undefined);
          reader.onerror = () => resolve(undefined);
          reader.readAsDataURL(file);
        });
      }

      addedItems.push({
        id: `boxdoc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        caseId: previewCaseId,
        boxId,
        name: file.name,
        size: formatBytesHuman(file.size),
        date: todayIso,
        kind: isImage ? "image" : isPdf ? "pdf" : "note",
        thumbnailDataUrl,
      });
    }

    const nextItems = [...addedItems, ...storedBoxDocs];
    setStoredBoxDocs(nextItems);
    writeAllStoredBoxDocs(nextItems);

    showToast(
      locale === "pl"
        ? `Dodano dokument do pudełka: ${addedItems[0].name}`
        : locale === "ro"
        ? `Document adăugat: ${addedItems[0].name}`
        : `Document added to case box: ${addedItems[0].name}`
    );
  };

  const expandedCase = useMemo(
    () => (expandedId ? filteredCases.find((c) => c.id === expandedId) || null : null),
    [expandedId, filteredCases]
  );

  const previewCase = useMemo(
    () => (previewCaseId ? cases.find((c) => c.id === previewCaseId) || null : null),
    [previewCaseId, cases]
  );

  const renderExpandedDossier = (c: WorkplaceCase) => {
    const isOpen = c.status === "open";
    const pinnedItems = c.pinnedItems || [];
    const progress = caseProgressMap[c.id];
    const isComplete = progress.percentage === 100;

    return (
      <div className="bg-[#FFFFFF] dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] rounded-[16px] p-4 sm:p-5 space-y-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-none">
        {/* Dossier Top Summary */}
        <div className="flex items-start justify-between gap-3 border-b border-[#E2E8F0] dark:border-[#2C3847] pb-3.5">
          <div className="min-w-0 space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-[#1E293B] dark:text-[#F1F5F9] leading-snug">
              {c.title}
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              {c.employer} · {c.sector}
            </p>
            <p className="text-xs sm:text-sm text-[#1E293B]/90 dark:text-[#F1F5F9]/90 leading-relaxed pt-1">
              {c.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpandedId(null)}
            aria-label={locale === "pl" ? "Zwiń szczegóły sprawy" : "Close case details"}
            className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9] hover:bg-[#F8FAFC] dark:hover:bg-[#141B23] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => startChatAboutCase(c)}
            className="min-h-[44px] inline-flex items-center gap-2 bg-[#0D9488] hover:bg-[#0F766E] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-white dark:text-[#141B23] text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            {t("askElonAboutCase")}
          </button>

          <button
            type="button"
            onClick={() => updateCaseStatus(c.id, isOpen ? "resolved" : "open")}
            className="min-h-[44px] inline-flex items-center gap-1.5 bg-[#F8FAFC] dark:bg-[#141B23] hover:border-[#2E6F57] dark:hover:border-[#52B798] text-[#1E293B] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#2C3847] text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#2E6F57] dark:text-[#52B798]" />
            {isOpen ? t("markResolved") : t("reopenCase")}
          </button>
        </div>

        {/* 6 Document Carton Boxes */}
        <CaseDocumentBoxesSection caseItem={c} />

        {/* Required Legal Claim Documents Checklist */}
        <div className="rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#0D9488] dark:text-[#2DD4BF]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1E293B] dark:text-[#F1F5F9]">
                {locale === "pl"
                  ? "Wymagane dokumenty do zamknięcia roszczenia"
                  : locale === "ro"
                  ? "Documente necesare pentru finalizarea cererii"
                  : "Required Documents to Complete Legal Claim"}
              </h4>
            </div>
            <span
              className={`text-xs font-mono font-extrabold tabular-nums ${
                isComplete
                  ? "text-[#2E6F57] dark:text-[#52B798]"
                  : "text-[#F59E42] dark:text-[#FBB063]"
              }`}
            >
              {progress.completedCount}/{progress.totalCount} ({progress.percentage}%)
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] dark:bg-[#2C3847] overflow-hidden">
            <div
              className={`h-full rounded-full case-progress-bar-fill ${getCaseProgressWidthClass(
                progress.percentage
              )} ${
                isComplete
                  ? "bg-[#2E6F57] dark:bg-[#52B798]"
                  : "bg-gradient-to-r from-[#F59E42] to-[#0D9488] dark:from-[#FBB063] dark:to-[#2DD4BF]"
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {progress.items.map((docStep) => (
              <div
                key={docStep.id}
                className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                  docStep.completed
                    ? "bg-[#2E6F57]/10 dark:bg-[#52B798]/15 border-[#2E6F57]/30 dark:border-[#52B798]/35 text-[#1E293B] dark:text-[#F1F5F9]"
                    : "bg-[#FFFFFF] dark:bg-[#1E2732] border-[#E2E8F0] dark:border-[#2C3847] text-[#64748B] dark:text-[#94A3B8]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleManualDocCompletion(docStep.id)}
                  className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      docStep.completed
                        ? "bg-[#2E6F57] dark:bg-[#52B798] border-[#2E6F57] dark:border-[#52B798] text-white dark:text-[#141B23]"
                        : "border-[#94A3B8]/50"
                    }`}
                  >
                    {docStep.completed && <CheckCircle2 className="w-3 h-3" />}
                  </span>
                  <span
                    className={`font-semibold leading-snug ${
                      docStep.completed
                        ? "text-[#1E293B] dark:text-[#F1F5F9]"
                        : "text-[#64748B] dark:text-[#94A3B8]"
                    }`}
                  >
                    {docStep.label}
                  </span>
                </button>

                {!docStep.completed && (
                  <button
                    type="button"
                    onClick={() => {
                      if (docStep.actionKind === "upload_doc") {
                        setProfileSubTab("docs");
                        setActiveTab("profile");
                      } else if (docStep.actionKind === "draft_letter") {
                        if (docStep.recommendedTemplateId) {
                          setActiveTemplateId(docStep.recommendedTemplateId);
                        }
                        setActiveTab("templates");
                      } else {
                        startChatAboutCase(c);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F59E42]/15 dark:bg-[#FBB063]/15 border border-[#F59E42]/40 dark:border-[#FBB063]/40 text-[#F59E42] dark:text-[#FBB063] text-[10px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {docStep.actionKind === "upload_doc" ? (
                      <>
                        <Upload className="w-2.5 h-2.5" />
                        <span>{locale === "pl" ? "Dodaj" : "Upload"}</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        <span>{locale === "pl" ? "Uzupełnij" : "Complete"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Items Section */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2E6F57] dark:text-[#52B798] flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-[#F59E42] dark:text-[#FBB063]" />
            <span>
              {locale === "pl"
                ? `Przypięte elementy z czatu (${pinnedItems.length})`
                : locale === "ro"
                ? `Elemente fixate din chat (${pinnedItems.length})`
                : `Pinned Items (${pinnedItems.length})`}
            </span>
          </h4>

          {pinnedItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E2E8F0] dark:border-[#2C3847] bg-[#F8FAFC] dark:bg-[#141B23] p-3.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
              {locale === "pl"
                ? "Brak przypiętych wiadomości. Przytrzymaj dowolny dymek na czacie i wybierz „Przypnij do sprawy”."
                : locale === "ro"
                ? "Niciun mesaj fixat. Ține apăsat pe o bulă din chat și alege „Pin to Case”."
                : "No pinned chat excerpts yet. Long-press any chat bubble and select 'Pin to Case' to save advice here."}
            </div>
          ) : (
            <div className="space-y-2 pl-3 border-l-2 border-[#F59E42] dark:border-[#FBB063]">
              {pinnedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F8FAFC] dark:bg-[#141B23] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                          item.role === "assistant"
                            ? "bg-[#0D9488]/10 dark:bg-[#2DD4BF]/15 text-[#0D9488] dark:text-[#2DD4BF] border-[#0D9488]/30 dark:border-[#2DD4BF]/30"
                            : "bg-[#F59E42]/10 dark:bg-[#FBB063]/15 text-[#F59E42] dark:text-[#FBB063] border-[#F59E42]/30 dark:border-[#FBB063]/30"
                        }`}
                      >
                        <Pin className="w-2.5 h-2.5 shrink-0" />
                        <span>{item.senderName}</span>
                      </span>
                      <span className="font-mono text-[10px] tabular-nums truncate">
                        {item.pinnedAt}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(item.text);
                          showToast(
                            locale === "pl"
                              ? "Skopiowano przypięty fragment do schowka."
                              : locale === "ro"
                              ? "Fragmentul fixat a fost copiat."
                              : "Copied pinned item to clipboard."
                          );
                        }}
                        className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0D9488] dark:hover:text-[#2DD4BF] transition-colors cursor-pointer"
                        aria-label="Copy pinned item text"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeCasePinnedItem(c.id, item.id);
                          showToast(
                            locale === "pl"
                              ? "Odpięto element ze sprawy."
                              : locale === "ro"
                              ? "Elementul a fost eliminat din caz."
                              : "Unpinned item from case."
                          );
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#F87171]/15 text-[#64748B] dark:text-[#94A3B8] hover:text-[#F87171] transition-colors cursor-pointer"
                        aria-label="Unpin item from case"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[#1E293B] dark:text-[#F1F5F9] leading-relaxed whitespace-pre-wrap">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline / Case Notes */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#0D9488] dark:text-[#2DD4BF]" />
            {t("caseNotes")} ({c.notes.length})
          </h4>

          {c.notes.length > 0 && (
            <div className="space-y-2 pl-3 border-l-2 border-[#0D9488] dark:border-[#2DD4BF]">
              {c.notes.map((n) => (
                <div
                  key={n.id}
                  className="bg-[#F8FAFC] dark:bg-[#141B23] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2C3847] text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#94A3B8] mb-1 tabular-nums">
                    <span className="font-bold text-[#2E6F57] dark:text-[#52B798]">
                      {n.author}
                    </span>
                    <span className="font-mono">{n.date}</span>
                  </div>
                  <p className="text-[#1E293B] dark:text-[#F1F5F9]">{n.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={noteInputMap[c.id] || ""}
              onChange={(e) =>
                setNoteInputMap((prev) => ({
                  ...prev,
                  [c.id]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddNote(c.id);
              }}
              placeholder={t("addCaseNotePlaceholder")}
              className="flex-1 min-h-[44px] bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] rounded-xl px-3.5 py-2 text-xs text-[#1E293B] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] dark:focus:border-[#2DD4BF]"
            />
            <button
              type="button"
              onClick={() => handleAddNote(c.id)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F59E42] dark:bg-[#FBB063] text-white dark:text-[#141B23] text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t("addNoteBtn")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCaseCard = (c: WorkplaceCase) => {
    const isOpen = c.status === "open";
    const isExpanded = expandedId === c.id;
    const cDocs = boxDocsByCase[c.id] || [];
    const deadlineInfo = getDaysUntilDeadline(c);
    const stepText = computeRealCaseStep(c, cDocs);
    const relativeUpdated = formatRelativeUpdated(c.updatedAt, locale);

    const boxCounts: Record<CaseBoxCategoryId, number> = {
      contracts: 0,
      payslips: 0,
      letters: 0,
      evidence: 0,
      notes: 0,
      other: 0,
    };
    for (const d of cDocs) {
      boxCounts[d.boxId] = (boxCounts[d.boxId] || 0) + 1;
    }

    return (
      <div key={c.id} className="space-y-3">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("[data-case-info-btn='true']")) return;
            longPressTriggeredRef.current = false;
            longPressOriginRef.current = { x: e.clientX, y: e.clientY };
            if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = setTimeout(() => {
              longPressTriggeredRef.current = true;
              setPreviewCaseId(c.id);
              try {
                navigator.vibrate?.(15);
              } catch {
                // ignore
              }
            }, 420);
          }}
          onPointerMove={(e) => {
            if (!longPressOriginRef.current || !longPressTimerRef.current) return;
            const dx = e.clientX - longPressOriginRef.current.x;
            const dy = e.clientY - longPressOriginRef.current.y;
            if (Math.hypot(dx, dy) > 10) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }}
          onPointerUp={() => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }}
          onPointerCancel={() => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }}
          onClick={() => {
            if (longPressTriggeredRef.current) {
              longPressTriggeredRef.current = false;
              return;
            }
            const nextExpanded = isExpanded ? null : c.id;
            setExpandedId(nextExpanded);
            if (nextExpanded) setActiveCaseId(c.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const nextExpanded = isExpanded ? null : c.id;
              setExpandedId(nextExpanded);
              if (nextExpanded) setActiveCaseId(c.id);
            }
          }}
          className={`w-full text-left bg-[#FFFFFF] dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] border-l-[3px] ${
            isOpen
              ? "border-l-[#0D9488] dark:border-l-[#2DD4BF]"
              : "border-l-[#2E6F57] dark:border-l-[#52B798]"
          } ${
            isExpanded ? "ring-1 ring-[#0D9488]/35 dark:ring-[#2DD4BF]/35" : ""
          } rounded-[16px] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-none transition-colors cursor-pointer select-none space-y-1.5`}
        >
          {/* Row 1: Title + discreet ⓘ trigger */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[16px] font-bold text-[#1E293B] dark:text-[#F1F5F9] leading-snug truncate min-w-0">
              {c.title}
            </h3>
            <button
              type="button"
              data-case-info-btn="true"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewCaseId(c.id);
              }}
              aria-label={`${t("casesPreviewAction")}: ${c.title}`}
              title={t("casesPreviewAction")}
              className="min-w-[44px] min-h-[44px] -my-2 -mr-2 rounded-xl flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-[#0D9488] dark:hover:text-[#2DD4BF] transition-colors shrink-0 cursor-pointer"
            >
              <Info className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* Row 2: 12px meta (employer · sector · updated) + real Step X of 4 */}
          <div className="text-[12px] text-[#64748B] dark:text-[#94A3B8] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-snug">
            <span className="truncate max-w-full font-medium text-[#1E293B]/80 dark:text-[#F1F5F9]/85">
              {c.employer}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{c.sector}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[11px]">{relativeUpdated}</span>
          </div>

          <div className="text-[12px] font-semibold text-[#0D9488] dark:text-[#2DD4BF]">
            {stepText}
          </div>

          {/* Row 3 (conditional): Deadline flag + countdown */}
          {deadlineInfo && (
            <div
              className={`flex items-center gap-1.5 text-[12px] font-bold font-mono tabular-nums pt-0.5 ${
                deadlineInfo.isUrgent
                  ? "text-[#F87171]"
                  : "text-[#F59E42] dark:text-[#FBB063]"
              }`}
            >
              <Flag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{formatDeadlineCountdown(deadlineInfo.days, locale)}</span>
              {c.deadlineLabel && (
                <span className="font-sans font-medium opacity-90 truncate">
                  · {c.deadlineLabel}
                </span>
              )}
            </div>
          )}

          {/* Row 4 (footer): Status pill left + compact 6-box counters right */}
          <div className="pt-1.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0]/70 dark:border-[#2C3847]/70">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isOpen
                  ? "bg-[#0D9488]/10 dark:bg-[#2DD4BF]/15 text-[#0D9488] dark:text-[#2DD4BF] border-[#0D9488]/30 dark:border-[#2DD4BF]/30"
                  : "bg-[#2E6F57]/10 dark:bg-[#52B798]/15 text-[#2E6F57] dark:text-[#52B798] border-[#2E6F57]/30 dark:border-[#52B798]/30"
              }`}
            >
              {isOpen ? (
                <Clock className="w-3 h-3 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3 h-3 shrink-0" />
              )}
              <span>{isOpen ? t("statusOpen") : t("statusResolved")}</span>
            </span>

            <div
              className="flex items-center flex-wrap gap-2 text-[11px] font-mono tabular-nums text-[#64748B] dark:text-[#94A3B8]"
              aria-label={t("casesPreviewBoxesTitle")}
            >
              {CASE_BOX_DEFINITIONS.map((box) => {
                const BoxIcon = getBoxIcon(box.id);
                const count = boxCounts[box.id] || 0;
                return (
                  <span
                    key={box.id}
                    title={formatBoxShortLabel(box.id, locale)}
                    className={`inline-flex items-center gap-0.5 ${
                      count > 0 ? "text-[#1E293B] dark:text-[#F1F5F9] font-semibold" : "opacity-65"
                    }`}
                  >
                    <BoxIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inline Expanded Dossier on Mobile (< lg) */}
        {isExpanded && (
          <div className="lg:hidden">{renderExpandedDossier(c)}</div>
        )}
      </div>
    );
  };

  const openCountWord =
    stats.open === 1 ? t("casesSummaryOpenSingular") : t("casesSummaryOpenPlural");
  const deadlineWeekWord =
    stats.deadlinesThisWeek === 1
      ? t("casesSummaryDeadlineWeekSingular")
      : t("casesSummaryDeadlineWeekPlural");

  const previewCaseDocs = previewCase ? boxDocsByCase[previewCase.id] || [] : [];
  const previewDeadline = previewCase ? getDaysUntilDeadline(previewCase) : null;
  const previewLastElonMsg = useMemo(() => {
    if (!previewCase) return null;
    for (let i = chatMessages.length - 1; i >= 0; i--) {
      const m = chatMessages[i];
      if (
        m.role === "assistant" &&
        m.id !== "msg_init" &&
        !m.isSystemBroadcast &&
        m.threadId === previewCase.id
      ) {
        return m.text;
      }
    }
    const assistantPinned = [...(previewCase.pinnedItems || [])]
      .reverse()
      .find((p) => p.role === "assistant");
    return assistantPinned?.text || null;
  }, [chatMessages, previewCase]);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-[#F1F5F9] truncate">
            {t("casesHeading")}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate">
            {t("casesSub")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewCaseModalOpen(true)}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#2E6F57] hover:bg-[#255C48] dark:bg-[#52B798] dark:hover:bg-[#3EA384] text-white dark:text-[#141B23] font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("newCaseBtn")}</span>
        </button>
      </div>

      {/* Single Compact 48px Summary Top Bar */}
      <div
        role="region"
        aria-label={t("casesHeading")}
        className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] shadow-[0_1px_2px_rgba(15,23,42,0.05)] dark:shadow-none flex items-center flex-wrap gap-x-2 gap-y-1 text-xs"
      >
        <button
          type="button"
          onClick={() => setStatusFilter((prev) => (prev === "open" ? "all" : "open"))}
          className={`inline-flex items-center gap-1.5 font-semibold cursor-pointer transition-colors ${
            statusFilter === "open"
              ? "text-[#0D9488] dark:text-[#2DD4BF]"
              : "text-[#1E293B] dark:text-[#F1F5F9] hover:text-[#0D9488] dark:hover:text-[#2DD4BF]"
          }`}
        >
          <span className="font-mono font-bold tabular-nums text-[#0D9488] dark:text-[#2DD4BF]">
            {stats.open}
          </span>
          <span>{openCountWord}</span>
        </button>

        <span className="text-[#94A3B8]" aria-hidden="true">
          ·
        </span>

        <button
          type="button"
          onClick={() =>
            setStatusFilter((prev) => (prev === "deadline_week" ? "all" : "deadline_week"))
          }
          className={`inline-flex items-center gap-1.5 font-semibold cursor-pointer transition-colors ${
            statusFilter === "deadline_week"
              ? "text-[#F59E42] dark:text-[#FBB063]"
              : "text-[#1E293B] dark:text-[#F1F5F9] hover:text-[#F59E42] dark:hover:text-[#FBB063]"
          }`}
        >
          <span className="font-mono font-bold tabular-nums text-[#F59E42] dark:text-[#FBB063]">
            {stats.deadlinesThisWeek}
          </span>
          <span>{deadlineWeekWord}</span>
        </button>

        <span className="text-[#94A3B8]" aria-hidden="true">
          ·
        </span>

        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className="inline-flex items-center gap-1.5 font-semibold text-[#1E293B] dark:text-[#F1F5F9] hover:text-[#2E6F57] dark:hover:text-[#52B798] cursor-pointer transition-colors"
        >
          <span className="font-mono font-bold tabular-nums text-[#2E6F57] dark:text-[#52B798]">
            {stats.totalBoxDocs}
          </span>
          <span>{t("casesSummaryDocsLabel")}</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-[#FFFFFF] dark:bg-[#1E2732] p-2.5 rounded-2xl border border-[#E2E8F0] dark:border-[#2C3847]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-[#F8FAFC] dark:bg-[#141B23] p-1 rounded-xl">
          {(
            [
              { id: "all", label: locale === "pl" ? "Wszystkie" : locale === "ro" ? "Toate" : "All", count: stats.total },
              { id: "open", label: t("statusOpen"), count: stats.open },
              { id: "resolved", label: t("statusResolved"), count: stats.resolved },
              { id: "deadline_week", label: t("casesFilterDeadlineWeek"), count: stats.deadlinesThisWeek },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? "bg-[#0D9488] dark:bg-[#2DD4BF] text-white dark:text-[#141B23]"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono opacity-80 tabular-nums">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              locale === "pl"
                ? "Szukaj sprawy lub pracodawcy..."
                : locale === "ro"
                ? "Caută caz sau angajator..."
                : "Search case or employer..."
            }
            className="w-full min-h-[40px] bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1E293B] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#94A3B8] focus:outline-none focus:border-[#0D9488] dark:focus:border-[#2DD4BF]"
          />
        </div>
      </div>

      {/* Single Simplified Cards List (plus side-by-side Dossier ONLY on lg+ when a case is expanded) */}
      {filteredCases.length === 0 ? (
        <div className="bg-[#FFFFFF] dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] rounded-2xl p-8 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-[#0D9488] dark:text-[#2DD4BF] mx-auto opacity-80" />
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{t("noCases")}</p>
        </div>
      ) : expandedCase ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-5 space-y-3">
            {filteredCases.map((c) => renderCaseCard(c))}
          </div>
          <div className="hidden lg:block lg:col-span-7 sticky top-4">
            {renderExpandedDossier(expandedCase)}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c) => renderCaseCard(c))}
        </div>
      )}

      {/* Hidden File Input for Quick Preview Sheet "Dodaj dokument" */}
      <input
        ref={previewFileInputRef}
        type="file"
        accept=".pdf,image/*,.txt,.md,.doc,.docx,.csv,.rtf,.eml"
        onChange={handlePreviewAddDocUpload}
        className="hidden"
      />

      {/* QUICK CASE PREVIEW BOTTOM SHEET (Long-press or "ⓘ", max 60dvh, swipe down or tap outside to close) */}
      {previewCase && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/55 backdrop-blur-xs"
          onClick={() => {
            setPreviewDragY(0);
            setPreviewCaseId(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={previewCase.title}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              const scrollTop = previewScrollRef.current?.scrollTop ?? 0;
              if (scrollTop <= 2) {
                previewTouchStartYRef.current = e.touches[0].clientY;
              } else {
                previewTouchStartYRef.current = null;
              }
            }}
            onTouchMove={(e) => {
              if (previewTouchStartYRef.current === null) return;
              const delta = e.touches[0].clientY - previewTouchStartYRef.current;
              if (delta > 0) {
                setPreviewDragY(Math.min(delta, 220));
              }
            }}
            onTouchEnd={() => {
              if (previewDragY > 64) {
                setPreviewDragY(0);
                setPreviewCaseId(null);
              } else {
                setPreviewDragY(0);
              }
              previewTouchStartYRef.current = null;
            }}
            style={{
              transform: previewDragY > 0 ? `translateY(${previewDragY}px)` : undefined,
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
            className="w-full max-w-2xl mx-auto max-h-[60dvh] rounded-t-3xl bg-[#FFFFFF] dark:bg-[#1E2732] border-t border-x border-[#E2E8F0] dark:border-[#2C3847] shadow-2xl flex flex-col overflow-hidden transition-transform duration-200"
          >
            {/* Drag Handle + Header */}
            <div className="shrink-0 pt-2.5 pb-2.5 px-4 border-b border-[#E2E8F0] dark:border-[#2C3847] space-y-2">
              <div className="w-10 h-1 rounded-full bg-[#CBD5E1] dark:bg-[#2C3847] mx-auto" aria-hidden="true" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        previewCase.status === "open"
                          ? "bg-[#0D9488]/10 dark:bg-[#2DD4BF]/15 text-[#0D9488] dark:text-[#2DD4BF] border-[#0D9488]/30 dark:border-[#2DD4BF]/30"
                          : "bg-[#2E6F57]/10 dark:bg-[#52B798]/15 text-[#2E6F57] dark:text-[#52B798] border-[#2E6F57]/30 dark:border-[#52B798]/30"
                      }`}
                    >
                      {previewCase.status === "open" ? t("statusOpen") : t("statusResolved")}
                    </span>
                    <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] truncate">
                      {previewCase.employer}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-[#1E293B] dark:text-[#F1F5F9] leading-snug">
                    {previewCase.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewCaseId(null)}
                  aria-label="Close preview"
                  className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9] cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div ref={previewScrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3.5">
              {previewDeadline && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-bold font-mono ${
                    previewDeadline.isUrgent
                      ? "text-[#F87171]"
                      : "text-[#F59E42] dark:text-[#FBB063]"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatDeadlineCountdown(previewDeadline.days, locale)}</span>
                  {previewCase.deadlineLabel && (
                    <span className="font-sans font-medium">· {previewCase.deadlineLabel}</span>
                  )}
                </div>
              )}

              {/* Full Description (up to 4 lines) */}
              <p className="text-xs sm:text-sm text-[#1E293B] dark:text-[#F1F5F9] leading-relaxed line-clamp-4">
                {previewCase.description}
              </p>

              {/* Last message from Elon (1-2 lines) */}
              <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488] dark:text-[#2DD4BF]">
                  {t("casesPreviewLastElon")}
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                  {previewLastElonMsg || t("casesPreviewNoElonYet")}
                </p>
              </div>

              {/* Document Boxes Breakdown */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  {t("casesPreviewBoxesTitle")}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {CASE_BOX_DEFINITIONS.map((box) => {
                    const BoxIcon = getBoxIcon(box.id);
                    const count = previewCaseDocs.filter((d) => d.boxId === box.id).length;
                    return (
                      <div
                        key={box.id}
                        className="px-2 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] flex items-center justify-between gap-1 text-[11px]"
                      >
                        <BoxIcon className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                        <span className="truncate text-[#64748B] dark:text-[#94A3B8] text-[10px]">
                          {formatBoxShortLabel(box.id, locale)}
                        </span>
                        <span className="font-mono font-bold text-[#1E293B] dark:text-[#F1F5F9] tabular-nums">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Latest 3 Documents */}
              {previewCaseDocs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    {t("casesPreviewLatestDocs")}
                  </div>
                  <ul className="space-y-1">
                    {previewCaseDocs.slice(0, 3).map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847]"
                      >
                        <span className="truncate font-medium text-[#1E293B] dark:text-[#F1F5F9]">
                          {doc.name}
                        </span>
                        <span className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8] shrink-0">
                          {doc.date}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 3 Footer Actions */}
            <div className="shrink-0 p-3 border-t border-[#E2E8F0] dark:border-[#2C3847] bg-[#F8FAFC] dark:bg-[#141B23] grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpandedId(previewCase.id);
                  setActiveCaseId(previewCase.id);
                  setPreviewCaseId(null);
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] hover:border-[#0D9488] dark:hover:border-[#2DD4BF] text-xs font-bold text-[#1E293B] dark:text-[#F1F5F9] cursor-pointer"
              >
                {t("casesPreviewOpenBtn")}
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = previewCase;
                  setPreviewCaseId(null);
                  startChatAboutCase(target);
                }}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] dark:bg-[#2DD4BF] dark:hover:bg-[#14B8A6] text-xs font-bold text-white dark:text-[#141B23] cursor-pointer"
              >
                {t("casesPreviewChatBtn")}
              </button>

              <button
                type="button"
                onClick={() => previewFileInputRef.current?.click()}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1E2732] border border-[#2E6F57] dark:border-[#52B798] text-xs font-bold text-[#2E6F57] dark:text-[#52B798] cursor-pointer"
              >
                {t("casesPreviewAddDocBtn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
