import {
  UserProfile,
  WorkplaceCase,
  ForumPost,
  UserDocument,
  WorkplaceNote,
  BroadcastMessage,
  SentLetter,
  AdminManagedUser,
  PromoCodeItem,
  MarketingPopupConfig
} from "../types";

export const initialUserProfile: UserProfile = {
  id: "user_elon_001",
  accountId: "MN 2609 0000 9 T",
  fullName: "Marek Nowak",
  email: "marek.nowak@example.co.uk",
  phone: "+44 7700 900342",
  homeAddress: "42 Victoria Road, Dartford, DA1 5DJ",
  city: "Dartford, Kent",
  registeredAt: "09.2026",
  employerName: "Amazon Fulfilment LCY2",
  companyNumber: "03223028",
  employerAddress: "London Distribution Park, Windrush Drive, Tilbury RM18 7AN",
  jobTitle: "Warehouse Operative (Night Shift)",
  startDate: "2026-03-01",
  hourlyRate: 13.50,
  hoursPerWeek: 40,
  contractType: "zero_hours",
  industry: "Warehouse / Logistics",
  isPro: true,
  free_access: false,
  subscriptionStatus: "active_pro",
  role: "admin",
  onboarded: true,
  sessionsToday: 4,
  sessionsLast7Days: 19,
  sessionsTotal: 86,
  dailyQueriesCount: 6,
  chatQueriesCount: 28,
  formalCasesCount: 3
};

export const initialCases: WorkplaceCase[] = [
  {
    id: "case_01",
    title: "Potrącenie z payslipu za odzież roboczą i 12 nieopłaconych nadgodzin",
    description: "Na payslipie za wrzesień 2026 pracodawca potrącił mi £65 za buty robocze bez pisemnej zgody oraz pominął 12 nadgodzin ze zmiany nocnej z 14 września.",
    sector: "Logistyka / Magazyn",
    employer: "Amazon Fulfilment LCY2",
    status: "open",
    priority: "high",
    createdAt: "2026-10-14T09:30:00Z",
    updatedAt: "2026-10-21T14:15:00Z",
    notes: [
      {
        id: "note_101",
        text: "Zgłosiłem sprawę ustnie kierownikowi zmiany (Dave). Odpowiedział, że 'tak nalicza system agencji'.",
        date: "2026-10-15 11:20",
        author: "Artur Kowalski"
      },
      {
        id: "note_102",
        text: "Wysłałem oficjalne pismo Section 13 ERA 1996 wygenerowane przez ask Elon do Payroll HR.",
        date: "2026-10-18 16:45",
        author: "Marek Nowak"
      }
    ],
    pinnedItems: [
      {
        id: "pin_init_101",
        messageId: "msg_seed_overtime",
        role: "assistant",
        senderName: "Elon · AI",
        text: "Brakuje dokładnie 12 godzin – zgodnie z Section 13 Employment Rights Act 1996 niewypłacenie przepracowanych nadgodzin oraz potrącenie £65 za buty ochronne (Section 9 Health and Safety at Work etc. Act 1974) stanowi bezprawne potrącenie z wynagrodzenia (Unlawful Deduction from Wages).",
        pinnedAt: "2026-10-18 16:40"
      }
    ]
  },
  {
    id: "case_02",
    title: "Odmowa Statutory Sick Pay po wypadku przy załadunku",
    description: "Po skręceniu kostki dostarczyłem GP Fit Note na 10 dni zwolnienia. Agencja odmówiła wypłaty SSP, twierdząc że jestem zatrudniony krócej niż 3 miesiące.",
    sector: "Agencja pracy",
    employer: "Single Resource Staffing",
    status: "open",
    priority: "medium",
    createdAt: "2026-09-28T11:00:00Z",
    updatedAt: "2026-10-04T10:00:00Z",
    notes: [
      {
        id: "note_201",
        text: "Dostarczono kopię Form SSP1 oraz wezwanie do zapłaty SSP.",
        date: "2026-10-01 10:15",
        author: "Artur Kowalski"
      }
    ]
  },
  {
    id: "case_03",
    title: "Niewypłacony ekwiwalent za urlop (Holiday Pay) po zakończeniu zlecenia",
    description: "Poprzednia agencja nie wypłaciła 5 dni niewykorzystanego urlopu po rozwiązaniu zlecenia w sierpniu. Wypłacono pełną zaległość £486 po interwencji ACAS.",
    sector: "Przemysł spożywczy",
    employer: "Greencore Group",
    status: "resolved",
    priority: "low",
    createdAt: "2026-08-10T14:00:00Z",
    updatedAt: "2026-09-02T16:30:00Z",
    notes: [
      {
        id: "note_301",
        text: "Wypłata wpłynęła na konto bankowe. Sprawa pomyślnie zamknięta.",
        date: "2026-09-02 16:30",
        author: "Artur Kowalski"
      }
    ]
  }
];

