import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  FileText,
  Scale,
  Copy,
  Check,
  BookmarkCheck,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Tag,
  Plus,
  Filter,
  Trash2,
  Download,
  ArrowUpDown,
  Search,
  FolderArchive,
} from "lucide-react";
import { LegalTemplate, SentLetter, SentLetterCategoryTag, Locale } from "../types";
import { SENT_LETTER_TAG_CATEGORIES, getSentLetterTagMeta } from "../data/legalTemplates";
import { downloadLetterAsPDF } from "../utils/pdfGenerator";

function getTemplateTitle(tpl: LegalTemplate, locale: Locale): string {
  if (locale === "pl") return tpl.titlePl || tpl.titleEn;
  if (locale === "ro") return tpl.titleRo || tpl.titleEn;
  return tpl.titleEn;
}

function getTemplateDesc(tpl: LegalTemplate, locale: Locale): string {
  if (locale === "pl") return tpl.descriptionPl || tpl.descriptionEn;
  if (locale === "ro") return tpl.descriptionRo || tpl.descriptionEn;
  return tpl.descriptionEn;
}

export const TemplatesTab: React.FC = () => {
  const {
    templates,
    activeTemplateId,
    setActiveTemplateId,
    user,
    sentLetters,
    saveSentLetter,
    removeSentLetter,
    toggleSentLetterTag,
    showToast,
    setIsLetterDrafting,
    savedLetterDraft,
    saveCurrentLetterDraft,
    locale,
    t,
  } = useApp();

  // Top-level Segregated View Switcher: "catalog" vs "archive"
  const [activeView, setActiveView] = useState<"catalog" | "archive">("catalog");

  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(() => {
    if (activeTemplateId) {
      return templates.find((tpl) => tpl.id === activeTemplateId) || null;
    }
    if (savedLetterDraft) {
      return templates.find((tpl) => tpl.id === savedLetterDraft.templateId) || null;
    }
    return null;
  });

  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    if (savedLetterDraft?.formValues) return savedLetterDraft.formValues;
    return {};
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [selectedArchiveTag, setSelectedArchiveTag] = useState<"ALL" | SentLetterCategoryTag>("ALL");
  const [archiveSortOrder, setArchiveSortOrder] = useState<"newest" | "oldest">("newest");
  const [expandedArchiveLetterId, setExpandedArchiveLetterId] = useState<string | null>(null);
  const [tagMenuOpenForId, setTagMenuOpenForId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync when activeTemplateId is triggered from ChatTab
  useEffect(() => {
    if (activeTemplateId) {
      const found = templates.find((tpl) => tpl.id === activeTemplateId);
      if (found) {
        setSelectedTemplate(found);
        const initialVals: Record<string, string> = {
          ...found.defaults,
          employee_name: user.fullName || found.defaults.employee_name || "",
          job_title: user.jobTitle || found.defaults.job_title || "",
          employer_name: user.employerName || found.defaults.employer_name || "",
        };
        setFormValues(initialVals);
      }
      setActiveTemplateId(null);
    }
  }, [activeTemplateId, templates, user, setActiveTemplateId]);

  useEffect(() => {
    setIsLetterDrafting(Boolean(selectedTemplate));
    return () => setIsLetterDrafting(false);
  }, [selectedTemplate, setIsLetterDrafting]);

  const handleSelectTemplate = (tpl: LegalTemplate) => {
    setSelectedTemplate(tpl);
    const initialVals: Record<string, string> = {
      ...tpl.defaults,
      employee_name: user.fullName || tpl.defaults.employee_name || "",
      job_title: user.jobTitle || tpl.defaults.job_title || "",
      employer_name: user.employerName || tpl.defaults.employer_name || "",
    };
    setFormValues(initialVals);
  };

  const generateEnglishLetter = (tpl: LegalTemplate): string => {
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let body = tpl.letter;
    const merged: Record<string, string> = {
      ...tpl.defaults,
      ...formValues,
      employee_name: formValues.employee_name || user.fullName || "[Employee Name]",
      job_title: formValues.job_title || user.jobTitle || "[Job Title]",
      employer_name: formValues.employer_name || user.employerName || "[Employer Name]",
      date: today,
    };

    Object.entries(merged).forEach(([key, val]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
      body = body.replace(regex, val || `[${key}]`);
    });

    return body;
  };

  useEffect(() => {
    if (selectedTemplate) {
      saveCurrentLetterDraft({
        templateId: selectedTemplate.id,
        formValues,
        renderedLetter: generateEnglishLetter(selectedTemplate),
        updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }
  }, [selectedTemplate, formValues, saveCurrentLetterDraft]);

  const categories = ["All", ...Array.from(new Set(templates.map((tpl) => tpl.category)))];

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (selectedCategory !== "All" && tpl.category !== selectedCategory) return false;
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase();
        const title = getTemplateTitle(tpl, locale).toLowerCase();
        const desc = getTemplateDesc(tpl, locale).toLowerCase();
        const law = tpl.statutoryReference.toLowerCase();
        return title.includes(q) || desc.includes(q) || law.includes(q);
      }
      return true;
    });
  }, [templates, selectedCategory, catalogSearch, locale]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast(t("copiedToast"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSent = (tpl: LegalTemplate) => {
    const content = generateEnglishLetter(tpl);
    saveSentLetter({
      templateId: tpl.id,
      title: getTemplateTitle(tpl, locale),
      recipient: formValues.employer_name || user.employerName,
      content,
      statutoryReference: tpl.statutoryReference,
    });
  };

  const handleDownloadLetterPdf = (letter: SentLetter) => {
    downloadLetterAsPDF(
      {
        title: letter.title,
        recipient: letter.recipient,
        date: letter.date,
        statutoryReference: letter.statutoryReference,
        categoryLabel: letter.primaryTag,
        content: letter.content,
      },
      user
    );
    showToast(
      locale === "pl"
        ? "Pobrano oficjalny dokument PDF gotowy do druku i wysyłki!"
        : locale === "ro"
        ? "Documentul PDF oficial a fost descărcat!"
        : "Official PDF letter downloaded!"
    );
  };

  // DETAIL BUILDER VIEW
  if (selectedTemplate) {
    const generatedLetter = generateEnglishLetter(selectedTemplate);

    return (
      <div className="p-4 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => {
              setSelectedTemplate(null);
              saveCurrentLetterDraft(null);
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#1D6852] dark:text-[#38B28B] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            {locale === "pl"
              ? "Wróć do katalogu wzorów pism"
              : locale === "ro"
              ? "Înapoi la șabloane"
              : "Back to UK Letter Templates"}
          </button>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1D6852] dark:text-[#38B28B] bg-[#1D6852]/15 px-2.5 py-1 rounded-lg border border-[#38B28B]/30">
            <BookmarkCheck className="w-3.5 h-3.5" />
            {t("netDraftSavedBadge")}
          </span>
        </div>

        {/* Template Header Card */}
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border border-[#38B28B]/30">
              {selectedTemplate.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#D97724] font-semibold bg-[#D97724]/10 px-2.5 py-0.5 rounded-md border border-[#D97724]/25">
              <Scale className="w-3 h-3" />
              {selectedTemplate.statutoryReference}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-[#F1F5F9]">
            {getTemplateTitle(selectedTemplate, locale)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
            {getTemplateDesc(selectedTemplate, locale)}
          </p>
        </div>

        {/* Two-column layout on Desktop: Form Inputs Left, Live Official English Preview Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Customization Inputs */}
          <div className="lg:col-span-5 bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 space-y-4 self-start">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D6852] dark:text-[#38B28B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {t("customizeLetter")}
            </h3>

            <div className="space-y-3.5">
              {selectedTemplate.fields.map((field) => {
                const label =
                  locale === "pl"
                    ? field.labelPl
                    : locale === "ro"
                    ? field.labelRo
                    : field.labelEn;
                const val = formValues[field.key] ?? field.defaultValue ?? "";
                const isLong = val.length > 65 || field.key.includes("nature") || field.key.includes("details") || field.key.includes("resolution");

                return (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mb-1.5">
                      {label}
                    </label>
                    {isLong ? (
                      <textarea
                        rows={3}
                        value={val}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B] resize-none"
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) =>
                          setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                        className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-[#F1F5F9] focus:outline-none focus:border-[#38B28B]"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* English Formal Preview */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-[#38B28B]/30 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1D6852] dark:text-[#38B28B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D6852] dark:text-[#38B28B]">
                  {t("generatedEnglishNotice")}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleCopy(generatedLetter)}
                  className="inline-flex items-center gap-1.5 bg-[#1D6852] hover:bg-[#258066] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {t("copyLetter")}
                </button>
                <button
                  onClick={() => {
                    downloadLetterAsPDF(
                      {
                        title: selectedTemplate.titleEn,
                        recipient: formValues.employer_name || user.employerName,
                        statutoryReference: selectedTemplate.statutoryReference,
                        categoryLabel: selectedTemplate.category,
                        content: generatedLetter,
                      },
                      user
                    );
                    showToast(
                      locale === "pl"
                        ? "Pobrano oficjalny dokument PDF!"
                        : "Official PDF letter downloaded!"
                    );
                  }}
                  className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-[#1A243B] hover:bg-slate-200 dark:hover:bg-[#1E2942] text-slate-800 dark:text-[#F1F5F9] border border-slate-200 dark:border-white/15 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#38B28B]" />
                  {locale === "pl" ? "Pobierz PDF" : "Download PDF"}
                </button>
                <button
                  onClick={() => handleSaveSent(selectedTemplate)}
                  className="inline-flex items-center gap-1.5 bg-[#D97724] hover:bg-[#C2651A] text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  {t("saveToSent")}
                </button>
              </div>
            </div>

            <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-slate-800 dark:text-[#F1F5F9] bg-slate-50 dark:bg-[#131B2E]/60 p-4 rounded-xl border border-slate-200/80 dark:border-white/5 leading-relaxed overflow-x-auto">
              {generatedLetter}
            </pre>

            <div className="flex items-start gap-2 text-[11px] text-slate-500 dark:text-[#94A3B8] bg-slate-100 dark:bg-[#131B2E]/40 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 text-[#D97724] shrink-0 mt-0.5" />
              <span>
                Dane pracownika (<strong>{user.fullName}</strong>) oraz pracodawcy (
                <strong>{user.employerName}</strong>) zostały automatycznie pobrane z Twojego
                profilu.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN TEMPLATES & ARCHIVE HUB
  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header + Segregated View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#F1F5F9]">
            {t("templatesHeading")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-0.5">
            {t("templatesSub")}
          </p>
        </div>

        {/* Segregated Switcher: Katalog Wzorów vs Archiwum Pism */}
        <div className="flex items-center bg-slate-200/80 dark:bg-[#131B2E] p-1 rounded-xl border border-slate-200/80 dark:border-white/10 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setActiveView("catalog")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === "catalog"
                ? "bg-[#1D6852] text-white shadow-xs"
                : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>
              {locale === "pl"
                ? "Katalog Wzorów UK"
                : locale === "ro"
                ? "Catalog Șabloane"
                : "UK Templates"}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-black/15 text-[10px] tabular-nums">
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveView("archive")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeView === "archive"
                ? "bg-[#1D6852] text-white shadow-xs"
                : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>
              {locale === "pl"
                ? "Wygenerowane Pisma"
                : locale === "ro"
                ? "Scrisori Salvate"
                : "Saved Letters"}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-black/15 text-[10px] tabular-nums">
              {sentLetters.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: UK LEGAL TEMPLATES CATALOG */}
      {activeView === "catalog" && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#131B2E] p-3 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-[#1D6852] text-white"
                      : "bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {cat === "All"
                    ? locale === "pl"
                      ? "Wszystkie"
                      : locale === "ro"
                      ? "Toate"
                      : "All"
                    : cat}
                </button>
              ))}
            </div>

            <div className="relative md:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder={
                  locale === "pl" ? "Szukaj paragrafu lub pisma..." : "Search template or statute..."
                }
                className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#38B28B]"
              />
            </div>
          </div>

          {/* 2-Column Responsive Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                className="group bg-white dark:bg-[#131B2E] hover:bg-slate-50 dark:hover:bg-[#1A243B] border border-slate-200/80 dark:border-white/10 hover:border-[#38B28B]/40 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border border-[#38B28B]/25">
                      {tpl.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#D97724] font-semibold">
                      <Scale className="w-3 h-3" />
                      {tpl.statutoryReference}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F1F5F9] group-hover:text-[#1D6852] dark:group-hover:text-[#38B28B] transition-colors">
                    {getTemplateTitle(tpl, locale)}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                    {getTemplateDesc(tpl, locale)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-xs font-bold text-[#1D6852] dark:text-[#38B28B]">
                  <span>
                    {locale === "pl"
                      ? "Otwórz generator pisma"
                      : locale === "ro"
                      ? "Deschide șablonul"
                      : "Open Letter Builder"}
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: SAVED / GENERATED LETTERS ARCHIVE */}
      {activeView === "archive" && (
        <div className="space-y-4">
          {sentLetters.length === 0 ? (
            <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-8 text-center space-y-3">
              <FolderArchive className="w-10 h-10 text-[#38B28B] mx-auto opacity-80" />
              <p className="text-sm text-slate-600 dark:text-[#94A3B8]">
                {locale === "pl"
                  ? "Brak zapisanych pism w archiwum. Wybierz wzór z katalogu lub poproś Elona na czacie o sporządzenie dokumentu."
                  : "No saved letters yet. Generate a letter from the catalog or via Elon AI Chat."}
              </p>
            </div>
          ) : (
            <>
              {/* Category & Sort Controls */}
              <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
                    <Filter className="w-3.5 h-3.5 text-[#38B28B]" />
                    <span>
                      {locale === "pl"
                        ? "Filtruj według kategorii i sortuj"
                        : "Filter by Category & Sort"}
                    </span>
                  </div>

                  {/* Sorting Toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl border border-slate-200/80 dark:border-white/10">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#D97724] ml-1.5 mr-0.5 shrink-0" />
                    <button
                      type="button"
                      onClick={() => setArchiveSortOrder("newest")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        archiveSortOrder === "newest"
                          ? "bg-[#1D6852] text-white"
                          : "text-slate-600 dark:text-[#94A3B8]"
                      }`}
                    >
                      {locale === "pl" ? "Najnowsze" : "Newest First"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setArchiveSortOrder("oldest")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        archiveSortOrder === "oldest"
                          ? "bg-[#1D6852] text-white"
                          : "text-slate-600 dark:text-[#94A3B8]"
                      }`}
                    >
                      {locale === "pl" ? "Najstarsze" : "Oldest First"}
                    </button>
                  </div>
                </div>

                {/* Tag Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedArchiveTag("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      selectedArchiveTag === "ALL"
                        ? "bg-[#1D6852] text-white"
                        : "bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-[#94A3B8]"
                    }`}
                  >
                    {locale === "pl" ? "Wszystkie" : "All"} ({sentLetters.length})
                  </button>
                  {SENT_LETTER_TAG_CATEGORIES.map((tagId: SentLetterCategoryTag) => {
                    const count = sentLetters.filter(
                      (s) => s.primaryTag === tagId || (s.tags && s.tags.includes(tagId))
                    ).length;
                    if (count === 0) return null;
                    const meta = getSentLetterTagMeta(tagId, locale);
                    return (
                      <button
                        key={tagId}
                        onClick={() => setSelectedArchiveTag(tagId)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                          selectedArchiveTag === tagId
                            ? "bg-[#1D6852] text-white"
                            : "bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-[#94A3B8]"
                        }`}
                      >
                        {meta.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Archive Cards */}
              <div className="space-y-3">
                {sentLetters
                  .map((s, originalIdx) => ({ s, originalIdx }))
                  .filter(
                    ({ s }) =>
                      selectedArchiveTag === "ALL" ||
                      s.primaryTag === selectedArchiveTag ||
                      (s.tags && s.tags.includes(selectedArchiveTag))
                  )
                  .sort((a, b) => {
                    const timeA = Date.parse(a.s.date);
                    const timeB = Date.parse(b.s.date);
                    if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
                      return archiveSortOrder === "newest" ? timeB - timeA : timeA - timeB;
                    }
                    return archiveSortOrder === "newest"
                      ? a.originalIdx - b.originalIdx
                      : b.originalIdx - a.originalIdx;
                  })
                  .map(({ s }) => {
                    const isExpanded = expandedArchiveLetterId === s.id;
                    const isTagMenuOpen = tagMenuOpenForId === s.id;
                    const letterTags: SentLetterCategoryTag[] =
                      s.tags && s.tags.length > 0 ? s.tags : [s.primaryTag || "Grievance"];

                    return (
                      <div
                        key={s.id}
                        className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {letterTags.map((tagId) => {
                                const meta = getSentLetterTagMeta(tagId, locale);
                                return (
                                  <span
                                    key={tagId}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1D6852]/15 text-[#1D6852] dark:text-[#38B28B] border border-[#38B28B]/25"
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    {meta.label}
                                  </span>
                                );
                              })}
                              <button
                                onClick={() =>
                                  setTagMenuOpenForId(isTagMenuOpen ? null : s.id)
                                }
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/10"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                {locale === "pl" ? "Kategoria" : "Tag"}
                              </button>
                            </div>

                            <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-[#F1F5F9]">
                              {s.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                              {t("recipientLabel")}:{" "}
                              <strong className="text-slate-800 dark:text-[#F1F5F9]">
                                {s.recipient}
                              </strong>{" "}
                              · {s.date}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <button
                              onClick={() =>
                                setExpandedArchiveLetterId(isExpanded ? null : s.id)
                              }
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1A243B] hover:bg-slate-200 dark:hover:bg-[#1E2942] text-xs font-bold text-slate-800 dark:text-[#F1F5F9] transition-colors"
                            >
                              {isExpanded
                                ? locale === "pl"
                                  ? "Ukryj treść"
                                  : "Hide"
                                : locale === "pl"
                                ? "Podgląd"
                                : "View"}
                            </button>
                            <button
                              onClick={() => handleDownloadLetterPdf(s)}
                              className="px-3 py-1.5 rounded-xl bg-[#D97724] hover:bg-[#C2651A] text-white text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              PDF
                            </button>
                            <button
                              onClick={() => handleCopy(s.content)}
                              className="px-3 py-1.5 rounded-xl bg-[#1D6852] hover:bg-[#258066] text-white text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              {t("copyLetter")}
                            </button>
                            <button
                              onClick={() => removeSentLetter(s.id)}
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#0B0F17] text-slate-400 hover:text-red-500 transition-colors"
                              aria-label="Delete letter"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {isTagMenuOpen && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-white/10 flex flex-wrap items-center gap-1.5">
                            {SENT_LETTER_TAG_CATEGORIES.map((tagId: SentLetterCategoryTag) => {
                              const active = letterTags.includes(tagId);
                              const meta = getSentLetterTagMeta(tagId, locale);
                              return (
                                <button
                                  key={tagId}
                                  onClick={() => toggleSentLetterTag(s.id, tagId)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                    active
                                      ? "bg-[#1D6852] text-white"
                                      : "bg-white dark:bg-[#131B2E] text-slate-600 dark:text-[#94A3B8]"
                                  }`}
                                >
                                  {meta.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {isExpanded && (
                          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800 dark:text-[#F1F5F9] bg-slate-50 dark:bg-[#0B0F17] p-4 rounded-xl border border-slate-200 dark:border-white/10 leading-relaxed max-h-80 overflow-y-auto">
                            {s.content}
                          </pre>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
