// Seed script for the GLYvantix Docs CLA + PIS template series.
// Adds 12 Consent & Legal Authorisation documents (CLA-001..CLA-012) and
// 11 Patient Information Sheets (PIS-001..PIS-011) as Template rows.
// Run with: bun run scripts/seed-cla-pis.ts
//
// Design decisions (see task brief):
//  - All 23 templates are FREE: price 0, premium false.
//  - Form fields are INSTITUTION-level only (no patient-identifiable fields).
//  - Patient-specific fields stay as blank fill-in lines in the generated doc.
//  - Each prompt is specific to the document it localises.
import { db } from '../src/lib/db'

type FieldType = 'text' | 'email' | 'textarea' | 'select'

type Field = {
  name: string
  label: string
  type: FieldType
  placeholder: string
  required: boolean
}

// Common institution fields shared across all 23 CLA/PIS templates.
const commonFields: Field[] = [
  { name: 'institutionName', label: 'Institution name', type: 'text', placeholder: "St Mary's NHS Foundation Trust", required: true },
  { name: 'department', label: 'Department / Service line', type: 'text', placeholder: 'Endocrinology & Metabolic Medicine', required: false },
  { name: 'siteAddress', label: 'Site address', type: 'text', placeholder: 'Praed Street, London W2 1NY', required: false },
  { name: 'tel', label: 'Telephone', type: 'text', placeholder: '+44 20 3312 1234', required: false },
  { name: 'email', label: 'Contact email', type: 'email', placeholder: 'research.office@stmarys.nhs.uk', required: false },
  { name: 'effectiveDate', label: 'Effective date', type: 'text', placeholder: '01/09/2026', required: false },
  { name: 'reviewDate', label: 'Scheduled review date (max 24 months from effective)', type: 'text', placeholder: '01/09/2028', required: false },
]

const clinicianField: Field = {
  name: 'clinicianName',
  label: 'Responsible clinician name',
  type: 'text',
  placeholder: 'Dr Jane Smith, Consultant Endocrinologist',
  required: false,
}

const dpoField: Field = {
  name: 'dpoEmail',
  label: 'Data Protection Officer email',
  type: 'email',
  placeholder: 'dpo@stmarys.nhs.uk',
  required: false,
}

const peptideAgentField: Field = {
  name: 'peptideAgent',
  label: 'Peptide agent / INN',
  type: 'text',
  placeholder: 'Semaglutide (Wegovy)',
  required: false,
}

const fields = (...extra: Field[]) => JSON.stringify([...commonFields, ...extra])

// ---------------------------------------------------------------------------
// Shared prompt fragments
// ---------------------------------------------------------------------------

const FRAMEWORK_ANCHORS =
  'anchored to 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), HIPAA (45 CFR 160/164), ' +
  'the UK Policy Framework for Health and Social Care Research, the Medicines for Human Use ' +
  '(Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ' +
  'ICH E6(R3) Good Clinical Practice, and the Montgomery v Lanarkshire (2015) standard of ' +
  'material-risk disclosure. Where the US and UK/EU frameworks differ, the more protective ' +
  'requirement applies.'

const MANDATORY_NOTICE_VERBATIM =
  'Preserve VERBATIM the "MANDATORY LEGAL NOTICE — READ BEFORE ADOPTION" block (do not paraphrase, ' +
  'do not omit, do not abbreviate).'

const IMPORTANT_NOT_APPROVED_VERBATIM =
  'Where the source document carries an "IMPORTANT — THIS MEDICINE IS NOT APPROVED FOR THIS USE" ' +
  'notice, preserve it VERBATIM (do not paraphrase, do not omit).'

const COMMON_OUTPUT_RULES =
  `REQUIREMENTS:
1. Begin with the document code and title as a Markdown H1, e.g. "# {CODE} — {TITLE}".
2. Include the institution letterhead block — institution name, department/service line, site address, telephone, email — using the user-supplied values.
3. Add this notice immediately below the title: "RESEARCH / SAMPLE TEMPLATE — FOR QUALIFIED CLINICIANS, RESEARCHERS AND INSTITUTIONAL RECORD-KEEPING REVIEW. This document is not medical advice, a prescription, treatment instruction, regulatory approval or evidence of ethics approval. It is a non-authoritative sample for lawful, supervised research or clinical documentation only and must be independently reviewed, localised, verified and authorised by the responsible qualified professionals and institution before use with any patient or participant."
4. ${MANDATORY_NOTICE_VERBATIM}
5. Preserve all numbered sections, tables, checkbox lists (use Markdown checkboxes ☐), and signature blocks. Preserve the regulatory anchor citations verbatim.
6. Substitute every [BRACKETED PLACEHOLDER] with the user-supplied value where one exists; leave patient-specific fields (patient name, date of birth, MRN / NHS number, study ID, batch number, the actual responsible clinician and peptide agent for the specific episode) as blank fill-in lines such as "Patient name: ____________________".
7. Include the document control section at the end verbatim — document code, title, category, applies to, jurisdictional basis (US: 21 CFR 50, 21 CFR 56, 45 CFR 46 (Common Rule), 45 CFR 160/164 (HIPAA); UK/EU: UK Policy Framework for Health and Social Care Research, Medicines for Human Use (Clinical Trials) Regulations 2004 (as amended), UK GDPR / Data Protection Act 2018, ICH E6(R3) Good Clinical Practice), author/owner, approvers (Chief Medical Officer / Chief Pharmacist / IRB or REC Chair / DPO), effective date, scheduled review (maximum 24 months from effective), retention, and the version table.
8. End with the controlled-document footer exactly as written, substituting the institution name, document code, effective date and review date: "{INSTITUTION_NAME} • {CODE} Rev 1.0 • Effective {EFFECTIVE_DATE} • Review {REVIEW_DATE} — CONTROLLED DOCUMENT — RESEARCH / SAMPLE TEMPLATE. Not valid until adopted, localised and approved by the responsible institution, IRB/REC and legal counsel."
9. Output ONLY the Markdown document. Do not wrap it in code fences. Do not add commentary, preface or postscript.`

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

type TemplateDef = {
  name: string
  description: string
  category: 'Consent & Legal Authorisation' | 'Patient Information'
  icon: string
  prompt: string
  fields: string
  price: 0
  premium: false
  estTime: number
}

