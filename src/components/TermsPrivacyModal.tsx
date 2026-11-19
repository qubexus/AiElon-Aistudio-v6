import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Locale } from "../types";
import { HandshakeOvalSvg } from "./LegalLetterFooter";
import { X, ShieldCheck, Globe } from "lucide-react";

interface TermsSection {
  num: number;
  title: string;
  body: string[];
}

interface TermsContentPack {
  modalTitle: string;
  modalSubtitle: string;
  lastUpdated: string;
  placeholderNotice: string;
  sections: TermsSection[];
  footerNote: string;
  closeBtn: string;
}

const TERMS_CONTENT: Record<Locale, TermsContentPack> = {
  en: {
    modalTitle: "Terms of Use & Privacy Notice",
    modalSubtitle: "Ask Elon (askelon.uk) · Main English Version",
    lastUpdated: "Version 7 · Effective date: [DATE TO BE CONFIRMED]",
    placeholderNotice:
      "Draft documentation notice: Company name, registered address, contact email and data protection email below remain marked placeholders until confirmed by legal counsel.",
    footerNote: "Prepared for Ask Elon · askelon.uk · UK Consumer & UK GDPR Notice",
    closeBtn: "Close",
    sections: [
      {
        num: 1,
        title: "1. Who we are",
        body: [
          "Ask Elon ('the App', 'we', 'us') is operated by [COMPANY NAME], registered at [REGISTERED ADDRESS].",
          "General contact email: [CONTACT EMAIL]. Data protection enquiries: [DATA PROTECTION EMAIL].",
        ],
      },
      {
        num: 2,
        title: "2. What Ask Elon is and is not",
        body: [
          "Elon is an AI assistant, not a lawyer, solicitor, barrister, or regulated trade union representative. Output from Ask Elon is general workplace information and drafting support only. This is not legal advice and does not create a solicitor-client relationship.",
          "For formal legal advice or representation before an Employment Tribunal, consult an authorised solicitor, ACAS (acas.org.uk), Citizens Advice, or your trade union.",
        ],
      },
      {
        num: 3,
        title: "3. Who can use the App",
        body: [
          "You may use the App if you are at least 18 years old and legally capable of entering into a binding contract in the United Kingdom.",
          "Ask Elon focuses on employment rights and workplace documentation under the law of England, Wales, and Scotland.",
        ],
      },
      {
        num: 4,
        title: "4. Your account",
        body: [
          "You must provide accurate registration details and keep your password confidential. You are responsible for all activity carried out through your account.",
          "Before leaving a shared device, use the 'Log out & clear device data' button so local cases, chat history, and personal details are removed from browser storage.",
        ],
      },
      {
        num: 5,
        title: "5. Membership, price and payment",
        body: [
          "Ask Elon is offered on a single membership plan costing £9.99 per month. All features of the App — unlimited AI guidance, payslip checks, case tracking, and UK letter templates/exports — are included in this membership. There is no free plan.",
          "Payment is collected monthly in advance via our payment processor before access is granted, unless an authorised promotional or access voucher applies.",
        ],
      },
      {
        num: 6,
        title: "6. Cancellation and refunds",
        body: [
          "You may cancel your monthly membership at any time to stop future renewals. Your access continues until the end of the current paid monthly period unless you request immediate cancellation during the cooling-off period.",
          "UK consumers have a statutory 14-day right to cancel starting the day after subscribing (Consumer Contracts Regulations 2013). If you request immediate access and cancel within 14 days, you will receive a refund minus a proportionate amount for the time during which membership access was provided.",
        ],
      },
      {
        num: 7,
        title: "7. Using the App fairly",
        body: [
          "You agree to use Ask Elon only for lawful personal workplace matters and not to automate scraping, reverse-engineer the platform, upload malware, or submit fraudulent claims.",
          "We apply reasonable fair-use safeguards to protect service stability for all members.",
        ],
      },
      {
        num: 8,
        title: "8. Your content and AI output",
        body: [
          "You retain ownership of notes, uploaded payslips, contracts, and case descriptions you submit. You are responsible for verifying dates, figures, statutory references, and recipient details in any letter generated before sending it to an employer or third party.",
          "Because AI systems can make mistakes, never rely solely on automated output where strict statutory deadlines (such as the 3 months minus 1 day ACAS Early Conciliation time limit) apply.",
        ],
      },
      {
        num: 9,
        title: "9. Availability and changes",
        body: [
          "We aim to keep Ask Elon available reliably, though temporary downtime may occur for maintenance, security updates, or external network outages.",
          "We may add, update, or withdraw non-core tools to maintain legal accuracy and platform security.",
        ],
      },
      {
        num: 10,
        title: "10. Our responsibility",
        body: [
          "Nothing in these Terms limits our liability for death or personal injury caused by negligence, fraud, or any liability that cannot legally be excluded under UK law.",
          "Subject to that, we provide informational AI tools on an 'as is' basis and are not liable for workplace outcomes, missed tribunal deadlines, or indirect losses arising from decisions made without qualified legal representation.",
        ],
      },
      {
        num: 11,
        title: "11. Ending the contract",
        body: [
          "You may end your contract at any time by cancelling your membership and closing your account. We may suspend or end access immediately if there is a serious breach of these Terms or non-payment.",
        ],
      },
      {
        num: 12,
        title: "12. Privacy notice (UK GDPR and Data Protection Act 2018)",
        body: [
          "Data controller: [COMPANY NAME], [REGISTERED ADDRESS]. Data protection contact: [DATA PROTECTION EMAIL].",
          "We process account details, employment profile inputs, case notes, and uploaded workplace documents to deliver the App (contract performance & legitimate interests). Where you upload sensitive personal data (such as health details in fit notes or trade union membership), we process it only with your explicit consent.",
          "Under the UK GDPR and the Data Protection Act 2018, you have the right of access, right to rectification, right to erasure ('right to be forgotten'), right to restriction of processing, right to object, right to data portability, and the right to withdraw consent at any time.",
          "You also have the right to lodge a complaint with the UK supervisory authority, the Information Commissioner's Office (ICO), at ico.org.uk.",
        ],
      },
      {
        num: 13,
        title: "13. Changes to these Terms",
        body: [
          "We may update these Terms & Privacy Notice to reflect legal, technical, or pricing changes. We will give reasonable advance notice inside the App or by email before material changes take effect.",
        ],
      },
      {
        num: 14,
        title: "14. Complaints, law and courts",
        body: [
          "If you have a complaint about the App, please write to [CONTACT EMAIL] so we can investigate and respond promptly.",
          "These Terms are governed by the laws of England and Wales (or, if you live in Scotland or Northern Ireland, your mandatory local consumer protections also apply), and disputes are subject to the jurisdiction of the competent UK courts.",
        ],
      },
    ],
  },
  pl: {
    modalTitle: "Regulamin i Polityka Prywatności",
    modalSubtitle: "Ask Elon (askelon.uk) · Wersja polska (dokument główny: EN)",
    lastUpdated: "Wersja 7 · Data wejścia w życie: [DATA DO POTWIERDZENIA]",
    placeholderNotice:
      "Uwaga do szkicu: nazwa firmy, adres rejestrowy, adres kontaktowy oraz adres ds. ochrony danych pozostają wyraźnie oznaczonymi polami zastępczymi do czasu potwierdzenia.",
    footerNote: "Przygotowano dla Ask Elon · askelon.uk · Konsument UK & UK GDPR",
    closeBtn: "Zamknij",
    sections: [
      {
        num: 1,
        title: "1. Kim jesteśmy",
        body: [
          "Aplikację Ask Elon („Aplikacja”) prowadzi [COMPANY NAME] z siedzibą pod adresem [REGISTERED ADDRESS].",
          "Kontakt ogólny: [CONTACT EMAIL]. Sprawy ochrony danych: [DATA PROTECTION EMAIL].",
        ],
      },
      {
        num: 2,
        title: "2. Czym Ask Elon jest, a czym nie jest",
        body: [
          "Elon jest asystentem AI, a nie prawnikiem, adwokatem (solicitor/barrister) ani licencjonowanym doradcą związkowym. Odpowiedzi i szkice mają wyłącznie charakter informacyjny — to nie jest porada prawna.",
          "W sprawach spornych lub przed Sądem Pracy (Employment Tribunal) skonsultuj się z prawnikiem, ACAS (acas.org.uk), Citizens Advice lub związkiem zawodowym.",
        ],
      },
      {
        num: 3,
        title: "3. Kto może korzystać z Aplikacji",
        body: [
          "Z Aplikacji mogą korzystać osoby pełnoletnie (co najmniej 18 lat), posiadające zdolność do zawarcia wiążącej umowy w Wielkiej Brytanii.",
          "Treści koncentrują się na prawach pracowniczych obowiązujących w Anglii, Walii i Szkocji.",
        ],
      },
      {
        num: 4,
        title: "4. Twoje konto",
        body: [
          "Użytkownik zobowiązuje się podawać prawdziwe dane rejestracyjne i chronić swoje hasło przed osobami trzecimi.",
          "Korzystając z urządzenia współdzielonego, przed odejściem użyj funkcji „Wyloguj i wyczyść dane z urządzenia”, aby usunąć lokalnie zapisane sprawy, czaty i profil.",
        ],
      },
      {
        num: 5,
        title: "5. Członkostwo, cena i płatność",
        body: [
          "Ask Elon działa w jednym modelu członkostwa w cenie £9.99 miesięcznie. Wszystkie funkcje Aplikacji są wliczone w cenę — nie ma planu darmowego.",
          "Opłata pobierana jest co miesiąc z góry za pośrednictwem operatora płatności przed przyznaniem dostępu (o ile nie zastosowano ważnego kodu dostępu).",
        ],
      },
      {
        num: 6,
        title: "6. Anulowanie i zwroty",
        body: [
          "Członkostwo możesz anulować w dowolnym momencie, aby zatrzymać kolejne odnowienia.",
          "Konsumentom w UK przysługuje ustawowe 14-dniowe prawo do odstąpienia od umowy (Consumer Contracts Regulations 2013). Rezygnacja w ciągu 14 dni skutkuje zwrotem pomniejszonym o proporcjonalną kwotę za czas korzystania z dostępu.",
        ],
      },
      {
        num: 7,
        title: "7. Uczciwe korzystanie z Aplikacji",
        body: [
          "Aplikacja służy wyłącznie do legalnych spraw pracowniczych. Zabrania się automatycznego pobierania treści (scraping), prób obejścia zabezpieczeń oraz nadużyć technicznych.",
        ],
      },
      {
        num: 8,
        title: "8. Twoje treści i odpowiedzi AI",
        body: [
          "Zachowujesz prawa do własnych notatek, payslipów i opisów spraw. Przed wysłaniem jakiegokolwiek pisma do pracodawcy sprawdź daty, kwoty, adresata i podstawę prawną.",
          "Asystent AI może popełniać błędy; w sprawach z krótkimi terminami ustawowymi (np. 3 miesiące minus 1 dzień w ACAS) zawsze weryfikuj terminy.",
        ],
      },
      {
        num: 9,
        title: "9. Dostępność i zmiany",
        body: [
          "Dokładamy starań, by Aplikacja działała stabilnie, ale mogą wystąpić przerwy techniczne na konserwację lub aktualizacje.",
        ],
      },
      {
        num: 10,
        title: "10. Nasza odpowiedzialność",
        body: [
          "Nic w Regulaminie nie wyłącza odpowiedzialności, której nie można ograniczyć na mocy prawa Wielkiej Brytanii. Narzędzie informacyjne AI nie zastępuje profesjonalnego pełnomocnika.",
        ],
      },
      {
        num: 11,
        title: "11. Zakończenie umowy",
        body: [
          "Możesz zakończyć umowę w każdej chwili poprzez anulowanie członkostwa i usunięcie konta. Możemy zawiesić dostęp w przypadku rażącego naruszenia Regulaminu lub braku płatności.",
        ],
      },
      {
        num: 12,
        title: "12. Informacja o prywatności (UK GDPR i Data Protection Act 2018)",
        body: [
          "Administratorem danych jest [COMPANY NAME], [REGISTERED ADDRESS]. Kontakt ws. ochrony danych: [DATA PROTECTION EMAIL].",
          "Przetwarzamy dane w celu świadczenia usługi. Dane wrażliwe (np. dokumenty medyczne Fit Note lub przynależność związkowa) przetwarzamy wyłącznie na podstawie Twojej wyraźnej zgody.",
          "Na mocy UK GDPR oraz Data Protection Act 2018 przysługują Ci prawa: dostępu do danych, sprostowania, usunięcia, ograniczenia przetwarzania, sprzeciwu, przenoszenia danych oraz wycofania zgody w dowolnym momencie.",
          "Masz również prawo złożyć skargę do brytyjskiego organu nadzorczego — Information Commissioner's Office (ICO) na stronie ico.org.uk.",
        ],
      },
      {
        num: 13,
        title: "13. Zmiany Regulaminu",
        body: [
          "Możemy aktualizować niniejszy dokument z ważnych przyczyn prawnych lub technicznych, informując wcześniej użytkowników w Aplikacji lub mailowo.",
        ],
      },
      {
        num: 14,
        title: "14. Reklamacje, prawo właściwe i sądy",
        body: [
          "Reklamacje i pytania prosimy kierować na adres [CONTACT EMAIL].",
          "Regulamin podlega prawu Anglii i Walii (z zachowaniem bezwzględnych praw konsumenta właściwych dla miejsca zamieszkania w Szkocji lub Irlandii Północnej), a spory rozstrzygają właściwe sądy w Wielkiej Brytanii.",
        ],
      },
    ],
  },
  ro: {
    modalTitle: "Termeni de utilizare și Politica de confidențialitate",
    modalSubtitle: "Ask Elon (askelon.uk) · Versiune română (document principal: EN)",
    lastUpdated: "Versiunea 7 · Data intrării în vigoare: [DATA DE CONFIRMAT]",
    placeholderNotice:
      "Notă proiect: denumirea companiei, adresa înregistrată, adresa de contact și adresa de protecție a datelor rămân marcate ca substituenți până la confirmare.",
    footerNote: "Pregătit pentru Ask Elon · askelon.uk · UK Consumer & UK GDPR",
    closeBtn: "Închide",
    sections: [
      {
        num: 1,
        title: "1. Cine suntem",
        body: [
          "Aplicația Ask Elon („Aplicația”) este operată de [COMPANY NAME], cu sediul la [REGISTERED ADDRESS].",
          "Email de contact general: [CONTACT EMAIL]. Întrebări privind protecția datelor: [DATA PROTECTION EMAIL].",
        ],
      },
      {
        num: 2,
        title: "2. Ce este și ce nu este Ask Elon",
        body: [
          "Elon este un asistent AI, nu un avocat (solicitor/barrister) sau reprezentant sindical autorizat. Informațiile și schițele oferite nu constituie consultanță juridică.",
          "Pentru consiliere juridică oficială sau reprezentare la Tribunalul Muncii, contactați un avocat autorizat, ACAS (acas.org.uk), Citizens Advice sau sindicatul dumneavoastră.",
        ],
      },
      {
        num: 3,
        title: "3. Cine poate utiliza Aplicația",
        body: [
          "Aplicația poate fi utilizată de persoane cu vârsta de cel puțin 18 ani care pot încheia un contract valid în Regatul Unit.",
          "Conținutul acoperă drepturile de muncă aplicabile în Anglia, Țara Galilor și Scoția.",
        ],
      },
      {
        num: 4,
        title: "4. Contul dumneavoastră",
        body: [
          "Trebuie să furnizați date exacte la înregistrare și să păstrați parola confidențială.",
          "Pe dispozitive partajate, utilizați opțiunea „Deconectare și ștergere date dispozitiv” înainte de a părăsi sesiunea.",
        ],
      },
      {
        num: 5,
        title: "5. Abonament, preț și plată",
        body: [
          "Ask Elon este disponibil printr-un singur abonament lunar la prețul de £9.99 pe lună. Toate funcțiile sunt incluse; nu există plan gratuit.",
          "Plata se efectuează lunar în avans prin procesatorul de plăți înainte de activarea accesului.",
        ],
      },
      {
        num: 6,
        title: "6. Anulare și rambursări",
        body: [
          "Puteți anula abonamentul în orice moment pentru a opri reînnoirile viitoare.",
          "Consumatorii din UK beneficiază de dreptul legal de anulare în 14 zile (Consumer Contracts Regulations 2013). Anularea în termen de 14 zile se rambursează minus o sumă proporțională pentru perioada în care ați avut acces.",
        ],
      },
      {
        num: 7,
        title: "7. Utilizarea corectă a Aplicației",
        body: [
          "Sunteți de acord să folosiți Aplicația doar pentru scopuri legale personale legate de locul de muncă și fără automatizări abuzive sau inginerie inversă.",
        ],
      },
      {
        num: 8,
        title: "8. Conținutul dumneavoastră și răspunsurile AI",
        body: [
          "Păstrați drepturile asupra documentelor și notițelor încărcate. Verificați întotdeauna datele, sumele și temeiurile legale înainte de a trimite orice scrisoare.",
        ],
      },
      {
        num: 9,
        title: "9. Disponibilitate și modificări",
        body: [
          "Depunem eforturi pentru funcționarea continuă, dar pot apărea întreruperi temporare pentru mentenanță și actualizări de securitate.",
        ],
      },
      {
        num: 10,
        title: "10. Responsabilitatea noastră",
        body: [
          "Nimic din acești Termeni nu limitează răspunderea care nu poate fi exclusă conform legii din UK. Asistentul AI are rol informativ.",
        ],
      },
      {
        num: 11,
        title: "11. Încetarea contractului",
        body: [
          "Puteți înceta contractul oricând prin anularea abonamentului și închiderea contului. Putem suspenda accesul în caz de încălcare gravă sau neplată.",
        ],
      },
      {
        num: 12,
        title: "12. Notă de confidențialitate (UK GDPR și Data Protection Act 2018)",
        body: [
          "Operator de date: [COMPANY NAME], [REGISTERED ADDRESS]. Contact protecția datelor: [DATA PROTECTION EMAIL].",
          "Datele sensibile (cum ar fi concediile medicale sau apartenența sindicală) sunt prelucrate doar pe baza consimțământului dumneavoastră explicit.",
          "Conform UK GDPR și Data Protection Act 2018, aveți dreptul de acces, rectificare, ștergere, restricționare, opoziție, portabilitate a datelor și retragere a consimțământului în orice moment.",
          "Aveți, de asemenea, dreptul de a depune o plângere la autoritatea de supraveghere din UK — Information Commissioner's Office (ICO), pe ico.org.uk.",
        ],
      },
      {
        num: 13,
        title: "13. Modificări ale acestor Termeni",
        body: [
          "Putem actualiza acești Termeni și Politica de confidențialitate cu notificare prealabilă rezonabilă în Aplicație sau prin email.",
        ],
      },
      {
        num: 14,
        title: "14. Reclamații, lege aplicabilă și instanțe",
        body: [
          "Reclamațiile pot fi transmise la [CONTACT EMAIL].",
          "Acești Termeni sunt guvernați de legislația Angliei și Țării Galilor (cu respectarea drepturilor obligatorii ale consumatorilor din Scoția sau Irlanda de Nord), iar litigiile revin instanțelor competente din UK.",
        ],
      },
    ],
  },
};