export const initialForumPosts: ForumPost[] = [
  {
    id: "qa_app_01",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · Czat AI",
    title: "Jak przeprowadzić konsultację z Elonem, wybrać tryb doradczy (Prawo Pracy vs Związki) i wygenerować pismo prosto z rozmowy?",
    content: "Główny czat z Elonem analizuje Twój problem pod kątem brytyjskich ustaw (Employment Rights Act 1996, Working Time Regulations 1998, kodeks ACAS) i automatycznie przygotowuje gotowe pismo po angielsku na podstawie faktów podanych w rozmowie.",
    tag: "Czat AI i Głos",
    statuteOrFeatureBadge: "Tryb AI + Koperta Pisma EN",
    whereToGo: "Dolny pasek nawigacji → Środkowa ruszająca się głowa Elona (Zakładka: Czat)",
    whatToSelect: [
      "Nad polem tekstowym kliknij pastylkę aktywnego trybu AI, aby wybrać perspektywę: 'Prawo Pracy (Employment Law)' lub 'Związki Zawodowe (Trade Union)'.",
      "Wpisz opis problemu w polu czatu lub zaznacz jedną z gotowych sugestii startowych (np. 'Nie zapłacili mi za nadgodziny i potrącili z payslipu') i kliknij pomarańczowy przycisk 'Wyślij'.",
      "Gdy pod odpowiedzią Elona pojawi się animowana karta koperty, kliknij przycisk 'Otwórz wygenerowane pismo EN' lub 'Kopiuj pismo'.",
      "Na komputerze lub poprzez przycisk 'Podsumowanie prawne' sprawdź prawy panel boczny z wyodrębnionymi na żywo terminami (Deadlines) i paragrafami."
    ],
    whatYouGet: "Otrzymujesz natychmiastową diagnozę prawną po polsku, wykaz ustawowych terminów (np. 3 miesiące mniej 1 dzień do ACAS) oraz spersonalizowane oficjalne pismo po angielsku gotowe do wysłania do HR.",
    actionLink: {
      label: "Wejdź teraz do Czatu z Elonem →",
      targetTab: "chat"
    },
    upvotes: 68,
    createdAt: "2026-10-25T10:00:00Z",
    comments: [
      {
        id: "c_qa_1",
        author: "Marek Nowak",
        text: "Najlepsze jest to, że jak napiszę w czacie ile godzin brakuje na payslipie, Elon sam podstawia tę kwotę do angielskiego pisma w kopercie pod spodem!",
        createdAt: "2026-10-25T11:15:00Z"
      }
    ]
  },
  {
    id: "qa_app_02",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · Głos & Menu Dymka",
    title: "Jak korzystać z błyskawicznego dyktowania głosowego (Speech-to-Text), czytania na głos (Read Aloud) i menu podręcznego dymków?",
    content: "Nie musisz pisać długich wiadomości na klawiaturze telefonu po nocnej zmianie. Możesz podyktować swój problem głosem, odsłuchać odpowiedź Elona z regulacją tempa oraz zarządzać każdą wiadomością przez przytrzymanie dymka.",
    tag: "Czat AI i Głos",
    statuteOrFeatureBadge: "Dyktowanie Live + Long-Press Menu",
    whereToGo: "Zakładka: Czat → Dolne przyciski przy głowie Elona ('Dyktuj' / 'Odsłuchaj') lub przytrzymanie dymka wiadomości",
    whatToSelect: [
      "Aby mówić zamiast pisać: kliknij przycisk 'Dyktuj' (ikona mikrofonu po lewej stronie głowy Elona) – tekst pojawia się w ułamku sekundy na żywo podczas mówienia.",
      "Aby odsłuchać odpowiedź: kliknij 'Odsłuchaj' pod dymkiem Elona lub na dolnym pasku po prawej stronie głowy robota i wybierz tempo ('0.85x', '1x', '1.15x', '1.3x').",
      "Aby otworzyć menu wiadomości: przytrzymaj palcem (long-press) lub kliknij prawym przyciskiem myszy dowolny dymek czatu i zaznacz: 'Przypnij do sprawy', 'Kopiuj tekst', 'Zgłoś jako błędne' lub 'Usuń wiadomość'."
    ],
    whatYouGet: "Błyskawiczną zamianę mowy na tekst bez oczekiwania, wygodny odsłuch audio z wizualizacją fali głosowej oraz pełną kontrolę nad zapisywaniem i porządkowaniem wiadomości.",
    actionLink: {
      label: "Przetestuj głos i dymki w Czacie →",
      targetTab: "chat"
    },
    upvotes: 54,
    createdAt: "2026-10-25T09:30:00Z",
    comments: [
      {
        id: "c_qa_2",
        author: "Pawel_UK",
        text: "Dyktowanie na żywo działa teraz błyskawicznie – od razu widać każde wypowiedziane słowo w pasku wpisywania.",
        createdAt: "2026-10-25T10:40:00Z"
      }
    ]
  },
  {
    id: "qa_app_03",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · Generator Pism UK",
    title: "Jak wygenerować oficjalne pismo do HR po angielsku (np. Wezwanie do zapłaty nadgodzin lub Formal Grievance) i pobrać PDF?",
    content: "Zakładka Pisma zawiera gotowe, zgodne z prawem brytyjskim szablony przedprocesowe. Twoje dane z profilu oraz dane pracodawcy uzupełniają się w nich automatycznie.",
    tag: "Pisma i Generator PDF",
    statuteOrFeatureBadge: "Wzory ACAS / ERA 1996 + Eksport PDF",
    whereToGo: "Dolny pasek nawigacji → Zakładka: Pisma (druga ikona od lewej)",
    whatToSelect: [
      "Na górnym pasku filtrów zaznacz interesującą Cię kategorię: 'Wynagrodzenia & Płace', 'Skargi (Grievance)', 'Chorobowe (SSP)', 'Dane osobowe (SAR)' lub 'Zwolnienia & Spory'.",
      "Z listy po lewej stronie zaznacz konkretny wzór pisma (np. 'Unlawful Deduction from Wages – Section 13 ERA 1996').",
      "W formularzu uzupełnij szczegóły sporu (np. brakującą kwotę £ i datę zmiany), a następnie kliknij przycisk 'Podgląd i wysyłka'.",
      "Pod gotowym dokumentem kliknij 'Pobierz PDF', 'Pobierz pismo (.txt)', 'Kopiuj treść' lub 'Zapisz w wysłanych'."
    ],
    whatYouGet: "Oficjalny brytyjski dokument prawny (Formal Statutory Notice) w języku angielskim z powołaniem na właściwe artykuły ustaw UK, gotowy do wydruku jako PDF lub wysłania e-mailem do HR.",
    actionLink: {
      label: "Otwórz Generator Pism UK →",
      targetTab: "templates",
      targetTemplateId: "unpaid_wages"
    },
    upvotes: 79,
    createdAt: "2026-10-24T18:20:00Z",
    comments: []
  },
  {
    id: "qa_app_04",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · ACAS Tone Shield",
    title: "Jak działa Strażnik Tonu Prawnego AI (ACAS Tone Shield) i jak zneutralizować emocjonalne zwroty przed wysłaniem pisma?",
    content: "W brytyjskim prawie pracy użycie agresywnych słów, gróźb lub wyzwisk w piśmie do HR może zostać wykorzystane przeciwko pracownikowi jako podstawa dyscyplinarki (Gross Misconduct). Strażnik Tonu chroni Cię przed tym błędem.",
    tag: "Pisma i Generator PDF",
    statuteOrFeatureBadge: "Strażnik Tonu ACAS (Tone Shield)",
    whereToGo: "Zakładka: Pisma → Wybierz dowolny wzór → Sekcja: Strażnik Tonu Prawnego AI nad formularzem",
    whatToSelect: [
      "Wpisz opis sytuacji w polach formularza pisma (lub kliknij przycisk 'Przetestuj detektor agresji', aby zobaczyć działanie na żywo).",
      "Jeśli Strażnik podświetli emocjonalne lub konfrontacyjne słowa na pomarańczowo/czerwono, zaznacz przycisk 'Zastąp bezpiecznym zwrotem prawnym' przy danej frazie.",
      "Możesz też kliknąć jednym ruchem 'Zneutralizuj wszystkie oflagowane zwroty (ACAS)' albo podczas finalizacji wybrać 'Zamień na język prawny i finalizuj pismo'."
    ],
    whatYouGet: "Twoje pismo zachowuje 100% stanowczości prawnej, ale wszystkie ryzykowne emocjonalnie sformułowania zostają zastąpione profesjonalnym słownictwem akceptowanym przez Employment Tribunal.",
    actionLink: {
      label: "Sprawdź Strażnika Tonu w Pismach →",
      targetTab: "templates",
      targetTemplateId: "formal_grievance"
    },
    upvotes: 47,
    createdAt: "2026-10-24T15:10:00Z",
    comments: []
  },
  {
    id: "qa_app_05",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · Akta Sprawy",
    title: "Jak założyć nową sprawę pracowniczą, prowadzić oś czasu dowodów i zarządzać statusem sporu?",
    content: "Każdy spór z pracodawcą lub agencją warto prowadzić w osobnej teczce. W zakładce Sprawy gromadzisz chronologiczną oś czasu wydarzeń, notatki ze spotkań z kierownikiem oraz przypięte porady z czatu.",
    tag: "Sprawy i Przypięte Dowody",
    statuteOrFeatureBadge: "Case Workspace + Oś Czasu",
    whereToGo: "Dolny pasek nawigacji → Zakładka: Sprawy (pierwsza ikona od lewej)",
    whatToSelect: [
      "Kliknij przycisk 'Nowa sprawa' w prawym górnym rogu (lub zapisz bieżącą rozmowę przyciskiem 'Zapisz jako sprawę' w czacie).",
      "W oknie tworzenia sprawy wpisz tytuł, nazwę pracodawcy/agencji, wybierz branżę i zaznacz priorytet ('Niski', 'Średni', 'Wysoki'), po czym kliknij 'Utwórz sprawę'.",
      "Kliknij na kartę sprawy, aby ją rozwinąć: wpisz nowe wydarzenie w polu 'Dodaj wpis do sprawy' lub kliknij 'Zapytaj Elona o tę sprawę', aby kontynuować czat w kontekście tych akt.",
      "Gdy odzyskasz pieniądze lub rozwiążesz spór, zaznacz 'Oznacz jako rozwiązaną'."
    ],
    whatYouGet: "Uporządkowane cyfrowe dossier sporu (Case Dossier) z dokładnymi datami, dowodami i historią działań – gotowe do przedstawienia reprezentantowi związku zawodowego lub mediatorowi ACAS.",
    actionLink: {
      label: "Przejdź do zakładki Sprawy →",
      targetTab: "cases"
    },
    upvotes: 63,
    createdAt: "2026-10-23T19:00:00Z",
    comments: []
  },
  {
    id: "qa_app_06",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · Pin to Case",
    title: "Jak przypiąć kluczową odpowiedź Elona z czatu bezpośrednio do wybranej sprawy ('Przypnij do sprawy / Pin to Case')?",
    content: "Podczas rozmowy z Elonem możesz jednym ruchem wyodrębnić najważniejszą poradę, wyliczenie nadgodzin lub podstawę prawną i przypiąć ją na stałe do teczki swojej sprawy.",
    tag: "Sprawy i Przypięte Dowody",
    statuteOrFeatureBadge: "Przypięte Elementy · Pinned Items",
    whereToGo: "Zakładka: Czat → Przytrzymaj (Long-press) lub kliknij prawym przyciskiem myszy dymek wiadomości",
    whatToSelect: [
      "W oknie czatu przytrzymaj palcem lub kliknij prawym przyciskiem myszy dymek z odpowiedzią Elona (lub własną wiadomość).",
      "W menu kontekstowym zaznacz pierwszą pozycję: 'Przypnij do sprawy (Pin to Case)' – zobaczysz pod spodem nazwę docelowej sprawy.",
      "Na dymku pojawi się zielona pastylka 'Przypięto do sprawy' – kliknij ją, aby natychmiast otworzyć tę sprawę w zakładce Sprawy na sekcji 'Przypięte elementy z czatu · Pinned Items'."
    ],
    whatYouGet: "Wyodrębniony tekst wiadomości trafia bezpośrednio do dedykowanej sekcji 'Przypięte elementy z czatu' wewnątrz Twojej sprawy, skąd możesz go w każdej chwili skopiować lub odpiąć.",
    actionLink: {
      label: "Zobacz Przypięte Elementy w Sprawach →",
      targetTab: "cases"
    },
    upvotes: 58,
    createdAt: "2026-10-23T16:45:00Z",
    comments: [
      {
        id: "c_qa_6",
        author: "Dorota_L",
        text: "Super funkcja! Przypięłam sobie wyliczenie brakujących 12h i paragraf Section 13 ERA 1996 prosto do mojej sprawy z Amazonem.",
        createdAt: "2026-10-23T17:30:00Z"
      }
    ]
  },
  {
    id: "qa_app_07",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · Audytor Payslipów",
    title: "Jak zeskanować aparatem lub wgrać odcinek wypłaty (Payslip) i uruchomić automatyczny Audyt AI?",
    content: "Moduł dokumentów w Profilu potrafi przeanalizować Twój payslip, umowę o pracę, grafik lub pismo z HR – wykrywając zaniżoną stawkę godzinową oraz bezprawne potrącenia (np. za buty robocze PPE).",
    tag: "Audyt Payslipu i Dokumenty",
    statuteOrFeatureBadge: "Camera AI Scanner + Payslip Audit",
    whereToGo: "Dolny pasek nawigacji → Zakładka: Profil → Pod-zakładka: Dokumenty & Payslipy",
    whatToSelect: [
      "Wejdź w zakładkę 'Profil' (prawy dolny róg), a następnie na pasku pod-zakładek zaznacz 'Dokumenty & Payslipy'.",
      "Kliknij 'Skanuj aparatem (Camera AI)', aby zrobić zdjęcie dokumentu, lub 'Wgraj dokument / payslip', aby wybrać plik PDF/JPG z telefonu lub komputera.",
      "Przy wgranym dokumencie kliknij przycisk 'Audyt AI z Elonem' (możesz też zmienić kategorię dokumentu z listy rozwijanej, np. na 'PDF Paystub' lub 'Employment Contract')."
    ],
    whatYouGet: "Kompletny raport z audytu wypłaty: wyliczoną realną stawkę godzinową względem National Living Wage, status naliczenia Holiday Pay (12.07%) oraz listę wykrytych naruszeń wraz z rekomendacją prawną.",
    actionLink: {
      label: "Otwórz Dokumenty i Audyt Payslipu →",
      targetTab: "profile",
      targetProfileSubTab: "docs"
    },
    upvotes: 72,
    createdAt: "2026-10-22T14:20:00Z",
    comments: []
  },
  {
    id: "qa_app_08",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · Profil & Karta PRO",
    title: "Gdzie zapisać szybkie notatki dla Elona (Kierownik, Zmiana, Umowa), znaleźć firmę po kodzie pocztowym UK i sprawdzić Kartę Członkowską?",
    content: "Elon pamięta fakty zapisane w Twoim profilu i notatkach, dzięki czemu nie musisz w każdej rozmowie powtarzać, jak nazywa się Twój menadżer, jaką masz stawkę godzinową ani jaki jest adres siedziby pracodawcy.",
    tag: "Notatki, Karta PRO i Offline",
    statuteOrFeatureBadge: "Karta PRO + Wyszukiwarka Companies House",
    whereToGo: "Dolny pasek nawigacji → Zakładka: Profil (sekcja 'Notatki i karta PRO' oraz 'Dane osobowe')",
    whatToSelect: [
      "W górnej części zakładki 'Profil' przejrzyj kafle pamięci Elona ('Kierownik', 'Zmiana nocna', 'Umowa') lub kliknij kafelek 'Dodaj notatkę', aby dopisać ważny fakt.",
      "Sprawdź swoją 'Kartę Członkowską ask Elon' z indywidualnym numerem konta oraz statusem planu PRO / DEMO.",
      "W sekcji 'Dane pracodawcy / agencji' kliknij przycisk 'Znajdź pracodawcę (UK Postcode / Firma)', wpisz kod pocztowy lub nazwę firmy i zaznacz 'Wybierz ten adres'.",
      "Na dole formularza kliknij 'Zapisz zmiany w profilu'."
    ],
    whatYouGet: "Trwałą pamięć kontekstową asystenta AI oraz automatyczne podstawianie Twojego imienia, adresu, stawki godzinowej i numeru Companies House pracodawcy we wszystkich generowanych pismach.",
    actionLink: {
      label: "Wejdź do Profilu i Karty PRO →",
      targetTab: "profile",
      targetProfileSubTab: "details"
    },
    upvotes: 51,
    createdAt: "2026-10-21T12:10:00Z",
    comments: []
  },
  {
    id: "qa_app_09",
    author: "Elon · Przewodnik Systemowy",
    authorRole: "Oficjalna Instrukcja ask Elon · Szybkie Akcje & Offline",
    title: "Jak wywołać kołowe menu Szybkich Akcji (Słownik Prawny, Szybkie Szukanie) oraz szufladę z Pismami Elona i ochroną Offline?",
    content: "Aplikacja posiada dwa szybkie centra dowodzenia dostępne z każdego ekranu: rozsuwane menu kołowe pod głową Elona oraz cztero-zakładkową szufladę boczną pod ikoną Menu w nagłówku.",
    tag: "Notatki, Karta PRO i Offline",
    statuteOrFeatureBadge: "Radial Menu + Szuflada 4-w-1 + Offline",
    whereToGo: "Środkowa głowa Elona (przytrzymanie / prawy klik) lub przycisk 'Menu ☰' w prawym górnym rogu ekranu",
    whatToSelect: [
      "Przytrzymaj palcem (long-press) lub kliknij prawym przyciskiem myszy ruchomą głowę Elona na dolnym pasku – wybierz jedną z 3 ikon: 'Nowa Sprawa', 'Słownik Prawny' lub 'Szybkie Szukanie'.",
      "Kliknij przycisk 'Menu (☰)' w prawym górnym rogu nagłówka i przełączaj między 4 zakładkami: 'Menu', 'Historia' (niezapisane czaty), 'Notatki' oraz 'Pisma Elona' (pełne archiwum z podglądem A4).",
      "Aby przetestować ochronę bez zasięgu w magazynie: kliknij wskaźnik statusu sieci ('Online' / 'Offline') w górnym nagłówku lub w zakładce 'Profil → Ustawienia & Offline'."
    ],
    whatYouGet: "Błyskawiczny dostęp do słownika pojęć brytyjskiego prawa pracy (np. Constructive Dismissal, ACAS, TUPE), globalnej wyszukiwarki oraz stuprocentową ochronę szkiców pism i wiadomości nawet przy utracie internetu.",
    actionLink: {
      label: "Otwórz Słownik Prawny UK →",
      openModal: "legalDict"
    },
    upvotes: 49,
    createdAt: "2026-10-20T17:00:00Z",
    comments: []
  },
  {
    id: "post_1",
    author: "Marek_K",
    authorRole: "Magazynier · Unite Union",
    title: "Czy agencja może zabrać wyrobione godziny Holiday Pay przy zmianie kontraktu lub zakończeniu zlecenia?",
    content: "Przechodzę z agencji na stały kontrakt bezpośrednio w magazynie DHL. Agencja twierdzi, że mój niewykorzystany urlop 'przepada', bo kończę u nich umowę. Zgodnie z Working Time Regulations 1998 muszą wypłacić ekwiwalent pieniężny za każdą wyrobioną godzinę!",
    tag: "Prawo Pracy UK w Praktyce",
    statuteOrFeatureBadge: "Reg. 14 Working Time Regulations 1998",
    whereToGo: "Zakładka: Pisma → Kategoria: Wynagrodzenia & Płace (lub Szuflada Menu ☰ → Pisma Elona → Urlop i Czas Pracy)",
    whatToSelect: [
      "Wejdź w zakładkę 'Pisma' lub otwórz 'Menu ☰ → Pisma Elona' i zaznacz temat 'Urlop i Czas Pracy'.",
      "Wybierz pismo o niewypłacony ekwiwalent urlopowy (Holiday Pay in Lieu – Reg. 14 WTR 1998 & s.13 ERA 1996).",
      "Wpisz liczbę niewykorzystanych dni/godzin urlopu oraz kwotę zaległości i pobierz gotowe wezwanie PDF do agencji."
    ],
    whatYouGet: "Formalne przedprocesowe wezwanie do zapłaty ekwiwalentu za niewykorzystany urlop ustawowy (5.6 tygodnia rocznie proporcjonalnie) z wyznaczeniem 7 dni na przelew przed zgłoszeniem do ACAS.",
    actionLink: {
      label: "Otwórz wzór wezwania o zapłatę →",
      targetTab: "templates",
      targetTemplateId: "unpaid_wages"
    },
    upvotes: 84,
    createdAt: "2026-10-19T14:10:00Z",
    comments: [
      {
        id: "c_1",
        author: "Pawel_UK",
        text: "Absolutnie nie może przepaść! Zgodnie z Working Time Regulations 1998, przy zakończeniu zatrudnienia agencyjnego mają ustawowy obowiązek rozliczyć każdą godzinę. Użyj szablonu pisma z tej aplikacji – mi oddali £340 w tydzień.",
        createdAt: "2026-10-19T15:20:00Z"
      },
      {
        id: "c_2",
        author: "Elon (Asystent AI)",
        text: "Dokładnie tak jak pisze Paweł. Zgodnie z Reg. 14 Working Time Regulations 1998, pracownik agencyjny ma bezwzględne prawo do Payment in Lieu of Accrued Holiday. Wyślij pismo powołując się na s.13 Employment Rights Act 1996.",
        createdAt: "2026-10-19T15:35:00Z"
      }
    ]
  },
  {
    id: "post_2",
    author: "Elena_R",
    authorRole: "Care Assistant · NHS & Domiciliary Care",
    title: "Brak zapłaty za czas dojazdu między podopiecznymi (Care Worker) a spadek stawki poniżej National Living Wage",
    content: "Jeśli pracujesz w opiece środowiskowej (domiciliary care) i agencja nie płaci za czas przejazdu między domami podopiecznych, Twoja realna stawka godzinowa często spada poniżej ustawowego minimum (National Minimum Wage Regulations 2015).",
    tag: "Prawo Pracy UK w Praktyce",
    statuteOrFeatureBadge: "National Minimum Wage Act 1998",
    whereToGo: "Zakładka: Profil → Dokumenty & Payslipy (Audyt AI) oraz Zakładka: Pisma → Wezwanie do zapłaty",
    whatToSelect: [
      "Wgraj swój odcinek wypłaty w 'Profil → Dokumenty & Payslipy' i kliknij 'Audyt AI z Elonem', aby porównać łączny czas pracy i dojazdów z wypłaconą kwotą.",
      "Następnie wejdź w 'Czat' i poproś Elona o wyliczenie niedopłaty za czas przejazdów między klientami (Travel Time Assignment).",
      "Wygeneruj oficjalne wezwanie Section 13 ERA 1996 / NMW Act 1998 i zapisz sprawę w zakładce 'Sprawy'."
    ],
    whatYouGet: "Dokładne wyliczenie zaniżenia stawki poniżej National Living Wage oraz formalne pismo wzywające pracodawcę do wyrównania zaległości (nawet do 2 lat wstecz przed Trybunałem lub przez HMRC NMW Enforcement).",
    actionLink: {
      label: "Sprawdź swój Payslip w Audytorze →",
      targetTab: "profile",
      targetProfileSubTab: "docs"
    },
    upvotes: 62,
    createdAt: "2026-10-18T10:00:00Z",
    comments: [
      {
        id: "c_3",
        author: "Dorota_L",
        text: "Dziękuję za tę instrukcję! Właśnie wrzuciłam payslip do audytu w Elon i faktycznie przez czas dojazdu wychodziło mi £10.10/h. Składam formal grievance.",
        createdAt: "2026-10-18T12:45:00Z"
      }
    ]
  },
  {
    id: "post_3",
    author: "Tomasz_Bud",
    authorRole: "Stolarz · CIS Subcontractor",
    title: "Potrącenia CIS 20% na budowie a ukryty stosunek pracy (Worker Status) – jak odzyskać urlop i chorobowe?",
    content: "Pracuję dla jednej firmy budowlanej od 14 miesięcy, dają mi narzędzia, wyznaczają godziny 7:30–16:30 i nie mogę wysłać zastępcy (brak Right of Substitution). Mimo że odliczają CIS, według prawa UK (sprawa Pimlico Plumbers) przysługuje mi status 'Worker' i pełny płatny urlop!",
    tag: "Prawo Pracy UK w Praktyce",
    statuteOrFeatureBadge: "Section 230(3)(b) ERA 1996 · Worker Status",
    whereToGo: "Zakładka: Czat (Tryb: Prawo Pracy) → Konsultacja statusu 'Worker vs Self-Employed' + Zakładka: Sprawy",
    whatToSelect: [
      "Wejdź w 'Czat', wybierz tryb 'Prawo Pracy' i opisz warunki współpracy (kto zapewnia narzędzia, czy masz narzucone godziny i czy możesz wysłać zastępcę).",
      "Przytrzymaj odpowiedź Elona z analizą testu statusu pracowniczego i zaznacz 'Przypnij do sprawy (Pin to Case)'.",
      "W zakładce 'Pisma' wybierz wniosek o wydanie dokumentacji czasu pracy i umów (Subject Access Request – Art. 15 UK GDPR), aby zabezpieczyć dowody obecności na budowie."
    ],
    whatYouGet: "Analizę spełnienia przesłanek 'Worker Status' (Section 230 ERA 1996), zabezpieczone dowody w teczce sprawy oraz wniosek SAR/wezwanie o wypłatę zaległego Holiday Pay.",
    actionLink: {
      label: "Otwórz wniosek o dokumentację SAR →",
      targetTab: "templates",
      targetTemplateId: "sar_data_request"
    },
    upvotes: 45,
    createdAt: "2026-10-17T18:00:00Z",
    comments: []
  }
];

