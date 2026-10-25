import React, { useState, useEffect, useRef, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  LegalTemplate,
  LetterSentimentResult,
  SentimentFlagItem,
  SentLetter,
  SentLetterCategoryTag,
} from "../types";
import {
  renderTemplateLetter,
  SENT_LETTER_TAG_CATEGORIES,
  classifySentLetter,
  getSentLetterTagMeta,
} from "../data/legalTemplates";
import {
  analyzeLetterSentimentAI,
  runInstantClientSentimentScan,
} from "../services/geminiService";
import {
  FileText,
  Copy,
  Download,
  BookmarkCheck,
  ArrowLeft,
  Archive,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wand2,
  Loader2,
  FlaskConical,
  CheckCircle2,
  X,
  WifiOff,
  RefreshCw,
  RotateCcw,
  Mail,
  Tag,
} from "lucide-react";

export const TemplatesTab: React.FC = () => {
  const {
    templates,
    activeTemplateId,
    setActiveTemplateId,
    user,
    locale,
    t,
    saveSentLetter,
    sentLetters,
    removeSentLetter,
    setIsSentLettersModalOpen,
    showToast,
    isOnline,
    isSimulatedOffline,
    setIsSimulatedOffline,
    checkConnectionNow,
    setIsLetterDrafting,
    savedLetterDraft,
    saveCurrentLetterDraft,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSentTagFilter, setSelectedSentTagFilter] = useState<"ALL" | SentLetterCategoryTag>("ALL");
  const [activeTemplate, setActiveTemplate] = useState<LegalTemplate | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [renderedLetter, setRenderedLetter] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [fullScreenPreviewLetter, setFullScreenPreviewLetter] = useState<SentLetter | null>(null);
  const [isGeneratedSectionVisible, setIsGeneratedSectionVisible] = useState<boolean>(true);

  // Background Sentiment Analysis State
  const [sentimentResult, setSentimentResult] = useState<LetterSentimentResult | null>(null);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState<boolean>(false);
  const [pendingFinalAction, setPendingFinalAction] = useState<
    null | "generate" | "copy" | "download" | "save"
  >(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Automatically enrich all saved/sent letters with document type tags ('Grievance', 'Settlement', 'Contract', etc.)
  const enrichedSentLetters = useMemo(() => {
    return sentLetters.map((letter) => {
      const classified = classifySentLetter(letter);
      return {
        ...letter,
        primaryTag: letter.primaryTag || classified.primaryTag,
        tags: letter.tags && letter.tags.length > 0 ? letter.tags : classified.tags,
        statutoryReference: letter.statutoryReference || classified.statutoryReference,
      };
    });
  }, [sentLetters]);

  const sentLetterTagCounts = useMemo(() => {
    const counts: Record<SentLetterCategoryTag, number> = {
      Grievance: 0,
      Settlement: 0,
      Contract: 0,
      Wages: 0,
      Dismissal: 0,
      "Sick Pay": 0,
      "Data & GDPR": 0,
    };
    enrichedSentLetters.forEach((letter) => {
      const letterTags = letter.tags || (letter.primaryTag ? [letter.primaryTag] : []);
      letterTags.forEach((tg) => {
        if (counts[tg] !== undefined) {
          counts[tg] += 1;
        }
      });
    });
    return counts;
  }, [enrichedSentLetters]);

  const filteredSentLetters = useMemo(() => {
    if (selectedSentTagFilter === "ALL") return enrichedSentLetters;
    return enrichedSentLetters.filter((letter) => {
      const letterTags = letter.tags || (letter.primaryTag ? [letter.primaryTag] : []);
      return (
        letter.primaryTag === selectedSentTagFilter ||
        letterTags.includes(selectedSentTagFilter)
      );
    });
  }, [enrichedSentLetters, selectedSentTagFilter]);

  const categories = [
    { id: "All", label: t("categoryAll") },
    { id: "Grievance", label: t("categoryGrievance") },
    {
      id: "Settlement",
      label:
        locale === "pl"
          ? "Ugody (Settlement)"
          : locale === "ro"
          ? "Acorduri (Settlement)"
          : "Settlement",
    },
    { id: "Wages", label: t("categoryWages") },
    { id: "Sick", label: t("categorySick") },
    { id: "Data", label: t("categoryData") },
    { id: "Dismissal", label: t("categoryDismissal") },
  ];

  const filteredTemplates = templates.filter(
    (tpl) => selectedCategory === "All" || tpl.category === selectedCategory
  );

  // Sync active letter drafting state with AppContext so Header/Toast knows user is mid-draft
  useEffect(() => {
    setIsLetterDrafting(activeTemplate !== null);
    return () => setIsLetterDrafting(false);
  }, [activeTemplate, setIsLetterDrafting]);

  // Auto-save active template, form fields, and rendered letter to localStorage
  useEffect(() => {
    if (!activeTemplate) return;
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    saveCurrentLetterDraft({
      templateId: activeTemplate.id,
      formValues,
      renderedLetter,
      updatedAt: nowTime,
    });
    setLastSavedTime(nowTime);
  }, [activeTemplate, formValues, renderedLetter, saveCurrentLetterDraft]);

  // Background Sentiment Analysis Effect (runs automatically when formValues, renderedLetter, or connectivity changes)
  useEffect(() => {
    if (!activeTemplate) {
      setSentimentResult(null);
      setIsAnalyzingSentiment(false);
      return;
    }

    const previewText =
      renderedLetter ?? renderTemplateLetter(activeTemplate, formValues, user);
    const fieldsToScan = renderedLetter
      ? { letter_body: renderedLetter }
      : formValues;

    // 1. Instant zero-latency local scan (works 100% offline)
    const instantScan = runInstantClientSentimentScan(
      fieldsToScan,
      previewText,
      locale
    );
    setSentimentResult(instantScan);

    // If offline, rely on instant local scan and wait for reconnection to run cloud AI scan
    if (!isOnline) {
      setIsAnalyzingSentiment(false);
      return;
    }

    // 2. Debounced background server-side Gemini AI sentiment analysis when online
    setIsAnalyzingSentiment(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const title =
          locale === "pl"
            ? activeTemplate.titlePl
            : locale === "ro"
            ? activeTemplate.titleRo
            : activeTemplate.titleEn;

        const aiResult = await analyzeLetterSentimentAI(
          fieldsToScan,
          previewText,
          title,
          locale,
          controller.signal
        );
        if (!controller.signal.aborted) {
          setSentimentResult(aiResult);
          setIsAnalyzingSentiment(false);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setIsAnalyzingSentiment(false);
        }
      }
    }, 650);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formValues, renderedLetter, activeTemplate, locale, isOnline, user]);

  const startFilling = (tpl: LegalTemplate) => {
    setActiveTemplate(tpl);
    const initialValues: Record<string, string> = {};
    tpl.fields.forEach((f) => {
      if (f.key === "employee_name") initialValues[f.key] = user.fullName || f.defaultValue;
      else if (f.key === "job_title") initialValues[f.key] = user.jobTitle || f.defaultValue;
      else if (f.key === "employer_name") initialValues[f.key] = user.employerName || f.defaultValue;
      else if (f.key === "dob_or_id")
        initialValues[f.key] = `Staff ID: #${user.accountId || "ELON-89241"}, Tel: ${user.phone || "+44 7700 900342"}`;
      else initialValues[f.key] = f.defaultValue;
    });
    setFormValues(initialValues);
    setRenderedLetter(null);
    setPendingFinalAction(null);
  };

  // If navigated from Chat Legal Summary side-panel with a target template ID, open it automatically
  useEffect(() => {
    if (!activeTemplateId) return;
    const target = templates.find((tpl) => tpl.id === activeTemplateId);
    if (target) {
      startFilling(target);
      setActiveTemplateId(null);
    }
  }, [activeTemplateId, templates, setActiveTemplateId]);

  const resumeSavedDraft = () => {
    if (!savedLetterDraft) return;
    const foundTpl = templates.find((tpl) => tpl.id === savedLetterDraft.templateId);
    if (!foundTpl) return;
    setActiveTemplate(foundTpl);
    setFormValues(savedLetterDraft.formValues || {});
    setRenderedLetter(savedLetterDraft.renderedLetter ?? null);
    setLastSavedTime(savedLetterDraft.updatedAt);
    setPendingFinalAction(null);
  };

  // Replace a single flagged phrase with its diplomatic legal rewrite
  const applySingleFlagRewrite = (flag: SentimentFlagItem) => {
    if (renderedLetter) {
      const updatedLetter = renderedLetter.includes(flag.originalText)
        ? renderedLetter.replace(flag.originalText, flag.suggestedReplacement)
        : renderedLetter;
      setRenderedLetter(updatedLetter);
    } else {
      const targetKey =
        flag.fieldKey && formValues[flag.fieldKey] !== undefined
          ? flag.fieldKey
          : Object.keys(formValues).find((k) =>
              (formValues[k] || "").toLowerCase().includes(flag.originalText.toLowerCase())
            );

      if (targetKey) {
        const currentVal = formValues[targetKey] || "";
        const nextVal = currentVal.includes(flag.originalText)
          ? currentVal.replace(flag.originalText, flag.suggestedReplacement)
          : flag.suggestedReplacement;
        setFormValues((prev) => ({ ...prev, [targetKey]: nextVal }));
      }
    }
    showToast(t("applySafeRewrite"));
  };

  // Replace all flagged phrases at once
  const applyAllFlagRewrites = () => {
    if (!sentimentResult || sentimentResult.flaggedItems.length === 0) return null;

    if (renderedLetter) {
      let nextLetter = renderedLetter;
      sentimentResult.flaggedItems.forEach((flag) => {
        if (nextLetter.includes(flag.originalText)) {
          nextLetter = nextLetter.replace(flag.originalText, flag.suggestedReplacement);
        }
      });
      setRenderedLetter(nextLetter);
      showToast(t("applyAllSafeRewrites"));
      return { updatedFormValues: formValues, updatedLetter: nextLetter };
    } else {
      const nextValues = { ...formValues };
      sentimentResult.flaggedItems.forEach((flag) => {
        const targetKey =
          flag.fieldKey && nextValues[flag.fieldKey] !== undefined
            ? flag.fieldKey
            : Object.keys(nextValues).find((k) =>
                (nextValues[k] || "").toLowerCase().includes(flag.originalText.toLowerCase())
              );

        if (targetKey) {
          const cur = nextValues[targetKey] || "";
          nextValues[targetKey] = cur.includes(flag.originalText)
            ? cur.replace(flag.originalText, flag.suggestedReplacement)
            : flag.suggestedReplacement;
        }
      });
      setFormValues(nextValues);
      showToast(t("applyAllSafeRewrites"));
      const nextLetter = activeTemplate
        ? renderTemplateLetter(activeTemplate, nextValues, user)
        : null;
      return { updatedFormValues: nextValues, updatedLetter: nextLetter };
    }
  };

  // Insert sample aggressive/inflammatory text to test the background analyzer
  const insertSampleInflammatoryDraft = () => {
    if (!activeTemplate) return;
    const targetField =
      activeTemplate.fields.find(
        (f) =>
          f.key.includes("nature") ||
          f.key.includes("details") ||
          f.key.includes("breach") ||
          f.key.includes("records") ||
          f.key.includes("mitigation")
      ) || activeTemplate.fields[activeTemplate.fields.length - 1];

    if (!targetField) return;

    const sampleByLocale =
      locale === "pl"
        ? "Ten kierownik zmiany to bezczelny kłamca, idiota i złodziej!! Ukradliście moje ciężko zarobione nadgodziny i pożałujecie tego, zniszczę waszą reputację!!"
        : locale === "ro"
        ? "Managerul este un mincinos, idiot și un hoț!! Mi-ați furat orele suplimentare și o să regretați, vă distrug!!"
        : "My shift manager is a blatant liar, an idiot and a thief!! You stole my hard-earned overtime wages and I will make you pay for this!!";

    if (renderedLetter) {
      setRenderedLetter((prev) => `${prev}\n\nP.S. ${sampleByLocale}`);
    } else {
      setFormValues((prev) => ({
        ...prev,
        [targetField.key]: sampleByLocale,
      }));
    }
  };

  const hasUnresolvedFlags =
    sentimentResult !== null && sentimentResult.flaggedItems.length > 0;

  // Execute action directly or show pre-finalization intercept modal if flags exist
  const executeDirectAction = (
    action: "generate" | "copy" | "download" | "save",
    overrideLetter?: string | null
  ) => {
    if (!activeTemplate) return;
    const letterText =
      overrideLetter ??
      renderedLetter ??
      renderTemplateLetter(activeTemplate, formValues, user);

    if (action === "generate") {
      setRenderedLetter(letterText);
      const newDoc: SentLetter = {
        id: `sent_${Date.now()}`,
        templateId: activeTemplate.id,
        title: activeTemplate.titleEn,
        recipient: formValues["employer_name"] || user.employerName || "UK Employer",
        content: letterText,
        date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
      saveSentLetter(
        {
          templateId: newDoc.templateId,
          title: newDoc.title,
          recipient: newDoc.recipient,
          content: newDoc.content,
        },
        true
      );
      setIsGeneratedSectionVisible(true);
      setFullScreenPreviewLetter(newDoc);
    } else if (action === "copy") {
      navigator.clipboard.writeText(letterText);
      showToast(t("copyClipboard"));
    } else if (action === "download") {
      const blob = new Blob([letterText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTemplate.id}_${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t("downloadLetter"));
    } else if (action === "save") {
      saveSentLetter({
        templateId: activeTemplate.id,
        title: activeTemplate.titlePl || activeTemplate.titleEn,
        recipient:
          formValues["employer_name"] || user.employerName || "Pracodawca",
        content: letterText,
      });
      saveCurrentLetterDraft(null);
    }
    setPendingFinalAction(null);
  };

  const handleGuardedAction = (action: "generate" | "copy" | "download" | "save") => {
    if (hasUnresolvedFlags) {
      setPendingFinalAction(action);
      return;
    }
    executeDirectAction(action);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    handleGuardedAction("generate");
  };

  // Contextual Offline Banner when connection drops mid-letter drafting
  const renderOfflineDraftingBanner = () => {
    if (isOnline) return null;

    return (
      <div className="rounded-2xl p-4 mb-4 bg-[#EF4444]/10 border border-[#EF4444]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] shrink-0 mt-0.5">
            <WifiOff className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-extrabold text-white">
                {t("letterOfflineBannerTitle")}
              </h4>
              {lastSavedTime && (
                <span className="text-[11px] font-mono tabular-nums text-[#2EE59D] font-semibold">
                  · {t("draftAutoSaved")} ({lastSavedTime})
                </span>
              )}
            </div>
            <p className="text-xs text-[#BACADA] leading-relaxed mt-0.5">
              {t("letterOfflineBannerSub")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isSimulatedOffline) {
              setIsSimulatedOffline(false);
            } else {
              checkConnectionNow();
            }
          }}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#12304F] hover:bg-[#163a5f] border border-white/15 text-xs font-bold text-[#2EE59D] transition-colors whitespace-nowrap shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>
            {isSimulatedOffline ? t("netRestoreOnline") : t("netCheckNow")}
          </span>
        </button>
      </div>
    );
  };

  // Shared Sentiment Banner Component
  const renderSentimentShieldBanner = () => {
    if (!sentimentResult) return null;

    const status = sentimentResult.overallStatus;
    const flags = sentimentResult.flaggedItems;

    const isInflammatory = status === "inflammatory";
    const isCautionary = status === "cautionary";

    return (
      <div
        className={`rounded-2xl p-4 mb-5 border transition-all ${
          isInflammatory
            ? "bg-[#EF4444]/10 border-[#EF4444]/40"
            : isCautionary
            ? "bg-[#FF6A00]/10 border-[#FF6A00]/40"
            : "bg-[#0B6E4F]/20 border-[#2EE59D]/30"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            {isInflammatory ? (
              <div className="w-9 h-9 rounded-xl bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
            ) : isCautionary ? (
              <div className="w-9 h-9 rounded-xl bg-[#FF6A00]/20 border border-[#FF6A00]/40 flex items-center justify-center text-[#FF6A00] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#0B6E4F]/40 border border-[#2EE59D]/40 flex items-center justify-center text-[#2EE59D] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-white tracking-tight">
                  {t("sentimentGuardTitle")}
                </span>
                <span
                  className={`text-[11px] font-mono tabular-nums font-bold ${
                    isInflammatory
                      ? "text-[#EF4444]"
                      : isCautionary
                      ? "text-[#FF6A00]"
                      : "text-[#2EE59D]"
                  }`}
                >
                  ·{" "}
                  {isInflammatory
                    ? t("sentimentInflammatory")
                    : isCautionary
                    ? t("sentimentCautionary")
                    : t("sentimentSafe")}{" "}
                  ({sentimentResult.toneScore}/100)
                </span>
                {isAnalyzingSentiment && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-[#BACADA]">
                    <Loader2 className="w-3 h-3 animate-spin text-[#2EE59D]" />
                    <span>{t("sentimentScanning")}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#BACADA] mt-0.5 leading-relaxed">
                {sentimentResult.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {flags.length > 0 ? (
              <button
                type="button"
                onClick={applyAllFlagRewrites}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs shadow-md hover:opacity-95 transition-all whitespace-nowrap shrink-0"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{t("applyAllSafeRewrites")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={insertSampleInflammatoryDraft}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-[#BACADA] hover:text-white transition-colors whitespace-nowrap shrink-0"
                title={t("testInflammatoryBtn")}
              >
                <FlaskConical className="w-3.5 h-3.5 text-[#FF6A00]" />
                <span>{t("testInflammatoryBtn")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Flagged Phrases List */}
        {flags.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-white/10 space-y-2.5">
            {flags.map((flag, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#070F1A]/80 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold ${
                        flag.severity === "inflammatory"
                          ? "text-[#EF4444]"
                          : "text-[#FF6A00]"
                      }`}
                    >
                      {flag.category} ·
                    </span>
                    <span className="text-xs font-mono line-through text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded">
                      "{flag.originalText}"
                    </span>
                  </div>
                  <p className="text-[11px] text-[#BACADA] leading-relaxed">
                    {flag.reason}
                  </p>
                  <div className="text-xs text-[#2EE59D] bg-[#0B6E4F]/20 border border-[#2EE59D]/20 rounded-lg px-2.5 py-1.5 mt-1">
                    <strong className="text-white">ACAS Rewrite: </strong>"{flag.suggestedReplacement}"
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => applySingleFlagRewrite(flag)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#12304F] hover:bg-[#0B6E4F] border border-[#2EE59D]/30 text-xs font-bold text-[#2EE59D] hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{t("applySafeRewrite")}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Pre-Finalization Intercept Modal
  const renderPreFinalizationModal = () => {
    if (!pendingFinalAction || !sentimentResult) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-[#0F2C4D] border border-[#EF4444]/50 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center text-[#EF4444] shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {t("finalizeWarningTitle")}
                </h3>
                <span className="text-[11px] text-[#FF6A00] font-bold">
                  Wykryto {sentimentResult.flaggedItems.length} ryzykownych sformułowań
                </span>
              </div>
            </div>
            <button
              onClick={() => setPendingFinalAction(null)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-[#BACADA] leading-relaxed mb-4">
            {t("finalizeWarningSub")}
          </p>

          <div className="max-h-56 overflow-y-auto space-y-2.5 mb-5 pr-1">
            {sentimentResult.flaggedItems.map((flag, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#070F1A] border border-white/10 space-y-1 text-xs"
              >
                <div className="text-[#EF4444] font-mono line-through">
                  "{flag.originalText}"
                </div>
                <div className="text-[#2EE59D]">
                  → "{flag.suggestedReplacement}"
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={() => {
                const res = applyAllFlagRewrites();
                executeDirectAction(
                  pendingFinalAction,
                  res?.updatedLetter ?? undefined
                );
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs shadow-lg hover:opacity-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("neutralizeAndFinalize")}</span>
            </button>

            <button
              type="button"
              onClick={() => executeDirectAction(pendingFinalAction)}
              className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#BACADA] hover:text-white transition-colors"
            >
              {t("proceedAnyway")}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Preview Step
  if (activeTemplate && renderedLetter !== null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => setRenderedLetter(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#BACADA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("edit")}</span>
          </button>

          {lastSavedTime && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#BACADA]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2EE59D]" />
              <span>{t("draftAutoSaved")}</span>
              <span className="font-mono tabular-nums text-white/80">· {lastSavedTime}</span>
            </span>
          )}
        </div>

        {renderOfflineDraftingBanner()}
        {renderSentimentShieldBanner()}

        <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-[11px] font-semibold text-[#2EE59D]">
                {activeTemplate.statutoryReference} · {activeTemplate.category}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                {locale === "pl"
                  ? activeTemplate.titlePl
                  : locale === "ro"
                  ? activeTemplate.titleRo
                  : activeTemplate.titleEn}
              </h2>
            </div>

            {/* Finalization Actions (Guarded by Sentiment Shield) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => handleGuardedAction("copy")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12304F] hover:bg-[#153a5e] border border-white/10 text-xs font-semibold text-[#2EE59D] transition-colors whitespace-nowrap shrink-0"
                title="Kopiuj"
              >
                <Copy className="w-4 h-4" />
                <span>{t("copy")}</span>
              </button>

              <button
                onClick={() => handleGuardedAction("download")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12304F] hover:bg-[#153a5e] border border-white/10 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0"
                title="Pobierz"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz</span>
              </button>

              <a
                href={`mailto:?subject=${encodeURIComponent(
                  `${activeTemplate.titleEn} - ${user.fullName}`
                )}&body=${encodeURIComponent(renderedLetter)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143A66] hover:bg-[#19477d] border border-[#2EE59D]/40 text-xs font-extrabold text-[#2EE59D] transition-colors whitespace-nowrap shrink-0"
                title="Wyślij mailowo"
              >
                <Mail className="w-4 h-4" />
                <span>Wyślij e-mail</span>
              </a>

              <button
                onClick={() => handleGuardedAction("save")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black font-extrabold text-xs shadow-md transition-colors whitespace-nowrap shrink-0"
                title="Zapisz"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>{t("saveToSent")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRenderedLetter(null);
                  setActiveTemplate(null);
                }}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white transition-colors shrink-0"
                title="Zamknij"
                aria-label="Zamknij"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Editable Letter Sheet Display (monitored in background by Sentiment Shield) */}
          <textarea
            value={renderedLetter}
            onChange={(e) => setRenderedLetter(e.target.value)}
            rows={20}
            className="w-full p-4 sm:p-6 rounded-xl bg-[#070F1A] border border-white/10 focus:border-[#2EE59D] focus:outline-none font-mono text-xs sm:text-sm text-[#F4F8FB] leading-relaxed shadow-inner resize-y"
          />
        </div>

        {renderPreFinalizationModal()}
      </div>
    );
  }

  // Form Filling Step
  if (activeTemplate) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 pb-24">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={() => setActiveTemplate(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#BACADA] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Wróć do listy pism</span>
          </button>

          {lastSavedTime && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#BACADA]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2EE59D]" />
              <span>{t("draftAutoSaved")}</span>
              <span className="font-mono tabular-nums text-white/80">· {lastSavedTime}</span>
            </span>
          )}
        </div>

        {/* Contextual Offline Alert Banner during Letter Drafting */}
        {renderOfflineDraftingBanner()}

        {/* Live Background Sentiment Analysis Shield */}
        {renderSentimentShieldBanner()}

        <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="mb-5 pb-4 border-b border-white/10">
            <div className="text-[11px] font-semibold text-[#2EE59D]">
              {activeTemplate.statutoryReference} · {activeTemplate.category}
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              {locale === "pl"
                ? activeTemplate.titlePl
                : locale === "ro"
                ? activeTemplate.titleRo
                : activeTemplate.titleEn}
            </h2>
            <p className="text-xs text-[#BACADA] mt-1">
              {locale === "pl"
                ? activeTemplate.descriptionPl
                : locale === "ro"
                ? activeTemplate.descriptionRo
                : activeTemplate.descriptionEn}
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {activeTemplate.fields.map((field) => {
              const label =
                locale === "pl"
                  ? field.labelPl
                  : locale === "ro"
                  ? field.labelRo
                  : field.labelEn;
              const isLong =
                field.key.includes("details") ||
                field.key.includes("nature") ||
                field.key.includes("mitigation") ||
                field.key.includes("records") ||
                field.key.includes("breach") ||
                field.key.includes("resolution");

              // Check if this specific field has any flagged phrases
              const fieldFlags =
                sentimentResult?.flaggedItems.filter(
                  (f) =>
                    f.fieldKey === field.key ||
                    (formValues[field.key] || "")
                      .toLowerCase()
                      .includes(f.originalText.toLowerCase())
                ) || [];

              const hasFieldIssue = fieldFlags.length > 0;

              return (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-white">
                      {label}
                    </label>
                    {hasFieldIssue && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF6A00]">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Wykryto agresywny/emocjonalny zwrot</span>
                      </span>
                    )}
                  </div>
                  {isLong ? (
                    <textarea
                      rows={3}
                      value={formValues[field.key] || ""}
                      onChange={(e) =>
                        setFormValues({ ...formValues, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className={`w-full bg-[#12304F] border rounded-xl px-3 py-2 text-xs text-white placeholder-[#BACADA]/50 focus:outline-none transition-colors ${
                        hasFieldIssue
                          ? "border-[#EF4444] focus:border-[#FF6A00]"
                          : "border-white/10 focus:border-[#2EE59D]"
                      }`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formValues[field.key] || ""}
                      onChange={(e) =>
                        setFormValues({ ...formValues, [field.key]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      className={`w-full bg-[#12304F] border rounded-xl px-3 py-2 text-xs text-white placeholder-[#BACADA]/50 focus:outline-none transition-colors ${
                        hasFieldIssue
                          ? "border-[#EF4444] focus:border-[#FF6A00]"
                          : "border-white/10 focus:border-[#2EE59D]"
                      }`}
                    />
                  )}
                </div>
              );
            })}

            <button
              type="submit"
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-sm shadow-lg hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4.5 h-4.5" />
              <span>{t("generateLetter")}</span>
            </button>
          </form>
        </div>

        {renderPreFinalizationModal()}
      </div>
    );
  }

  const savedDraftTemplate = savedLetterDraft
    ? templates.find((tpl) => tpl.id === savedLetterDraft.templateId)
    : null;

  // Templates Gallery View
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#FF6A00]" />
            {t("templatesTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-[#BACADA] mt-0.5">
            {t("templatesSub")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isGeneratedSectionVisible && sentLetters.length > 0 && (
            <button
              onClick={() => setIsGeneratedSectionVisible(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF6A00]/20 hover:bg-[#FF6A00]/30 border border-[#FF6A00]/50 text-xs font-extrabold text-[#FF6A00] transition-colors whitespace-nowrap shrink-0"
            >
              <Mail className="w-4 h-4" />
              <span>Wygenerowane pisma ({sentLetters.length})</span>
            </button>
          )}
          <button
            onClick={() => setIsSentLettersModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0F2C4D] hover:bg-[#12304F] border border-white/10 text-xs font-semibold text-[#2EE59D] transition-colors whitespace-nowrap shrink-0"
          >
            <Archive className="w-4 h-4" />
            <span>{t("sentLettersTitle")} ({sentLetters.length})</span>
          </button>
        </div>
      </div>

      {/* DEDICATED SECTION FOR GENERATED DOCUMENTS FROM CHAT & TEMPLATES (With Automated Tagging & Close 'X' Button) */}
      {isGeneratedSectionVisible && enrichedSentLetters.length > 0 && (
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#0F2C4D] via-[#12335A] to-[#0B2038] border-2 border-[#FF6A00]/60 shadow-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#0B2038]/90 border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FF6A00]/20 border border-[#FF6A00]/50 flex items-center justify-center text-[#FF6A00] shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-extrabold text-white truncate">
                    {locale === "pl"
                      ? "Wygenerowane Pisma Gotowe do Wysłania (EN)"
                      : locale === "ro"
                      ? "Scrisori Generate Gata de Trimitere (EN)"
                      : "Generated Ready-to-Send Letters (EN)"}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-[#2EE59D] text-[#070F1A] font-extrabold text-[10px]">
                    {enrichedSentLetters.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#BACADA] truncate">
                  {locale === "pl"
                    ? "Automatycznie skategoryzowane wg typu dokumentu (Grievance, Settlement, Contract, Wages...)"
                    : "Automatically tagged by document type (Grievance, Settlement, Contract, Wages...)"}
                </p>
              </div>
            </div>

            {/* Dedicated Section Close (X) Button */}
            <button
              type="button"
              onClick={() => setIsGeneratedSectionVisible(false)}
              title="Zamknij sekcję wygenerowanych pism"
              aria-label="Zamknij sekcję wygenerowanych pism"
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Automated Document Type Filter Bar inside Saved Letters Section */}
          <div className="px-3.5 sm:px-4 py-2.5 bg-[#0B2038]/60 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedSentTagFilter("ALL")}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedSentTagFilter === "ALL"
                  ? "bg-[#FF6A00] text-black border-[#FF6A00]"
                  : "bg-[#12304F] text-[#BACADA] border-white/10 hover:text-white"
              }`}
            >
              <Tag className="w-3 h-3" />
              <span>{locale === "pl" ? "Wszystkie" : "All"}</span>
              <span className="font-mono text-[10px] opacity-80">
                ({enrichedSentLetters.length})
              </span>
            </button>

            {SENT_LETTER_TAG_CATEGORIES.map((tag) => {
              const meta = getSentLetterTagMeta(tag, locale);
              const count = sentLetterTagCounts[tag] || 0;
              const isSelected = selectedSentTagFilter === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedSentTagFilter(isSelected ? "ALL" : tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? meta.activeChipClass
                      : "bg-[#12304F] text-[#BACADA] border-white/10 hover:text-white"
                  }`}
                >
                  <span>{meta.label}</span>
                  <span className="font-mono text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 sm:p-4 space-y-2.5 max-h-96 overflow-y-auto">
            {filteredSentLetters.length > 0 ? (
              filteredSentLetters.map((letter) => {
                const letterTags =
                  letter.tags && letter.tags.length > 0
                    ? letter.tags
                    : [letter.primaryTag || "Grievance"];

                return (
                  <div
                    key={letter.id}
                    className="p-3.5 rounded-xl bg-[#0B2038]/90 border border-white/10 hover:border-[#2EE59D]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Automated Category Tags */}
                        {letterTags.map((tg) => {
                          const meta = getSentLetterTagMeta(tg, locale);
                          return (
                            <span
                              key={tg}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                            >
                              <Tag className="w-2.5 h-2.5" />
                              <span>{meta.badgeLabel}</span>
                            </span>
                          );
                        })}

                        <span className="px-1.5 py-0.5 rounded bg-[#2EE59D]/15 border border-[#2EE59D]/35 text-[#2EE59D] font-extrabold text-[10px]">
                          100% WYPEŁNIONE · EN
                        </span>
                        <span className="text-[11px] font-mono text-[#BACADA]">
                          {letter.date}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white mt-1 truncate">
                        {letter.title}
                      </h4>
                      <p className="text-[11px] text-[#BACADA] truncate">
                        Nadawca: <span className="text-white font-semibold">{user.fullName}</span> → Adresat:{" "}
                        <span className="text-[#2EE59D] font-semibold">{letter.recipient}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {/* Full-Screen Preview Button */}
                      <button
                        type="button"
                        onClick={() => setFullScreenPreviewLetter(letter)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs shadow-sm cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Podgląd</span>
                      </button>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(letter.content);
                          showToast(t("copyClipboard"));
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black font-extrabold text-xs cursor-pointer"
                        title="Kopiuj"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopiuj</span>
                      </button>

                      {/* Download Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([letter.content], {
                            type: "text/plain;charset=utf-8",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${letter.title
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                          showToast(t("downloadLetter"));
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#12304F] hover:bg-[#163a5f] border border-white/10 text-white font-bold text-xs cursor-pointer"
                        title="Pobierz"
                      >
                        <Download className="w-3.5 h-3.5 text-[#2EE59D]" />
                        <span>Pobierz</span>
                      </button>

                      {/* Email Button */}
                      <a
                        href={`mailto:?subject=${encodeURIComponent(
                          `${letter.title} - ${user.fullName}`
                        )}&body=${encodeURIComponent(letter.content)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#143A66] hover:bg-[#19477d] border border-[#2EE59D]/35 text-[#2EE59D] font-bold text-xs cursor-pointer"
                        title="Wyślij mailowo"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">E-mail</span>
                      </a>

                      {/* Dismiss / Remove item (X) Button */}
                      <button
                        type="button"
                        onClick={() => removeSentLetter(letter.id)}
                        title="Usuń z listy"
                        aria-label="Usuń z listy"
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-[#EF4444]/25 border border-white/10 hover:border-[#EF4444]/50 text-[#BACADA] hover:text-[#FF8A8A] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-[#BACADA]">
                {locale === "pl"
                  ? "Brak wygenerowanych pism w wybranej kategorii."
                  : "No generated letters in the selected category."}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-Saved Unfinished Draft Banner */}
      {savedLetterDraft && savedDraftTemplate && (
        <div className="mb-5 p-4 rounded-2xl bg-[#0F2C4D] border border-[#2EE59D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B6E4F]/30 border border-[#2EE59D]/40 flex items-center justify-center text-[#2EE59D] shrink-0 mt-0.5">
              <RotateCcw className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-xs font-extrabold text-white">
                {t("resumeDraftBanner")}
              </div>
              <div className="text-[11px] text-[#BACADA] mt-0.5">
                <span className="text-[#2EE59D] font-semibold">
                  {locale === "pl"
                    ? savedDraftTemplate.titlePl
                    : locale === "ro"
                    ? savedDraftTemplate.titleRo
                    : savedDraftTemplate.titleEn}
                </span>
                <span className="font-mono tabular-nums ml-2">
                  · {savedLetterDraft.updatedAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={resumeSavedDraft}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs whitespace-nowrap"
            >
              {t("resumeDraftBtn")}
            </button>
            <button
              type="button"
              onClick={() => saveCurrentLetterDraft(null)}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#BACADA] hover:text-white whitespace-nowrap"
            >
              {t("discardDraftBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
              selectedCategory === cat.id
                ? "bg-[#FF6A00] text-black border-[#FF6A00]"
                : "bg-[#0F2C4D] text-[#BACADA] border-white/10 hover:text-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="space-y-3.5">
        {filteredTemplates.map((tpl) => {
          const title =
            locale === "pl"
              ? tpl.titlePl
              : locale === "ro"
              ? tpl.titleRo
              : tpl.titleEn;
          const desc =
            locale === "pl"
              ? tpl.descriptionPl
              : locale === "ro"
              ? tpl.descriptionRo
              : tpl.descriptionEn;

          return (
            <div
              key={tpl.id}
              onClick={() => startFilling(tpl)}
              className="group p-5 rounded-2xl bg-[#0F2C4D] hover:bg-[#12304F] border border-white/10 hover:border-[#2EE59D]/40 transition-all cursor-pointer shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 text-[11px] text-[#BACADA] flex-wrap">
                  <span className="font-bold text-[#2EE59D]">
                    {tpl.statutoryReference}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{tpl.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#2EE59D]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ACAS Tone Shield</span>
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-white group-hover:text-[#2EE59D] transition-colors">
                  {title}
                </h3>
                <p className="text-xs text-[#BACADA] mt-1 line-clamp-2">
                  {desc}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs shadow-md whitespace-nowrap shrink-0">
                  <span>Wypełnij</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL-SCREEN DOCUMENT PREVIEW POPUP MODAL IN PISMA TAB */}
      {fullScreenPreviewLetter && (
        <div
          className="fixed inset-0 z-[80] bg-[#070F1A]/95 backdrop-blur-md flex flex-col sm:items-center sm:justify-center sm:p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full h-full sm:h-[92vh] sm:max-w-3xl bg-[#0F2C4D] sm:border-2 sm:border-[#FF6A00]/60 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Popup Top Bar with Close (X) Button */}
            <div className="shrink-0 px-4 py-3.5 bg-[#0B2038] border-b border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-[#2EE59D] text-[#070F1A] font-extrabold text-[10px] uppercase tracking-wider">
                    GOTOWY DOKUMENT (EN)
                  </span>
                  <span className="text-[11px] font-mono text-[#BACADA] truncate">
                    Do: {fullScreenPreviewLetter.recipient} · {fullScreenPreviewLetter.date}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">
                  {fullScreenPreviewLetter.title}
                </h3>
              </div>

              {/* Close with Cross (X) Button */}
              <button
                type="button"
                onClick={() => setFullScreenPreviewLetter(null)}
                aria-label="Zamknij podgląd"
                title="Zamknij"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Full-Screen Scrollable Paper Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-[#070F1A]">
              <div className="rounded-2xl bg-[#FFF6EF] text-[#161B22] p-4 sm:p-7 border-2 border-[#FF6A00]/40 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#161B22]/15 text-[11px] font-mono text-[#161B22]/80">
                  <span className="font-extrabold text-[#0B6E4F]">
                    OFFICIAL UK STATUTORY NOTICE · 100% COMPLETED
                  </span>
                  <span>
                    {user.fullName} → {fullScreenPreviewLetter.recipient}
                  </span>
                </div>
                <pre className="text-xs sm:text-sm leading-relaxed font-mono whitespace-pre-wrap text-[#161B22] select-all">
                  {fullScreenPreviewLetter.content}
                </pre>
              </div>
            </div>

            {/* Sticky Bottom Action Bar: Copy, Download, Send Email, Close (X) */}
            <div className="shrink-0 p-3 sm:p-4 bg-[#0B2038] border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* 1. Copy Button */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullScreenPreviewLetter.content);
                    showToast(t("copyClipboard"));
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <Copy className="w-4 h-4 shrink-0" />
                  <span>Kopiuj</span>
                </button>

                {/* 2. Download Button */}
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([fullScreenPreviewLetter.content], {
                      type: "text/plain;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${fullScreenPreviewLetter.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast(t("downloadLetter"));
                  }}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 border border-[#2EE59D]/40 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#2EE59D] shrink-0" />
                  <span>Pobierz</span>
                </button>

                {/* 3. Send via Email Button */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `${fullScreenPreviewLetter.title} - ${user.fullName}`
                  )}&body=${encodeURIComponent(fullScreenPreviewLetter.content)}`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#143A66] hover:bg-[#19477d] border border-[#2EE59D]/40 text-[#2EE59D] text-xs font-extrabold transition-all shadow-md cursor-pointer"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Wyślij mailowo</span>
                </a>
              </div>

              {/* 4. Close (X) Button */}
              <button
                type="button"
                onClick={() => setFullScreenPreviewLetter(null)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-[#EF4444]/25 border border-white/15 hover:border-[#EF4444]/50 text-white hover:text-[#FF8A8A] text-xs font-extrabold transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>Zamknij</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

