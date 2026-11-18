import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { BookOpen, Search, X, MessageSquare, Scale } from "lucide-react";

type DictCategory =
  | "ALL"
  | "wages"
  | "dismissal"
  | "grievance"
  | "sick_pay"
  | "contract"
  | "data";

interface LegalTermEntry {
  id: string;
  termEn: string;
  termPl: string;
  termRo: string;
  category: Exclude<DictCategory, "ALL">;
  statute: string;
  definitionEn: string;
  definitionPl: string;
  definitionRo: string;
  tipEn: string;
  tipPl: string;
  tipRo: string;
}

const LEGAL_TERMS: LegalTermEntry[] = [
  {
    id: "unlawful_deduction",
    termEn: "Unlawful Deduction from Wages",
    termPl: "Bezprawne potrącenie z wynagrodzenia",
    termRo: "Reținere ilegală din salariu",
    category: "wages",
    statute: "Section 13 Employment Rights Act 1996",
    definitionEn:
      "Any shortfall in wages, unpaid overtime, withheld holiday pay, or unauthorized fine deducted without statutory authority or prior written consent.",
    definitionPl:
      "Każde zaniżenie wypłaty, nieopłacone nadgodziny, niewypłacony urlop lub kara potrącona bez podstawy ustawowej albo wcześniejszej pisemnej zgody pracownika.",
    definitionRo:
      "Orice reducere a salariului, ore suplimentare neplătite, concediu neachitat sau amendă reținută fără acord scris prealabil.",
    tipEn: "Time limit: 3 months less 1 day from the deduction date via ACAS Early Conciliation.",
    tipPl: "Termin: 3 miesiące minus 1 dzień od daty potrącenia przez ACAS Early Conciliation.",
    tipRo: "Termen: 3 luni minus 1 zi de la data reținerii prin ACAS Early Conciliation.",
  },
  {
    id: "acas_ec",
    termEn: "ACAS Early Conciliation",
    termPl: "Obowiązkowa koncyliacja ACAS (Przed Sądem Pracy)",
    termRo: "Conciliere timpurie ACAS",
    category: "grievance",
    statute: "Employment Tribunals Act 1996 (s.18A)",
    definitionEn:
      "Mandatory free dispute-resolution step before bringing an Employment Tribunal claim. Stops the statutory clock while an ACAS conciliator speaks with both sides.",
    definitionPl:
      "Obowiązkowy, bezpłatny etap mediacji przed wniesieniem pozwu do Employment Tribunal. Zatrzymuje bieg ustawowego terminu na czas rozmów prowadzonych przez mediatora ACAS.",
    definitionRo:
      "Etapă gratuită obligatorie înaintea tribunalului muncii. Oprește temporar termenul legal pe durata concilierii.",
    tipEn: "Request an ACAS certificate promptly; never let the 3-month clock expire waiting for HR.",
    tipPl: "Złóż wniosek do ACAS odpowiednio wcześnie — nie czekaj w nieskończoność na odpowiedź HR.",
    tipRo: "Solicită certificatul ACAS la timp; nu lăsa termenul de 3 luni să expire.",
  },
  {
    id: "formal_grievance",
    termEn: "Formal Grievance",
    termPl: "Oficjalna skarga pracownicza (Grievance)",
    termRo: "Plângere formală (Grievance)",
    category: "grievance",
    statute: "ACAS Code of Practice No. 1",
    definitionEn:
      "Written formal complaint raised to your employer regarding pay, treatment, bullying, health & safety, or working conditions. Triggers a mandatory investigation meeting.",
    definitionPl:
      "Pisemna, formalna skarga składana do pracodawcy w sprawie płacy, mobbingu, BHP lub warunków pracy. Zobowiązuje pracodawcę do zwołania spotkania i pisemnej odpowiedzi.",
    definitionRo:
      "Plângere scrisă adresată angajatorului privind salariul, hărțuirea, securitatea muncii sau condițiile de lucru.",
    tipEn: "Failure by an employer to follow the ACAS Code can increase Tribunal compensation by up to 25%.",
    tipPl: "Zignorowanie procedury ACAS przez pracodawcę może podwyższyć zasądzone odszkodowanie nawet o 25%.",
    tipRo: "Nerespectarea Codului ACAS de către angajator poate crește despăgubirea cu până la 25%.",
  },
  {
    id: "unfair_dismissal",
    termEn: "Unfair Dismissal",
    termPl: "Niesprawiedliwe zwolnienie z pracy",
    termRo: "Concediere abuzivă / nedreaptă",
    category: "dismissal",
    statute: "Sections 94 & 98 ERA 1996",
    definitionEn:
      "Dismissal without a fair statutory reason (capability, conduct, redundancy, SOSR) or without following a fair disciplinary or redundancy procedure.",
    definitionPl:
      "Zwolnienie bez ważnego powodu ustawowego (umiejętności, zachowanie, redukcja) lub bez przeprowadzenia rzetelnej procedury dyscyplinarnej i prawa do odwołania.",
    definitionRo:
      "Concediere fără motiv legal temeinic sau fără respectarea unei proceduri disciplinare corecte.",
    tipEn: "Normally requires 2 years' service, EXCEPT automatically unfair reasons (pregnancy, safety, wage rights) which apply from Day 1.",
    tipPl: "Zwykle wymaga 2 lat stażu, ale zwolnienie za dochodzenie płac, ciążę lub BHP jest bezprawne od 1. dnia pracy.",
    tipRo: "De regulă necesită 2 ani vechime, exceptând motivele automat ilegale (sarcină, salarii, siguranță) din Ziua 1.",
  },
  {
    id: "constructive_dismissal",
    termEn: "Constructive Dismissal",
    termPl: "Wymuszone odejście (Konstruktywne zwolnienie)",
    termRo: "Concediere constructivă",
    category: "dismissal",
    statute: "Section 95(1)(c) ERA 1996",
    definitionEn:
      "When an employee resigns in direct response to a fundamental breach of contract by the employer (e.g., repeated non-payment of wages or unchecked harassment).",
    definitionPl:
      "Sytuacja, w której pracownik odchodzi z pracy z powodu rażącego naruszenia umowy przez pracodawcę (np. chronicznego braku wypłat lub tolerowania mobbingu).",
    definitionRo:
      "Demisia angajatului ca răspuns direct la o încălcare gravă a contractului de către angajator.",
    tipEn: "Always seek advice and file a grievance before resigning; state the breach clearly in writing.",
    tipPl: "Zanim złożysz wypowiedzenie, złóż pisemną skargę (grievance) i opisz dokładnie naruszenie umowy.",
    tipRo: "Depune o plângere scrisă înainte de demisie și menționează clar încălcarea contractuală.",
  },
  {
    id: "statutory_notice",
    termEn: "Statutory Notice Period",
    termPl: "Ustawowy okres wypowiedzenia",
    termRo: "Perioadă legală de preaviz",
    category: "dismissal",
    statute: "Section 86 Employment Rights Act 1996",
    definitionEn:
      "Minimum legal notice an employer must give: 1 week after 1 month of employment, rising by 1 week per full year up to 12 weeks.",
    definitionPl:
      "Minimalny ustawowy okres wypowiedzenia dawany przez pracodawcę: 1 tydzień po przepracowaniu miesiąca, a następnie +1 tydzień za każdy pełny rok pracy (do 12 tygodni).",
    definitionRo:
      "Preaviz minim legal din partea angajatorului: 1 săptămână după 1 lună, +1 săptămână per an complet (maxim 12).",
    tipEn: "If your contract specifies a longer notice period, the longer period applies.",
    tipPl: "Jeśli umowa przewiduje dłuższy okres wypowiedzenia, obowiązuje ten dłuższy.",
    tipRo: "Dacă contractul prevede un preaviz mai lung, se aplică cel mai favorabil.",
  },
  {
    id: "ssp",
    termEn: "Statutory Sick Pay (SSP) & Form SSP1",
    termPl: "Ustawowy zasiłek chorobowy (SSP) i formularz SSP1",
    termRo: "Indemnizație legală de boală (SSP) & SSP1",
    category: "sick_pay",
    statute: "Section 151 SSCBA 1992",
    definitionEn:
      "Minimum statutory pay paid by employers when you are sick for 4+ consecutive days and meet minimum weekly earnings. Form SSP1 must be issued if you are refused.",
    definitionPl:
      "Ustawowy zasiłek chorobowy wypłacany przez pracodawcę od 4. kolejnego dnia choroby. Jeśli pracodawca odmawia wypłaty, ma prawny obowiązek wydać formularz SSP1.",
    definitionRo:
      "Plată legală pentru boală de peste 4 zile consecutive. Refuzul necesită emiterea formularului SSP1.",
    tipEn: "Wait days: self-certify for the first 7 days; obtain a GP Fit Note from day 8 onward.",
    tipPl: "Pierwsze 7 dni choroby zgłaszasz sam (self-certification), od 8. dnia potrzebne jest Fit Note od GP.",
    tipRo: "Primele 7 zile se declară personal; din ziua 8 este necesar certificat medical (Fit Note).",
  },
  {
    id: "sar_gdpr",
    termEn: "Subject Access Request (SAR)",
    termPl: "Wniosek o dostęp do danych osobowych (SAR / GDPR)",
    termRo: "Cerere de acces la date personale (SAR / GDPR)",
    category: "data",
    statute: "Article 15 UK GDPR & Data Protection Act 2018",
    definitionEn:
      "Legal right to request copies of all personal records your employer holds on you—HR emails, clock-in logs, disciplinary notes, payslips, and CCTV.",
    definitionPl:
      "Prawo żądania kopii wszystkich danych przechowywanych przez pracodawcę: maili HR, logów bramek (clock-in), notatek dyscyplinarnych, payslipów i nagrań.",
    definitionRo:
      "Dreptul legal de a solicita copii după toate înregistrările HR, pontaje, e-mailuri și dosare disciplinare.",
    tipEn: "The employer must respond free of charge within 1 calendar month.",
    tipPl: "Pracodawca musi odpowiedzieć bezpłatnie w ciągu 1 miesiąca kalendarzowego.",
    tipRo: "Angajatorul trebuie să răspundă gratuit în termen de 1 lună calendaristică.",
  },
  {
    id: "settlement_111a",
    termEn: "Settlement Agreement (Without Prejudice)",
    termPl: "Porozumienie stron / Ugoda (Settlement Agreement)",
    termRo: "Acord de încetare amiabilă (Settlement Agreement)",
    category: "contract",
    statute: "Section 111A ERA 1996 & s.203 ERA 1996",
    definitionEn:
      "Legally binding contract where an employee waives Tribunal claims in return for an agreed financial severance package and agreed reference.",
    definitionPl:
      "Wiążąca umowa ugodowa, w której pracownik zrzeka się roszczeń sądowych w zamian za uzgodnioną rekompensatę finansową (często nieopodatkowaną do £30,000) i referencje.",
    definitionRo:
      "Contract prin care angajatul renunță la pretenții în schimbul unei compensații financiare și a referințelor.",
    tipEn: "For a statutory settlement to be valid in the UK, the employer normally pays for independent legal advice to sign it off.",
    tipPl: "Aby ugoda była prawnie wiążąca w UK, musi ją podpisać niezależny doradca/prawnik (zwykle opłacany przez pracodawcę).",
    tipRo: "Pentru valabilitate legală în UK este necesară semnătura unui consilier juridic independent.",
  },
  {
    id: "nmw",
    termEn: "National Minimum / Living Wage",
    termPl: "Minimalna stawka krajowa w UK (NMW / NLW)",
    termRo: "Salariul minim național în UK (NMW / NLW)",
    category: "wages",
    statute: "National Minimum Wage Act 1998",
    definitionEn:
      "Mandatory hourly rate floor. Deductions for uniforms, tools, or unpaid prep/security queue time cannot push effective pay below NMW.",
    definitionPl:
      "Obowiązkowa minimalna stawka godzinowa. Potrącenia za uniformy, narzędzia ani nieopłacony czas oczekiwania na zmianę/kontrolę nie mogą obniżyć realnej stawki poniżej NMW.",
    definitionRo:
      "Tariful orar minim obligatoriu; reținerile pentru uniforme sau timp neplătit nu pot coborî plata sub NMW.",
    tipEn: "Keep personal clock-in photos/logs; HMRC enforces NMW arrears going back up to 6 years.",
    tipPl: "Dokumentuj realny czas wejść/wyjść z pracy — HMRC może nakazać wypłatę zaległości nawet do 6 lat wstecz.",
    tipRo: "Păstrează dovezi ale orelor lucrate; HMRC poate recupera diferențe până la 6 ani în urmă.",
  },
  {
    id: "working_time",
    termEn: "Holiday Pay & Rest Breaks",
    termPl: "Płatny urlop i ustawowe przerwy w pracy",
    termRo: "Concediu plătit și pauze de odihnă",
    category: "contract",
    statute: "Working Time Regulations 1998",
    definitionEn:
      "Full-time workers get 5.6 weeks (28 days) paid holiday/year (including regular overtime in holiday pay calculations) and a 20-minute uninterrupted break for shifts over 6 hours.",
    definitionPl:
      "Pracownicy w UK mają prawo do 5,6 tygodnia (28 dni) płatnego urlopu rocznie (z uwzględnieniem stałych nadgodzin w stawce urlopowej) oraz 20 min nieprzerwanej przerwy przy zmianie ponad 6h.",
    definitionRo:
      "Drept la 5,6 săptămâni concediu plătit pe an și 20 minute pauză neîntreruptă la ture peste 6 ore.",
    tipEn: "Untaken statutory holiday accrued up to termination must be paid out in your final payslip.",
    tipPl: "Niewykorzystany urlop przy odejściu z pracy musi zostać rozliczony i wypłacony w ostatnim payslipie.",
    tipRo: "Concediul neefectuat la încetarea contractului trebuie achitat în ultimul fluturaș de salariu.",
  },
  {
    id: "zero_hours",
    termEn: "Zero-Hours & Agency Worker Rights",
    termPl: "Kontrakt Zero-Hours i pracownicy agencyjni",
    termRo: "Contract Zero-Hours și muncitori prin agenție",
    category: "contract",
    statute: "Agency Workers Regulations 2010 & s.27A ERA 1996",
    definitionEn:
      "Exclusivity clauses in zero-hours contracts are void. After 12 weeks in the same role, agency workers gain equal basic pay and holiday parity with direct staff.",
    definitionPl:
      "Klauzule zakazujące innej pracy przy kontrakcie zero-hours są nieważne. Po 12 tygodniach na tym samym stanowisku pracownik agencyjny ma prawo do równej płacy i urlopu jak pracownik stały.",
    definitionRo:
      "Clauzele de exclusivitate pe zero-hours sunt nule. După 12 săptămâni în același rol ai dreptul la plată egală.",
    tipEn: "Workers classified as 'worker' rather than 'employee' still hold Day-1 rights to NMW, SSP, holiday pay, and discrimination protection.",
    tipPl: "Nawet mając status 'worker' (lub agency), masz prawo od 1. dnia do stawki minimalnej, urlopu, SSP i ochrony przed dyskryminacją.",
    tipRo: "Chiar cu statut 'worker', beneficiezi din Ziua 1 de salariu minim, concediu și protecție împotriva discriminării.",
  },
];

