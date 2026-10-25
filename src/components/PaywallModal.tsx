import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { PromoCodeItem } from "../types";
import {
  X,
  ShieldCheck,
  Check,
  CreditCard,
  Lock,
  Tag,
  Gauge,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const PaywallModal: React.FC = () => {
  const {
    isPaywallModalOpen,
    setIsPaywallModalOpen,
    updateUser,
    user,
    cases,
    sentLetters,
    documents,
    recentUnsavedChats,
    redeemPromoCode,
    t,
    showToast,
  } = useApp();

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    promo: PromoCodeItem;
    discountedPrice: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!isPaywallModalOpen) return null;

  const basePrice = 9.99;
  const effectivePrice = appliedPromo ? appliedPromo.discountedPrice : basePrice;
  const hasProOrFreeAccess = Boolean(user.isPro || user.free_access);

  const handleActivatePro = () => {
    updateUser({
      isPro: true,
      subscriptionStatus: user.free_access ? "free_access" : "active_pro",
    });
    setIsPaywallModalOpen(false);
    showToast(
      appliedPromo
        ? `Subskrypcja ask Elon PRO aktywowana w cenie £${effectivePrice.toFixed(2)}/mies. (kod ${appliedPromo.promo.code})!`
        : "Subskrypcja ask Elon PRO została pomyślnie aktywowana!"
    );
  };

  const handleCancelPro = () => {
    updateUser({
      isPro: false,
      free_access: false,
      subscriptionStatus: "free",
    });
    setIsPaywallModalOpen(false);
    showToast("Subskrypcja ask Elon PRO została anulowana.");
  };

  const handleRedeemPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const res = redeemPromoCode(promoInput);
    if (res.valid && res.promo && res.discountedPrice !== undefined) {
      setAppliedPromo({
        promo: res.promo,
        discountedPrice: res.discountedPrice,
      });
      setPromoInput("");
      if (res.discountedPrice === 0) {
        setIsPaywallModalOpen(false);
      }
    } else if (res.errorReason) {
      setPromoError(res.errorReason);
    }
  };

  const features = [
    t("proFeature1"),
    t("proFeature2"),
    t("proFeature3"),
    t("proFeature4"),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative bg-gradient-to-b from-[#0F2C4D] to-[#070F1A] border border-[#FF6A00]/40 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-5 sm:p-6 my-auto">
        {/* Glow behind */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#FF6A00]/20 blur-3xl -z-10 rounded-full"></div>

        {/* Close Button */}
        <button
          onClick={() => setIsPaywallModalOpen(false)}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-black/40 hover:bg-white/10 text-[#BACADA] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Badge */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6A00] to-[#FFA726] flex items-center justify-center text-black shadow-lg mb-2.5">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-white">
            Subskrypcja ask Elon i limity
          </h2>

          {/* Dynamic Price Display with Discount Support */}
          <div className="flex items-baseline justify-center gap-2 mt-1">
            {appliedPromo ? (
              <>
                <span className="text-sm font-bold font-mono tabular-nums text-[#BACADA] line-through">
                  £{basePrice.toFixed(2)}
                </span>
                <span className="text-2xl font-black font-mono tabular-nums text-[#2EE59D]">
                  £{effectivePrice.toFixed(2)} / miesiąc
                </span>
              </>
            ) : (
              <span className="text-2xl font-black font-mono tabular-nums text-[#FF6A00]">
                {t("proPrice")}
              </span>
            )}
          </div>

          {appliedPromo && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2EE59D]/15 border border-[#2EE59D]/40 text-[11px] font-extrabold text-[#2EE59D]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                Aktywny kod {appliedPromo.promo.code} (
                {appliedPromo.promo.discountType === "percentage"
                  ? `-${appliedPromo.promo.discountValue}%`
                  : `-£${appliedPromo.promo.discountValue.toFixed(2)}`}
                )
              </span>
            </div>
          )}

          <p className="text-xs text-[#BACADA] mt-1">
            Możesz anulować w dowolnym momencie. Bez ukrytych opłat.
          </p>
        </div>

        {/* Account Usage & Limits Section */}
        <div className="mb-4 rounded-2xl bg-[#091A2E] border border-white/10 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#2EE59D]" />
              <span>
                Twoje limity konta (
                {user.free_access
                  ? "Dostęp Bezpłatny VIP"
                  : user.isPro
                  ? "Plan PRO"
                  : "Plan darmowy"}
                )
              </span>
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                hasProOrFreeAccess
                  ? "bg-[#2EE59D]/20 text-[#2EE59D] border border-[#2EE59D]/40"
                  : "bg-white/10 text-[#BACADA]"
              }`}
            >
              {hasProOrFreeAccess ? "BEZ LIMITU" : "STANDARD"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-[#0F2C4D]/70 border border-white/5 p-2.5">
              <p className="text-[#9BB0C5]">Wygenerowane pisma</p>
              <p className="text-sm font-black font-mono tabular-nums text-white mt-0.5">
                {sentLetters.length} / {hasProOrFreeAccess ? "∞" : "5 mies."}
              </p>
            </div>
            <div className="rounded-xl bg-[#0F2C4D]/70 border border-white/5 p-2.5">
              <p className="text-[#9BB0C5]">Aktywne sprawy</p>
              <p className="text-sm font-black font-mono tabular-nums text-white mt-0.5">
                {cases.length} / {hasProOrFreeAccess ? "∞" : "3"}
              </p>
            </div>
            <div className="rounded-xl bg-[#0F2C4D]/70 border border-white/5 p-2.5">
              <p className="text-[#9BB0C5]">Audyty Payslipów</p>
              <p className="text-sm font-black font-mono tabular-nums text-white mt-0.5">
                {documents.length} / {hasProOrFreeAccess ? "∞" : "3 mies."}
              </p>
            </div>
            <div className="rounded-xl bg-[#0F2C4D]/70 border border-white/5 p-2.5">
              <p className="text-[#9BB0C5]">Historia czatów</p>
              <p className="text-sm font-black font-mono tabular-nums text-[#2EE59D] mt-0.5">
                {recentUnsavedChats.length} / 10
              </p>
            </div>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2 mb-4 bg-[#12304F]/60 p-3.5 rounded-2xl border border-white/5">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#2EE59D]/20 text-[#2EE59D] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-xs text-[#F4F8FB] leading-relaxed font-medium">
                {feat}
              </span>
            </div>
          ))}
        </div>

        {/* Promo Code Box (Always available to test/apply promo codes) */}
        <div className="mb-4">
          <form onSubmit={handleRedeemPromo} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-[#FF6A00] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  if (promoError) setPromoError(null);
                }}
                placeholder="Kod rabatowy (np. SOLIDARITY, UNITE, ELON3M)"
                className="w-full bg-[#091A2E] border border-white/15 rounded-xl pl-8 pr-3 py-2 text-xs text-white uppercase placeholder-[#BACADA]/50 focus:outline-none focus:border-[#2EE59D]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-xs transition-colors"
            >
              {t("redeemBtn")}
            </button>
          </form>
          {promoError && (
            <p className="mt-1.5 text-[11px] text-[#EF4444] font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{promoError}</span>
            </p>
          )}
        </div>

        {/* Action Button */}
        {hasProOrFreeAccess && !appliedPromo ? (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-center text-xs font-bold text-[#10B981]">
              {user.free_access
                ? "Posiadasz aktywny bezpłatny dostęp (Free Access) przyznany przez Administratora."
                : "Twój plan PRO jest aktywny."}
            </div>
            <button
              onClick={handleCancelPro}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#BACADA] hover:text-[#EF4444] transition-colors"
            >
              Anuluj subskrypcję PRO
            </button>
          </div>
        ) : (
          <button
            onClick={handleActivatePro}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF6A00] to-[#FFA726] hover:opacity-95 text-black font-black text-xs sm:text-sm shadow-xl transition-all"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {appliedPromo
                ? `Zapłać £${effectivePrice.toFixed(2)}/mies. i aktywuj PRO`
                : t("subscribeBtn")}
            </span>
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#BACADA]/70 mt-4">
          <Lock className="w-3 h-3 text-[#2EE59D]" />
          <span>Płatność zabezpieczona PayPal & Stripe. Zgodność z PCI-DSS.</span>
        </div>
      </div>
    </div>
  );
};
