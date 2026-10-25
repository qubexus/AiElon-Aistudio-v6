# Ask Elon - UK Employment Law & Trade Union Companion (React SPA)

**ask Elon** is an AI-powered legal companion and trade union assistant for UK workers. It helps workers understand and enforce their statutory employment rights under the **Employment Rights Act 1996**, **ACAS Code of Practice No. 1**, **National Minimum Wage Act 1998**, and **Working Time Regulations 1998**.

The application is fully localized in **Polish (PL)**, **English (EN)**, and **Romanian (RO)**.

---

## Key Features

1. **AI Consultation with Elon (Czat)**:
   - Real-time legal advice tailored to UK workplace disputes.
   - Text-to-Speech (read-aloud responses) and Speech-to-Text (voice dictation).
   - Instant suggested prompt chips (unpaid overtime, SSP, cut hours, grievance, dismissal, holiday pay).
   - "Save chat as case" functionality.

2. **Case Management (Sprawy)**:
   - Full case tracking (Open / Resolved) with priority tags and sector categories.
   - Case timeline notes: record HR meetings, manager interactions, and evidence dates.
   - "Ask Elon about this case" with seamless pre-populated dispute context.

3. **Statutory Letters & Demands Generator (Pisma)**:
   - Ready-to-use formal legal letters under UK statutes:
     - Formal Letter of Grievance (ACAS Code of Practice No. 1)
     - Unlawful Deduction from Wages & Overtime Demand (Section 13 ERA 1996)
     - Statutory Sick Pay (SSP) Non-Payment Demand (HMRC Form SSP1 notice)
     - Subject Access Request (SAR - Article 15 UK GDPR / DPA 2018)
     - Statutory Flexible Working Request (Flexible Working Regulations 2024)
     - Notice of Resignation Due to Constructive Dismissal (Section 95(1)(c) ERA 1996)
   - Dynamic form wizard auto-populating employee and employer details.
   - One-click copy, .txt download, and archive to "Sent Letters".

4. **Workplace Community Forum (Forum)**:
   - Discussion boards organized by industry tags (Warehouse, Healthcare/NHS, Construction, Hospitality, Agency).
   - Helpful upvoting counter and threaded replies.

5. **Worker Profile & Hub (Profil)**:
   - Profile summary with calculated length of service (staż pracy).
   - **UK Employer Lookup**: search by UK postcode or Companies House registration number.
   - **Payslip & Contract AI Auditor**: checks for illegal deductions (e.g. PPE charges), National Living Wage compliance, and holiday pay accrual.
   - Personal incident log and dispute timeline.

6. **Admin Console & PRO Subscription**:
   - Platform metrics, promo code management (e.g. `ELON3M`), and broadcast notifications.
   - Elon PRO subscription (£9.99/mo).

---

## Technical Stack

- **Framework**: React 19 SPA (Vite, TypeScript)
- **Styling**: Tailwind CSS v4 (Lightweight, Dark theme matching `askelon.uk` brand tokens)
- **Icons**: Lucide React
- **AI Integration**: Gemini API (`@google/genai`) with fallback UK statutory engine
- **Port**: 3000 (`npm run dev`)
