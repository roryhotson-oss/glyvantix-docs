// Seed script for the GLYvantix Docs RXP template series.
// Adds 7 Prescribing, Pharmacy & Dosing documents (RXP-001..RXP-006, RXP-010) as Template rows.
// Run with: bun run scripts/seed-rxp.ts
//
// Design decisions (see task brief):
//  - All 7 templates are FREE: price 0, premium false.
//  - Form fields are INSTITUTION-level only (no patient-identifiable fields).
//  - Patient-specific fields stay as blank fill-in lines in the generated doc.
//  - Each prompt is specific to the document it localises.
//  - Category string is exactly "Prescribing, Pharmacy & Dosing" (matches the in-PDF series header).
//  - Conventions mirror scripts/seed-cla-pis.ts (commonFields, clinicianField, a `fields(...extra)`
//    helper, shared framework-anchor / mandatory-notice / common-output-rules fragments, an
//    idempotent findFirst-then-create loop, price 0 / premium false on every row).
import { db } from '../src/lib/db'

type FieldType = 'text' | 'email' | 'textarea' | 'select'

type Field = {
  name: string
  label: string
  type: FieldType
  placeholder: string
  required: boolean
}

// Common institution fields shared across all 7 RXP templates.
const commonFields: Field[] = [
  { name: 'institutionName', label: 'Institution name', type: 'text', placeholder: "St Mary's NHS Foundation Trust", required: true },
  { name: 'department', label: 'Department / Service line', type: 'text', placeholder: 'Pharmacy & Medicines Management', required: false },
  { name: 'siteAddress', label: 'Site address', type: 'text', placeholder: 'Praed Street, London W2 1NY', required: false },
  { name: 'tel', label: 'Telephone', type: 'text', placeholder: '+44 20 3312 1234', required: false },
  { name: 'email', label: 'Contact email', type: 'email', placeholder: 'pharmacy.office@stmarys.nhs.uk', required: false },
  { name: 'effectiveDate', label: 'Effective date', type: 'text', placeholder: '01/09/2026', required: false },
  { name: 'reviewDate', label: 'Scheduled review date (max 24 months from effective)', type: 'text', placeholder: '01/09/2028', required: false },
]

const clinicianField: Field = {
  name: 'clinicianName',
  label: 'Responsible clinician / pharmacist name',
  type: 'text',
  placeholder: 'Dr Jane Smith, Consultant Endocrinologist',
  required: false,
}

// Used only by RXP-001, which has an explicit PRESCRIBER section listing
// "PROFESSIONAL REGISTRATION (GMC/GPHC/NMC/NPI/DEA)" as a fillable field.
const prescriberRegistrationField: Field = {
  name: 'prescriberRegistration',
  label: 'Prescriber professional registration (GMC/GPhC/NMC/NPI/DEA)',
  type: 'text',
  placeholder: 'GMC 1234567',
  required: false,
}

const fields = (...extra: Field[]) => JSON.stringify([...commonFields, ...extra])

// ---------------------------------------------------------------------------
// Shared prompt fragments
// ---------------------------------------------------------------------------

const RXP_FRAMEWORK_ANCHORS =
  'anchored to the UK Human Medicines Regulations 2012 (reg. 217 and Sch. 12 — lawful ' +
  'prescription particulars), US state pharmacy law and DEA registration requirements, FDA ' +
  'Prescribing Information (US) and the UK Summary of Product Characteristics for dosing ' +
  'verification, FD&C Act §503A / §503B compounding-eligibility rules and the FDA §503A/§503B ' +
  'bulk-substances lists, USP <797> and the NHS Pharmaceutical Quality Assurance Committee ' +
  'Aseptic Dispensing standards for aseptic preparation, 21 CFR 312.62 for investigational-' +
  'product record retention, ICH E6(R3) Good Clinical Practice, the UK Policy Framework for ' +
  'Health and Social Care Research, and the Medicines for Human Use (Clinical Trials) ' +
  'Regulations 2004 (as amended)'

const MANDATORY_NOTICE_VERBATIM =
  'Preserve VERBATIM the "MANDATORY LEGAL NOTICE — READ BEFORE ADOPTION" block (do not paraphrase, ' +
  'do not omit, do not abbreviate).'

