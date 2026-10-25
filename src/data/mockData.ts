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
        author: "Artur Kowalski"
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
    id: "post_1",
    author: "Marek_K",
    authorRole: "Magazynier · Unite Union",
    title: "Czy agencja może zabrać wyrobione godziny holiday pay przy zmianie kontraktu?",
    content: "Przechodzę z agencji na stały kontrakt bezpośrednio w magazynie DHL. Agencja twierdzi, że mój niewykorzystany urlop 'przepada', bo to inny pracodawca. Z tego co wiem z ACAS, muszą wypłacić Payment in Lieu of Holiday. Ktoś miał podobnie?",
    tag: "Magazyn",
    upvotes: 24,
    createdAt: "2026-10-22T14:10:00Z",
    comments: [
      {
        id: "c_1",
        author: "Pawel_UK",
        text: "Absolutnie nie może przapaść! Zgodnie z Working Time Regulations 1998, przy zakończeniu zatrudnienia agencyjnego mają ustawowy obowiązek rozliczyć każdą godzinę. Użyj szablonu pisma z tej aplikacji – mi oddali £340 w tydzień.",
        createdAt: "2026-10-22T15:20:00Z"
      },
      {
        id: "c_2",
        author: "Elon (Asystent AI)",
        text: "Dokładnie tak jak pisze Paweł. Zgodnie z Reg. 14 Working Time Regulations 1998, pracownik agencyjny ma prawo do ekwiwalentu pieniężnego za niewykorzystany urlop ustawowy (5.6 tygodnia rocznie). Wyślij pismo powołując się na s.13 Employment Rights Act 1996.",
        createdAt: "2026-10-22T15:35:00Z"
      }
    ]
  },
  {
    id: "post_2",
    author: "Elena_R",
    authorRole: "Care Assistant · NHS Trust",
    title: "Care worker overtime vs National Living Wage: check your travel time between clients!",
    content: "If you work in domiciliary care and your agency does not pay for travel time between service users' homes, your real hourly pay might drop below the National Living Wage (£11.44/hr). We took this to tribunal with our rep and won back pay for 2 years!",
    tag: "Opieka / NHS",
    upvotes: 42,
    createdAt: "2026-10-20T10:00:00Z",
    comments: [
      {
        id: "c_3",
        author: "Dorota_L",
        text: "Dziękuję za ten wpis! Właśnie wrzuciłam payslip do audytu w Elon i faktycznie przez czas dojazdu wychodziło mi £10.10/h. Składam formal grievance.",
        createdAt: "2026-10-20T12:45:00Z"
      }
    ]
  },
  {
    id: "post_3",
    author: "Tomasz_Bud",
    authorRole: "Stolarz · CIS Subcontractor",
    title: "CIS deduction vs Employee status: Kiedy self-employed jest faktycznie pracownikiem?",
    content: "Pracuję dla jednej firmy budowlanej od 14 miesięcy, dają mi narzędzia, wyznaczają godziny 7:30-16:30 i nie mogę wysłać zastępcy (Right of substitution). Mimo to odliczają 20% CIS i nie płacą za chorobowe ani urlop. Sprawdźcie test statusu pracowniczego!",
    tag: "Budownictwo",
    upvotes: 31,
    createdAt: "2026-10-18T18:00:00Z",
    comments: []
  }
];

export const initialDocuments: UserDocument[] = [
  {
    id: "doc_01",
    name: "Payslip_September_2026_Amazon.pdf",
    type: "payslip",
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
    id: "note_1",
    title: "Rozmowa z kierownikiem zmiany ws. nadgodzin",
    date: "2026-10-15",
    description: "Zgłosiłem menadżerowi Dave brakujące 12h na payslipie. Odpowiedział, że 'musi to sprawdzić z agencją' i kazał czekać 2 tygodnie.",
    category: "Wypłata"
  },
  {
    id: "note_2",
    title: "Otrzymanie pisemnego ostrzeżenia bez spotkania wyjaśniającego",
    date: "2026-10-08",
    description: "Kierownik wręczył mi 'Informal written concern' za rzekome spóźnienie, chociaż bramka elektroniczna potwierdza przyjście o 06:52.",
    category: "Dyscyplina"
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


