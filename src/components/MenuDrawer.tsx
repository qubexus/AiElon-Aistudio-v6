import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  LegalTemplate,
  Locale,
  RecentUnsavedChat,
  SentLetter,
  UnsavedChatIconType,
  WorkplaceNote,
} from "../types";
import { classifySentLetter, renderTemplateLetter } from "../data/legalTemplates";
import { AskElonShieldLogo } from "./AskElonShieldLogo";
import {
  X,
  Menu,
  MessageCircle,
  Folder,
  FileText,
  Users,
  UserCircle,
  Mail,
  BarChart2,
  Award,
  ChevronRight,
  Calendar,
  Clock,
  BookmarkPlus,
  Trash2,
  Banknote,
  ShieldAlert,
  HeartPulse,
  AlertTriangle,
  Briefcase,
  Scale,
  Database,
  MessageSquare,
  Files,
  Cloud,
  Eye,
  Download,
  Share2,
  Plus,
  Copy,
  Sparkles,
  Wand2,
  Tag,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

type DrawerTabType = "menu" | "chat_history" | "notes" | "elon_letters";

type ElonTopicId =
  | "ALL"
  | "holiday_contract"
  | "wages"
  | "grievance"
  | "settlement"
  | "sick_pay"
  | "dismissal"
  | "data_gdpr";

type ElonShowcaseFilterType = "all" | "correspondence" | "templates";

interface ElonShowcaseItem {
  id: string;
  itemKind: "correspondence" | "template";
  topicId: ElonTopicId;
  categoryLabel: string;
  displayTitle: string;
  dateLabel: string;
  caseOrStatuteLine: string;
  statutoryReference: string;
  recipient: string;
  content: string;
  templateId: string;
  rawLetter?: SentLetter;
  rawTemplate?: LegalTemplate;
}

export const MenuDrawer: React.FC = () => {
  const {
    isMenuDrawerOpen,
    setIsMenuDrawerOpen,
    activeTab,
    setActiveTab,
    profileSubTab,
    setProfileSubTab,
    user,
    locale,
    setLocale,
    setIsMessagesModalOpen,
    setIsPaywallModalOpen,
    broadcastMessages,
    recentUnsavedChats,
    activeUnsavedChatId,
    restoreUnsavedChat,
    removeUnsavedChat,
    saveUnsavedChatAsCase,
    notes,
    addNote,
    removeNote,
    sentLetters,
    saveSentLetter,
    templates,
    setActiveTemplateId,
    showToast,
    t,
    networkStatus,
    isOnline,
    isSimulatedOffline,
    setIsSimulatedOffline,
    chatMessages,
    chatDraft,
    savedLetterDraft,
    offlineSettings,
    updateOfflineSettings,
    pendingSyncActions,
    removePendingSyncAction,
    removeQueuedChatMessage,
    syncPendingActionsNow,
    enqueueSampleOfflineAction,
  } = useApp();

  const [drawerTab, setDrawerTab] = useState<DrawerTabType>("menu");
  const [selectedElonTopic, setSelectedElonTopic] = useState<ElonTopicId>("ALL");
  const [elonShowcaseFilter, setElonShowcaseFilter] =
    useState<ElonShowcaseFilterType>("all");
  const [isSyncingQueueNow, setIsSyncingQueueNow] = useState(false);

  // Add Note Form State inside Drawer
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteDesc, setNewNoteDesc] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("Wypłata");

  // Full-screen Preview Modals for Letter/Template or Note opened directly from Drawer
  const [previewItem, setPreviewItem] = useState<ElonShowcaseItem | null>(null);
  const [previewNote, setPreviewNote] = useState<WorkplaceNote | null>(null);

  const unreadMessagesCount = broadcastMessages.filter((m) => m.unread).length;

  // Topic definitions for categorizing Letters from Elon (Correspondence & Legal Templates)
  const elonTopics: {
    id: ElonTopicId;
    labelPl: string;
    labelEn: string;
    labelRo: string;
    statuteBadge: string;
    icon: React.ReactNode;
  }[] = useMemo(
    () => [
      {
        id: "ALL",
        labelPl: "Wszystkie tematy",
        labelEn: "All Topics",
        labelRo: "Toate subiectele",
        statuteBadge: "UK Employment Law",
        icon: <Tag className="w-3.5 h-3.5 text-[#FF6A00]" />,
      },
      {
        id: "holiday_contract",
        labelPl: "Urlop i Czas Pracy",
        labelEn: "Holiday & Working Time",
        labelRo: "Concediu și Program",
        statuteBadge: "Reg. 14 WTR 1998 · s.80F ERA 1996",
        icon: <Briefcase className="w-3.5 h-3.5 text-[#38BDF8]" />,
      },
      {
        id: "wages",
        labelPl: "Płace i Nadgodziny",
        labelEn: "Wages & Overtime",
        labelRo: "Salarii și Ore Suplimentare",
        statuteBadge: "Section 13 ERA 1996 · NMW Act 1998",
        icon: <Banknote className="w-3.5 h-3.5 text-[#FBBF24]" />,
      },
      {
        id: "grievance",
        labelPl: "Skargi do HR (Grievance)",
        labelEn: "HR Grievance & Safety",
        labelRo: "Plângeri HR (Grievance)",
        statuteBadge: "ACAS Code No. 1 · s.199 TULRCA 1992",
        icon: <ShieldAlert className="w-3.5 h-3.5 text-[#FF6A00]" />,
      },
      {
        id: "settlement",
        labelPl: "Ugody (Settlement)",
        labelEn: "Settlement Proposals",
        labelRo: "Acorduri Amiabile",
        statuteBadge: "Section 111A ERA 1996 · ACAS",
        icon: <Scale className="w-3.5 h-3.5 text-[#2EE59D]" />,
      },
      {
        id: "sick_pay",
        labelPl: "Chorobowe (SSP)",
        labelEn: "Statutory Sick Pay (SSP)",
        labelRo: "Concediu Medical (SSP)",
        statuteBadge: "s.151 SSCBA 1992 · Form SSP1",
        icon: <HeartPulse className="w-3.5 h-3.5 text-[#A78BFA]" />,
      },
      {
        id: "dismissal",
        labelPl: "Zwolnienia i Odwołania",
        labelEn: "Dismissal & Appeals",
        labelRo: "Concedieri și Contestații",
        statuteBadge: "Section 95 & 98 ERA 1996",
        icon: <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />,
      },
      {
        id: "data_gdpr",
        labelPl: "Dane i RODO (SAR)",
        labelEn: "Subject Access (SAR)",
        labelRo: "Date Personale (SAR)",
        statuteBadge: "Art. 15 UK GDPR · DPA 2018",
        icon: <Database className="w-3.5 h-3.5 text-[#34D399]" />,
      },
    ],
    []
  );

  // Group the 10 most recent unsaved conversations by date
  const groupedUnsavedChats = useMemo(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const yesterdayISO = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const groupsMap = new Map<
      string,
      { dateISO: string; displayDate: string; items: RecentUnsavedChat[] }
    >();

    recentUnsavedChats.slice(0, 10).forEach((chat) => {
      const key = chat.dateISO || todayISO;
      if (!groupsMap.has(key)) {
        let displayDate = chat.dateLabel || key;
        if (key === todayISO) {
          displayDate =
            locale === "pl"
              ? `Dzisiaj · ${chat.dateLabel}`
              : locale === "ro"
              ? `Astăzi · ${chat.dateLabel}`
              : `Today · ${chat.dateLabel}`;
        } else if (key === yesterdayISO) {
          displayDate =
            locale === "pl"
              ? `Wczoraj · ${chat.dateLabel}`
              : locale === "ro"
              ? `Ieri · ${chat.dateLabel}`
              : `Yesterday · ${chat.dateLabel}`;
        }
        groupsMap.set(key, { dateISO: key, displayDate, items: [] });
      }
      groupsMap.get(key)!.items.push(chat);
    });

    return Array.from(groupsMap.values());
  }, [recentUnsavedChats, locale]);

  // Build unified showcase items for "Letters from Elon":
  // 1) Generated & Saved Professional Correspondence (sentLetters)
  // 2) Pre-filled Official Legal Templates (templates rendered with user's profile)
  const allElonShowcaseItems = useMemo<ElonShowcaseItem[]>(() => {
    const correspondenceItems: ElonShowcaseItem[] = sentLetters.map((letter) => {
      const classified = classifySentLetter(letter);
      const primaryTag = letter.primaryTag || classified.primaryTag;
      const lowerTitle = (letter.title || "").toLowerCase();
      const lowerContent = (letter.content || "").toLowerCase();

      let categoryLabel = letter.categoryLabelPl || "";
      let displayTitle = letter.titlePl || letter.title;
      let caseLine = letter.caseSummaryPl || "";
      let topicId: ElonTopicId = "grievance";

      if (
        lowerTitle.includes("holiday") ||
        lowerTitle.includes("urlop") ||
        lowerContent.includes("holiday pay") ||
        letter.templateId === "flexible_working"
      ) {
        topicId = "holiday_contract";
        categoryLabel = categoryLabel || "PISMO O URLOP";
      } else if (
        primaryTag === "Wages" ||
        lowerTitle.includes("nadgodzin") ||
        lowerTitle.includes("deduction") ||
        lowerTitle.includes("wages")
      ) {
        topicId = "wages";
        categoryLabel = categoryLabel || "WEZWANIE DO ZAPŁATY";
      } else if (primaryTag === "Settlement") {
        topicId = "settlement";
        categoryLabel = categoryLabel || "PROPOZYCJA UGODY";
      } else if (primaryTag === "Contract") {
        topicId = "holiday_contract";
        categoryLabel = categoryLabel || "UMOWA I CZAS PRACY";
      } else if (primaryTag === "Sick Pay") {
        topicId = "sick_pay";
        categoryLabel = categoryLabel || "CHOROBOWE (SSP)";
      } else if (primaryTag === "Dismissal") {
        topicId = "dismissal";
        categoryLabel = categoryLabel || "ODWOŁANIE OD ZWOLNIENIA";
      } else if (primaryTag === "Data & GDPR") {
        topicId = "data_gdpr";
        categoryLabel = categoryLabel || "WNIOSEK O DANE (SAR)";
      } else {
        topicId = "grievance";
        categoryLabel = categoryLabel || "SKARGA DO HR (GRIEVANCE)";
      }

      if (
        displayTitle === "Formal Written Grievance (ACAS Code of Practice No. 1)" ||
        displayTitle.includes("Formal Written Grievance")
      ) {
        displayTitle = "Pismo do HR – oficjalna skarga pracownicza (Formal Grievance)";
      } else if (
        displayTitle.includes("Protected Settlement") ||
        displayTitle.includes("Holiday Pay")
      ) {
        displayTitle = "Pismo do HR – niewypłacony ekwiwalent za urlop (Holiday Pay)";
        categoryLabel = "PISMO O URLOP";
        topicId = "holiday_contract";
      } else if (
        displayTitle.includes("Unlawful Deduction") ||
        displayTitle.includes("niewypłacone nadgodziny")
      ) {
        displayTitle = "Pismo do HR – niewypłacone nadgodziny";
        categoryLabel = "WEZWANIE DO ZAPŁATY";
        topicId = "wages";
      }

      if (!caseLine) {
        if (categoryLabel === "PISMO O URLOP") {
          caseLine = "Sprawa: Agencja nie zapłaciła mi za 3 dni urlopu (£486)";
        } else if (categoryLabel === "WEZWANIE DO ZAPŁATY") {
          caseLine = `Sprawa: Niewypłacone nadgodziny i potrącenia (${letter.recipient})`;
        } else {
          caseLine = `Sprawa: ${letter.recipient} · ${classified.statutoryReference}`;
        }
      }

      return {
        id: letter.id,
        itemKind: "correspondence",
        topicId,
        categoryLabel,
        displayTitle,
        dateLabel: letter.date,
        caseOrStatuteLine: caseLine,
        statutoryReference: letter.statutoryReference || classified.statutoryReference,
        recipient: letter.recipient,
        content: letter.content,
        templateId: letter.templateId,
        rawLetter: letter,
      };
    });

    const templateItems: ElonShowcaseItem[] = templates.map((tpl) => {
      const prefilledContent = renderTemplateLetter(tpl, {}, user);
      let topicId: ElonTopicId = "grievance";
      let categoryLabel = "WZÓR PISMA • SKARGA HR";

      if (tpl.id === "unpaid_wages" || tpl.category === "Wages") {
        topicId = "wages";
        categoryLabel = "WZÓR PISMA • WEZWANIE DO ZAPŁATY";
      } else if (tpl.id === "settlement_agreement" || tpl.category === "Settlement") {
        topicId = "settlement";
        categoryLabel = "WZÓR PISMA • UGODA ACAS (S.111A)";
      } else if (tpl.id === "flexible_working") {
        topicId = "holiday_contract";
        categoryLabel = "WZÓR PISMA • UMOWA I GRAFIK";
      } else if (tpl.id === "statutory_sick_pay" || tpl.category === "Sick") {
        topicId = "sick_pay";
        categoryLabel = "WZÓR PISMA • CHOROBOWE SSP";
      } else if (tpl.id === "constructive_dismissal" || tpl.category === "Dismissal") {
        topicId = "dismissal";
        categoryLabel = "WZÓR PISMA • ODWOŁANIE OD ZWOLNIENIA";
      } else if (tpl.id === "sar_data_request" || tpl.category === "Data") {
        topicId = "data_gdpr";
        categoryLabel = "WZÓR PISMA • WNIOSEK RODO (SAR)";
      } else if (tpl.id === "health_safety_breach") {
        topicId = "grievance";
        categoryLabel = "WZÓR PISMA • NARUSZENIE BHP";
      }

      const displayTitle =
        locale === "pl"
          ? tpl.titlePl
          : locale === "ro"
          ? tpl.titleRo
          : tpl.titleEn;

      return {
        id: `tpl_showcase_${tpl.id}`,
        itemKind: "template",
        topicId,
        categoryLabel,
        displayTitle,
        dateLabel: "Gotowy szablon EN",
        caseOrStatuteLine: `Podstawa: ${tpl.statutoryReference}`,
        statutoryReference: tpl.statutoryReference,
        recipient: user.employerName || "UK Employer HR",
        content: prefilledContent,
        templateId: tpl.id,
        rawTemplate: tpl,
      };
    });

    return [...correspondenceItems, ...templateItems];
  }, [sentLetters, templates, user, locale]);

  // Filter items by selected showcase filter (all / correspondence / templates) and topic
  const filteredElonItems = useMemo(() => {
    return allElonShowcaseItems.filter((item) => {
      if (elonShowcaseFilter === "correspondence" && item.itemKind !== "correspondence") {
        return false;
      }
      if (elonShowcaseFilter === "templates" && item.itemKind !== "template") {
        return false;
      }
      if (selectedElonTopic !== "ALL" && item.topicId !== selectedElonTopic) {
        return false;
      }
      return true;
    });
  }, [allElonShowcaseItems, elonShowcaseFilter, selectedElonTopic]);

  // Group filtered items by topic for the categorized showcase view
  const groupedElonByTopic = useMemo(() => {
    const groups: {
      topic: (typeof elonTopics)[number];
      items: ElonShowcaseItem[];
    }[] = [];

    elonTopics
      .filter((t) => t.id !== "ALL")
      .forEach((topic) => {
        const matching = filteredElonItems.filter((it) => it.topicId === topic.id);
        if (matching.length > 0) {
          groups.push({ topic, items: matching });
        }
      });

    return groups;
  }, [filteredElonItems, elonTopics]);

  // Count per topic for filter pills
  const topicCounts = useMemo(() => {
    const counts: Record<ElonTopicId, number> = {
      ALL: 0,
      holiday_contract: 0,
      wages: 0,
      grievance: 0,
      settlement: 0,
      sick_pay: 0,
      dismissal: 0,
      data_gdpr: 0,
    };

    allElonShowcaseItems.forEach((item) => {
      if (elonShowcaseFilter === "correspondence" && item.itemKind !== "correspondence") {
        return;
      }
      if (elonShowcaseFilter === "templates" && item.itemKind !== "template") {
        return;
      }
      counts.ALL += 1;
      counts[item.topicId] = (counts[item.topicId] || 0) + 1;
    });

    return counts;
  }, [allElonShowcaseItems, elonShowcaseFilter]);

  // Unified Pending Sync Queue items (Queued Chat Messages + Pending Sync Actions + Protected Offline Drafts)
  const queuedChatMessages = useMemo(
    () =>
      chatMessages.filter(
        (m) => m.role === "user" && (m.status === "queued" || m.status === "sending")
      ),
    [chatMessages]
  );

  const totalPendingQueueCount =
    queuedChatMessages.length +
    pendingSyncActions.length +
    (chatDraft.trim().length > 0 ? 1 : 0) +
    (savedLetterDraft ? 1 : 0);

  const handleManualSyncNow = async () => {
    if (isSyncingQueueNow) return;
    setIsSyncingQueueNow(true);
    try {
      await syncPendingActionsNow();
    } finally {
      setTimeout(() => setIsSyncingQueueNow(false), 350);
    }
  };

  if (!isMenuDrawerOpen) return null;

  const initials =
    user.fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AK";

  const closeDrawer = () => {
    setIsMenuDrawerOpen(false);
  };

  const handleCreateNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteDesc.trim()) return;
    addNote(newNoteTitle.trim(), newNoteDesc.trim(), newNoteCategory);
    setNewNoteTitle("");
    setNewNoteDesc("");
    setIsAddingNote(false);
  };

  const handleDownloadItem = (item: ElonShowcaseItem) => {
    const blob = new Blob([item.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.displayTitle.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("downloadLetter"));
  };

  const handleOpenTemplateInBuilder = (templateId: string) => {
    setActiveTemplateId(templateId);
    setActiveTab("templates");
    closeDrawer();
  };

  const handleCopyText = (text: string, msg?: string) => {
    navigator.clipboard.writeText(text);
    showToast(msg || t("copyClipboard"));
  };

  const renderTopicIcon = (iconType: UnsavedChatIconType) => {
    switch (iconType) {
      case "wages":
        return {
          icon: <Banknote className="w-4 h-4 text-[#FBBF24]" />,
          bg: "bg-[#FBBF24]/15 border-[#FBBF24]/40",
          label: locale === "pl" ? "ROZMOWA • PŁACE" : "CHAT • WAGES",
        };
      case "grievance":
        return {
          icon: <ShieldAlert className="w-4 h-4 text-[#FF6A00]" />,
          bg: "bg-[#FF6A00]/15 border-[#FF6A00]/40",
          label: locale === "pl" ? "ROZMOWA • SKARGA" : "CHAT • GRIEVANCE",
        };
      case "sick_pay":
        return {
          icon: <HeartPulse className="w-4 h-4 text-[#A78BFA]" />,
          bg: "bg-[#A78BFA]/15 border-[#A78BFA]/40",
          label: locale === "pl" ? "ROZMOWA • CHOROBOWE SSP" : "CHAT • SSP",
        };
      case "dismissal":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-[#EF4444]" />,
          bg: "bg-[#EF4444]/15 border-[#EF4444]/40",
          label: locale === "pl" ? "ROZMOWA • ZWOLNIENIE" : "CHAT • DISMISSAL",
        };
      case "contract":
        return {
          icon: <Briefcase className="w-4 h-4 text-[#38BDF8]" />,
          bg: "bg-[#38BDF8]/15 border-[#38BDF8]/40",
          label: locale === "pl" ? "ROZMOWA • UMOWA" : "CHAT • CONTRACT",
        };
      case "settlement":
        return {
          icon: <Scale className="w-4 h-4 text-[#2EE59D]" />,
          bg: "bg-[#2EE59D]/15 border-[#2EE59D]/40",
          label: locale === "pl" ? "ROZMOWA • UGODA" : "CHAT • SETTLEMENT",
        };
      case "data":
        return {
          icon: <Database className="w-4 h-4 text-[#34D399]" />,
          bg: "bg-[#34D399]/15 border-[#34D399]/40",
          label: "ROZMOWA • GDPR / SAR",
        };
      default:
        return {
          icon: <MessageSquare className="w-4 h-4 text-[#2EE59D]" />,
          bg: "bg-[#2EE59D]/15 border-[#2EE59D]/35",
          label: locale === "pl" ? "ROZMOWA Z ELONEM" : "CHAT WITH ELON",
        };
    }
  };

  // Miniature A4 Paper Preview with Circular Ask Elon Stamp Badge (matching reference image)
  const renderMiniPaperThumbnail = (
    accentLine: string,
    bodySnippet: string,
    variant: "letter" | "note" | "chat" = "letter"
  ) => (
    <div className="relative w-[68px] h-[86px] rounded-md bg-white text-[#161B22] p-1.5 shadow-md shrink-0 select-none border border-white/40 flex flex-col justify-between overflow-visible">
      {/* Top micro header */}
      <div>
        <div className="flex items-center justify-between border-b border-gray-300 pb-0.5 mb-1">
          <div className="space-y-0.5">
            <div className="w-7 h-[2px] bg-[#161B22] rounded-full" />
            <div className="w-5 h-[1.5px] bg-gray-400 rounded-full" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#0B6E4F]/25 border border-[#FF6A00] flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-[#0B6E4F]" />
          </div>
        </div>

        {/* Micro Subject bar */}
        <div
          className={`h-[3px] w-11 rounded-full mb-1 ${
            variant === "letter"
              ? "bg-[#161B22]"
              : variant === "note"
              ? "bg-[#FF6A00]"
              : "bg-[#0B6E4F]"
          }`}
        />

        {/* Micro text lines */}
        <p className="text-[4.2px] leading-[5.2px] font-mono text-gray-700 line-clamp-6 break-words">
          <strong className="text-black block mb-0.5">{accentLine}</strong>
          {bodySnippet}
        </p>
      </div>

      {/* Bottom signature lines */}
      <div className="space-y-0.5 pt-0.5 border-t border-gray-200">
        <div className="w-6 h-[1.5px] bg-gray-500 rounded-full" />
        <div className="w-4 h-[1.5px] bg-gray-300 rounded-full" />
      </div>

      {/* Circular Ask Elon Stamp Badge overlapping bottom-right */}
      <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#FFF6EF] border-2 border-[#FF6A00] shadow-md flex items-center justify-center overflow-hidden">
        <AskElonShieldLogo className="w-5 h-5" isActive={true} />
      </div>
    </div>
  );

  // Storage Progress Widget (matching "Miejsce na pliki: 4,1 GB z 5 GB · 82%" from reference image)
  const renderStorageQuotaBox = () => (
    <div className="rounded-2xl bg-[#09213A] border border-[#FF6A00]/65 px-4 py-3 shadow-md">
      <div className="flex items-center justify-between text-xs font-extrabold">
        <div className="flex items-center gap-2 text-white">
          <Cloud className="w-4 h-4 text-[#FF6A00] shrink-0" />
          <span>Miejsce na pliki: 4,1 GB z 5 GB</span>
        </div>
        <span className="text-[#FF6A00] font-black font-mono tabular-nums">82%</span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-[#051221] overflow-hidden my-2 border border-white/5">
        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF8533]" />
      </div>

      <p className="text-xs font-bold text-[#DCE7F3]">Zostało Ci 921 MB miejsca</p>
    </div>
  );

  // Header Title & Icon depending on active drawer tab
  const getDrawerHeaderMeta = () => {
    switch (drawerTab) {
      case "elon_letters":
        return {
          icon: <Files className="w-6 h-6 text-[#FF6A00]" />,
          title:
            locale === "pl"
              ? "Dokumenty od Elona"
              : locale === "ro"
              ? "Documente de la Elon"
              : "Letters from Elon",
        };
      case "notes":
        return {
          icon: <FileText className="w-6 h-6 text-[#FF6A00]" />,
          title:
            locale === "pl"
              ? "Notatnik i dowody"
              : locale === "ro"
              ? "Notițe și dovezi"
              : "Notebook & Evidence",
        };
      case "chat_history":
        return {
          icon: <Clock className="w-6 h-6 text-[#FF6A00]" />,
          title:
            locale === "pl"
              ? "Historia czatów"
              : locale === "ro"
              ? "Istoric conversații"
              : "Unsaved Chat History",
        };
      default:
        return {
          icon: <Menu className="w-6 h-6 text-[#FF6A00]" />,
          title: "Menu",
        };
    }
  };

  const headerMeta = getDrawerHeaderMeta();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#050C16] border-l border-white/10 w-full max-w-md h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Drawer Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {headerMeta.icon}
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
              {headerMeta.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Zamknij panel boczny"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 4 MAIN DRAWER TABS: 1. Menu, 2. Historia, 3. Notatki, 4. Pisma Elona */}
        <div className="px-4 pb-3 border-b border-white/10 shrink-0">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#0A213A] border border-[#1E436E]/80">
            <button
              type="button"
              onClick={() => setDrawerTab("menu")}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                drawerTab === "menu"
                  ? "bg-[#FF6A00] text-black shadow-md"
                  : "text-[#BACADA] hover:text-white hover:bg-white/5"
              }`}
            >
              <Menu className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Menu</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerTab("chat_history")}
              className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                drawerTab === "chat_history"
                  ? "bg-[#FF6A00] text-black shadow-md"
                  : "text-[#BACADA] hover:text-white hover:bg-white/5"
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Historia</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerTab("notes")}
              className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                drawerTab === "notes"
                  ? "bg-[#FF6A00] text-black shadow-md"
                  : "text-[#BACADA] hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Notatki</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerTab("elon_letters")}
              className={`flex items-center justify-center gap-1 py-2.5 px-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                drawerTab === "elon_letters"
                  ? "bg-[#FF6A00] text-black shadow-md"
                  : "text-[#BACADA] hover:text-white hover:bg-white/5"
              }`}
            >
              <Files className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Pisma Elona</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            TAB 1: MENU (Z sekcją Pisma od Elona wg tematów)
           ========================================================= */}
        {drawerTab === "menu" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
            {/* User Account Card */}
            <div className="rounded-2xl bg-gradient-to-r from-[#0B2948] to-[#081E36] border border-[#1E436E]/80 p-4 shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-[#0B6E4F] border-2 border-[#FF6A00] flex items-center justify-center font-black text-lg text-white shrink-0 shadow-md">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-extrabold text-white truncate leading-snug">
                    {user.fullName || "Anna Kowalska"}
                  </h3>
                  <p className="text-xs text-[#9BB0C5] truncate mt-0.5">
                    {locale === "pl"
                      ? `ID konta: ${user.accountId}`
                      : locale === "ro"
                      ? `ID cont: ${user.accountId}`
                      : `Account ID: ${user.accountId}`}
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                        user.isPro
                          ? "bg-[#FF6A00]/20 border-[#FF6A00]/50 text-[#FF6A00]"
                          : "bg-[#07182B]/70 border-white/25 text-white"
                      }`}
                    >
                      {user.isPro
                        ? locale === "pl"
                          ? "Plan PRO"
                          : locale === "ro"
                          ? "Plan PRO"
                          : "PRO Plan"
                        : locale === "pl"
                        ? "Plan darmowy"
                        : locale === "ro"
                        ? "Plan gratuit"
                        : "Free plan"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: NAWIGACJA */}
            <div>
              <p className="px-2 mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7C93AB]">
                {locale === "pl" ? "NAWIGACJA" : locale === "ro" ? "NAVIGARE" : "NAVIGATION"}
              </p>

              <div className="space-y-1">
                {/* Czat z Elonem */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("chat");
                    closeDrawer();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "chat"
                      ? "bg-[#3B1D0B] border border-[#FF6A00]/25 text-[#FF6A00] shadow-md"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <MessageCircle
                      className={`w-5 h-5 ${
                        activeTab === "chat" ? "text-[#FF6A00]" : "text-[#8EA4BA]"
                      }`}
                    />
                    <span>
                      {locale === "pl"
                        ? "Czat z Elonem"
                        : locale === "ro"
                        ? "Chat cu Elon"
                        : "Chat with Elon"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>

                {/* Sprawy */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("cases");
                    closeDrawer();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "cases"
                      ? "bg-[#3B1D0B] border border-[#FF6A00]/25 text-[#FF6A00] shadow-md"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Folder
                      className={`w-5 h-5 ${
                        activeTab === "cases"
                          ? "text-[#FF6A00] fill-[#FF6A00]"
                          : "text-[#8EA4BA]"
                      }`}
                    />
                    <span>
                      {locale === "pl" ? "Sprawy" : locale === "ro" ? "Cazuri" : "Cases"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>

                {/* Pisma */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("templates");
                    closeDrawer();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "templates"
                      ? "bg-[#3B1D0B] border border-[#FF6A00]/25 text-[#FF6A00] shadow-md"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <FileText
                      className={`w-5 h-5 ${
                        activeTab === "templates" ? "text-[#FF6A00]" : "text-[#8EA4BA]"
                      }`}
                    />
                    <span>
                      {locale === "pl" ? "Pisma" : locale === "ro" ? "Scrisori" : "Letters"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>

                {/* Forum */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("forum");
                    closeDrawer();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "forum"
                      ? "bg-[#3B1D0B] border border-[#FF6A00]/25 text-[#FF6A00] shadow-md"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Users
                      className={`w-5 h-5 ${
                        activeTab === "forum" ? "text-[#FF6A00]" : "text-[#8EA4BA]"
                      }`}
                    />
                    <span>Forum</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>

                {/* Profil */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("profile");
                    setProfileSubTab("details");
                    closeDrawer();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "profile" && profileSubTab === "details"
                      ? "bg-[#3B1D0B] border border-[#FF6A00]/25 text-[#FF6A00] shadow-md"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <UserCircle
                      className={`w-5 h-5 ${
                        activeTab === "profile" && profileSubTab === "details"
                          ? "text-[#FF6A00]"
                          : "text-[#8EA4BA]"
                      }`}
                    />
                    <span>
                      {locale === "pl" ? "Profil" : locale === "ro" ? "Profil" : "Profile"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>
              </div>
            </div>

            {/* Section 2: LETTERS FROM ELON (PISMA OD ELONA) SHOWCASE */}
            <div className="rounded-2xl bg-[#09213A] border border-[#FF6A00]/45 p-3.5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#FFF6EF] border-2 border-[#FF6A00] flex items-center justify-center shrink-0">
                    <AskElonShieldLogo className="w-5 h-5" isActive={true} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-[#FF6A00] truncate">
                      {locale === "pl"
                        ? "Pisma od Elona · Wzory i Korespondencja"
                        : "Letters from Elon · Legal Correspondence"}
                    </p>
                    <p className="text-[11px] text-[#BACADA] truncate">
                      {sentLetters.length} wygenerowane · {templates.length} szablonów UK
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedElonTopic("ALL");
                    setDrawerTab("elon_letters");
                  }}
                  className="px-2.5 py-1 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black text-[11px] font-black shrink-0 cursor-pointer"
                >
                  Otwórz ({allElonShowcaseItems.length})
                </button>
              </div>

              {/* Topic Shortcut Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {elonTopics
                  .filter((tItem) => tItem.id !== "ALL")
                  .map((tItem) => (
                    <button
                      key={tItem.id}
                      type="button"
                      onClick={() => {
                        setSelectedElonTopic(tItem.id);
                        setDrawerTab("elon_letters");
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0B2948] hover:bg-[#123A63] border border-white/10 text-[11px] font-bold text-white whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                    >
                      {tItem.icon}
                      <span>
                        {locale === "pl"
                          ? tItem.labelPl
                          : locale === "ro"
                          ? tItem.labelRo
                          : tItem.labelEn}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Section 3: TWOJE NARZĘDZIA */}
            <div>
              <p className="px-2 mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7C93AB]">
                {locale === "pl"
                  ? "TWOJE NARZĘDZIA"
                  : locale === "ro"
                  ? "INSTRUMENTELE TALE"
                  : "YOUR TOOLS"}
              </p>

              <div className="space-y-1">
                {/* Notatki -> switches directly to Notatki tab in Drawer */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("notes")}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <FileText className="w-5 h-5 text-[#8EA4BA]" />
                    <span>
                      {locale === "pl" ? "Notatki" : locale === "ro" ? "Notițe" : "Notes"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px] font-mono tabular-nums text-[#2EE59D]">
                      {notes.length}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>

                {/* Pisma Elona -> switches directly to Pisma Elona tab in Drawer */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("elon_letters")}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <Files className="w-5 h-5 text-[#FF6A00]" />
                    <span>
                      {locale === "pl"
                        ? "Pisma Elona (Korespondencja i Wzory)"
                        : locale === "ro"
                        ? "Scrisori de la Elon"
                        : "Letters from Elon"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#FF6A00]/20 border border-[#FF6A00]/40 text-[10px] font-mono tabular-nums text-[#FF6A00]">
                      {allElonShowcaseItems.length}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>

                {/* Wiadomości */}
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    setIsMessagesModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <Mail className="w-5 h-5 text-[#8EA4BA]" />
                    <span>
                      {locale === "pl"
                        ? "Wiadomości"
                        : locale === "ro"
                        ? "Mesaje"
                        : "Messages"}
                    </span>
                    {unreadMessagesCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#FF6A00] text-black text-[10px] font-black font-mono tabular-nums">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>

                {/* Dokumenty (Payslip Audit) */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("profile");
                    setProfileSubTab("docs");
                    closeDrawer();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "profile" && profileSubTab === "docs"
                      ? "bg-[#3B1D0B] border border-[#FF6A00]/25 text-[#FF6A00] shadow-md"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Folder
                      className={`w-5 h-5 ${
                        activeTab === "profile" && profileSubTab === "docs"
                          ? "text-[#FF6A00] fill-[#FF6A00]"
                          : "text-[#8EA4BA]"
                      }`}
                    />
                    <span>
                      {locale === "pl"
                        ? "Dokumenty (Payslipy)"
                        : locale === "ro"
                        ? "Documente"
                        : "Documents"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>

                {/* Historia czatów */}
                <button
                  type="button"
                  onClick={() => setDrawerTab("chat_history")}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <BarChart2 className="w-5 h-5 text-[#8EA4BA]" />
                    <span>
                      {locale === "pl"
                        ? "Historia czatów"
                        : locale === "ro"
                        ? "Istoric conversații"
                        : "Chat History"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white/10 border border-white/10 text-[10px] font-mono tabular-nums text-[#2EE59D]">
                      {recentUnsavedChats.length}/10
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8EA4BA]" />
                </button>
              </div>
            </div>

            {/* Section 3B: USTAWIENIA OFFLINE I KOLEJKA SYNCHRONIZACJI (OFFLINE SETTINGS & PENDING ACTIONS) */}
            <div>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C93AB]">
                  {locale === "pl"
                    ? "TRYB OFFLINE I SYNCHRONIZACJA"
                    : locale === "ro"
                    ? "SETĂRI OFFLINE ȘI SINCRONIZARE"
                    : "OFFLINE SETTINGS & SYNC QUEUE"}
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    isOnline
                      ? "bg-[#0B6E4F]/30 border-[#2EE59D]/40 text-[#2EE59D]"
                      : networkStatus === "reconnecting"
                      ? "bg-[#FBBF24]/20 border-[#FBBF24]/40 text-[#FBBF24]"
                      : "bg-[#FF6A00]/20 border-[#FF6A00]/50 text-[#FF6A00]"
                  }`}
                >
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3" />
                      <span>ONLINE</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3" />
                      <span>
                        {networkStatus === "reconnecting"
                          ? locale === "pl"
                            ? "ŁĄCZENIE..."
                            : "RECONNECTING"
                          : "OFFLINE"}
                      </span>
                    </>
                  )}
                </span>
              </div>

              <div className="rounded-2xl bg-[#09213A] border border-[#1E436E]/90 p-3.5 space-y-3.5 shadow-lg">
                {/* Status Bar & Last Sync Info */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-white truncate">
                      {isOnline
                        ? locale === "pl"
                          ? "Połączenie aktywne · Chmura ask Elon"
                          : locale === "ro"
                          ? "Conexiune activă · Cloud ask Elon"
                          : "Connection Active · ask Elon Cloud"
                        : locale === "pl"
                        ? "Praca bez sieci · Kolejkowanie włączone"
                        : locale === "ro"
                        ? "Mod Offline · Acțiunile sunt puse în coadă"
                        : "Working Offline · Queuing Active"}
                    </p>
                    <p className="text-[11px] text-[#8EA4BA] truncate mt-0.5">
                      {locale === "pl"
                        ? `Ostatnia synchr.: ${offlineSettings.lastSyncedAt}`
                        : locale === "ro"
                        ? `Ultima sincr.: ${offlineSettings.lastSyncedAt}`
                        : `Last synced: ${offlineSettings.lastSyncedAt}`}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black font-mono shrink-0 border ${
                      totalPendingQueueCount > 0
                        ? "bg-[#FF6A00]/20 border-[#FF6A00]/50 text-[#FF6A00]"
                        : "bg-[#2EE59D]/15 border-[#2EE59D]/35 text-[#2EE59D]"
                    }`}
                  >
                    {locale === "pl"
                      ? `W kolejce: ${totalPendingQueueCount}`
                      : locale === "ro"
                      ? `În coadă: ${totalPendingQueueCount}`
                      : `Queued: ${totalPendingQueueCount}`}
                  </span>
                </div>

                {/* ToggleSwitches for Offline Settings */}
                <div className="space-y-2.5">
                  {/* Toggle 1: Background Sync */}
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0B2948]/80 border border-white/10">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white">
                        {locale === "pl"
                          ? "Synchronizacja w tle (Background Sync)"
                          : locale === "ro"
                          ? "Sincronizare în fundal (Background Sync)"
                          : "Background Sync"}
                      </p>
                      <p className="text-[11px] text-[#9BB0C5] leading-snug mt-0.5">
                        {locale === "pl"
                          ? "Wyślij oczekujące wiadomości, pisma i notatki automatycznie po odzyskaniu sieci"
                          : locale === "ro"
                          ? "Trimite automat acțiunile în așteptare la restabilirea conexiunii"
                          : "Automatically process queued messages, letters & notes when back online"}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={offlineSettings.backgroundSyncEnabled}
                      onClick={() =>
                        updateOfflineSettings({
                          backgroundSyncEnabled: !offlineSettings.backgroundSyncEnabled,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer ${
                        offlineSettings.backgroundSyncEnabled
                          ? "bg-[#2EE59D]"
                          : "bg-[#051221] border-white/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full transition duration-200 ${
                          offlineSettings.backgroundSyncEnabled
                            ? "translate-x-5 bg-black"
                            : "translate-x-0 bg-[#8EA4BA]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 2: Offline Cache of Templates & Letters */}
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0B2948]/80 border border-white/10">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white">
                        {locale === "pl"
                          ? "Dostęp offline do wzorów pism i dowodów"
                          : locale === "ro"
                          ? "Acces offline la șabloane și scrisori"
                          : "Offline Cache for Templates & Letters"}
                      </p>
                      <p className="text-[11px] text-[#9BB0C5] leading-snug mt-0.5">
                        {locale === "pl"
                          ? "Przechowuj szablony UK (ERA 1996, ACAS) oraz wygenerowane pisma w pamięci telefonu"
                          : locale === "ro"
                          ? "Păstrează șabloanele legale UK și scrisorile în memoria locală"
                          : "Keep UK legal templates & generated correspondence available offline"}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={offlineSettings.autoCacheTemplatesAndLetters}
                      onClick={() =>
                        updateOfflineSettings({
                          autoCacheTemplatesAndLetters:
                            !offlineSettings.autoCacheTemplatesAndLetters,
                        })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer ${
                        offlineSettings.autoCacheTemplatesAndLetters
                          ? "bg-[#2EE59D]"
                          : "bg-[#051221] border-white/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full transition duration-200 ${
                          offlineSettings.autoCacheTemplatesAndLetters
                            ? "translate-x-5 bg-black"
                            : "translate-x-0 bg-[#8EA4BA]"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Toggle 3: Simulate Offline Mode (for testing queue behavior) */}
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0B2948]/80 border border-white/10">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-white">
                        {locale === "pl"
                          ? "Tryb pracy Offline (Test kolejkowania)"
                          : locale === "ro"
                          ? "Simulare Mod Offline (Test coadă)"
                          : "Work Offline Mode (Queue Simulation)"}
                      </p>
                      <p className="text-[11px] text-[#9BB0C5] leading-snug mt-0.5">
                        {locale === "pl"
                          ? "Wstrzymaj połączenie, aby kolejkować nowe pytania i pisma do późniejszej wysyłki"
                          : locale === "ro"
                          ? "Pune în coadă acțiunile noi pentru trimitere ulterioară"
                          : "Queue outgoing chat prompts, letters & notes until connection returns"}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isSimulatedOffline}
                      onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer ${
                        isSimulatedOffline
                          ? "bg-[#FF6A00]"
                          : "bg-[#051221] border-white/20"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full transition duration-200 ${
                          isSimulatedOffline
                            ? "translate-x-5 bg-black"
                            : "translate-x-0 bg-[#8EA4BA]"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* PENDING ACTIONS QUEUE LIST */}
                <div className="pt-1 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#FF6A00]">
                      {locale === "pl"
                        ? `Oczekujące akcje w kolejce (${totalPendingQueueCount})`
                        : locale === "ro"
                        ? `Acțiuni în așteptare (${totalPendingQueueCount})`
                        : `Pending Actions Queue (${totalPendingQueueCount})`}
                    </p>

                    <button
                      type="button"
                      onClick={enqueueSampleOfflineAction}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0B2948] hover:bg-[#123A63] border border-[#FF6A00]/40 text-[10px] font-extrabold text-[#FF6A00] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>
                        {locale === "pl"
                          ? "Dodaj do kolejki"
                          : locale === "ro"
                          ? "Adaugă în coadă"
                          : "Queue test action"}
                      </span>
                    </button>
                  </div>

                  {totalPendingQueueCount === 0 ? (
                    <div className="rounded-xl bg-[#07182B] border border-[#2EE59D]/30 p-3 flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#2EE59D] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-white">
                          {locale === "pl"
                            ? "Wszystkie operacje zsynchronizowane"
                            : locale === "ro"
                            ? "Toate acțiunile sunt sincronizate"
                            : "All actions are synced"}
                        </p>
                        <p className="text-[10px] text-[#9BB0C5]">
                          {locale === "pl"
                            ? "Brak oczekujących wiadomości lub pism w kolejce offline."
                            : locale === "ro"
                            ? "Nicio acțiune în așteptare în coada offline."
                            : "No pending messages, letters, or notes waiting in the queue."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                      {/* 1. Queued Chat Messages */}
                      {queuedChatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded-xl bg-[#07182B] border border-[#FF6A00]/45 p-2.5 flex items-start justify-between gap-2.5"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#FF6A00]/15 border border-[#FF6A00]/40 flex items-center justify-center shrink-0 mt-0.5">
                              <MessageCircle className="w-3.5 h-3.5 text-[#FF6A00]" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase text-[#FF6A00]">
                                  {locale === "pl"
                                    ? "CZAT Z ELONEM"
                                    : locale === "ro"
                                    ? "MESAJ CHAT"
                                    : "CHAT MESSAGE"}
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FF6A00]/20 text-[#FF6A00]">
                                  {msg.status === "sending"
                                    ? locale === "pl"
                                      ? "Wysyłanie..."
                                      : "Sending..."
                                    : locale === "pl"
                                    ? "Czeka na sieć"
                                    : "Queued"}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                                {msg.text}
                              </p>
                              <p className="text-[10px] text-[#8EA4BA] mt-0.5">
                                {msg.timestamp} · Wyśle się automatycznie po przywróceniu połączenia
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeQueuedChatMessage(msg.id)}
                            className="p-1.5 rounded-lg text-[#8EA4BA] hover:text-[#EF4444] hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
                            title="Usuń z kolejki"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* 2. Pending Sync Actions (Letters, Cases, Notes, Profile) */}
                      {pendingSyncActions.map((action) => (
                        <div
                          key={action.id}
                          className="rounded-xl bg-[#07182B] border border-[#1E436E] p-2.5 flex items-start justify-between gap-2.5"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#2EE59D]/15 border border-[#2EE59D]/35 flex items-center justify-center shrink-0 mt-0.5">
                              {action.type === "letter_save" ? (
                                <Files className="w-3.5 h-3.5 text-[#FF6A00]" />
                              ) : action.type === "case_create" ? (
                                <Folder className="w-3.5 h-3.5 text-[#38BDF8]" />
                              ) : action.type === "note_save" ? (
                                <FileText className="w-3.5 h-3.5 text-[#2EE59D]" />
                              ) : (
                                <UserCircle className="w-3.5 h-3.5 text-[#FBBF24]" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black uppercase text-[#2EE59D]">
                                  {action.type === "letter_save"
                                    ? locale === "pl"
                                      ? "PISMO PRAWNE"
                                      : "LEGAL LETTER"
                                    : action.type === "case_create"
                                    ? locale === "pl"
                                      ? "SPRAWA PRACOWNICZA"
                                      : "WORKPLACE CASE"
                                    : action.type === "note_save"
                                    ? locale === "pl"
                                      ? "NOTATKA / DOWÓD"
                                      : "EVIDENCE NOTE"
                                    : locale === "pl"
                                    ? "PROFIL"
                                    : "PROFILE"}
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FF6A00]/20 text-[#FF6A00]">
                                  {action.status === "syncing"
                                    ? locale === "pl"
                                      ? "Synchronizacja..."
                                      : "Syncing..."
                                    : locale === "pl"
                                    ? "W kolejce"
                                    : "Queued"}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                                {action.title}
                              </p>
                              <p className="text-[10px] text-[#8EA4BA] line-clamp-1 mt-0.5">
                                {action.createdAt} · {action.subtitle}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removePendingSyncAction(action.id)}
                            className="p-1.5 rounded-lg text-[#8EA4BA] hover:text-[#EF4444] hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
                            title="Usuń z kolejki"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* 3. Protected Unsent Chat Draft / Letter Draft */}
                      {chatDraft.trim().length > 0 && (
                        <div className="rounded-xl bg-[#07182B] border border-[#38BDF8]/40 p-2.5 flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center shrink-0 mt-0.5">
                              <MessageSquare className="w-3.5 h-3.5 text-[#38BDF8]" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase text-[#38BDF8]">
                                {locale === "pl"
                                  ? "SZKIC WIADOMOŚCI (ZABEZPIECZONY OFFLINE)"
                                  : "SAVED CHAT DRAFT"}
                              </span>
                              <p className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                                {chatDraft}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {savedLetterDraft && (
                        <div className="rounded-xl bg-[#07182B] border border-[#38BDF8]/40 p-2.5 flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/40 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-3.5 h-3.5 text-[#38BDF8]" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase text-[#38BDF8]">
                                {locale === "pl"
                                  ? "ROBOCZY SZKIC PISMA (ZABEZPIECZONY OFFLINE)"
                                  : "SAVED LETTER DRAFT"}
                              </span>
                              <p className="text-xs font-bold text-white line-clamp-1 mt-0.5">
                                Szablon: {savedLetterDraft.templateId} · Zapisano{" "}
                                {savedLetterDraft.updatedAt}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Sync / Flush Queue Action Button */}
                  <button
                    type="button"
                    onClick={handleManualSyncNow}
                    disabled={isSyncingQueueNow}
                    className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FF8533] hover:opacity-95 disabled:opacity-50 text-black font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isSyncingQueueNow ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isSimulatedOffline
                        ? locale === "pl"
                          ? "Przywróć połączenie i synchronizuj kolejkę"
                          : locale === "ro"
                          ? "Restabilește conexiunea și sincronizează coada"
                          : "Restore Connection & Sync Queue Now"
                        : locale === "pl"
                        ? `Synchronizuj oczekujące akcje teraz (${totalPendingQueueCount})`
                        : locale === "ro"
                        ? `Sincronizează acțiunile acum (${totalPendingQueueCount})`
                        : `Sync Pending Actions Now (${totalPendingQueueCount})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: KONTO */}
            <div>
              <p className="px-2 mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7C93AB]">
                {locale === "pl" ? "KONTO" : locale === "ro" ? "CONT" : "ACCOUNT"}
              </p>

              <button
                type="button"
                onClick={() => {
                  closeDrawer();
                  setIsPaywallModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Award className="w-5 h-5 text-[#8EA4BA] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {locale === "pl"
                        ? "Subskrypcja ask Elon i limity"
                        : locale === "ro"
                        ? "Abonament ask Elon și limite"
                        : "ask Elon Subscription & Limits"}
                    </p>
                    <p className="text-xs text-[#8EA4BA] truncate mt-0.5">
                      {user.isPro
                        ? locale === "pl"
                          ? "Plan PRO aktywny · Sprawdź limity"
                          : locale === "ro"
                          ? "Plan PRO activ · Vezi limitele"
                          : "PRO Plan active · View limits"
                        : locale === "pl"
                        ? "Przejdź na PRO · £9.99/mies."
                        : locale === "ro"
                        ? "Treci la PRO · £9.99/lună"
                        : "Upgrade to PRO · £9.99/mo"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8EA4BA] shrink-0" />
              </button>
            </div>

            {/* Section 5: JĘZYK APLIKACJI */}
            <div className="pt-1 pb-2">
              <p className="px-2 mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7C93AB]">
                {locale === "pl"
                  ? "JĘZYK APLIKACJI"
                  : locale === "ro"
                  ? "LIMBA APLICAȚIEI"
                  : "APP LANGUAGE"}
              </p>

              <div className="grid grid-cols-3 gap-2.5 px-1">
                {(
                  [
                    { code: "pl" as Locale, label: "🇵🇱 PL" },
                    { code: "en" as Locale, label: "🇬🇧 EN" },
                    { code: "ro" as Locale, label: "🇷🇴 RO" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLocale(item.code)}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                      locale === item.code
                        ? "bg-[#3B1D0B] border-2 border-[#FF6A00] text-white shadow-md"
                        : "bg-[#0A1E33] border border-white/15 text-[#BACADA] hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: HISTORIA CZATÓW NIEZAPISANYCH (10 ostatnich)
           ========================================================= */}
        {drawerTab === "chat_history" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
            {renderStorageQuotaBox()}

            {/* Auto-save banner with Ask Elon badge */}
            <div className="rounded-2xl bg-[#3A2010] border border-[#FF6A00]/30 px-3.5 py-2.5 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#FFF6EF] border-2 border-[#FF6A00] flex items-center justify-center shrink-0">
                  <AskElonShieldLogo className="w-5 h-5" isActive={true} />
                </div>
                <span className="text-xs font-bold text-[#FFF6EF] truncate">
                  Niezapisane czaty zapisują się tu same
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FF6A00] text-black text-[10px] font-black font-mono shrink-0">
                {recentUnsavedChats.length}/10
              </span>
            </div>

            {groupedUnsavedChats.length === 0 ? (
              <div className="rounded-2xl bg-[#0A1E34] border border-[#1E436E]/80 p-6 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-[#8EA4BA] mx-auto opacity-60" />
                <p className="text-xs font-bold text-white">
                  Brak niezapisanych rozmów w historii
                </p>
                <p className="text-[11px] text-[#8EA4BA]">
                  Każda niezapisana rozmowa z Elonem automatycznie pojawi się tutaj z podziałem na daty.
                </p>
              </div>
            ) : (
              groupedUnsavedChats.map((group) => (
                <div key={group.dateISO} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center gap-1.5 px-1 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-[#2EE59D]" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2EE59D]">
                      {group.displayDate}
                    </span>
                    <div className="flex-1 h-px bg-white/10 ml-1" />
                  </div>

                  {/* Conversation Cards styled like the Elon Letters cards */}
                  <div className="space-y-3">
                    {group.items.map((chat) => {
                      const topicMeta = renderTopicIcon(chat.iconType);
                      const isCurrent = chat.id === activeUnsavedChatId;
                      return (
                        <div
                          key={chat.id}
                          className={`rounded-2xl bg-[#0B2540] border overflow-hidden shadow-lg transition-all ${
                            isCurrent
                              ? "border-[#2EE59D]/70 ring-1 ring-[#2EE59D]/30"
                              : "border-[#1E436E]/90"
                          }`}
                        >
                          <div className="p-3.5 flex items-start gap-3.5">
                            {renderMiniPaperThumbnail(
                              chat.title,
                              chat.preview,
                              "chat"
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6A00]">
                                  {topicMeta.label}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#2EE59D]/20 text-[#2EE59D] border border-[#2EE59D]/40">
                                    Aktywna
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-extrabold text-white leading-snug mt-0.5 line-clamp-2">
                                {chat.title}
                              </h4>

                              <p className="text-xs text-[#9BB0C5] mt-1">
                                {chat.dateLabel} · {chat.updatedAtTime} · {chat.messageCount} wiad.
                              </p>

                              <p className="text-xs font-bold text-[#2EE59D] truncate mt-0.5">
                                Rozmowa: {chat.preview}
                              </p>
                            </div>
                          </div>

                          {/* 3-Action Bar at bottom of card */}
                          <div className="grid grid-cols-3 border-t border-[#1E436E]/80 bg-[#081C33]/90 divide-x divide-[#1E436E]/60">
                            <button
                              type="button"
                              onClick={() => {
                                restoreUnsavedChat(chat.id);
                                setActiveTab("chat");
                                closeDrawer();
                              }}
                              className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-[#BACADA]" />
                              <span>Otwórz</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => saveUnsavedChatAsCase(chat.id)}
                              className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#FF6A00] hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <BookmarkPlus className="w-4 h-4 text-[#FF6A00]" />
                              <span>Do spraw</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                removeUnsavedChat(chat.id);
                                showToast("Usunięto rozmowę z historii");
                              }}
                              className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-white hover:text-[#EF4444] hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-[#BACADA]" />
                              <span>Usuń</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: NOTATNIK Z PRZYCISKIEM "DODAJ NOTATKĘ"
           ========================================================= */}
        {drawerTab === "notes" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
            {renderStorageQuotaBox()}

            {/* Prominent "+ Dodaj notatkę" Button requested by user */}
            <button
              type="button"
              onClick={() => setIsAddingNote((prev) => !prev)}
              className="w-full py-3 px-4 rounded-2xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>{isAddingNote ? "Zamknij formularz notatki" : "Dodaj notatkę"}</span>
            </button>

            {/* Collapsible Add Note Form */}
            {isAddingNote && (
              <form
                onSubmit={handleCreateNoteSubmit}
                className="rounded-2xl bg-[#0B2540] border-2 border-[#FF6A00] p-4 space-y-3 shadow-xl animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#FF6A00]">
                    Nowa notatka służbowa / dowód
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="text-[#BACADA] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Tytuł (np. Rozmowa z HR ws. ekwiwalentu za urlop)"
                  className="w-full bg-[#07182B] border border-white/15 focus:border-[#2EE59D] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8EA4BA] focus:outline-none"
                />

                <select
                  value={newNoteCategory}
                  onChange={(e) => setNewNoteCategory(e.target.value)}
                  className="w-full bg-[#07182B] border border-white/15 focus:border-[#2EE59D] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Wypłata">Kategoria: Wypłata i nadgodziny</option>
                  <option value="Urlop">Kategoria: Urlop (Holiday Pay)</option>
                  <option value="Dyscyplina">Kategoria: Kwestie dyscyplinarne</option>
                  <option value="BHP / Zdrowie">Kategoria: BHP i zdrowie</option>
                  <option value="Mobbing">Kategoria: Nierówne traktowanie</option>
                  <option value="Inne">Kategoria: Inne dowody</option>
                </select>

                <textarea
                  rows={3}
                  value={newNoteDesc}
                  onChange={(e) => setNewNoteDesc(e.target.value)}
                  placeholder="Opisz dokładnie co zaszło, datę, świadków i ustalenia..."
                  className="w-full bg-[#07182B] border border-white/15 focus:border-[#2EE59D] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8EA4BA] focus:outline-none resize-none"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!newNoteTitle.trim() || !newNoteDesc.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#2EE59D] hover:bg-[#2EE59D]/90 disabled:opacity-40 text-black font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    Zapisz notatkę
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNote(false)}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            )}

            {/* Info Banner with Ask Elon Badge */}
            <div className="rounded-2xl bg-[#3A2010] border border-[#FF6A00]/30 px-3.5 py-2.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#FFF6EF] border-2 border-[#FF6A00] flex items-center justify-center shrink-0">
                <AskElonShieldLogo className="w-5 h-5" isActive={true} />
              </div>
              <span className="text-xs font-bold text-[#FFF6EF]">
                Twoje notatki i dowody zapisują się tu same
              </span>
            </div>

            {/* Notes List styled identically to Pisma Elona cards */}
            {notes.length === 0 ? (
              <div className="rounded-2xl bg-[#0A1E34] border border-[#1E436E]/80 p-6 text-center space-y-2">
                <FileText className="w-8 h-8 text-[#8EA4BA] mx-auto opacity-60" />
                <p className="text-xs font-bold text-white">Brak zapisanych notatek</p>
                <p className="text-[11px] text-[#8EA4BA]">
                  Kliknij przycisk „Dodaj notatkę” powyżej, aby zapisać dowód lub opis zdarzenia z pracy.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-2xl bg-[#0B2540] border border-[#1E436E]/90 overflow-hidden shadow-lg"
                  >
                    <div className="p-3.5 flex items-start gap-3.5">
                      {renderMiniPaperThumbnail(
                        note.title,
                        note.description,
                        "note"
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-wider text-[#FF6A00]">
                          NOTATKA • {note.category.toUpperCase()}
                        </p>

                        <h4 className="text-sm font-extrabold text-white leading-snug mt-0.5 line-clamp-2">
                          {note.title}
                        </h4>

                        <p className="text-xs text-[#9BB0C5] mt-1">
                          {note.date} · 1 str.
                        </p>

                        <p className="text-xs font-bold text-[#2EE59D] truncate mt-0.5">
                          Dowód: {note.description}
                        </p>
                      </div>
                    </div>

                    {/* 3-Action Bar at bottom of Note card */}
                    <div className="grid grid-cols-3 border-t border-[#1E436E]/80 bg-[#081C33]/90 divide-x divide-[#1E436E]/60">
                      <button
                        type="button"
                        onClick={() => setPreviewNote(note)}
                        className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4 text-[#BACADA]" />
                        <span>Otwórz</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            `${note.title} (${note.date} - ${note.category})\n\n${note.description}`,
                            "Skopiowano notatkę do schowka"
                          )
                        }
                        className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#FF6A00] hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4 text-[#FF6A00]" />
                        <span>Kopiuj</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeNote(note.id)}
                        className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-white hover:text-[#EF4444] hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-[#BACADA]" />
                        <span>Usuń</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 4: PISMA ELONA / LETTERS FROM ELON
            (Generated Correspondence + Legal Templates Categorized by Topic)
           ========================================================= */}
        {drawerTab === "elon_letters" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
            {/* Cloud Storage Quota Card */}
            {renderStorageQuotaBox()}

            {/* Auto-save banner with Ask Elon badge */}
            <div className="rounded-2xl bg-[#3A2010] border border-[#FF6A00]/30 px-3.5 py-2.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#FFF6EF] border-2 border-[#FF6A00] flex items-center justify-center shrink-0">
                <AskElonShieldLogo className="w-5 h-5" isActive={true} />
              </div>
              <span className="text-xs font-bold text-[#FFF6EF]">
                Pisma od Elona zapisują się tu same
              </span>
            </div>

            {/* Sub-filter: All vs Generated Correspondence vs Legal Templates */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#081C33] border border-[#1E436E]/80">
              <button
                type="button"
                onClick={() => setElonShowcaseFilter("all")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  elonShowcaseFilter === "all"
                    ? "bg-[#FF6A00] text-black shadow-sm"
                    : "text-[#BACADA] hover:text-white"
                }`}
              >
                Wszystkie ({allElonShowcaseItems.length})
              </button>
              <button
                type="button"
                onClick={() => setElonShowcaseFilter("correspondence")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  elonShowcaseFilter === "correspondence"
                    ? "bg-[#FF6A00] text-black shadow-sm"
                    : "text-[#BACADA] hover:text-white"
                }`}
              >
                Pisma ({sentLetters.length})
              </button>
              <button
                type="button"
                onClick={() => setElonShowcaseFilter("templates")}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                  elonShowcaseFilter === "templates"
                    ? "bg-[#FF6A00] text-black shadow-sm"
                    : "text-[#BACADA] hover:text-white"
                }`}
              >
                Szablony ({templates.length})
              </button>
            </div>

            {/* Topic Categorization Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {elonTopics.map((topic) => {
                const count = topicCounts[topic.id] || 0;
                const isSelected = selectedElonTopic === topic.id;
                if (topic.id !== "ALL" && count === 0) return null;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() =>
                      setSelectedElonTopic(
                        isSelected && topic.id !== "ALL" ? "ALL" : topic.id
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? "bg-[#3B1D0B] border-[#FF6A00] text-[#FF6A00] shadow-sm"
                        : "bg-[#09213A] border-[#1E436E] text-[#BACADA] hover:text-white"
                    }`}
                  >
                    {topic.icon}
                    <span>
                      {locale === "pl"
                        ? topic.labelPl
                        : locale === "ro"
                        ? topic.labelRo
                        : topic.labelEn}
                    </span>
                    <span className="font-mono text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Categorized Showcase Grouped by Topic */}
            <div className="space-y-5">
              {groupedElonByTopic.map(({ topic, items }) => (
                <div key={topic.id} className="space-y-3">
                  {/* Topic Category Header */}
                  <div className="flex items-center justify-between gap-2 px-1 pt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {topic.icon}
                      <span className="text-xs font-black uppercase tracking-wider text-white truncate">
                        {locale === "pl"
                          ? topic.labelPl
                          : locale === "ro"
                          ? topic.labelRo
                          : topic.labelEn}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#2EE59D] bg-[#0B6E4F]/25 border border-[#2EE59D]/30 px-2 py-0.5 rounded-md shrink-0">
                      {topic.statuteBadge}
                    </span>
                  </div>

                  {/* Cards inside this Topic */}
                  <div className="space-y-3.5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-[#0B2540] border border-[#1E436E]/90 overflow-hidden shadow-lg"
                      >
                        <div className="p-3.5 flex items-start gap-3.5">
                          {renderMiniPaperThumbnail(
                            item.displayTitle,
                            item.content,
                            "letter"
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 flex-wrap">
                              <p className="text-[11px] font-black uppercase tracking-wider text-[#FF6A00]">
                                {item.categoryLabel}
                              </p>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                  item.itemKind === "correspondence"
                                    ? "bg-[#2EE59D]/15 text-[#2EE59D] border-[#2EE59D]/40"
                                    : "bg-[#38BDF8]/15 text-[#7DD3FC] border-[#38BDF8]/40"
                                }`}
                              >
                                {item.itemKind === "correspondence"
                                  ? "Wygenerowane"
                                  : "Szablon UK"}
                              </span>
                            </div>

                            <h4 className="text-sm font-extrabold text-white leading-snug mt-0.5">
                              {item.displayTitle}
                            </h4>

                            <p className="text-xs text-[#9BB0C5] mt-1">
                              {item.dateLabel} · 1 str.
                            </p>

                            <p className="text-xs font-bold text-[#2EE59D] truncate mt-0.5">
                              {item.caseOrStatuteLine}
                            </p>
                          </div>
                        </div>

                        {/* Bottom 3-Button Bar: Otwórz | PDF / Kreator | Wyślij */}
                        <div className="grid grid-cols-3 border-t border-[#1E436E]/80 bg-[#081C33]/90 divide-x divide-[#1E436E]/60">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-white hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-[#BACADA]" />
                            <span>Otwórz</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadItem(item)}
                            className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#FF6A00] hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4 text-[#FF6A00]" />
                            <span>PDF</span>
                          </button>

                          {item.itemKind === "template" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenTemplateInBuilder(item.templateId)}
                              className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#2EE59D] hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Wand2 className="w-4 h-4 text-[#2EE59D]" />
                              <span>Kreator</span>
                            </button>
                          ) : (
                            <a
                              href={`mailto:?subject=${encodeURIComponent(
                                `${item.displayTitle} - ${user.fullName}`
                              )}&body=${encodeURIComponent(item.content)}`}
                              className="py-2.5 px-2 flex items-center justify-center gap-1.5 text-xs font-extrabold text-white hover:bg-white/5 transition-colors cursor-pointer"
                            >
                              <Share2 className="w-4 h-4 text-[#BACADA]" />
                              <span>Wyślij</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          FULL-SCREEN POP-UP PREVIEW FOR ELON LETTER / LEGAL TEMPLATE
         ========================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-[90] flex flex-col sm:items-center sm:justify-center sm:p-4 bg-[#050C16]/95 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0F2C4D] sm:border-2 sm:border-[#FF6A00] sm:rounded-3xl w-full h-full sm:h-[90vh] sm:max-w-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 bg-[#0B2038] border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#FFF6EF] border-2 border-[#FF6A00] flex items-center justify-center shrink-0">
                  <AskElonShieldLogo className="w-6 h-6" isActive={true} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6A00]">
                      {previewItem.categoryLabel}
                    </span>
                    <span className="text-[10px] font-mono text-[#BACADA]">
                      · {previewItem.statutoryReference}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                    {previewItem.displayTitle}
                  </h3>
                  <p className="text-[11px] text-[#2EE59D] truncate">
                    Do: {previewItem.recipient} · Nadawca: {user.fullName} ({user.homeAddress})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                aria-label="Zamknij podgląd"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070F1A]">
              <div className="rounded-2xl bg-[#FFF6EF] text-[#161B22] p-4 sm:p-6 border-2 border-[#FF6A00]/40 shadow-xl">
                <pre className="font-mono text-xs sm:text-sm text-[#161B22] whitespace-pre-wrap leading-relaxed select-all">
                  {previewItem.content}
                </pre>
              </div>
            </div>

            <div className="shrink-0 p-3.5 bg-[#0B2038] border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(previewItem.content)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-xs font-extrabold text-black shadow-md cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Kopiuj</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadItem(previewItem)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 text-xs font-extrabold text-white border border-[#2EE59D]/40 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#2EE59D]" />
                  <span>Pobierz PDF / TXT</span>
                </button>

                {previewItem.itemKind === "template" && (
                  <button
                    type="button"
                    onClick={() => {
                      saveSentLetter({
                        templateId: previewItem.templateId,
                        title: previewItem.displayTitle,
                        recipient: previewItem.recipient,
                        content: previewItem.content,
                      });
                      setElonShowcaseFilter("correspondence");
                    }}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#2EE59D] hover:bg-[#2EE59D]/90 text-xs font-extrabold text-black shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Zapisz w moich pismach</span>
                  </button>
                )}

                <a
                  href={`mailto:?subject=${encodeURIComponent(
                    `${previewItem.displayTitle} - ${user.fullName}`
                  )}&body=${encodeURIComponent(previewItem.content)}`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#143A66] hover:bg-[#19477d] text-xs font-extrabold text-[#2EE59D] border border-[#2EE59D]/40 shadow-md cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Wyślij e-mail</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-[#EF4444]/25 border border-white/15 text-xs font-extrabold text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Zamknij</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          FULL-SCREEN POP-UP PREVIEW FOR NOTE
         ========================================================= */}
      {previewNote && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[#050C16]/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0F2C4D] border-2 border-[#FF6A00] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 bg-[#0B2038] border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FFF6EF] border-2 border-[#FF6A00] flex items-center justify-center shrink-0">
                  <AskElonShieldLogo className="w-5 h-5" isActive={true} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-[#FF6A00]">
                    NOTATKA • {previewNote.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-white truncate">
                    {previewNote.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewNote(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#EF4444] text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 bg-[#070F1A]">
              <p className="text-xs text-[#9BB0C5]">Data wpisu: {previewNote.date}</p>
              <div className="p-4 rounded-2xl bg-[#0B2540] border border-white/10 text-xs sm:text-sm text-white leading-relaxed whitespace-pre-wrap">
                {previewNote.description}
              </div>
            </div>

            <div className="p-3.5 bg-[#0B2038] border-t border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  handleCopyText(
                    `${previewNote.title} (${previewNote.date})\n\n${previewNote.description}`,
                    "Skopiowano notatkę"
                  )
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6A00] text-black font-extrabold text-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Kopiuj notatkę</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewNote(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