const COMMON_OUTPUT_RULES =
  `REQUIREMENTS:
1. Begin with the document code and title as a Markdown H1, e.g. "# {CODE} — {TITLE}".
2. Include the institution letterhead block — institution name, department/service line, site address, telephone, email — using the user-supplied values.
3. Add this notice immediately below the title: "RESEARCH / SAMPLE TEMPLATE — FOR QUALIFIED CLINICIANS, RESEARCHERS AND INSTITUTIONAL RECORD-KEEPING REVIEW. This document is not medical advice, a prescription, treatment instruction, regulatory approval or evidence of ethics approval. It is a non-authoritative sample for lawful, supervised research or clinical documentation only and must be independently reviewed, localised, verified and authorised by the responsible qualified professionals and institution before use with any patient or participant."
4. ${MANDATORY_NOTICE_VERBATIM}
5. Preserve all numbered sections, tables, checkbox lists (use Markdown checkboxes ☐), and signature blocks. Preserve the regulatory anchor citations verbatim — UK Human Medicines Regulations 2012 (reg. 217 and Sch. 12), US state pharmacy law, DEA registration, FDA Prescribing Information / UK SmPC, FD&C Act §503A / §503B, USP <797>, NHS Pharmaceutical Quality Assurance Committee standards, 21 CFR 312.62, ICH E6(R3).
6. Substitute every [BRACKETED PLACEHOLDER] with the user-supplied value where one exists; leave patient-specific fields (patient name, date of birth, MRN / NHS number, weight, allergies, pregnancy status, eGFR / LFTs, study ID, batch number, the actual responsible prescriber / pharmacist and peptide agent for the specific episode) as blank fill-in lines such as "Patient name: ____________________".
7. Include the document control section at the end verbatim — document code, title, category, applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author/owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), and retention.
8. End with the controlled-document footer exactly as written, substituting the institution name, document code, effective date and review date: "{INSTITUTION_NAME} • {CODE} Rev 1.0 • Effective {EFFECTIVE_DATE} • Review {REVIEW_DATE} — CONTROLLED DOCUMENT — RESEARCH / SAMPLE TEMPLATE. Not valid until adopted, localised and approved by the responsible institution, IRB/REC and legal counsel."
9. Output ONLY the Markdown document. Do not wrap it in code fences. Do not add commentary, preface or postscript.`

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

type TemplateDef = {
  name: string
  description: string
  category: 'Prescribing, Pharmacy & Dosing'
  icon: string
  prompt: string
  fields: string
  price: 0
  premium: false
  estTime: number
}