const templates: TemplateDef[] = [
  // -------------------------------------------------------------------------
  // CLA — Consent & Legal Authorisation (12 documents)
  // -------------------------------------------------------------------------
  {
    name: 'CLA-001 — Master Patient Consent Form — Peptide Therapeutic Administration',
    description:
      'Research/sample consent framework for discussion and local institutional review concerning investigational, unlicensed or off-label peptide agents.',
    category: 'Consent & Legal Authorisation',
    icon: 'FileSignature',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-001 (Master Patient Consent Form — Peptide Therapeutic Administration) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-001 is the master 6-page informed consent form for treatment with an investigational, unlicensed or off-label peptide agent, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Section 1: Patient and Episode Identification — patient full name, MRN/NHS no./study ID, date of birth, responsible clinician, peptide agent/INN, route, formulation & strength, intended duration, regulatory-pathway checkbox list (IRB/REC-approved protocol / IND or CTA / expanded access / off-label / compounded §503A or §503B / other), protocol/IRB-REC reference.
- Section 2: Purpose of this Document — consent is a process, not a signature.
- Regulatory anchor citation: 21 CFR 50.25(a)–(b), 45 CFR 46.116, UK Policy Framework, Montgomery v Lanarkshire (2015).
- Section 3: Nature of the Proposed Treatment — agent, class, mechanism, and the three-row licensing-status table for FDA (US) / MHRA (UK) / EMA (EU), including the "If the agent is NOT approved for this use" callout.
- Section 4: Reasonably Foreseeable Risks and Discomforts — risk-category table (injection-site, systemic, metabolic/endocrine, cardiovascular, immunological, neoplastic/proliferative, product-quality, unknown/long-term, reproductive) and patient-specific risks free-text.
- Section 5: Anticipated Benefits — including therapeutic-misconception warning for research.
- Section 6: Alternatives to the Proposed Treatment — alternatives table.
- Section 7: Confidentiality, Data Protection and Records — UK GDPR Art. 6(1)(e)/9(2)(h)/9(2)(j), 45 CFR 164.508, [DPO EMAIL] placeholder (substitute if supplied), records-inspection bullet list.
- Section 8: Costs, Compensation and Conflicts of Interest — item table including the 21 CFR 50.25(a)(6) injury-compensation statement.
- Section 9: Statements to be Initialled by the Patient — the initial-grid table.
- Section 10: Signatures — six-role signature table (patient, parent/guardian, consultee/LPA/LAR, clinician taking consent, witness, interpreter) and the capacity/minors/interpreter footnote.
- Section 11: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(clinicianField, dpoField),
    price: 0,
    premium: false,
    estTime: 25,
  },
  {
    name: 'CLA-002 — Short-Form Consent to Treatment — Established Peptide Protocol',
    description:
      'Short-form consent for continuing an already-approved, already-explained peptide regimen. Use only where a full CLA-001 was taken within the preceding 12 months and the agent/indication fall within an existing institutional protocol.',
    category: 'Consent & Legal Authorisation',
    icon: 'FileSignature',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-002 (Short-Form Consent to Treatment — Established Peptide Protocol) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-002 is the abbreviated 3-page consent for continuing a previously approved and individually explained peptide regimen, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- "When this short form may be used" callout — only where a full Patient Information Sheet has already been provided, the agent/indication fall within an existing institutional protocol, and the patient has previously given full CLA-001 consent within the preceding 12 months. It must not be used for first exposure to an investigational agent, for participants lacking capacity, or for any protocol change.
- Section 1: Identification — patient/participant full name, MRN/NHS no./study ID, date of birth, responsible clinician, protocol/SOP reference, date of original CLA-001, cycle/course number, agent and dose.
- Section 2: Confirmation of Continuing Consent — the initial-grid statements (re-discussion of condition/treatment/alternatives, material changes, medical history review, pregnancy/breastfeeding, may stop treatment, consent to continue).
- Section 3: Material Changes Since Original Consent — free-text.
- Section 4: Interval Safety Review — check/result/action table (adverse events, required monitoring bloods, weight/vital signs, concomitant medication changes, product batch verified and in date).
- Section 5: Signatures — patient/participant and prescribing clinician rows.
- Section 6: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 20,
  },
  {
    name: 'CLA-003 — Informed Consent to Participate in Research — Full ICF',
    description:
      'Full Informed Consent Form (ICF) for participation in a research study of a peptide agent, ICH E6(R3) / 21 CFR 50.25 compliant. Use for new clinical-trial enrolment where the primary purpose is scientific rather than therapeutic.',
    category: 'Consent & Legal Authorisation',
    icon: 'FileSignature',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-003 (Informed Consent to Participate in Research — Full ICF) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-003 is the full 5-page ICH E6(R3) / 21 CFR 50.25 compliant participant information and consent document for research studies, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Section 1: Study Identification — full study title, short title/acronym, sponsor, Chief/Principal Investigator, protocol number/version, IRB/REC reference, IND/CTA/IRAS number, registry identifier (ClinicalTrials.gov / ISRCTN / EudraCT), funder, ICF version/date.
- Section 2: Invitation and Purpose — 2.1 why this study is being done, 2.2 why the participant has been invited (eligibility basis, approximate participant and site numbers), 2.3 do I have to take part (voluntariness, no effect on care or legal rights).
- Section 3: What Will Happen to Me — visit/procedures/timing/duration table (Screening, Baseline, Treatment, Monitoring, End of treatment, Follow-up) with total time commitment and total blood volume (with the 470 mL blood-donation comparison).
- Section 4: Randomisation, Blinding and Placebo — explain randomisation, double-blind, code-break mechanism, placebo definition.
- Section 5: Risks, Burdens and Benefits — agent-specific risks (cross-refer to the PIS for this agent), research-specific burdens (venepuncture, time, travel, placebo), the "Therapeutic misconception" callout.
- Section 6: Withdrawal, Stopping Rules and New Information — bullet list including UK GDPR Art. 17(3)(d) / Common Rule data-retention note, investigator-initiated withdrawal, 21 CFR 50.25(b)(5) new-information re-consent (cross-ref CLA-011).
- Section 7: Confidentiality and Data Use — bullet list including unique study code, authorised-access list (sponsor, FDA/MHRA, IRB/REC), coded data sharing, retention period, US Certificate of Confidentiality, UK GDPR Art. 6(1)(e) / 9(2)(j) legal basis statement.
- Section 8: Compensation, Expenses and Injury — reimbursement/payment/research-injury (US 21 CFR 50.25(a)(6)) / research-injury (UK NHS indemnity / ABPI) / complaints table.
- Section 9: Consent Statements — initial-grid statements including Human Tissue Act 2004 sample storage, future-study contact, no financial benefit, agree to take part.
- Section 10: Signatures — participant, person taking consent, Principal Investigator (if different).
- Footer note: "Three copies: participant; site file; medical notes. Version-controlled ICFs only — check that the version on this form matches the currently IRB/REC-approved version before use."
- Section 11: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(clinicianField),
    price: 0,
    premium: false,
    estTime: 23,
  },
  {
    name: 'CLA-004 — HIPAA Authorization & UK GDPR Privacy Notice',
    description:
      'HIPAA Authorization (45 CFR 164.508) and UK GDPR / Data Protection Act 2018 privacy notice, combined in a single 3-page document. Use to authorise use and disclosure of protected health information for research or clinical care.',
    category: 'Consent & Legal Authorisation',
    icon: 'ShieldCheck',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-004 (HIPAA Authorization & UK GDPR Privacy Notice) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-004 is the combined 3-page HIPAA Authorization (45 CFR 164.508) and UK GDPR / Data Protection Act 2018 privacy notice, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Part A — HIPAA Authorization (United States, 45 CFR 164.508): patient name, date of birth, MRN, then the required-element table (description of information, persons authorised to disclose, persons authorised to receive, purpose, expiration, right to revoke, conditioning statement, redisclosure, copy) — every core element of 45 CFR 164.508(c) must be present. Signature table: Patient / Personal representative (state authority) / Witness.
- Part B — UK GDPR / Data Protection Act 2018 Privacy Notice: data controller ([INSTITUTION], [ADDRESS], ICO registration), joint controller/sponsor, Data Protection Officer ([NAME], [EMAIL], [TEL] — substitute dpoEmail if supplied), categories of data, lawful basis Art. 6 (6(1)(e) / 6(1)(b) / 6(1)(a)), condition Art. 9 (9(2)(h) / 9(2)(j) with Art. 89(1)), common-law duty (consent or s.251 CAG), recipients, international transfer, retention, automated decision-making, your rights (access/rectification/restriction/objection/portability; erasure restricted under Art. 17(3)(d)), complaints (DPO then ICO, Wycliffe House, Water Lane, Wilmslow SK9 5AF, ico.org.uk). Signature table: Patient/Participant / Staff member.
- Part C — Optional Consents (tick and initial): photography for clinical record, teaching/publication (anonymised), email/SMS appointment contact, data linkage to national datasets, sharing with commercial collaborators in coded form, long-term biobank storage (HTA licence).
- Section 4: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(dpoField),
    price: 0,
    premium: false,
    estTime: 22,
  },
  {
    name: 'CLA-005 — Parental Permission and Paediatric Assent Form',
    description:
      'Parental permission and age-banded paediatric assent form for participants under the age of majority. Anchored to 21 CFR 50 Subpart D (50.51–50.54) and the UK Gillick / Fraser principles.',
    category: 'Consent & Legal Authorisation',
    icon: 'Users',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-005 (Parental Permission and Paediatric Assent Form) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-005 is the parental permission and age-banded paediatric assent form for participants under the age of majority, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- "Additional protections for children" callout — research involving children requires IRB/REC determination of the risk category under 21 CFR 50.51–50.54; UK parental responsibility for under-16s with the child's assent sought commensurate with maturity; administration of investigational peptide agents to children outside an approved protocol is not supported by this template.
- Section 1: Identification — child's full name, MRN/study ID, date of birth/age, person with parental responsibility, relationship to child, second parent (if required).
- Section 2: Determination of Risk Category (completed by investigator) — checkbox list of 50.51 minimal risk / 50.52 greater than minimal risk with prospect of direct benefit / 50.53 greater than minimal risk, no prospect of direct benefit (permission of both parents required unless one is deceased, unknown, incompetent, not reasonably available, or only one has legal responsibility) / 50.54 not otherwise approvable (federal-level review).
- Section 3: Parental Permission Statements — initial-grid statements (read Parent Information Sheet, opportunity to ask questions, understanding that the treatment/procedure is investigational/unlicensed in children with limited/absent paediatric safety data, voluntariness, assent will be sought and dissent respected, records access by regulators/monitors, GP/paediatrician may be informed, give permission).
- Section 4: Child Assent — Age-Appropriate Versions — table by age band (under 6 / 6–10 / 11–15 / 16–17 UK / 18+ during study) with assent approach and documentation. Include the child's assent statement to be read aloud ("The doctors want to try a medicine and find out if it helps…") and the three-outcome checkbox (child gave assent / child declined / assent not sought with justification).
- Section 5: Signatures — child/young person (assent), parent/guardian 1, parent/guardian 2, investigator, witness.
- Section 6: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 21,
  },
  {
    name: 'CLA-006 — Consultee, Surrogate and Legally Authorised Representative Declaration',
    description:
      'Consultee, surrogate and legally authorised representative declaration for adults who lack capacity. Anchored to the Mental Capacity Act 2005, AWI (Scotland) 2000, and 45 CFR 46.116(d).',
    category: 'Consent & Legal Authorisation',
    icon: 'Users',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-006 (Consultee, Surrogate and Legally Authorised Representative Declaration) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-006 is the consultee, surrogate and legally authorised representative declaration for adults who lack capacity, anchored to the Mental Capacity Act 2005 (England & Wales), the AWI (Scotland) Act 2000, and 45 CFR 46.116(d), ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Section 1: Capacity Assessment (must be completed first) — MCA two-stage test table (Stage 1 impairment of mind/brain; Stage 2(a) understand, 2(b) retain, 2(c) use/weigh, 2(d) communicate), all practicable steps taken to support capacity, assessor name and role, conclusion (has/lacks capacity), date and time of assessment, expected to regain capacity?
- Section 2: Identification of the Representative — checkbox list (personal consultee MCA s.32 / nominated consultee / attorney under a registered LPA for health and welfare / court-appointed deputy / welfare guardian or intervener (Scotland) / LAR under applicable state law (US)) plus representative full name, legal authority and reference number, relationship to the person, contact telephone.
- Section 3: Advice/Decision — representative initial-grid statements (read Consultee Information Sheet, opportunity to ask questions, considered past/present wishes and beliefs and any advance decision, giving advice vs exercising legal authority — delete as appropriate, person will be withdrawn on objection, person re-consents if capacity regained, in my opinion the person would have no objection / I consent on their behalf).
- Section 4: Safeguards During Participation — bullet list (immediate withdrawal on objection, emergency inclusion only with deferred-consent REC/IRB approval cross-ref CLA-007, best-interests decisions under MCA s.4 recorded, IMCA where no appropriate person and serious medical treatment proposed).
- Signatures: Representative, Clinician, IMCA (if instructed).
- Section 5: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 21,
  },
  {
    name: 'CLA-007 — Emergency and Deferred Consent Record',
    description:
      'Emergency and deferred consent record for urgent treatment or research inclusion where prior consent was not possible. Anchored to 21 CFR 50.23 (emergency use) and 21 CFR 50.24 (exception from informed consent).',
    category: 'Consent & Legal Authorisation',
    icon: 'AlertTriangle',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-007 (Emergency and Deferred Consent Record) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-007 is the emergency and deferred consent record for urgent treatment or research inclusion where prior consent was not possible, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- "Strict conditions" callout — deferred consent is permissible only where the protocol expressly provides for it, the REC/IRB has approved it, the intervention must be given urgently, and it is not reasonably practicable to obtain prior consent. In the US, emergency research without consent requires an exception under 21 CFR 50.24 (including community consultation and public disclosure) or the narrow emergency-use provision at 21 CFR 50.23 (independent physician concurrence). Peptide agents with no established emergency indication will rarely qualify.
- Section 1: Event Record — patient identifier, date and time of intervention, location, treating clinician, agent/dose/route given, batch/lot number.
- Section 2: Justification — criterion/met/evidence table (life-threatening or seriously disabling situation / available treatments unproven or unsatisfactory / therapeutic window that precluded consent / patient lacked capacity and no representative reachable / protocol and REC/IRB permit deferred consent / independent physician concurrence obtained (US 21 CFR 50.23) — N/A if not US).
- Section 3: Subsequent Consent — step/date-time/by whom/outcome table (attempt to contact representative / information given to patient once capacity regained / consent to continue obtained / consent to retain data already collected / REC-IRB notified / sponsor and regulator notified) including the data-handling note for declined continued participation.
- Section 4: Signatures — treating clinician, independent physician, Principal Investigator.
- Section 5: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 20,
  },
  {
    name: 'CLA-008 — Off-Label and Unlicensed Use Authorisation',
    description:
      'Off-label and unlicensed use authorisation with prescriber attestation, institutional pharmacy review, and patient acknowledgement. Use for any peptide prescribed outside its marketing authorisation.',
    category: 'Consent & Legal Authorisation',
    icon: 'Lock',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-008 (Off-Label and Unlicensed Use Authorisation) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-008 is the prescriber attestation, institutional approval and patient acknowledgement for off-label or unlicensed peptide use, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Section 1: Request Details — patient identifier, requesting prescriber and GMC/NPI number, proposed agent, dose/route/frequency/duration, proposed indication, proposed source/supplier.
- Section 2: Classification — checkbox list (licensed product, off-label indication / licensed product, off-label dose, route or population / unlicensed product imported under MHRA 'specials' / compounded preparation from a §503A pharmacy / outsourcing facility product under §503B / product not eligible for compounding — bulk substance not on the FDA §503A/§503B list, request must be refused unless under an IND).
- Section 3: Prescriber Attestation — initial-grid statements (reviewed evidence and expected benefit outweighs risk; accepts greater professional and legal responsibility under GMC Good Practice in Prescribing para. 68–74 / equivalent state medical board standards; has explained unlicensed/off-label status to patient; has verified source licensing and certificate of analysis; has arranged monitoring on CAM-001 and defined stopping criteria; has checked interactions; confirms individual care not research (or IND/CTA + IRB/REC in place under reference ____); will report ADRs to MHRA Yellow Card / FDA MedWatch).
- Section 4: Evidence Summary Supporting the Request — source/design-N/key-finding/limitations/ref table.
- Section 5: Institutional Review and Approval — function/name/decision table (Chief Pharmacist / Director of Pharmacy / Drug & Therapeutics or P&T Committee / Clinical Director or Service Lead / Medical Director / CMO for high-risk cases / Clinical governance or risk — noting only) with conditions and date.
- Section 6: Patient Acknowledgement — initial-grid statements (medicine not licensed/not approved explained, reasons and alternatives understood, less is known about risks, insurer may not pay, agrees to treatment and monitoring). Signature table: Patient, Prescriber, Pharmacist.
- Section 7: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 23,
  },
  {
    name: 'CLA-009 — Telehealth Consent and Remote Prescribing Record',
    description:
      'Telehealth consent and remote prescribing record covering identity verification, cross-border licensing, and remote-supply governance. Use for peptide therapy initiated or continued by video or telephone.',
    category: 'Consent & Legal Authorisation',
    icon: 'Video',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-009 (Telehealth Consent and Remote Prescribing Record) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-009 is the consent to remote consultation, identity verification and remote-supply governance for telehealth peptide prescribing, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Section 1: Consultation Record — patient name and identifier, platform used, date and time, clinician and registration number, patient's physical location during consult, clinician's location/licensing jurisdiction.
- "Cross-border prescribing" callout — the clinician must be licensed in the jurisdiction where the patient is located at the time of consultation (US state licensure or interstate compact privilege; Ryan Haight Act restricts remote prescribing of controlled substances; UK GMC remote-prescribing guidance — adequate assessment and inform patient's GP unless the patient objects).
- Section 2: Identity and Eligibility Verification — checkbox list (photographic ID sighted on camera, two patient identifiers confirmed verbally, alone/accompanied with consent, aged 18 or over or paediatric pathway applied, recording made with explicit consent or not made, chaperone offered/accepted/declined).
- Section 3: Consent Statements — patient initial-grid statements (consent to video/telephone rather than in person; understands limitations including no physical examination; understands technical-failure contingency; understands access and retention of any recording/chat log/uploaded images; advised how to obtain urgent help and that service is not for emergencies; consents to electronic prescription transmission to [PHARMACY] and delivery to address; agrees GP/PCP may be informed; understands in-person review will be required at [interval] or if condition changes).
- Section 4: Clinical Safety Checks Completed Remotely — check/method/result/action-if-abnormal table (baseline observations, weight and BMI, injection-technique competence, required laboratory results current, red-flag symptom screen, safeguarding concerns).
- Section 5: Signatures — patient (verbal consent recorded by clinician), clinician. Include the footnote: "Where written signature is impracticable, record verbal consent verbatim, with time, and read the record back to the patient for confirmation."
- Section 6: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 22,
  },
  {
    name: 'CLA-010 — Withdrawal of Consent and Study Discontinuation Form',
    description:
      'Withdrawal of consent and study discontinuation form. Documents partial or complete withdrawal and the handling of data and samples under UK GDPR Art. 17(3)(d) and the Common Rule.',
    category: 'Consent & Legal Authorisation',
    icon: 'AlertTriangle',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-010 (Withdrawal of Consent and Study Discontinuation Form) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-010 records partial or complete withdrawal from a peptide study and the handling of data and samples under UK GDPR Art. 17(3)(d) and the Common Rule, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Section 1: Identification — participant ID, study/protocol, date of withdrawal request, received by.
- Section 2: Type of Withdrawal (participant selects) — the four-option matrix table (Option A — stop treatment only / Option B — stop treatment and visits, allow routine-care data / Option C — complete withdrawal, no further contact / Option D — withdrawal with request for erasure) with columns for Treatment, Visits, New data, Existing data, Samples.
- "Explain honestly" callout — participants must be told that data already collected and submitted to a regulator, or used in a locked analysis, generally cannot be withdrawn, and that anonymised samples cannot be traced for destruction. Safety follow-up may still be required for a defined period after last dose.
- Section 3: Reason (optional — participant is not obliged to give one) — checkbox list (adverse effects, lack of perceived benefit, burden of visits or procedures, personal or family circumstances, moved away, withdrew by investigator decision, lost to follow-up, died (complete SPV-002), other/not stated).
- Section 4: Actions on Withdrawal — checkbox list (study medication stopped and unused supply returned and reconciled RXP-009, safety follow-up arranged for [__] days after last dose, end-of-study assessments offered and outcome recorded, ongoing clinical care handed back to GP/treating team with written summary, adverse events open at withdrawal followed to resolution or stabilisation, randomisation system and IWRS updated, CRF completion status reviewed and withdrawal page completed, sponsor and where required REC/IRB notified, sample destruction requested from biobank with reference ____, participant given a copy of this form).
- Section 5: Signatures — participant, investigator, study coordinator.
- Section 6: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 20,
  },
  {
    name: 'CLA-011 — Re-Consent and Protocol Amendment Acknowledgement',
    description:
      'Re-consent and protocol amendment acknowledgement for communicating new safety information or protocol changes to already-enrolled participants. Triggered by 21 CFR 50.25(b)(5) and substantial amendments.',
    category: 'Consent & Legal Authorisation',
    icon: 'RefreshCw',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-011 (Re-Consent and Protocol Amendment Acknowledgement) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-011 is the 2-page acknowledgement used to communicate new safety information or protocol changes to already-enrolled participants and to record their decision to continue or withdraw, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Section 1: Trigger for Re-Consent — checkbox list (new safety information affecting the risk-benefit balance, substantial amendment to the protocol affecting participant experience, change of sponsor/investigator/site, extension of study duration or addition of visits/procedures, new optional sub-study or sample collection, participant reached age of majority during participation, participant regained capacity, change in data-sharing arrangements or international transfer).
- Section 2: Summary of the Change in Plain Language — free-text.
- Section 3: Revised Risk Statement — risk/previously stated/now stated/basis-for-change table.
- Section 4: Participant Decision — patient initial-grid statements (changes explained, opportunity to ask questions, given revised Participant Information Sheet version [__] dated [__], understands may withdraw now without consequence, wishes to continue under revised terms). Include the inline option: "☐ I do not wish to continue — complete CLA-010."
- Signatures: Participant, Person taking re-consent.
- Governance check table: reference / date / confirmed by — amendment approved by REC/IRB, approved by MHRA/FDA where substantial, revised ICF version implemented at site, all active participants re-consented (number ___ of ___).
- Section 5: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 18,
  },
  {
    name: 'CLA-012 — Photography, Imaging and Media Release',
    description:
      'Photography, imaging and media release for clinical, educational and promotional use of identifiable images. Consent is granular (permitted uses are ticked separately — not all-or-nothing).',
    category: 'Consent & Legal Authorisation',
    icon: 'Camera',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the CLA-012 (Photography, Imaging and Media Release) template for their institution.

Generate a complete, faithful, localised version of this Consent & Legal Authorisation document in Markdown, using the institution details supplied by the user. CLA-012 is the 3-page granular consent for clinical, educational and promotional use of identifiable images, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Section 1: Identification — patient/participant full name, MRN/NHS no./study ID, date of birth, responsible clinician.
- Section 2: Scope of the Images — type/description/included? table (clinical photography, body composition/anthropometry, radiology and scans, video, audio, face visible).
- Section 3: Permitted Uses — tick each separately; consent is NOT all-or-nothing (inclusion in medical record for clinical care; internal case conferences and MDT meetings; teaching of healthcare professionals and students; publication in peer-reviewed journal or textbook (anonymised where possible); presentation at academic conferences; use on the institution's website, social media or promotional material; use by a commercial sponsor or third party in marketing (requires separate discussion); retention for future ethically approved research).
- Section 4: Understandings — patient initial-grid statements (once published — particularly online — images may be copied and may be impossible to withdraw completely; anonymisation cannot be guaranteed where a distinguishing feature is visible; no payment for any use; may withdraw consent for future use at any time by writing to [CONTACT]; refusing consent will not affect care; confirms they are the person shown or have legal authority to consent on their behalf).
- Section 5: Signatures — patient/participant, parent or legal representative, photographer/clinician. Include the administrative fields: image reference numbers [__________], storage location [Secure clinical image repository — not personal devices], review/expiry of consent [DD/MM/YYYY or on written withdrawal], withdrawal contact [NAME, EMAIL, POSTAL ADDRESS].
- Section 6: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(),
    price: 0,
    premium: false,
    estTime: 20,
  },

  // -------------------------------------------------------------------------
  // PIS — Patient Information (11 documents: PIS-001..PIS-011)
  // -------------------------------------------------------------------------
  {
    name: 'PIS-001 — Peptide Therapy — General Patient Information Sheet',
    description:
      'Plain-language general patient information sheet introducing peptide medicines — what they are, how they are given, what is and is not known, and what to expect. Issue alongside any medicine-specific PIS.',
    category: 'Patient Information',
    icon: 'FileText',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-001 (Peptide Therapy — General Patient Information Sheet) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-001 is the 4-page plain-language introduction to peptide medicines for any patient starting peptide treatment, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for.
- Section 2: What is a peptide? — including the three-group table (fully licensed medicines / licensed but used off-label / not licensed for human use) with examples and "what this means".
- Section 3: How peptides are given — subcutaneous, intramuscular, intravenous, nasal/oral (with the warning never to swallow or inhale an injectable product).
- Section 4: What is known and not known — the "Being honest about the evidence" callout; ask the clinician to record where this medicine sits on the spectrum.
- Section 5: General side effects to be aware of — how often/what you might notice/what to do table (very common, common, uncommon, rare but serious — severe allergic reaction, severe or persistent abdominal pain suggesting pancreatitis, injection-site infection, unknown).
- Section 6: Before you start — tell your clinician if you… checkbox list (pregnancy/breastfeeding, cancer, diabetes, kidney/liver disease, heart condition, thyroid condition or family history of thyroid cancer or MEN2, pancreatitis or gallstones, allergy, other medicines including herbal, bleeding disorder or blood-thinner, needle phobia, previous reaction to a peptide or protein medicine).
- Section 7: Practical matters — topic/what you need to know table (storage 2–8 °C and PEC-002 cross-ref, travel, missed dose, sharps, driving and work, alcohol, other medicines).
- Section 8: Your rights — bullet list.
- Section 9: Questions to ask your clinician — bullet list.
- Section 10: Who to contact — routine (office hours) [NAME/TEAM — TEL — EMAIL], urgent clinical concern out of hours [24-HOUR NUMBER], emergency 999/911, reporting a side effect yourself (UK Yellow Card / US FDA MedWatch), complaints [PALS/Patient Advocate], independent advice [NHS 111 / GP / community pharmacist].
- The re-verification note: "The licensing status below must be re-verified at the time of issue. Regulatory status changes; a template statement is not a substitute for checking the current Summary of Product Characteristics (UK), Prescribing Information (US) or the relevant regulator's database."
- Section 11: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 18,
  },
  {
    name: 'PIS-002 — Patient Information — GLP-1 Receptor Agonists (Semaglutide, Liraglutide, Dulaglutide)',
    description:
      'Patient information sheet for GLP-1 receptor agonists (semaglutide, liraglutide, dulaglutide, exenatide) — licensed incretin therapies for type 2 diabetes and weight management.',
    category: 'Patient Information',
    icon: 'Pill',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-002 (Patient Information — GLP-1 Receptor Agonists (Semaglutide, Liraglutide, Dulaglutide)) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-002 is the 5-page licensed-medicine patient information sheet for GLP-1 receptor agonists, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — Semaglutide / Liraglutide / Dulaglutide / Exenatide (delete as applicable); cross-ref PIS-001 and the manufacturer's PIL.
- Section 2: About your medicine — medicine, class (GLP-1 receptor agonist), given as (once-weekly or once-daily subcutaneous injection; oral semaglutide pharmacology), prescribed for you because [clinician to complete], your dose (slow escalation), how long.
- Section 3: Licensing status — read this carefully — FDA / MHRA / EMA table (all approved for type 2 diabetes and chronic weight management / cardiovascular risk reduction for some products; NHS access may require NICE criteria).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (very common nausea/diarrhoea/constipation/wind/indigestion; common vomiting/reduced appetite/tiredness/headache/dizziness, injection-site reactions, hypoglycaemia with insulin or sulfonylurea; uncommon gallstones/hair thinning/altered taste/increased heart rate).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (pancreatitis, gallbladder problems, severe dehydration/kidney injury, severe allergic reaction, diabetic eye disease worsening, severe low blood sugar, neck lump/hoarseness — boxed US warning re rodent thyroid C-cell tumours).
- Section 7: Monitoring you will need — when/test or check/why table (before starting, each dose increase, 3 months, 6–12 months, retinopathy, on insulin/sulfonylurea).
- Section 8: Other medicines and interactions — bullet list (insulin and sulfonylureas, oral medicines with narrow margin of safety, warfarin, oral contraceptives, planned surgery/endoscopy).
- Section 9: Pregnancy, breastfeeding and fertility — not recommended in pregnancy, stop at least 2 months before planned pregnancy for semaglutide.
- Section 10: Specific points for this medicine — bullet list (works alongside diet and activity; weight regain after stopping; muscle loss with rapid weight loss; do not combine with another GLP-1 agonist or DPP-4 inhibitor; do not obtain from unregulated online sources; never share a pen device).
- Section 11: Storage for this product — before first use (2–8 °C, do not freeze), in use (product-specific 28–56 days below 30 °C), protection from light, appearance (clear and colourless, do not use if cloudy or containing particles).
- Section 12: Questions to ask your clinician — bullet list.
- Section 13: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 14: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'PIS-003 — Patient Information — Dual and Triple Incretin Agonists (Tirzepatide, Retatrutide)',
    description:
      'Patient information sheet for dual and triple incretin agonists (tirzepatide, retatrutide). Covers GIP/GLP-1 and GIP/GLP-1/glucagon receptor agonists, including the investigational triple agonists.',
    category: 'Patient Information',
    icon: 'Pill',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-003 (Patient Information — Dual and Triple Incretin Agonists (Tirzepatide, Retatrutide)) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-003 is the 5-page patient information sheet for GIP/GLP-1 and GIP/GLP-1/glucagon receptor agonists, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — Tirzepatide (licensed) / Retatrutide (investigational — delete as applicable); cross-ref PIS-001 and the manufacturer's PIL.
- Section 2: About your medicine — medicine, class (dual GIP/GLP-1 receptor agonist; triple agonists additionally act at the glucagon receptor), given as (once-weekly subcutaneous injection, same day each week, may change day if at least 3 days between doses), prescribed for you because [clinician to complete], your dose (start 2.5 mg weekly for 4 weeks, increase in 2.5 mg steps no more often than every 4 weeks), how long. Mechanism and indication paragraph (tirzepatide licensed for type 2 diabetes and chronic weight management; triple agonists remain in clinical trials and not licensed anywhere).
- Section 3: Licensing status — FDA / MHRA / EMA table (tirzepatide approved/licensed/authorised including obstructive sleep apnoea in obesity in the US; retatrutide investigational only everywhere).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (very common nausea/diarrhoea/vomiting/constipation, reduced appetite; common indigestion/abdominal pain/burping/bloating, tiredness/dizziness/hair thinning/injection-site reactions, low blood sugar with insulin or sulfonylurea; uncommon gallstones/fast heart rate/low blood pressure on standing).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (severe abdominal pain suggesting pancreatitis, gallbladder disease, severe dehydration, allergic reaction, neck lump/hoarseness/difficulty swallowing — boxed warning re rodent thyroid C-cell tumours and contraindication with personal or family history of medullary thyroid carcinoma or MEN2, sudden worsening of vision in diabetic retinopathy, persistent vomiting before surgery — aspiration risk).
- Section 7: Monitoring you will need — when/test or check/why table (before starting, every 4 weeks during escalation, 3 and 6 months, annually, if on insulin, if in a trial of an investigational agent — protocol-specified ECGs/bloods/PK).
- Section 8: Other medicines and interactions — bullet list (same considerations as GLP-1 agonists; do not combine with another incretin-based medicine; inform anaesthetist before sedation/general anaesthesia).
- Section 9: Pregnancy, breastfeeding and fertility — not in pregnancy, effective contraception required, barrier or non-oral method advised for 4 weeks after starting and after each dose increase.
- Section 10: Specific points for this medicine — bullet list (greater weight loss also means greater risk of losing lean muscle — resistance exercise and adequate protein; rapid weight loss increases gallstone risk; trial participants must follow the protocol exactly; counterfeit versions widespread online — only use pharmacy-dispensed product with intact seal and verifiable batch number).
- Section 11: Storage for this product — before use (2–8 °C, do not freeze, keep in original carton), in use (may be kept below 30 °C for up to 21 days), single use (each pen or vial is for one person only).
- Section 12: Questions to ask your clinician — bullet list.
- Section 13: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 14: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'PIS-004 — Patient Information — Growth Hormone Secretagogues (CJC-1295, Ipamorelin, Tesamorelin, Sermorelin)',
    description:
      'Patient information sheet for growth hormone secretagogues (CJC-1295, ipamorelin, GHRP-2/6, hexarelin, ibutamoren, tesamorelin, sermorelin). Includes the "not approved for this use" notice for the unlicensed agents and the WADA anti-doping warning.',
    category: 'Patient Information',
    icon: 'FlaskConical',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-004 (Patient Information — Growth Hormone Secretagogues (CJC-1295, Ipamorelin, Tesamorelin, Sermorelin)) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-004 is the 5-page patient information sheet for growth hormone secretagogues, ${FRAMEWORK_ANCHORS}

${IMPORTANT_NOT_APPROVED_VERBATIM}

Document-specific structure to preserve (from the source PDF):
- The "IMPORTANT — THIS MEDICINE IS NOT APPROVED FOR THIS USE" notice at the top of the document body (the medicine does not hold a marketing authorisation from MHRA, FDA or EMA for the purpose being discussed; benefits and risks have not been assessed; should only be given inside an approved research study or where a licensed doctor has taken specific responsibility and the institution has authorised it).
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — Tesamorelin / Sermorelin (licensed in defined indications) — CJC-1295, Ipamorelin, GHRP-2, GHRP-6, Hexarelin, Ibutamoren (NOT licensed for human use); cross-ref PIS-001.
- Section 2: About your medicine — medicine, class (GHRH analogues and growth hormone secretagogue receptor / ghrelin receptor agonists), given as (subcutaneous injection, typically at night), prescribed for you because [clinician to complete], your dose (no established human dose for unlicensed agents — must come from an approved protocol), how long. Mechanism paragraph (prompt pituitary to release endogenous GH in pulses; tesamorelin approved in the US for HIV-associated lipodystrophy; sermorelin used in diagnostic testing and paediatric GHD; the rest are widely sold as 'research chemicals' and not approved for use in people anywhere).
- Section 3: Licensing status — FDA / MHRA / EMA table (tesamorelin approved for one narrow indication; sermorelin previously approved and now discontinued in some markets; CJC-1295, ipamorelin, GHRP-2/6 and hexarelin not approved, several on the FDA's bulk substances list presenting significant safety risks for compounding; MHRA — tesamorelin not routinely available, secretagogues unlicensed; EMA similar).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (very common injection-site redness/itching/swelling/pain; common water retention/puffiness, joint aches/stiffness/muscle pain, tingling/numbness in the hands (carpal tunnel), increased hunger with ghrelin-receptor agonists, flushing/sweating/vivid dreams/disturbed sleep; uncommon raised blood sugar or new insulin resistance, headache/dizziness/tiredness/transient rise in prolactin or cortisol).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (high blood sugar symptoms, severe or progressive swelling/breathlessness on lying flat/rapid weight gain — fluid overload, severe headache with visual disturbance or vomiting, any new lump or unexplained bleeding or weight loss — growth-factor pathways may promote existing tumours, allergic reaction with swelling of face or throat, chest pain/palpitations/fainting).
- Section 7: Monitoring you will need — when/test or check/why table (before starting IGF-1/fasting glucose/HbA1c/fasting insulin/lipids/thyroid/cortisol/prolactin; before starting cancer screening appropriate to age and sex; before starting fundoscopy if diabetic; 6 weeks IGF-1/glucose/symptoms; 3 months then 3–6 monthly IGF-1 within age-adjusted reference range/HbA1c/lipids/weight/BP; annually full endocrine review and cancer screening currency).
- Section 8: Other medicines and interactions — bullet list (insulin and oral diabetes medicines — control may deteriorate; corticosteroids; thyroid hormone; other GH products — do not combine; sedatives and alcohol).
- Section 9: Pregnancy, breastfeeding and fertility — must not be used in pregnancy or while breastfeeding; effective contraception required; no human safety data.
- Section 10: Specific points for this medicine — the "Sport and employment" callout (GHS are prohibited at all times under the WADA Prohibited List class S2; use will result in an anti-doping rule violation; may breach employment terms for military, police and safety-critical roles; a Therapeutic Use Exemption must be obtained in advance where a legitimate medical indication exists). Bullet list (IGF-1 must be monitored and kept within age-adjusted reference range; supraphysiological IGF-1 is a signal to reduce or stop; must not be used for anti-ageing, cosmetic or performance purposes outside an approved study — not a supported indication; products bought online are frequently mislabelled, under- or over-potent, non-sterile or contaminated with endotoxin; no long-term human safety dataset for the unlicensed agents in this class).
- Section 11: Questions to ask your clinician — bullet list.
- Section 12: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 13: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'PIS-005 — Patient Information — BPC-157 and Thymosin Beta-4 / TB-500',
    description:
      'Patient information sheet for BPC-157 (body protection compound) and Thymosin Beta-4 fragment / TB-500 — synthetic peptide fragments marketed for tissue repair and angiogenesis, neither approved for human use in any major jurisdiction.',
    category: 'Patient Information',
    icon: 'Dna',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-005 (Patient Information — BPC-157 and Thymosin Beta-4 / TB-500) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-005 is the 5-page patient information sheet for BPC-157 (body protection compound) and the Thymosin Beta-4 fragment / TB-500, synthetic peptide fragments investigated for tissue repair and angiogenesis that are not approved for human use in any major jurisdiction, ${FRAMEWORK_ANCHORS}

${IMPORTANT_NOT_APPROVED_VERBATIM}

Document-specific structure to preserve (from the source PDF):
- The "IMPORTANT — THIS MEDICINE IS NOT APPROVED FOR THIS USE" notice at the top of the document body (the medicine does not hold a marketing authorisation from MHRA, FDA or EMA for the purpose being discussed with you; benefits and risks have not been assessed; should only be given inside an approved research study or where a licensed doctor has taken specific responsibility and the institution has authorised it).
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — BPC-157 (body protection compound) and Thymosin Beta-4 fragment / TB-500; cross-ref PIS-001 and, where one exists, the manufacturer's patient information leaflet.
- Section 2: About your medicine — medicine, class (synthetic peptide fragments investigated for tissue repair and angiogenesis), given as (where used inside an approved study, subcutaneous injection near or remote from the site of injury, according to the protocol; oral formulations are also marketed but absorption and stability are unverified), prescribed for you because [clinician to complete], your dose (no validated human dose exists — doses circulating on the internet are not derived from human pharmacokinetic studies; protocol dose, if applicable: [__]), how long [clinician to complete]. Mechanism paragraph (widely promoted for healing of tendon, ligament, muscle and gut tissue; published evidence is almost entirely from laboratory and rodent studies; there are no adequate and well-controlled human trials establishing that either is safe or effective for any condition; neither is approved for human use in any major jurisdiction).
- Section 3: Licensing status — read this carefully — FDA / MHRA / EMA table (FDA — Not approved; BPC-157 placed by the FDA in Category 2 of the §503A bulk drug substances review — substances that raise significant safety risks — meaning it may not lawfully be compounded for human use; Thymosin beta-4 likewise not approved; MHRA — Not licensed, no marketing authorisation, not a recognised 'special', lawful human use in the UK would require a clinical trial authorisation and REC approval; EMA — Not authorised; a compounding pharmacy in the US should not be supplying these for human administration; if one is, that is a serious warning sign).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (reported anecdotally — injection-site pain/redness/swelling/itching — rotate sites, report anything persistent; reported anecdotally — light-headedness/nausea/headache/fatigue — report to your clinician; reported anecdotally — flushing/altered taste/transient blood-pressure change — report; theoretical — immunogenicity, the body making antibodies against the peptide — detectable only by specialist testing; product-related — fever/chills/malaise shortly after injection, may indicate endotoxin contamination — stop and seek assessment).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (fever/rigors/severe malaise within hours of an injection — possible contaminated product; spreading redness/heat/hardness/pus at an injection site — possible abscess or cellulitis; signs of allergic reaction; any new or growing lump — these peptides promote new blood-vessel formation in animal models which is theoretically capable of supporting tumour growth, and must not be used by anyone with a current or recent cancer; new or worsening chest pain, breathlessness, or unilateral leg swelling).
- Section 7: Monitoring you will need — when/test or check/why table (before starting — full blood count, renal and liver function, CRP, glucose — baseline; before starting — cancer screening current for age and sex, explicit exclusion of active or recent malignancy — angiogenesis risk; before starting — confirmed certificate of analysis for the exact batch covering identity, purity, sterility and endotoxin — product quality is the dominant risk; weekly initially — injection-site inspection, temperature, symptom diary — infection surveillance; monthly — bloods as above plus objective measure of the target problem (range of movement, pain score, imaging) — is it actually working?; at any adverse event — retain the vial and batch record — essential for investigation).
- Section 8: Other medicines and interactions — bullet list (no formal interaction studies exist for either peptide in humans; anticoagulants — theoretical concern given vascular effects, monitor closely; anti-angiogenic cancer therapies — direct pharmacological opposition, do not combine; immunosuppressants — unknown interaction with thymosin-derived peptides).
- Section 9: Pregnancy, breastfeeding and fertility — must not be used in pregnancy, when planning pregnancy, or while breastfeeding; no reproductive toxicity data exist.
- Section 10: Specific points for this medicine — the "What you should be told before agreeing" callout (there are no completed adequate human efficacy trials; the product is not approved; the source and purity of the specific vial you are given can only be assured by a batch-specific certificate of analysis; these agents are prohibited in sport; and if anything goes wrong the usual product-liability protections that apply to licensed medicines will not be available to you). Bullet list (prohibited at all times under the WADA Prohibited List, S0 — non-approved substances; if offered outside a registered study or a properly authorised clinical pathway, decline and report the offer to the MHRA or FDA; never inject a product supplied in a plain vial without a pharmacy label, batch number and expiry date; keep the vial, packaging and batch number of anything you have used, in case it needs to be investigated).
- Section 11: Questions to ask your clinician — bullet list.
- Section 12: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 13: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'PIS-006 — Patient Information — Thymosin Alpha-1 and Immune-Modulating Peptides',
    description:
      'Patient information sheet for Thymosin alpha-1 (thymalfasin) and related immunomodulatory peptides. Approved in some countries but not the US or UK — covers the "approved in some countries, not others" regulatory status.',
    category: 'Patient Information',
    icon: 'ShieldCheck',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-006 (Patient Information — Thymosin Alpha-1 and Immune-Modulating Peptides) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-006 is the 4-page patient information sheet for Thymosin alpha-1 (thymalfasin) and related immunomodulatory peptides, agents approved in some countries but not the United States or the United Kingdom, ${FRAMEWORK_ANCHORS}

${IMPORTANT_NOT_APPROVED_VERBATIM}

Document-specific structure to preserve (from the source PDF):
- The "IMPORTANT — THIS MEDICINE IS NOT APPROVED FOR THIS USE" notice at the top of the document body (the medicine does not hold a marketing authorisation from MHRA, FDA or EMA for the purpose being discussed with you; benefits and risks have not been assessed; should only be given inside an approved research study or where a licensed doctor has taken specific responsibility and the institution has authorised it).
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — Thymosin alpha-1 (thymalfasin); related immunomodulatory peptides; cross-ref PIS-001 and, where one exists, the manufacturer's patient information leaflet.
- Section 2: About your medicine — medicine, class (immunomodulatory peptide — enhances T-cell maturation and function), given as (subcutaneous injection, commonly twice weekly, according to the approved product information of the source country or the study protocol), prescribed for you because [clinician to complete], your dose (where used, typically expressed in mg per dose; your specific regimen [__]; reconstitution must follow the manufacturer's directions exactly), how long [clinician to complete]. Mechanism paragraph (Thymosin alpha-1 modulates the immune system and has been studied in chronic hepatitis B and C, as a vaccine adjuvant, in sepsis and in some cancers; it is approved in a number of countries including several in Asia, Europe and Latin America, but is not approved in the United States or the United Kingdom; approval elsewhere does not make it lawful to use here outside a proper pathway).
- Section 3: Licensing status — read this carefully — FDA / MHRA / EMA table (FDA — Not approved; placed in the FDA's Category 2 for §503A compounding — significant safety risks; not lawfully compounded for human use in the US; MHRA — Not licensed; would require import as an unlicensed special with full justification, or a CTA; your prescriber must document why no licensed alternative is suitable; EMA — Authorised in some member states, not centrally; status varies by country).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (common — injection-site pain, redness or swelling — rotate sites; common — transient flu-like symptoms, fatigue, muscle aches — usually settles; uncommon — rash, itching — report; uncommon — transient rise in liver enzymes — detected on blood tests; theoretical — autoimmune flare in susceptible people — report new joint, skin or bowel symptoms).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (symptoms of a new or flaring autoimmune condition — persistent joint swelling, new rash, unexplained diarrhoea, dry eyes and mouth, muscle weakness; signs of transplant rejection if you have a transplanted organ — this class must generally be avoided in transplant recipients; severe allergic reaction; fever with rigors after injection — consider product contamination; any rapid change in a known cancer).
- Section 7: Monitoring you will need — when/test or check/why table (before starting — full blood count with differential, lymphocyte subsets, liver and renal function, autoantibody screen where indicated — baseline immune status; before starting — screening for latent infection where immunomodulation is planned — safety; monthly for 3 months — full blood count, liver function, symptom review — early detection; 3-monthly thereafter — as above plus disease-specific markers — ongoing safety and efficacy; if autoimmune symptoms appear — urgent rheumatology or immunology referral — stop and assess).
- Section 8: Other medicines and interactions — bullet list (immunosuppressants — pharmacological opposition, avoid in transplant recipients and in people on treatment for autoimmune disease unless a specialist agrees; live vaccines — discuss timing with your clinician; interferon and other immunotherapies — combined use only within a protocol; checkpoint inhibitors — additive immune-related adverse-event risk).
- Section 9: Pregnancy, breastfeeding and fertility — avoid in pregnancy and breastfeeding; no adequate human data.
- Section 10: Specific points for this medicine — bullet list (being approved in another country is not a legal basis for routine use here — an import or trial pathway is required and must be documented on CLA-008; immune stimulation is not automatically beneficial, in some conditions it is harmful; this class must not be used casually for 'immune boosting' in healthy people; bring a full list of your medicines, including any immunosuppressants, to every appointment).
- Section 11: Questions to ask your clinician — bullet list.
- Section 12: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 13: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 14,
  },
  {
    name: 'PIS-007 — Patient Information — Melanocortin Analogues (Afamelanotide, Bremelanotide, Melanotan II)',
    description:
      'Patient information sheet for melanocortin receptor agonists — afamelanotide (licensed for EPP) and bremelanotide (licensed for HSDD in the US) — together with the serious risks of unregulated tanning peptides (Melanotan I and II, sold illegally for human use).',
    category: 'Patient Information',
    icon: 'Sun',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-007 (Patient Information — Melanocortin Analogues (Afamelanotide, Bremelanotide, Melanotan II)) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-007 is the 5-page patient information sheet for melanocortin receptor agonists — afamelanotide (licensed), bremelanotide (licensed in the US) and the unlicensed tanning peptides Melanotan I and II — covering both approved melanocortin medicines and the serious risks of unregulated tanning peptides, ${FRAMEWORK_ANCHORS}

${IMPORTANT_NOT_APPROVED_VERBATIM}

Document-specific structure to preserve (from the source PDF):
- The "IMPORTANT — THIS MEDICINE IS NOT APPROVED FOR THIS USE" notice at the top of the document body — preserved verbatim exactly as written in the source (the notice applies to the agent/indication pair being discussed with the patient; it remains in the source document even though afamelanotide and bremelanotide are licensed for specific indications, because the document also covers the unlicensed Melanotan I and II and any off-licence use of the licensed agents — do not paraphrase, do not omit, do not modify the wording).
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — Afamelanotide (licensed) / Bremelanotide (licensed) / Melanotan I and II (not licensed — widely sold illegally); cross-ref PIS-001 and, where one exists, the manufacturer's patient information leaflet.
- Section 2: About your medicine — medicine, class (melanocortin receptor agonists), given as (afamelanotide is a subdermal implant inserted by a trained clinician every two months; bremelanotide is a subcutaneous autoinjector used as needed, not more than once in 24 hours and no more than eight times a month; Melanotan II is injected subcutaneously by users with no clinical oversight — this is not endorsed), prescribed for you because [clinician to complete], your dose (follow the licensed product information exactly; for Melanotan II there is no safe dose), how long [clinician to complete]. Mechanism and indication paragraph (afamelanotide is licensed to prevent phototoxicity in erythropoietic protoporphyria; bremelanotide is licensed in the US for hypoactive sexual desire disorder in premenopausal women; Melanotan II is an unlicensed analogue sold online and in some salons as a 'tanning injection', its sale for human use is illegal in the UK and it has been associated with serious harm including changing moles and melanoma reported in case series).
- Section 3: Licensing status — read this carefully — FDA / MHRA / EMA table (FDA — afamelanotide and bremelanotide approved for their specific indications; Melanotan II not approved and subject to import alerts; Melanotan II should never be supplied or injected; MHRA — afamelanotide licensed and available through specialist centres; Melanotan II is illegal to sell for human use, the MHRA has repeatedly warned against it; purchasing or injecting it carries real risk and no legal protection; EMA — afamelanotide authorised; Melanotan II not authorised; as above).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (very common with bremelanotide — nausea, flushing, headache, injection-site reactions — anti-emetic may be prescribed, consider dose reduction; common with afamelanotide — implant-site reaction, headache, nausea, fatigue, darkening of the skin — expected, report if severe; common with Melanotan II — nausea and vomiting, facial flushing, loss of appetite, spontaneous erections, darkening of existing moles and freckles — these are signals of an unregulated drug acting systemically; uncommon — increase in blood pressure, transient decrease in heart rate — monitor; uncommon — darkening of the gums or new pigmented patches — dermatology review).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (any change in a mole — growth, colour change, irregular border, itching, bleeding — melanocortin stimulation darkens naevi and can mask or promote melanoma, seek dermatology assessment urgently; severe or persistent high blood pressure; chest pain or palpitations; a painful erection lasting more than four hours — priapism, a urological emergency; severe abdominal pain and vomiting; signs of infection at an injection site, particularly with shared or non-sterile equipment; any symptoms of blood-borne virus exposure where needles have been shared).
- Section 7: Monitoring you will need — when/test or check/why table (before starting — full skin examination and mole mapping by a dermatologist — baseline, essential for this class; before starting — blood pressure, cardiovascular history — melanocortin agonists raise BP; every 6 months — repeat full skin check with photography of naevi — detect change early; each visit — blood pressure and pulse — cardiovascular safety; afamelanotide — liver function and disease-specific porphyrin monitoring — per licensed product information; bremelanotide — review of frequency of use and nausea burden — adherence to licensed limits).
- Section 8: Other medicines and interactions — bullet list (antihypertensives — blood-pressure effects may oppose or exaggerate treatment; naltrexone — bremelanotide may reduce its absorption significantly; oral medicines taken within an hour of bremelanotide — absorption may be slowed; other pigmentation agents or phototherapy — discuss with dermatology).
- Section 9: Pregnancy, breastfeeding and fertility — contraindicated in pregnancy; effective contraception is required with bremelanotide; stop immediately if pregnancy occurs; avoid while breastfeeding.
- Section 10: Specific points for this medicine — the "If you have been using melanotan II bought online" callout (tell your clinician honestly — you will not be judged; you need a full skin examination, a blood-pressure check, and, if you have shared or reused needles, testing for hepatitis B, hepatitis C and HIV; stop using it and bring in any remaining product and packaging). Bullet list (melanocortin peptides do not protect against sunburn or skin cancer — continue full sun protection; 'tanning injections' sold in gyms, salons or online are unlicensed medicines and supplying them is a criminal offence in the UK; never share needles, vials or reconstitution equipment; people with a personal or family history of melanoma should avoid this class entirely unless a dermatologist advises otherwise).
- Section 11: Questions to ask your clinician — bullet list.
- Section 12: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 13: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'PIS-008 — Patient Information — Copper Peptide GHK-Cu and Cosmetic Peptides',
    description:
      'Patient information sheet for copper peptide GHK-Cu and cosmetic peptides (palmitoyl pentapeptide, acetyl hexapeptide-8 and related). Covers topical and injectable cosmetic use with the "not approved for this use" notice.',
    category: 'Patient Information',
    icon: 'Dna',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-008 (Patient Information — Copper Peptide GHK-Cu and Cosmetic Peptides) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-008 is the 4-page patient information sheet for topical and injectable cosmetic peptides, ${FRAMEWORK_ANCHORS}

${IMPORTANT_NOT_APPROVED_VERBATIM}

Document-specific structure to preserve (from the source PDF):
- The "IMPORTANT — THIS MEDICINE IS NOT APPROVED FOR THIS USE" notice at the top of the document body.
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — GHK-Cu (copper tripeptide-1), palmitoyl pentapeptide, acetyl hexapeptide-8 and related cosmetic peptides; cross-ref PIS-001.
- Section 2: About your medicine — medicine, class (matrikine and signalling peptides used in topical cosmetic formulations), given as (topically as serum or cream; microneedling and injectable routes only inside an approved study with a sterile, pharmaceutical-grade product), prescribed for you because [clinician to complete], your dose (follow cosmetic product's directions; no established injectable dose), how long. Mechanism and regulation paragraph (used in cosmetic skincare, regulated as cosmetics not medicines; injectable use not approved, not supported by adequate safety data and carries real risks including infection and copper-related toxicity).
- Section 3: Licensing status — FDA / MHRA / EMA table (topical cosmetic use regulated under cosmetics law not drug approval — no efficacy review; injectable use not approved; UK Cosmetics Regulation; injectable cosmetic peptides fall outside the licensed medicines framework).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (common topical — mild stinging/redness/dryness; common topical — blue or green staining from copper; uncommon topical — contact dermatitis; with microneedling — prolonged redness/pinpoint bleeding/tenderness; with injection — injection-site nodules/bruising/infection/granuloma).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (spreading redness/warmth/swelling or pus after any needling or injection procedure; blistering/ulceration/skin breakdown; widespread rash/facial swelling/difficulty breathing; symptoms of copper excess after repeated injectable use — nausea/abdominal pain/jaundice/confusion — people with Wilson's disease must avoid copper-containing products entirely; any vision change after injection near the eyes — medical emergency).
- Section 7: Monitoring you will need — when/test or check/why table (before starting — skin assessment and photography; before injectable use — serum copper and caeruloplasmin, exclusion of Wilson's disease; patch test — 48-hour patch test before first facial use; 4 and 12 weeks — standardised photography and tolerability review; any adverse skin event — dermatology referral).
- Section 8: Other medicines and interactions — bullet list (retinoids/AHAs/vitamin C — increase irritation; recent chemical peel/laser/ablative procedure — wait until skin barrier recovered; copper chelating drugs (penicillamine, trientine) — avoid copper peptides entirely).
- Section 9: Pregnancy, breastfeeding and fertility — topical use low risk but rarely tested in pregnancy; avoid injectable or microneedling use in pregnancy and while breastfeeding.
- Section 10: Specific points for this medicine — bullet list (cosmetic claims are not held to medical standards of evidence; never inject a product formulated and sold as a cosmetic — not sterile and not intended to enter the body; sun protection and topical retinoids remain the strongest-evidence interventions for skin ageing; keep photographs so clinician and patient can judge whether anything is actually changing).
- Section 11: Questions to ask your clinician — bullet list.
- Section 12: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 13: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 14,
  },
  {
    name: 'PIS-009 — Patient Information — Bone, Muscle and Metabolic Peptides (Teriparatide, Abaloparatide, Setmelanotide)',
    description:
      'Patient information sheet for licensed anabolic and metabolic peptide therapies — teriparatide and abaloparatide (severe osteoporosis) and setmelanotide (rare-genetic-defect obesity).',
    category: 'Patient Information',
    icon: 'Pill',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-009 (Patient Information — Bone, Muscle and Metabolic Peptides (Teriparatide, Abaloparatide, Setmelanotide)) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-009 is the 5-page patient information sheet for licensed anabolic and metabolic peptide therapies, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — Teriparatide / Abaloparatide (osteoporosis) — Setmelanotide (genetic obesity); cross-ref PIS-001.
- Section 2: About your medicine — medicine, class (parathyroid hormone analogues; melanocortin-4 receptor agonist), given as (teriparatide/abaloparatide once-daily SC from a multi-dose pen into thigh or abdomen at the same time each day; setmelanotide once-daily SC), prescribed for you because [clinician to complete], your dose (teriparatide 20 micrograms daily; abaloparatide 80 micrograms daily; treatment duration is limited, commonly to 24 months in a lifetime; setmelanotide titrated by weight and response), how long. Mechanism and indication paragraph (teriparatide and abaloparatide stimulate new bone formation for severe osteoporosis at high fracture risk; setmelanotide is licensed for obesity caused by specific rare genetic defects in the leptin-melanocortin pathway; all three are licensed medicines with defined indications and monitoring requirements).
- Section 3: Licensing status — FDA / MHRA / EMA table (all approved/licensed/authorised; MHRA access governed by NICE and local formulary criteria — must usually meet specific fracture-risk or genetic criteria).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (very common nausea/headache/dizziness/limb pain; common feeling faint or light-headed shortly after injection — inject sitting or lying; common injection-site redness or bruising; common leg cramps/joint aches/raised blood calcium; common with setmelanotide — skin darkening/new or darkened moles/nausea/spontaneous erections/depression — skin surveillance mandatory; uncommon palpitations/raised uric acid/kidney stones).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (persistent nausea/vomiting/constipation/confusion or excessive thirst — possible high calcium; severe bone pain particularly new focal pain, or unexplained fracture; fainting with injury; any change in a mole while on setmelanotide; new or worsening low mood or suicidal thoughts on setmelanotide — seek help immediately; severe allergic reaction).
- Section 7: Monitoring you will need — when/test or check/why table (before starting serum calcium/PTH/vitamin D/renal function/alkaline phosphatase/DXA/fracture history; before starting exclude Paget's disease/prior skeletal radiotherapy/bone metastases/unexplained raised alkaline phosphatase/hypercalcaemia — absolute contraindications; 1 month serum calcium taken at least 16 hours after last dose; 6 months calcium/renal function/tolerance/adherence; 12 and 24 months DXA/fracture review/plan for follow-on antiresorptive therapy — bone gains are lost without follow-on treatment; setmelanotide — full skin examination before starting and every 6 months, mental-health review at each visit).
- Section 8: Other medicines and interactions — bullet list (digoxin — hypercalcaemia predisposes to digoxin toxicity; calcium and vitamin D supplements — usually continued, calcium monitored; thiazide diuretics — may raise calcium further; bisphosphonates or denosumab — sequencing matters, anabolic therapy normally followed by antiresorptive to preserve gains).
- Section 9: Pregnancy, breastfeeding and fertility — not for use in pregnancy or breastfeeding; setmelanotide requires effective contraception and a documented negative pregnancy test before starting.
- Section 10: Specific points for this medicine — bullet list (anabolic bone therapy has a lifetime duration limit; bone density gains are rapidly lost unless an antiresorptive is started immediately afterwards; keep taking calcium and vitamin D as advised; the pen must be refrigerated and is used for a defined number of days after first use; setmelanotide requires genetic confirmation of an eligible variant before treatment).
- Section 11: Storage for this product — teriparatide/abaloparatide pen 2–8 °C at all times for teriparatide; abaloparatide may be kept at room temperature for up to 30 days after first use; in use — discard after the labelled number of days even if medicine remains; never freeze — discard if frozen; needles — use a new needle for every injection and never store the pen with a needle attached.
- Section 12: Questions to ask your clinician — bullet list.
- Section 13: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 14: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'PIS-010 — Patient Information — Peptide Hormone Analogues (Octreotide, Leuprolide, Desmopressin, Oxytocin)',
    description:
      'Patient information sheet for established peptide hormone analogues — octreotide/lanreotide, leuprolide/goserelin/triptorelin, desmopressin and oxytocin. Long-established licensed specialist medicines.',
    category: 'Patient Information',
    icon: 'Pill',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-010 (Patient Information — Peptide Hormone Analogues (Octreotide, Leuprolide, Desmopressin, Oxytocin)) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-010 is the 5-page patient information sheet for long-established licensed peptide hormone analogues, ${FRAMEWORK_ANCHORS}

Document-specific structure to preserve (from the source PDF):
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — Octreotide / Lanreotide, Leuprolide / Goserelin / Triptorelin, Desmopressin, Oxytocin; cross-ref PIS-001.
- Section 2: About your medicine — medicine, class (somatostatin analogues; GnRH agonists; vasopressin analogue; oxytocin), given as (varies by product — daily or monthly deep SC or IM depot (somatostatin analogues, GnRH agonists), nasal spray/sublingual/oral tablet (desmopressin), IV infusion in hospital (oxytocin)), prescribed for you because [clinician to complete], your dose (entirely product- and indication-specific), how long. Mechanism and indication paragraph (somatostatin analogues for acromegaly, neuroendocrine tumours and variceal bleeding; GnRH agonists for prostate cancer, endometriosis, fibroids and precocious puberty; desmopressin for diabetes insipidus, nocturia and some bleeding disorders; oxytocin in obstetric care).
- Section 3: Licensing status — FDA / MHRA / EMA table (all approved/licensed/authorised with well-defined indications; prescribed by or under specialist supervision).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table grouped by class (somatostatin analogues — abdominal pain/diarrhoea/flatulence/nausea/gallstones/injection-site pain/raised or lowered blood sugar; GnRH agonists — hot flushes/sweating/reduced libido/fatigue/mood change/bone thinning/initial 'flare' — flare prevented by an anti-androgen where indicated; desmopressin — headache/nausea/abdominal pain/low sodium — fluid restriction advice essential; oxytocin — uterine cramping/nausea/flushing/low blood pressure given under monitoring; all — injection-site reactions, rotate sites).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (desmopressin — confusion/drowsiness/severe headache/seizures — signs of dangerously low sodium from water retention; follow fluid-restriction advice exactly and stop during any illness with vomiting or diarrhoea; somatostatin analogues — severe upper abdominal pain (gallstones or pancreatitis)/persistent vomiting/jaundice/very slow heart rate; GnRH agonists — spinal-cord compression symptoms during initial flare in metastatic prostate cancer — new back pain, leg weakness, bladder or bowel changes — this is an emergency; all — severe allergic reaction; symptoms of very high or very low blood sugar with somatostatin analogues).
- Section 7: Monitoring you will need — when/test or check/why table grouped by class (somatostatin analogues — gallbladder ultrasound at baseline and periodically/HbA1c/thyroid function/IGF-1 and GH in acromegaly/vitamin B12; GnRH agonists — testosterone or oestradiol/PSA/bone density every 1–2 years/lipids/HbA1c/cardiovascular risk; desmopressin — serum sodium before starting, at 3 days, at 1 month, then periodically — more often if over 65; oxytocin — continuous fetal and maternal monitoring/fluid balance; all — injection-site review/adherence/symptom diary).
- Section 8: Other medicines and interactions — bullet list (desmopressin with SSRIs/tricyclics/carbamazepine/NSAIDs or diuretics — much higher risk of low sodium; somatostatin analogues with ciclosporin/bromocriptine or oral diabetes medicines — dose adjustment required; GnRH agonists with QT-prolonging drugs — ECG monitoring advised; beta-blockers with somatostatin analogues — additive bradycardia).
- Section 9: Pregnancy, breastfeeding and fertility — highly product-specific. GnRH agonists contraindicated in pregnancy. Desmopressin used in pregnancy in some circumstances under specialist advice. Oxytocin is an obstetric medicine. Always discuss pregnancy plans with the specialist team before starting or stopping.
- Section 10: Specific points for this medicine — bullet list (specialist medicines — do not change dose, brand or formulation without specialist's agreement as depot products are not interchangeable; missed depot injections have clinical consequences — book the next appointment before leaving; desmopressin users must be given clear written fluid-restriction instructions and must know to stop during vomiting, diarrhoea or heavy exercise; carry a card or wear an alert stating which of these medicines you take; tell any new clinician about depot injections given weeks or months earlier — they are still active).
- Section 11: Questions to ask your clinician — bullet list.
- Section 12: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 13: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 16,
  },
  {
    name: 'PIS-011 — Patient Information — Investigational Peptide in a Clinical Trial',
    description:
      'Generic patient information sheet for an investigational peptide in a clinical trial. Includes the "not approved for this use" notice and protocol-specific fill-in fields for the agent, dose and route.',
    category: 'Patient Information',
    icon: 'FlaskConical',
    prompt: `You are a clinical research document localiser. The user is an academic medical centre, NHS trust, university research unit, or licensed clinical practice preparing to adopt the PIS-011 (Patient Information — Investigational Peptide in a Clinical Trial) template for their institution.

Generate a complete, faithful, localised version of this Patient Information document in Markdown, using the institution details supplied by the user. PIS-011 is the 4-page generic agent-specific sheet to accompany the main participant information sheet when the agent is investigational, ${FRAMEWORK_ANCHORS}

${IMPORTANT_NOT_APPROVED_VERBATIM}

Document-specific structure to preserve (from the source PDF):
- The "IMPORTANT — THIS MEDICINE IS NOT APPROVED FOR THIS USE" notice at the top of the document body.
- Patient identification block — patient name, date of birth, clinician, date issued (all blank fill-in lines).
- Section 1: What this sheet is for — [INVESTIGATIONAL AGENT CODE / NAME]; cross-ref PIS-001.
- Section 2: About your medicine — medicine ([INVESTIGATIONAL AGENT CODE / NAME]), class ([Class] — investigational medicinal product), given as ([route, frequency, who administers it, where] — you will be shown exactly what to do and asked to demonstrate it back before doing it yourself), prescribed for you because [clinician to complete], your dose (assigned dose level [__]; doses in this study range from [__] to [__]; you may be in a placebo group; never change the dose or timing yourself), how long. Purpose paragraph ('Investigational' means it is still being tested and has not been approved by any medicines regulator for this use; the main purpose of the study is to find out more about it, not to treat you).
- Section 3: Licensing status — FDA / MHRA / EMA table (all "Investigational — supplied under IND [______] / CTA / IRAS [______]" — available only within this study).
- Section 4: How to take it — cross-ref PEC-001 and PEC-002.
- Section 5: Common side effects — how often/what you might notice/what to do table (reported in earlier studies — list from the Investigator's Brochure — report at each visit; expected from the drug class — report; study procedures — bruising or soreness from blood tests/discomfort from cannulation — tell staff; study procedures — tiredness from long visit days — bring food, drink and something to do).
- Section 6: Serious side effects — act on these — stop and seek help bullet list (any reaction that you consider severe or that frightens you — contact the 24-hour study number; signs of allergy — rash, swelling of face or throat, wheeze, faintness; severe abdominal pain, chest pain, breathlessness, or a seizure; any hospital admission for any reason — the study team must be told within 24 hours; symptoms that begin shortly after a dose and were not present before).
- Section 7: Monitoring you will need — when/test or check/why table (screening — full history/examination/ECG/bloods/urinalysis/pregnancy test; each dosing visit — vital signs before and at [__] intervals after dosing/symptom review/injection-site assessment; protocol-defined — PK blood samples at specified times, timing must be exact; weekly/at each visit — safety bloods/adverse-event review/concomitant medication check; end of treatment and follow-up — repeat baseline assessments; immunogenicity — anti-drug antibody samples at [__] — peptides can provoke antibodies).
- Section 8: Other medicines and interactions — bullet list (must not start any new medicine, supplement or herbal product without telling the study team first; tell every other healthcare professional that you are in a trial and show them your participant card; alcohol and grapefruit restrictions, if any, are listed in your participant diary; do not take part in another trial at the same time).
- Section 9: Pregnancy, breastfeeding and fertility — effective contraception required for [both partners / the participant] from screening until [__] after the last dose; pregnancy tests will be done at [intervals]; tell the team immediately if a pregnancy occurs — the study will collect follow-up information about the pregnancy outcome with separate consent.
- Section 10: Specific points for this medicine — bullet list (keep your participant card with you at all times — it has the 24-hour contact number and the study details for any doctor treating you; complete your diary honestly including missed doses — accuracy matters more than compliance; return all used and unused product and packaging at every visit — this is a legal accountability requirement; you will be told the overall results of the study when they are available and told how to find out which group you were in once the study is unblinded; if new safety information emerges you will be told promptly and asked whether you wish to continue — cross-ref CLA-011).
- Section 11: Questions to ask your clinician — bullet list.
- Section 12: Who to contact — routine / urgent / emergency / Yellow Card / FDA MedWatch / PALS / independent advice.
- The re-verification note.
- Section 13: Document Control — full version table.

${COMMON_OUTPUT_RULES}

The user's institution details are provided as structured input below. Use them faithfully.`,
    fields: fields(peptideAgentField, clinicianField),
    price: 0,
    premium: false,
    estTime: 14,
  },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedClaPis() {
  console.log('🌱 Seeding CLA + PIS templates...')

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

  console.log(`✅ Created ${created} new CLA/PIS templates; skipped ${skipped} existing.`)
  console.log(`📦 Total CLA/PIS templates in this script: ${templates.length}`)

  const count = await db.template.count()
  console.log(`📦 Total templates in DB: ${count}`)

  await db.$disconnect()
  console.log('🌱 CLA + PIS seed complete.')
}

seedClaPis().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