function renderWithTurquoiseLinks(text: string): React.ReactNode {
  const parts = text.split(/(https?:\/\/[^\s)]+|ico\.org\.uk|acas\.org\.uk|askelon\.uk|\[COMPANY NAME\]|\[REGISTERED ADDRESS\]|\[CONTACT EMAIL\]|\[DATA PROTECTION EMAIL\])/g);
  return parts.map((part, idx) => {
    if (part === "ico.org.uk" || part === "acas.org.uk" || part === "askelon.uk" || part.startsWith("http")) {
      const href = part.startsWith("http") ? part : `https://${part}`;
      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0F766E] dark:text-[#2DD4BF] underline font-semibold hover:opacity-80 transition-opacity"
        >
          {part}
        </a>
      );
    }
    if (
      part === "[COMPANY NAME]" ||
      part === "[REGISTERED ADDRESS]" ||
      part === "[CONTACT EMAIL]" ||
      part === "[DATA PROTECTION EMAIL]"
    ) {
      return (
        <span
          key={idx}
          className="inline-block px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 font-mono text-[11px] font-bold text-[#9A4D06] dark:text-[#FBB063]"
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const TermsPrivacyModal: React.FC = () => {
  const { isTermsPrivacyModalOpen, setIsTermsPrivacyModalOpen, locale } = useApp();
  const [docLocale, setDocLocale] = useState<Locale>(locale === "pl" || locale === "ro" ? locale : "en");

  useEffect(() => {
    if (isTermsPrivacyModalOpen) {
      setDocLocale(locale === "pl" || locale === "ro" ? locale : "en");
    }
  }, [isTermsPrivacyModalOpen, locale]);

  if (!isTermsPrivacyModalOpen) return null;

  const pack = TERMS_CONTENT[docLocale] || TERMS_CONTENT.en;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-privacy-modal-title"
      onClick={() => setIsTermsPrivacyModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl max-h-[92dvh] bg-white dark:bg-[#1E2732] border border-[#E2E8F0] dark:border-[#2C3847] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with small 32px Handshake Graphic */}
        <div className="shrink-0 px-4 py-3.5 bg-[#F8FAFC] dark:bg-[#141B23] border-b border-[#E2E8F0] dark:border-[#2C3847] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <HandshakeOvalSvg variant="auto" className="w-[32px] h-[22px] shrink-0" />
            <div className="min-w-0">
              <h2
                id="terms-privacy-modal-title"
                className="text-sm sm:text-base font-extrabold text-[#1E293B] dark:text-[#F1F5F9] leading-tight"
              >
                {pack.modalTitle}
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate">
                {pack.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsTermsPrivacyModalOpen(false)}
            aria-label={pack.closeBtn}
            className="w-8 h-8 rounded-lg bg-slate-200/70 dark:bg-[#1E2732] hover:bg-slate-300 dark:hover:bg-[#2C3847] text-[#1E293B] dark:text-[#F1F5F9] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-bar: Version & Document Language Switcher */}
        <div className="shrink-0 px-4 py-2 bg-[#F8FAFC]/80 dark:bg-[#141B23]/80 border-b border-[#E2E8F0] dark:border-[#2C3847] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E] dark:text-[#2DD4BF] shrink-0" />
            <span>{pack.lastUpdated}</span>
          </div>

          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] mr-1" />
            {(["en", "pl", "ro"] as Locale[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setDocLocale(code)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  docLocale === code
                    ? "bg-[#0F766E] text-white dark:bg-[#2DD4BF] dark:text-[#141B23]"
                    : "bg-slate-200/70 dark:bg-[#1E2732] text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable 14 Numbered Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
          <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/30 text-[11.5px] text-[#9A4D06] dark:text-[#FBB063] leading-relaxed">
            {pack.placeholderNotice}
          </div>

          {pack.sections.map((section) => (
            <section
              key={section.num}
              className="rounded-xl p-3.5 bg-[#F8FAFC] dark:bg-[#141B23] border border-[#E2E8F0] dark:border-[#2C3847] space-y-1.5"
            >
              <h3 className="text-xs sm:text-sm font-extrabold text-[#1E293B] dark:text-[#F1F5F9]">
                {section.title}
              </h3>
              <div className="space-y-1.5 text-xs text-[#334155] dark:text-[#CBD5E1] leading-relaxed">
                {section.body.map((paragraph, pIdx) => (
                  <p key={pIdx}>{renderWithTurquoiseLinks(paragraph)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer with small 32px Handshake Graphic */}
        <div className="shrink-0 px-4 py-3 bg-[#F8FAFC] dark:bg-[#141B23] border-t border-[#E2E8F0] dark:border-[#2C3847] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <HandshakeOvalSvg variant="auto" className="w-[32px] h-[22px] shrink-0" />
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-snug">
              {pack.footerNote} ·{" "}
              <a
                href="https://ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0F766E] dark:text-[#2DD4BF] underline font-semibold"
              >
                ico.org.uk
              </a>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTermsPrivacyModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D9488] dark:bg-[#2DD4BF] text-white dark:text-[#141B23] text-xs font-extrabold transition-colors shrink-0 cursor-pointer"
          >
            {pack.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
