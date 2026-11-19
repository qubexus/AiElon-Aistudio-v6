import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { PromoCodeItem } from "../types";
import {
  X,
  ShieldCheck,
  Check,
  CreditCard,
  Lock,
  Tag,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const PaywallModal: React.FC = () => {
  const {
    isPaywallModalOpen,
    setIsPaywallModalOpen,
    setIsTermsPrivacyModalOpen,
    setIsRegisterModalOpen,
    updateUser,
    user,
    redeemPromoCode,
    locale,
    t,
    showToast,
  } = useApp();

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    promo: PromoCodeItem;
    discountedPrice: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(Boolean(user.acceptedTermsAt));
  const [termsError, setTermsError] = useState<string | null>(null);

  useEffect(() => {
    if (isPaywallModalOpen) {
      setAcceptedTerms(Boolean(user.acceptedTermsAt));
      setTermsError(null);
    }
  }, [isPaywallModalOpen, user.acceptedTermsAt]);

  if (!isPaywallModalOpen) return null;

  const basePrice = 9.99;
  const effectivePrice = appliedPromo ? appliedPromo.discountedPrice : basePrice;
  const hasMembership = Boolean(user.isPro || user.free_access);

  const copy = {
    title: t("proTitle"),
    subtitle:
      locale === "pl"
        ? "Jedno członkostwo — wszystkie funkcje wliczone, brak planu darmowego. Anuluj w dowolnym momencie."
        : locale === "ro"
        ? "Un singur abonament — toate funcțiile incluse, fără plan gratuit. Anulează oricând."
        : "Single membership — all features included, no free plan. Cancel any time.",
    coolingOff:
      locale === "pl"
        ? "14 dni na odstąpienie (zwrot pomniejszony proporcjonalnie za czas dostępu)."
        : locale === "ro"
        ? "Drept de retragere 14 zile (rambursare minus suma proporțională pentru perioada cu acces)."
        : "14-day UK cancellation right (refunded minus a proportionate amount for time with access).",
    statusHeading:
      locale === "pl"
        ? "Status członkostwa"
        : locale === "ro"
        ? "Status abonament"
        : "Membership Status",
    statusActiveVip:
      locale === "pl"
        ? "Dostęp specjalny aktywny"
        : locale === "ro"
        ? "Acces special activ"
        : "Special Access Active",
    statusActiveMember:
      locale === "pl"
        ? "Członkostwo £9.99/mies. aktywne"
        : locale === "ro"
        ? "Abonament £9.99/lună activ"
        : "£9.99/mo Membership Active",
    statusInactive:
      locale === "pl"
        ? "Wymagane członkostwo (£9.99/mies.)"
        : locale === "ro"
        ? "Abonament necesar (£9.99/lună)"
        : "Membership Required (£9.99/mo)",
    badgeActive:
      locale === "pl" ? "AKTYWNE" : locale === "ro" ? "ACTIV" : "ACTIVE",
    badgeRequired:
      locale === "pl" ? "WYMAGANE" : locale === "ro" ? "NECESAR" : "REQUIRED",
    promoPlaceholder:
      locale === "pl"
        ? "Kod rabatowy (np. SOLIDARITY, UNITE)"
        : locale === "ro"
        ? "Cod promoțional (ex. SOLIDARITY, UNITE)"
        : "Promo code (e.g. SOLIDARITY, UNITE)",
    acceptTerms:
      locale === "pl"
        ? "Akceptuję Regulamin i Politykę Prywatności"
        : locale === "ro"
        ? "Accept Termenii și Politica de Confidențialitate"
        : "I accept the Terms and Privacy Notice",
    readTerms:
      locale === "pl"
        ? "Czytaj Regulamin i Politykę Prywatności"
        : locale === "ro"
        ? "Citește Termenii și Politica"
        : "Read Terms & Privacy Notice",
    termsRequiredErr:
      locale === "pl"
        ? "Zaakceptuj Regulamin i Politykę Prywatności przed aktywacją."
        : locale === "ro"
        ? "Acceptă Termenii și Politica de Confidențialitate înainte de activare."
        : "Please accept the Terms and Privacy Notice before subscribing.",
    registerPrompt:
      locale === "pl"
        ? "Brak danych konta? Zarejestruj konto"
        : locale === "ro"
        ? "Nu ai cont încă? Înregistrează-te"
        : "Need an account first? Register here",
    cancelBtn:
      locale === "pl"
        ? "Anuluj członkostwo"
        : locale === "ro"
        ? "Anulează abonamentul"
        : "Cancel membership",
    securityNote:
      locale === "pl"
        ? "Płatność zabezpieczona Stripe. Zgodność z PCI-DSS."
        : locale === "ro"
        ? "Plată securizată prin Stripe. Conform PCI-DSS."
        : "Secured checkout via Stripe. PCI-DSS compliant.",
    activatedToast:
      locale === "pl"
        ? "Członkostwo ask Elon zostało aktywowane!"
        : locale === "ro"
        ? "Abonamentul ask Elon a fost activat!"
        : "ask Elon membership activated!",
    cancelledToast:
      locale === "pl"
        ? "Członkostwo ask Elon zostało anulowane."
        : locale === "ro"
        ? "Abonamentul ask Elon a fost anulat."
        : "ask Elon membership cancelled.",
  };

  const handleActivatePro = () => {
    if (!acceptedTerms) {
      setTermsError(copy.termsRequiredErr);
      return;
    }
    setTermsError(null);
    updateUser({
      isPro: true,
      subscriptionStatus: user.free_access ? "free_access" : "active_pro",
      acceptedTermsAt: user.acceptedTermsAt || new Date().toISOString(),
    });
    setIsPaywallModalOpen(false);
    showToast(
      appliedPromo
        ? `${copy.activatedToast} (£${effectivePrice.toFixed(2)}/mo · ${appliedPromo.promo.code})`
        : copy.activatedToast
    );
  };

  const handleCancelPro = () => {
    updateUser({
      isPro: false,
      free_access: false,
      subscriptionStatus: "free",
    });
    setIsPaywallModalOpen(false);
    showToast(copy.cancelledToast);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative bg-[#141B23] border border-[#2C3847] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-5 sm:p-6 my-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#2DD4BF]/10 blur-3xl -z-10 rounded-full" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsPaywallModalOpen(false)}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-[#1E2732] hover:bg-[#2C3847] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Badge */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FBB063] flex items-center justify-center text-[#141B23] shadow-lg mb-2.5">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-black text-[#F1F5F9]">{copy.title}</h2>

          {/* Dynamic Price Display */}
          <div className="flex items-baseline justify-center gap-2 mt-1">
            {appliedPromo ? (
              <>
                <span className="text-sm font-bold font-mono tabular-nums text-[#94A3B8] line-through">
                  £{basePrice.toFixed(2)}
                </span>
                <span className="text-2xl font-black font-mono tabular-nums text-[#2DD4BF]">
                  £{effectivePrice.toFixed(2)} / {locale === "pl" ? "mies." : locale === "ro" ? "lună" : "month"}
                </span>
              </>
            ) : (
              <span className="text-2xl font-black font-mono tabular-nums text-[#FBB063]">
                {t("proPrice")}
              </span>
            )}
          </div>

          {appliedPromo && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#52B798]/15 border border-[#52B798]/40 text-[11px] font-extrabold text-[#52B798]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {appliedPromo.promo.code} (
                {appliedPromo.promo.discountType === "percentage"
                  ? `-${appliedPromo.promo.discountValue}%`
                  : `-£${appliedPromo.promo.discountValue.toFixed(2)}`}
                )
              </span>
            </div>
          )}

          <p className="text-xs text-[#94A3B8] mt-1.5 leading-snug">{copy.subtitle}</p>
          <p className="text-[11px] text-[#94A3B8]/85 mt-1 leading-snug">{copy.coolingOff}</p>
        </div>

        {/* Single Membership Status Card */}
        <div className="mb-4 rounded-2xl bg-[#1E2732] border border-[#2C3847] p-3.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
              {copy.statusHeading}
            </p>
            <p className="text-xs font-extrabold text-[#F1F5F9] mt-0.5 truncate">
              {user.free_access
                ? copy.statusActiveVip
                : user.isPro
                ? copy.statusActiveMember
                : copy.statusInactive}
            </p>
          </div>
          <span
            className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
              hasMembership
                ? "bg-[#52B798]/20 text-[#52B798] border border-[#52B798]/40"
                : "bg-[#FBB063]/15 text-[#FBB063] border border-[#FBB063]/40"
            }`}
          >
            {hasMembership ? copy.badgeActive : copy.badgeRequired}
          </span>
        </div>

        {/* Features Checklist */}
        <div className="space-y-2 mb-4 bg-[#1E2732]/70 p-3.5 rounded-2xl border border-[#2C3847]">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#52B798]/20 text-[#52B798] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-xs text-[#F1F5F9] leading-relaxed font-medium">{feat}</span>
            </div>
          ))}
        </div>

        {/* Promo Code Box */}
        <div className="mb-3.5">
          <form onSubmit={handleRedeemPromo} className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Tag className="w-3.5 h-3.5 text-[#FBB063] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value);
                  if (promoError) setPromoError(null);
                }}
                placeholder={copy.promoPlaceholder}
                className="w-full bg-[#1E2732] border border-[#2C3847] rounded-xl pl-8 pr-3 py-2 text-xs text-[#F1F5F9] uppercase placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#2DD4BF]"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-[#1E2732] hover:bg-[#2C3847] border border-[#2C3847] text-[#F1F5F9] font-extrabold text-xs transition-colors shrink-0 cursor-pointer"
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

        {/* Terms & Privacy Acceptance + Links */}
        <div className="mb-4 rounded-xl bg-[#1E2732] border border-[#2C3847] p-3 space-y-1.5">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (termsError) setTermsError(null);
              }}
              className="mt-0.5 w-4 h-4 accent-[#2DD4BF] cursor-pointer shrink-0"
            />
            <span className="text-xs text-[#F1F5F9] font-semibold leading-snug">
              {copy.acceptTerms}
            </span>
          </label>
          <div className="ml-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <button
              type="button"
              onClick={() => setIsTermsPrivacyModalOpen(true)}
              className="text-[#2DD4BF] underline font-bold hover:opacity-80 cursor-pointer"
            >
              {copy.readTerms}
            </button>
            {!user.email && (
              <button
                type="button"
                onClick={() => {
                  setIsPaywallModalOpen(false);
                  setIsRegisterModalOpen(true);
                }}
                className="text-[#2DD4BF] underline font-bold hover:opacity-80 cursor-pointer"
              >
                {copy.registerPrompt}
              </button>
            )}
          </div>
          {termsError && (
            <p className="text-[11px] text-[#EF4444] font-semibold flex items-center gap-1 pt-0.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{termsError}</span>
            </p>
          )}
        </div>

        {/* Action Button */}
        {hasMembership && !appliedPromo ? (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-[#52B798]/15 border border-[#52B798]/40 text-center text-xs font-bold text-[#52B798]">
              {user.free_access ? copy.statusActiveVip : copy.statusActiveMember}
            </div>
            <button
              type="button"
              onClick={handleCancelPro}
              className="w-full py-2.5 rounded-xl bg-[#1E2732] hover:bg-[#2C3847] text-xs text-[#94A3B8] hover:text-[#EF4444] transition-colors cursor-pointer"
            >
              {copy.cancelBtn}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleActivatePro}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#FBB063] hover:brightness-105 text-[#141B23] font-black text-xs sm:text-sm shadow-xl transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>
              {appliedPromo
                ? `£${effectivePrice.toFixed(2)}/${locale === "pl" ? "mies." : locale === "ro" ? "lună" : "mo"} — ${t("subscribeBtn")}`
                : t("subscribeBtn")}
            </span>
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#94A3B8]/80 mt-4">
          <Lock className="w-3 h-3 text-[#52B798] shrink-0" />
          <span>{copy.securityNote}</span>
        </div>
      </div>
    </div>
  );
};
