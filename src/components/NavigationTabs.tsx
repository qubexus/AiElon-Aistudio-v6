import React, { useEffect, useRef, useState } from "react";
import { useApp, TabType } from "../context/AppContext";
import {
  Folders,
  ScrollText,
  MessagesSquare,
  IdCard,
  PlusCircle,
  BookOpen,
  Search,
} from "lucide-react";
import { AskElonShieldLogo } from "./AskElonShieldLogo";
import { Tooltip } from "./Tooltip";

const RADIAL_ONBOARDING_STORAGE_KEY = "ask_elon_radial_onboarding_seen_v1";

export const NavigationTabs: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sentLetters,
    cases,
    robotState,
    triggerRobotReaction,
    themeMode,
    locale,
    setIsNewCaseModalOpen,
    setIsLegalDictionaryModalOpen,
    setIsQuickSearchModalOpen,
    t,
  } = useApp();

  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isPressingRobot, setIsPressingRobot] = useState(false);
  const [showRadialOnboarding, setShowRadialOnboarding] = useState(false);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const onboardingDemoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markRadialOnboardingSeen = () => {
    setShowRadialOnboarding(false);
    try {
      localStorage.setItem(RADIAL_ONBOARDING_STORAGE_KEY, "1");
    } catch {
      // ignore storage errors
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsPressingRobot(false);
  };

  useEffect(() => {
    return () => {
      if (onboardingDemoTimerRef.current) clearTimeout(onboardingDemoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isQuickActionsOpen) setIsQuickActionsOpen(false);
        if (showRadialOnboarding) markRadialOnboardingSeen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearLongPressTimer();
    };
  }, [isQuickActionsOpen, showRadialOnboarding]);

  const openCasesCount = cases.filter((c) => c.status === "open").length;

  const leftNavItems: {
    id: TabType;
    label: string;
    tooltip: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: "cases",
      label: t("tabCases"),
      tooltip:
        locale === "pl"
          ? "Sprawy — Zapisane konsultacje i akta"
          : locale === "ro"
          ? "Cazuri — Consultații și dosare salvate"
          : "Cases — Saved consultations & dossiers",
      icon: <Folders className="w-5 h-5" />,
      badge: openCasesCount > 0 ? openCasesCount : undefined,
    },
    {
      id: "templates",
      label: t("tabTemplates"),
      tooltip:
        locale === "pl"
          ? "Pisma UK — Wzory i wysłane listy"
          : locale === "ro"
          ? "Scrisori UK — Modele oficiale și trimise"
          : "UK Letters — Official templates & archive",
      icon: <ScrollText className="w-5 h-5" />,
      badge: sentLetters.length > 0 ? sentLetters.length : undefined,
    },
  ];

  const rightNavItems: {
    id: TabType;
    label: string;
    tooltip: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: "forum",
      label: t("tabForum"),
      tooltip:
        locale === "pl"
          ? "Społeczność — Forum pracowników w UK"
          : locale === "ro"
          ? "Comunitate — Forum muncitori UK"
          : "Community — UK workplace forum",
      icon: <MessagesSquare className="w-5 h-5" />,
    },
    {
      id: "profile",
      label: t("tabProfile"),
      tooltip:
        locale === "pl"
          ? "Profil i Audyt — Dane do pism prawnych"
          : locale === "ro"
          ? "Profil & Audit — Date pentru scrisori"
          : "Profile & Audit — Personal details for UK letters",
      icon: <IdCard className="w-5 h-5" />,
    },
  ];

  const radialActions = [
    {
      id: "start-new-case",
      label:
        locale === "pl"
          ? "Nowa Sprawa"
          : locale === "ro"
          ? "Caz Nou"
          : "Start New Case",
      tooltipHint:
        locale === "pl"
          ? "Rozpocznij nową sprawę krok po kroku"
          : locale === "ro"
          ? "Deschide asistentul pentru caz nou"
          : "Open guided new case wizard",
      icon: <PlusCircle className="w-5 h-5 sm:w-5.5 sm:h-5.5" />,
      circleClass:
        "bg-[#0E2923] hover:bg-[#1D6852] border-[#38B28B] text-[#38B28B] hover:text-white shadow-[0_6px_22px_rgba(56,178,139,0.4)]",
      openPositionClass:
        "-translate-x-[86px] -translate-y-[74px] sm:-translate-x-[108px] sm:-translate-y-[86px] scale-100 opacity-100",
      delayMs: 0,
      onTrigger: () => {
        setIsQuickActionsOpen(false);
        triggerRobotReaction("happy", 1600);
        setIsNewCaseModalOpen(true);
      },
    },
    {
      id: "legal-dictionary",
      label:
        locale === "pl"
          ? "Słownik Prawny"
          : locale === "ro"
          ? "Dicționar Juridic"
          : "Legal Dictionary",
      tooltipHint:
        locale === "pl"
          ? "Glosariusz pojęć prawa pracy UK"
          : locale === "ro"
          ? "Glosar de dreptul muncii UK"
          : "UK Employment Law glossary",
      icon: <BookOpen className="w-5 h-5 sm:w-5.5 sm:h-5.5" />,
      circleClass:
        "bg-[#2B1D0E] hover:bg-[#D97724] border-[#D97724] text-[#D97724] hover:text-black shadow-[0_6px_22px_rgba(217,119,36,0.42)]",
      openPositionClass:
        "translate-x-0 -translate-y-[116px] sm:-translate-y-[134px] scale-100 opacity-100",
      delayMs: 35,
      onTrigger: () => {
        setIsQuickActionsOpen(false);
        triggerRobotReaction("thinking", 1600);
        setIsLegalDictionaryModalOpen(true);
      },
    },
    {
      id: "quick-search",
      label:
        locale === "pl"
          ? "Szybkie Szukanie"
          : locale === "ro"
          ? "Căutare Rapidă"
          : "Quick Search",
      tooltipHint:
        locale === "pl"
          ? "Szukaj spraw, czatów i szablonów"
          : locale === "ro"
          ? "Caută cazuri, conversații și modele"
          : "Search cases, chats & templates",
      icon: <Search className="w-5 h-5 sm:w-5.5 sm:h-5.5" />,
      circleClass:
        "bg-[#0F233A] hover:bg-[#0284C7] border-[#38BDF8] text-[#38BDF8] hover:text-white shadow-[0_6px_22px_rgba(56,189,248,0.4)]",
      openPositionClass:
        "translate-x-[86px] -translate-y-[74px] sm:translate-x-[108px] sm:-translate-y-[86px] scale-100 opacity-100",
      delayMs: 70,
      onTrigger: () => {
        setIsQuickActionsOpen(false);
        triggerRobotReaction("happy", 1600);
        setIsQuickSearchModalOpen(true);
      },
    },
  ];

  const isChatActive = activeTab === "chat";
  const isVoiceOrAlert =
    robotState === "speaking" ||
    robotState === "listening" ||
    robotState === "concerned";
  const isLight = themeMode === "light";

  const renderNavButton = (item: {
    id: TabType;
    label: string;
    tooltip: string;
    icon: React.ReactNode;
    badge?: number;
  }) => {
    const isActive = activeTab === item.id;
    return (
      <Tooltip key={item.id} side="top" content={item.tooltip}>
        <button
          type="button"
          onClick={() => {
            if (isQuickActionsOpen) setIsQuickActionsOpen(false);
            setActiveTab(item.id);
          }}
          className={`relative min-h-[44px] flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
            isActive
              ? "text-[#1D6852] dark:text-[#38B28B] bg-[#1D6852]/10 dark:bg-[#131B2E]"
              : "text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9]"
          }`}
        >
          {isActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#1D6852] dark:bg-[#38B28B]" />
          )}
          <div className="relative flex items-center justify-center">
            {item.icon}
            {item.badge !== undefined && (
              <span
                className={`absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center tabular-nums ${
                  isActive
                    ? "bg-[#1D6852] text-white"
                    : "bg-slate-200 dark:bg-[#1A243B] text-slate-700 dark:text-[#94A3B8]"
                }`}
              >
                {item.badge}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] mt-1 tracking-tight truncate max-w-full ${
              isActive ? "font-bold" : "font-medium"
            }`}
          >
            {item.label}
          </span>
        </button>
      </Tooltip>
    );
  };

  return (
    <>
      {/* Backdrop Scrim when Radial Quick Actions is Expanded */}
      {isQuickActionsOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsQuickActionsOpen(false)}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsQuickActionsOpen(false);
          }}
          className="fixed inset-0 z-20 bg-black/45 backdrop-blur-[1.5px] transition-opacity duration-200"
        />
      )}

      {/* Radial Onboarding kept non-intrusive on startup */}

      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex items-end"
      >
        {/* Left 2 Navigation Tabs Wing (Sprawy, Pisma) */}
        <div className="nav-wing-bar flex-1 min-w-0 pointer-events-auto bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-white/10 transition-colors duration-200 flex items-center">
          <div className="nav-wing-left-inner w-full max-w-[440px] ml-auto pl-1.5 sm:pl-4 h-full grid grid-cols-2 items-center gap-1">
            {leftNavItems.map(renderNavButton)}
          </div>
        </div>

        {/* Center Semicircular Notch Cradling Oversized Animated Robot Head + Radial Quick Actions */}
        <div className="nav-robot-notch relative shrink-0 -mx-px pointer-events-none select-none">
          <svg
            viewBox="0 0 120 64"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="w-full h-full block pointer-events-auto relative z-10"
          >
            <path
              d="M 0 0 L 9 0 Q 17 0 19 12 A 41 41 0 0 0 101 12 Q 103 0 111 0 L 120 0 L 120 64 L 0 64 Z"
              fill={isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(11, 15, 23, 0.95)"}
            />
            <path
              d="M 0 0.5 L 9 0.5 Q 17 0.5 19 12 A 41 41 0 0 0 101 12 Q 103 0.5 111 0.5 L 120 0.5"
              fill="none"
              stroke={isLight ? "rgba(226, 232, 240, 0.85)" : "rgba(255, 255, 255, 0.12)"}
              strokeWidth="1.2"
            />
          </svg>

          {/* RADIAL QUICK ACTIONS LAYER (Positioned cleanly BEHIND the circular robot head at z-0) */}
          <div
            role="menu"
            aria-label={
              locale === "pl"
                ? "Szybkie Akcje"
                : locale === "ro"
                ? "Acțiuni Rapide"
                : "Quick Actions"
            }
            aria-hidden={!isQuickActionsOpen}
            className="nav-radial-menu-anchor absolute left-1/2 z-0 pointer-events-none"
          >
            {/* Subtle Radial Halo Ring expanding from behind head */}
            <div
              aria-hidden="true"
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[212px] h-[212px] sm:w-[260px] sm:h-[260px] rounded-full border border-[#38B28B]/25 bg-gradient-to-t from-transparent via-[#0B2038]/30 to-[#0B2038]/65 transition-all duration-200 ease-out pointer-events-none ${
                isQuickActionsOpen ? "scale-100 opacity-100" : "scale-[0.28] opacity-0"
              }`}
            />

            {radialActions.map((action) => (
              <div
                key={action.id}
                style={{
                  transitionDelay: isQuickActionsOpen ? `${action.delayMs}ms` : "0ms",
                }}
                className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isQuickActionsOpen
                    ? `${action.openPositionClass} pointer-events-auto`
                    : "translate-x-0 translate-y-0 scale-[0.3] opacity-0 pointer-events-none"
                }`}
              >
                <Tooltip
                  side="top"
                  disabled={!isQuickActionsOpen}
                  content={action.label}
                  hint={action.tooltipHint}
                >
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={isQuickActionsOpen ? 0 : -1}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onTrigger();
                    }}
                    className="group flex flex-col items-center focus:outline-none cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-full border-2 flex items-center justify-center transition-transform duration-150 group-hover:scale-110 group-active:scale-95 ${action.circleClass}`}
                    >
                      {action.icon}
                    </div>
                    <span className="mt-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/20 text-[10px] sm:text-[11px] font-extrabold text-slate-900 dark:text-white whitespace-nowrap shadow-lg">
                      {action.label}
                    </span>
                  </button>
                </Tooltip>
              </div>
            ))}
          </div>

          {/* Oversized Animated Robot Head Button (z-20 above the radial menu origin) */}
          <Tooltip
            side="top"
            disabled={isQuickActionsOpen || showRadialOnboarding}
            content={
              locale === "pl"
                ? "Czat z Elonem"
                : locale === "ro"
                ? "Chat cu Elon"
                : "Chat with Elon"
            }
            hint={
              locale === "pl"
                ? "Przytrzymaj lub prawy klik: Szybkie Akcje"
                : locale === "ro"
                ? "Ține apăsat sau click dreapta: Acțiuni Rapide"
                : "Long-press or right-click: Quick Actions"
            }
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isQuickActionsOpen}
              aria-label={`${t("tabChat")} — ${
                locale === "pl"
                  ? "przytrzymaj lub prawy klik: Szybkie Akcje"
                  : "long-press or right-click for Quick Actions"
              }`}
              onPointerDown={(e) => {
              if (e.button === 2) return;
              longPressTriggeredRef.current = false;
              pointerStartRef.current = { x: e.clientX, y: e.clientY };
              clearLongPressTimer();
              setIsPressingRobot(true);
              longPressTimerRef.current = setTimeout(() => {
                longPressTriggeredRef.current = true;
                setIsPressingRobot(false);
                if (showRadialOnboarding) markRadialOnboardingSeen();
                setIsQuickActionsOpen(true);
                triggerRobotReaction("thinking", 1800);
                try {
                  navigator.vibrate?.(18);
                } catch {
                  // Ignore if vibration unsupported
                }
              }, 420);
            }}
            onPointerMove={(e) => {
              if (!pointerStartRef.current || !longPressTimerRef.current) return;
              const dx = e.clientX - pointerStartRef.current.x;
              const dy = e.clientY - pointerStartRef.current.y;
              if (dx * dx + dy * dy > 100) {
                clearLongPressTimer();
              }
            }}
            onPointerUp={() => clearLongPressTimer()}
            onPointerCancel={() => clearLongPressTimer()}
            onPointerLeave={() => clearLongPressTimer()}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              clearLongPressTimer();
              if (showRadialOnboarding) markRadialOnboardingSeen();
              setIsQuickActionsOpen((prev) => {
                const next = !prev;
                if (next) triggerRobotReaction("thinking", 1800);
                return next;
              });
            }}
            onClick={(e) => {
              if (longPressTriggeredRef.current) {
                longPressTriggeredRef.current = false;
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              if (isQuickActionsOpen) {
                setIsQuickActionsOpen(false);
                return;
              }
              setActiveTab("chat");
              triggerRobotReaction("success", 1800);
            }}
            className="nav-robot-head-btn pointer-events-auto group absolute left-1/2 -translate-x-1/2 z-20 focus:outline-none cursor-pointer touch-manipulation"
          >
            {showRadialOnboarding && !isQuickActionsOpen && (
              <span
                aria-hidden="true"
                className="radial-gesture-ripple absolute -inset-2 rounded-full border-2 border-[#D97724]/70 pointer-events-none"
              />
            )}

            <span
              aria-hidden="true"
              className={`absolute -inset-1 rounded-full transition-opacity duration-300 pointer-events-none ${
                isQuickActionsOpen
                  ? "bg-[#D97724]/30 opacity-100"
                  : isVoiceOrAlert
                  ? "bg-[#D97724]/25 animate-pulse opacity-100"
                  : isChatActive || robotState !== "idle"
                  ? "bg-[#38B28B]/20 opacity-100"
                  : "bg-[#38B28B]/10 opacity-0 group-hover:opacity-100"
              }`}
            />

            <div
              className={`nav-robot-head-frame relative rounded-full bg-gradient-to-b from-[#162238] to-[#0B0F17] border-2 flex items-center justify-center transition-all duration-200 ${
                isPressingRobot
                  ? "scale-95 border-[#D97724]"
                  : isQuickActionsOpen
                  ? "border-[#D97724] shadow-[0_6px_26px_rgba(217,119,36,0.5)] scale-105"
                  : isVoiceOrAlert
                  ? "border-[#D97724] shadow-[0_6px_24px_rgba(217,119,36,0.45)] scale-[1.04]"
                  : isChatActive || robotState !== "idle"
                  ? "border-[#38B28B] shadow-[0_6px_24px_rgba(56,178,139,0.36)] scale-[1.03]"
                  : "border-slate-300/80 dark:border-white/20 shadow-[0_8px_22px_rgba(11,15,23,0.45)] group-hover:border-[#38B28B] group-hover:scale-[1.04]"
              }`}
            >
              <AskElonShieldLogo
                variant="head-only"
                className="nav-robot-head-svg"
                active={isChatActive || isQuickActionsOpen}
                activityState={robotState}
              />
            </div>
          </button>
          </Tooltip>
        </div>

        {/* Right 2 Navigation Tabs Wing (Forum, Profil) */}
        <div className="nav-wing-bar flex-1 min-w-0 pointer-events-auto bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-white/10 transition-colors duration-200 flex items-center">
          <div className="nav-wing-right-inner w-full max-w-[440px] mr-auto pr-1.5 sm:pr-4 h-full grid grid-cols-2 items-center gap-1">
            {rightNavItems.map(renderNavButton)}
          </div>
        </div>
      </nav>
    </>
  );
};
