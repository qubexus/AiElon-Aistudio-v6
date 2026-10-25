import { LegalTemplate, SentLetter, SentLetterCategoryTag, Locale } from "../types";

export const defaultTemplates: LegalTemplate[] = [
  {
    id: "formal_grievance",
    titleEn: "Formal Letter of Grievance to Employer",
    titlePl: "Oficjalna Skarga Pracownicza (Formal Grievance)",
    titleRo: "Plângere Oficială la Angajator (Formal Grievance)",
    statutoryReference: "ACAS Code of Practice No. 1 on Disciplinary & Grievance Procedures (s.199 TULRCA 1992)",
    category: "Grievance",
    descriptionEn: "Formal statutory workplace grievance under the ACAS Code of Practice regarding unfair treatment, bullying, health & safety violations, or contractual breaches.",
    descriptionPl: "Oficjalne zgłoszenie formalnej skargi (Grievance) u pracodawcy w UK zgodnie z procedurą ACAS. Pracodawca ma prawny obowiązek zwołać spotkanie wyjaśniające.",
    descriptionRo: "Depunerea unei plângeri oficiale la angajator în conformitate cu codul ACAS privind tratamentul incorect sau încălcarea contractului.",
    fields: [
      {
        key: "employee_name",
        labelEn: "Your Full Name",
        labelPl: "Twoje Imię i Nazwisko",
        labelRo: "Numele Tău Complet",
        placeholder: "e.g. Artur Kowalski",
        defaultValue: "Artur Kowalski"
      },
      {
        key: "job_title",
        labelEn: "Job Title / Department",
        labelPl: "Stanowisko / Dział",
        labelRo: "Funcție / Departament",
        placeholder: "e.g. Warehouse Operative / Order Picker",
        defaultValue: "Warehouse Operative (Inbound)"
      },
      {
        key: "employer_name",
        labelEn: "Employer / Company Name",
        labelPl: "Nazwa Pracodawcy / Agencji",
        labelRo: "Numele Companiei",
        placeholder: "e.g. Amazon UK Services Ltd",
        defaultValue: "Amazon Fulfilment LCY2"
      },
      {
        key: "manager_name",
        labelEn: "Recipient / HR Manager",
        labelPl: "Osoba Decyzyjna / Manager HR",
        labelRo: "Manager Resurse Umane",
        placeholder: "e.g. Head of Human Resources",
        defaultValue: "Head of Human Resources"
      },
      {
        key: "grievance_nature",
        labelEn: "Nature of Grievance (Details & Dates)",
        labelPl: "Szczegółowy Opis Problemu i Daty",
        labelRo: "Detalii și Date ale Problemei",
        placeholder: "e.g. Unfair shift allocation, aggressive behaviour from line supervisor, denial of mandatory break times",
        defaultValue: "On multiple occasions during the past month (particularly on 12th and 19th October), I was subjected to discriminatory comments regarding my nationality and denied my statutory 20-minute rest break during 10-hour shifts."
      },
      {
        key: "resolution_sought",
        labelEn: "Resolution Sought",
        labelPl: "Oczekiwane Rozwiązanie Sprawy",
        labelRo: "Soluția Solicitată",
        placeholder: "e.g. Formal investigation, shift reassignment, written apology",
        defaultValue: "Formal investigation under company procedures, immediate cessation of harassment, and a hearing with an independent manager."
      },
      {
        key: "companion_name",
        labelEn: "Union Companion / Representative",
        labelPl: "Imię Przedstawiciela Związkowego",
        labelRo: "Reprezentant Sindical",
        placeholder: "e.g. Trade Union Representative or Colleague",
        defaultValue: "a Trade Union Representative / Accredited Colleague"
      }
    ],
    defaults: {
      employee_name: "Artur Kowalski",
      job_title: "Warehouse Operative",
      employer_name: "Amazon Fulfilment LCY2",
      manager_name: "Human Resources Department",
      grievance_nature: "On multiple occasions during recent shifts, I was subjected to unfair treatment by line supervision and denied my statutory 20-minute rest break during shifts exceeding 6 hours.",
      resolution_sought: "A formal investigation under ACAS procedures, written confirmation of remedial steps, and an impartial grievance hearing.",
      companion_name: "a Trade Union Representative"
    },
    letter: `FORMAL WRITTEN GRIEVANCE
CONFIDENTIAL - TO BE RECORDED IN COMPANY GRIEVANCE REGISTER

Date: {{date}}

TO: {{manager_name}}, {{employer_name}}
FROM: {{employee_name}} ({{job_title}})
SUBJECT: FORMAL GRIEVANCE SUBMISSION PURSUANT TO THE ACAS CODE OF PRACTICE NO. 1

Dear {{manager_name}},

Please accept this letter as a formal submission of a grievance under the company's Grievance Procedure and the ACAS statutory Code of Practice on Disciplinary and Grievance Procedures (issued under Section 199 of the Trade Union and Labour Relations (Consolidation) Act 1992).

1. STATEMENT OF GRIEVANCE:
{{grievance_nature}}

2. LEGAL GROUNDS & COMPANY POLICY BREACHES:
The conduct described above constitutes a serious failure to provide a safe and equitable working environment, contravenes fair employment principles, and breaches the implied contractual duty of mutual trust and confidence.

3. DESIRED RESOLUTION:
In order to resolve this matter satisfactorily, I request the following remedial actions:
{{resolution_sought}}

4. FORMAL GRIEVANCE MEETING & RIGHT TO BE ACCOMPANIED:
In accordance with paragraph 32 of the ACAS Code of Practice and Section 10 of the Employment Relations Act 1999, I request that you convene a formal grievance hearing within five working days of this letter.

I formally notify you of my intention to exercise my statutory right to be accompanied at this meeting by:
Companion: {{companion_name}}.

Please confirm receipt of this grievance in writing and provide details of the meeting time, venue, and the impartial manager assigned to hear this matter.

Yours sincerely,

{{employee_name}}
{{job_title}}`
  },
  {
    id: "unpaid_wages",
    titleEn: "Employer Demand: Unlawful Deduction from Wages & Overtime",
    titlePl: "Wezwanie Pracodawcy: Niewypłacone Wynagrodzenie i Nadgodziny",
    titleRo: "Notificare Angajator: Plata Salariului și a Orelor Suplimentare",
    statutoryReference: "Section 13, Employment Rights Act 1996 & National Minimum Wage Act 1998",
    category: "Wages",
    descriptionEn: "Statutory demand requiring employer to reimburse unlawful pay deductions, missing overtime payments, or unpaid working hours within 7 days.",
    descriptionPl: "Formalne wezwanie do zapłaty zaległych płac, nieopłaconych nadgodzin lub bezprawnych potrąceń z payslipu. Powołanie na art. 13 Employment Rights Act 1996.",
    descriptionRo: "Cerere oficială către angajator pentru plata salariilor restante, a orelor suplimentare și a deducerilor ilegale din fluturaș.",
    fields: [
      {
        key: "employee_name",
        labelEn: "Your Full Name",
        labelPl: "Twoje Imię i Nazwisko",
        labelRo: "Numele Tău",
        placeholder: "e.g. Artur Kowalski",
        defaultValue: "Artur Kowalski"
      },
      {
        key: "employer_name",
        labelEn: "Employer / Payroll Name",
        labelPl: "Pracodawca / Dział Płac",
        labelRo: "Numele Angajatorului",
        placeholder: "e.g. Logistics UK Ltd",
        defaultValue: "Amazon Fulfilment LCY2"
      },
      {
        key: "payroll_contact",
        labelEn: "Payroll / Finance Contact",
        labelPl: "Osoba Kontaktowa ds. Płac",
        labelRo: "Contact Salarii",
        placeholder: "e.g. Payroll Manager",
        defaultValue: "Payroll Manager"
      },
      {
        key: "amount_owed",
        labelEn: "Total Amount Owed (£)",
        labelPl: "Łączna Kwota Zaległości (£)",
        labelRo: "Suma Restantă (£)",
        placeholder: "e.g. 420.50",
        defaultValue: "348.60"
      },
      {
        key: "pay_period",
        labelEn: "Pay Period / Specific Dates",
        labelPl: "Okres Rozliczeniowy / Daty",
        labelRo: "Perioada de Plată",
        placeholder: "e.g. September 2026 payslip",
        defaultValue: "September 2026 pay period (Shift dates: 10th, 14th, 21st)"
      },
      {
        key: "details",
        labelEn: "Breakdown of Missing Hours / Deductions",
        labelPl: "Wyszczególnienie Brakujących Godzin / Potrąceń",
        labelRo: "Detalierea Orelor Lipsă",
        placeholder: "e.g. 24 unpaid hours at £14.50/hr plus £45 training deduction",
        defaultValue: "24 overtime hours worked at standard base rate £12.80/hr were omitted, and £41.40 was arbitrarily deducted under 'uniform charges' without written authorisation."
      }
    ],
    defaults: {
      employee_name: "Artur Kowalski",
      employer_name: "Amazon Fulfilment LCY2",
      payroll_contact: "Payroll Department",
      amount_owed: "348.60",
      pay_period: "Recent monthly pay period",
      details: "24 overtime hours worked at contracted rate were omitted from payroll, alongside an unauthorised uniform/PPE deduction made without prior written consent."
    },
    letter: `FORMAL STATUTORY NOTICE OF UNLAWFUL DEDUCTION FROM WAGES
PURSUANT TO SECTION 13 OF THE EMPLOYMENT RIGHTS ACT 1996

Date: {{date}}

TO: {{payroll_contact}}, {{employer_name}}
FROM: {{employee_name}}
SUBJECT: FORMAL DEMAND FOR RECTIFICATION OF UNLAWFUL DEDUCTION FROM WAGES (£{{amount_owed}})

Dear {{payroll_contact}},

I am writing to formally raise a serious discrepancy regarding my pay for the period {{pay_period}}.

1. PARTICULARS OF UNLAWFUL DEDUCTION / SHORTFALL:
Upon examining my payslip and clock-in records, the following shortfall has been identified:
{{details}}
Total Outstanding Arrears: £{{amount_owed}}

2. STATUTORY FRAMEWORK:
Section 13(1) of the Employment Rights Act 1996 provides that:
"An employer shall not make a deduction from wages of a worker employed by him unless the deduction is required or authorised by statute, or the worker has previously signified in writing his agreement or consent to the making of the deduction."

Furthermore, failure to pay for all contracted hours worked breaches the National Minimum Wage Act 1998 and constitutes a material breach of contract.

3. REQUIRED ACTION:
I request that you arrange an immediate out-of-cycle payroll adjustment or confirm in writing that this sum of £{{amount_owed}} will be reimbursed into my nominated bank account within seven (7) calendar days of this notice.

If this matter is not resolved satisfactorily, I reserve the right to submit a formal grievance, notify ACAS for Early Conciliation, and make an application to the Employment Tribunal under Section 23 of the Employment Rights Act 1996.

Yours sincerely,

{{employee_name}}`
  },
  {
    id: "statutory_sick_pay",
    titleEn: "Statutory Sick Pay (SSP) Non-Payment Formal Demand",
    titlePl: "Wezwanie do Wypłaty Zasiłku Chorobowego (SSP)",
    titleRo: "Notificare Plată Concediu Medical (Statutory Sick Pay)",
    statutoryReference: "Social Security Contributions and Benefits Act 1992 & Statutory Sick Pay (General) Regulations",
    category: "Sick",
    descriptionEn: "Demand letter when an employer refuses or delays payment of Statutory Sick Pay (SSP) despite qualifying condition and fit note.",
    descriptionPl: "Oficjalne wezwanie pracodawcy do natychmiastowej wypłaty zaległego SSP po dostarczeniu zwolnienia lekarskiego (Fit Note) lub oświadczenia (self-certificate).",
    descriptionRo: "Cerere de plată a indemnizației de boală (SSP) refuzată nejustificat de către angajator.",
    fields: [
      {
        key: "employee_name",
        labelEn: "Your Full Name",
        labelPl: "Twoje Imię i Nazwisko",
        labelRo: "Numele Tău",
        placeholder: "e.g. Artur Kowalski",
        defaultValue: "Artur Kowalski"
      },
      {
        key: "employer_name",
        labelEn: "Employer / Company Name",
        labelPl: "Nazwa Pracodawcy",
        labelRo: "Companie",
        placeholder: "e.g. Amazon Fulfilment LCY2",
        defaultValue: "Amazon Fulfilment LCY2"
      },
      {
        key: "period_of_sickness",
        labelEn: "Period of Sickness (Dates)",
        labelPl: "Okres Choroby (Daty)",
        labelRo: "Perioada Concediului",
        placeholder: "e.g. 1st October to 14th October 2026",
        defaultValue: "1st October to 14th October 2026 (inclusive)"
      },
      {
        key: "fit_note_details",
        labelEn: "Fit Note / Doctor Certificate Date",
        labelPl: "Data Wystawienia Zwolnienia Lekarskiego",
        labelRo: "Data Certificatului Medical",
        placeholder: "e.g. GP Fit Note dated 4th October provided on 5th October",
        defaultValue: "Self-certification for days 1-7 submitted 1st Oct, followed by GP Fit note provided 8th Oct"
      }
    ],
    defaults: {
      employee_name: "Artur Kowalski",
      employer_name: "Amazon Fulfilment LCY2",
      period_of_sickness: "Recent certified period of incapacity for work exceeding 4 consecutive days",
      fit_note_details: "Statutory self-certification and GP Fit Note duly submitted to management in accordance with company absence procedures."
    },
    letter: `FORMAL DEMAND FOR STATUTORY SICK PAY (SSP)
PURSUANT TO THE SOCIAL SECURITY CONTRIBUTIONS AND BENEFITS ACT 1992

Date: {{date}}

TO: Human Resources / Payroll, {{employer_name}}
FROM: {{employee_name}}
SUBJECT: NON-PAYMENT OF STATUTORY SICK PAY (SSP) FOR PERIOD: {{period_of_sickness}}

Dear HR & Payroll,

I am writing regarding the failure to include my Statutory Sick Pay (SSP) in my latest wage disbursement.

I was absent from work due to incapacity for work from {{period_of_sickness}}.
All statutory notification requirements were strictly observed:
{{fit_note_details}}

I satisfy all qualifying criteria for SSP under Section 151 of the Social Security Contributions and Benefits Act 1992:
1. I am classed as an employed earner;
2. My average weekly earnings exceed the Lower Earnings Limit (LEL);
3. My period of incapacity for work (PIW) exceeded the 3 consecutive waiting days.

Under statutory regulations, employers are strictly liable to pay SSP for qualifying days. If you believe for any reason that I do not qualify for SSP, you are under a strict legal obligation to issue an official HMRC Form SSP1 to me explaining the refusal so that I may claim alternative state benefits.

I request that you either:
a) Immediately credit my account with the accrued SSP arrears; or
b) Provide the official HMRC Form SSP1 within seven working days.

Should you fail to respond, I will formally refer this dispute to HMRC Statutory Payments Dispute Team (HMRC DM PTC, PT Operations) for a formal determination.

Yours faithfully,

{{employee_name}}`
  },
  {
    id: "sar_data_request",
    titleEn: "Subject Access Request (SAR): Shift Logs, Pay Audits & HR Files",
    titlePl: "Wniosek SAR (RODO): Wydanie Zapisów Pracy, Payslipów i Notatek HR",
    titleRo: "Cerere de Acces la Date (SAR): Evidența Orelor, Fluturași și Dosar HR",
    statutoryReference: "Article 15 UK GDPR & Section 45 Data Protection Act 2018",
    category: "Data",
    descriptionEn: "Compulsory legal request under UK GDPR forcing employer/agency to disclose internal management notes, clocking-in swipe records, pay sheets, and CCTV within 30 days.",
    descriptionPl: "Bezpłatny formalny wniosek prawny zmuszający pracodawcę lub agencję do ujawnienia wszystkich danych osobowych, odbić kartą z bramek, audytów płac i notatek w ciągu 30 dni.",
    descriptionRo: "Cerere obligatorie în baza GDPR UK prin care soliciți toate datele de pontaj, fluturași și dosarul personal în 30 de zile.",
    fields: [
      {
        key: "employee_name",
        labelEn: "Your Full Name",
        labelPl: "Twoje Imię i Nazwisko",
        labelRo: "Numele Tău",
        placeholder: "e.g. Artur Kowalski",
        defaultValue: "Artur Kowalski"
      },
      {
        key: "dob_or_id",
        labelEn: "Date of Birth & Payroll ID",
        labelPl: "Data Urodzenia i Nr Pracowniczy",
        labelRo: "Data Nașterii și ID Angajat",
        placeholder: "e.g. DOB: 14/05/1990, Payroll ID: #AK9921",
        defaultValue: "DOB: 12/04/1992, Staff ID: #98421"
      },
      {
        key: "employer_name",
        labelEn: "Data Controller / Employer Name",
        labelPl: "Administrator Danych / Pracodawca",
        labelRo: "Operator Date / Companie",
        placeholder: "e.g. Amazon Fulfilment LCY2",
        defaultValue: "Amazon Fulfilment LCY2"
      },
      {
        key: "specific_records",
        labelEn: "Specific Documents Requested",
        labelPl: "Żądane Konkretne Dokumenty",
        labelRo: "Documente Specifice Solicitate",
        placeholder: "e.g. Electronic turnstile logs, HR grievance records, all email mentions",
        defaultValue: "All electronic turnstile clocking-in/out records, internal supervisory shift notes, WhatsApp/email messages containing my name, and detailed calculation worksheets for holiday pay."
      }
    ],
    defaults: {
      employee_name: "Artur Kowalski",
      dob_or_id: "Staff ID: #ELON-89241",
      employer_name: "Amazon Fulfilment LCY2",
      specific_records: "All personnel files, electronic turnstile clock-in/out logs, payroll calculation sheets, and payslip data."
    },
    letter: `FORMAL SUBJECT ACCESS REQUEST (SAR)
PURSUANT TO ARTICLE 15 OF THE UK GENERAL DATA PROTECTION REGULATION (UK GDPR)
AND SECTION 45 OF THE DATA PROTECTION ACT 2018

Date: {{date}}

TO: The Data Protection Officer / HR Director, {{employer_name}}
FROM: {{employee_name}} (Identification: {{dob_or_id}})
SUBJECT: STATUTORY SUBJECT ACCESS REQUEST FOR EMPLOYMENT RECORDS

Dear Data Protection Officer,

Please accept this letter as a formal Subject Access Request pursuant to Article 15 of the UK General Data Protection Regulation (UK GDPR) and Section 45 of the Data Protection Act 2018.

As a current/former worker whose personal data you process as Data Controller, I am exercising my right to receive access to and a portable digital copy of all personal data held concerning me, specifically including but not limited to:

1. Time, Attendance & Swipes:
{{specific_records}}

2. Personnel Files & Grievance Communications:
All internal notes, correspondence, meeting minutes, disciplinary records, or risk assessments referencing my person, whether held in written, electronic, or archived systems.

3. Pay & Tax Calculations:
All payroll worksheets, deductions logs, calculation audits for holiday entitlement, and pension contribution receipts.

STATUTORY TIMEFRAME:
Under Article 12(3) of the UK GDPR, you are required to comply with this request without undue delay and at the latest within one calendar month of receipt. No fee may be charged for providing this information.

If you fail to provide full disclosure within the statutory 30-day window, a formal complaint will be escalated to the Information Commissioner's Office (ICO).

Yours faithfully,

{{employee_name}}`
  },
  {
    id: "flexible_working",
    titleEn: "Statutory Flexible Working Request (Day-One Right)",
    titlePl: "Wniosek o Elastyczny Czas Pracy (Flexible Working Request)",
    titleRo: "Cerere de Flexibilizare a Programului de Lucru (Day-One Right)",
    statutoryReference: "Section 80F Employment Rights Act 1996 & Flexible Working Regulations 2024",
    category: "Leave",
    descriptionEn: "Official statutory request to change work patterns, switch to fixed shifts, reduce working hours, or adjust start/end times under current UK day-one flexible working legislation.",
    descriptionPl: "Ustawowy wniosek o zmianę grafiku, stałe zmiany (np. tylko dzienne), pracę hybrydową lub ograniczenie godzin. Obowiązuje od 1. dnia pracy.",
    descriptionRo: "Cerere legală pentru ajustarea turelor de lucru sau a programului de la prima zi de angajare.",
    fields: [
      {
        key: "employee_name",
        labelEn: "Your Full Name",
        labelPl: "Twoje Imię i Nazwisko",
        labelRo: "Numele Tău",
        placeholder: "e.g. Artur Kowalski",
        defaultValue: "Artur Kowalski"
      },
      {
        key: "job_title",
        labelEn: "Job Title",
        labelPl: "Stanowisko",
        labelRo: "Funcție",
        placeholder: "e.g. Warehouse Operative",
        defaultValue: "Warehouse Operative"
      },
      {
        key: "employer_name",
        labelEn: "Employer / Line Manager",
        labelPl: "Pracodawca / Przełożony",
        labelRo: "Angajator",
        placeholder: "e.g. Amazon Fulfilment LCY2",
        defaultValue: "Amazon Fulfilment LCY2"
      },
      {
        key: "proposed_working_pattern",
        labelEn: "Requested Working Pattern (Days & Hours)",
        labelPl: "Proponowany Nowy Harmonogram",
        labelRo: "Programul de Lucru Solicitat",
        placeholder: "e.g. Fixed Monday to Thursday 07:00-17:30 (Day shifts only)",
        defaultValue: "Fixed 4-day working week: Monday to Thursday, 07:00 to 17:30, eliminating night shifts."
      },
      {
        key: "effective_date",
        labelEn: "Desired Start Date for New Pattern",
        labelPl: "Pożądana Data Wprowadzenia Zmiany",
        labelRo: "Data Dorită de Începere",
        placeholder: "e.g. 1st December 2026",
        defaultValue: "1st December 2026"
      },
      {
        key: "business_impact_mitigation",
        labelEn: "How the Business Can Manage the Change",
        labelPl: "Jak Zmiana Wpłynie na Zespół i Rozwiązania",
        labelRo: "Cum se Poate Gestiona Modificarea",
        placeholder: "e.g. Inbound shift coverage is highest during weekdays; colleagues are available to rotate.",
        defaultValue: "Inbound volume is heaviest during weekday mornings. This pattern ensures full throughput coverage while accommodating childcare responsibilities."
      }
    ],
    defaults: {
      employee_name: "Artur Kowalski",
      job_title: "Warehouse Operative",
      employer_name: "Amazon Fulfilment LCY2",
      proposed_working_pattern: "Fixed 4-day working week: Monday to Thursday, 07:00 to 17:30 day shifts.",
      effective_date: "From the start of the next monthly shift rota",
      business_impact_mitigation: "Inbound volume is highest during weekday mornings, ensuring full operational coverage while accommodating family commitments."
    },
    letter: `STATUTORY REQUEST FOR FLEXIBLE WORKING
PURSUANT TO SECTION 80F OF THE EMPLOYMENT RIGHTS ACT 1996
(AS AMENDED BY THE EMPLOYMENT RELATIONS (FLEXIBLE WORKING) ACT 2023)

Date: {{date}}

TO: {{employer_name}}
FROM: {{employee_name}} ({{job_title}})
SUBJECT: STATUTORY APPLICATION FOR FLEXIBLE WORKING ARRANGEMENT

Dear Management,

This letter constitutes a statutory flexible working application submitted under Section 80F of the Employment Rights Act 1996 and the Flexible Working Regulations.

1. PROPOSED WORKING PATTERN:
I request to change my current working pattern to the following arrangement:
{{proposed_working_pattern}}

Proposed Effective Date: {{effective_date}}

2. REASON & BUSINESS IMPACT ANALYSIS:
{{business_impact_mitigation}}

3. STATUTORY CONSULTATION REQUIREMENT:
Under current legislation and the ACAS Code of Practice on handling requests to work flexibly, employers must consult with workers before making any decision and decide the outcome within two months of receiving this application.

I look forward to discussing this application with you in an informal consultation meeting at your earliest convenience.

Yours sincerely,

{{employee_name}}
{{job_title}}`
  },
  {
    id: "constructive_dismissal",
    titleEn: "Resignation with Immediate Effect: Constructive Dismissal",
    titlePl: "Wypowiedzenie ze Skutkiem Natychmiastowym: Zwolnienie Konstruktywne",
    titleRo: "Demisie cu Efect Imediat: Concediere Constructivă (Constructive Dismissal)",
    statutoryReference: "Section 95(1)(c) Employment Rights Act 1996",
    category: "Dismissal",
    descriptionEn: "Formal resignation letter citing repudiatory breach of contract and fundamental breakdown of trust and confidence due to employer actions, reserving the right to claim at Tribunal.",
    descriptionPl: "Ostateczne pismo o rozwiązaniu umowy bez zachowania okresu wypowiedzenia z winy pracodawcy (np. brak pensji, mobbing, zagrożenie zdrowia) z zachowaniem prawa do odszkodowania w ET.",
    descriptionRo: "Scrisoare oficială de demisie imediată cauzată de comportamentul abuziv sau neplata salariului de către angajator.",
    fields: [
      {
        key: "employee_name",
        labelEn: "Your Full Name",
        labelPl: "Twoje Imię i Nazwisko",
        labelRo: "Numele Tău",
        placeholder: "e.g. Artur Kowalski",
        defaultValue: "Artur Kowalski"
      },
      {
        key: "employer_name",
        labelEn: "Employer / Company Name",
        labelPl: "Pracodawca",
        labelRo: "Companie",
        placeholder: "e.g. Amazon Fulfilment LCY2",
        defaultValue: "Amazon Fulfilment LCY2"
      },
      {
        key: "breach_details",
        labelEn: "Fundamental Breach of Contract Details",
        labelPl: "Szczegóły Rażącego Naruszenia Umowy",
        labelRo: "Detaliile Încălcării Grave a Contractului",
        placeholder: "e.g. Sustained wage withholding, unsafe conditions, failure to address formal grievance",
        defaultValue: "Persistent refusal to pay earned overtime wages (£348.60), deliberate reduction of contracted shifts in retaliation for health complaints, and management's refusal to hear my formal grievance."
      }
    ],
    defaults: {
      employee_name: "Artur Kowalski",
      employer_name: "Amazon Fulfilment LCY2",
      breach_details: "Persistent refusal to pay earned overtime wages, unilateral reduction of contracted shifts, and failure to investigate formal workplace grievances in accordance with the ACAS Code of Practice."
    },
    letter: `NOTICE OF RESIGNATION WITH IMMEDIATE EFFECT
CLAIM OF CONSTRUCTIVE DISMISSAL
PURSUANT TO SECTION 95(1)(c) OF THE EMPLOYMENT RIGHTS ACT 1996

Date: {{date}}

TO: The Directors & Human Resources, {{employer_name}}
FROM: {{employee_name}}
SUBJECT: RESIGNATION IN RESPONSE TO FUNDAMENTAL REPUDIATORY BREACH OF CONTRACT

Please be advised that I am resigning from my employment with {{employer_name}} with immediate effect from today's date.

I have been forced to take this step because the company has committed serious and fundamental breaches of the contract of employment, including the breach of the fundamental implied term of mutual trust and confidence.

PARTICULARS OF FUNDAMENTAL REPUDIATORY BREACH:
{{breach_details}}

The company's conduct has made my continued employment completely untenable and intolerable. My resignation is directly in response to these fundamental breaches and is without prejudice to my rights to pursue statutory claims.

I consider myself to have been constructively and unfairly dismissed within the meaning of Section 95(1)(c) of the Employment Rights Act 1996.

I require all outstanding accrued payments, including all earned wages, accrued but untaken statutory holiday pay, and notice pay damages, to be paid into my account within 7 days, alongside my final P45.

Yours faithfully,

{{employee_name}}`
  },
  {
    id: "settlement_agreement",
    titleEn: "Protected Settlement & ACAS Early Conciliation Proposal",
    titlePl: "Propozycja Ugody Pozasądowej (Settlement Agreement · s.111A ERA 1996)",
    titleRo: "Propunere Acord de Soluționare Amiabilă (Settlement Agreement)",
    statutoryReference: "Section 111A Employment Rights Act 1996 & ACAS Early Conciliation Rules",
    category: "Settlement",
    descriptionEn: "Without Prejudice & Section 111A protected settlement proposal to resolve workplace disputes, unpaid sums, or termination terms amicably prior to Employment Tribunal proceedings.",
    descriptionPl: "Oficjalna propozycja zawarcia ugody pozasądowej (Settlement Agreement) w trybie chronionym art. 111A Employment Rights Act 1996 przed skierowaniem sprawy do Trybunału Pracy.",
    descriptionRo: "Propunere oficială de acord amiabil protejată sub Secțiunea 111A ERA 1996 înainte de sesizarea Tribunalului Muncii.",
    fields: [
      {
        key: "employee_name",
        labelEn: "Your Full Name",
        labelPl: "Twoje Imię i Nazwisko",
        labelRo: "Numele Tău Complet",
        placeholder: "e.g. Artur Kowalski",
        defaultValue: "Artur Kowalski"
      },
      {
        key: "job_title",
        labelEn: "Job Title",
        labelPl: "Stanowisko",
        labelRo: "Funcție",
        placeholder: "e.g. Warehouse Operative",
        defaultValue: "Warehouse Operative (Inbound)"
      },
      {
        key: "employer_name",
        labelEn: "Employer Name",
        labelPl: "Nazwa Pracodawcy",
        labelRo: "Numele Angajatorului",
        placeholder: "e.g. Amazon Fulfilment LCY2",
        defaultValue: "Amazon Fulfilment LCY2"
      },
      {
        key: "settlement_sum",
        labelEn: "Proposed Settlement Compensation (£)",
        labelPl: "Proponowana Kwota Ugody / Rekompensaty (£)",
        labelRo: "Suma Solicitată pentru Acord (£)",
        placeholder: "e.g. 2450.00",
        defaultValue: "2,450.00"
      },
      {
        key: "dispute_details",
        labelEn: "Summary of Statutory Claims & Contractual Breaches",
        labelPl: "Podsumowanie Roszczeń i Naruszeń Kontraktu",
        labelRo: "Rezumatul Pretențiilor Legale",
        placeholder: "e.g. Unpaid overtime, contractual notice pay, and ACAS grievance breaches",
        defaultValue: "Unlawful deductions from wages under Section 13 ERA 1996, accrued statutory holiday pay under the Working Time Regulations 1998, and failure to follow the ACAS statutory Code of Practice."
      }
    ],
    defaults: {
      employee_name: "Artur Kowalski",
      job_title: "Warehouse Operative (Inbound)",
      employer_name: "Amazon Fulfilment LCY2",
      settlement_sum: "2,450.00",
      dispute_details: "Unlawful deductions from wages under Section 13 ERA 1996, accrued statutory holiday pay under the Working Time Regulations 1998, and failure to follow the ACAS statutory Code of Practice."
    },
    letter: `WITHOUT PREJUDICE AND SUBJECT TO CONTRACT
PROTECTED CONVERSATION PURSUANT TO SECTION 111A EMPLOYMENT RIGHTS ACT 1996

Date: {{date}}

TO: Human Resources Director & Legal Department, {{employer_name}}
FROM: {{employee_name}} ({{job_title}})
SUBJECT: FORMAL SETTLEMENT PROPOSAL PRIOR TO ACAS EARLY CONCILIATION & EMPLOYMENT TRIBUNAL CLAIM

Dear Sir or Madam,

I write on a "Without Prejudice" basis and pursuant to Section 111A of the Employment Rights Act 1996 with a view to achieving an amicable, commercial resolution to the ongoing employment dispute between myself and {{employer_name}} without the time, cost, and public record of Employment Tribunal litigation.

1. SUMMARY OF STATUTORY CLAIMS:
{{dispute_details}}

2. PROPOSED SETTLEMENT TERMS:
In full and final settlement of my prospective Employment Tribunal claims, I am prepared to enter into a statutory Settlement Agreement (pursuant to Section 203(3) of the Employment Rights Act 1996) on the following core terms:
(a) Payment of all outstanding contractual wages, notice pay, and accrued holiday pay;
(b) An ex-gratia compensation payment of £{{settlement_sum}} (tax-free pursuant to Section 401 ITEPA 2003);
(c) An agreed factual employment reference; and
(d) The customary employer contribution toward independent legal advice on the terms of the Settlement Agreement.

3. NEXT STEPS & DEADLINE:
Please confirm within seven (7) calendar days whether {{employer_name}} wishes to conclude this matter by way of a formal Settlement Agreement. If no agreement is reached within this period, I will proceed directly with ACAS Early Conciliation and lodge my Form ET1 with the Employment Tribunal.

Yours faithfully,

{{employee_name}}
{{job_title}}`
  }
];

