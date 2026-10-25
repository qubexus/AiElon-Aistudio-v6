import React from "react";
import { useApp, TabType } from "../context/AppContext";
import {
  Briefcase,
  FileText,
  Users,
  UserCircle,
} from "lucide-react";
import { AskElonShieldLogo } from "./AskElonShieldLogo";

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, t, cases } = useApp();

  const openCasesCount = cases.filter((c) => c.status === "open").length;

  const tabs: {
    id: TabType;
    labelKey: string;
    icon?: React.FC<{ className?: string }>;
    isCenterHero?: boolean;
    badge?: number;
  }[] = [
    {
      id: "cases",
      labelKey: "tabCases",
      icon: Briefcase,
      badge: openCasesCount,
    },
    {
      id: "templates",
      labelKey: "tabTemplates",
      icon: FileText,
    },
    {
      id: "chat",
      labelKey: "tabChat",
      isCenterHero: true,
    },
    {
      id: "forum",
      labelKey: "tabForum",
      icon: Users,
    },
    {
      id: "profile",
      labelKey: "tabProfile",
      icon: UserCircle,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070F1A]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5">
      <div className="max-w-md sm:max-w-xl mx-auto flex items-end justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Center "Czat" tab — Enlarged standalone ASK Elon Shield Badge without outer frame or text label
          if (tab.isCenterHero) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-label={t(tab.labelKey)}
                className={`group relative flex items-center justify-center -mt-8 sm:-mt-9 px-1 focus:outline-none transition-transform duration-300 ${
                  isActive ? "scale-110" : "hover:scale-105"
                }`}
              >
                <AskElonShieldLogo
                  className="w-[72px] h-[76px] sm:w-[82px] sm:h-[86px] drop-shadow-[0_6px_18px_rgba(0,0,0,0.75)]"
                  isActive={isActive}
                  tabVariant="chat"
                />
              </button>
            );
          }

          // Standard tabs (Sprawy, Pisma, Forum, Profil) — clean icons + clear text labels
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 sm:px-4 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-[#2EE59D] font-bold"
                  : "text-[#98AEC2] hover:text-[#F4F8FB] font-medium"
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 bg-[#0B6E4F]/25 rounded-xl border border-[#2EE59D]/30 -z-10"></span>
              )}

              <div className="relative flex items-center justify-center">
                {Icon && (
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? "scale-105 text-[#2EE59D]" : "text-[#98AEC2]"
                    }`}
                  />
                )}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 min-w-4 h-4 bg-[#FF6A00] text-black font-mono tabular-nums text-[10px] font-extrabold rounded-full border border-[#070F1A] flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] sm:text-xs tracking-tight mt-1 leading-none">
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
