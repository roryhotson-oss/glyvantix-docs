# GLYvantix Docs

**A research/collaboration platform publishing a 30-document clinical framework for the peptide therapeutics field.**

GLYvantix Docs is a Next.js 16 application that lets academic medical centres, NHS trusts, university research units and licensed clinical practices localise a peer-reviewed framework of consent, patient information and prescribing documents to their institution, then seek collaboration on the next version.

The framework is published for adoption and localisation only. Every generated document is a **template** — it must be reviewed and approved by the adopting institution's legal, pharmacy, information-governance and ethics functions before use with any patient.

---

## What's in this package

```
glyvantix-docs/
├── package.json                  # Next.js 16 + TypeScript + Tailwind 4 + Prisma
├── bun.lock                      # Lockfile (Bun)
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── components.json               # shadcn/ui config
├── .gitignore
├── .env.example                  # All env vars, placeholder secrets
├── prisma/
│   └── schema.prisma             # PostgreSQL schema (User, Subscription, Template,
│                                 # Document, Purchase, Branding)
├── public/
│   ├── logo.svg
│   └── robots.txt                # Default: block all crawlers
├── scripts/
│   ├── seed.ts                   # Seeds 12 generic business templates + default branding
│   ├── seed-branding.ts          # Seeds the singleton Branding row only
│   ├── seed-cla-pis.ts           # Seeds the 23 CLA + PIS templates
│   ├── seed-rxp.ts               # Seeds the 7 RXP templates
│   ├── reset-user.ts             # Resets the demo user to Free/1-credit
│   └── check-templates.ts        # Lists all templates + counts by category
└── src/
    ├── app/
    │   ├── layout.tsx            # Root layout, SEO metadata, canonical URL
    │   ├── page.tsx              # Single-page app with 7 tabs
    │   ├── globals.css           # Tailwind + brand CSS variables
    │   └── api/
    │       ├── branding/          # GET/PUT white-label settings
    │       ├── branding/reset/    # POST reset branding to defaults
    │       ├── templates/        # GET all templates
    │       ├── user/              # GET current user + subscription
    │       ├── subscribe/        # POST subscribe to a plan
    │       ├── buy/              # POST buy one template
    │       ├── credits/          # POST buy a credit pack
    │       ├── generate/          # POST template-based AI generation
    │       ├── generate-custom/  # POST free-form AI generation
    │       ├── documents/        # GET user's documents
    │       ├── documents/[id]/   # GET + DELETE single document
    │       ├── robots/           # Dynamic robots.txt (env-aware)
    │       ├── sitemap/          # Dynamic sitemap.xml (env-aware)
    │       └── route.ts          # Health check
    ├── components/
    │   ├── ui/                   # shadcn/ui component library (New York)
    │   └── docforge/             # App components
    │       ├── branding-context.tsx
    │       ├── brand-logo.tsx
    │       ├── clinician-attestation.tsx
    │       ├── collaborate-tab.tsx
    │       ├── customize-tab.tsx
    │       ├── dashboard-tab.tsx
    │       ├── document-view.tsx
    │       ├── home-tab.tsx
    │       ├── builder-tab.tsx
    │       ├── markdown.tsx
    │       ├── pricing-tab.tsx    # Kept for future commercial use; not in nav
    │       ├── research-tab.tsx
    │       ├── site-footer.tsx
    │       ├── site-header.tsx
    │       ├── templates-tab.tsx
    │       ├── template-icon.tsx
    │       ├── api.ts             # Typed fetch wrappers
    │       └── types.ts
    ├── lib/
    │   ├── db.ts                 # Prisma client singleton
    │   ├── branding.ts           # Branding helpers + validators
    │   └── utils.ts              # cn() Tailwind helper
    └── hooks/
        ├── use-mobile.ts
        └── use-toast.ts
```

---

## The 30 framework documents