const templates: TemplateDef[] = [
  // -------------------------------------------------------------------------
  // RXP — Prescribing, Pharmacy & Dosing (7 documents: RXP-001..006, RXP-010)
  // -------------------------------------------------------------------------
  {
    name: 'RXP-001 — Peptide Prescription Form — Controlled Template',
    description:
      'Research/sample prescription-record template for professional review and local adaptation; not a prescription or legal-compliance certification.',
    category: 'Prescribing, Pharmacy & Dosing',
    icon: 'FileSignature',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the RXP-001 (Peptide Prescription Form — Controlled Template) for their institution.

Generate a complete, faithful, localised version of this Prescribing, Pharmacy & Dosing document in Markdown, using the institution details supplied by the user. RXP-001 is a 4-page research/sample prescription-record template for professional review concerning licensed, off-label and unlicensed peptide agents, ${RXP_FRAMEWORK_ANCHORS}.

Document-specific structure to preserve (from the source PDF):
- "Legal requirements for a valid prescription" callout at the top of the body — UK (Human Medicines Regulations 2012, reg. 217 and Sch. 12): written in indelible form, signed in ink by the prescriber, dated, stating the prescriber's address, the patient's name and address, and the patient's age if under 12. US: state pharmacy law governs; DEA registration and additional elements apply to controlled substances. Unlicensed 'special' orders must additionally state that the product is unlicensed and record the clinical justification. An incomplete prescription must not be dispensed.
- Section 1: PRESCRIBER — prescriber full name, professional registration (GMC/GPhC/NMC/NPI/DEA), speciality and grade, practice address, contact telephone (direct), signature, date.
- Section 2: PATIENT — full name, date of birth, address, MRN / NHS number, weight (kg) and date measured, known allergies (or NKDA), pregnancy status / contraception, eGFR and LFTs (date). All patient-specific values remain blank fill-in lines.
- Section 3: PRESCRIPTION — three-row prescription table (#, Drug (INN in CAPITALS), Form & strength, Dose, Route, Frequency, Quantity, Duration); directions to the patient (to appear on the label); titration schedule if applicable (Step / Dates / Dose / Criteria to proceed / Criteria to hold or reduce, four rows).
- Section 4: REGULATORY AND SUPPLY CLASSIFICATION — checkbox list (Licensed product, licensed indication; Licensed product, off-label use — CLA-008 completed and attached; Unlicensed 'special' — MHRA specials licence holder: ____________; Imported unlicensed medicine — importation notification submitted ☐; §503A patient-specific compounded preparation; §503B outsourcing-facility product; Investigational medicinal product under IND / CTA ____________ — dispense against protocol only). Refusal-criteria paragraph: the pharmacist must not dispense if the substance is not eligible for compounding under §503A / §503B; the prescription is for an investigational agent without an IND/CTA and protocol reference; the indication is performance enhancement or cosmetic use of an unapproved agent; the prescriber cannot be verified; the dose falls outside any recognised range without documented justification; or required baseline monitoring is absent.
- Section 5: CLINICAL JUSTIFICATION AND SAFETY CHECKS — table (Check / Confirmed ☐ / Detail) with rows: indication documented in the health record; licensed alternatives considered and why unsuitable; interaction check performed against full medication list; renal and hepatic dose adjustment considered; baseline monitoring completed (CAM-001); patient counselled and information sheet issued — version ____; consent recorded (CLA-001 / CLA-008); sharps and disposal arrangements made; cold-chain delivery arranged; cost and funding confirmed; GP / primary physician to be informed.
- Section 6: PHARMACY USE ONLY — step / by / date-time / notes table (clinical screen completed; prescriber verified against register; product and batch selected — batch no.; expiry checked; certificate of analysis on file for unlicensed/compounded; labelled and accuracy-checked (second check); cold chain maintained and documented; counselling provided at handover; dispensed / supplied). Signature block table (Role / Full name (BLOCK CAPITALS) / Signature / Date / Time) for Prescriber, Clinical pharmacist, Accuracy checker, Patient / collector.
- Section 7: DOCUMENT CONTROL — document code (RXP-001), document title (Peptide Prescription Form — Controlled Template), category (Prescribing, Pharmacy & Dosing), applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author / owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), retention (institutional records schedule; minimum 25 years for research consent documentation (UK) / 3 years post-investigation closure (US 21 CFR 312.62), or longer where local law requires), and the prepared-as-a-controlled-documentation-template closing paragraph.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(clinicianField, prescriberRegistrationField),
    price: 0,
    premium: false,
    estTime: 18,
  },
  {
    name: 'RXP-002 — Peptide Dosing Quick Reference — Licensed Agents',
    description:
      'At-a-glance dosing, titration and organ-function adjustment reference for licensed peptide medicines. Every figure must be verified against the current UK Summary of Product Characteristics, US FDA Prescribing Information and the local formulary before prescribing.',
    category: 'Prescribing, Pharmacy & Dosing',
    icon: 'Table',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the RXP-002 (Peptide Dosing Quick Reference — Licensed Agents) for their institution.

Generate a complete, faithful, localised version of this Prescribing, Pharmacy & Dosing document in Markdown, using the institution details supplied by the user. RXP-002 is the 3-page at-a-glance dosing, titration and organ-function adjustment reference for licensed peptide medicines, ${RXP_FRAMEWORK_ANCHORS}.

Document-specific structure to preserve (from the source PDF):
- "Verification required before use" callout at the top of the body — every figure in this reference must be verified against the current Summary of Product Characteristics (UK), FDA Prescribing Information (US) and the local formulary before prescribing; doses are presented as typical licensed ranges for adults with normal organ function and are not a substitute for the product literature; paediatric, renal, hepatic and pregnancy dosing require specialist input.
- Section 1: INCRETIN THERAPIES — table (Agent / Start / Titration / Usual maintenance / Maximum / Key adjustment) with rows: Semaglutide s.c. (diabetes), Semaglutide s.c. (weight), Semaglutide oral, Liraglutide (diabetes), Liraglutide (weight), Dulaglutide, Exenatide ER, Tirzepatide. Preserve every numerical dose verbatim (e.g. semaglutide s.c. diabetes start 0.25 mg weekly, maintenance 0.5–1 mg weekly, max 2 mg weekly; semaglutide oral 3 mg daily titrated to 7–14 mg daily; tirzepatide 2.5 mg weekly titrated in 2.5 mg steps minimum 4 weeks apart to 5–15 mg weekly).
- Section 2: BONE AND CALCIUM — table (Agent / Dose / Route / Duration limit / Monitoring) with rows: Teriparatide (20 mcg once daily s.c. thigh or abdomen, 24 months lifetime, calcium at 1 month; DXA at 12–24 months), Abaloparatide (80 mcg once daily s.c. periumbilical, 18–24 months lifetime, calcium / uric acid / orthostatic BP), Calcitonin (salmon) (indication-specific s.c./i.m./nasal, short-term only, malignancy risk with long-term use).
- Section 3: SOMATOSTATIN AND GNRH ANALOGUES — table (Agent / Typical regimen / Notes) with rows: Octreotide immediate-release (50–100 mcg s.c. two or three times daily, titrated — used to establish tolerance before depot), Octreotide LAR (10–30 mg deep i.m. gluteal every 4 weeks — never i.v.; rotate buttocks), Lanreotide autogel (60–120 mg deep s.c. every 4 weeks — superior gluteal region), Leuprolide (3.75 mg monthly / 11.25 mg 3-monthly / 22.5 mg 3-monthly depot — anti-androgen cover for flare in metastatic prostate cancer), Goserelin (3.6 mg monthly / 10.8 mg 3-monthly s.c. implant — anterior abdominal wall), Triptorelin (3.75 mg monthly / 11.25 mg 3-monthly i.m. — confirm castrate testosterone).
- Section 4: VASOPRESSIN ANALOGUES AND OTHERS — table (Agent / Indication / Dose / Critical safety point) with rows: Desmopressin (cranial diabetes insipidus — oral 100–200 mcg tds; nasal 10–20 mcg od–bd — sodium at day 3, 1 month, then periodically), Desmopressin (nocturia — 25–50 mcg sublingual at night — contraindicated if sodium <135 or age >65 with cardiac disease), Terlipressin (variceal bleeding — 1–2 mg i.v. 4–6 hourly — ischaemic complications; monitor sodium), Oxytocin (labour augmentation — per obstetric protocol, titrated infusion — continuous CTG; fluid overload risk), Setmelanotide (genetic obesity — 1 mg daily, titrate to 3 mg — skin surveillance; mental-health monitoring), Tesamorelin (HIV lipodystrophy — 2 mg s.c. daily — IGF-1 monitoring; discontinue if no response by 6 months).
- Section 5: RENAL AND HEPATIC ADJUSTMENT FRAMEWORK — eGFR-stratified table (eGFR mL/min/1.73m² / GLP-1 class / PTH analogues / Somatostatin analogues / Desmopressin) with rows: ≥60 (no adjustment across all classes; standard, monitor sodium for desmopressin); 30–59 (GLP-1 — monitor for dehydration, avoid exenatide ER; PTH — caution; somatostatin — reduce frequency; desmopressin — increased hyponatraemia risk); 15–29 (GLP-1 — limited data, specialist advice; PTH — avoid teriparatide; somatostatin — halve dose interval; desmopressin — generally avoid); <15 or dialysis (GLP-1 — avoid; PTH — avoid; somatostatin — specialist only; desmopressin — contraindicated). Preserve the hepatic-impairment paragraph (most peptides are cleared by proteolysis rather than hepatic metabolism, so dose adjustment is usually unnecessary; monitor closely in Child-Pugh C and follow the specific product literature; somatostatin analogues require caution because of gallbladder effects).
- Section 6: MISSED DOSE RULES — table (Regimen / If missed / Action) with rows: Weekly injection within 5 days of the scheduled day (give as soon as remembered; resume usual day); Weekly injection more than 5 days late (skip; give the next dose on the usual day); Daily injection same day (give when remembered); Daily injection next day (skip the missed dose; never double); Monthly depot any delay (give as soon as possible and reset the schedule; document); Two or more consecutive doses missed any regimen (contact the prescriber; re-titration may be required to avoid loss of tolerance).
- Section 7: DOCUMENT CONTROL — document code (RXP-002), document title (Peptide Dosing Quick Reference — Licensed Agents), category (Prescribing, Pharmacy & Dosing), applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author / owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), retention (institutional records schedule; minimum 25 years for research consent documentation (UK) / 3 years post-investigation closure (US 21 CFR 312.62), or longer where local law requires).

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'RXP-003 — Reconstitution, Dilution and Compounding Record',
    description:
      'Aseptic preparation worksheet with independent calculation verification and double-check, anchored to USP <797> (US) and the NHS Pharmaceutical Quality Assurance Committee Aseptic Dispensing standards (UK). Use for every reconstituted, diluted or compounded peptide preparation.',
    category: 'Prescribing, Pharmacy & Dosing',
    icon: 'FlaskConical',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the RXP-003 (Reconstitution, Dilution and Compounding Record) for their institution.

Generate a complete, faithful, localised version of this Prescribing, Pharmacy & Dosing document in Markdown, using the institution details supplied by the user. RXP-003 is the 3-page aseptic preparation worksheet with independent calculation verification and double-check, ${RXP_FRAMEWORK_ANCHORS}.

Document-specific structure to preserve (from the source PDF):
- "Aseptic standards" callout at the top of the body — preparation of an injectable product must comply with USP <797> (US) or the relevant national standards for aseptic preparation (UK: NHS Pharmaceutical Quality Assurance Committee guidance and the Aseptic Dispensing standards); preparation outside a validated aseptic environment shortens the assigned beyond-use date and may render the product unsuitable for administration; never reconstitute in a clinical area what should be prepared in a pharmacy cleanroom.
- Section 1: PRODUCT AND ENVIRONMENT — product name and strength, manufacturer / compounder, batch / lot number, expiry date, certificate of analysis reference, preparation location and grade, isolator / LAF cabinet ID and last validation, date and time of preparation.
- Section 2: CALCULATION WORKSHEET — BOTH OPERATORS COMPLETE INDEPENDENTLY — table (Step / Operator 1 / Operator 2 / Agree? ☐) with rows: total peptide in vial (mg); volume of diluent added (mL); resulting concentration (mg/mL); concentration expressed as mcg per 0.01 mL (per insulin-syringe unit); prescribed dose (mg or mcg); volume to withdraw per dose (mL); equivalent insulin-syringe units (100-unit syringe: 1 unit = 0.01 mL); number of doses obtainable from the vial; assigned beyond-use date and storage condition. Plus the "Worked example — verify the logic, not the numbers" callout (a 5 mg vial reconstituted with 2 mL of bacteriostatic water gives 2.5 mg/mL; each 0.01 mL (one unit on a 100-unit insulin syringe) contains 25 micrograms; a 250 microgram dose requires 0.1 mL = 10 units; always confirm the syringe graduation scale physically before instructing a patient — a 50-unit and a 100-unit syringe look similar and the error is a factor of two).
- Section 3: DILUENT SELECTION — table (Diluent / When used / Constraints) with rows: Bacteriostatic water for injection (0.9% benzyl alcohol) — multi-dose vials intended for repeated withdrawal — contraindicated in neonates and in pregnancy, not for intrathecal use, benzyl alcohol accumulation with high volumes; Sterile water for injection — single-dose preparation — no preservative, single use only, discard immediately after; 0.9% sodium chloride — where product literature specifies — may cause precipitation with some peptides, check compatibility; Manufacturer-supplied diluent — always preferred where supplied — use exactly as directed; Acetic acid or other specialist diluent — only where explicitly specified — requires pharmacy preparation and documented rationale.
- Section 4: ASEPTIC TECHNIQUE RECORD — checkbox list: hands washed and sterile gloves donned, gloves sanitised at defined intervals; work surface and all vial stoppers disinfected with 70% IPA and allowed to dry for 30 seconds; vial inspected — seal intact, no cracks, contents as expected; diluent directed slowly down the inside wall of the vial, not onto the powder; vial gently swirled or rolled — never shaken, shear stress denatures peptides and causes foaming; allowed to dissolve fully without agitation, time taken recorded; solution inspected against light and dark backgrounds — clear, colourless, no particulates, no cloudiness, no fibres; air removed and volume verified against the calculation; immediately labelled with drug, concentration, date and time prepared, beyond-use date, preparer; placed in appropriate storage without delay; all manipulations performed within the critical zone, no interruption of first air.
- Section 5: BEYOND-USE DATING — table (Preparation category / Room temperature / Refrigerated 2–8 °C / Frozen −20 °C) with rows: Prepared in ISO 5 within ISO 7 cleanroom, low risk (up to 48 h / up to 14 days / up to 45 days); Prepared in ISO 5, medium risk (up to 30 h / up to 9 days / up to 45 days); Prepared in an immediate-use setting (clinical area) (4 hours / not applicable / not applicable); Manufacturer-stated in-use period (per product literature — always takes precedence). Preserve the assign-the-shortest rule: assign the shortest of the manufacturer's stated in-use period, the stability data for the specific peptide in the chosen diluent, and the microbiological limit for the preparation environment.
- Section 6: VERIFICATION AND RELEASE — signature table (Role / Full name (BLOCK CAPITALS) / Signature / Date / Time) for Preparer, Independent checker, Authorised releaser (pharmacist).
- Section 7: DOCUMENT CONTROL — document code (RXP-003), document title (Reconstitution, Dilution and Compounding Record), category (Prescribing, Pharmacy & Dosing), applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author / owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), retention (institutional records schedule; minimum 25 years for research consent documentation (UK) / 3 years post-investigation closure (US 21 CFR 312.62), or longer where local law requires).

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'RXP-004 — Dose Calculation and Unit Conversion Worksheet',
    description:
      'Structured calculation aid to prevent thousand-fold (mg/mcg) and syringe-scale (U-100 vs U-50) errors. Includes a reconstitution reference grid in micrograms per U-100 unit and an independent double-check signature block.',
    category: 'Prescribing, Pharmacy & Dosing',
    icon: 'Calculator',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the RXP-004 (Dose Calculation and Unit Conversion Worksheet) for their institution.

