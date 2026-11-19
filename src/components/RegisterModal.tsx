import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { X, UserPlus, Mail, Lock, User, AlertCircle } from "lucide-react";

export const RegisterModal: React.FC = () => {
  const {
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    setIsTermsPrivacyModalOpen,
    user,
    updateUser,
    locale,
    showToast,
  } = useApp();

  const [fullName, setFullName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(Boolean(user.acceptedTermsAt));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isRegisterModalOpen) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPassword("");
      setAcceptedTerms(Boolean(user.acceptedTermsAt));
      setErrorMsg(null);
    }
  }, [isRegisterModalOpen, user.fullName, user.email, user.acceptedTermsAt]);

  if (!isRegisterModalOpen) return null;

  const copy = {
    title:
      locale === "pl"
        ? "Rejestracja konta Ask Elon"
        : locale === "ro"
        ? "Înregistrare cont Ask Elon"
        : "Create Ask Elon Account",
    subtitle:
      locale === "pl"
        ? "Utwórz konto członkowskie (£9.99/mies., bez planu darmowego)"
        : locale === "ro"
        ? "Creează cont de membru (£9.99/lună, fără plan gratuit)"
        : "Create your membership account (£9.99/month, no free plan)",
    nameLabel:
      locale === "pl"
        ? "Imię i nazwisko"
        : locale === "ro"
        ? "Nume și prenume"
        : "Full Name",
    emailLabel: "Email",
    passwordLabel:
      locale === "pl"
        ? "Hasło (min. 8 znaków)"
        : locale === "ro"
        ? "Parolă (min. 8 caractere)"
        : "Password (min. 8 characters)",
    acceptLabel:
      locale === "pl"
        ? "Akceptuję Regulamin i Politykę Prywatności"
        : locale === "ro"
        ? "Accept Termenii și Politica de Confidențialitate"
        : "I accept the Terms and Privacy Notice",
    readTermsLink:
      locale === "pl"
        ? "Czytaj Regulamin i Politykę Prywatności"
        : locale === "ro"
        ? "Citește Termenii și Confidențialitatea"
        : "Read Terms & Privacy Notice",
    submitBtn:
      locale === "pl"
        ? "Zarejestruj konto"
        : locale === "ro"
        ? "Înregistrează contul"
        : "Register Account",
    errorRequiredTerms:
      locale === "pl"
        ? "Musisz zaakceptować Regulamin i Politykę Prywatności."
        : locale === "ro"
        ? "Trebuie să accepți Termenii și Politica de Confidențialitate."
        : "You must accept the Terms and Privacy Notice to continue.",
    errorFields:
      locale === "pl"
        ? "Podaj imię i nazwisko, poprawny adres e-mail oraz hasło (min. 8 znaków)."
        : locale === "ro"
        ? "Completează numele, adresa de email și o parolă de cel puțin 8 caractere."
        : "Please enter your full name, a valid email address, and a password (8+ characters).",
    successToast:
      locale === "pl"
        ? "Konto zostało zapisane i połączone z profilem."
        : locale === "ro"
        ? "Contul a fost salvat și sincronizat cu profilul."
        : "Account registered and synced to your profile.",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !email.includes("@") || password.trim().length < 8) {
      setErrorMsg(copy.errorFields);
      return;
    }

    if (!acceptedTerms) {
      setErrorMsg(copy.errorRequiredTerms);
      return;
    }

    updateUser({
      fullName: fullName.trim(),
      email: email.trim(),
      onboarded: true,
      acceptedTermsAt: new Date().toISOString(),
    });
    setIsRegisterModalOpen(false);
    showToast(copy.successToast);
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
      onClick={() => setIsRegisterModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0F766E]/15 dark:bg-[#2DD4BF]/15 border border-[#0D9488]/30 dark:border-[#2DD4BF]/30 flex items-center justify-center text-[#0F766E] dark:text-[#2DD4BF] shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="register-modal-title"
                className="text-base font-extrabold text-[#1E293B] dark:text-[#F1F5F9]"
              >
                {copy.title}
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                {copy.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(false)}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#141B23] hover:bg-slate-200 dark:hover:bg-[#2C3847] text-[#64748B] dark:text-[#94A3B8] flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-1">
              {copy.nameLabel}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jan Kowalski"
                className="w-full rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] focus:border-[#0D9488] dark:focus:border-[#2DD4BF] pl-9 pr-3 py-2.5 text-xs text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-1">
              {copy.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] focus:border-[#0D9488] dark:focus:border-[#2DD4BF] pl-9 pr-3 py-2.5 text-xs text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-1">
              {copy.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] focus:border-[#0D9488] dark:focus:border-[#2DD4BF] pl-9 pr-3 py-2.5 text-xs text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none"
              />
            </div>
          </div>

          {/* Required Terms & Privacy Checkbox */}
          <div className="rounded-xl p-3 bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (errorMsg) setErrorMsg(null);
                }}
                required
                className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] dark:border-[#2C3847] accent-[#0F766E] dark:accent-[#2DD4BF] cursor-pointer shrink-0"
              />
              <span className="text-xs font-semibold text-[#1E293B] dark:text-[#F1F5F9] leading-snug">
                {copy.acceptLabel}
              </span>
            </label>

            <button
              type="button"
              onClick={() => setIsTermsPrivacyModalOpen(true)}
              className="ml-6 text-[11px] font-bold text-[#0F766E] dark:text-[#2DD4BF] underline hover:opacity-80 cursor-pointer text-left"
            >
              {copy.readTermsLink} →
            </button>
          </div>

          {errorMsg && (
            <p className="text-[11px] font-semibold text-[#EF4444] flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] dark:bg-[#2DD4BF] text-white dark:text-[#141B23] text-xs font-extrabold transition-colors shadow-md cursor-pointer"
          >
            {copy.submitBtn}
          </button>
        </form>
      </div>
    </div>
  );
};