export const initialDocuments: UserDocument[] = [
  {
    id: "doc_01",
    name: "Payslip_September_2026_Amazon.pdf",
    type: "payslip",
    categoryTag: "PDF Paystub",
    uploadSource: "sample",
    mimeType: "application/pdf",
    uploadDate: "2026-10-12",
    fileSize: "284 KB",
    auditResult: {
      valid: false,
      summary: "Wykryto 2 nieprawidłowości: potrącenie za PPE oraz zaniżoną stawkę za pracę w niedzielę.",
      calculatedHourly: 12.10,
      holidayPayStatus: "Naliczone poprawnie (12.07% proporcjonalnie)",
      minimumWageCompliance: true,
      items: [
        {
          issue: "Potrącenie £65.00 pod pozycją 'Safety Boots'",
          severity: "error",
          recommendation: "Zgodnie z Health and Safety at Work etc. Act 1974 Section 9, pracodawca NIE MOŻE obciążać pracownika kosztami wymaganego sprzętu ochrony osobistej (PPE)."
        },
        {
          issue: "Brak widocznej stawki premiowej za 8h nocnych",
          severity: "warning",
          recommendation: "Zweryfikuj punkt 4 umowy o pracę dotyczący Night Shift Premium Allowance."
        }
      ]
    }
  },
  {
    id: "doc_02",
    name: "Employment_Contract_Permanent_FullTime.pdf",
    type: "contract",
    categoryTag: "Employment Contract",
    uploadSource: "sample",
    mimeType: "application/pdf",
    uploadDate: "2024-03-20",
    fileSize: "1.2 MB",
    auditResult: {
      valid: true,
      summary: "Umowa standardowa zgodna z Employment Rights Act 1996 Section 1 Statement.",
      items: [
        {
          issue: "Klauzula o okresie wypowiedzenia (Notice Period)",
          severity: "info",
          recommendation: "Przysługuje Ci 1 tydzień ustawowego wypowiedzenia za każdy przepracowany rok (Statutory Minimum Notice)."
        }
      ]
    }
  }
];

