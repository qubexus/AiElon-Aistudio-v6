import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { WorkplaceCase } from "../types";
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Briefcase,
  AlertCircle,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  Send,
  Calendar
} from "lucide-react";

export const CasesTab: React.FC = () => {
  const {
    cases,
    t,
    setIsNewCaseModalOpen,
    updateCaseStatus,
    addCaseNote,
    startChatAboutCase
  } = useApp();

  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [search, setSearch] = useState("");
  const [selectedCase, setSelectedCase] = useState<WorkplaceCase | null>(null);
  const [newNoteText, setNewNoteText] = useState("");

  const filteredCases = cases.filter((c) => {
    if (filter === "open" && c.status !== "open") return false;
    if (filter === "resolved" && c.status !== "resolved") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.employer.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddNote = () => {
    if (!selectedCase || !newNoteText.trim()) return;
    addCaseNote(selectedCase.id, newNoteText.trim());
    setNewNoteText("");
    // Update local selected case state
    const updated = cases.find((c) => c.id === selectedCase.id);
    if (updated) setSelectedCase(updated);
  };

  const toggleCaseStatus = () => {
    if (!selectedCase) return;
    const newStatus = selectedCase.status === "open" ? "resolved" : "open";
    updateCaseStatus(selectedCase.id, newStatus);
    setSelectedCase((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  // Case Detail View
  if (selectedCase) {
    const current = cases.find((c) => c.id === selectedCase.id) || selectedCase;
    const isOpen = current.status === "open";

    return (
      <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
        {/* Back navigation */}
        <button
          onClick={() => setSelectedCase(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#BACADA] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("allCases")}</span>
        </button>

        <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl mb-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isOpen
                    ? "bg-[#FF6A00]/20 border border-[#FF6A00]/40 text-[#FF6A00]"
                    : "bg-[#10B981]/20 border border-[#10B981]/40 text-[#10B981]"
                }`}
              >
                {isOpen ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {isOpen ? t("openCases") : t("resolvedCases")}
              </span>

              <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#BACADA] font-medium">
                {current.sector}
              </span>
            </div>

            {/* Status action toggle */}
            <button
              onClick={toggleCaseStatus}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                isOpen
                  ? "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/25"
                  : "bg-[#FF6A00]/15 border-[#FF6A00]/30 text-[#FF6A00] hover:bg-[#FF6A00]/25"
              }`}
            >
              {isOpen ? t("markResolved") : t("reopenCase")}
            </button>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-3">
            {current.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#BACADA] mb-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#2EE59D]" />
              <span>{current.employer}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FF6A00]" />
              <span>{new Date(current.createdAt).toLocaleDateString("en-GB")}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#BACADA] mb-2">
              {t("caseDescLabel")}
            </h3>
            <p className="text-sm text-[#F4F8FB] leading-relaxed whitespace-pre-wrap bg-[#12304F] p-4 rounded-xl border border-white/5">
              {current.description}
            </p>
          </div>

          {/* Ask Elon About This Case Button */}
          <button
            onClick={() => startChatAboutCase(current)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] hover:opacity-95 text-black font-extrabold text-sm shadow-lg transition-all"
          >
            <MessageSquare className="w-4.5 h-4.5" />
            <span>{t("askElonAboutCase")}</span>
          </button>
        </div>

        {/* Timeline Notes Section */}
        <div className="bg-[#0F2C4D] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#FF6A00]" />
            <h3 className="text-base font-bold text-white">
              {t("caseNotes")}
            </h3>
          </div>

          {/* New note input */}
          <div className="flex items-end gap-2 mb-6 bg-[#12304F] p-2 rounded-xl border border-white/10">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder={t("notePlaceholder")}
              rows={2}
              className="flex-1 bg-transparent border-0 text-sm text-white placeholder-[#BACADA]/60 focus:outline-none resize-none p-1"
            />
            <button
              onClick={handleAddNote}
              disabled={!newNoteText.trim()}
              className="p-2 rounded-lg bg-[#FF6A00] text-black font-bold disabled:opacity-40 transition-opacity"
              title="Dodaj wpis"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Notes list */}
          <div className="space-y-3">
            {current.notes && current.notes.length > 0 ? (
              current.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-xl bg-[#12304F]/60 border border-white/5 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-[#BACADA]">
                    <span className="font-semibold text-[#2EE59D]">{note.author}</span>
                    <span>{note.date}</span>
                  </div>
                  <p className="text-sm text-white">{note.text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#BACADA] italic py-2">
                Brak wpisów w osi czasu. Dodaj pierwszą notatkę powyżej.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Cases List View
  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-24">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#FF6A00]" />
            {t("casesTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-[#BACADA] mt-0.5">
            {t("casesSub")}
          </p>
        </div>

        <button
          onClick={() => setIsNewCaseModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-extrabold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t("newCase")}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Status Filter Tabs */}
        <div className="flex items-center bg-[#0F2C4D] border border-white/10 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "all" ? "bg-[#FF6A00] text-black" : "text-[#BACADA] hover:text-white"
            }`}
          >
            {t("allCases")} ({cases.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "open" ? "bg-[#FF6A00] text-black" : "text-[#BACADA] hover:text-white"
            }`}
          >
            {t("openCases")} ({cases.filter((c) => c.status === "open").length})
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === "resolved" ? "bg-[#FF6A00] text-black" : "text-[#BACADA] hover:text-white"
            }`}
          >
            {t("resolvedCases")} ({cases.filter((c) => c.status === "resolved").length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#BACADA]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po tytule, pracodawcy lub branży..."
            className="w-full bg-[#0F2C4D] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#BACADA]/60 focus:outline-none focus:border-[#2EE59D]"
          />
        </div>
      </div>

      {/* Cases Cards Feed */}
      {filteredCases.length > 0 ? (
        <div className="space-y-3">
          {filteredCases.map((c) => {
            const isOpen = c.status === "open";
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className="group p-4 sm:p-5 rounded-2xl bg-[#0F2C4D] hover:bg-[#12304F] border border-white/10 hover:border-[#FF6A00]/40 transition-all cursor-pointer shadow-md flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isOpen
                          ? "bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/30"
                          : "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                      }`}
                    >
                      {isOpen ? t("openCases") : t("resolvedCases")}
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#BACADA]">
                      {c.sector}
                    </span>

                    <span className="text-[10px] text-[#BACADA] ml-auto sm:ml-0">
                      {new Date(c.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-[#FF6A00] transition-colors truncate">
                    {c.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-[#BACADA] mt-1">
                    <span className="truncate">{c.employer}</span>
                    <span>•</span>
                    <span>{c.notes?.length || 0} wpisów</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-[#BACADA] group-hover:text-[#FF6A00] transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-[#0F2C4D] border border-white/10">
          <AlertCircle className="w-10 h-10 text-[#FF6A00] mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-white mb-1">
            {t("noCases")}
          </h3>
          <p className="text-xs text-[#BACADA] max-w-sm mx-auto mb-4">
            {t("noCasesSub")}
          </p>
          <button
            onClick={() => setIsNewCaseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t("newCase")}</span>
          </button>
        </div>
      )}
    </div>
  );
};