export function renderTemplateLetter(
  template: LegalTemplate,
  values: Record<string, string>,
  userProfile?: {
    fullName?: string;
    email?: string;
    phone?: string;
    homeAddress?: string;
    employerName?: string;
    companyNumber?: string;
    employerAddress?: string;
    jobTitle?: string;
    startDate?: string;
    hourlyRate?: number;
    accountId?: string;
  }
): string {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const empName =
    values.employee_name?.trim() ||
    userProfile?.fullName ||
    template.defaults.employee_name ||
    "Artur Kowalski";
  const empAddress =
    values.employee_address?.trim() ||
    userProfile?.homeAddress ||
    "42 Victoria Road, Dartford, DA1 5DJ";
  const empPhone =
    values.employee_phone?.trim() ||
    userProfile?.phone ||
    "+44 7700 900342";
  const empEmail =
    values.employee_email?.trim() ||
    userProfile?.email ||
    "artur.kowalski@example.co.uk";
  const empJob =
    values.job_title?.trim() ||
    userProfile?.jobTitle ||
    template.defaults.job_title ||
    "Warehouse Operative";
  const empStart = userProfile?.startDate || "2024-03-15";
  const empRate = userProfile?.hourlyRate ? `£${userProfile.hourlyRate.toFixed(2)}/hr` : "£13.50/hr";
  const empRef = userProfile?.accountId || "ELON-89241";

  const compName =
    values.employer_name?.trim() ||
    userProfile?.employerName ||
    template.defaults.employer_name ||
    "Amazon Fulfilment LCY2";
  const compNo = userProfile?.companyNumber || "03223028";
  const compAddress =
    values.employer_address?.trim() ||
    userProfile?.employerAddress ||
    "London Distribution Park, Windrush Drive, Tilbury RM18 7AN";

  const body = template.letter.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === "date") return dateStr;
    if (key === "employee_name") return empName;
    if (key === "job_title") return empJob;
    if (key === "employer_name") return compName;
    const v = values[key];
    if (v && v.trim() !== "") return v.trim();
    return template.defaults[key] || empName;
  });

  const profileHeader = `SENDER (EMPLOYEE DETAILS):
Full Name: ${empName}
Residential Address: ${empAddress}
Telephone: ${empPhone} | Email: ${empEmail}
Role: ${empJob} | Start Date: ${empStart} | Contract Rate: ${empRate} | Ref: #${empRef}

RECIPIENT (EMPLOYER DETAILS):
Company Name: ${compName} (Company Reg. No: ${compNo})
Registered / Site Address: ${compAddress}
--------------------------------------------------------------------------------\n\n`;

  const contactFooter = `\nAddress: ${empAddress}\nTel: ${empPhone} | Email: ${empEmail}`;

  return sanitizeReadyToSendLetter(profileHeader + body + contactFooter, {
    fullName: empName,
    email: empEmail,
    phone: empPhone,
    homeAddress: empAddress,
    employerName: compName,
    companyNumber: compNo,
    employerAddress: compAddress,
    jobTitle: empJob,
    startDate: empStart,
    hourlyRate: userProfile?.hourlyRate || 13.5,
    accountId: empRef,
  });
}