export const initialNotes: WorkplaceNote[] = [
  {
    id: "note_spec_1",
    title: "Kierownik",
    date: "2026-09-12",
    description: "John Smith",
    category: "Rozmowa z przełożonym"
  },
  {
    id: "note_spec_2",
    title: "Zmiana nocna",
    date: "2026-09-15",
    description: "Od 22:00, 4 noce w tygodniu",
    category: "Godziny i Grafik"
  },
  {
    id: "note_spec_3",
    title: "Umowa",
    date: "2026-03-01",
    description: "Zero-hours, od marca",
    category: "Godziny i Grafik"
  },
  {
    id: "note_1",
    title: "Rozmowa z kierownikiem zmiany ws. nadgodzin",
    date: "2026-10-15",
    description: "Zgłosiłem menadżerowi John Smith brakujące 12h na payslipie (160h zamiast 172h z grafiku). Odpowiedział, że 'musi to sprawdzić z agencją'.",
    category: "Wypłata i Potrącenia"
  }
];

export const initialBroadcastMessages: BroadcastMessage[] = [
  {
    id: "bmsg_1",
    title: "Aktualizacja stawek National Living Wage 2026/2027",
    content: "Rząd Wielkiej Brytanii opublikował zalecenia Low Pay Commission. Sprawdź w Elon, czy Twoja stawka wzrośnie od kwietnia.",
    date: "2026-10-20",
    unread: true
  },
  {
    id: "bmsg_2",
    title: "Witaj w zaktualizowanym asystencie ask Elon!",
    content: "Teraz możesz generować oficjalne pisma ACAS, audytować payslipy i prowadzić swoje sprawy w jednym bezpiecznym miejscu.",
    date: "2026-10-23",
    unread: false
  }
];

