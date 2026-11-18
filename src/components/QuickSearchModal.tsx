import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Search,
  X,
  Briefcase,
  MessageSquare,
  FileText,
  Mail,
  Users,
  ChevronRight,
} from "lucide-react";

type SearchScope = "all" | "cases" | "chats" | "templates" | "letters" | "forum";

interface SearchResultItem {
  id: string;
  scope: Exclude<SearchScope, "all">;
  title: string;
  subtitle: string;
  meta: string;
  onSelect: () => void;
}

export const QuickSearchModal: React.FC = () => {
  const {
    isQuickSearchModalOpen,
    setIsQuickSearchModalOpen,
    cases,
    recentUnsavedChats,
    templates,
    sentLetters,
    forumPosts,
    locale,
    setActiveTab,
    setActiveCaseId,
    setActiveTemplateId,
    restoreUnsavedChat,
    setIsSentLettersModalOpen,
  } = useApp();

  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");

  const allResults = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const items: SearchResultItem[] = [];

    // 1. Workplace Cases
    if (scope === "all" || scope === "cases") {
      cases.forEach((c) => {
        const matches =
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.employer.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q);
        if (matches) {
          items.push({
            id: `case_${c.id}`,
            scope: "cases",
            title: c.title,
            subtitle: `${c.employer} · ${c.sector}`,
            meta: `${c.status === "open" ? (locale === "pl" ? "Otwarta" : "Open") : (locale === "pl" ? "Zamknięta" : "Resolved")} · ${c.updatedAt}`,
            onSelect: () => {
              setActiveCaseId(c.id);
              setActiveTab("cases");
              setIsQuickSearchModalOpen(false);
            },
          });
        }
      });
    }

    // 2. Chat Sessions (Active & Archived)
    if (scope === "all" || scope === "chats") {
      recentUnsavedChats.forEach((chat) => {
        const textBlob = chat.messages.map((m) => m.text).join(" ").toLowerCase();
        const tagsBlob = (chat.tags || []).join(" ").toLowerCase();
        const matches =
          !q ||
          chat.title.toLowerCase().includes(q) ||
          chat.preview.toLowerCase().includes(q) ||
          tagsBlob.includes(q) ||
          textBlob.includes(q);
        if (matches) {
          items.push({
            id: `chat_${chat.id}`,
            scope: "chats",
            title: chat.title,
            subtitle: chat.preview,
            meta: `${chat.dateLabel} · ${chat.messageCount} ${locale === "pl" ? "wiad." : "msgs"}${
              chat.isArchived ? ` · ${locale === "pl" ? "Archiwum" : "Archived"}` : ""
            }`,
            onSelect: () => {
              restoreUnsavedChat(chat.id);
              setActiveTab("chat");
              setIsQuickSearchModalOpen(false);
            },
          });
        }
      });
    }

    // 3. Statutory Legal Templates
    if (scope === "all" || scope === "templates") {
      templates.forEach((tpl) => {
        const title = locale === "pl" ? tpl.titlePl : locale === "ro" ? tpl.titleRo : tpl.titleEn;
        const desc =
          locale === "pl" ? tpl.descriptionPl : locale === "ro" ? tpl.descriptionRo : tpl.descriptionEn;
        const matches =
          !q ||
          title.toLowerCase().includes(q) ||
          tpl.titleEn.toLowerCase().includes(q) ||
          tpl.statutoryReference.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q) ||
          tpl.category.toLowerCase().includes(q);
        if (matches) {
          items.push({
            id: `tpl_${tpl.id}`,
            scope: "templates",
            title,
            subtitle: desc,
            meta: tpl.statutoryReference,
            onSelect: () => {
              setActiveTemplateId(tpl.id);
              setActiveTab("templates");
              setIsQuickSearchModalOpen(false);
            },
          });
        }
      });
    }

    // 4. Sent Letters
    if (scope === "all" || scope === "letters") {
      sentLetters.forEach((ltr) => {
        const matches =
          !q ||
          ltr.title.toLowerCase().includes(q) ||
          (ltr.titlePl || "").toLowerCase().includes(q) ||
          ltr.recipient.toLowerCase().includes(q) ||
          ltr.content.toLowerCase().includes(q);
        if (matches) {
          items.push({
            id: `ltr_${ltr.id}`,
            scope: "letters",
            title: (locale === "pl" && ltr.titlePl) || ltr.title,
            subtitle: ltr.recipient,
            meta: ltr.date,
            onSelect: () => {
              setIsQuickSearchModalOpen(false);
              setIsSentLettersModalOpen(true);
            },
          });
        }
      });
    }

    // 5. Community Forum Posts
    if (scope === "all" || scope === "forum") {
      forumPosts.forEach((post) => {
        const matches =
          !q ||
          post.title.toLowerCase().includes(q) ||
          post.content.toLowerCase().includes(q) ||
          post.tag.toLowerCase().includes(q) ||
          post.author.toLowerCase().includes(q);
        if (matches) {
          items.push({
            id: `post_${post.id}`,
            scope: "forum",
            title: post.title,
            subtitle: post.content,
            meta: `${post.tag} · ${post.author}`,
            onSelect: () => {
              setActiveTab("forum");
              setIsQuickSearchModalOpen(false);
            },
          });
        }
      });
    }

    return q ? items : items.slice(0, 12);
  }, [
    cases,
    forumPosts,
    locale,
    query,
    recentUnsavedChats,
    restoreUnsavedChat,
    scope,
    sentLetters,
    setActiveCaseId,
    setActiveTab,
    setActiveTemplateId,
    setIsQuickSearchModalOpen,
    setIsSentLettersModalOpen,
    templates,
  ]);

  if (!isQuickSearchModalOpen) return null;

  const scopeTabs: { id: SearchScope; label: string }[] = [
    { id: "all", label: locale === "pl" ? "Wszystko" : locale === "ro" ? "Tot" : "All" },
    { id: "cases", label: locale === "pl" ? "Sprawy" : locale === "ro" ? "Cazuri" : "Cases" },
    { id: "chats", label: locale === "pl" ? "Czaty" : locale === "ro" ? "Chat-uri" : "Chats" },
    { id: "templates", label: locale === "pl" ? "Pisma" : locale === "ro" ? "Șabloane" : "Templates" },
    { id: "letters", label: locale === "pl" ? "Wysłane" : locale === "ro" ? "Trimise" : "Sent" },
    { id: "forum", label: "Forum" },
  ];

  const renderScopeIcon = (itemScope: Exclude<SearchScope, "all">) => {
    switch (itemScope) {
      case "cases":
        return <Briefcase className="w-4 h-4 text-[#38B28B]" />;
      case "chats":
        return <MessageSquare className="w-4 h-4 text-[#38BDF8]" />;
      case "templates":
        return <FileText className="w-4 h-4 text-[#D97724]" />;
      case "letters":
        return <Mail className="w-4 h-4 text-[#34D399]" />;
      case "forum":
        return <Users className="w-4 h-4 text-[#A78BFA]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 pt-12 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={
        locale === "pl"
          ? "Szybkie wyszukiwanie w sprawach, czatach i pismach"
          : locale === "ro"
          ? "Căutare rapidă în cazuri, conversații și șabloane"
          : "Quick Search across cases, chats, and templates"
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsQuickSearchModalOpen(false);
      }}
    >
      <div className="w-full max-w-xl max-h-[82dvh] bg-[#131B2E] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Search Input Header */}
        <div className="shrink-0 p-3 sm:p-4 bg-[#0B2038] border-b border-white/10 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#38BDF8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsQuickSearchModalOpen(false);
                }}
                placeholder={
                  locale === "pl"
                    ? "Szybkie szukanie: sprawy, czaty, wzory pism, forum..."
                    : locale === "ro"
                    ? "Căutare rapidă: cazuri, conversații, șabloane, forum..."
                    : "Quick search: cases, chat history, templates, forum..."
                }
                className="w-full bg-[#131B2E] border border-white/15 focus:border-[#38BDF8] rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-[#F1F5F9] placeholder-[#94A3B8]/65 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                  aria-label="Clear query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsQuickSearchModalOpen(false)}
              aria-label="Close Quick Search"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {scopeTabs.map((tabItem) => {
              const active = scope === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setScope(tabItem.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                    active
                      ? "bg-[#38BDF8] text-[#0B0F17] border-[#38BDF8]"
                      : "bg-[#131B2E] text-[#94A3B8] hover:text-white border-white/10"
                  }`}
                >
                  {tabItem.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Feed */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5">
          {allResults.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#94A3B8]">
              {locale === "pl"
                ? "Brak wyników pasujących do zapytania."
                : locale === "ro"
                ? "Nu există rezultate pentru această căutare."
                : "No results matched your search query."}
            </div>
          ) : (
            allResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.onSelect}
                className="w-full text-left rounded-xl bg-[#0B0F17]/75 hover:bg-[#1A243B] border border-white/10 hover:border-[#38BDF8]/50 p-3 flex items-center justify-between gap-3 transition-all group cursor-pointer"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-[#131B2E] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    {renderScopeIcon(item.scope)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#F1F5F9] group-hover:text-[#38BDF8] transition-colors truncate">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{item.subtitle}</p>
                    <div className="text-[10px] font-mono text-[#94A3B8]/80 mt-0.5 truncate">
                      {item.meta}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#38BDF8] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
