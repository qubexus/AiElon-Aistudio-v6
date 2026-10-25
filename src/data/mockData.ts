import { UserProfile, WorkplaceCase, ForumPost, UserDocument, WorkplaceNote, BroadcastMessage, SentLetter } from "../types";

export const initialUserProfile: UserProfile = {
  id: "user_elon_001",
  accountId: "ELON-89241",
  fullName: "Artur Kowalski",
  email: "artur.kowalski@example.co.uk",
  phone: "+44 7700 900342",
  homeAddress: "42 Victoria Road, Dartford, DA1 5DJ",
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
  role: "user",
  onboarded: true
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
    templateId: "formal_grievance",
    title: "Formal Written Grievance (ACAS Code of Practice No. 1)",
    recipient: "Amazon Fulfilment LCY2",
    date: "21 Oct 2026",
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
  },
  {
    id: "sent_init_2",
    templateId: "settlement_agreement",
    title: "Protected Settlement & ACAS Early Conciliation Proposal (s.111A ERA 1996)",
    recipient: "Greencore Group",
    date: "19 Oct 2026",
    primaryTag: "Settlement",
    tags: ["Settlement", "Wages", "Contract"],
    statutoryReference: "Section 111A & Section 203(3) Employment Rights Act 1996",
    content: `WITHOUT PREJUDICE AND SUBJECT TO CONTRACT
PROTECTED CONVERSATION PURSUANT TO SECTION 111A EMPLOYMENT RIGHTS ACT 1996
====================================================================
FROM (EMPLOYEE / WORKER):
Full Name:          Artur Kowalski
Home Address:       42 Victoria Road, Dartford, DA1 5DJ
Telephone:          +44 7700 900342
Email Address:      artur.kowalski@example.co.uk
Employee / Case ID: #ELON-89241

TO (EMPLOYER / RESPONDENT):
Employer Name:      Greencore Group
Department:         Human Resources Director & Legal Department
Date of Notice:     19 October 2026
Statutory Basis:    Section 111A & Section 203(3) Employment Rights Act 1996
====================================================================

SUBJECT: FORMAL SETTLEMENT PROPOSAL PRIOR TO ACAS EARLY CONCILIATION & EMPLOYMENT TRIBUNAL CLAIM

Dear Sir or Madam,

I write on a "Without Prejudice" basis and pursuant to Section 111A of the Employment Rights Act 1996 with a view to achieving an amicable, commercial settlement to the dispute concerning my accrued statutory holiday pay (£486.00) and termination terms under the Working Time Regulations 1998.

1. PROPOSED SETTLEMENT TERMS:
In full and final settlement of my prospective Employment Tribunal claim, I propose immediate payment of £486.00 representing 5 days of accrued statutory holiday entitlement together with written confirmation of settlement within 7 calendar days.

Yours faithfully,

Artur Kowalski
Residential Address: 42 Victoria Road, Dartford, DA1 5DJ
Telephone: +44 7700 900342
Email: artur.kowalski@example.co.uk`
  },
  {
    id: "sent_init_3",
    templateId: "flexible_working",
    title: "Statutory Notice: Contract Terms, Working Time & Unlawful Deduction (s.13 & s.80F ERA 1996)",
    recipient: "Amazon Fulfilment LCY2",
    date: "18 Oct 2026",
    primaryTag: "Contract",
    tags: ["Contract", "Wages"],
    statutoryReference: "Section 13 & Section 80F ERA 1996 · Working Time Regulations 1998",
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

Date of Notice:     18 October 2026
Statutory Basis:    Section 13 & Section 80F ERA 1996 · Working Time Regulations 1998
====================================================================

SUBJECT: FORMAL NOTICE OF CONTRACTUAL HOURS ENFORCEMENT & UNLAWFUL DEDUCTION (£227.00)

Dear Human Resources and Payroll Department,

I write pursuant to my permanent contract of employment (40 hours per week at £13.50/hr, commenced 2024-03-15) and Section 13 of the Employment Rights Act 1996 regarding:
1. Unauthorised deduction of £65.00 for safety footwear (PPE) in breach of Section 9 of the Health and Safety at Work etc. Act 1974;
2. Omission of 12 contracted night-shift overtime hours (£162.00) worked on 14 September 2026.

Please process the total contractual reimbursement of £227.00 within seven (7) calendar days.

Yours sincerely,

Artur Kowalski
Warehouse Operative (Inbound)
Residential Address: 42 Victoria Road, Dartford, DA1 5DJ
Telephone: +44 7700 900342
Email: artur.kowalski@example.co.uk`
  }
];