Generate a complete, faithful, localised version of this Prescribing, Pharmacy & Dosing document in Markdown, using the institution details supplied by the user. RXP-004 is the 3-page structured calculation aid to prevent thousand-fold and syringe-scale errors, ${RXP_FRAMEWORK_ANCHORS}.

Document-specific structure to preserve (from the source PDF):
- "The three errors that cause most peptide harm" callout at the top of the body — (1) confusing milligrams with micrograms (a factor of 1,000); (2) confusing insulin-syringe units with millilitres, or using a 50-unit syringe when the calculation assumed 100 units (a factor of 2 to 100); (3) failing to recalculate after changing the reconstitution volume. Every calculation in this worksheet must be independently repeated by a second competent person.
- Section 1: UNIT REFERENCE — table (Quantity / Equivalents) with rows: 1 milligram (mg) = 1,000 micrograms (mcg or µg) = 0.001 gram; 1 microgram (mcg) = 0.001 mg = 1,000 nanograms; 1 millilitre (mL) = 1 cubic centimetre (cc) = 100 units on a 100-unit insulin syringe; 1 unit on a 100-unit (U-100) insulin syringe = 0.01 mL; 1 unit on a 50-unit insulin syringe = 0.01 mL but the barrel is half the volume, the graduations are wider and easier to read; 1 unit on a 30-unit insulin syringe = 0.01 mL, maximum 0.3 mL total; 1 IU of a peptide hormone = not convertible to mg without the specific product's potency factor — never assume.
- Section 2: STEP-BY-STEP CALCULATION — table (Step / Formula / Your working / Checker) with rows A–H: A. Concentration (vial strength (mg) ÷ diluent volume (mL) = mg/mL); B. Convert to mcg/mL (mg/mL × 1,000 = mcg/mL); C. Per syringe unit (mcg/mL ÷ 100 = mcg per U-100 unit); D. Volume for the dose (dose (mcg) ÷ concentration (mcg/mL) = mL); E. Units to draw (volume (mL) × 100 = units on a U-100 syringe); F. Doses per vial (vial strength ÷ dose per administration); G. Sense check (is the volume between 0.05 and 1.0 mL? If not, re-examine); H. Order-of-magnitude check (is the answer within 10× of the expected dose?).
- Section 3: RECONSTITUTION REFERENCE GRID — MICROGRAMS PER U-100 UNIT — matrix table (Vial strength rows × Diluent volume columns 1 mL / 2 mL / 2.5 mL / 3 mL / 5 mL) showing the micrograms contained in one unit (0.01 mL) of a 100-unit insulin syringe. Vial strengths: 2 mg, 5 mg, 10 mg, 15 mg, 20 mg, 30 mg. Preserve every cell value verbatim (e.g. 2 mg + 1 mL = 20 mcg/unit; 5 mg + 2 mL = 25 mcg/unit; 10 mg + 2 mL = 50 mcg/unit; 30 mg + 5 mL = 60 mcg/unit). Plus the "Reading the grid" callout (a 10 mg vial reconstituted with 2 mL contains 50 micrograms in every unit; to give 500 micrograms draw 10 units; to give 250 micrograms draw 5 units; if your intended dose requires fewer than 2 units, choose a larger diluent volume so that the measurement can be made accurately).
- Section 4: WEIGHT-BASED DOSING — table (Element / Value / Check ☐) with rows: patient weight (kg), measured not reported — dated within [__] days; dosing weight used (actual / ideal / adjusted) — rationale documented; dose per kg specified in the protocol — source cited; calculated total dose — independently recalculated; protocol maximum (cap) — calculated dose does not exceed cap; rounding rule applied — rounded to a measurable volume; final prescribed dose — matches prescription exactly.
- Section 5: INDEPENDENT DOUBLE-CHECK — paragraph: the checker must repeat the calculation from the original prescription without seeing the first person's working, then compare; if the two answers differ, both must be repeated and, if the discrepancy persists, the prescriber must be contacted; do not average, and do not simply accept the more senior person's figure. Signature table (Role / Full name (BLOCK CAPITALS) / Signature / Date / Time) for Calculated by, Independently checked by, Administered by.
- Section 6: DOCUMENT CONTROL — document code (RXP-004), document title (Dose Calculation and Unit Conversion Worksheet), category (Prescribing, Pharmacy & Dosing), applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author / owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), retention (institutional records schedule; minimum 25 years for research consent documentation (UK) / 3 years post-investigation closure (US 21 CFR 312.62), or longer where local law requires).

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'RXP-005 — Medication Administration Record (MAR) — Peptide Therapy',
    description:
      'Per-dose administration chart for peptide therapy, with site-rotation map, site-condition assessment, omitted-dose coding and a signature register. Use as the inpatient or research-unit administration record for every dose given.',
    category: 'Prescribing, Pharmacy & Dosing',
    icon: 'ClipboardList',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the RXP-005 (Medication Administration Record (MAR) — Peptide Therapy) for their institution.