export const initialSentLetters: SentLetter[] = [
  {
    id: "sent_init_1",
    templateId: "settlement_agreement",
    title: "Pismo do HR – niewypłacony ekwiwalent za urlop (Holiday Pay)",
    titlePl: "Pismo do HR – niewypłacony ekwiwalent za urlop (Holiday Pay)",
    categoryLabelPl: "PISMO O URLOP",
    caseSummaryPl: "Sprawa: Agencja nie zapłaciła mi za 3 dni urlopu (£486)",
    recipient: "Greencore Group",
    date: "23.10.2026",
    primaryTag: "Settlement",
    tags: ["Settlement", "Wages", "Contract"],
    statutoryReference: "Reg. 14 Working Time Regulations 1998 · s.13 ERA 1996",
    content: `PRIVATE & CONFIDENTIAL — FORMAL STATUTORY NOTICE
====================================================================
FROM (EMPLOYEE / WORKER):
Full Name:          Artur Kowalski
Home Address:       42 Victoria Road, Dartford, DA1 5DJ
Telephone:          +44 7700 900342
Email Address:      artur.kowalski@example.co.uk
Employee / Case ID: #ELON-89241

TO (EMPLOYER / RESPONDENT):
Employer Name:      Greencore Group
Department:         Human Resources & Payroll Department
Date of Notice:     23 October 2026
Statutory Basis:    Regulation 14 Working Time Regulations 1998 & Section 13 ERA 1996
====================================================================

SUBJECT: FORMAL DEMAND FOR ACCRUED STATUTORY HOLIDAY PAY IN LIEU (£486.00)

Dear Human Resources and Payroll Department,

I write pursuant to Regulation 14 of the Working Time Regulations 1998 and Section 13 of the Employment Rights Act 1996 regarding the non-payment of my accrued statutory annual leave entitlement (Holiday Pay) amounting to £486.00.

1. STATUTORY ENTITLEMENT:
Under Regulation 13 and 13A of the Working Time Regulations 1998, every worker in the United Kingdom is legally entitled to 5.6 weeks of paid annual leave per leave year. Upon termination or transfer of assignment, the employer is under an absolute statutory obligation to pay compensation in lieu of all untaken accrued holiday.

2. REQUIRED REMEDY WITHIN 7 DAYS:
Please process the outstanding payment of £486.00 to my nominated bank account within seven (7) calendar days and provide an itemised payslip confirming the calculation prior to ACAS Early Conciliation.

Yours sincerely,

Artur Kowalski
Residential Address: 42 Victoria Road, Dartford, DA1 5DJ
Telephone: +44 7700 900342
Email: artur.kowalski@example.co.uk`
  },
  {
    id: "sent_init_2",
    templateId: "unpaid_wages",
    title: "Pismo do HR – niewypłacone nadgodziny",
    titlePl: "Pismo do HR – niewypłacone nadgodziny",
    categoryLabelPl: "WEZWANIE DO ZAPŁATY",
    caseSummaryPl: "Sprawa: Brak 12 nadgodzin ze zmiany nocnej i potrącenie PPE",
    recipient: "Amazon Fulfilment LCY2",
    date: "23.10.2026",
    primaryTag: "Wages",
    tags: ["Wages", "Contract"],
    statutoryReference: "Section 13 Employment Rights Act 1996 · Health & Safety Act 1974 s.9",
    content: `PRIVATE & CONFIDENTIAL — FORMAL STATUTORY NOTICE
====================================================================
FROM (EMPLOYEE / WORKER):
Full Name:          Artur Kowalski
Home Address:       42 Victoria Road, Dartford, DA1 5DJ
Telephone:          +44 7700 900342
Email Address:      artur.kowalski@example.co.uk
Job Title:          Warehouse Operative (Inbound)
Contract & Rate:    PERMANENT (£13.50/hr · 40 hrs/wk)
Start Date:         2024-03-15
Employee / Case ID: #ELON-89241

TO (EMPLOYER / RESPONDENT):
Employer Name:      Amazon Fulfilment LCY2
Company Reg. No:    03223028
Employer Address:   London Distribution Park, Windrush Drive, Tilbury RM18 7AN
Department:         Human Resources & Payroll Department

Date of Notice:     23 October 2026
Statutory Basis:    Section 13 Employment Rights Act 1996 · s.9 HSWA 1974
====================================================================

SUBJECT: FORMAL NOTICE OF UNLAWFUL DEDUCTION FROM WAGES & UNPAID OVERTIME (£227.00)

Dear Human Resources and Payroll Department,

I write pursuant to my permanent contract of employment (40 hours per week at £13.50/hr, commenced 2024-03-15) and Section 13 of the Employment Rights Act 1996 regarding:
1. Omission of 12 contracted night-shift overtime hours (£162.00) worked on 14 September 2026;
2. Unauthorised deduction of £65.00 for safety footwear (PPE) in breach of Section 9 of the Health and Safety at Work etc. Act 1974.

Please process the total contractual reimbursement of £227.00 within seven (7) calendar days.

Yours sincerely,

Artur Kowalski
Warehouse Operative (Inbound)
Residential Address: 42 Victoria Road, Dartford, DA1 5DJ
Telephone: +44 7700 900342
Email: artur.kowalski@example.co.uk`
  },
  {
    id: "sent_init_3",
    templateId: "formal_grievance",
    title: "Pismo do HR – oficjalna skarga pracownicza (Formal Grievance)",
    titlePl: "Pismo do HR – oficjalna skarga pracownicza (Formal Grievance)",
    categoryLabelPl: "SKARGA DO HR (GRIEVANCE)",
    caseSummaryPl: "Sprawa: Odmowa 20-minutowej przerwy i grafik zmianowy",
    recipient: "Amazon Fulfilment LCY2",
    date: "21.10.2026",
    primaryTag: "Grievance",
    tags: ["Grievance", "Contract"],
    statutoryReference: "ACAS Code No. 1 · s.199 TULRCA 1992 · s.10 ERA 1999",
    content: `PRIVATE & CONFIDENTIAL — FORMAL STATUTORY NOTICE
====================================================================
FROM (EMPLOYEE / WORKER):
Full Name:          Artur Kowalski
Home Address:       42 Victoria Road, Dartford, DA1 5DJ
Telephone:          +44 7700 900342
Email Address:      artur.kowalski@example.co.uk
Job Title:          Warehouse Operative (Inbound)
Contract & Rate:    PERMANENT (£13.50/hr · 40 hrs/wk)
Start Date:         2024-03-15
Employee / Case ID: #ELON-89241

TO (EMPLOYER / RESPONDENT):
Employer Name:      Amazon Fulfilment LCY2
Company Reg. No:    03223028
Employer Address:   London Distribution Park, Windrush Drive, Tilbury RM18 7AN
Department:         Human Resources & Payroll Department

Date of Notice:     21 October 2026
Statutory Basis:    ACAS Code of Practice No. 1 · s.199 TULRCA 1992 · s.10 ERA 1999
====================================================================

SUBJECT: FORMAL WRITTEN GRIEVANCE PURSUANT TO THE ACAS STATUTORY CODE OF PRACTICE

Dear Human Resources Department,

Please accept this letter as a formal written grievance submitted in my capacity as Warehouse Operative (Inbound) at Amazon Fulfilment LCY2 (employed since 2024-03-15), pursuant to the ACAS statutory Code of Practice on Disciplinary and Grievance Procedures (issued under Section 199 of the Trade Union and Labour Relations (Consolidation) Act 1992).

1. NATURE OF FORMAL GRIEVANCE:
I am formally raising a grievance regarding unfair shift allocation, denial of mandatory 20-minute rest breaks under the Working Time Regulations 1998, and breach of the implied contractual term of mutual trust and confidence during my shifts at London Distribution Park, Tilbury RM18 7AN.

2. STATUTORY GRIEVANCE HEARING & RIGHT TO BE ACCOMPANIED:
In accordance with paragraph 32 of the ACAS Code of Practice and Section 10 of the Employment Relations Act 1999, I request that Amazon Fulfilment LCY2 convene a formal grievance hearing within five (5) working days and confirm that I may be accompanied by a Trade Union Representative or colleague.

Yours sincerely,

Artur Kowalski
Warehouse Operative (Inbound)
Residential Address: 42 Victoria Road, Dartford, DA1 5DJ
Telephone: +44 7700 900342
Email: artur.kowalski@example.co.uk`
  }
];

