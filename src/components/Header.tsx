import React, { useState, useRef, useEffect } from "react";
import { useApp, TabType } from "../context/AppContext";
import {
  Menu,
  Bell,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  MessageSquare,
  Briefcase,
  FileText,
  Users,
  UserCheck,
  Check,
} from "lucide-react";
import { Locale } from "../types";
import { Tooltip } from "./Tooltip";

const CountryFlagSvg: React.FC<{ code: Locale; className?: string }> = ({
  code,
  className = "w-5 h-3.5 rounded-[3px] shadow-2xs ring-1 ring-black/15 dark:ring-white/15 shrink-0",
}) => {
  if (code === "pl") {
    return (
      <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
        <rect width="24" height="8" y="0" fill="#FFFFFF" />
        <rect width="24" height="8" y="8" fill="#DC143C" />
      </svg>
    );
  }
  if (code === "ro") {
    return (
      <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
        <rect width="8" height="16" x="0" fill="#002B7F" />
        <rect width="8" height="16" x="8" fill="#FCD116" />
        <rect width="8" height="16" x="16" fill="#CE1126" />
      </svg>
    );
  }
  // UK flag for English (en)
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <rect width="24" height="16" fill="#012169" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M0 0 L24 16 M24 0 L0 16" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M12 0 V16 M0 8 H24" stroke="#FFFFFF" strokeWidth="4.5" />
      <path d="M12 0 V16 M0 8 H24" stroke="#C8102E" strokeWidth="2.6" />
    </svg>
  );
};