Generate a complete, faithful, localised version of this Prescribing, Pharmacy & Dosing document in Markdown, using the institution details supplied by the user. RXP-005 is the 3-page per-dose administration chart with site-rotation map and signature register, ${RXP_FRAMEWORK_ANCHORS}.

Document-specific structure to preserve (from the source PDF):
- Patient identification header — patient name, DOB, MRN, agent and strength, prescribed dose and route, allergies, chart start date, prescriber. All patient-specific values remain blank fill-in lines.
- Section 1: ADMINISTRATION LOG — table (Date / Time / Dose / Batch / lot / Expiry / Site / Given by / Checked by / Obs. after / Notes).
- Section 2: SITE ROTATION MAP — paragraph: record the site used for each dose using the codes below; do not use the same site twice within [7] days; inspect every previously used site before choosing a new one. Code table (Code / Site / Notes): LA1 / LA2 (left abdomen, upper and lower quadrants — at least 5 cm from the umbilicus); RA1 / RA2 (right abdomen, upper and lower quadrants — as above); LT / RT (left and right anterolateral thigh — middle third only); LU / RU (left and right posterolateral upper arm — usually requires assistance); LG / RG (left and right upper outer buttock — for depot intramuscular products).
- Section 3: SITE CONDITION ASSESSMENT — table (Date / Site / Erythema (0–3) / Induration (mm) / Pain (0–10) / Bruising / Lipohypertrophy / Action).
- Section 4: OMITTED OR REFUSED DOSES — table (Date / Dose omitted / Code / Reason and action taken / Prescriber informed). Code key table (Code / Meaning): 1 patient refused; 2 patient unavailable or absent; 3 nil by mouth / clinical hold; 4 drug not available; 5 withheld on clinical grounds — specify; 6 adverse reaction — complete SPV-001; 7 monitoring result out of range; 8 other — specify.
- Section 5: SIGNATURE REGISTER — table (Full name (print) / Role / Initials / Signature / Date commenced).
- Section 6: DOCUMENT CONTROL — document code (RXP-005), document title (Medication Administration Record (MAR) — Peptide Therapy), category (Prescribing, Pharmacy & Dosing), applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author / owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), retention (institutional records schedule; minimum 25 years for research consent documentation (UK) / 3 years post-investigation closure (US 21 CFR 312.62), or longer where local law requires).

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'RXP-006 — Pharmacy Clinical Screening and Verification Checklist',
    description:
      'Pharmacist clinical screen and product-verification checklist before dispensing any peptide preparation, with a legal-and-supply classification gate that refuses performance-enhancement or cosmetic use of unapproved agents and escalates to the Chief Pharmacist.',
    category: 'Prescribing, Pharmacy & Dosing',
    icon: 'ShieldCheck',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the RXP-006 (Pharmacy Clinical Screening and Verification Checklist) for their institution.

