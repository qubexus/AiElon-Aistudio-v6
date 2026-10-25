import React, { useState, useRef, useEffect } from "react";
import { useApp, TabType } from "../context/AppContext";
import { Locale } from "../types";
import {
  Bell,
  Menu,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  CloudOff,
  X,
} from "lucide-react";

const TAB_LABEL_KEY: Record<TabType, string> = {
  chat: "tabChat",
  cases: "tabCases",
  templates: "tabTemplates",
  forum: "tabForum",
  profile: "tabProfile",
};

export const Header: React.FC = () => {
  const {
    t,
    locale,
    setLocale,
    activeTab,
    setIsMenuDrawerOpen,
    setIsMessagesModalOpen,
    broadcastMessages,
    networkStatus,
    isOnline,
    isSimulatedOffline,
    setIsSimulatedOffline,
    lastOnlineAt,
    checkConnectionNow,
    queuedMessagesCount,
    chatDraft,
    savedLetterDraft,
    isLetterDrafting,
  } = useApp();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNetPopoverOpen, setIsNetPopoverOpen] = useState(false);
  const [isCheckingNet, setIsCheckingNet] = useState(false);
  const netPopoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = broadcastMessages.filter((m) => m.unread).length;
  const hasActiveDraftProtection =
    chatDraft.trim().length > 0 || savedLetterDraft !== null || isLetterDrafting;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (netPopoverRef.current && !netPopoverRef.current.contains(e.target as Node)) {
        setIsNetPopoverOpen(false);
      }
    };
    if (isNetPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNetPopoverOpen]);

  const handleManualCheck = async () => {
    setIsCheckingNet(true);
    await checkConnectionNow();
    setTimeout(() => setIsCheckingNet(false), 350);
  };

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: "pl", label: "Polski", flag: "🇵🇱" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ro", label: "Română", flag: "🇷🇴" },
  ];

  const isReconnecting = networkStatus === "reconnecting" || isCheckingNet;
  const currentTabName = t(TAB_LABEL_KEY[activeTab] || "tabChat");

  return (
    <header className="sticky top-0 z-40 bg-[#070F1A]/95 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="robot-head-clip shrink-0">
            <img
              src="/brand/robot-glowa.png"
              alt="ask Elon"
              className="robot-head-idle"
            />
          </div>

          <div className="flex flex-col justify-center min-w-0 leading-none">
            <span className="text-lg sm:text-xl font-extrabold tracking-tight leading-none whitespace-nowrap">
              <span className="text-[#FF6A00]">E</span>
              <span className="text-white">lon</span>
            </span>
            <span className="mt-1 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#2EE59D] whitespace-nowrap">
              {currentTabName}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Compact Network Status Indicator */}
          <div className="relative" ref={netPopoverRef}>
            <button
              type="button"
              onClick={() => setIsNetPopoverOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isReconnecting
                  ? "bg-[#FF6A00]/15 border-[#FF6A00]/40 text-[#FF6A00]"
                  : isOnline
                  ? "bg-[#0F2C4D] hover:bg-[#12304F] border-white/10 text-[#2EE59D]"
                  : "bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border-[#EF4444]/50 text-[#EF4444]"
              }`}
              title={t("netStatusTitle")}
              aria-label={t("netStatusTitle")}
              aria-expanded={isNetPopoverOpen}
            >
              {isReconnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF6A00] shrink-0" />
              ) : isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-[#2EE59D] shrink-0" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
              )}

              <span>
                {isReconnecting
                  ? t("netReconnecting")
                  : isOnline
                  ? t("netOnline")
                  : t("netOffline")}
              </span>

              {queuedMessagesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded bg-[#FF6A00] text-black font-mono tabular-nums text-[10px] font-extrabold">
                  {queuedMessagesCount}
                </span>
              )}
            </button>

            {/* Network Status & Draft Protection Popover (Viewport-safe in portrait & landscape) */}
            {isNetPopoverOpen && (
              <div className="fixed left-3 right-3 top-16 mx-auto max-w-sm sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-2xl bg-[#0F2C4D] border border-white/15 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isOnline
                          ? "bg-[#0B6E4F]/30 border-[#2EE59D]/40 text-[#2EE59D]"
                          : "bg-[#EF4444]/20 border-[#EF4444]/40 text-[#EF4444]"
                      }`}
                    >
                      {isOnline ? (
                        <Wifi className="w-4 h-4" />
                      ) : (
                        <WifiOff className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-white leading-snug">
                        {t("netStatusTitle")}
                      </h4>
                      <span
                        className={`text-[11px] font-bold ${
                          isOnline ? "text-[#2EE59D]" : "text-[#EF4444]"
                        }`}
                      >
                        {isReconnecting
                          ? t("netReconnecting")
                          : isOnline
                          ? t("netOnline")
                          : t("netOffline")}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsNetPopoverOpen(false)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors shrink-0"
                    aria-label="Zamknij"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#BACADA] leading-relaxed mt-3">
                  {isOnline ? t("netStatusOnlineDesc") : t("netStatusOfflineDesc")}
                </p>

                {/* Protection & Sync Summary */}
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between gap-2 text-[#BACADA]">
                    <span>{t("netLastVerified")}</span>
                    <span className="font-mono tabular-nums text-white font-semibold shrink-0">
                      {lastOnlineAt}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[#BACADA]">
                    <span>{t("netDraftProtected")}</span>
                    <span className="inline-flex items-center gap-1 text-[#2EE59D] font-semibold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{hasActiveDraftProtection ? "Active" : "Ready"}</span>
                    </span>
                  </div>

                  {queuedMessagesCount > 0 && (
                    <div className="flex items-center justify-between gap-2 text-[#FF6A00] font-semibold">
                      <span>{t("netQueuedCount")}</span>
                      <span className="font-mono tabular-nums shrink-0">{queuedMessagesCount}</span>
                    </div>
                  )}
                </div>

                {/* Actions: Check Connection & Simulate Offline */}
                <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col sm:flex-col landscape:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleManualCheck}
                    disabled={isCheckingNet}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#12304F] hover:bg-[#163a5f] border border-white/10 text-xs font-bold text-white transition-colors whitespace-nowrap"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-[#2EE59D] shrink-0 ${
                        isCheckingNet ? "animate-spin" : ""
                      }`}
                    />
                    <span>{t("netCheckNow")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSimulatedOffline(!isSimulatedOffline);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap ${
                      isSimulatedOffline
                        ? "bg-[#0B6E4F] hover:bg-[#0B6E4F]/90 border-[#2EE59D]/40 text-white"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-[#BACADA] hover:text-white"
                    }`}
                  >
                    {isSimulatedOffline ? (
                      <>
                        <Wifi className="w-3.5 h-3.5 text-[#2EE59D] shrink-0" />
                        <span>{t("netRestoreOnline")}</span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="w-3.5 h-3.5 text-[#FF6A00] shrink-0" />
                        <span>{t("netSimulateOffline")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0F2C4D] hover:bg-[#12304F] border border-white/10 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#2EE59D]" />
              <span className="uppercase">{locale}</span>
            </button>

            {isLangOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-[#0F2C4D] border border-white/15 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLocale(l.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                      locale === l.code
                        ? "bg-[#0B6E4F] text-white font-bold"
                        : "text-[#BACADA] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <button
            onClick={() => setIsMessagesModalOpen(true)}
            className="relative p-2 rounded-lg bg-[#0F2C4D] hover:bg-[#12304F] border border-white/10 text-[#BACADA] hover:text-white transition-colors shrink-0"
            title="Messages"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6A00] text-black font-mono tabular-nums font-extrabold text-[10px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Menu Drawer Toggle */}
          <button
            onClick={() => setIsMenuDrawerOpen(true)}
            className="p-2 rounded-lg bg-[#0F2C4D] hover:bg-[#12304F] border border-white/10 text-[#BACADA] hover:text-white transition-colors shrink-0"
            title="Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