/**
 * Ensures any generated letter is 100% ready to send with ZERO square-bracket placeholders
 * or parenthetical instructions like "(delete as applicable)" or "[insert date]".
 */
export function sanitizeReadyToSendLetter(
  rawLetter: string,
  userProfile: {
    fullName?: string;
    email?: string;
    phone?: string;
    homeAddress?: string;
    employerName?: string;
    companyNumber?: string;
    employerAddress?: string;
    jobTitle?: string;
    startDate?: string;
    hourlyRate?: number;
    accountId?: string;
  }
): string {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const empName = userProfile.fullName || "Artur Kowalski";
  const empAddress = userProfile.homeAddress || "42 Victoria Road, Dartford, DA1 5DJ";
  const empPhone = userProfile.phone || "+44 7700 900342";
  const empEmail = userProfile.email || "artur.kowalski@example.co.uk";
  const empJob = userProfile.jobTitle || "Warehouse Operative";
  const empStart = userProfile.startDate || "2024-03-15";
  const empRate = userProfile.hourlyRate ? `£${userProfile.hourlyRate.toFixed(2)}/hr` : "£13.50/hr";
  const empRef = userProfile.accountId || "ELON-89241";
  const compName = userProfile.employerName || "Amazon Fulfilment LCY2";
  const compAddress =
    userProfile.employerAddress || "London Distribution Park, Windrush Drive, Tilbury RM18 7AN";

  return rawLetter
    // Replace common bracketed placeholders if AI ever outputs them
    .replace(/\[(?:employee|worker|your|sender)?\s*name\]/gi, empName)
    .replace(/\[(?:employee|worker|your|home|residential|sender)?\s*address\]/gi, empAddress)
    .replace(/\[(?:phone|telephone|mobile|contact)\s*(?:number)?\]/gi, empPhone)
    .replace(/\[(?:email|e-mail)\s*(?:address)?\]/gi, empEmail)
    .replace(/\[(?:job\s*title|role|position)\]/gi, empJob)
    .replace(/\[(?:employer|company|respondent)\s*name\]/gi, compName)
    .replace(/\[(?:employer|company|site)\s*address\]/gi, compAddress)
    .replace(/\[(?:date|today'?s\s*date)\]/gi, dateStr)
    .replace(/\[(?:start\s*date|employment\s*start\s*date)\]/gi, empStart)
    .replace(/\[(?:hourly\s*rate|pay\s*rate)\]/gi, empRate)
    .replace(/\[(?:staff\s*id|employee\s*id|account\s*id|reference)\]/gi, `#${empRef}`)
    // Remove instructional parentheticals like "(delete as applicable)", "(usuń niepotrzebne)", "(if applicable)"
    .replace(/\(\s*(?:delete as applicable|insert details|if applicable|or delete|usuń niepotrzebne|wpisz tutaj)[^)]*\)/gi, "")
    // Remove any remaining square-bracketed instructions "[insert ...]", "[select ...]", etc.
    .replace(/\[[^\]\n]{1,120}\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Strips any embedded [ENGLISH_LETTER_START]...[ENGLISH_LETTER_END] and [PROFILE_UPDATE_START]...[PROFILE_UPDATE_END]
 * blocks (including partial streaming tags) from the chat message text so the chat bubble and voice reader
 * only present the native-language conversation.
 */
export function stripEmbeddedEnglishLetter(rawText: string): string {
  if (!rawText) return "";
  const cleaned = rawText
    .replace(/\[ENGLISH_LETTER_START\][\s\S]*?(?:\[ENGLISH_LETTER_END\]|$)/gi, "")
    .replace(/\[PROFILE_UPDATE_START\][\s\S]*?(?:\[PROFILE_UPDATE_END\]|$)/gi, "")
    .replace(/\[(?:ENGLISH_LETTER|PROFILE_UPDATE)[_A-Z]*$/i, "")
    .trim();
  return cleaned;
}

/**
 * Extracts any profile field updates from the user's chat message and Elon's [PROFILE_UPDATE_START] tag
 * so Elon automatically completes/updates the user's profile during conversation.
 */
export function extractProfileUpdatesFromChat(
  userText: string,
  aiText: string
): Partial<{
  fullName: string;
  email: string;
  phone: string;
  homeAddress: string;
  employerName: string;
  employerAddress: string;
  jobTitle: string;
  startDate: string;
  hourlyRate: number;
  hoursPerWeek: number;
}> {
  const updates: Record<string, any> = {};

  // 1. Parse structured [PROFILE_UPDATE_START]{...}[PROFILE_UPDATE_END] from AI if present
  const tagMatch = aiText.match(
    /\[PROFILE_UPDATE_START\]([\s\S]*?)\[PROFILE_UPDATE_END\]/i
  );
  if (tagMatch && tagMatch[1]) {
    try {
      const parsed = JSON.parse(tagMatch[1].trim());
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.fullName === "string" && parsed.fullName.trim().length > 3) {
          updates.fullName = parsed.fullName.trim();
        }
        if (typeof parsed.phone === "string" && parsed.phone.trim().length > 6) {
          updates.phone = parsed.phone.trim();
        }
        if (typeof parsed.email === "string" && parsed.email.includes("@")) {
          updates.email = parsed.email.trim();
        }
        if (typeof parsed.homeAddress === "string" && parsed.homeAddress.trim().length > 5) {
          updates.homeAddress = parsed.homeAddress.trim();
        }
        if (typeof parsed.employerName === "string" && parsed.employerName.trim().length > 2) {
          updates.employerName = parsed.employerName.trim();
        }
        if (typeof parsed.employerAddress === "string" && parsed.employerAddress.trim().length > 5) {
          updates.employerAddress = parsed.employerAddress.trim();
        }
        if (typeof parsed.jobTitle === "string" && parsed.jobTitle.trim().length > 2) {
          updates.jobTitle = parsed.jobTitle.trim();
        }
        if (typeof parsed.startDate === "string" && parsed.startDate.trim().length > 4) {
          updates.startDate = parsed.startDate.trim();
        }
        if (parsed.hourlyRate !== undefined && !isNaN(Number(parsed.hourlyRate)) && Number(parsed.hourlyRate) > 0) {
          updates.hourlyRate = Number(parsed.hourlyRate);
        }
        if (parsed.hoursPerWeek !== undefined && !isNaN(Number(parsed.hoursPerWeek)) && Number(parsed.hoursPerWeek) > 0) {
          updates.hoursPerWeek = Number(parsed.hoursPerWeek);
        }
      }
    } catch {
      // Fallback to regex extraction below
    }
  }

  // 2. Also detect direct user-provided details in userText (instant client-side extraction)
  const emailMatch = userText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  if (emailMatch && !updates.email) {
    updates.email = emailMatch[0];
  }

  const ukPhoneMatch = userText.match(/(?:\+44\s?7\d{3}|\b07\d{3})[\s.-]?\d{3}[\s.-]?\d{3}\b/);
  if (ukPhoneMatch && !updates.phone) {
    updates.phone = ukPhoneMatch[0].trim();
  }

  const nameMatch = userText.match(
    /(?:nazywam się|mam na imię|moje imię i nazwisko to|my name is|numele meu este)\s+([A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż\-]+)/i
  );
  if (nameMatch && !updates.fullName) {
    updates.fullName = nameMatch[1].trim();
  }

  const addressMatch = userText.match(
    /(?:mieszkam pod adresem|mój adres to|adres zamieszkania:?|my address is|live at)\s+([^,.!\n]{6,80}(?:,\s*[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})?)/i
  );
  if (addressMatch && !updates.homeAddress) {
    updates.homeAddress = addressMatch[1].trim();
  }

  const rateMatch = userText.match(
    /(?:stawk[aę]|zarabiam|mam|płacą mi|hourly rate|paid)\s*(?:to|:)?\s*£?\s*(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:£|funt|gbp|\/h|na godzin|per hour)/i
  );
  if (rateMatch && !updates.hourlyRate) {
    const parsedRate = Number(rateMatch[1].replace(",", "."));
    if (parsedRate >= 6 && parsedRate <= 120) {
      updates.hourlyRate = parsedRate;
    }
  }

  return updates;
}

export interface GeneratedChatLetter {
  templateId: string;
  titleEn: string;
  titlePl: string;
  titleRo: string;
  statutoryReference: string;
  recipientName: string;
  recipientAddress: string;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail: string;
  contentEn: string;
}

/**
 * Extracts an embedded English letter from the AI response or dynamically builds a complete,
 * legally formatted UK statutory letter in English pre-filled with 100% of the user's profile data.
 */
export function buildPersonalizedEnglishLetterForChat(
  userPrompt: string,
  rawAiText: string,
  userProfile: {
    fullName: string;
    email: string;
    phone: string;
    homeAddress: string;
    employerName: string;
    companyNumber: string;
    employerAddress: string;
    jobTitle: string;
    startDate: string;
    hourlyRate: number;
    hoursPerWeek: number;
    contractType: string;
    accountId: string;
  }
): GeneratedChatLetter {
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const combined = `${userPrompt} ${rawAiText}`.toLowerCase();

  // Extract any £ amount or hour count mentioned by the user
  const amountMatch = userPrompt.match(/£\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:funt|gbp|pounds|lire)/i);
  const hoursMatch = userPrompt.match(/(\d+)\s*(?:godzin|nadgodzin|h\b|hr|hours|ore)/i);
  const detectedHours = hoursMatch ? Number(hoursMatch[1]) : 12;
  const calculatedOwed = amountMatch
    ? (amountMatch[1] || amountMatch[2]).replace(",", ".")
    : (detectedHours * (userProfile.hourlyRate || 13.5)).toFixed(2);

  // Determine the statutory letter category based on conversation context
  const isSettlement =
    /\b(ugod\w*|porozumieni\w*|settlement|without prejudice|section 111a|rekompensat\w*|early conciliation|polubown\w*)\b/i.test(
      combined
    );
  const isWages =
    /\b(nadgodzin\w*|wypłat\w*|pensj\w*|payslip\w*|wage\w*|pay|potrąc\w*|deduct\w*|salariu\w*|overtime|ppe|uniform\w*|stawk\w*|minimum wage|living wage|section 13|funt\w*|pieni\w*)\b/i.test(
      combined
    );
  const isSick =
    /\b(ssp|ssp1|choro\w*|zasił\w*|sick\w*|medical|lekarz\w*|doctor|fit note|zwolnieni\w* lekarsk\w*|concediu medical|wypad\w*)\b/i.test(
      combined
    );
  const isDismissal =
    /\b(zwolni\w*|wyrzuc\w*|wypowiedzeni\w*|dismiss\w*|fired|sacked|redundant|odpraw\w*|dyscyplin\w*|disciplinary|constructive|concediat\w*|preaviz|section 95|section 98)\b/i.test(
      combined
    );
  const isSar =
    /\b(sar|rodo|gdpr|dane|data|bramk\w*|clock\w*|akt\w* osobow\w*|records|cctv|dosar)\b/i.test(
      combined
    );
  const isFlexible =
    /\b(grafik\w*|elastycz\w*|zmian\w*|flexible|section 80f|shift pattern|urlop\w*|holiday|przerw\w*|break|umow\w*|contract\w*)\b/i.test(
      combined
    );

  let templateId = "formal_grievance";
  let titleEn = "Formal Written Grievance (ACAS Code of Practice)";
  let titlePl = "Oficjalna Skarga Pracownicza (Formal Grievance — EN)";
  let titleRo = "Plângere Oficială la Angajator (Formal Grievance — EN)";
  let statutoryReference = "ACAS Code of Practice No. 1 · s.199 TULRCA 1992 · s.10 ERA 1999";

  if (isSettlement) {
    templateId = "settlement_agreement";
    titleEn = "Protected Settlement & ACAS Early Conciliation Proposal (s.111A ERA 1996)";
    titlePl = "Propozycja Ugody Pozasądowej (Settlement Agreement — EN)";
    titleRo = "Propunere Acord de Soluționare Amiabilă (Settlement Agreement — EN)";
    statutoryReference = "Section 111A & Section 203(3) Employment Rights Act 1996";
  } else if (isWages) {
    templateId = "unpaid_wages";
    titleEn = "Formal Notice: Unlawful Deduction from Wages (Section 13 ERA 1996)";
    titlePl = "Wezwanie do Zapłaty Zaległego Wynagrodzenia (Section 13 ERA 1996 — EN)";
    titleRo = "Notificare Oficială Plată Salariu Restant (Section 13 ERA 1996 — EN)";
    statutoryReference = "Section 13 Employment Rights Act 1996 & National Minimum Wage Act 1998";
  } else if (isSick) {
    templateId = "statutory_sick_pay";
    titleEn = "Formal Demand for Statutory Sick Pay (SSP) & Form SSP1";
    titlePl = "Wezwanie do Wypłaty Zasiłku Chorobowego SSP (EN)";
    titleRo = "Solicitare Oficială Plată Concediu Medical SSP (EN)";
    statutoryReference = "Section 151 Social Security Contributions and Benefits Act 1992";
  } else if (isDismissal) {
    templateId = "constructive_dismissal";
    titleEn = "Formal Notice Contesting Unfair Dismissal / Breach of Contract";
    titlePl = "Odwołanie od Bezprawnego Zwolnienia / Naruszenia Umowy (EN)";
    titleRo = "Contestație Oficială Concediere Abuzivă (EN)";
    statutoryReference = "Section 95 & Section 98 Employment Rights Act 1996 · ACAS Code";
  } else if (isSar) {
    templateId = "sar_data_request";
    titleEn = "Statutory Subject Access Request (Article 15 UK GDPR)";
    titlePl = "Wniosek o Wydanie Danych i Rejestrów Pracy SAR (UK GDPR — EN)";
    titleRo = "Cerere Acces Date Personale și Pontaj SAR (UK GDPR — EN)";
    statutoryReference = "Article 15 UK GDPR & Section 45 Data Protection Act 2018";
  } else if (isFlexible) {
    templateId = "flexible_working";
    titleEn = "Statutory Notice Regarding Contract Terms & Working Time Rights";
    titlePl = "Wniosek Ustawowy dot. Warunków Umowy i Czasu Pracy (EN)";
    titleRo = "Cerere Oficială Contract și Program de Lucru (EN)";
    statutoryReference = "Working Time Regulations 1998 & Section 80F ERA 1996";
  }

  // Check if Gemini already embedded a custom [ENGLISH_LETTER_START]...[ENGLISH_LETTER_END] block
  const embeddedMatch = rawAiText.match(
    /\[ENGLISH_LETTER_START\]([\s\S]*?)(?:\[ENGLISH_LETTER_END\]|$)/i
  );

  const senderHeaderBlock = `PRIVATE & CONFIDENTIAL — FORMAL STATUTORY NOTICE
====================================================================
FROM (EMPLOYEE / WORKER):
Full Name:          ${userProfile.fullName}
Home Address:       ${userProfile.homeAddress}
Telephone:          ${userProfile.phone}
Email Address:      ${userProfile.email}
Job Title:          ${userProfile.jobTitle}
Contract & Rate:    ${userProfile.contractType.toUpperCase()} (£${userProfile.hourlyRate.toFixed(2)}/hr · ${userProfile.hoursPerWeek} hrs/wk)
Start Date:         ${userProfile.startDate}
Employee / Case ID: #${userProfile.accountId}

TO (EMPLOYER / RESPONDENT):
Employer Name:      ${userProfile.employerName}
Company Reg. No:    ${userProfile.companyNumber || "03223028"}
Employer Address:   ${userProfile.employerAddress}
Department:         Human Resources & Payroll Department

Date of Notice:     ${dateStr}
Statutory Basis:    ${statutoryReference}
====================================================================`;

  const signatureFooterBlock = `Yours sincerely,

${userProfile.fullName}
${userProfile.jobTitle}
Residential Address: ${userProfile.homeAddress}
Telephone: ${userProfile.phone}
Email: ${userProfile.email}`;

  if (embeddedMatch && embeddedMatch[1] && embeddedMatch[1].trim().length > 80) {
    const customBody = embeddedMatch[1].trim();
    // Ensure the user's address and phone are always present in the final document
    const hasAddress = customBody.includes(userProfile.homeAddress);
    const fullContent = hasAddress
      ? customBody
      : `${senderHeaderBlock}\n\n${customBody}\n\n${signatureFooterBlock}`;

    return {
      templateId,
      titleEn,
      titlePl,
      titleRo,
      statutoryReference,
      recipientName: userProfile.employerName,
      recipientAddress: userProfile.employerAddress,
      senderName: userProfile.fullName,
      senderAddress: userProfile.homeAddress,
      senderPhone: userProfile.phone,
      senderEmail: userProfile.email,
      contentEn: sanitizeReadyToSendLetter(fullContent, userProfile),
    };
  }

  // Build tailored English statutory body based on the category and user profile
  let englishBody = "";

  if (isWages) {
    englishBody = `SUBJECT: FORMAL NOTICE OF UNLAWFUL DEDUCTION FROM WAGES AND UNPAID WORKING HOURS (£${calculatedOwed})

Dear Human Resources and Payroll Department,

I am writing in my capacity as ${userProfile.jobTitle} at ${userProfile.employerName} (employed since ${userProfile.startDate} at a contracted rate of £${userProfile.hourlyRate.toFixed(2)} per hour) to formally notify you of an unlawful deduction from my wages and/or unpaid working hours.

1. PARTICULARS OF SHORTFALL & DEDUCTION:
Upon reviewing my recent payslip and attendance records, I have identified an unpaid shortfall totaling approximately £${calculatedOwed} (including ${detectedHours} unpaid/overtime hours at £${userProfile.hourlyRate.toFixed(2)}/hr and/or unauthorized deductions made without my prior written consent).

2. STATUTORY BREACHES UNDER UK EMPLOYMENT LAW:
Pursuant to Section 13(1) of the Employment Rights Act 1996, an employer shall not make a deduction from wages of a worker employed by him unless the deduction is authorised by statute or the worker has previously signified in writing their agreement prior to the event. Furthermore, any deduction for mandatory personal protective equipment (PPE) breaches Section 9 of the Health and Safety at Work etc. Act 1974 and the National Minimum Wage Act 1998.

3. REQUIRED REMEDIAL ACTION WITHIN 7 DAYS:
I hereby request that ${userProfile.employerName} process an immediate out-of-cycle payment of £${calculatedOwed} into my nominated bank account and provide a corrected itemised pay statement (pursuant to Section 8 of the Employment Rights Act 1996) within seven (7) calendar days of the date of this letter.

Should this sum remain unpaid after 7 days, I will immediately initiate ACAS Early Conciliation and submit a formal claim to the Employment Tribunal under Section 23 of the Employment Rights Act 1996 without further notice.`;
  } else if (isSick) {
    englishBody = `SUBJECT: FORMAL DEMAND FOR STATUTORY SICK PAY (SSP) OR OFFICIAL HMRC FORM SSP1

Dear Human Resources and Payroll Department,

I am writing as ${userProfile.jobTitle} at ${userProfile.employerName} (employed since ${userProfile.startDate}) regarding the non-payment of my Statutory Sick Pay (SSP) following my recent period of sickness absence.

1. STATUTORY QUALIFICATION FOR SSP:
I satisfy all statutory qualifying conditions under Section 151 of the Social Security Contributions and Benefits Act 1992:
- I am an employed earner working for ${userProfile.employerName};
- My average weekly earnings (£${(userProfile.hourlyRate * userProfile.hoursPerWeek).toFixed(2)}/week) exceed the statutory Lower Earnings Limit (LEL);
- My period of incapacity for work exceeded 3 consecutive qualifying waiting days, and I duly notified management in accordance with statutory rules.

2. REQUIRED ACTION WITHIN 7 DAYS:
I request that ${userProfile.employerName} either:
(a) Immediately pay all accrued Statutory Sick Pay (SSP) arrears owed to me; or
(b) Issue the mandatory HMRC Form SSP1 within seven (7) calendar days stating the exact statutory reason for refusal.

If this matter is not resolved within 7 days, I will refer this dispute directly to the HMRC Statutory Payments Dispute Team and ACAS Early Conciliation.`;
  } else if (isDismissal) {
    englishBody = `SUBJECT: FORMAL APPEAL AND STATUTORY NOTICE CONTESTING UNFAIR / CONSTRUCTIVE DISMISSAL

Dear Directors and Human Resources Department,

I am writing as ${userProfile.jobTitle} at ${userProfile.employerName} (employed since ${userProfile.startDate}) to formally contest the disciplinary/dismissal action taken against me and to put the company on notice of serious breaches of UK employment law.

1. PROCEDURAL AND SUBSTANTIVE BREACHES:
The company's actions contravene Section 95 and Section 98 of the Employment Rights Act 1996 as well as the mandatory 5-step procedure set out in the ACAS statutory Code of Practice on Disciplinary and Grievance Procedures (Section 199 TULRCA 1992). Failure to follow the ACAS Code empowers an Employment Tribunal to uplift any compensation award by up to 25%.

2. RIGHT TO BE ACCOMPANIED & DISCLOSURE OF EVIDENCE:
Pursuant to Section 10 of the Employment Relations Act 1999, I exercise my statutory right to be accompanied at any appeal or hearing by a Trade Union Representative or accredited colleague, and I require full written disclosure of all evidence, witness statements, and investigation notes relied upon by management within five (5) working days.

Please confirm receipt of this formal notice in writing to my contact details above.`;
  } else if (isSar) {
    englishBody = `SUBJECT: STATUTORY SUBJECT ACCESS REQUEST (ARTICLE 15 UK GDPR & SECTION 45 DATA PROTECTION ACT 2018)

Dear Data Protection Officer and HR Department,

Pursuant to Article 15 of the UK General Data Protection Regulation (UK GDPR) and Section 45 of the Data Protection Act 2018, I hereby submit a formal Subject Access Request requiring ${userProfile.employerName} (Company No: ${userProfile.companyNumber}) to provide a complete digital copy of all personal data held concerning me.

1. SPECIFIC RECORDS REQUIRED:
- All electronic turnstile, clock-in/clock-out, and shift attendance logs from ${userProfile.startDate} to present;
- All itemised payslips, payroll calculation sheets, holiday pay accrual logs, and wage deduction authorisations;
- All HR personnel files, supervisory notes, disciplinary/grievance records, emails, and internal messages referencing my name (${userProfile.fullName}).

2. STATUTORY DEADLINE:
Under Article 12(3) of the UK GDPR, you must comply with this request free of charge within one calendar month. Please send the requested records to my email address (${userProfile.email}) or residential address (${userProfile.homeAddress}).`;
  } else {
    englishBody = `SUBJECT: FORMAL WRITTEN GRIEVANCE PURSUANT TO THE ACAS STATUTORY CODE OF PRACTICE

Dear Human Resources Department,

Please accept this letter as a formal written grievance submitted in my capacity as ${userProfile.jobTitle} at ${userProfile.employerName} (employed since ${userProfile.startDate}), pursuant to the ACAS statutory Code of Practice on Disciplinary and Grievance Procedures (issued under Section 199 of the Trade Union and Labour Relations (Consolidation) Act 1992).

1. NATURE OF FORMAL GRIEVANCE:
I am formally raising a grievance regarding unfair treatment, breach of statutory workplace obligations, and breach of the implied contractual term of mutual trust and confidence experienced during my shifts at ${userProfile.employerName} (${userProfile.employerAddress}).

2. STATUTORY GRIEVANCE HEARING & RIGHT TO BE ACCOMPANIED:
In accordance with paragraph 32 of the ACAS Code of Practice and Section 10 of the Employment Relations Act 1999, I request that ${userProfile.employerName} convene a formal grievance hearing within five (5) working days and confirm that I may be accompanied by a Trade Union Representative or colleague.

3. DESIRED RESOLUTION:
I request a full, impartial investigation into the matters raised, written confirmation of remedial steps taken to protect my statutory rights and pay (£${userProfile.hourlyRate.toFixed(2)}/hr), and an assurance that I will suffer no detriment or retaliation for asserting my statutory employment rights.

Please send written confirmation of the hearing date and assigned impartial manager to my email (${userProfile.email}) or phone (${userProfile.phone}).`;
  }

  return {
    templateId,
    titleEn,
    titlePl,
    titleRo,
    statutoryReference,
    recipientName: userProfile.employerName,
    recipientAddress: userProfile.employerAddress,
    senderName: userProfile.fullName,
    senderAddress: userProfile.homeAddress,
    senderPhone: userProfile.phone,
    senderEmail: userProfile.email,
    contentEn: sanitizeReadyToSendLetter(
      `${senderHeaderBlock}\n\n${englishBody}\n\n${signatureFooterBlock}`,
      userProfile
    ),
  };
}

/**
 * Ordered list of all document type categories used for automated tagging & filtering
 */
export const SENT_LETTER_TAG_CATEGORIES: SentLetterCategoryTag[] = [
  "Grievance",
  "Settlement",
  "Contract",
  "Wages",
  "Dismissal",
  "Sick Pay",
  "Data & GDPR",
];

/**
 * Automated Document Categorization Engine:
 * Inspects templateId, title, and letter content to assign a primary document category
 * ('Grievance', 'Settlement', 'Contract', 'Wages', 'Dismissal', 'Sick Pay', 'Data & GDPR')
 * along with all matching secondary category tags and statutory reference badge.
 */
export function classifySentLetter(
  letter: Pick<SentLetter, "templateId" | "title" | "content"> & {
    primaryTag?: SentLetterCategoryTag;
    tags?: SentLetterCategoryTag[];
    statutoryReference?: string;
  }
): {
  primaryTag: SentLetterCategoryTag;
  tags: SentLetterCategoryTag[];
  statutoryReference: string;
} {
  const combined = `${letter.templateId || ""} ${letter.title || ""} ${letter.content || ""}`.toLowerCase();
  const matchedTags = new Set<SentLetterCategoryTag>();

  // 1. Check direct template ID mappings first
  let detectedPrimary: SentLetterCategoryTag | null = letter.primaryTag || null;
  let detectedStatute = letter.statutoryReference || "";

  if (letter.templateId === "formal_grievance" || letter.templateId === "health_safety_breach") {
    detectedPrimary = detectedPrimary || "Grievance";
    matchedTags.add("Grievance");
    detectedStatute = detectedStatute || "ACAS Code No. 1 · s.199 TULRCA 1992";
  } else if (letter.templateId === "settlement_agreement") {
    detectedPrimary = detectedPrimary || "Settlement";
    matchedTags.add("Settlement");
    matchedTags.add("Contract");
    detectedStatute = detectedStatute || "s.111A & s.203(3) ERA 1996";
  } else if (letter.templateId === "flexible_working") {
    detectedPrimary = detectedPrimary || "Contract";
    matchedTags.add("Contract");
    detectedStatute = detectedStatute || "s.80F ERA 1996 · WTR 1998";
  } else if (letter.templateId === "unpaid_wages" || letter.templateId === "holiday_pay_claim") {
    detectedPrimary = detectedPrimary || "Wages";
    matchedTags.add("Wages");
    matchedTags.add("Contract");
    detectedStatute = detectedStatute || "Section 13 ERA 1996 · NMW Act 1998";
  } else if (letter.templateId === "constructive_dismissal") {
    detectedPrimary = detectedPrimary || "Dismissal";
    matchedTags.add("Dismissal");
    matchedTags.add("Contract");
    detectedStatute = detectedStatute || "s.95 & s.98 ERA 1996";
  } else if (letter.templateId === "statutory_sick_pay") {
    detectedPrimary = detectedPrimary || "Sick Pay";
    matchedTags.add("Sick Pay");
    detectedStatute = detectedStatute || "s.151 SSCBA 1992 · Form SSP1";
  } else if (letter.templateId === "sar_data_request") {
    detectedPrimary = detectedPrimary || "Data & GDPR";
    matchedTags.add("Data & GDPR");
    detectedStatute = detectedStatute || "Art. 15 UK GDPR · DPA 2018";
  }

  // 2. Deep content & statutory keyword classification
  const hasSettlementSignals =
    /\b(settlement|without prejudice|section 111a|s\.111a|section 203|early conciliation|ugod\w*|porozumieni\w*|rekompensat\w*|ex-gratia|amicable resolution|form et1)\b/i.test(
      combined
    );
  const hasGrievanceSignals =
    /\b(grievance|skarg\w*|plângere|bullying|harassment|mobbing\w*|discriminat\w*|unfair treatment|acas code of practice|section 199|section 44|health and safety)\b/i.test(
      combined
    );
  const hasContractSignals =
    /\b(contract\w*|umow\w*|terms of employment|working time regulations|section 80f|flexible working|shift pattern|mutual trust and confidence|breach of contract|zero-hours|hours per week|section 1 statement)\b/i.test(
      combined
    );
  const hasWagesSignals =
    /\b(unlawful deduction|section 13|wages|overtime|payslip|minimum wage|living wage|holiday pay|wynagrodzeni\w*|nadgodzin\w*|potrąc\w*|arrears|shortfall)\b/i.test(
      combined
    );
  const hasDismissalSignals =
    /\b(dismissal|constructive dismissal|unfair dismissal|section 95|section 98|zwolnieni\w*|wypowiedzeni\w*|disciplinary appeal|redundan\w*|termination)\b/i.test(
      combined
    );
  const hasSickSignals =
    /\b(statutory sick pay|\bssp\b|\bssp1\b|section 151|sickness absence|fit note|chorobow\w*|incapacity for work)\b/i.test(
      combined
    );
  const hasDataSignals =
    /\b(subject access request|\bsar\b|article 15|uk gdpr|data protection act|dane osobowe|turnstile|clock-in)\b/i.test(
      combined
    );

  if (hasGrievanceSignals) matchedTags.add("Grievance");
  if (hasSettlementSignals) matchedTags.add("Settlement");
  if (hasContractSignals) matchedTags.add("Contract");
  if (hasWagesSignals) matchedTags.add("Wages");
  if (hasDismissalSignals) matchedTags.add("Dismissal");
  if (hasSickSignals) matchedTags.add("Sick Pay");
  if (hasDataSignals) matchedTags.add("Data & GDPR");

  // Preserve any user-assigned tags
  if (Array.isArray(letter.tags)) {
    letter.tags.forEach((t) => {
      if (SENT_LETTER_TAG_CATEGORIES.includes(t)) {
        matchedTags.add(t);
      }
    });
  }

  // Determine primaryTag if not yet set by templateId
  if (!detectedPrimary) {
    if (/without prejudice|settlement agreement|section 111a|ugod/i.test(letter.title + " " + letter.content.slice(0, 300))) {
      detectedPrimary = "Settlement";
    } else if (/grievance|skarg/i.test(letter.title)) {
      detectedPrimary = "Grievance";
    } else if (/contract|working time|flexible|umow|grafik/i.test(letter.title)) {
      detectedPrimary = "Contract";
    } else if (hasWagesSignals) {
      detectedPrimary = "Wages";
    } else if (hasDismissalSignals) {
      detectedPrimary = "Dismissal";
    } else if (hasSickSignals) {
      detectedPrimary = "Sick Pay";
    } else if (hasDataSignals) {
      detectedPrimary = "Data & GDPR";
    } else if (hasSettlementSignals) {
      detectedPrimary = "Settlement";
    } else if (hasContractSignals) {
      detectedPrimary = "Contract";
    } else {
      detectedPrimary = "Grievance";
    }
  }

  matchedTags.add(detectedPrimary);

  // Order tags with primaryTag first, followed by canonical priority
  const orderedTags: SentLetterCategoryTag[] = [
    detectedPrimary,
    ...SENT_LETTER_TAG_CATEGORIES.filter((t) => t !== detectedPrimary && matchedTags.has(t)),
  ].slice(0, 3);

  if (!detectedStatute) {
    const statuteMatch = letter.content.match(/Statutory Basis:\s*([^\n]+)/i);
    detectedStatute = statuteMatch ? statuteMatch[1].trim() : "UK Employment Rights Act 1996";
  }

  return {
    primaryTag: detectedPrimary,
    tags: orderedTags,
    statutoryReference: detectedStatute,
  };
}

/**
 * Ensures a SentLetter object is enriched with automated primaryTag, tags, and statutoryReference
 */
export function ensureSentLetterTagged(letter: SentLetter): SentLetter {
  const classified = classifySentLetter(letter);
  return {
    ...letter,
    primaryTag: classified.primaryTag,
    tags: classified.tags,
    statutoryReference: letter.statutoryReference || classified.statutoryReference,
  };
}

/**
 * Visual & localized metadata for each document type tag
 */
export function getSentLetterTagMeta(
  tag: SentLetterCategoryTag,
  locale: Locale = "pl"
): {
  tag: SentLetterCategoryTag;
  label: string;
  badgeLabel: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  activeChipClass: string;
} {
  switch (tag) {
    case "Grievance":
      return {
        tag,
        label:
          locale === "pl"
            ? "Grievance (Skarga)"
            : locale === "ro"
            ? "Grievance (Plângere)"
            : "Grievance",
        badgeLabel: locale === "pl" ? "Grievance · Skarga" : "Grievance",
        bgClass: "bg-[#FF6A00]/20",
        textClass: "text-[#FF9E58]",
        borderClass: "border-[#FF6A00]/50",
        activeChipClass: "bg-[#FF6A00] text-black border-[#FF6A00]",
      };
    case "Settlement":
      return {
        tag,
        label:
          locale === "pl"
            ? "Settlement (Ugoda)"
            : locale === "ro"
            ? "Settlement (Acord)"
            : "Settlement",
        badgeLabel: locale === "pl" ? "Settlement · Ugoda" : "Settlement",
        bgClass: "bg-[#2EE59D]/20",
        textClass: "text-[#2EE59D]",
        borderClass: "border-[#2EE59D]/50",
        activeChipClass: "bg-[#2EE59D] text-black border-[#2EE59D]",
      };
    case "Contract":
      return {
        tag,
        label:
          locale === "pl"
            ? "Contract (Umowa)"
            : locale === "ro"
            ? "Contract (Contract)"
            : "Contract",
        badgeLabel: locale === "pl" ? "Contract · Umowa" : "Contract",
        bgClass: "bg-[#38BDF8]/20",
        textClass: "text-[#7DD3FC]",
        borderClass: "border-[#38BDF8]/50",
        activeChipClass: "bg-[#38BDF8] text-black border-[#38BDF8]",
      };
    case "Wages":
      return {
        tag,
        label:
          locale === "pl"
            ? "Wages (Płace)"
            : locale === "ro"
            ? "Wages (Salarii)"
            : "Wages",
        badgeLabel: locale === "pl" ? "Wages · Płace" : "Wages",
        bgClass: "bg-[#FBBF24]/20",
        textClass: "text-[#FDE047]",
        borderClass: "border-[#FBBF24]/50",
        activeChipClass: "bg-[#FBBF24] text-black border-[#FBBF24]",
      };
    case "Dismissal":
      return {
        tag,
        label:
          locale === "pl"
            ? "Dismissal (Zwolnienie)"
            : locale === "ro"
            ? "Dismissal (Concediere)"
            : "Dismissal",
        badgeLabel: locale === "pl" ? "Dismissal · Zwolnienie" : "Dismissal",
        bgClass: "bg-[#EF4444]/20",
        textClass: "text-[#FCA5A5]",
        borderClass: "border-[#EF4444]/50",
        activeChipClass: "bg-[#EF4444] text-white border-[#EF4444]",
      };
    case "Sick Pay":
      return {
        tag,
        label:
          locale === "pl"
            ? "Sick Pay (SSP)"
            : locale === "ro"
            ? "Sick Pay (SSP)"
            : "Sick Pay",
        badgeLabel: locale === "pl" ? "Sick Pay · SSP" : "Sick Pay",
        bgClass: "bg-[#A78BFA]/20",
        textClass: "text-[#C4B5FD]",
        borderClass: "border-[#A78BFA]/50",
        activeChipClass: "bg-[#A78BFA] text-black border-[#A78BFA]",
      };
    case "Data & GDPR":
      return {
        tag,
        label:
          locale === "pl"
            ? "Data & GDPR (SAR)"
            : locale === "ro"
            ? "Data & GDPR (SAR)"
            : "Data & GDPR",
        badgeLabel: locale === "pl" ? "Data & GDPR · SAR" : "Data & GDPR",
        bgClass: "bg-[#34D399]/20",
        textClass: "text-[#6EE7B7]",
        borderClass: "border-[#34D399]/50",
        activeChipClass: "bg-[#34D399] text-black border-[#34D399]",
      };
  }
}