All 30 documents are seeded by `scripts/seed-cla-pis.ts` and `scripts/seed-rxp.ts`.
The source PDFs are NOT included in this package (they are the user's IP). To regenerate
the seed scripts from updated PDFs, drop them in an `upload/` folder and re-run the
extraction + seeding process.

### Consent & Legal Authorisation (CLA) — 12 documents

| Code | Title | Source filename |
|---|---|---|
| CLA-001 | Master Patient Consent Form — Peptide Therapeutic Administration | `CLA-001_Master_Patient_Consent_Form_—_Peptide_Therapeutic_Ad.pdf` |
| CLA-002 | Short-Form Consent to Treatment — Established Peptide Protocol | `CLA-002_Short-Form_Consent_to_Treatment_—_Established_Peptid.pdf` |
| CLA-003 | Informed Consent to Participate in Research — Full ICF | `CLA-003_Informed_Consent_to_Participate_in_Research_—_Full_I.pdf` |
| CLA-004 | HIPAA Authorization & UK GDPR Privacy Notice | `CLA-004_HIPAA_Authorization_&_UK_GDPR_Privacy_Notice.pdf` |
| CLA-005 | Parental Permission and Paediatric Assent Form | `CLA-005_Parental_Permission_and_Paediatric_Assent_Form.pdf` |
| CLA-006 | Consultee, Surrogate and Legally Authorised Representative Declaration | `CLA-006_Consultee,_Surrogate_and_Legally_Authorised_Represen.pdf` |
| CLA-007 | Emergency and Deferred Consent Record | `CLA-007_Emergency_and_Deferred_Consent_Record.pdf` |
| CLA-008 | Off-Label and Unlicensed Use Authorisation | `CLA-008_Off-Label_and_Unlicensed_Use_Authorisation.pdf` |
| CLA-009 | Telehealth Consent and Remote Prescribing Record | `CLA-009_Telehealth_Consent_and_Remote_Prescribing_Record.pdf` |
| CLA-010 | Withdrawal of Consent and Study Discontinuation Form | `CLA-010_Withdrawal_of_Consent_and_Study_Discontinuation_Form.pdf` |
| CLA-011 | Re-Consent and Protocol Amendment Acknowledgement | `CLA-011_Re-Consent_and_Protocol_Amendment_Acknowledgement.pdf` |
| CLA-012 | Photography, Imaging and Media Release | `CLA-012_Photography,_Imaging_and_Media_Release.pdf` |

### Patient Information Sheets (PIS) — 11 documents

| Code | Title | Source filename |
|---|---|---|
| PIS-001 | Peptide Therapy — General Patient Information Sheet | `PIS-001_Peptide_Therapy_—_General_Patient_Information_Sheet.pdf` |
| PIS-002 | Patient Information — GLP-1 Receptor Agonists (Semaglutide, Liraglutide, Dulaglutide) | `PIS-002_Patient_Information_—_GLP-1_Receptor_Agonists_(Semag.pdf` |
| PIS-003 | Patient Information — Dual and Triple Incretin Agonists (Tirzepatide, Retatrutide) | `PIS-003_Patient_Information_—_Dual_and_Triple_Incretin_Agoni.pdf` |
| PIS-004 | Patient Information — Growth Hormone Secretagogues (CJC-1295, Ipamorelin, Tesamorelin, Sermorelin) | `PIS-004_Patient_Information_—_Growth_Hormone_Secretagogues_(.pdf` |
| PIS-005 | Patient Information — BPC-157 and Thymosin Beta-4 / TB-500 | `PIS-005_Patient_Information_—_BPC-157_and_Thymosin_Beta-4_-_.pdf` |
| PIS-006 | Patient Information — Thymosin Alpha-1 and Immune-Modulating Peptides | `PIS-006_Patient_Information_—_Thymosin_Alpha-1_and_Immune-Mo.pdf` |
| PIS-007 | Patient Information — Melanocortin Analogues (Afamelanotide, Bremelanotide, Melanotan II) | `PIS-007_Patient_Information_—_Melanocortin_Analogues__Afamel.pdf` |
| PIS-008 | Patient Information — Copper Peptide GHK-Cu and Cosmetic Peptides | `PIS-008_Patient_Information_—_Copper_Peptide_GHK-Cu_and_Cosm.pdf` |
| PIS-009 | Patient Information — Bone, Muscle and Metabolic Peptides (Teriparatide, Abaloparatide, Setmelanotide) | `PIS-009_Patient_Information_—_Bone,_Muscle_and_Metabolic_Pep.pdf` |
| PIS-010 | Patient Information — Peptide Hormone Analogues (Octreotide, Leuprolide, Desmopressin, Oxytocin) | `PIS-010_Patient_Information_—_Peptide_Hormone_Analogues_(Oct.pdf` |
| PIS-011 | Patient Information — Investigational Peptide in a Clinical Trial | `PIS-011_Patient_Information_—_Investigational_Peptide_in_a_C.pdf` |

### Prescribing, Pharmacy & Dosing (RXP) — 7 documents

| Code | Title | Source filename |
|---|---|---|
| RXP-001 | Peptide Prescription Form — Controlled Template | `RXP-001_Peptide_Prescription_Form_—_Controlled_Template.pdf` |
| RXP-002 | Peptide Dosing Quick Reference — Licensed Agents | `RXP-002_Peptide_Dosing_Quick_Reference___Licensed_Agents.pdf` |
| RXP-003 | Reconstitution, Dilution and Compounding Record | `RXP-003_Reconstitution,_Dilution_and_Compounding_Record.pdf` |
| RXP-004 | Dose Calculation and Unit Conversion Worksheet | `RXP-004_Dose_Calculation_and_Unit_Conversion_Worksheet.pdf` |
| RXP-005 | Medication Administration Record (MAR) — Peptide Therapy | `RXP-005_Medication_Administration_Record_(MAR)_—_Peptide_The.pdf` |
| RXP-006 | Pharmacy Clinical Screening and Verification Checklist | `RXP-006_Pharmacy_Clinical_Screening_and_Verification_Checkli.pdf` |
| RXP-010 | Formulary Submission and New Agent Evaluation Form | `RXP-010_Formulary_Submission_and_New_Agent_Evaluation_Form.pdf` |

### Notes on the suite
- **CLA-001 through CLA-012**: complete, no gaps.
- **PIS-001 through PIS-011**: complete, no gaps.
- **RXP-001 through RXP-010**: **RXP-007, RXP-008, RXP-009 are not yet supplied** — the suite is 7 documents, not 10. If you have the missing PDFs, drop them in `upload/` and re-run the seeding process.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Prisma ORM + PostgreSQL (production) / SQLite (local dev) |
| AI | OpenAI-compatible server-side provider via `AI_API_KEY`, `AI_BASE_URL`, and `AI_MODEL` |
| Auth | `next-auth@4` (installed, demo user by default — wire up for real users) |
| State | React hooks + lifted state in `page.tsx` |
| Animations | Framer Motion |
| Toasts | Sonner |
| Markdown | `react-markdown` |
| Icons | Lucide React |

---

## Required environment variables

See `.env.example` for the full template. The two REQUIRED for production:

| Variable | Required | Example |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public` |
| `SITE_CANONICAL_URL` | Yes | `https://docs.glyvantix.co.uk` |
| `SITE_INDEXABLE` | Yes (set to `"true"` for production) | `true` |

Future additions (not required for first deploy):
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — when you re-introduce commerce

Production authentication uses Google OAuth through NextAuth. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
`GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET` in Vercel, and add the callback URL
`https://docs.glyvantix.co.uk/api/auth/callback/google` to the Google OAuth client.

---

## Local development

### Prerequisites
- Node.js 20+
- Bun (recommended) or npm
- A PostgreSQL database (local or cloud) — OR switch `prisma/schema.prisma` provider to `sqlite` for quick local dev

### Steps
```bash
# 1. Install dependencies
bun install

# 2. Copy env and set your DATABASE_URL
cp .env.example .env
# Edit .env and set DATABASE_URL to your Postgres connection string

# 3. Create the database tables
bun run db:push

# 4. Seed the framework documents + branding
bun run scripts/seed.ts          # 12 generic business templates + default branding
bun run scripts/seed-cla-pis.ts  # 23 CLA + PIS templates
bun run scripts/seed-rxp.ts      # 7 RXP templates

# 5. (Optional) Verify the seed
bun run scripts/check-templates.ts

# 6. Start the dev server
bun run dev
# App is at http://localhost:3000
```

For quick local dev without Postgres, swap the provider in `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
and set `DATABASE_URL="file:./dev.db"` in `.env`. Re-run `db:push` and the seed scripts.

---

## Production deployment (Vercel)

### Prerequisites
- A Vercel account
- A Postgres database (Neon / Supabase / Vercel Postgres)
- The git repo pushed to GitHub

### Steps
```bash
# 1. Push this folder to GitHub
cd glyvantix-docs
git init
git add .
git commit -m "Initial commit: GLYvantix Docs research framework"
git branch -M main
git remote add origin https://github.com/<your-user>/glyvantix-docs.git
git push -u origin main

# 2. In Vercel:
#    - "Add New Project" → import the GitHub repo
#    - Framework preset: Next.js (auto-detected)
#    - Build command: next build (auto-detected)
#    - Install command: bun install (or npm install)

# 3. Set the env vars in Vercel → Settings → Environment Variables:
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
SITE_CANONICAL_URL=https://docs.glyvantix.co.uk
SITE_INDEXABLE=true

# 4. Deploy. Vercel runs `next build` automatically.

# 5. After the first deploy, run the seed scripts ONCE.
#    Easiest way: use Vercel's "Terminal" or run the seeds locally
#    with the production DATABASE_URL set in your .env, then push
#    the resulting DB state is already live (no extra deploy needed).

# 6. Add the custom domain in Vercel:
#    Settings → Domains → add "docs.glyvantix.co.uk"
#    Vercel tells you the DNS record to add.

# 7. In your DNS provider (Fasthosts / Cloudflare / etc.):
#    Add a CNAME record:
#      docs.glyvantix.co.uk → cname.vercel-dns.com
#    Vercel issues free SSL automatically.

# 8. Wait for DNS to propagate (usually minutes), then visit
#    https://docs.glyvantix.co.uk — the app is live.
```

### Important: deploy as a SEPARATE project
**Do NOT overwrite the existing `glyvantix-research` Vercel project** (the WordPress marketing site at `glyvantix.co.uk`). Import this repo as a **new** Vercel project with a different name (e.g. `glyvantix-docs`) and assign it the `docs.glyvantix.co.uk` subdomain. The two sites then live side by side:
- `glyvantix.co.uk` → existing WordPress marketing site (untouched)
- `docs.glyvantix.co.uk` → this Next.js research framework app (new)

---

## Using the app

### The 7 tabs

1. **Home** — landing page with hero, features, "how it works"
2. **Research** — methodology, regulatory anchors, reviewer panel, version history, citation block
3. **Builder** — pick a document, fill in institution details, generate a localised draft
4. **Templates** — browse all 30 documents by category (CLA / PIS / RXP + generic business)
5. **Collaborate** — submit amendments, join the consortium, request advisory (opens pre-filled email)
6. **Dashboard** — your generated documents with preview, download, delete
7. **Customize** — white-label the app (company name, logo, fonts, colors, document protection)

### Clinician attestation
The first time a user tries to generate a clinical document (CLA / PIS / RXP), they must complete a one-time attestation confirming they're an appropriately licensed prescriber acting within scope of practice and will localise + obtain institutional approval before use. Stored in `localStorage` — re-attest any time from the Research tab.

### Document protection
Every generated document carries:
- A letterhead (your institution's monogram + name)
- A diagonal watermark (reader email + institution + date — every copy is traceable)
- Copy-protection (right-click + text selection disabled)
- A regulatory warning banner for clinical categories ("Template — not for direct patient use")
- Optional paywall (first paragraph only for free users — toggle in Customize tab)

### White-label / rebrand
Go to the **Customize** tab to set:
- Company name, tagline, URL slug, contact email
- Logo (upload PNG/SVG up to 200KB) OR monogram icon
- Heading + body fonts (serif / sans / mono)
- Brand colors (6 presets + custom color pickers)
- Document protection toggles (watermark / paywall / copy-protect)

Changes apply across the whole app instantly — no redeploy needed.

---

## Demo user

By default the app uses a single hardcoded demo user with email `demo@glyvantix.app` (looked up in every API route). This is fine for a single-tenant research tool. To support real users, wire up NextAuth.js v4 (already installed) and replace the demo user lookup with `getServerSession()`.

---

## Legal & regulatory notice

**This software is a research framework, not a regulatory-approved clinical product.** Every document it generates is a **template** that must be:
- Localised to the adopting institution
- Verified against current licensed product information and local formulary
- Reviewed by the institution's legal, pharmacy, information-governance and ethics functions
- Approved by the institution's IRB/REC where applicable

**GLYvantix Research does not provide medical or legal advice.** The software is supplied as-is with no warranty of clinical or legal sufficiency. Use of the templates with any patient is at the sole risk and responsibility of the adopting institution and the licensed prescriber.

The CLA, PIS and RXP documents cite their regulatory anchors verbatim (21 CFR 50, 45 CFR 46, UK GDPR, ICH E6(R3), Montgomery v Lanarkshire (2015), UK Human Medicines Regulations 2012, FD&C Act §503A/§503B, USP `<797>`, 21 CFR 312.62). Where frameworks differ, the more protective requirement applies.

**Before launch**, the adopting organisation should:
1. Register as a limited company (if not already)
2. Obtain professional indemnity / public liability insurance
3. Have a solicitor review the T&Cs, disclaimer and first 3 templates
4. Name 2–3 real reviewers on the Research tab
5. File the GLYVANTIX™ trademark (UK IPO, Class 16 + Class 42)

---

## Licence

This software is © GLYvantix Research. All rights reserved.
No licence is granted to copy, modify, or distribute this software without express written permission from GLYvantix Research.

The 30 clinical document templates (CLA, PIS, RXP) are © GLYvantix Research. They are published for adoption and localisation by lawful, supervised clinical research contexts. They may not be resold or redistributed without a licence.

---

## Support / collaboration

- Research & methodology: see the in-app **Research** tab
- Submit an amendment: see the in-app **Collaborate** tab
- Join the consortium: see the in-app **Collaborate** tab
- Advisory / bespoke drafting: see the in-app **Collaborate** tab
- General enquiries: `hello@glyvantix.co.uk`
