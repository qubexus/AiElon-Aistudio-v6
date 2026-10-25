import React from "react";
import { useApp } from "../context/AppContext";
import { X, ShieldCheck, Check, CreditCard, Lock } from "lucide-react";

export const PaywallModal: React.FC = () => {
  const {
    isPaywallModalOpen,
    setIsPaywallModalOpen,
    updateUser,
    user,
    t,
    showToast
  } = useApp();

  if (!isPaywallModalOpen) return null;

  const handleActivatePro = () => {
    updateUser({ isPro: true });
    setIsPaywallModalOpen(false);
    showToast("Subskrypcja ask Elon PRO została pomyślnie aktywowana!");
  };

  const handleCancelPro = () => {
    updateUser({ isPro: false });
    setIsPaywallModalOpen(false);
    showToast("Subskrypcja ask Elon PRO została anulowana.");
  };

  const features = [
    t("proFeature1"),
    t("proFeature2"),
    t("proFeature3"),
    t("proFeature4")
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
            {t("proTitle")}
          </h2>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono tabular-nums text-[#FF6A00]">{t("proPrice")}</span>
          </div>
          <p className="text-xs text-[#BACADA] mt-1">
            Możesz anulować w dowolnym momencie. Bez ukrytych opłat.
          </p>
        </div>

        {/* Video Showcase */}
        <div className="mb-4 rounded-2xl overflow-hidden border border-white/15 bg-[#070F1A] shadow-lg">
          <video
            src="/assets/aistudio/grok_video_2026-10-24-04-59-56_1fc97f08.mp4"
            controls
            playsInline
            muted
            autoPlay
            loop
            className="w-full max-h-56 object-cover bg-black"
          />
        </div>

        {/* Features Checklist */}
        <div className="space-y-2.5 mb-5 bg-[#12304F]/60 p-4 rounded-2xl border border-white/5">
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

        {/* Action Button */}
        {user.isPro ? (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 text-center text-xs font-bold text-[#10B981]">
              Twój plan PRO jest aktywny.
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
            <span>{t("subscribeBtn")}</span>
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