export const LegalDictionaryModal: React.FC = () => {
  const {
    isLegalDictionaryModalOpen,
    setIsLegalDictionaryModalOpen,
    locale,
    setActiveTab,
    setChatDraft,
    triggerRobotReaction,
  } = useApp();

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DictCategory>("ALL");

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LEGAL_TERMS.filter((item) => {
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        item.termEn.toLowerCase().includes(q) ||
        item.termPl.toLowerCase().includes(q) ||
        item.termRo.toLowerCase().includes(q) ||
        item.statute.toLowerCase().includes(q) ||
        item.definitionEn.toLowerCase().includes(q) ||
        item.definitionPl.toLowerCase().includes(q) ||
        item.definitionRo.toLowerCase().includes(q)
      );
    });
  }, [query, selectedCategory]);

  if (!isLegalDictionaryModalOpen) return null;

  const categories: { id: DictCategory; label: string }[] = [
    {
      id: "ALL",
      label: locale === "pl" ? "Wszystkie" : locale === "ro" ? "Toate" : "All",
    },
    {
      id: "wages",
      label: locale === "pl" ? "Płace" : locale === "ro" ? "Salarii" : "Wages",
    },
    {
      id: "dismissal",
      label: locale === "pl" ? "Zwolnienia" : locale === "ro" ? "Concediere" : "Dismissal",
    },
    {
      id: "grievance",
      label: locale === "pl" ? "Skargi & ACAS" : locale === "ro" ? "ACAS" : "Grievance",
    },
    {
      id: "sick_pay",
      label: "SSP",
    },
    {
      id: "contract",
      label: locale === "pl" ? "Umowy & Urlop" : locale === "ro" ? "Contracte" : "Contracts",
    },
    {
      id: "data",
      label: "SAR / GDPR",
    },
  ];

  const handleAskElonAboutTerm = (entry: LegalTermEntry) => {
    const prompt =
      locale === "pl"
        ? `Wyjaśnij mi jak w mojej sytuacji w UK działa „${entry.termPl}” (${entry.termEn}, ${entry.statute}).`
        : locale === "ro"
        ? `Explică-mi cum se aplică în situația mea din UK „${entry.termRo}” (${entry.termEn}, ${entry.statute}).`
        : `How does "${entry.termEn}" (${entry.statute}) apply to my UK workplace situation?`;
    setChatDraft(prompt);
    setIsLegalDictionaryModalOpen(false);
    setActiveTab("chat");
    triggerRobotReaction("typing", 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={
        locale === "pl"
          ? "Słownik Prawa Pracy UK"
          : locale === "ro"
          ? "Dicționar Juridic UK"
          : "UK Employment Law Dictionary"
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsLegalDictionaryModalOpen(false);
      }}
    >
      <div className="w-full max-w-2xl max-h-[88dvh] bg-[#131B2E] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="shrink-0 px-4 py-3.5 bg-[#0B2038] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D97724]/20 border border-[#D97724]/45 flex items-center justify-center text-[#D97724] shrink-0">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                {locale === "pl"
                  ? "Słownik Prawa Pracy UK"
                  : locale === "ro"
                  ? "Dicționar Juridic Dreptul Muncii UK"
                  : "UK Employment Legal Dictionary"}
              </h2>
              <p className="text-[11px] text-slate-300 truncate">
                {locale === "pl"
                  ? "Kluczowe pojęcia ustawowe (ERA 1996, ACAS, GDPR) z poradą praktyczną"
                  : locale === "ro"
                  ? "Termeni esențiali (ERA 1996, ACAS, GDPR) cu sfaturi practice"
                  : "Key UK statutory terms (ERA 1996, ACAS, GDPR) with practical employee guidance"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsLegalDictionaryModalOpen(false)}
            aria-label="Close"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/10 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                locale === "pl"
                  ? "Szukaj terminu (np. ACAS, SSP1, SAR, Grievance, NMW)..."
                  : locale === "ro"
                  ? "Caută termen (ex. ACAS, SSP1, SAR, Grievance)..."
                  : "Search legal term (e.g. ACAS, SSP1, SAR, Grievance, NMW)..."
              }
              className="w-full bg-[#131B2E] border border-white/15 focus:border-[#D97724] rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-[#F1F5F9] placeholder-[#94A3B8]/60 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                    active
                      ? "bg-[#D97724] text-black border-[#D97724]"
                      : "bg-[#131B2E] text-[#94A3B8] hover:text-white border-white/10"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Terms List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#94A3B8]">
              {locale === "pl"
                ? "Nie znaleziono pasujących terminów prawnych."
                : locale === "ro"
                ? "Nu s-au găsit termeni juridici."
                : "No matching legal terms found."}
            </div>
          ) : (
            filteredTerms.map((entry) => {
              const titlePrimary =
                locale === "pl"
                  ? entry.termPl
                  : locale === "ro"
                  ? entry.termRo
                  : entry.termEn;
              const definition =
                locale === "pl"
                  ? entry.definitionPl
                  : locale === "ro"
                  ? entry.definitionRo
                  : entry.definitionEn;
              const tip =
                locale === "pl"
                  ? entry.tipPl
                  : locale === "ro"
                  ? entry.tipRo
                  : entry.tipEn;

              return (
                <div
                  key={entry.id}
                  className="rounded-xl bg-[#0B0F17]/75 border border-white/10 p-3.5 space-y-2 hover:border-[#38B28B]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-[#F1F5F9] leading-snug">
                        {titlePrimary}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#94A3B8] mt-0.5">
                        {locale !== "en" && (
                          <>
                            <span className="font-semibold text-[#38B28B]">{entry.termEn}</span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="font-mono text-[#D97724] inline-flex items-center gap-1">
                          <Scale className="w-3 h-3 shrink-0" aria-hidden="true" />
                          {entry.statute}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAskElonAboutTerm(entry)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1D6852]/30 hover:bg-[#1D6852] border border-[#38B28B]/40 text-[11px] font-bold text-[#38B28B] hover:text-white inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>
                        {locale === "pl"
                          ? "Zapytaj Elona"
                          : locale === "ro"
                          ? "Întreabă Elon"
                          : "Ask Elon"}
                      </span>
                    </button>
                  </div>

                  <p className="text-xs text-[#F1F5F9]/90 leading-relaxed">{definition}</p>

                  <p className="text-[11px] text-[#94A3B8] border-t border-white/10 pt-1.5">
                    <span className="font-bold text-[#D97724] mr-1">
                      {locale === "pl" ? "Wskazówka:" : locale === "ro" ? "Sfat:" : "Tip:"}
                    </span>
                    {tip}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
