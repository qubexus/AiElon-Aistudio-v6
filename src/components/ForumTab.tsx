import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { QAActionLink } from "../types";
import {
  ThumbsUp,
  MessageCircle,
  Plus,
  Send,
  UserCheck,
  Search,
  TrendingUp,
  Clock,
  Compass,
  CheckSquare,
  Award,
  ArrowUpRight,
  HelpCircle,
  MessageSquare,
  FileText,
  Briefcase,
  FileSearch,
  ShieldCheck,
  Scale,
  Copy,
  Check,
} from "lucide-react";

export const QA_CATEGORIES = [
  "All",
  "Czat AI i Głos",
  "Pisma i Generator PDF",
  "Sprawy i Przypięte Dowody",
  "Audyt Payslipu i Dokumenty",
  "Notatki, Karta PRO i Offline",
  "Prawo Pracy UK w Praktyce",
] as const;

export const ForumTab: React.FC = () => {
  const {
    forumPosts,
    upvoteForumPost,
    addForumComment,
    setIsNewPostModalOpen,
    setActiveTab,
    setProfileSubTab,
    setActiveTemplateId,
    setIsNewCaseModalOpen,
    setIsLegalDictionaryModalOpen,
    setIsQuickSearchModalOpen,
    setIsEmployerLookupModalOpen,
    setIsVoicePreferencesModalOpen,
    setIsMenuDrawerOpen,
    showToast,
    locale,
    t,
  } = useApp();

  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"popular" | "recent">("popular");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: forumPosts.length };
    forumPosts.forEach((p) => {
      counts[p.tag] = (counts[p.tag] || 0) + 1;
    });
    return counts;
  }, [forumPosts]);

  const filteredPosts = useMemo(() => {
    return forumPosts
      .filter((p) => {
        if (selectedTag !== "All" && p.tag !== selectedTag) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const stepsBlob = (p.whatToSelect || []).join(" ").toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q) ||
            p.author.toLowerCase().includes(q) ||
            p.tag.toLowerCase().includes(q) ||
            (p.whereToGo || "").toLowerCase().includes(q) ||
            (p.whatYouGet || "").toLowerCase().includes(q) ||
            stepsBlob.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "popular") return b.upvotes - a.upvotes;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [forumPosts, selectedTag, searchQuery, sortBy]);

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId] || "";
    if (!text.trim()) return;
    addForumComment(postId, text.trim());
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const toggleStepCheck = (postId: string, stepIndex: number) => {
    const key = `${postId}_${stepIndex}`;
    setCheckedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExecuteActionLink = (action: QAActionLink) => {
    if (action.targetTemplateId) {
      setActiveTemplateId(action.targetTemplateId);
    }
    if (action.targetProfileSubTab) {
      setProfileSubTab(action.targetProfileSubTab);
    }
    if (action.targetTab) {
      setActiveTab(action.targetTab);
    }
    if (action.openModal === "newCase") {
      setIsNewCaseModalOpen(true);
    } else if (action.openModal === "legalDict") {
      setIsLegalDictionaryModalOpen(true);
    } else if (action.openModal === "quickSearch") {
      setIsQuickSearchModalOpen(true);
    } else if (action.openModal === "employerLookup") {
      setIsEmployerLookupModalOpen(true);
    } else if (action.openModal === "voicePrefs") {
      setIsVoicePreferencesModalOpen(true);
    } else if (action.openModal === "menuDrawer") {
      setIsMenuDrawerOpen(true);
    }
  };

  const handleCopyGuide = (post: (typeof forumPosts)[number]) => {
    const lines = [
      `Q&A: ${post.title}`,
      `Kategoria: ${post.tag}`,
      post.whereToGo ? `\n1. GDZIE WEJŚĆ:\n${post.whereToGo}` : "",
      post.whatToSelect && post.whatToSelect.length > 0
        ? `\n2. CO ZAZNACZYĆ:\n${post.whatToSelect.map((s, i) => `   ${i + 1}) ${s}`).join("\n")}`
        : "",
      post.whatYouGet ? `\n3. CO UZYSKASZ:\n${post.whatYouGet}` : "",
      `\nOpis: ${post.content}`,
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 1800);
    showToast(
      locale === "pl"
        ? "Skopiowano instrukcję Q&A do schowka!"
        : "Copied Q&A guide to clipboard!"
    );
  };

  const renderCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Czat AI i Głos":
        return <MessageSquare className="w-3.5 h-3.5" />;
      case "Pisma i Generator PDF":
        return <FileText className="w-3.5 h-3.5" />;
      case "Sprawy i Przypięte Dowody":
        return <Briefcase className="w-3.5 h-3.5" />;
      case "Audyt Payslipu i Dokumenty":
        return <FileSearch className="w-3.5 h-3.5" />;
      case "Notatki, Karta PRO i Offline":
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case "Prawo Pracy UK w Praktyce":
        return <Scale className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1D6852]/15 border border-[#38B28B]/30 text-[#1D6852] dark:text-[#38B28B] text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              {locale === "pl"
                ? "SYSTEMATYCZNE Q&A · MOŻLIWOŚCI APLIKACJI ASK ELON"
                : "SYSTEMATIC Q&A · ASK ELON CAPABILITIES GUIDE"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-[#F1F5F9]">
            {t("forumHeading")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] mt-0.5">
            {t("forumSub")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewPostModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#1D6852] hover:bg-[#258066] text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t("newPostBtn")}
        </button>
      </div>

      {/* 3-Pillar Overview Strip: Gdzie wejść -> Co zaznaczyć -> Co uzyskać */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/35 flex items-center justify-center text-[#0284C7] dark:text-[#38BDF8] shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#0284C7] dark:text-[#38BDF8]">
              1. GDZIE WEJŚĆ
            </p>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5 leading-snug">
              Dokładna ścieżka w dolnym pasku nawigacji, pod-zakładkach Profilu lub menu podręcznym.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#D97724]/15 border border-[#D97724]/35 flex items-center justify-center text-[#D97724] shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#D97724]">
              2. CO ZAZNACZYĆ
            </p>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5 leading-snug">
              Krok po kroku: które przyciski, filtry, opcje przytrzymania i pola formularza wybrać.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1D6852]/15 border border-[#38B28B]/35 flex items-center justify-center text-[#1D6852] dark:text-[#38B28B] shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#1D6852] dark:text-[#38B28B]">
              3. CO UZYSKASZ
            </p>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5 leading-snug">
              Konkretny rezultat: oficjalne pismo PDF po angielsku, audyt payslipu lub dowód w teczce sprawy.
            </p>
          </div>
        </div>
      </div>

      {/* Segregated Category Filter, Search & Sort Toolbar */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-3.5 space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {QA_CATEGORIES.map((tag) => {
            const isSelected = selectedTag === tag;
            const count = categoryCounts[tag] || 0;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1D6852] text-white shadow-xs"
                    : "bg-slate-100 dark:bg-[#0B0F17] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-white/10"
                }`}
              >
                {renderCategoryIcon(tag)}
                <span>{tag === "All" ? t("filterAll") : tag}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono tabular-nums ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-[#94A3B8]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center bg-slate-100 dark:bg-[#0B0F17] p-1 rounded-xl border border-slate-200/80 dark:border-white/10 self-start">
            <button
              type="button"
              onClick={() => setSortBy("popular")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                sortBy === "popular"
                  ? "bg-[#1D6852] text-white"
                  : "text-slate-600 dark:text-[#94A3B8]"
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>{locale === "pl" ? "Najbardziej pomocne" : "Most helpful"}</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy("recent")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                sortBy === "recent"
                  ? "bg-[#1D6852] text-white"
                  : "text-slate-600 dark:text-[#94A3B8]"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{locale === "pl" ? "Najnowsze" : "Recent"}</span>
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === "pl"
                  ? "Szukaj w Q&A (np. payslip, PDF, przypnij, głos)..."
                  : "Search Q&A guides & questions..."
              }
              className="w-full bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#38B28B]"
            />
          </div>
        </div>
      </div>

      {/* Q&A Items List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const isCommentsOpen = openCommentsId === post.id;
          const hasCapabilitySteps =
            Boolean(post.whereToGo) ||
            Boolean(post.whatToSelect && post.whatToSelect.length > 0) ||
            Boolean(post.whatYouGet);

          return (
            <div
              key={post.id}
              className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all hover:border-[#38B28B]/40 shadow-xs"
            >
              {/* Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#1D6852]/15 border border-[#38B28B]/30 flex items-center justify-center text-[#1D6852] dark:text-[#38B28B] font-bold text-xs shrink-0">
                    {post.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-[#F1F5F9]">
                        {post.author}
                      </span>
                      <UserCheck className="w-3.5 h-3.5 text-[#38B28B]" />
                    </div>
                    <span className="block text-[10px] text-slate-500 dark:text-[#94A3B8]">
                      {post.authorRole}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {post.statuteOrFeatureBadge && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#1D6852]/12 text-[#1D6852] dark:text-[#38B28B] border border-[#38B28B]/30">
                      {post.statuteOrFeatureBadge}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#D97724]/15 text-[#D97724] border border-[#D97724]/30">
                    {renderCategoryIcon(post.tag)}
                    <span>{post.tag}</span>
                  </span>
                </div>
              </div>

              {/* Question Title & Overview */}
              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-[#F1F5F9] leading-snug">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Systematic 3-Step Capability Matrix: GDZIE WEJŚĆ -> CO ZAZNACZYĆ -> CO UZYSKASZ */}
              {hasCapabilitySteps && (
                <div className="rounded-2xl bg-slate-50/90 dark:bg-[#0B0F17]/75 border border-slate-200/80 dark:border-white/10 p-3.5 sm:p-4 space-y-3">
                  {/* Step 1: GDZIE WEJŚĆ */}
                  {post.whereToGo && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/70 dark:border-white/10">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#38BDF8]/15 border border-[#38BDF8]/35 text-[#0284C7] dark:text-[#38BDF8] text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5">
                          <Compass className="w-3 h-3" />
                          <span>GDZIE WEJŚĆ</span>
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F1F5F9] leading-snug">
                          {post.whereToGo}
                        </span>
                      </div>

                      {post.actionLink && (
                        <button
                          type="button"
                          onClick={() => handleExecuteActionLink(post.actionLink!)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D97724] hover:bg-[#C2651A] text-black font-extrabold text-xs shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
                        >
                          <span>{post.actionLink.label}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 2: CO ZAZNACZYĆ / KLIKNĄĆ */}
                  {post.whatToSelect && post.whatToSelect.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D97724]/15 border border-[#D97724]/35 text-[#D97724] text-[10px] font-black uppercase tracking-wider">
                          <CheckSquare className="w-3 h-3" />
                          <span>CO ZAZNACZYĆ KROK PO KROKU</span>
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-[#94A3B8]">
                          {locale === "pl"
                            ? "Kliknij krok, aby odhaczyć"
                            : "Click a step to check off"}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {post.whatToSelect.map((stepText, idx) => {
                          const key = `${post.id}_${idx}`;
                          const isDone = Boolean(checkedSteps[key]);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => toggleStepCheck(post.id, idx)}
                              className={`w-full text-left flex items-start gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                isDone
                                  ? "bg-[#1D6852]/12 border-[#38B28B]/40 text-slate-500 dark:text-[#94A3B8] line-through"
                                  : "bg-white dark:bg-[#131B2E] border-slate-200/70 dark:border-white/10 hover:border-[#D97724]/45 text-slate-800 dark:text-[#F1F5F9]"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-mono font-extrabold shrink-0 mt-0.5 ${
                                  isDone
                                    ? "bg-[#38B28B] text-black"
                                    : "bg-[#D97724]/20 text-[#D97724] border border-[#D97724]/40"
                                }`}
                              >
                                {isDone ? "✓" : idx + 1}
                              </span>
                              <span className="text-xs leading-relaxed">{stepText}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 3: CO UZYSKASZ */}
                  {post.whatYouGet && (
                    <div className="pt-2.5 border-t border-slate-200/70 dark:border-white/10 flex items-start gap-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1D6852]/15 border border-[#38B28B]/35 text-[#1D6852] dark:text-[#38B28B] text-[10px] font-black uppercase tracking-wider shrink-0 mt-0.5">
                        <Award className="w-3 h-3" />
                        <span>CO UZYSKASZ</span>
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-[#F1F5F9] leading-relaxed">
                        {post.whatYouGet}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => upvoteForumPost(post.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all tabular-nums cursor-pointer ${
                      post.userUpvoted
                        ? "bg-[#1D6852] text-white"
                        : "bg-slate-100 dark:bg-[#0B0F17]/70 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>
                      {t("upvote")} · {post.upvotes}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenCommentsId(isCommentsOpen ? null : post.id)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#0B0F17]/70 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10 transition-colors tabular-nums cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#D97724]" />
                    <span>
                      {post.comments.length} {t("commentsCount")}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyGuide(post)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#0B0F17]/70 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer"
                >
                  {copiedId === post.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#38B28B]" />
                      <span className="text-[#38B28B]">Skopiowano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopiuj instrukcję</span>
                    </>
                  )}
                </button>
              </div>

              {/* Comments / Answers Drawer */}
              {isCommentsOpen && (
                <div className="pt-3 mt-2 border-t border-slate-200/80 dark:border-white/10 space-y-2.5">
                  {post.comments.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-[#94A3B8] italic">
                      Brak dodatkowych pytań w tym wątku. Dodaj własne pytanie lub wskazówkę poniżej!
                    </p>
                  ) : (
                    post.comments.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-50 dark:bg-[#0B0F17]/70 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-[#94A3B8]">
                          <span className="font-bold text-[#1D6852] dark:text-[#38B28B]">
                            {c.author}
                          </span>
                          <span>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-[#F1F5F9]">{c.text}</p>
                      </div>
                    ))
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                      placeholder={t("addCommentPlaceholder")}
                      className="flex-1 bg-slate-100 dark:bg-[#1A243B] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#38B28B]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      className="px-3.5 py-2 rounded-xl bg-[#D97724] hover:bg-[#C2651A] text-black text-xs font-extrabold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {t("replyBtn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