export const Header: React.FC = () => {
  const {
    locale,
    setLocale,
    activeTab,
    setActiveTab,
    themeMode,
    toggleThemeMode,
    robotState,
    triggerRobotReaction,
    setIsMenuDrawerOpen,
    setIsMessagesModalOpen,
    sentLetters,
    broadcastMessages,
    networkStatus,
    isOnline,
    isSimulatedOffline,
    setIsSimulatedOffline,
    queuedMessagesCount,
    checkConnectionNow,
    isLetterDrafting,
    savedLetterDraft,
    chatDraft,
    t,
  } = useApp();

  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLangMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLangMenuOpen]);

  const unreadCount = broadcastMessages.filter((m) => m.unread).length;

  const locales: { code: Locale; label: string; name: string }[] = [
    { code: "pl", label: "PL", name: "Polski" },
    { code: "en", label: "UK", name: "English (UK)" },
    { code: "ro", label: "RO", name: "Română" },
  ];
  const currentLocaleItem = locales.find((l) => l.code === locale) || locales[0];

  const desktopNavItems: {
    id: TabType;
    label: string;
    tooltip: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: "chat",
      label: locale === "pl" ? "Asystent AI" : locale === "ro" ? "Asistent AI" : "AI Assistant",
      tooltip:
        locale === "pl"
          ? "Otwórz czat z asystentem AI"
          : locale === "ro"
          ? "Deschide chatul cu asistentul AI"
          : "Open AI Assistant Chat",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
    },
    {
      id: "cases",
      label: locale === "pl" ? "Sprawy" : locale === "ro" ? "Cazuri" : "Cases",
      tooltip:
        locale === "pl"
          ? "Zarządzaj zapisanymi sprawami i aktami"
          : locale === "ro"
          ? "Gestionează cazurile și dosarele salvate"
          : "Manage Saved Cases & Dossiers",
      icon: <Briefcase className="w-3.5 h-3.5" />,
    },
    {
      id: "templates",
      label: locale === "pl" ? "Pisma UK" : locale === "ro" ? "Scrisori UK" : "UK Letters",
      tooltip:
        locale === "pl"
          ? "Przeglądaj i generuj oficjalne pisma UK"
          : locale === "ro"
          ? "Răsfoiește și redactează scrisori UK"
          : "Browse & Draft Official UK Letters",
      icon: <FileText className="w-3.5 h-3.5" />,
      count: sentLetters.length,
    },
    {
      id: "forum",
      label: locale === "pl" ? "Społeczność" : locale === "ro" ? "Comunitate" : "Community",
      tooltip:
        locale === "pl"
          ? "Forum społeczności pracowników w UK"
          : locale === "ro"
          ? "Forumul comunității din UK"
          : "UK Workers Community Forum",
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      id: "profile",
      label: locale === "pl" ? "Profil i Audyt" : locale === "ro" ? "Profil & Audit" : "Profile & Audit",
      tooltip:
        locale === "pl"
          ? "Dane osobowe do pism i audyt sytuacji"
          : locale === "ro"
          ? "Date personale și audit juridic"
          : "Personal Details & Legal Audit",
      icon: <UserCheck className="w-3.5 h-3.5" />,
    },
  ];

  const hasSavedWorkInProgress =
    chatDraft.trim().length > 0 || isLetterDrafting || savedLetterDraft !== null;

  const robotStatusLabel = (() => {
    switch (robotState) {
      case "listening":
        return locale === "pl"
          ? "Elon uważnie słucha Twojego głosu..."
          : locale === "ro"
          ? "Elon îți ascultă vocea..."
          : "Elon is listening to your voice...";
      case "speaking":
        return locale === "pl"
          ? "Elon wyjaśnia Twoje prawa głosem..."
          : locale === "ro"
          ? "Elon vorbește..."
          : "Elon is speaking aloud...";
      case "thinking":
        return locale === "pl"
          ? "Elon analizuje paragrafy UK..."
          : locale === "ro"
          ? "Elon analizează legislația UK..."
          : "Elon is analyzing UK statutes...";
      case "typing":
        return locale === "pl"
          ? "Elon śledzi Twój wpis..."
          : locale === "ro"
          ? "Elon urmărește ce scrii..."
          : "Elon is reading as you type...";
      case "happy":
        return locale === "pl"
          ? "Elon: Dobra wiadomość! (Uśmiech)"
          : locale === "ro"
          ? "Elon: Vești bune! (Zâmbet)"
          : "Elon: Positive outlook! (Happy)";
      case "concerned":
        return locale === "pl"
          ? "Elon: Wykryto naruszenie praw (Zatroskany)"
          : locale === "ro"
          ? "Elon: Încălcare detectată (Îngrijorat)"
          : "Elon: Statutory breach detected (Concerned)";
      case "success":
        return locale === "pl"
          ? "Gotowe! Elon zaktualizował akta"
          : locale === "ro"
          ? "Gata! Dosar actualizat"
          : "Done! Dossier updated";
      default:
        return locale === "pl"
          ? "Asystent AI Prawa Pracy UK"
          : locale === "ro"
          ? "Asistent AI Dreptul Muncii UK"
          : "UK Workplace AI Assistant";
    }
  })();

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-5 h-15 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Full-Height Mascot (72px <360px, 96px >=360px) spanning into gradient banner + Title/Subtitle to right + Hamburger Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <Tooltip
            side="bottom"
            content={
              locale === "pl"
                ? "Przejdź do czatu z Elonem"
                : locale === "ro"
                ? "Deschide chatul cu Elon"
                : "Open Chat with Elon"
            }
            hint={robotStatusLabel}
          >
            <button
              onClick={() => {
                setActiveTab("chat");
                triggerRobotReaction(robotState === "happy" ? "concerned" : "happy", 3200);
              }}
              className="relative flex items-center text-left group min-w-0 h-15 pl-[76px] min-[360px]:pl-[90px] sm:pl-[104px] cursor-pointer"
            >
              {/* Mascot spanning upward into the gradient banner & ending flush at bottom edge of header row */}
              <div
                className={`pointer-events-none absolute left-0 bottom-0 w-[72px] h-[72px] min-[360px]:w-[84px] min-[360px]:h-[96px] sm:w-[96px] sm:h-[96px] flex items-end justify-center shrink-0 transition-transform duration-300 ${
                  robotState === "happy" || robotState === "typing" || robotState === "success"
                    ? "scale-[1.03] drop-shadow-[0_0_10px_rgba(45,212,191,0.35)]"
                    : robotState === "concerned"
                    ? "scale-[1.03] drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                    : robotState === "speaking" || robotState === "listening"
                    ? "scale-[1.03] drop-shadow-[0_0_12px_rgba(249,115,22,0.45)]"
                    : "group-hover:scale-[1.03]"
                }`}
              >
                {/* Soft subtle turquoise glow (#2DD4BF, low opacity) behind mascot */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-1.5 rounded-full bg-[#2DD4BF]/18 blur-md"
                />
                <img
                  src="/brand/logo-mark.png"
                  alt="ask Elon Logo"
                  referrerPolicy="no-referrer"
                  className="relative z-10 w-full h-full object-contain object-bottom select-none"
                />
                <span
                  className={`z-20 absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#141B23] ${
                    !isOnline
                      ? "bg-[var(--accent-orange)]"
                      : robotState === "speaking" || robotState === "listening"
                      ? "bg-[var(--accent-orange)] animate-ping"
                      : "bg-[var(--accent-green)]"
                  }`}
                />
              </div>

              <div className="leading-tight min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="logo-ask-elon text-[15px] sm:text-lg whitespace-nowrap">
                    <span className="part-ask">ask</span>
                    <span className="part-elon">Elon</span>
                  </span>
                  <span className="badge-demo-pill shrink-0">DEMO</span>
                </div>
                <span
                  className={`block text-[10px] font-medium truncate max-w-[116px] min-[390px]:max-w-[140px] sm:max-w-[200px] transition-colors ${
                    robotState !== "idle"
                      ? "text-[var(--accent-green)] font-semibold"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {robotStatusLabel}
                </span>
              </div>
            </button>
          </Tooltip>

          <Tooltip
            side="bottom"
            content={
              locale === "pl"
                ? "Menu główne i narzędzia"
                : locale === "ro"
                ? "Meniu principal și instrumente"
                : "Main Menu & Legal Tools"
            }
          >
            <button
              onClick={() => setIsMenuDrawerOpen(true)}
              className="w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-[#1E2732] hover:bg-slate-200/80 dark:hover:bg-[#232E3C] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-primary)] transition-colors shrink-0 cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </Tooltip>
        </div>

        {/* Center: Desktop Segmented Workspace Switcher */}
        <nav
          aria-label="Workspace Navigation"
          className="hidden lg:flex items-center bg-slate-100 dark:bg-[#131B2E] p-1 rounded-xl border border-slate-200/80 dark:border-white/10"
        >
          {desktopNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <Tooltip key={item.id} side="bottom" content={item.tooltip}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#0F766E] text-white dark:bg-[#2DD4BF] dark:text-[#141B23] shadow-xs"
                      : "text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold tabular-nums ${
                        isActive
                          ? "bg-white/25 text-white dark:bg-[#141B23]/20 dark:text-[#141B23]"
                          : "bg-slate-200 dark:bg-[#1A243B] text-slate-700 dark:text-[#38B28B]"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              </Tooltip>
            );
          })}
        </nav>

        {/* Right: Quick Utilities, Theme Switcher & Compact Flag Language Selector */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Messages / Notifications Bell */}
          <Tooltip
            side="bottom"
            content={
              locale === "pl"
                ? "Wiadomości i alerty systemowe"
                : locale === "ro"
                ? "Mesaje și alerte sistem"
                : "Messages & System Alerts"
            }
            hint={
              unreadCount > 0
                ? locale === "pl"
                  ? `Nieprzeczytane: ${unreadCount}`
                  : locale === "ro"
                  ? `Necitite: ${unreadCount}`
                  : `Unread: ${unreadCount}`
                : undefined
            }
          >
            <button
              onClick={() => setIsMessagesModalOpen(true)}
              className="relative w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 rounded-xl bg-slate-100 dark:bg-[#131B2E] hover:bg-slate-200/80 dark:hover:bg-[#1A243B] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-[#F1F5F9] transition-colors shrink-0 cursor-pointer"
              aria-label="Messages"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D97724] text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Theme Switcher Button (Dark / High-Contrast Light) */}
          <Tooltip
            side="bottom"
            content={
              themeMode === "dark"
                ? locale === "pl"
                  ? "Włącz jasny motyw (Wysoki kontrast)"
                  : locale === "ro"
                  ? "Activează tema luminoasă"
                  : "Switch to High-Contrast Light Mode"
                : locale === "pl"
                ? "Włącz ciemny motyw (Chancery Slate)"
                : locale === "ro"
                ? "Activează tema întunecată"
                : "Switch to Dark Mode (Chancery Slate)"
            }
          >
            <button
              onClick={toggleThemeMode}
              className="h-8 min-[380px]:h-9 px-2 sm:px-2.5 rounded-xl bg-slate-100 dark:bg-[#131B2E] hover:bg-slate-200/80 dark:hover:bg-[#1A243B] border border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 text-slate-700 dark:text-[#F1F5F9] transition-colors shrink-0 cursor-pointer"
              aria-label="Toggle color theme"
            >
              {themeMode === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-[#D97724]" />
                  <span className="hidden md:inline text-[11px] font-semibold whitespace-nowrap">
                    {locale === "pl" ? "Jasny" : locale === "ro" ? "Luminos" : "Light"}
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#1D6852]" />
                  <span className="hidden md:inline text-[11px] font-semibold whitespace-nowrap">
                    {locale === "pl" ? "Ciemny" : locale === "ro" ? "Întunecat" : "Dark"}
                  </span>
                </>
              )}
            </button>
          </Tooltip>

          {/* Compact Flag-Only Language Switcher (Shows only active country flag; click to expand choices) */}
          <div ref={langMenuRef} className="relative shrink-0">
            <Tooltip
              side="bottom"
              disabled={isLangMenuOpen}
              content={
                locale === "pl"
                  ? "Zmień język aplikacji"
                  : locale === "ro"
                  ? "Schimbă limba aplicației"
                  : "Change App Language"
              }
              hint={currentLocaleItem.name}
            >
              <button
                type="button"
                onClick={() => setIsLangMenuOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isLangMenuOpen}
                aria-label={
                  locale === "pl"
                    ? `Wybrany język: ${currentLocaleItem.name}. Kliknij, aby zmienić język`
                    : locale === "ro"
                    ? `Limbă selectată: ${currentLocaleItem.name}. Click pentru a schimba`
                    : `Selected language: ${currentLocaleItem.name}. Click to change language`
                }
                className={`w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 rounded-xl bg-slate-100 dark:bg-[#131B2E] hover:bg-slate-200/80 dark:hover:bg-[#1A243B] border flex items-center justify-center transition-all cursor-pointer ${
                  isLangMenuOpen
                    ? "border-[#0D9488] dark:border-[#2DD4BF] ring-2 ring-[#2DD4BF]/30"
                    : "border-slate-200/80 dark:border-white/10"
                }`}
              >
                <CountryFlagSvg code={currentLocaleItem.code} className="w-5 h-3.5 rounded-[3px] shadow-2xs ring-1 ring-black/15 dark:ring-white/20" />
              </button>
            </Tooltip>

            {isLangMenuOpen && (
              <div
                role="listbox"
                aria-label={locale === "pl" ? "Wybierz język" : locale === "ro" ? "Selectează limba" : "Select language"}
                className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/15 shadow-xl p-1.5 z-50 space-y-0.5"
              >
                {locales.map((l) => {
                  const isSelected = locale === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setLocale(l.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? "bg-[#1D6852] text-white"
                          : "text-slate-700 dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#1A243B]"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <CountryFlagSvg code={l.code} />
                        <span>{l.name}</span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Demo Mode Info Strip */}
      <div className="bg-[var(--accent-green)]/8 border-t border-[var(--border-color)] px-3 py-0.5 text-center">
        <p className="text-[10px] font-medium text-[var(--text-secondary)] tracking-wide">
          {locale === "pl"
            ? "Wersja demo – przykładowe dane • Twoje rozmowy pozostają prywatne w tej przeglądarce"
            : locale === "ro"
            ? "Versiune demo – date exemplificative • Conversațiile rămân private în browser"
            : "Demo version – sample data • Your chats stay private in this browser"}
        </p>
      </div>

      {/* Persistent Offline / Reconnecting Banner */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-[#2A1810] via-[#131B2E] to-[#2A1810] border-t border-[#D97724]/30 px-3 sm:px-5 py-2">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#D97724]/20 border border-[#D97724]/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                {networkStatus === "reconnecting" ? (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-[#D97724]" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white">{t("netBannerTitle")}</span>
                  {hasSavedWorkInProgress && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1D6852]/40 text-[#38B28B] border border-[#38B28B]/30">
                      {t("netDraftSavedBadge")}
                    </span>
                  )}
                  {queuedMessagesCount > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#D97724]/25 text-amber-200 border border-[#D97724]/40 tabular-nums">
                      {t("netQueuedCountLabel")}: {queuedMessagesCount}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-snug mt-0.5">
                  {activeTab === "templates" && isLetterDrafting
                    ? t("netBannerDescLetter")
                    : activeTab === "chat"
                    ? t("netBannerDescChat")
                    : t("netBannerDescGeneral")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {isSimulatedOffline && (
                <Tooltip
                  side="bottom"
                  content={
                    locale === "pl"
                      ? "Przywróć połączenie online"
                      : locale === "ro"
                      ? "Revino la modul online"
                      : "Return to live connection"
                  }
                >
                  <button
                    onClick={() => setIsSimulatedOffline(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#1D6852] hover:bg-[#258066] text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t("netDisableSimulationBtn")}
                  </button>
                </Tooltip>
              )}
              <Tooltip
                side="bottom"
                content={
                  locale === "pl"
                    ? "Sprawdź status sieci ponownie"
                    : locale === "ro"
                    ? "Verifică conexiunea acum"
                    : "Retry network connection check"
                }
              >
                <button
                  onClick={() => checkConnectionNow()}
                  className="px-3 py-1.5 rounded-lg bg-[#1A243B] hover:bg-[#1E2942] border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      networkStatus === "reconnecting" ? "animate-spin text-amber-400" : "text-[#38B28B]"
                    }`}
                  />
                  {t("netRetryNowBtn")}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
