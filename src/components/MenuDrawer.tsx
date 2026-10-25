import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Locale } from "../types";
import {
  X,
  User,
  ShieldCheck,
  Tag,
  Settings,
  HelpCircle,
  Globe,
  RotateCcw,
  Sparkles,
  ExternalLink
} from "lucide-react";

export const MenuDrawer: React.FC = () => {
  const {
    isMenuDrawerOpen,
    setIsMenuDrawerOpen,
    user,
    updateUser,
    locale,
    setLocale,
    setIsAdminModalOpen,
    setIsMessagesModalOpen,
    resetAll,
    showToast,
    t
  } = useApp();

  const [promoInput, setPromoInput] = useState("");

  if (!isMenuDrawerOpen) return null;

  const handleRedeemPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = promoInput.trim().toUpperCase();
    if (["ELON3M", "SOLIDARITY", "UNITE", "PROMO2026", "PIOTR"].includes(clean)) {
      updateUser({ isPro: true });
      showToast(t("promoSuccess"));
      setPromoInput("");
    } else {
      showToast(t("promoInvalid"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#070F1A] border-l border-white/10 w-full max-w-sm h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-base font-extrabold text-white">
            {t("menuTitle")}
          </h2>
          <button
            onClick={() => setIsMenuDrawerOpen(false)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0B6E4F] border border-[#2EE59D]/40 flex items-center justify-center font-extrabold text-lg text-white">
              {user.fullName.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{user.fullName}</h3>
              <p className="text-[11px] text-[#BACADA]">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#2EE59D] font-mono">
                  #{user.accountId}
                </span>
                {user.isPro && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#FF6A00]/20 text-[#FF6A00] font-black border border-[#FF6A00]/30">
                    PRO
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Promo Code Box */}
        <div className="py-5 border-b border-white/10">
          <label className="block text-xs font-bold text-white mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span>{t("promoCodeLabel")}</span>
          </label>
          <form onSubmit={handleRedeemPromo} className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              placeholder="np. ELON3M"
              className="flex-1 bg-[#0F2C4D] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white uppercase placeholder-[#BACADA]/50 focus:outline-none focus:border-[#2EE59D]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-black font-extrabold text-xs shadow-md transition-colors"
            >
              {t("redeemBtn")}
            </button>
          </form>
          <span className="text-[10px] text-[#BACADA]/70 mt-1 block">
            Wpisz kod <strong className="text-white">ELON3M</strong> aby aktywować 3 miesiące PRO.
          </span>
        </div>

        {/* Language selector */}
        <div className="py-4 border-b border-white/10">
          <label className="block text-xs font-bold text-white mb-2 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#2EE59D]" />
            <span>{t("languageSelect")}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["pl", "en", "ro"] as Locale[]).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors ${
                  locale === l
                    ? "bg-[#0B6E4F] text-white border-[#2EE59D]/40"
                    : "bg-[#0F2C4D] text-[#BACADA] border-white/5 hover:text-white"
                }`}
              >
                {l === "pl" ? "🇵🇱 PL" : l === "en" ? "🇬🇧 EN" : "🇷🇴 RO"}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="py-4 space-y-2 flex-1">
          <button
            onClick={() => {
              setIsMenuDrawerOpen(false);
              setIsAdminModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0F2C4D] hover:bg-[#12304F] text-xs font-bold text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-[#FF6A00]" />
            <span>{t("adminPanelBtn")}</span>
          </button>

          <button
            onClick={() => {
              setIsMenuDrawerOpen(false);
              setIsMessagesModalOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0F2C4D] hover:bg-[#12304F] text-xs font-bold text-white transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-[#2EE59D]" />
            <span>{t("supportContactBtn")}</span>
          </button>
        </div>

        {/* Footer Reset Action */}
        <div className="pt-4 border-t border-white/10">
          <button
            onClick={resetAll}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-[#EF4444]/20 border border-white/10 text-xs font-semibold text-[#BACADA] hover:text-[#EF4444] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t("resetData")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