Generate a complete, faithful, localised version of this Prescribing, Pharmacy & Dosing document in Markdown, using the institution details supplied by the user. RXP-006 is the 3-page pharmacist review-before-dispensing checklist for any peptide preparation, ${RXP_FRAMEWORK_ANCHORS}.

Document-specific structure to preserve (from the source PDF):
- Section 1: PRESCRIPTION VALIDITY — checkbox list: all legally required particulars present and legible; prescriber identity verified against the professional register; prescriber authorised to prescribe this class at this institution; signature and date valid, prescription within its validity period; patient identity confirmed by two identifiers; not a duplicate of a recent supply.
- Section 2: LEGAL AND SUPPLY CLASSIFICATION — table (Question / Answer / If problematic) with rows: Is the product licensed for this indication? (☐ Yes ☐ No — require CLA-008 off-label authorisation); If unlicensed, is there a documented specials or import route? (☐ Yes ☐ N/A — do not supply until documented); If compounded, is the substance eligible under §503A / §503B or equivalent? (☐ Yes ☐ No — refuse supply if not eligible); Is this an IMP requiring release against a protocol? (☐ Yes ☐ No — dispense only from trial stock with randomisation reference); Is the intended use performance enhancement or cosmetic with an unapproved agent? (☐ Yes ☐ No — refuse and escalate to the Chief Pharmacist); Is the supplier on the approved vendor list? (☐ Yes ☐ No — complete QSC-001 vetting first).
- Section 3: CLINICAL SCREEN — table (Domain / Checked ☐ / Findings / intervention) with rows: indication appropriate and documented; dose within recognised range for indication, age and weight; frequency and duration appropriate; route and formulation appropriate; renal function and required adjustment; hepatic function and required adjustment; allergy and previous adverse drug reaction check; full interaction screen including OTC, herbal and supplements; duplicate therapy within class excluded; contraindications and cautions reviewed; pregnancy, breastfeeding and contraception status; required baseline monitoring completed; ongoing monitoring plan documented; device suitability and patient dexterity considered; cold-chain and storage feasible for this patient; adherence history and support needs; cost, funding and continuity of supply confirmed.
- Section 4: PRODUCT VERIFICATION — checkbox list: correct product, strength and formulation selected; batch number and expiry recorded on the dispensing record; certificate of analysis on file for unlicensed or compounded products; packaging intact, tamper-evident seal unbroken; cold chain documented from receipt to dispensing; visual inspection of the product performed; ancillaries supplied — needles, syringes, alcohol swabs, sharps bin, cool bag; labelled correctly including 'for subcutaneous injection' and in-use expiry; second accuracy check completed by a different person.
- Section 5: COUNSELLING DELIVERED AT HANDOVER — checkbox list: how and where to inject; site rotation; storage before and after first use; in-use expiry and when to discard; what to do about a missed dose; common side effects and self-management; red-flag symptoms and who to call; sharps disposal arrangements; not to share devices; monitoring appointments booked; written information sheet issued — version ____; teach-back completed satisfactorily; interpreter used ☐ / not required ☐.
- Section 6: INTERVENTIONS AND OUTCOMES — table (Issue identified / Discussed with / Outcome / Date / Time) plus a signature block (Role / Full name (BLOCK CAPITALS) / Signature / Date / Time) for Screening pharmacist, Accuracy checker, Chief Pharmacist (if escalated).
- Section 7: DOCUMENT CONTROL — document code (RXP-006), document title (Pharmacy Clinical Screening and Verification Checklist), category (Prescribing, Pharmacy & Dosing), applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author / owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), retention (institutional records schedule; minimum 25 years for research consent documentation (UK) / 3 years post-investigation closure (US 21 CFR 312.62), or longer where local law requires).

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'RXP-010 — Formulary Submission and New Agent Evaluation Form',
    description:
      'Structured evidence appraisal form for a Drug & Therapeutics or P&T Committee decision on a new peptide agent, with regulatory position, GRADE-rated evidence, safety appraisal, three-year budget impact and a committee-decision block with conditions of approval.',
    category: 'Prescribing, Pharmacy & Dosing',
    icon: 'FilePlus',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the RXP-010 (Formulary Submission and New Agent Evaluation Form) for their institution.