export const initialAdminUsers: AdminManagedUser[] = [
  {
    id: "user_elon_001",
    accountId: "ELON-89241",
    fullName: "Artur Kowalski",
    email: "artur.kowalski@example.co.uk",
    phone: "+44 7700 900342",
    homeAddress: "42 Victoria Road, Dartford, DA1 5DJ",
    city: "Dartford, Kent",
    registeredAt: "2026-03-15",
    employerName: "Amazon Fulfilment LCY2",
    companyNumber: "03223028",
    employerAddress: "London Distribution Park, Windrush Drive, Tilbury RM18 7AN",
    jobTitle: "Warehouse Operative (Inbound)",
    startDate: "2024-03-15",
    hourlyRate: 13.50,
    hoursPerWeek: 40,
    contractType: "permanent",
    industry: "Warehouse / Logistics",
    isPro: true,
    free_access: false,
    subscriptionStatus: "active_pro",
    role: "admin",
    onboarded: true,
    sessionsToday: 4,
    sessionsLast7Days: 19,
    sessionsTotal: 86,
    dailyQueriesCount: 6,
    chatQueriesCount: 28,
    formalCasesCount: 3
  },
  {
    id: "user_elon_002",
    accountId: "AK 2610 9990 3 T",
    fullName: "Anna Kowalska",
    email: "anna.kowalska@gmail.com",
    phone: "+44 7456 218904",
    homeAddress: "18 King Street, Slough, SL1 2B",
    city: "Slough, Berkshire",
    registeredAt: "2026-06-10",
    employerName: "DHL Supply Chain Heathrow",
    companyNumber: "00528867",
    employerAddress: "Unit 4 Heathrow South Cargo Centre, Hounslow TW6 3LW",
    jobTitle: "Order Picker / Packer",
    startDate: "2025-01-12",
    hourlyRate: 12.80,
    hoursPerWeek: 37.5,
    contractType: "agency",
    industry: "Warehouse / Logistics",
    isPro: false,
    free_access: false,
    subscriptionStatus: "free",
    role: "user",
    onboarded: true,
    sessionsToday: 2,
    sessionsLast7Days: 11,
    sessionsTotal: 42,
    dailyQueriesCount: 3,
    chatQueriesCount: 19,
    formalCasesCount: 2
  },
  {
    id: "user_elon_003",
    accountId: "ELON-44109",
    fullName: "Marek Nowak",
    email: "marek.nowak.uk@wp.pl",
    phone: "+44 7811 452090",
    homeAddress: "74 Salford Quays Rd, Manchester, M50 3AB",
    city: "Manchester",
    registeredAt: "2026-04-22",
    employerName: "XPO Logistics Trafford",
    companyNumber: "01862105",
    employerAddress: "Trafford Park Road, Manchester M17 1HG",
    jobTitle: "Forklift Reach Driver",
    startDate: "2023-09-01",
    hourlyRate: 14.90,
    hoursPerWeek: 42,
    contractType: "permanent",
    industry: "Warehouse / Logistics",
    isPro: true,
    free_access: true,
    subscriptionStatus: "free_access",
    role: "user",
    onboarded: true,
    sessionsToday: 5,
    sessionsLast7Days: 24,
    sessionsTotal: 118,
    dailyQueriesCount: 8,
    chatQueriesCount: 54,
    formalCasesCount: 5
  },
  {
    id: "user_elon_004",
    accountId: "ELON-61032",
    fullName: "Elena Radu",
    email: "elena.radu88@yahoo.co.uk",
    phone: "+44 7922 331780",
    homeAddress: "12 Highfield Lane, Birmingham, B15 2TT",
    city: "Birmingham",
    registeredAt: "2026-07-04",
    employerName: "Bupa Care Services UK",
    companyNumber: "01289903",
    employerAddress: "Edgbaston Road, Birmingham B15 1NW",
    jobTitle: "Senior Care Assistant",
    startDate: "2022-11-20",
    hourlyRate: 13.10,
    hoursPerWeek: 36,
    contractType: "permanent",
    industry: "Healthcare / Care Homes",
    isPro: true,
    free_access: false,
    subscriptionStatus: "active_pro",
    role: "user",
    onboarded: true,
    sessionsToday: 1,
    sessionsLast7Days: 9,
    sessionsTotal: 37,
    dailyQueriesCount: 2,
    chatQueriesCount: 16,
    formalCasesCount: 2
  },
  {
    id: "user_elon_005",
    accountId: "ELON-72918",
    fullName: "Piotr Wiśniewski",
    email: "p.wisniewski@outlook.com",
    phone: "+44 7530 889120",
    homeAddress: "95 Armley Road, Leeds, LS12 2QN",
    city: "Leeds, West Yorkshire",
    registeredAt: "2026-08-19",
    employerName: "Greencore Prepared Meals",
    companyNumber: "02569012",
    employerAddress: "unslet Road, Leeds LS10 1JZ",
    jobTitle: "Production Line Operator",
    startDate: "2025-05-03",
    hourlyRate: 11.44,
    hoursPerWeek: 40,
    contractType: "zero_hours",
    industry: "Food Processing",
    isPro: false,
    free_access: false,
    subscriptionStatus: "free",
    role: "user",
    onboarded: true,
    sessionsToday: 3,
    sessionsLast7Days: 14,
    sessionsTotal: 29,
    dailyQueriesCount: 5,
    chatQueriesCount: 22,
    formalCasesCount: 1
  },
  {
    id: "user_elon_006",
    accountId: "ELON-90415",
    fullName: "Katarzyna Zielińska",
    email: "kasia.zielinska@onet.pl",
    phone: "+44 7719 604312",
    homeAddress: "29 Docklands Way, London, E14 9SG",
    city: "London (Canary Wharf)",
    registeredAt: "2026-09-02",
    employerName: "Mitie Facilities Management",
    companyNumber: "01902341",
    employerAddress: "The Shard, 32 London Bridge St, London SE1 9SG",
    jobTitle: "Commercial Supervisor",
    startDate: "2024-01-10",
    hourlyRate: 14.20,
    hoursPerWeek: 35,
    contractType: "permanent",
    industry: "Cleaning & Facilities",
    isPro: true,
    free_access: true,
    subscriptionStatus: "free_access",
    role: "admin",
    onboarded: true,
    sessionsToday: 2,
    sessionsLast7Days: 15,
    sessionsTotal: 64,
    dailyQueriesCount: 4,
    chatQueriesCount: 31,
    formalCasesCount: 4
  }
];

