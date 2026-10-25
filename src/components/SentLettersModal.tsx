import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { SentLetter, SentLetterCategoryTag } from "../types";
import {
  SENT_LETTER_TAG_CATEGORIES,
  classifySentLetter,
  getSentLetterTagMeta,
} from "../data/legalTemplates";
import {
  X,
  Archive,
  Copy,
  Download,
  FileText,
  ChevronRight,
  ArrowLeft,
  Mail,
  Tag,
  Search,
  Sparkles,
} from "lucide-react";

export const SentLettersModal: React.FC = () => {
  const {
    isSentLettersModalOpen,
    setIsSentLettersModalOpen,
    sentLetters,
    removeSentLetter,
    toggleSentLetterTag,
    user,
    locale,
    showToast,
    t,
  } = useApp();

  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<"ALL" | SentLetterCategoryTag>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Ensure every letter has up-to-date automated tags
  const enrichedLetters = useMemo(() => {
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

  // Count how many letters match each category tag (either as primaryTag or in tags[])
  const tagCounts = useMemo(() => {
    const counts: Record<SentLetterCategoryTag, number> = {
      Grievance: 0,
      Settlement: 0,
      Contract: 0,
      Wages: 0,
      Dismissal: 0,
      "Sick Pay": 0,
      "Data & GDPR": 0,
    };
    enrichedLetters.forEach((letter) => {
      const letterTags = letter.tags || (letter.primaryTag ? [letter.primaryTag] : []);
      letterTags.forEach((tg) => {
        if (counts[tg] !== undefined) {
          counts[tg] += 1;
        }
      });
    });
    return counts;
  }, [enrichedLetters]);

  const filteredLetters = useMemo(() => {
    return enrichedLetters.filter((letter) => {
      const letterTags = letter.tags || (letter.primaryTag ? [letter.primaryTag] : []);
      const matchesTag =
        selectedTagFilter === "ALL" ||
        letter.primaryTag === selectedTagFilter ||
        letterTags.includes(selectedTagFilter);

      if (!matchesTag) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        letter.title.toLowerCase().includes(q) ||
        letter.recipient.toLowerCase().includes(q) ||
        (letter.statutoryReference || "").toLowerCase().includes(q) ||
        letterTags.some((tg) => tg.toLowerCase().includes(q))
      );
    });
  }, [enrichedLetters, selectedTagFilter, searchQuery]);

  const activeLetter = useMemo(
    () => enrichedLetters.find((l) => l.id === activeLetterId) || null,
    [enrichedLetters, activeLetterId]
  );

  if (!isSentLettersModalOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t("copyClipboard"));
  };

  const handleDownload = (letter: SentLetter) => {
    const blob = new Blob([letter.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${letter.title.replace(/\s+/g, "_")}_${letter.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("downloadLetter"));
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col sm:items-center sm:justify-center sm:p-4 bg-[#070F1A]/95 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0F2C4D] sm:border-2 sm:border-[#FF6A00]/60 sm:rounded-3xl w-full h-full sm:h-[90vh] sm:max-w-4xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-[#0B2038] border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0B6E4F] flex items-center justify-center text-[#2EE59D] shrink-0">
              <Archive className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {activeLetter ? activeLetter.title : t("sentLettersTitle")}
                </h2>
                {!activeLetter && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2EE59D]/15 border border-[#2EE59D]/40 text-[10px] font-extrabold text-[#2EE59D]">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {locale === "pl"
                        ? "Auto-Tagowanie AI"
                        : locale === "ro"
                        ? "Auto-Etichetare"
                        : "Automated Tagging"}
                    </span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#BACADA] truncate">
                {activeLetter
                  ? `Do: ${activeLetter.recipient} · ${activeLetter.date}`
                  : locale === "pl"
                  ? "Automatyczna kategoryzacja pism według typu dokumentu (Grievance, Settlement, Contract, Wages...)"
                  : "Automatically categorized by document type (Grievance, Settlement, Contract, Wages...)"}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveLetterId(null);
              setIsSentLettersModalOpen(false);
            }}
            title="Zamknij"
            aria-label="Zamknij"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Automated Document Type Filter Bar & Search (Visible in List View) */}
        {!activeLetter && enrichedLetters.length > 0 && (
          <div className="shrink-0 px-4 py-3 bg-[#0B2038]/70 border-b border-white/10 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#BACADA] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === "pl"
                    ? "Szukaj pisma po tytule, pracodawcy, kategorii (np. Grievance, Settlement, Contract)..."
                    : "Search saved letters by title, employer, or document tag..."
                }
                className="w-full bg-[#0F2C4D] border border-white/15 focus:border-[#2EE59D] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#BACADA]/60 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#BACADA] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Tag Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTagFilter("ALL")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedTagFilter === "ALL"
                    ? "bg-[#FF6A00] text-black border-[#FF6A00] shadow-sm"
                    : "bg-[#12304F] text-[#BACADA] border-white/10 hover:text-white"
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>
                  {locale === "pl" ? "Wszystkie" : locale === "ro" ? "Toate" : "All"}
                </span>
                <span className="font-mono text-[10px] opacity-85">
                  ({enrichedLetters.length})
                </span>
              </button>

              {SENT_LETTER_TAG_CATEGORIES.map((tag) => {
                const meta = getSentLetterTagMeta(tag, locale);
                const count = tagCounts[tag] || 0;
                const isSelected = selectedTagFilter === tag;

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTagFilter(isSelected ? "ALL" : tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? meta.activeChipClass
                        : "bg-[#12304F] text-[#BACADA] border-white/10 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    <span>{meta.label}</span>
                    <span className="font-mono text-[10px] opacity-85">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#070F1A]">
          {activeLetter ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => setActiveLetterId(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#BACADA] hover:text-white cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Wróć do listy wygenerowanych pism</span>
                </button>

                {/* Active Letter Automated Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(activeLetter.tags || [activeLetter.primaryTag || "Grievance"]).map(
                    (tg, idx) => {
                      const meta = getSentLetterTagMeta(tg, locale);
                      return (
                        <span
                          key={tg}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-extrabold ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                        >
                          <Tag className="w-3 h-3" />
                          <span>{meta.badgeLabel}</span>
                          {idx === 0 && (
                            <span className="text-[9px] uppercase opacity-80 ml-0.5">
                              • Primary
                            </span>
                          )}
                        </span>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Quick Tag Organizer Bar for Active Letter */}
              <div className="p-3 rounded-2xl bg-[#0F2C4D] border border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#BACADA] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2EE59D]" />
                  <span>
                    {locale === "pl"
                      ? "Kategorie dokumentu (kliknij, aby dodać lub ustawić jako główną):"
                      : "Document categories (click to toggle or set primary):"}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {SENT_LETTER_TAG_CATEGORIES.map((tg) => {
                    const meta = getSentLetterTagMeta(tg, locale);
                    const isTagged = (activeLetter.tags || []).includes(tg);
                    const isPrimary = activeLetter.primaryTag === tg;
                    return (
                      <button
                        key={tg}
                        type="button"
                        onClick={() => toggleSentLetterTag(activeLetter.id, tg)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer ${
                          isPrimary
                            ? meta.activeChipClass
                            : isTagged
                            ? `${meta.bgClass} ${meta.textClass} ${meta.borderClass}`
                            : "bg-white/5 border-white/10 text-[#BACADA]/70 hover:text-white"
                        }`}
                      >
                        {tg}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-[#FFF6EF] text-[#161B22] p-4 sm:p-6 border-2 border-[#FF6A00]/40 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#161B22]/15 text-[11px] font-mono text-[#161B22]/80">
                  <span className="font-extrabold text-[#0B6E4F]">
                    OFFICIAL UK STATUTORY DOCUMENT · {activeLetter.primaryTag?.toUpperCase()}
                  </span>
                  <span>
                    {user.fullName} → {activeLetter.recipient}
                  </span>
                </div>
                <pre className="font-mono text-xs sm:text-sm text-[#161B22] whitespace-pre-wrap leading-relaxed select-all">
                  {activeLetter.content}
                </pre>
              </div>
            </div>
          ) : filteredLetters.length > 0 ? (
            <div className="space-y-3">
              {filteredLetters.map((letter) => {
                const letterTags =
                  letter.tags && letter.tags.length > 0
                    ? letter.tags
                    : [letter.primaryTag || "Grievance"];

                return (
                  <div
                    key={letter.id}
                    onClick={() => setActiveLetterId(letter.id)}
                    className="p-4 rounded-2xl bg-[#12304F] hover:bg-[#153a5e] border border-white/10 hover:border-[#2EE59D]/40 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Automated Category Tags Row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
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

                        {letter.statutoryReference && (
                          <span className="text-[10px] font-mono text-[#BACADA] bg-[#0B2038]/80 px-2 py-0.5 rounded border border-white/10 truncate max-w-xs">
                            {letter.statutoryReference}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#FF6A00] shrink-0" />
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {letter.title}
                        </h4>
                      </div>

                      <p className="text-[11px] text-[#BACADA] truncate">
                        Odbiorca: <span className="text-white font-semibold">{letter.recipient}</span> • Data:{" "}
                        <span className="font-mono">{letter.date}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(letter.content);
                        }}
                        title="Kopiuj"
                        className="px-2.5 py-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black font-extrabold text-xs inline-flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Kopiuj</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSentLetter(letter.id);
                        }}
                        title="Usuń"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-[#EF4444]/30 text-[#BACADA] hover:text-[#FF8A8A]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-[#BACADA]" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-xs text-[#BACADA] py-12 space-y-3">
              <Archive className="w-10 h-10 text-[#BACADA]/40 mx-auto" />
              <p>
                {enrichedLetters.length > 0
                  ? locale === "pl"
                    ? "Brak pism pasujących do wybranego tagu lub wyszukiwania."
                    : "No saved letters match the selected tag filter."
                  : t("noSentLetters")}
              </p>
              {selectedTagFilter !== "ALL" && (
                <button
                  type="button"
                  onClick={() => setSelectedTagFilter("ALL")}
                  className="px-3.5 py-1.5 rounded-xl bg-[#12304F] border border-[#2EE59D]/40 text-xs font-bold text-[#2EE59D] hover:text-white cursor-pointer"
                >
                  {locale === "pl" ? "Pokaż wszystkie pisma" : "Show all letters"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom Action Bar when viewing a specific letter */}
        {activeLetter && (
          <div className="shrink-0 p-3 sm:p-4 bg-[#0B2038] border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <button
                onClick={() => handleCopy(activeLetter.content)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-xs font-extrabold text-black shadow-md cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Kopiuj</span>
              </button>

              <button
                onClick={() => handleDownload(activeLetter)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 text-xs font-extrabold text-white border border-[#2EE59D]/40 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#2EE59D]" />
                <span>Pobierz</span>
              </button>

              <a
                href={`mailto:?subject=${encodeURIComponent(
                  `${activeLetter.title} - ${user.fullName}`
                )}&body=${encodeURIComponent(activeLetter.content)}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#143A66] hover:bg-[#19477d] text-xs font-extrabold text-[#2EE59D] border border-[#2EE59D]/40 shadow-md cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Wyślij mailowo</span>
              </a>
            </div>

            <button
              onClick={() => {
                setActiveLetterId(null);
                setIsSentLettersModalOpen(false);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-[#EF4444]/25 border border-white/15 text-xs font-extrabold text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Zamknij</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

