import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useApp, TabType } from "../context/AppContext";
import {
  Folders,
  ScrollText,
  MessagesSquare,
  IdCard,
  PlusCircle,
  BookOpen,
  Search,
  X,
} from "lucide-react";
import { AskElonShieldLogo } from "./AskElonShieldLogo";
import { Tooltip } from "./Tooltip";

const RADIAL_ONBOARDING_STORAGE_KEY = "ask_elon_radial_onboarding_seen_v1";
const BOTTOM_BANNER_DISMISS_KEY = "ask-elon/bottom-banner/dismissed/v1";
const BOTTOM_BANNER_APP_VERSION = "7.1.0";
const BOTTOM_BANNER_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function isBottomBannerCurrentlyDismissed(locale: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(BOTTOM_BANNER_DISMISS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      dismissedAt?: number;
      appVersion?: string;
      locale?: string;
    };
    if (
      typeof parsed.dismissedAt !== "number" ||
      parsed.appVersion !== BOTTOM_BANNER_APP_VERSION ||
      parsed.locale !== locale
    ) {
      return false;
    }
    return Date.now() - parsed.dismissedAt < BOTTOM_BANNER_TTL_MS;
  } catch {
    return false;
  }
}

export const NavigationTabs: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sentLetters,
    cases,
    robotState,
    triggerRobotReaction,
    locale,
    setIsNewCaseModalOpen,
    setIsLegalDictionaryModalOpen,
    setIsQuickSearchModalOpen,
    t,
  } = useApp();

  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isPressingRobot, setIsPressingRobot] = useState(false);
  const [showRadialOnboarding, setShowRadialOnboarding] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ cx: number; cy: number; vw: number }>({
    cx: 0,
    cy: 0,
    vw: typeof window !== "undefined" ? window.innerWidth : 390,
  });
  const [labelShifts, setLabelShifts] = useState<Record<string, number>>({});
  const [isBottomBannerDismissed, setIsBottomBannerDismissed] = useState<boolean>(() =>
    isBottomBannerCurrentlyDismissed(locale)
  );

  useEffect(() => {
    setIsBottomBannerDismissed(isBottomBannerCurrentlyDismissed(locale));
  }, [locale]);

  const handleDismissBottomBanner = useCallback(() => {
    setIsBottomBannerDismissed(true);
    try {
      localStorage.setItem(
        BOTTOM_BANNER_DISMISS_KEY,
        JSON.stringify({
          dismissedAt: Date.now(),
          appVersion: BOTTOM_BANNER_APP_VERSION,
          locale,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [locale]);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const onboardingDemoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const robotButtonRef = useRef<HTMLButtonElement | null>(null);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  const measureRobotCenter = useCallback(() => {
    const el = robotButtonRef.current;
    if (!el || typeof window === "undefined") return;
    const rect = el.getBoundingClientRect();
    setMenuAnchor({
      cx: rect.left + rect.width / 2,
      cy: rect.top + rect.height / 2,
      vw: window.innerWidth,
    });
  }, []);

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

  useLayoutEffect(() => {
    measureRobotCenter();
  }, [measureRobotCenter]);

  useEffect(() => {
    const handleViewportChange = () => {
      measureRobotCenter();
    };
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("orientationchange", handleViewportChange);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
    };
  }, [measureRobotCenter]);

  useEffect(() => {
    if (activeTab === "chat" && isQuickActionsOpen) {
      setIsQuickActionsOpen(false);
    }
  }, [activeTab, isQuickActionsOpen]);

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
      icon: <Folders className="w-[19px] h-[19px]" strokeWidth={1.65} />,
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
      icon: <ScrollText className="w-[19px] h-[19px]" strokeWidth={1.65} />,
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
          ? "Q&A — Możliwości aplikacji: gdzie wejść, co zaznaczyć i co uzyskać"
          : locale === "ro"
          ? "Q&A — Ghid funcționalități aplicație și întrebări"
          : "Q&A — App capabilities guide: where to go, what to select & what you get",
      icon: <MessagesSquare className="w-[19px] h-[19px]" strokeWidth={1.65} />,
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
      icon: <IdCard className="w-[19px] h-[19px]" strokeWidth={1.65} />,
    },
  ];

  const arcRadius = menuAnchor.vw < 380 ? 84 : 96;

  const radialActions = [
    {
      id: "start-new-case",
      label:
        locale === "pl"
          ? "Nowa sprawa"
          : locale === "ro"
          ? "Caz nou"
          : "New Case",
      icon: <PlusCircle className="w-5 h-5" strokeWidth={1.75} />,
      angleDeg: -150,
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
          ? "Słownik prawny"
          : locale === "ro"
          ? "Dicționar juridic"
          : "Legal Dictionary",
      icon: <BookOpen className="w-5 h-5" strokeWidth={1.75} />,
      angleDeg: -90,
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
          ? "Szukaj"
          : locale === "ro"
          ? "Caută"
          : "Search",
      icon: <Search className="w-5 h-5" strokeWidth={1.75} />,
      angleDeg: -30,
      delayMs: 70,
      onTrigger: () => {
        setIsQuickActionsOpen(false);
        triggerRobotReaction("happy", 1600);
        setIsQuickSearchModalOpen(true);
      },
    },
  ].map((item) => {
    const rad = (item.angleDeg * Math.PI) / 180;
    const x = Math.round(Math.cos(rad) * arcRadius) || 0;
    const y = Math.round(Math.sin(rad) * arcRadius) || 0;
    return { ...item, x, y };
  });

  useLayoutEffect(() => {
    if (!isQuickActionsOpen || typeof window === "undefined") return;
    const vw = menuAnchor.vw || window.innerWidth;
    const nextShifts: Record<string, number> = {};
    radialActions.forEach((action) => {
      const el = labelRefs.current[action.id];
      if (!el) return;
      const halfW = el.offsetWidth / 2;
      const centerX = menuAnchor.cx + action.x;
      const naturalLeft = centerX - halfW;
      const naturalRight = centerX + halfW;
      let shift = 0;
      if (naturalLeft < 8) {
        shift = Math.ceil(8 - naturalLeft);
      } else if (naturalRight > vw - 8) {
        shift = Math.floor(vw - 8 - naturalRight);
      }
      if (shift !== 0) {
        nextShifts[action.id] = shift;
      }
    });
    setLabelShifts((prev) => {
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(nextShifts);
      if (
        prevKeys.length === nextKeys.length &&
        prevKeys.every((k) => prev[k] === nextShifts[k])
      ) {
        return prev;
      }
      return nextShifts;
    });
  }, [isQuickActionsOpen, menuAnchor.cx, menuAnchor.cy, menuAnchor.vw, locale, arcRadius]);

  const isChatActive = activeTab === "chat";

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
          className={`relative min-h-[44px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors cursor-pointer ${
            isActive
              ? "text-[#0F766E] dark:text-[#2DD4BF]"
              : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]"
          }`}
        >
          <div className="relative flex items-center justify-center">
            {item.icon}
            {item.badge !== undefined && (
              <span className="absolute -top-1.5 -right-3.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#F59E42] text-white dark:bg-[#FBB063] dark:text-[#141B23] font-mono text-[9.5px] font-bold flex items-center justify-center tabular-nums leading-none shadow-2xs">
                {item.badge}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] mt-1 tracking-tight truncate max-w-full leading-tight ${
              isActive ? "font-semibold" : "font-medium"
            }`}
          >
            {item.label}
          </span>
          {/* 4px turquoise indicator dot under the active tab label */}
          <span
            aria-hidden="true"
            className={`w-1 h-1 rounded-full mt-0.5 transition-opacity ${
              isActive
                ? "bg-[#0F766E] dark:bg-[#2DD4BF] opacity-100"
                : "bg-transparent opacity-0"
            }`}
          />
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

      {/* Symmetric Arc Menu anchored to Robot's Real Centre (measured via getBoundingClientRect) */}
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
        style={{
          position: "fixed",
          left: `${menuAnchor.cx}px`,
          top: `${menuAnchor.cy}px`,
          width: 0,
          height: 0,
          zIndex: 45,
        }}
        className="pointer-events-none"
      >
        {radialActions.map((action) => (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            tabIndex={isQuickActionsOpen ? 0 : -1}
            onClick={(e) => {
              e.stopPropagation();
              action.onTrigger();
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "48px",
              height: "48px",
              transform: isQuickActionsOpen
                ? `translate(calc(-50% + ${action.x}px), calc(-50% + ${action.y}px)) scale(1)`
                : "translate(-50%, -50%) scale(0.3)",
              opacity: isQuickActionsOpen ? 1 : 0,
              transitionDelay: isQuickActionsOpen ? `${action.delayMs}ms` : "0ms",
            }}
            className={`group rounded-full border-[1.5px] flex items-center justify-center transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] focus:outline-none shadow-md cursor-pointer bg-[#FFFFFF] dark:bg-[#1E2732] border-[#0D9488] dark:border-[#2DD4BF] text-[#0D9488] dark:text-[#2DD4BF] hover:bg-[#0D9488] hover:text-white dark:hover:bg-[#2DD4BF] dark:hover:text-[#141B23] ${
              isQuickActionsOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            {action.icon}
            <span
              ref={(el) => {
                labelRefs.current[action.id] = el;
              }}
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: `translateX(calc(-50% + ${labelShifts[action.id] || 0}px))`,
                marginTop: "6px",
                whiteSpace: "nowrap",
                fontSize: "12px",
                lineHeight: 1.25,
                padding: "2px 8px",
                borderRadius: "999px",
                zIndex: 50,
              }}
              className="font-medium tracking-[-0.015em] bg-[#FFFFFF] dark:bg-[#1E2732] text-[#1E293B] dark:text-[#F1F5F9] border border-[#E2E8F0] dark:border-[#2C3847] shadow-sm pointer-events-none"
            >
              {action.label}
            </span>
          </button>
        ))}
      </div>

      <nav
        aria-label="Bottom Navigation"
        className="bottom-nav-shell fixed bottom-0 left-0 right-0 z-30 pointer-events-auto"
      >
        {/* Split-wing bottom banner: fades sideways toward empty robot cut-out and downward over tab labels */}
        {!isChatActive && !isBottomBannerDismissed && (
          <>
            <div className="bottom-banner-layer" aria-hidden="true">
              <div className="bottom-banner-wing bottom-banner-wing--left">
                <div className="bottom-banner-wing-bg" />
                <span className="bottom-banner-copy">{t("bottomBannerCopy")}</span>
              </div>
              <div className="bottom-banner-wing bottom-banner-wing--right">
                <div className="bottom-banner-wing-bg" />
              </div>
            </div>
            <div className="bottom-banner-dismiss-layer">
              <button
                type="button"
                onClick={handleDismissBottomBanner}
                aria-label={t("bottomBannerDismiss")}
                className="bottom-banner-dismiss-btn"
              >
                <X className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </>
        )}

        {/* 2px Horizontal Top Accent Line: transparent -> green (40% opacity) -> transparent, strongest under the robot */}
        <div aria-hidden="true" className="nav-top-accent-line" />

        <div className="relative z-15 max-w-5xl mx-auto w-full h-[var(--nav-bar-height)] flex items-center px-1.5 sm:px-4">
          {/* Left 2 Navigation Tabs Wing (Sprawy, Pisma) */}
          <div className="flex-1 min-w-0 grid grid-cols-2 items-center gap-0.5 sm:gap-1 pr-1 sm:pr-2">
            {leftNavItems.map(renderNavButton)}
          </div>

          {/* Center Discreet Robot Accent (max 52px height, protrudes max 12px above bar, no pedestal, no heavy glow, no arrow) */}
          <div className="nav-robot-notch relative shrink-0 select-none flex items-center justify-center">
            {/* Soft, subtle green radial-gradient halo behind the robot (radius ~40px, 10-15% opacity) */}
            <div aria-hidden="true" className="nav-robot-soft-halo" />

            {/* Small Discreet Robot Head Button (max 52px height, protrudes max 12px) */}
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
                  ? "Przytrzymaj: Nowa sprawa / Słownik prawny / Szukaj"
                  : locale === "ro"
                  ? "Ține apăsat: Caz nou / Dicționar / Caută"
                  : "Long-press: New Case / Legal Dictionary / Search"
              }
            >
              <button
                ref={robotButtonRef}
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
                    measureRobotCenter();
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
                  measureRobotCenter();
                  const next = !isQuickActionsOpen;
                  setIsQuickActionsOpen(next);
                  if (next) triggerRobotReaction("thinking", 1800);
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
                className="nav-robot-head-btn pointer-events-auto group absolute left-1/2 -translate-x-1/2 z-20 focus:outline-none cursor-pointer touch-manipulation bg-transparent border-0 p-0"
              >
                <div
                  className={`nav-robot-head-frame relative flex items-center justify-center transition-transform duration-200 bg-transparent border-0 ${
                    isPressingRobot
                      ? "scale-95"
                      : isQuickActionsOpen
                      ? "scale-105"
                      : "group-hover:scale-105"
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

          {/* Right 2 Navigation Tabs Wing (Q&A, Profil) */}
          <div className="flex-1 min-w-0 grid grid-cols-2 items-center gap-0.5 sm:gap-1 pl-1 sm:pl-2">
            {rightNavItems.map(renderNavButton)}
          </div>
        </div>
      </nav>
    </>
  );
};
