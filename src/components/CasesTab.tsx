import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { computeCaseDocumentProgress } from "../utils/caseProgress";
import {
  Briefcase,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
  Building2,
  Tag,
  Search,
  FileText,
  Pin,
  Copy,
  Trash2,
  FileCheck2,
  Upload,
  ArrowUpRight,
} from "lucide-react";

const MANUAL_DOCS_STORAGE_KEY = "ask_elon_manual_case_docs_v1";

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

  const [expandedId, setExpandedId] = useState<string | null>(
    activeCaseId || cases[0]?.id || null
  );
  const [noteInputMap, setNoteInputMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [manualCompletedDocs, setManualCompletedDocs] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(MANUAL_DOCS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (activeCaseId) {
      setExpandedId(activeCaseId);
    }
  }, [activeCaseId]);

  const toggleManualDocCompletion = (docItemId: string) => {
    setManualCompletedDocs((prev) => {
      const next = prev.includes(docItemId)
        ? prev.filter((id) => id !== docItemId)
        : [...prev, docItemId];
      try {
        localStorage.setItem(MANUAL_DOCS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const stats = useMemo(() => {
    const total = cases.length;
    const open = cases.filter((c) => c.status === "open").length;
    const resolved = cases.filter((c) => c.status === "resolved").length;
    const totalNotes = cases.reduce((acc, c) => acc + c.notes.length, 0);
    const totalPinned = cases.reduce((acc, c) => acc + (c.pinnedItems?.length || 0), 0);
    return { total, open, resolved, totalNotes, totalPinned };
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
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

  const handleAddNote = (caseId: string) => {
    const text = noteInputMap[caseId] || "";
    if (!text.trim()) return;
    addCaseNote(caseId, text.trim());
    setNoteInputMap((prev) => ({ ...prev, [caseId]: "" }));
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#F1F5F9]">
            {t("casesHeading")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-0.5">
            {t("casesSub")}
          </p>
        </div>

        <button
          onClick={() => setIsNewCaseModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#1D6852] hover:bg-[#258066] text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t("newCaseBtn")}
        </button>
      </div>

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block">
            {locale === "pl" ? "Wszystkie sprawy" : locale === "ro" ? "Toate cazurile" : "Total Cases"}
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-[#F1F5F9] tabular-nums mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block">
            {locale === "pl" ? "W toku (Aktywne)" : locale === "ro" ? "În lucru" : "Active / Open"}
          </span>
          <span className="text-xl font-extrabold text-[#D97724] tabular-nums mt-1 block">
            {stats.open}
          </span>
        </div>

        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block">
            {locale === "pl" ? "Rozwiązane" : locale === "ro" ? "Rezolvate" : "Resolved"}
          </span>
          <span className="text-xl font-extrabold text-[#1D6852] dark:text-[#38B28B] tabular-nums mt-1 block">
            {stats.resolved}
          </span>
        </div>

        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] block">
            {locale === "pl"
              ? "Przypięte i notatki"
              : locale === "ro"
              ? "Elemente fixate & note"
              : "Pinned & Timeline"}
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-[#F1F5F9] tabular-nums mt-1 block">
            {stats.totalPinned + stats.totalNotes}
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#131B2E] p-3 rounded-2xl border border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl">
          {(
            [
              { id: "all", label: locale === "pl" ? "Wszystkie" : "All", count: stats.total },
              { id: "open", label: t("statusOpen"), count: stats.open },
              { id: "resolved", label: t("statusResolved"), count: stats.resolved },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#1D6852] text-white"
                  : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-80 tabular-nums">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              locale === "pl"
                ? "Szukaj sprawy lub pracodawcy..."
                : "Search case or employer..."
            }
            className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#38B28B]"
          />
        </div>
      </div>

      {/* Cases Dossier List + Sidebar Progress Cards */}
      {filteredCases.length === 0 ? (
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-8 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-[#38B28B] mx-auto opacity-80" />
          <p className="text-sm text-slate-500 dark:text-[#94A3B8]">{t("noCases")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT SIDEBAR: Compact Case Cards with Subtle Document Completion Progress Indicator */}
          <aside
            aria-label={
              locale === "pl"
                ? "Lista spraw i postęp wymaganych dokumentów"
                : "Cases sidebar and document completion progress"
            }
            className="lg:col-span-4 space-y-2.5"
          >
            <div className="px-1 flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[#38B28B]" />
                <span>
                  {locale === "pl"
                    ? "Twoje sprawy · Postęp dokumentów"
                    : locale === "ro"
                    ? "Dosare · Progres documente"
                    : "Case Cards · Document Progress"}
                </span>
              </span>
              <span className="font-mono tabular-nums">{filteredCases.length}</span>
            </div>

            {filteredCases.map((c) => {
              const isSelected = expandedId === c.id;
              const isOpen = c.status === "open";
              const progress = caseProgressMap[c.id];
              const isComplete = progress.percentage === 100;

              return (
                <button
                  key={`sidebar_${c.id}`}
                  type="button"
                  onClick={() => {
                    setExpandedId(c.id);
                    setActiveCaseId(c.id);
                  }}
                  className={`w-full text-left rounded-2xl p-3.5 border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? "bg-white dark:bg-[#152238] border-[#1D6852] dark:border-[#38B28B] ring-1 ring-[#38B28B]/35 shadow-sm"
                      : "bg-white/90 dark:bg-[#131B2E]/90 hover:bg-white dark:hover:bg-[#1A243B] border-slate-200/80 dark:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        isOpen
                          ? "bg-[#D97724]/15 text-[#D97724] border-[#D97724]/30"
                          : "bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border-[#38B28B]/30"
                      }`}
                    >
                      {isOpen ? (
                        <Clock className="w-2.5 h-2.5" />
                      ) : (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      )}
                      {isOpen ? t("statusOpen") : t("statusResolved")}
                    </span>

                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8] truncate">
                      {c.employer}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F1F5F9] line-clamp-2 leading-snug">
                    {c.title}
                  </div>

                  {/* Subtle Required-Documents Completion Progress Indicator */}
                  <div className="pt-1 space-y-1.5 border-t border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2 text-[10.5px]">
                      <span className="text-slate-600 dark:text-[#94A3B8] font-medium truncate">
                        {progress.statusLabel}
                      </span>
                      <span
                        className={`font-mono tabular-nums font-extrabold shrink-0 ${
                          isComplete
                            ? "text-[#1D6852] dark:text-[#38B28B]"
                            : "text-[#D97724]"
                        }`}
                      >
                        {progress.percentage}%
                      </span>
                    </div>

                    {/* Segmented 4-Step Subtle Progress Track */}
                    <div
                      role="progressbar"
                      aria-valuenow={progress.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={progress.statusLabel}
                      className="grid grid-cols-4 gap-1 h-1.5"
                    >
                      {progress.items.map((docStep) => (
                        <span
                          key={docStep.id}
                          title={`${docStep.shortLabel}: ${
                            docStep.completed
                              ? locale === "pl"
                                ? "Gotowe"
                                : "Ready"
                              : locale === "pl"
                              ? "Do uzupełnienia"
                              : "Pending"
                          }`}
                          className={`h-full rounded-full transition-colors ${
                            docStep.completed
                              ? "bg-[#1D6852] dark:bg-[#38B28B]"
                              : "bg-slate-200 dark:bg-white/10"
                          }`}
                        />
                      ))}
                    </div>

                    {progress.nextMissingDocLabel ? (
                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-[#94A3B8]">
                        <span className="truncate">
                          {locale === "pl"
                            ? `Brakuje: ${progress.nextMissingDocLabel}`
                            : locale === "ro"
                            ? `Lipsește: ${progress.nextMissingDocLabel}`
                            : `Next needed: ${progress.nextMissingDocLabel}`}
                        </span>
                        <span className="text-[#D97724] font-semibold shrink-0">→</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-semibold text-[#1D6852] dark:text-[#38B28B] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>
                          {locale === "pl"
                            ? "Gotowe do złożenia roszczenia"
                            : locale === "ro"
                            ? "Gata pentru depunerea cererii"
                            : "Ready to submit legal claim"}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </aside>

          {/* RIGHT MAIN WORKSPACE: Detailed Case Cards & Document Completion Checklist */}
          <div className="lg:col-span-8 space-y-3.5">
            {filteredCases.map((c) => {
              const isExpanded = expandedId === c.id;
              const isOpen = c.status === "open";
              const pinnedItems = c.pinnedItems || [];
              const progress = caseProgressMap[c.id];
              const isComplete = progress.percentage === 100;

              return (
                <div
                  key={c.id}
                  className={`bg-white dark:bg-[#131B2E] border rounded-2xl overflow-hidden transition-all ${
                    isExpanded
                      ? "border-[#1D6852]/50 dark:border-[#38B28B]/50 shadow-sm"
                      : "border-slate-200/80 dark:border-white/10 hover:border-[#38B28B]/40"
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => {
                      const nextExpanded = isExpanded ? null : c.id;
                      setExpandedId(nextExpanded);
                      if (nextExpanded) setActiveCaseId(c.id);
                    }}
                    className="p-4 sm:p-5 cursor-pointer flex items-start justify-between gap-4"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                            isOpen
                              ? "bg-[#D97724]/15 text-[#D97724] border-[#D97724]/30"
                              : "bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border-[#38B28B]/30"
                          }`}
                        >
                          {isOpen ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {isOpen ? t("statusOpen") : t("statusResolved")}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-[#94A3B8] bg-slate-100 dark:bg-[#0B0F17]/70 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-white/5">
                          <Building2 className="w-3 h-3 text-[#38B28B]" />
                          {c.employer}
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-[#94A3B8] bg-slate-100 dark:bg-[#0B0F17]/70 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-white/5">
                          <Tag className="w-3 h-3 text-[#D97724]" />
                          {c.sector}
                        </span>

                        {/* Subtle Document Completion Pill on Header */}
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md border font-mono tabular-nums ${
                            isComplete
                              ? "bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border-[#38B28B]/35"
                              : "bg-[#D97724]/15 text-[#D97724] border-[#D97724]/35"
                          }`}
                        >
                          <FileCheck2 className="w-3 h-3 shrink-0" />
                          <span>
                            {locale === "pl"
                              ? `Dokumenty: ${progress.completedCount}/${progress.totalCount} (${progress.percentage}%)`
                              : locale === "ro"
                              ? `Documente: ${progress.completedCount}/${progress.totalCount} (${progress.percentage}%)`
                              : `Docs: ${progress.completedCount}/${progress.totalCount} (${progress.percentage}%)`}
                          </span>
                        </span>

                        {pinnedItems.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D6852] dark:text-[#38B28B] bg-[#1D6852]/15 px-2.5 py-0.5 rounded-md border border-[#38B28B]/35">
                            <Pin className="w-3 h-3 shrink-0" />
                            <span>
                              {locale === "pl"
                                ? `Przypięte: ${pinnedItems.length}`
                                : locale === "ro"
                                ? `Fixate: ${pinnedItems.length}`
                                : `Pinned: ${pinnedItems.length}`}
                            </span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F1F5F9] leading-snug">
                        {c.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] line-clamp-2">
                        {c.description}
                      </p>

                      {/* Subtle Progress Bar Strip inside Card Header */}
                      <div className="pt-1 max-w-md space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#0B0F17] overflow-hidden border border-slate-200/60 dark:border-white/5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isComplete
                                ? "bg-gradient-to-r from-[#1D6852] to-[#38B28B]"
                                : "bg-gradient-to-r from-[#D97724] to-[#38B28B]"
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      className="p-2 rounded-xl bg-slate-100 dark:bg-[#0B0F17]/60 text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white shrink-0 cursor-pointer"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Dossier Content */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-3 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#0B0F17]/40 space-y-5">
                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          onClick={() => startChatAboutCase(c)}
                          className="inline-flex items-center gap-2 bg-[#1D6852] hover:bg-[#258066] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {t("askElonAboutCase")}
                        </button>

                        <button
                          onClick={() =>
                            updateCaseStatus(c.id, isOpen ? "resolved" : "open")
                          }
                          className="inline-flex items-center gap-1.5 bg-white dark:bg-[#1A243B] hover:bg-slate-100 dark:hover:bg-[#1E2942] text-slate-700 dark:text-[#F1F5F9] border border-slate-200 dark:border-white/10 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#38B28B]" />
                          {isOpen ? t("markResolved") : t("reopenCase")}
                        </button>
                      </div>

                      {/* Required Legal Claim Documents Checklist & Progress Tracker */}
                      <div className="rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 p-3.5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <FileCheck2 className="w-4 h-4 text-[#38B28B]" />
                            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-[#F1F5F9]">
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
                                ? "text-[#1D6852] dark:text-[#38B28B]"
                                : "text-[#D97724]"
                            }`}
                          >
                            {progress.completedCount}/{progress.totalCount} ({progress.percentage}%)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {progress.items.map((docStep) => (
                            <div
                              key={docStep.id}
                              className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                                docStep.completed
                                  ? "bg-[#1D6852]/10 border-[#38B28B]/35 text-slate-900 dark:text-[#F1F5F9]"
                                  : "bg-slate-50 dark:bg-[#0B0F17]/70 border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-[#94A3B8]"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleManualDocCompletion(docStep.id)}
                                className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                                title={
                                  locale === "pl"
                                    ? "Kliknij, aby oznaczyć dokument jako skompletowany / niekompletny"
                                    : "Click to toggle document completion status"
                                }
                              >
                                <span
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                                    docStep.completed
                                      ? "bg-[#1D6852] border-[#38B28B] text-white"
                                      : "border-slate-400 dark:border-white/25"
                                  }`}
                                >
                                  {docStep.completed && <CheckCircle2 className="w-3 h-3" />}
                                </span>
                                <span
                                  className={`font-semibold leading-snug ${
                                    docStep.completed
                                      ? "text-slate-900 dark:text-[#F1F5F9]"
                                      : "text-slate-600 dark:text-[#94A3B8]"
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
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#D97724]/15 hover:bg-[#D97724]/25 border border-[#D97724]/40 text-[#D97724] text-[10px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
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

                      {/* Dedicated Pinned Items Section (Populated via 'Pin to Case' in Chat Bubble Context Menu) */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D6852] dark:text-[#38B28B] flex items-center gap-1.5">
                            <Pin className="w-3.5 h-3.5 text-[#D97724]" />
                            <span>
                              {locale === "pl"
                                ? `Przypięte elementy z czatu · Pinned Items (${pinnedItems.length})`
                                : locale === "ro"
                                ? `Elemente fixate din chat · Pinned Items (${pinnedItems.length})`
                                : `Pinned Items (${pinnedItems.length})`}
                            </span>
                          </h4>
                        </div>

                        {pinnedItems.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-white/60 dark:bg-[#131B2E]/60 p-3.5 text-xs text-slate-500 dark:text-[#94A3B8]">
                            {locale === "pl"
                              ? "Brak przypiętych wiadomości. Przytrzymaj lub kliknij prawym przyciskiem myszy dowolny dymek na czacie i wybierz „Przypnij do sprawy (Pin to Case)”."
                              : locale === "ro"
                              ? "Niciun mesaj fixat. Ține apăsat sau dă clic dreapta pe o bulă din chat și alege „Pin to Case”."
                              : "No pinned chat excerpts yet. Long-press or right-click any chat bubble and select 'Pin to Case' to save key advice or evidence here."}
                          </div>
                        ) : (
                          <div className="space-y-2 pl-3 border-l-2 border-[#D97724]">
                            {pinnedItems.map((item) => (
                              <div
                                key={item.id}
                                className="bg-white dark:bg-[#131B2E] p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs space-y-1.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                        item.role === "assistant"
                                          ? "bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border border-[#38B28B]/30"
                                          : "bg-[#D97724]/15 text-[#D97724] border border-[#D97724]/30"
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
                                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-[#94A3B8] hover:text-[#1D6852] dark:hover:text-[#38B28B] transition-colors cursor-pointer"
                                      title={locale === "pl" ? "Kopiuj tekst" : "Copy text"}
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
                                      className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-500 dark:text-[#94A3B8] hover:text-red-500 transition-colors cursor-pointer"
                                      title={locale === "pl" ? "Odepnij ze sprawy" : "Unpin from case"}
                                      aria-label="Unpin item from case"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-slate-800 dark:text-[#F1F5F9] leading-relaxed whitespace-pre-wrap">
                                  {item.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Timeline / Case Notes */}
                      <div className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#38B28B]" />
                          {t("caseNotes")} ({c.notes.length})
                        </h4>

                        {c.notes.length > 0 && (
                          <div className="space-y-2 pl-3 border-l-2 border-[#1D6852]">
                            {c.notes.map((n) => (
                              <div
                                key={n.id}
                                className="bg-white dark:bg-[#131B2E] p-3 rounded-xl border border-slate-200/80 dark:border-white/5 text-xs"
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#94A3B8] mb-1 tabular-nums">
                                  <span className="font-bold text-[#1D6852] dark:text-[#38B28B]">
                                    {n.author}
                                  </span>
                                  <span>{n.date}</span>
                                </div>
                                <p className="text-slate-800 dark:text-[#F1F5F9]">{n.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Note Input */}
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
                            className="flex-1 bg-white dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#38B28B]"
                          />
                          <button
                            onClick={() => handleAddNote(c.id)}
                            className="px-3.5 py-2 rounded-xl bg-[#D97724] hover:bg-[#C2651A] text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {t("addNoteBtn")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