Generate a complete, faithful, localised version of this Prescribing, Pharmacy & Dosing document in Markdown, using the institution details supplied by the user. RXP-010 is the 4-page structured evidence appraisal form for a Drug & Therapeutics or P&T Committee decision on a new peptide agent, ${RXP_FRAMEWORK_ANCHORS}.

Document-specific structure to preserve (from the source PDF):
- Section 1: SUBMISSION DETAILS — agent proposed, proposed indication, requesting clinician, speciality and department, date submitted, committee meeting date, declared conflicts of interest, estimated annual patients.
- Section 2: REGULATORY POSITION — table (Question / Response / Evidence attached) with rows: Marketing authorisation held in this jurisdiction? (☐ Yes ☐ No); If yes, does the proposal fall within the authorised indication? (☐ Yes ☐ No); If unlicensed, what is the lawful supply route?; Eligible for compounding under applicable rules? (☐ Yes ☐ No ☐ N/A); Any regulator safety communication, warning letter or import alert? (☐ None ☐ Yes); National guidance position (NICE, SMC, USPSTF, speciality society).
- Section 3: EVIDENCE APPRAISAL — study table (Study / Design / N / Population / Comparator / Primary outcome / Effect size / Risk of bias). GRADE rating table (Domain / GRADE rating / Rationale) with rows: Risk of bias (☐ Not serious ☐ Serious ☐ Very serious); Inconsistency (☐ Not serious ☐ Serious ☐ Very serious); Indirectness (☐ Not serious ☐ Serious ☐ Very serious); Imprecision (☐ Not serious ☐ Serious ☐ Very serious); Publication bias (☐ Undetected ☐ Suspected); Overall certainty (☐ High ☐ Moderate ☐ Low ☐ Very low).
- Section 4: SAFETY APPRAISAL — table (Domain / Assessment) with rows: serious adverse events in trials versus comparator; boxed warnings or contraindications; post-marketing signals and pharmacovigilance data; long-term safety data available (duration and N); special populations — renal, hepatic, elderly, pregnancy, paediatric; medication-safety risks — look-alike names, dose confusion, device errors; required monitoring burden; risk-mitigation measures proposed.
- Section 5: BUDGET AND OPERATIONAL IMPACT — table (Item / Year 1 / Year 2 / Year 3) with rows: acquisition cost per patient; expected patient numbers; total drug cost; monitoring and clinic costs; pharmacy preparation time; offsetting savings or displaced therapy; net budget impact; cost per QALY where available.
- Section 6: COMMITTEE DECISION — checkbox list: approved for unrestricted formulary inclusion; approved with restriction to named specialists or a defined patient group; approved for individual named-patient use only, with prior approval; approved for use only within an approved research protocol; deferred pending further information — specify below; rejected — reasons recorded below. Conditions-of-approval table (Condition of approval / Owner / Deadline) with rows: shared-care or monitoring protocol written and approved; patient information sheet produced and approved; prescribers trained and competency documented; audit of first [20] patients scheduled; review of the decision at [12] months. Signature block (Role / Full name (BLOCK CAPITALS) / Signature / Date / Time) for Requesting clinician, Pharmacy lead, Committee chair, Medical Director.
- Section 7: DOCUMENT CONTROL — document code (RXP-010), document title (Formulary Submission and New Agent Evaluation Form), category (Prescribing, Pharmacy & Dosing), applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author / owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), retention (institutional records schedule; minimum 25 years for research consent documentation (UK) / 3 years post-investigation closure (US 21 CFR 312.62), or longer where local law requires).

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(clinicianField),
    price: 0,
    premium: false,
    estTime: 18,
  },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedRxp() {
  console.log('🌱 Seeding RXP templates...')

  let created = 0
  let skipped = 0
  for (const t of templates) {
    const existing = await db.template.findFirst({ where: { name: t.name } })
    if (existing) {
      // Idempotent: do not duplicate or overwrite an existing row with the same name.
      skipped++
      continue
    }
    await db.template.create({ data: t })
    created++
  }

  console.log(`✅ Created ${created} new RXP templates; skipped ${skipped} existing.`)
  console.log(`📦 Total RXP templates in this script: ${templates.length}`)

  const count = await db.template.count()
  console.log(`📦 Total templates in DB: ${count}`)

  await db.$disconnect()
  console.log('🌱 RXP seed complete.')
}

seedRxp().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
