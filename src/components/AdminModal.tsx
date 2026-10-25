import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { AdminManagedUser } from "../types";
import {
  X,
  Shield,
  Users,
  Search,
  Filter,
  Tag,
  Send,
  BarChart3,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Megaphone,
  Eye,
  Trash2,
  Plus,
  Copy,
  Check,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  FolderKanban,
  Activity,
  Unlock,
  UserCheck,
  Radio,
  Video,
} from "lucide-react";

type AdminHubSection = "users" | "marketing" | "communication";
type SessionFilterPeriod = "today" | "7d" | "total";

export const AdminModal: React.FC = () => {
  const {
    isAdminModalOpen,
    setIsAdminModalOpen,
    adminUsers,
    updateAdminUser,
    resetAdminUserPassword,
    promoCodes,
    addPromoCode,
    removePromoCode,
    marketingPopupConfig,
    updateMarketingPopupConfig,
    isMarketingPopupVisible,
    setIsMarketingPopupVisible,
    adminChatDeliveryLogs,
    sendAdminSystemChatMessage,
    setIsPaywallModalOpen,
    setActiveTab,
    showToast,
  } = useApp();

  const [activeSection, setActiveSection] = useState<AdminHubSection>("users");

  // Users Filtering & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [subFilter, setSubFilter] = useState<
    "all" | "active_pro" | "free_access" | "free"
  >("all");
  const [sessionPeriod, setSessionPeriod] = useState<SessionFilterPeriod>("7d");

  // Selected User Modal (Pop-up inside Admin Hub)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUser = useMemo(
    () => adminUsers.find((u) => u.id === selectedUserId) || null,
    [adminUsers, selectedUserId]
  );

  const [editUserForm, setEditUserForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    city: string;
    homeAddress: string;
    employerName: string;
    jobTitle: string;
    registeredAt: string;
    role: "user" | "admin";
    free_access: boolean;
    subscriptionStatus: "active_pro" | "free_access" | "free" | "past_due";
  } | null>(null);

  const [userSessionPeriod, setUserSessionPeriod] =
    useState<SessionFilterPeriod>("7d");

  const [passwordResetResult, setPasswordResetResult] = useState<{
    token: string;
    resetLink: string;
    tempPassword: string;
    email: string;
  } | null>(null);
  const [copiedResetToken, setCopiedResetToken] = useState(false);

  // Marketing Pop-up Configurator Form State
  const [popupTitle, setPopupTitle] = useState(marketingPopupConfig.title);
  const [popupContent, setPopupContent] = useState(marketingPopupConfig.content);
  const [popupMediaUrl, setPopupMediaUrl] = useState(marketingPopupConfig.mediaUrl);
  const [popupCtaText, setPopupCtaText] = useState(
    marketingPopupConfig.ctaText || "Sprawdź ofertę PRO"
  );
  const [popupIsActive, setPopupIsActive] = useState(marketingPopupConfig.isActive);

  // Promo Code Creation Form State
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [newDiscountValue, setNewDiscountValue] = useState<string>("50");
  const [newExpiresAt, setNewExpiresAt] = useState<string>("2027-12-31");
  const [newPromoDesc, setNewPromoDesc] = useState<string>("");

  // Communication (Broadcast / Direct) Form State
  const [commTargetType, setCommTargetType] = useState<"broadcast" | "direct">(
    "broadcast"
  );
  const [commTargetUserId, setCommTargetUserId] = useState<string>(
    adminUsers[0]?.id || "user_elon_001"
  );
  const [commTitle, setCommTitle] = useState("");
  const [commMessage, setCommMessage] = useState("");

  // Open User Details Modal handler
  const handleSelectUser = (u: AdminManagedUser) => {
    setSelectedUserId(u.id);
    setPasswordResetResult(null);
    setEditUserForm({
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || "",
      city: u.city || "",
      homeAddress: u.homeAddress || "",
      employerName: u.employerName || "",
      jobTitle: u.jobTitle || "",
      registeredAt: u.registeredAt || "2026-03-15",
      role: u.role,
      free_access: Boolean(u.free_access),
      subscriptionStatus: u.subscriptionStatus || (u.isPro ? "active_pro" : "free"),
    });
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return adminUsers.filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.city || "").toLowerCase().includes(q) ||
        (u.accountId || "").toLowerCase().includes(q) ||
        (u.employerName || "").toLowerCase().includes(q);

      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesSub =
        subFilter === "all" ||
        (subFilter === "free_access" && u.free_access) ||
        (subFilter === "active_pro" && u.isPro && !u.free_access) ||
        (subFilter === "free" && !u.isPro && !u.free_access);

      return matchesSearch && matchesRole && matchesSub;
    });
  }, [adminUsers, searchQuery, roleFilter, subFilter]);

  // Aggregate Platform Analytics
  const platformAnalytics = useMemo(() => {
    let sessionsCount = 0;
    let dailyQueries = 0;
    let totalChatQueries = 0;
    let totalFormalCases = 0;

    adminUsers.forEach((u) => {
      if (sessionPeriod === "today") sessionsCount += u.sessionsToday || 0;
      else if (sessionPeriod === "7d") sessionsCount += u.sessionsLast7Days || 0;
      else sessionsCount += u.sessionsTotal || 0;

      dailyQueries += u.dailyQueriesCount || 0;
      totalChatQueries += u.chatQueriesCount || 0;
      totalFormalCases += u.formalCasesCount || 0;
    });

    const totalInteractions = Math.max(1, totalChatQueries + totalFormalCases);
    const chatPercent = Math.round((totalChatQueries / totalInteractions) * 100);
    const casesPercent = 100 - chatPercent;

    return {
      sessionsCount,
      dailyQueries,
      totalChatQueries,
      totalFormalCases,
      chatPercent,
      casesPercent,
    };
  }, [adminUsers, sessionPeriod]);

  const handleSaveUserChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editUserForm) return;
    updateAdminUser(selectedUser.id, {
      ...editUserForm,
      isPro:
        editUserForm.free_access ||
        editUserForm.subscriptionStatus === "active_pro" ||
        editUserForm.subscriptionStatus === "free_access",
    });
  };

  const handleTriggerPasswordReset = () => {
    if (!selectedUser) return;
    const res = resetAdminUserPassword(selectedUser.id);
    setPasswordResetResult(res);
  };

  const handleSavePopupConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateMarketingPopupConfig({
      title: popupTitle.trim() || "Oferta specjalna ask Elon",
      content: popupContent.trim(),
      mediaUrl: popupMediaUrl.trim(),
      ctaText: popupCtaText.trim() || "Sprawdź teraz",
      isActive: popupIsActive,
    });
  };

  const handleCreatePromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    const val = Math.max(1, parseFloat(newDiscountValue) || 10);
    const autoDesc =
      newPromoDesc.trim() ||
      (newDiscountType === "percentage"
        ? `Rabat -${val}% na subskrypcję PRO`
        : `Zniżka kwotowa -£${val.toFixed(2)} na subskrypcję PRO`);

    addPromoCode({
      code: newPromoCode.trim().toUpperCase(),
      discountType: newDiscountType,
      discountValue: val,
      expiresAt: newExpiresAt || "2027-12-31",
      description: autoDesc,
    });
    setNewPromoCode("");
    setNewPromoDesc("");
  };

  const handleSendSystemChatMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commMessage.trim()) return;
    sendAdminSystemChatMessage({
      targetType: commTargetType,
      targetUserId: commTargetType === "direct" ? commTargetUserId : undefined,
      title: commTitle,
      message: commMessage,
    });
    setCommTitle("");
    setCommMessage("");
  };

  // Render helper for Marketing Media (MP4 Video, YouTube Embed, or Image)
  const renderMarketingMedia = (url: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return null;

    const isYouTube =
      cleanUrl.includes("youtube.com/watch") ||
      cleanUrl.includes("youtu.be/") ||
      cleanUrl.includes("youtube.com/embed/");

    if (isYouTube) {
      let embedUrl = cleanUrl;
      const ytMatch = cleanUrl.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/
      );
      if (ytMatch && ytMatch[1]) {
        embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      }
      return (
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-black aspect-video">
          <iframe
            src={embedUrl}
            title="Promotional Video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(cleanUrl)) {
      return (
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-black">
          <video
            src={cleanUrl}
            controls
            playsInline
            muted
            autoPlay
            loop
            className="w-full max-h-56 object-cover bg-black"
          />
        </div>
      );
    }

    return (
      <div className="rounded-2xl overflow-hidden border border-white/15 bg-black">
        <img
          src={cleanUrl}
          alt={marketingPopupConfig.title}
          className="w-full max-h-56 object-cover"
        />
      </div>
    );
  };

  return (
    <>
      {/* Global Marketing Campaign Pop-up (Displayed to users on app entry when active, or when previewed) */}
      {isMarketingPopupVisible && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative bg-gradient-to-b from-[#0F2C4D] to-[#070F1A] border-2 border-[#FF6A00]/60 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4">
            <button
              type="button"
              onClick={() => setIsMarketingPopupVisible(false)}
              className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-lg bg-black/50 hover:bg-white/15 text-[#BACADA] hover:text-white transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00]/40 text-[10px] font-extrabold uppercase tracking-wider text-[#FF6A00]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Oferta Specjalna ask Elon</span>
            </div>

            {marketingPopupConfig.mediaUrl &&
              renderMarketingMedia(marketingPopupConfig.mediaUrl)}

            <div>
              <h3 className="text-lg font-black text-white leading-snug">
                {marketingPopupConfig.title}
              </h3>
              <p className="text-xs text-[#BACADA] leading-relaxed mt-1.5 whitespace-pre-wrap">
                {marketingPopupConfig.content}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsMarketingPopupVisible(false);
                  setIsPaywallModalOpen(true);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FFA726] text-black font-black text-xs shadow-lg hover:opacity-95 transition-opacity"
              >
                {marketingPopupConfig.ctaText || "Sprawdź ofertę PRO"}
              </button>
              <button
                type="button"
                onClick={() => setIsMarketingPopupVisible(false)}
                className="py-3 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#BACADA] hover:text-white transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Hub Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#081526] border border-white/15 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[94dvh]">
            {/* Admin Hub Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-[#0B2038] border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFA726] flex items-center justify-center text-black shadow-lg shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                      Admin Hub · Centrum Zarządzania ask Elon
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-[#2EE59D]/15 border border-[#2EE59D]/40 text-[10px] font-extrabold text-[#2EE59D] uppercase">
                      ROLE: ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-[#9BB0C5]">
                    Zarządzanie użytkownikami, statystyki sesji i zapytań, kampanie pop-up, kody rabatowe i komunikaty czatu
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(null);
                  setIsAdminModalOpen(false);
                }}
                className="self-end sm:self-auto p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
                aria-label="Zamknij Admin Hub"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section Navigation Bar */}
            <div className="flex flex-wrap gap-1.5 px-5 py-2.5 bg-[#0A1A2F] border-b border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSection("users")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeSection === "users"
                    ? "bg-[#FF6A00] text-black shadow-md"
                    : "bg-[#0F2C4D]/60 text-[#BACADA] hover:text-white hover:bg-[#0F2C4D]"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Użytkownicy i Analityka ({adminUsers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("marketing")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeSection === "marketing"
                    ? "bg-[#FF6A00] text-black shadow-md"
                    : "bg-[#0F2C4D]/60 text-[#BACADA] hover:text-white hover:bg-[#0F2C4D]"
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Pop-up i Kody Rabatowe ({promoCodes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("communication")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeSection === "communication"
                    ? "bg-[#FF6A00] text-black shadow-md"
                    : "bg-[#0F2C4D]/60 text-[#BACADA] hover:text-white hover:bg-[#0F2C4D]"
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Komunikacja Czat (Broadcast / Direct)</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* ================================================================= */}
              {/* SECTION 1: USERS MANAGEMENT & ANALYTICS                           */}
              {/* ================================================================= */}
              {activeSection === "users" && (
                <div className="space-y-5">
                  {/* Top Analytics Overview Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {/* Card 1: Session / Login Counter with Period Filter */}
                    <div className="rounded-2xl bg-[#0F2C4D] border border-white/10 p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-[#2EE59D]" />
                          <span>Licznik logowań / sesji</span>
                        </span>
                        <div className="flex items-center bg-[#071424] rounded-lg p-0.5 border border-white/10">
                          {(
                            [
                              { id: "today", label: "Dziś" },
                              { id: "7d", label: "7 dni" },
                              { id: "total", label: "Łącznie" },
                            ] as const
                          ).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSessionPeriod(p.id)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors ${
                                sessionPeriod === p.id
                                  ? "bg-[#2EE59D] text-black"
                                  : "text-[#9BB0C5] hover:text-white"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-mono tabular-nums text-white">
                          {platformAnalytics.sessionsCount}
                        </span>
                        <span className="text-[11px] text-[#9BB0C5]">
                          {sessionPeriod === "today"
                            ? "sesji dzisiaj"
                            : sessionPeriod === "7d"
                            ? "sesji w ost. 7 dniach"
                            : "wszystkich logowań"}
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Daily Queries Generated */}
                    <div className="rounded-2xl bg-[#0F2C4D] border border-white/10 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-[#FF6A00]" />
                          <span>Dzienna liczba zapytań</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FF6A00]/20 text-[#FF6A00]">
                          Na żywo
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-black font-mono tabular-nums text-white">
                          {platformAnalytics.dailyQueries}
                        </span>
                        <span className="text-[11px] text-[#9BB0C5]">
                          śr. {(platformAnalytics.dailyQueries / Math.max(1, adminUsers.length)).toFixed(1)} zapytania / osobę dziś
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Query Categorization (Chat vs Formal Cases) */}
                    <div className="rounded-2xl bg-[#0F2C4D] border border-white/10 p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-extrabold text-white">
                        <span>Kategoryzacja zapytań</span>
                        <span className="text-[11px] font-mono text-[#2EE59D]">
                          {platformAnalytics.totalChatQueries +
                            platformAnalytics.totalFormalCases}{" "}
                          łącznie
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2.5 rounded-full bg-[#071424] overflow-hidden flex border border-white/10">
                        <div
                          className="bg-[#2EE59D] h-full transition-all"
                          style={{ width: `${platformAnalytics.chatPercent}%` }}
                        />
                        <div
                          className="bg-[#FF6A00] h-full transition-all"
                          style={{ width: `${platformAnalytics.casesPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#2EE59D] font-bold">
                          ● Rozmowy (Czat): {platformAnalytics.totalChatQueries} (
                          {platformAnalytics.chatPercent}%)
                        </span>
                        <span className="text-[#FF6A00] font-bold">
                          ● Sprawy: {platformAnalytics.totalFormalCases} (
                          {platformAnalytics.casesPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Search & Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B2038] border border-white/10 rounded-2xl p-3.5">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#9BB0C5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Szukaj po imieniu, nazwisku, e-mailu, mieście lub ID konta..."
                        className="w-full bg-[#071424] border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-[#9BB0C5]/60 focus:outline-none focus:border-[#2EE59D]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-[#071424] border border-white/10 rounded-xl px-2.5 py-1.5">
                        <Filter className="w-3.5 h-3.5 text-[#2EE59D]" />
                        <select
                          value={roleFilter}
                          onChange={(e) =>
                            setRoleFilter(e.target.value as "all" | "admin" | "user")
                          }
                          className="bg-transparent text-xs font-bold text-white focus:outline-none"
                        >
                          <option value="all" className="bg-[#071424]">
                            Wszystkie role
                          </option>
                          <option value="admin" className="bg-[#071424]">
                            Tylko Admin
                          </option>
                          <option value="user" className="bg-[#071424]">
                            Tylko User
                          </option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#071424] border border-white/10 rounded-xl px-2.5 py-1.5">
                        <select
                          value={subFilter}
                          onChange={(e) =>
                            setSubFilter(
                              e.target.value as
                                | "all"
                                | "active_pro"
                                | "free_access"
                                | "free"
                            )
                          }
                          className="bg-transparent text-xs font-bold text-white focus:outline-none"
                        >
                          <option value="all" className="bg-[#071424]">
                            Wszystkie statusy płatności
                          </option>
                          <option value="active_pro" className="bg-[#071424]">
                            Opłacone PRO
                          </option>
                          <option value="free_access" className="bg-[#071424]">
                            Bezpłatny dostęp (Free Access)
                          </option>
                          <option value="free" className="bg-[#071424]">
                            Plan darmowy
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-[#0B2038] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#0F2C4D] border-b border-white/10 text-[11px] font-extrabold uppercase tracking-wider text-[#9BB0C5]">
                            <th className="py-3 px-4">Imię i nazwisko</th>
                            <th className="py-3 px-4">E-mail</th>
                            <th className="py-3 px-3">Data rejestracji</th>
                            <th className="py-3 px-3">Miasto / Lokalizacja</th>
                            <th className="py-3 px-3">Rola</th>
                            <th className="py-3 px-3">Status subskrypcji</th>
                            <th className="py-3 px-4 text-right">Akcja</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-xs">
                          {filteredUsers.map((u) => (
                            <tr
                              key={u.id}
                              onClick={() => handleSelectUser(u)}
                              className="hover:bg-[#123258]/70 transition-colors cursor-pointer group"
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-[#0B6E4F] border border-[#FF6A00] flex items-center justify-center font-extrabold text-[11px] text-white shrink-0">
                                    {u.fullName
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-white group-hover:text-[#2EE59D] transition-colors">
                                      {u.fullName}
                                    </p>
                                    <p className="text-[10px] font-mono text-[#9BB0C5]">
                                      #{u.accountId}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-[#BACADA]">{u.email}</td>
                              <td className="py-3 px-3 font-mono text-[#BACADA]">
                                {u.registeredAt}
                              </td>
                              <td className="py-3 px-3 text-white">
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-[#FF6A00]" />
                                  {u.city}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                                    u.role === "admin"
                                      ? "bg-[#FF6A00]/20 border-[#FF6A00]/50 text-[#FF6A00]"
                                      : "bg-white/5 border-white/15 text-[#BACADA]"
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {u.free_access ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#2EE59D]/20 border border-[#2EE59D]/50 text-[#2EE59D] text-[10px] font-extrabold">
                                    <Unlock className="w-3 h-3" />
                                    <span>Free Access VIP</span>
                                  </span>
                                ) : u.isPro ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FF6A00]/20 border border-[#FF6A00]/50 text-[#FF6A00] text-[10px] font-extrabold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>PRO (£9.99/m)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/5 border border-white/15 text-[#9BB0C5] text-[10px] font-bold">
                                    Plan darmowy
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectUser(u);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#0F2C4D] group-hover:bg-[#FF6A00] text-white group-hover:text-black text-[11px] font-extrabold transition-colors"
                                >
                                  Szczegóły / Edytuj
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SECTION 2: MARKETING POP-UP & PROMO CODES                         */}
              {/* ================================================================= */}
              {activeSection === "marketing" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Marketing Pop-up Configurator */}
                  <div className="bg-[#0B2038] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-[#FF6A00]" />
                        <h3 className="text-sm font-extrabold text-white">
                          Konfigurator Pop-upa Kampanii
                        </h3>
                      </div>

                      {/* Active Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = !popupIsActive;
                          setPopupIsActive(nextVal);
                          updateMarketingPopupConfig({ isActive: nextVal });
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border transition-all ${
                          popupIsActive
                            ? "bg-[#2EE59D]/20 border-[#2EE59D] text-[#2EE59D]"
                            : "bg-white/5 border-white/15 text-[#9BB0C5]"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            popupIsActive ? "bg-[#2EE59D]" : "bg-[#9BB0C5]"
                          }`}
                        />
                        <span>{popupIsActive ? "Aktywny na starcie" : "Wyłączony"}</span>
                      </button>
                    </div>

                    <form onSubmit={handleSavePopupConfig} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-bold text-[#BACADA] mb-1">
                          Tytuł Pop-upa
                        </label>
                        <input
                          type="text"
                          value={popupTitle}
                          onChange={(e) => setPopupTitle(e.target.value)}
                          placeholder="np. Odzyskaj swoje pieniądze z ask Elon PRO!"
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#BACADA] mb-1">
                          Treść tekstowa
                        </label>
                        <textarea
                          rows={3}
                          value={popupContent}
                          onChange={(e) => setPopupContent(e.target.value)}
                          placeholder="Treść komunikatu marketingowego lub promocji..."
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D] resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#BACADA] mb-1">
                          URL do grafiki lub wideo (.mp4 / YouTube embed)
                        </label>
                        <input
                          type="text"
                          value={popupMediaUrl}
                          onChange={(e) => setPopupMediaUrl(e.target.value)}
                          placeholder="/assets/aistudio/grok_video_2026-10-24-04-59-56_1fc97f08.mp4 lub https://youtu.be/..."
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#BACADA] mb-1">
                          Tekst przycisku akcji (CTA)
                        </label>
                        <input
                          type="text"
                          value={popupCtaText}
                          onChange={(e) => setPopupCtaText(e.target.value)}
                          placeholder="np. Odbierz rabat PRO"
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-black text-xs shadow-md hover:opacity-95 transition-opacity"
                        >
                          Zapisz konfigurację Pop-upa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateMarketingPopupConfig({
                              title: popupTitle,
                              content: popupContent,
                              mediaUrl: popupMediaUrl,
                              ctaText: popupCtaText,
                              isActive: popupIsActive,
                            });
                            setIsMarketingPopupVisible(true);
                          }}
                          className="inline-flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#0F2C4D] hover:bg-[#163a5f] border border-white/15 text-xs font-extrabold text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FF6A00]" />
                          <span>Podgląd na żywo</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Promo Codes Creator & List */}
                  <div className="bg-[#0B2038] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-[#2EE59D]" />
                        <h3 className="text-sm font-extrabold text-white">
                          Kody Promocyjne i Rabatowe
                        </h3>
                      </div>
                      <span className="text-[11px] text-[#9BB0C5]">
                        Bazowa cena PRO: £9.99/mies.
                      </span>
                    </div>

                    {/* Create Promo Code Form */}
                    <form
                      onSubmit={handleCreatePromoCode}
                      className="bg-[#071424] border border-white/10 rounded-xl p-3.5 space-y-3"
                    >
                      <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-[#FF6A00]" />
                        <span>Utwórz nowy kod rabatowy</span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1">
                            Kod (ciąg znaków)
                          </label>
                          <input
                            type="text"
                            value={newPromoCode}
                            onChange={(e) => setNewPromoCode(e.target.value)}
                            placeholder="np. ZIMA50"
                            className="w-full bg-[#0B2038] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-[#2EE59D]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1">
                            Typ rabatu
                          </label>
                          <select
                            value={newDiscountType}
                            onChange={(e) =>
                              setNewDiscountType(
                                e.target.value as "percentage" | "fixed"
                              )
                            }
                            className="w-full bg-[#0B2038] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                          >
                            <option value="percentage">Procentowy (%)</option>
                            <option value="fixed">Kwotowy (£)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1">
                            Wartość ({newDiscountType === "percentage" ? "%" : "£"})
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            max={newDiscountType === "percentage" ? "100" : "9.99"}
                            value={newDiscountValue}
                            onChange={(e) => setNewDiscountValue(e.target.value)}
                            className="w-full bg-[#0B2038] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#2EE59D]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1">
                            Data ważności
                          </label>
                          <input
                            type="date"
                            value={newExpiresAt}
                            onChange={(e) => setNewExpiresAt(e.target.value)}
                            className="w-full bg-[#0B2038] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#2EE59D]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!newPromoCode.trim()}
                        className="w-full py-2 rounded-lg bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black font-black text-xs disabled:opacity-40 transition-colors"
                      >
                        Dodaj kod rabatowy
                      </button>
                    </form>

                    {/* Existing Promo Codes List */}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {promoCodes.map((p) => {
                        const finalPrice =
                          p.discountType === "percentage"
                            ? Math.max(0, 9.99 * (1 - p.discountValue / 100))
                            : Math.max(0, 9.99 - p.discountValue);
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#071424] border border-white/10 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-[#2EE59D] px-2 py-0.5 rounded bg-[#0B6E4F]/25 border border-[#2EE59D]/30">
                                  {p.code}
                                </span>
                                <span className="font-extrabold text-[#FF6A00]">
                                  {p.discountType === "percentage"
                                    ? `-${p.discountValue}%`
                                    : `-£${p.discountValue.toFixed(2)}`}
                                </span>
                                <span className="text-[11px] text-[#9BB0C5]">
                                  → £{finalPrice.toFixed(2)}/m
                                </span>
                              </div>
                              <p className="text-[11px] text-[#BACADA] truncate mt-1">
                                Ważny do: <strong className="text-white">{p.expiresAt}</strong> · Użyto:{" "}
                                <strong className="text-white">{p.usedCount}x</strong>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removePromoCode(p.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#EF4444]/20 text-[#9BB0C5] hover:text-[#EF4444] transition-colors shrink-0"
                              title="Usuń kod"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SECTION 3: COMMUNICATION & CHAT DELIVERY (BROADCAST / DIRECT)     */}
              {/* ================================================================= */}
              {activeSection === "communication" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Composer Card */}
                  <div className="bg-[#0B2038] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                      <Radio className="w-4 h-4 text-[#2EE59D]" />
                      <div>
                        <h3 className="text-sm font-extrabold text-white">
                          Wyślij komunikat bezpośrednio na główny Czat
                        </h3>
                        <p className="text-[11px] text-[#9BB0C5]">
                          Wiadomość pojawi się natychmiast jako wpis systemowy w oknie głównego czatu
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSendSystemChatMsg} className="space-y-4">
                      {/* Recipient Type Selector */}
                      <div>
                        <label className="block text-xs font-bold text-[#BACADA] mb-1.5">
                          Wybór odbiorcy
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setCommTargetType("broadcast")}
                            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-2 transition-all ${
                              commTargetType === "broadcast"
                                ? "bg-[#FF6A00]/20 border-[#FF6A00] text-[#FF6A00]"
                                : "bg-[#071424] border-white/10 text-[#9BB0C5] hover:text-white"
                            }`}
                          >
                            <Users className="w-4 h-4" />
                            <span>Wszyscy (Broadcast)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setCommTargetType("direct")}
                            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-2 transition-all ${
                              commTargetType === "direct"
                                ? "bg-[#2EE59D]/20 border-[#2EE59D] text-[#2EE59D]"
                                : "bg-[#071424] border-white/10 text-[#9BB0C5] hover:text-white"
                            }`}
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Pojedynczy (Direct)</span>
                          </button>
                        </div>
                      </div>

                      {/* Target User Dropdown when Direct */}
                      {commTargetType === "direct" && (
                        <div>
                          <label className="block text-xs font-bold text-[#BACADA] mb-1">
                            Wybierz użytkownika docelowego
                          </label>
                          <select
                            value={commTargetUserId}
                            onChange={(e) => setCommTargetUserId(e.target.value)}
                            className="w-full bg-[#071424] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                          >
                            {adminUsers.map((u) => (
                              <option key={u.id} value={u.id} className="bg-[#071424]">
                                {u.fullName} ({u.email}) — #{u.accountId}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-[#BACADA] mb-1">
                          Nagłówek / Tytuł komunikatu
                        </label>
                        <input
                          type="text"
                          value={commTitle}
                          onChange={(e) => setCommTitle(e.target.value)}
                          placeholder={
                            commTargetType === "broadcast"
                              ? "np. Ważna aktualizacja stawek National Living Wage"
                              : "np. Informacja dot. Twojej sprawy i dokumentów"
                          }
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#BACADA] mb-1">
                          Treść wiadomości systemowej na czat
                        </label>
                        <textarea
                          rows={4}
                          value={commMessage}
                          onChange={(e) => setCommMessage(e.target.value)}
                          placeholder="Wpisz treść wiadomości, która wyświetli się bezpośrednio w głównym oknie czatu..."
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D] resize-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="submit"
                          disabled={!commMessage.trim()}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FFA726] text-black font-black text-xs shadow-lg disabled:opacity-40 transition-opacity"
                        >
                          <Send className="w-4 h-4" />
                          <span>
                            {commTargetType === "broadcast"
                              ? "Wyślij Broadcast na główny czat"
                              : "Wyślij wiadomość Direct na czat"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAdminModalOpen(false);
                            setActiveTab("chat");
                          }}
                          className="py-3 px-3.5 rounded-xl bg-[#0F2C4D] hover:bg-[#163a5f] border border-white/15 text-xs font-extrabold text-white transition-colors"
                        >
                          Przejdź do Czatu
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Delivery History Log */}
                  <div className="bg-[#0B2038] border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#FF6A00]" />
                        <span>Historia doręczonych komunikatów czatu</span>
                      </h3>
                      <span className="text-xs font-mono text-[#9BB0C5]">
                        {adminChatDeliveryLogs.length} wysłanych
                      </span>
                    </div>

                    {adminChatDeliveryLogs.length === 0 ? (
                      <div className="rounded-xl bg-[#071424] border border-white/5 p-6 text-center space-y-1.5">
                        <Send className="w-6 h-6 text-[#9BB0C5] mx-auto opacity-50" />
                        <p className="text-xs font-bold text-white">
                          Brak wysłanych komunikatów w tej sesji
                        </p>
                        <p className="text-[11px] text-[#9BB0C5]">
                          Wyślij wiadomość Broadcast lub Direct po lewej stronie, aby doręczyć ją w czasie rzeczywistym na główny czat.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {adminChatDeliveryLogs.map((log) => (
                          <div
                            key={log.id}
                            className="rounded-xl bg-[#071424] border border-white/10 p-3 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  log.targetType === "broadcast"
                                    ? "bg-[#FF6A00]/20 text-[#FF6A00] border border-[#FF6A00]/40"
                                    : "bg-[#2EE59D]/20 text-[#2EE59D] border border-[#2EE59D]/40"
                                }`}
                              >
                                {log.targetType === "broadcast"
                                  ? "BROADCAST"
                                  : `DIRECT → ${log.targetUserName}`}
                              </span>
                              <span className="text-[10px] font-mono text-[#9BB0C5]">
                                {log.sentAt}
                              </span>
                            </div>
                            <p className="text-xs font-extrabold text-white">
                              {log.title}
                            </p>
                            <p className="text-xs text-[#BACADA] whitespace-pre-wrap leading-relaxed">
                              {log.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* USER INSPECTION, EDIT, ROLE, FREE ACCESS & PASSWORD RESET MODAL       */}
          {/* ===================================================================== */}
          {selectedUser && editUserForm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#0B2038] border-2 border-[#2EE59D]/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-[#0F2C4D] border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#0B6E4F] border-2 border-[#FF6A00] flex items-center justify-center font-black text-sm text-white">
                      {selectedUser.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">
                        {selectedUser.fullName}
                      </h3>
                      <p className="text-xs text-[#9BB0C5] font-mono">
                        ID: #{selectedUser.accountId} · Rejestracja:{" "}
                        {selectedUser.registeredAt}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUserId(null)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* 1. User Individual Analytics & Metrics */}
                  <div className="rounded-2xl bg-[#071424] border border-white/10 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#2EE59D] uppercase tracking-wider flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4" />
                        <span>Statystyki i Analityka Użytkownika</span>
                      </span>

                      <div className="flex items-center bg-[#0B2038] rounded-lg p-0.5 border border-white/10">
                        {(
                          [
                            { id: "today", label: "Dziś" },
                            { id: "7d", label: "Ostatnie 7 dni" },
                            { id: "total", label: "Łącznie" },
                          ] as const
                        ).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setUserSessionPeriod(p.id)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors ${
                              userSessionPeriod === p.id
                                ? "bg-[#2EE59D] text-black"
                                : "text-[#9BB0C5] hover:text-white"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="rounded-xl bg-[#0B2038] border border-white/10 p-3">
                        <p className="text-[11px] text-[#9BB0C5]">
                          Logowania / Sesje (
                          {userSessionPeriod === "today"
                            ? "Dziś"
                            : userSessionPeriod === "7d"
                            ? "7 dni"
                            : "Łącznie"}
                          )
                        </p>
                        <p className="text-xl font-black font-mono text-white mt-0.5">
                          {userSessionPeriod === "today"
                            ? selectedUser.sessionsToday
                            : userSessionPeriod === "7d"
                            ? selectedUser.sessionsLast7Days
                            : selectedUser.sessionsTotal}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#0B2038] border border-white/10 p-3">
                        <p className="text-[11px] text-[#9BB0C5]">
                          Dzienna liczba zapytań
                        </p>
                        <p className="text-xl font-black font-mono text-[#FF6A00] mt-0.5">
                          {selectedUser.dailyQueriesCount} / dzień
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#0B2038] border border-white/10 p-3">
                        <p className="text-[11px] text-[#9BB0C5]">
                          Czat vs Sprawy formalne
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs font-extrabold">
                          <span className="text-[#2EE59D] flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {selectedUser.chatQueriesCount} czat
                          </span>
                          <span className="text-[#9BB0C5]">/</span>
                          <span className="text-[#FF6A00] flex items-center gap-1">
                            <FolderKanban className="w-3.5 h-3.5" />
                            {selectedUser.formalCasesCount} spraw
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Role Switcher, Free Access Bypass & Password Reset */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Role Toggle: user <-> admin */}
                    <div className="rounded-2xl bg-[#071424] border border-white/10 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-white">
                          Rola w systemie
                        </p>
                        <p className="text-[11px] text-[#9BB0C5]">
                          Przełącz uprawnienia user ↔ admin
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextRole =
                            editUserForm.role === "admin" ? "user" : "admin";
                          setEditUserForm({ ...editUserForm, role: nextRole });
                          updateAdminUser(selectedUser.id, { role: nextRole });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase border transition-all ${
                          editUserForm.role === "admin"
                            ? "bg-[#FF6A00] text-black border-[#FF6A00]"
                            : "bg-[#0F2C4D] text-white border-white/15"
                        }`}
                      >
                        {editUserForm.role === "admin" ? "ADMIN" : "USER"}
                      </button>
                    </div>

                    {/* Free Access Toggle (free_access: boolean) */}
                    <div className="rounded-2xl bg-[#071424] border border-white/10 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-white">
                          Bezpłatny dostęp (free_access)
                        </p>
                        <p className="text-[11px] text-[#9BB0C5]">
                          Omija paywall i subskrypcję PRO
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const nextFree = !editUserForm.free_access;
                          const nextStatus = nextFree ? "free_access" : "free";
                          setEditUserForm({
                            ...editUserForm,
                            free_access: nextFree,
                            subscriptionStatus: nextStatus,
                          });
                          updateAdminUser(selectedUser.id, {
                            free_access: nextFree,
                            subscriptionStatus: nextStatus,
                            isPro: nextFree,
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                          editUserForm.free_access
                            ? "bg-[#2EE59D] text-black border-[#2EE59D]"
                            : "bg-white/5 text-[#9BB0C5] border-white/15 hover:text-white"
                        }`}
                      >
                        {editUserForm.free_access ? "WŁĄCZONY (VIP)" : "WYŁĄCZONY"}
                      </button>
                    </div>
                  </div>

                  {/* 3. Password Reset Generator & Email Dispatcher */}
                  <div className="rounded-2xl bg-[#071424] border border-white/10 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-extrabold text-white flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-[#FF6A00]" />
                          <span>Reset hasła użytkownika</span>
                        </p>
                        <p className="text-[11px] text-[#9BB0C5]">
                          Generuje bezpieczny token resetujący i wysyła link / hasło tymczasowe na e-mail ({editUserForm.email})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerPasswordReset}
                        className="px-3.5 py-2 rounded-xl bg-[#FF6A00]/20 hover:bg-[#FF6A00] text-[#FF6A00] hover:text-black border border-[#FF6A00]/50 text-xs font-extrabold transition-colors shrink-0"
                      >
                        Wyślij link resetujący hasło
                      </button>
                    </div>

                    {passwordResetResult && (
                      <div className="rounded-xl bg-[#0B2038] border border-[#2EE59D]/40 p-3 space-y-2 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between text-[#2EE59D] font-bold">
                          <span>
                            ✓ Wysłano wiadomość e-mail na adres:{" "}
                            {passwordResetResult.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                `${passwordResetResult.resetLink} (Hasło tymczasowe: ${passwordResetResult.tempPassword})`
                              );
                              setCopiedResetToken(true);
                              setTimeout(() => setCopiedResetToken(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white text-[10px]"
                          >
                            {copiedResetToken ? (
                              <>
                                <Check className="w-3 h-3 text-[#2EE59D]" />
                                <span>Skopiowano</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Kopiuj link</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          <div className="p-2 rounded bg-[#071424] text-[#BACADA]">
                            Token: <strong className="text-white">{passwordResetResult.token}</strong>
                          </div>
                          <div className="p-2 rounded bg-[#071424] text-[#BACADA]">
                            Hasło tymczasowe:{" "}
                            <strong className="text-[#FF6A00]">
                              {passwordResetResult.tempPassword}
                            </strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. Edit User Profile Form */}
                  <form onSubmit={handleSaveUserChanges} className="space-y-3.5">
                    <p className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Edycja danych podstawowych profilu
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1">
                          Imię i nazwisko
                        </label>
                        <input
                          type="text"
                          value={editUserForm.fullName}
                          onChange={(e) =>
                            setEditUserForm({
                              ...editUserForm,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#2EE59D]" />
                          <span>E-mail</span>
                        </label>
                        <input
                          type="email"
                          value={editUserForm.email}
                          onChange={(e) =>
                            setEditUserForm({
                              ...editUserForm,
                              email: e.target.value,
                            })
                          }
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#FF6A00]" />
                          <span>Miasto / Lokalizacja</span>
                        </label>
                        <input
                          type="text"
                          value={editUserForm.city}
                          onChange={(e) =>
                            setEditUserForm({
                              ...editUserForm,
                              city: e.target.value,
                            })
                          }
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#2EE59D]" />
                          <span>Telefon</span>
                        </label>
                        <input
                          type="text"
                          value={editUserForm.phone}
                          onChange={(e) =>
                            setEditUserForm({
                              ...editUserForm,
                              phone: e.target.value,
                            })
                          }
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#FF6A00]" />
                          <span>Pracodawca</span>
                        </label>
                        <input
                          type="text"
                          value={editUserForm.employerName}
                          onChange={(e) =>
                            setEditUserForm({
                              ...editUserForm,
                              employerName: e.target.value,
                            })
                          }
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#9BB0C5] mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#2EE59D]" />
                          <span>Data rejestracji</span>
                        </label>
                        <input
                          type="date"
                          value={editUserForm.registeredAt}
                          onChange={(e) =>
                            setEditUserForm({
                              ...editUserForm,
                              registeredAt: e.target.value,
                            })
                          }
                          className="w-full bg-[#071424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#2EE59D]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCommTargetType("direct");
                          setCommTargetUserId(selectedUser.id);
                          setSelectedUserId(null);
                          setActiveSection("communication");
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0F2C4D] hover:bg-[#163a5f] border border-white/15 text-xs font-extrabold text-[#2EE59D] transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Wyślij wiadomość Direct na czat</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(null)}
                          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#BACADA] hover:text-white transition-colors"
                        >
                          Zamknij
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0B6E4F] to-[#2EE59D] text-black font-black text-xs shadow-lg hover:opacity-95 transition-opacity"
                        >
                          Zapisz zmiany w bazie
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