export const initialPromoCodes: PromoCodeItem[] = [
  {
    id: "promo_1",
    code: "ELON3M",
    discountType: "percentage",
    discountValue: 100,
    expiresAt: "2027-12-31",
    description: "100% rabatu (3 miesiące PRO za darmo)",
    usedCount: 124,
    createdAt: "2026-03-01"
  },
  {
    id: "promo_2",
    code: "SOLIDARITY",
    discountType: "percentage",
    discountValue: 50,
    expiresAt: "2027-06-30",
    description: "Rabat -50% na subskrypcję (£4.99/mies.)",
    usedCount: 86,
    createdAt: "2026-04-15"
  },
  {
    id: "promo_3",
    code: "UNITE",
    discountType: "fixed",
    discountValue: 4.00,
    expiresAt: "2027-09-30",
    description: "Zniżka kwotowa -£4.00 dla członków związków (£5.99/mies.)",
    usedCount: 219,
    createdAt: "2026-05-10"
  }
];

export const initialMarketingPopupConfig: MarketingPopupConfig = {
  isActive: false,
  title: "Odzyskaj swoje pieniądze z ask Elon PRO!",
  content:
    "Sprawdź swój payslip, wygeneruj oficjalne pismo Section 13 ERA 1996 po angielsku w 10 sekund i nie pozwól agencji ani szefowi na bezprawne potrącenia. Użyj kodu SOLIDARITY, aby odebrać -50% zniżki!",
  mediaUrl: "/assets/aistudio/grok_video_2026-10-24-04-59-56_1fc97f08.mp4",
  ctaText: "Odbierz rabat PRO",
  updatedAt: "2026-10-25 12:00"
};


