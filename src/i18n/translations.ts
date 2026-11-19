import { Locale } from "../types";

export const translations: Record<string, Record<Locale, string>> = {
  // Navigation & Branding
  appName: { pl: "ask Elon", en: "ask Elon", ro: "ask Elon" },
  motto: {
    pl: "Twój asystent praw pracownika w UK",
    en: "Your UK work-rights assistant",
    ro: "Asistentul tău pentru drepturile la muncă în UK",
  },
  aiAssistant: { pl: "Asystent AI", en: "AI Assistant", ro: "Asistent AI" },
  online: { pl: "Online", en: "Online", ro: "Online" },
  tabChat: { pl: "Czat", en: "Chat", ro: "Chat" },
  tabCases: { pl: "Sprawy", en: "Cases", ro: "Cazuri" },
  tabTemplates: { pl: "Pisma", en: "Letters", ro: "Scrisori" },
  tabForum: { pl: "Q&A", en: "Q&A", ro: "Q&A" },
  tabProfile: { pl: "Profil", en: "Profile", ro: "Profil" },
  navChat: { pl: "Czat", en: "Chat", ro: "Chat" },
  navCases: { pl: "Sprawy", en: "Cases", ro: "Cazuri" },
  navTemplates: { pl: "Pisma", en: "Letters", ro: "Scrisori" },
  navForum: { pl: "Q&A", en: "Q&A", ro: "Q&A" },
  navProfile: { pl: "Profil", en: "Profile", ro: "Profil" },

  // Chat
  elonGreeting: {
    pl: "Siema! Tu Elon – Twój kumpel i negocjator od prawa pracy w UK. Znam na wylot paragrafy ACAS, Employment Rights Act i stawki National Minimum Wage, więc nie damy nikomu wejść Ci na głowę. Powiedz krótko, co odwalił szef albo agencja?",
    en: "Hey mate! I'm Elon – your UK work-rights negotiator and buddy on the shift. I know the ACAS Code, Employment Rights Act, and National Minimum Wage rules inside out, so nobody's going to push you around. Tell me straight—what's your boss or agency pulling?",
    ro: "Salut, prietene! Sunt Elon – colegul și negociatorul tău pentru drepturile muncii în UK. Cunosc la perfecție legile ACAS, Employment Rights Act și salariul minim, așa că nu lăsăm pe nimeni să profite de tine. Spune-mi direct, ce problemă ai cu șeful sau agenția?",
  },
  elonResetPrompt: {
    pl: "Czy masz jeszcze jakieś dalsze pytania? Powiedz, o co jeszcze chcesz zapytać.",
    en: "Do you have any further questions? Let me know what else you'd like to ask.",
    ro: "Mai ai și alte întrebări? Spune-mi ce altceva ai dori să întrebi.",
  },
  chatPlaceholder: {
    pl: "Opisz swoją sytuację w pracy…",
    en: "Describe your situation at work…",
    ro: "Descrie situația ta de la muncă…",
  },
  send: { pl: "Wyślij", en: "Send", ro: "Trimite" },
  clearChat: { pl: "Wyczyść czat", en: "Clear chat", ro: "Șterge conversația" },
  saveAsCase: { pl: "Zapisz jako sprawę", en: "Save as case", ro: "Salvează ca și caz" },
  caseSavedToast: { pl: "Zapisano rozmowę jako nową sprawę!", en: "Saved conversation as a new case!", ro: "Conversația a fost salvată ca și caz nou!" },
  listen: { pl: "Odsłuchaj", en: "Read Aloud", ro: "Citește cu voce" },
  stopListen: { pl: "Stop", en: "Stop", ro: "Oprește" },
  pauseListen: { pl: "Pauza", en: "Pause", ro: "Pauză" },
  resumeListen: { pl: "Wznów", en: "Resume", ro: "Continuă" },
  speakingNow: { pl: "Czytanie na głos...", en: "Reading aloud...", ro: "Se citește cu voce..." },
  speechPaused: { pl: "Wstrzymano czytanie", en: "Speech paused", ro: "Citire în pauză" },
  speechSpeed: { pl: "Tempo mowy", en: "Speech speed", ro: "Viteză voce" },
  speechUnsupported: {
    pl: "Twoja przeglądarka nie obsługuje czytania na głos (Web Speech API).",
    en: "Your browser does not support Read Aloud (Web Speech API).",
    ro: "Browserul tău nu suportă citirea cu voce (Web Speech API).",
  },
  dictate: { pl: "Dyktuj", en: "Dictate", ro: "Dictează" },
  listening: { pl: "Słucham...", en: "Listening...", ro: "Ascult..." },
  autoRead: { pl: "Auto-czytanie", en: "Auto-read", ro: "Auto-citire" },
  elonVoicePreferences: {
    pl: "Preferencje głosu Elona",
    en: "Elon Voice Preferences",
    ro: "Preferințe voce Elon",
  },
  aiDisclaimer: {
    pl: "Elon jest asystentem AI, a nie prawnikiem. To nie jest porada prawna.",
    en: "Elon is an AI assistant, not a lawyer. This is not legal advice.",
    ro: "Elon este un asistent AI, nu un avocat. Aceasta nu este consultanță juridică.",
  },

  // Suggested Prompts
  q1: { pl: "Nie zapłacili mi za nadgodziny i potrącili z payslipu", en: "I wasn't paid overtime and had pay deducted", ro: "Nu mi-au plătit orele suplimentare și au dedus bani" },
  q2: { pl: "Obcięli mi godziny bez uprzedzenia (zero-hours / agencja)", en: "My hours were cut without notice (zero-hours / agency)", ro: "Mi-au tăiat orele fără preaviz (zero-hours / agenție)" },
  q3: { pl: "Odmówiono mi wypłaty chorobowego (Statutory Sick Pay)", en: "I was denied Statutory Sick Pay (SSP)", ro: "Mi s-a refuzat plata concediului medical (SSP)" },
  q4: { pl: "Jak złożyć formalną skargę (Formal Grievance) do pracodawcy?", en: "How do I file a Formal Grievance with my employer?", ro: "Cum depun o plângere formală (Grievance) către angajator?" },
  q5: { pl: "Zwolnili mnie bez procedury dyscyplinarnej i bez odprawy", en: "I was dismissed without disciplinary procedure or notice", ro: "Am fost concediat fără procedură disciplinară și fără preaviz" },
  q6: { pl: "Ile dni płatnego urlopu (holiday pay) mi przysługuje?", en: "How many days of paid holiday (holiday pay) am I entitled to?", ro: "La câte zile de concediu plătit (holiday pay) am dreptul?" },

  // Cases
  casesTitle: { pl: "Moje sprawy", en: "My cases", ro: "Cazurile mele" },
  casesSub: { pl: "Zarządzaj swoimi sporami pracowniczymi i dokumentuj przebieg", en: "Manage workplace disputes and document their timeline", ro: "Gestionează disputele de muncă și documentează parcursul" },
  newCase: { pl: "Nowa sprawa", en: "New case", ro: "Caz nou" },
  allCases: { pl: "Wszystkie", en: "All", ro: "Toate" },
  openCases: { pl: "W toku", en: "Open", ro: "În lucru" },
  resolvedCases: { pl: "Rozwiązane", en: "Resolved", ro: "Rezolvate" },
  noCases: { pl: "Brak spraw w tej kategorii", en: "No cases in this category", ro: "Niciun caz în această categorie" },
  noCasesSub: { pl: "Kliknij przycisk powyżej lub poproś Elona w czacie o utworzenie sprawy.", en: "Click the button above or ask Elon in chat to create a case.", ro: "Apasă butonul de mai sus sau cere-i lui Elon în chat să creeze un caz." },
  caseTitleLabel: { pl: "Tytuł sprawy", en: "Case title", ro: "Titlul cazului" },
  caseSectorLabel: { pl: "Branża / miejsce pracy", en: "Sector / workplace", ro: "Sector / loc de muncă" },
  caseEmployerLabel: { pl: "Pracodawca / agencja", en: "Employer / agency", ro: "Angajator / agenție" },
  caseDescLabel: { pl: "Opis problemu", en: "Description of the dispute", ro: "Descrierea disputei" },
  casePriorityLabel: { pl: "Priorytet", en: "Priority", ro: "Prioritate" },
  priorityLow: { pl: "Niski", en: "Low", ro: "Scăzut" },
  priorityMedium: { pl: "Średni", en: "Medium", ro: "Mediu" },
  priorityHigh: { pl: "Wysoki", en: "High", ro: "Ridicată" },
  createCaseBtn: { pl: "Utwórz sprawę", en: "Create case", ro: "Creează caz" },
  cancel: { pl: "Anuluj", en: "Cancel", ro: "Anulează" },
  markResolved: { pl: "Oznacz jako rozwiązaną", en: "Mark as resolved", ro: "Marchează ca rezolvat" },
  reopenCase: { pl: "Otwórz ponownie", en: "Reopen case", ro: "Redeschide cazul" },
  askElonAboutCase: { pl: "Zapytaj Elona o tę sprawę", en: "Ask Elon about this case", ro: "Întreabă-l pe Elon despre acest caz" },
  caseNotes: { pl: "Oś czasu i notatki do sprawy", en: "Timeline & Case notes", ro: "Cronologie & Notițe" },
  addNote: { pl: "Dodaj wpis do sprawy", en: "Add note to case", ro: "Adaugă notiță la caz" },
  notePlaceholder: { pl: "Wpisz co się wydarzyło (np. rozmowa z HR, otrzymanie pisma)...", en: "Describe what happened (e.g. HR meeting, received letter)...", ro: "Scrie ce s-a întâmplat (ex. discuție cu HR, primire scrisoare)..." },

  // Legal Templates
  templatesTitle: { pl: "Wzory pism formalnych", en: "Legal Letters & Demands", ro: "Modele de scrisori oficiale" },
  templatesSub: { pl: "Zgodne z brytyjskimi przepisami ACAS i prawem pracy UK", en: "Compliant with UK employment law and ACAS Codes of Practice", ro: "Conforme cu legislația britanică a muncii și normele ACAS" },
  categoryAll: { pl: "Wszystkie", en: "All", ro: "Toate" },
  categoryGrievance: { pl: "Skargi (Grievance)", en: "Grievance", ro: "Plângeri" },
  categoryWages: { pl: "Wynagrodzenia & Płace", en: "Wages & Pay", ro: "Salarii" },
  categorySick: { pl: "Chorobowe (SSP)", en: "Sick Pay (SSP)", ro: "Medical (SSP)" },
  categoryData: { pl: "Dane osobowe (SAR)", en: "Data & Records (SAR)", ro: "Date personale (SAR)" },
  categoryDismissal: { pl: "Zwolnienia & Spory", en: "Dismissal & Dispute", ro: "Concedieri" },
  fillDetails: { pl: "Uzupełnij dane pisma", en: "Fill in letter details", ro: "Completează datele" },
  generateLetter: { pl: "Generuj pismo", en: "Generate letter", ro: "Generează scrisoarea" },
  previewLetter: { pl: "Podgląd i wysyłka", en: "Preview & Export", ro: "Previzualizare & Export" },
  copyClipboard: { pl: "Kopiuj treść", en: "Copy to clipboard", ro: "Copiază textul" },
  downloadLetter: { pl: "Pobierz pismo (.txt)", en: "Download letter (.txt)", ro: "Descarcă scrisoarea" },
  saveToSent: { pl: "Zapisz w wysłanych", en: "Save to sent archive", ro: "Salvează în arhiva trimise" },
  sentLettersTitle: { pl: "Wysłane i wygenerowane pisma", en: "Generated Letters Archive", ro: "Arhiva de scrisori generate" },
  sentLettersHeaderBtn: { pl: "Pisma", en: "Letters", ro: "Scrisori" },
  noSentLetters: { pl: "Nie zapisałeś jeszcze żadnych wygenerowanych pism.", en: "You haven't saved any generated letters yet.", ro: "Nu ai salvat încă nicio scrisoare generată." },
  statutoryRef: { pl: "Podstawa prawna", en: "Statutory Reference", ro: "Temei legal" },
  sentimentGuardTitle: {
    pl: "Strażnik Tonu Prawnego AI (ACAS Tone Shield)",
    en: "AI Legal Tone & Sentiment Shield (ACAS)",
    ro: "Scut AI pentru Tonul Juridic (ACAS)",
  },
  sentimentScanning: {
    pl: "Analiza tonu w tle (ochrona przed zarzutem agresji)...",
    en: "Analyzing tone in background (checking for inflammatory phrasing)...",
    ro: "Analizare ton în fundal (verificare limbaj inflamator)...",
  },
  sentimentSafe: {
    pl: "Ton profesjonalny i bezpieczny prawnie",
    en: "Professional & Legally Safe Tone",
    ro: "Ton profesional și sigur juridic",
  },
  sentimentCautionary: {
    pl: "Wykryto emocjonalne lub konfrontacyjne słownictwo",
    en: "Emotionally Charged or Confrontational Phrasing",
    ro: "Formulare emoțională sau confruntațională detectată",
  },
  sentimentInflammatory: {
    pl: "Ostrzeżenie: Wykryto język agresywny lub zapalny!",
    en: "Warning: Aggressive or Inflammatory Language Flagged!",
    ro: "Atenție: Limbaj agresiv sau inflamator detectat!",
  },
  applySafeRewrite: {
    pl: "Zastąp bezpiecznym zwrotem prawnym",
    en: "Replace with diplomatic legal phrasing",
    ro: "Înlocuiește cu formulare juridică sigură",
  },
  applyAllSafeRewrites: {
    pl: "Zneutralizuj wszystkie oflagowane zwroty (ACAS)",
    en: "Neutralize all flagged phrases (ACAS-safe)",
    ro: "Neutralizează toate expresiile semnalate (ACAS)",
  },
  finalizeWarningTitle: {
    pl: "Przed finalizacją: Wykryto ryzykowny ton w piśmie",
    en: "Before Finalizing: Risky Language Detected in Draft",
    ro: "Înainte de finalizare: Limbaj riscant detectat în ciornă",
  },
  finalizeWarningSub: {
    pl: "W oficjalnym piśmie do HR w UK emocjonalne oskarżenia, obelgi lub groźby mogą zostać użyte przeciwko Tobie jako naruszenie dyscypliny (Gross Misconduct) i osłabić Twoją pozycję w Employment Tribunal.",
    en: "In formal UK HR correspondence, aggressive accusations or insults can be used against you as misconduct and weaken your credibility before an Employment Tribunal.",
    ro: "În corespondența oficială HR din UK, acuzațiile agresive sau insultele pot fi folosite împotriva ta ca abatere disciplinară în fața Tribunalului Muncii.",
  },
  neutralizeAndFinalize: {
    pl: "Zamień na język prawny i finalizuj pismo",
    en: "Apply legal rewrites & finalize letter",
    ro: "Aplică reformulările juridice și finalizează",
  },
  proceedAnyway: {
    pl: "Finalizuj mimo ostrzeżenia",
    en: "Finalize anyway without changes",
    ro: "Finalizează oricum fără modificări",
  },
  testInflammatoryBtn: {
    pl: "Przetestuj detektor agresji (wstaw emocjonalny szkic)",
    en: "Test Tone Shield (insert inflammatory draft)",
    ro: "Testează detectorul (inserează text agresiv)",
  },

  // Q&A (dawniej Forum)
  forumTitle: {
    pl: "Centrum Q&A i Możliwości Aplikacji",
    en: "Q&A & App Capabilities Hub",
    ro: "Centru Q&A & Funcționalități Aplicație",
  },
  forumHeading: {
    pl: "Q&A — Możliwości Aplikacji i Baza Wiedzy UK",
    en: "Q&A — App Capabilities & UK Work-Rights Guide",
    ro: "Q&A — Funcționalități Aplicație & Ghid UK",
  },
  forumSub: {
    pl: "Systematyczny przewodnik po funkcjach ask Elon: sprawdź dokładnie gdzie wejść, co zaznaczyć i jaki rezultat prawny uzyskasz krok po kroku",
    en: "Systematic guide to ask Elon capabilities: check exactly where to go, what to select, and what legal result you get step by step",
    ro: "Ghid sistematic ask Elon: verifică exact unde să intri, ce să selectezi și ce rezultat obții pas cu pas",
  },
  newPost: { pl: "Dodaj pytanie Q&A / instrukcję", en: "Add Q&A question / guide", ro: "Adaugă întrebare Q&A / ghid" },
  newPostBtn: { pl: "Dodaj pytanie Q&A", en: "Ask Q&A Question", ro: "Adaugă Q&A" },
  filterAll: { pl: "Wszystkie kategorie", en: "All categories", ro: "Toate categoriile" },
  postTitleLabel: { pl: "Pytanie lub temat instrukcji Q&A", en: "Question or Q&A guide title", ro: "Titlul întrebării sau ghidului Q&A" },
  postTagLabel: { pl: "Kategoria Q&A", en: "Q&A Category", ro: "Categorie Q&A" },
  postContentLabel: { pl: "Szczegółowa odpowiedź lub opis problemu", en: "Detailed answer or problem description", ro: "Răspuns detaliat sau descrierea problemei" },
  publishPost: { pl: "Opublikuj w Q&A", en: "Publish to Q&A", ro: "Publică în Q&A" },
  upvote: { pl: "Pomocne", en: "Helpful", ro: "Util" },
  comments: { pl: "Komentarze i odpowiedzi", en: "Comments & Answers", ro: "Comentarii & Răspunsuri" },
  commentsCount: { pl: "odpowiedzi", en: "answers", ro: "răspunsuri" },
  addComment: { pl: "Dodaj odpowiedź lub dopytaj...", en: "Add an answer or follow-up...", ro: "Adaugă un răspuns..." },
  addCommentPlaceholder: { pl: "Dodaj odpowiedź lub pytanie uzupełniające...", en: "Write an answer or follow-up question...", ro: "Scrie un răspuns sau o întrebare..." },
  postComment: { pl: "Dodaj", en: "Reply", ro: "Trimite" },
  replyBtn: { pl: "Wyślij", en: "Reply", ro: "Trimite" },

  // Profile & Details
  profileTitle: { pl: "Twój profil pracownika", en: "Worker Profile & Hub", ro: "Profil Muncitor" },
  profileSub: { pl: "Dane są używane do automatycznego wypełniania pism formalnych i kalkulatorów", en: "Details are used to auto-fill legal letters and audit payslips", ro: "Datele sunt folosite la completarea scrisorilor și auditul fluturașilor" },
  tabData: { pl: "Dane osobowe", en: "Details", ro: "Date" },
  tabDocs: { pl: "Dokumenty & Payslipy", en: "Documents & Payslips", ro: "Documente & Fluturași" },
  tabNotes: { pl: "Notatki osobiste", en: "Personal Notes", ro: "Notițe personale" },
  seniority: { pl: "Staż pracy", en: "Length of service", ro: "Vechime în muncă" },
  years: { pl: "lat", en: "years", ro: "ani" },
  year: { pl: "rok", en: "year", ro: "an" },
  months: { pl: "mies.", en: "mo", ro: "luni" },
  lessThanMonth: { pl: "Mniej niż miesiąc", en: "Less than a month", ro: "Mai puțin de o lună" },
  personalDataSection: { pl: "Dane personalne", en: "Personal Details", ro: "Date Personale" },
  fullName: { pl: "Imię i nazwisko", en: "Full name", ro: "Nume complet" },
  email: { pl: "Adres e-mail", en: "Email address", ro: "Adresă de e-mail" },
  phone: { pl: "Numer telefonu", en: "Phone number", ro: "Număr de telefon" },
  homeAddress: { pl: "Adres zamieszkania w UK", en: "UK Home address", ro: "Adresă de domiciliu în UK" },
  employerSection: { pl: "Dane pracodawcy / agencji", en: "Employer & Agency Details", ro: "Date Angajator / Agenție" },
  employerName: { pl: "Nazwa pracodawcy", en: "Employer name", ro: "Numele angajatorului" },
  employerLookupBtn: { pl: "Znajdź pracodawcę (UK Postcode / Firma)", en: "Find employer (UK Postcode / Company)", ro: "Caută angajator (Cod poștal / Companie)" },
  companyNumber: { pl: "Numer rejestrowy (Companies House)", en: "Companies House Number", ro: "Număr înregistrare companie" },
  employerAddress: { pl: "Adres siedziby lub magazynu", en: "Employer or Workplace address", ro: "Adresă sediu sau depozit" },
  termsSection: { pl: "Warunki zatrudnienia", en: "Employment Terms", ro: "Condiții de muncă" },
  jobTitle: { pl: "Stanowisko", en: "Job title", ro: "Funcție" },
  industry: { pl: "Branża", en: "Industry", ro: "Sector de activitate" },
  startDate: { pl: "Data rozpoczęcia pracy", en: "Employment start date", ro: "Data începerii muncii" },
  hourlyRate: { pl: "Stawka godzinowa (£)", en: "Hourly rate (£)", ro: "Tarif orar (£)" },
  hoursPerWeek: { pl: "Liczba godzin tygodniowo", en: "Contracted hours per week", ro: "Ore pe săptămână" },
  contractType: { pl: "Typ umowy", en: "Contract type", ro: "Tip de contract" },
  ctPermanent: { pl: "Umowa stała (Permanent Contract)", en: "Permanent Contract", ro: "Contract pe durată nedeterminată" },
  ctZeroHours: { pl: "Zero-hours contract", en: "Zero-hours contract", ro: "Contract fără ore garantate (Zero-hours)" },
  ctAgency: { pl: "Praca agencyjna (Agency worker)", en: "Agency worker", ro: "Muncitor prin agenție" },
  ctFixedTerm: { pl: "Umowa na czas określony (Fixed-term)", en: "Fixed-term contract", ro: "Contract pe perioadă determinată" },
  saveProfile: { pl: "Zapisz zmiany w profilu", en: "Save profile changes", ro: "Salvează modificările" },
  profileSavedToast: { pl: "Zapisano dane profilu!", en: "Profile saved successfully!", ro: "Profil salvat cu succes!" },

  // Documents & Payslip Audit
  uploadDoc: { pl: "Wgraj dokument / payslip", en: "Upload document / payslip", ro: "Încarcă document / fluturaș" },
  auditPayslip: { pl: "Audyt AI z Elonem", en: "AI Audit with Elon", ro: "Audit AI cu Elon" },
  noDocs: { pl: "Brak wgranych dokumentów", en: "No documents uploaded", ro: "Niciun document încărcat" },
  noDocsSub: { pl: "Wgraj odcinek wypłaty (payslip) lub umowę o pracę, aby Elon mógł sprawdzić poprawność stawek i potrąceń.", en: "Upload your payslip or contract so Elon can verify minimum wage, deductions and holiday pay.", ro: "Încarcă fluturașul sau contractul pentru verificare salariu și deduceri." },
  auditCompliant: { pl: "Stawka zgodna z National Living Wage", en: "Compliant with National Living Wage", ro: "Conform cu salariul minim britanic" },
  auditPotentialIssue: { pl: "Wykryto potencjalne nieprawidłowości!", en: "Potential wage violations detected!", ro: "S-au detectat nereguli potențiale!" },

  // Employer Lookup Modal
  lookupTitle: { pl: "Wyszukiwarka pracodawcy w UK", en: "UK Employer & Address Lookup", ro: "Căutare angajator în UK" },
  lookupSub: { pl: "Wpisz brytyjski kod pocztowy (np. SW1A 1AA) lub nazwę firmy", en: "Enter UK postcode (e.g. SW1A 1AA) or company name", ro: "Introdu codul poștal din UK sau numele companiei" },
  searchPlaceholder: { pl: "np. E14 5HP lub Amazon UK...", en: "e.g. E14 5HP or Tesco...", ro: "ex. E14 5HP sau DHL..." },
  searchBtn: { pl: "Szukaj", en: "Search", ro: "Caută" },
  useAddress: { pl: "Wybierz ten adres", en: "Use this employer", ro: "Alege acest angajator" },
  noResults: { pl: "Nie znaleziono wyników dla tego zapytania.", en: "No employers found for this search.", ro: "Niciun rezultat găsit." },

  // Subscription / Membership
  proTitle: { pl: "Członkostwo ask Elon", en: "ask Elon Membership", ro: "Abonament ask Elon" },
  proPrice: { pl: "£9.99 / miesiąc", en: "£9.99 / month", ro: "£9.99 / lună" },
  proFeature1: { pl: "Nielimitowane konsultacje AI z Elonem z natychmiastową odpowiedzią", en: "Unlimited AI consultations with Elon with zero wait time", ro: "Consultații nelimitate cu Elon AI" },
  proFeature2: { pl: "Automatyczny audyt odcinków wypłat (Payslip AI Auditor) i zaległego holiday pay", en: "Automated Payslip AI Audits & missing holiday pay calculations", ro: "Audit automat pentru fluturași de salariu și concedii" },
  proFeature3: { pl: "Dostęp do wszystkich oficjalnych pism prawnych ACAS i ERA 1996", en: "Full access to all ACAS & ERA 1996 legal letter generators", ro: "Acces complet la toate scrisorile legale ACAS și ERA" },
  proFeature4: { pl: "Prywatna oś czasu incydentów i przygotowanie dowodów do Trybunału (ET1)", en: "Dispute timeline builder & Employment Tribunal evidence organizer", ro: "Organizare dovezi pentru Tribunalul Muncii (ET1)" },
  subscribeBtn: { pl: "Aktywuj członkostwo ask Elon (£9.99/mies.)", en: "Activate ask Elon Membership (£9.99/mo)", ro: "Activează abonamentul ask Elon (£9.99/lună)" },
  proActiveBadge: { pl: "CZŁONKOSTWO AKTYWNE", en: "MEMBERSHIP ACTIVE", ro: "ABONAMENT ACTIV" },

  // Menu / Account Drawer
  menuTitle: { pl: "Menu & Konto", en: "Menu & Account", ro: "Meniu & Cont" },
  accountIdLabel: { pl: "Identyfikator konta", en: "Account ID", ro: "ID Cont" },
  promoCodeLabel: { pl: "Kod promocyjny", en: "Promo Code", ro: "Cod promoțional" },
  redeemBtn: { pl: "Aktywuj", en: "Redeem", ro: "Activează" },
  promoSuccess: { pl: "Aktywowano bezpłatny dostęp PRO na 3 miesiące!", en: "Activated free 3-month PRO access!", ro: "Acces PRO activat gratuit pentru 3 luni!" },
  promoInvalid: { pl: "Nieprawidłowy kod promocyjny.", en: "Invalid promo code.", ro: "Cod promoțional invalid." },
  adminPanelBtn: { pl: "Panel Administratora", en: "Admin Dashboard", ro: "Panou Administrator" },
  supportContactBtn: { pl: "Wiadomości & Pomoc", en: "Messages & Support", ro: "Mesaje & Ajutor" },
  languageSelect: { pl: "Wybór języka", en: "Language", ro: "Limbă" },
  resetData: { pl: "Zresetuj dane testowe", en: "Reset demo data", ro: "Resetează datele demo" },
  logout: { pl: "Wyloguj", en: "Log out", ro: "Deconectare" },

  // Admin Modal
  adminTitle: { pl: "Panel Administratora ask Elon", en: "Admin Management Console", ro: "Consolă Administrator ask Elon" },
  statsUsers: { pl: "Zarejestrowani pracownicy", en: "Registered Workers", ro: "Muncitori înregistrați" },
  statsCases: { pl: "Aktywne sprawy", en: "Active Disputes", ro: "Cazuri active" },
  statsLetters: { pl: "Wygenerowane pisma", en: "Letters Generated", ro: "Scrisori generate" },
  statsAudit: { pl: "Wykonane audyty payslipów", en: "Payslip Audits Ran", ro: "Audite fluturași rulate" },

  // Network Status & Active Workflow Protection
  netOnline: { pl: "Online", en: "Online", ro: "Online" },
  netOffline: { pl: "Offline", en: "Offline", ro: "Offline" },
  netReconnecting: { pl: "Łączenie...", en: "Reconnecting...", ro: "Reconectare..." },
  netStatusTitle: { pl: "Status połączenia i ochrona szkiców", en: "Connection & Draft Protection", ro: "Stare conexiune & Protecție ciorne" },
  netStatusOnlineDesc: {
    pl: "Połączenie z serwerem ask Elon aktywne. Szkice i czat są synchronizowane w czasie rzeczywistym.",
    en: "Connected to ask Elon server. Chat and letter drafts are synced in real time.",
    ro: "Conectat la serverul ask Elon. Conversațiile și scrisorile sunt sincronizate în timp real.",
  },
  netStatusOfflineDesc: {
    pl: "Brak połączenia z siecią. Twoje szkice pism i wiadomości są automatycznie zapisywane na urządzeniu.",
    en: "No internet connection. Your letter drafts and chat messages are automatically saved on your device.",
    ro: "Fără conexiune la internet. Ciornele și mesajele tale sunt salvate automat local.",
  },
  netCheckNow: { pl: "Sprawdź połączenie", en: "Verify connection", ro: "Verifică conexiunea" },
  netSimulateOffline: { pl: "Testuj tryb Offline", en: "Simulate Offline mode", ro: "Simulează modul Offline" },
  netRestoreOnline: { pl: "Przywróć tryb Online", en: "Restore Online mode", ro: "Restabilește Online" },
  netLastVerified: { pl: "Ostatnia synchronizacja", en: "Last verified", ro: "Ultima verificare" },
  netQueuedCount: { pl: "Wiadomości w kolejce do wysłania", en: "Queued messages awaiting sync", ro: "Mesaje în așteptare pentru trimitere" },
  netDraftProtected: { pl: "Lokalny auto-zapis aktywny", en: "Local draft auto-save active", ro: "Salvare automată locală activă" },

  // Contextual Alerts (Toasts & Banners)
  netLostDuringChatToast: {
    pl: "Utracono połączenie podczas czatu! Twój szkic jest bezpieczny – wiadomości zostaną wysłane automatycznie po powrocie sieci.",
    en: "Connection lost during chat! Your draft is auto-saved locally and messages will send automatically when back online.",
    ro: "Conexiune pierdută în timpul conversației! Mesajul tău este salvat local și va fi trimis automat la reconectare.",
  },
  netLostDuringLetterToast: {
    pl: "Utracono połączenie podczas tworzenia pisma! Wszystkie pola formularza i zmiany są automatycznie zapisywane na urządzeniu.",
    en: "Connection lost while drafting your letter! All form fields and edits are safely auto-saved on your device.",
    ro: "Conexiune pierdută în timpul redactării scrisorii! Toate datele sunt salvate automat pe dispozitiv.",
  },
  netLostGeneralToast: {
    pl: "Utracono połączenie z siecią. Przełączono w tryb ochrony lokalnej (Offline).",
    en: "Network connection lost. Switched to local offline protection mode.",
    ro: "Conexiune la rețea pierdută. Modul de protecție offline a fost activat.",
  },
  netRestoredToast: {
    pl: "Połączenie przywrócone! Zsynchronizowano dane z serwerem ask Elon.",
    en: "Connection restored! Synced with ask Elon server.",
    ro: "Conexiune restabilită! Datele au fost sincronizate cu ask Elon.",
  },
  netRestoredWithQueueToast: {
    pl: "Połączenie przywrócone! Wysyłam zakolejkowane wiadomości do Elona...",
    en: "Connection restored! Sending your queued messages to Elon...",
    ro: "Conexiune restabilită! Se trimit mesajele din coadă către Elon...",
  },
  chatOfflineBannerTitle: {
    pl: "Utracono połączenie w trakcie rozmowy – Twoje wiadomości są chronione",
    en: "Connection lost during chat – Your messages & draft are protected",
    ro: "Conexiune pierdută în timpul conversației – Mesajele tale sunt protejate",
  },
  chatOfflineBannerSub: {
    pl: "Tekst wpisywany poniżej jest zapisywany lokalnie. Możesz kliknąć Wyślij – wiadomość trafi do kolejki i zostanie automatycznie dostarczona do Elona po odzyskaniu zasięgu.",
    en: "Your composer text is auto-saved locally. You can still hit Send—your message will be queued and automatically delivered to Elon as soon as connection returns.",
    ro: "Textul scris este salvat local. Poți apăsa Trimite – mesajul va fi pus în așteptare și trimis automat imediat ce revine conexiunea.",
  },
  letterOfflineBannerTitle: {
    pl: "Brak połączenia podczas pisania pisma – Auto-zapis szkicu aktywny",
    en: "Connection lost while drafting letter – Local Auto-Save Active",
    ro: "Conexiune pierdută în timpul redactării – Salvare automată activă",
  },
  letterOfflineBannerSub: {
    pl: "Wszystkie wpisane dane, edycje pisma oraz lokalny Strażnik Tonu ACAS działają bez internetu. Możesz bezpiecznie kontynuować, pobrać pismo (.txt) lub skopiować tekst.",
    en: "All form fields, letter edits, and the instant ACAS Tone Shield work offline. You can safely continue editing, copy, or download your letter (.txt) without losing work.",
    ro: "Toate câmpurile, modificările și Scutul ACAS funcționează offline. Poți continua redactarea, copia sau descărca scrisoarea fără a pierde date.",
  },
  msgQueuedBadge: {
    pl: "W kolejce · Wyśle się automatycznie po powrocie sieci",
    en: "Queued · Will send automatically when online",
    ro: "În așteptare · Se va trimite automat la reconectare",
  },
  msgSendingBadge: {
    pl: "Synchronizacja z Elonem...",
    en: "Syncing with Elon...",
    ro: "Sincronizare cu Elon...",
  },
  retryNowBtn: { pl: "Wyślij teraz", en: "Send now", ro: "Trimite acum" },
  draftAutoSaved: { pl: "Szkic zapisany lokalnie", en: "Draft auto-saved locally", ro: "Ciornă salvată local" },
  resumeDraftBanner: {
    pl: "Masz niezakończony szkic pisma zapisany na urządzeniu",
    en: "You have an unfinished letter draft auto-saved on this device",
    ro: "Ai o ciornă de scrisoare neterminată salvată pe dispozitiv",
  },
  resumeDraftBtn: { pl: "Wznów szkic", en: "Resume draft", ro: "Continuă ciorna" },
  discardDraftBtn: { pl: "Odrzuć", en: "Discard", ro: "Renunță" },
  edit: { pl: "Wróć do edycji formularza", en: "Back to form fields", ro: "Înapoi la formular" },
  copy: { pl: "Kopiuj", en: "Copy", ro: "Copiază" },
  aiError: {
    pl: "Wystąpił problem z połączeniem. Twoja wiadomość została zachowana.",
    en: "A connection issue occurred. Your message has been preserved.",
    ro: "A apărut o problemă de conexiune. Mesajul tău a fost păstrat.",
  },

  // Summary Side-Panel
  legalSummaryBtn: {
    pl: "Podsumowanie",
    en: "Summary",
    ro: "Rezumat",
  },
  legalSummaryTitle: {
    pl: "Podsumowanie & Terminy",
    en: "Summary & Deadlines",
    ro: "Rezumat & Termene",
  },
  legalSummarySubLive: {
    pl: "Wyodrębniono na żywo z kontekstu rozmowy",
    en: "Extracted live from conversation context",
    ro: "Extras în timp real din contextul conversației",
  },
  legalSummarySubBaseline: {
    pl: "Podstawowa ochrona pracownika w UK (ACAS / ERA 1996)",
    en: "Baseline UK Worker Statutory Protection (ACAS / ERA 1996)",
    ro: "Protecția legală de bază în UK (ACAS / ERA 1996)",
  },
  legalSummaryDeadlinesHeader: {
    pl: "Terminy ustawowe (Deadlines)",
    en: "Statutory Deadlines",
    ro: "Termene Legale (Deadlines)",
  },
  legalSummaryRightsHeader: {
    pl: "Kluczowe prawa i ustawy UK",
    en: "Key UK Statutory Rights",
    ro: "Drepturi Legale Cheie în UK",
  },
  legalSummaryActionsHeader: {
    pl: "Zalecane pisma formalne",
    en: "Recommended Statutory Letters",
    ro: "Scrisori Oficiale Recomandate",
  },
  urgencyCritical: {
    pl: "Krytyczny",
    en: "Critical",
    ro: "Critic",
  },
  urgencyImportant: {
    pl: "Ważny",
    en: "Important",
    ro: "Important",
  },
  urgencyStandard: {
    pl: "Standardowy",
    en: "Standard",
    ro: "Standard",
  },
  openRecommendedLetter: {
    pl: "Otwórz wzór pisma",
    en: "Draft statutory letter",
    ro: "Redactează scrisoarea",
  },
  copyLegalSummary: {
    pl: "Kopiuj podsumowanie",
    en: "Copy summary",
    ro: "Copiază rezumatul",
  },
  legalSummaryCopiedToast: {
    pl: "Skopiowano podsumowanie i terminy do schowka!",
    en: "Copied summary and deadlines to clipboard!",
    ro: "Rezumatul și termenele au fost copiate!",
  },
  refreshLegalSummary: {
    pl: "Odśwież podsumowanie",
    en: "Refresh summary",
    ro: "Actualizează rezumatul",
  },
  analyzingContextBadge: {
    pl: "Aktualizacja kontekstu...",
    en: "Updating full context...",
    ro: "Se actualizează contextul...",
  },
  waitingForStreamBadge: {
    pl: "Oczekiwanie na zakończenie odpowiedzi AI...",
    en: "Awaiting AI stream completion...",
    ro: "Se așteaptă finalizarea răspunsului AI...",
  },

  // Full-Screen Chat & Options Sheet (Part 1)
  "chat.legalSummary": {
    pl: "Podsumowanie",
    en: "Summary",
    ro: "Rezumat",
  },
  chatBackBtn: {
    pl: "Wróć",
    en: "Back",
    ro: "Înapoi",
  },
  chatOptionsBtn: {
    pl: "Opcje",
    en: "Options",
    ro: "Opțiuni",
  },
  chatScrollToLatest: {
    pl: "Przewiń do najnowszej",
    en: "Scroll to latest",
    ro: "Derulează la ultimul mesaj",
  },
  chatOptionsTitle: {
    pl: "Opcje rozmowy i sprawy",
    en: "Chat & Case Options",
    ro: "Opțiuni conversație și caz",
  },
  chatActionsSection: {
    pl: "Akcje rozmowy",
    en: "Conversation Actions",
    ro: "Acțiuni conversație",
  },
  chatVoiceSection: {
    pl: "Głos i prywatność",
    en: "Voice & Privacy",
    ro: "Voce și confidențialitate",
  },
  chatTopicsSection: {
    pl: "Tryb AI i kontekst",
    en: "AI Mode & Context",
    ro: "Mod AI și context",
  },
  chatPathSection: {
    pl: "Ścieżka sprawy",
    en: "Case Path",
    ro: "Parcurs caz",
  },
  chatFollowUpsSection: {
    pl: "Co dalej",
    en: "What Next",
    ro: "Pașii următori",
  },
  chatClearBtnShort: {
    pl: "Usuń",
    en: "Clear",
    ro: "Șterge",
  },
  chatSaveBtnShort: {
    pl: "Zapisz",
    en: "Save",
    ro: "Salvează",
  },
  chatDownloadBtnShort: {
    pl: "Ściągnij",
    en: "Download",
    ro: "Descarcă",
  },

  // Cases Tab Redesign & Quick Preview Sheet (Part 2)
  casesHeading: {
    pl: "Moje sprawy",
    en: "My cases",
    ro: "Cazurile mele",
  },
  newCaseBtn: {
    pl: "Nowa sprawa",
    en: "New case",
    ro: "Caz nou",
  },
  statusOpen: {
    pl: "Otwarte",
    en: "Open",
    ro: "Deschis",
  },
  statusResolved: {
    pl: "Zamknięte",
    en: "Resolved",
    ro: "Rezolvat",
  },
  addCaseNotePlaceholder: {
    pl: "Wpisz co się wydarzyło (np. rozmowa z HR, otrzymanie pisma)...",
    en: "Describe what happened (e.g. HR meeting, received letter)...",
    ro: "Descrie ce s-a întâmplat (ex. întâlnire HR, scrisoare primită)...",
  },
  addNoteBtn: {
    pl: "Dodaj",
    en: "Add",
    ro: "Adaugă",
  },
  casesSummaryOpenSingular: {
    pl: "otwarta",
    en: "open",
    ro: "deschis",
  },
  casesSummaryOpenPlural: {
    pl: "otwarte",
    en: "open",
    ro: "deschise",
  },
  casesSummaryDeadlineWeekSingular: {
    pl: "termin w tym tygodniu",
    en: "deadline this week",
    ro: "termen săptămâna aceasta",
  },
  casesSummaryDeadlineWeekPlural: {
    pl: "terminy w tym tygodniu",
    en: "deadlines this week",
    ro: "termene săptămâna aceasta",
  },
  casesSummaryDocsLabel: {
    pl: "dokumentów",
    en: "documents",
    ro: "documente",
  },
  casesFilterDeadlineWeek: {
    pl: "Termin w tym tygodniu",
    en: "Deadline this week",
    ro: "Termen săptămâna aceasta",
  },
  casesPreviewAction: {
    pl: "Podgląd sprawy",
    en: "Case preview",
    ro: "Previzualizare caz",
  },
  casesPreviewOpenBtn: {
    pl: "Otwórz sprawę",
    en: "Open case",
    ro: "Deschide cazul",
  },
  casesPreviewChatBtn: {
    pl: "Czat o tej sprawie",
    en: "Chat about this case",
    ro: "Chat despre acest caz",
  },
  casesPreviewAddDocBtn: {
    pl: "Dodaj dokument",
    en: "Add document",
    ro: "Adaugă document",
  },
  casesPreviewLastElon: {
    pl: "Ostatnia wiadomość Elona",
    en: "Last message from Elon",
    ro: "Ultimul mesaj de la Elon",
  },
  casesPreviewNoElonYet: {
    pl: "Brak jeszcze wiadomości Elona dla tej sprawy. Otwórz czat, aby rozpocząć analizę.",
    en: "No Elon message for this case yet. Open chat to start reviewing.",
    ro: "Încă nu există un mesaj de la Elon pentru acest caz. Deschide chatul pentru analiză.",
  },
  casesPreviewBoxesTitle: {
    pl: "Dokumenty w pudełkach",
    en: "Document Boxes",
    ro: "Cutii de documente",
  },
  casesPreviewLatestDocs: {
    pl: "Ostatnie dokumenty",
    en: "Latest Documents",
    ro: "Ultimele documente",
  },
  casesStep1Label: {
    pl: "Zgłoszenie problemu",
    en: "Issue logged",
    ro: "Problemă raportată",
  },
  casesStep2Label: {
    pl: "Zbieranie dowodów",
    en: "Gathering evidence",
    ro: "Strângere dovezi",
  },
  casesStep3Label: {
    pl: "Ugoda i ACAS",
    en: "Letters & ACAS",
    ro: "Scrisori și ACAS",
  },
  casesStep4Label: {
    pl: "Sprawa zamknięta",
    en: "Case resolved",
    ro: "Caz rezolvat",
  },
};

export function getTranslation(key: string, locale: Locale): string {
  if (!translations[key]) return key;
  return translations[key][locale] || translations[key]["en"] || key;
}


