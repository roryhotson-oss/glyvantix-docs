"use client";

// ResearchTab — the methodology, framework, and governance page.
// Explains what GLYvantix Research is, how the CLA/PIS frameworks are
// anchored, who the reviewers are (placeholders for the user to fill in),
// how to cite the work, and the version history.

import { motion } from "framer-motion";
import {
  BookOpen,
  FileText,
  GitBranch,
  Globe2,
  GraduationCap,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Stamp,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  headingFontClass,
  useBrandingState,
} from "./branding-context";
import {
  clearAttestation,
  hasAttested,
} from "./clinician-attestation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TabId } from "./api";

interface ResearchTabProps {
  onNavigate: (tab: TabId) => void;
}

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.45, delay, ease: "easeOut" as const },
  };
}

const PILLARS = [
  {
    icon: ScrollText,
    title: "Consent & Legal Authorisation (CLA)",
    body: "A 12-document suite covering the full consent lifecycle — master consent, short-form, research ICF, HIPAA/GDPR, paediatric, consultee, emergency, off-label, telehealth, withdrawal, re-consent and media release. Anchored to 21 CFR 50, 45 CFR 46, UK GDPR, ICH E6(R3) and Montgomery v Lanarkshire (2015).",
  },
  {
    icon: BookOpen,
    title: "Patient Information Sheets (PIS)",
    body: "Agent-specific patient information covering GLP-1 receptor agonists, dual/triple incretins, growth hormone secretagogues, BPC-157 and Thymosin Beta-4, Thymosin Alpha-1 and immune-modulating peptides, melanocortin analogues, copper peptides, bone/muscle/metabolic peptides, hormone analogues and investigational agents — plus a general peptide therapy introduction.",
  },
  {
    icon: FileText,
    title: "Prescribing, Pharmacy & Dosing (RXP)",
    body: "A 7-document suite covering the prescribing-to-dispensing pathway — prescription form, dosing quick reference, reconstitution/compounding record, dose calculation worksheet, medication administration record, pharmacy clinical screening checklist and formulary submission. Anchored to UK Human Medicines Regulations 2012 (reg. 217), US state pharmacy law, FD&C Act §503A/§503B, USP <797> and ICH E6(R3).",
  },
  {
    icon: ShieldCheck,
    title: "Regulatory anchoring",
    body: "Every document cites its jurisdictional basis: US (21 CFR 50/56, 45 CFR 46, HIPAA, FD&C Act §503A/§503B, USP <797>), UK/EU (Human Medicines Regulations 2012, UK Policy Framework, Clinical Trials Regulations 2004, UK GDPR, DPA 2018), and ICH E6(R3) Good Clinical Practice. Where frameworks differ, the more protective requirement applies.",
  },
  {
    icon: Users,
    title: "Collaboration model",
    body: "Templates are published for adoption and localisation. Collaborators submit amendments, join the consortium, and co-author future versions. Localisation, institutional approval and version control remain the responsibility of the adopting organisation.",
  },
];

const PRINCIPLES = [
  "Templates are a starting point, not a substitute for institutional legal, pharmacy, information-governance and ethics review.",
  "No patient-identifiable data is stored on this platform. Patient fields are completed by hand on the localised, printed document at the point of use.",
  "Every generated document is watermarked with the reader's email, the institution's name, and the date — making every copy traceable.",
  "Versioning is explicit: each document carries its revision number, effective date and scheduled review date (maximum 24 months).",
  "We do not provide medical or legal advice. We provide research frameworks for lawful, supervised clinical and research contexts.",
];

const CITATION_EXAMPLE =
  "GLYvantix Research. CLA-001 — Master Patient Consent Form — Peptide Therapeutic Administration. Version 1.0. 2026. Available at: https://docs.glyvantix.com";

const VERSION_HISTORY = [
  {
    version: "1.1",
    date: "2026-08-28",
    summary: "Added the RXP (Prescribing, Pharmacy & Dosing) series: RXP-001 through RXP-006 and RXP-010 — prescription form, dosing quick reference, reconstitution/compounding record, dose calculation worksheet, medication administration record, pharmacy clinical screening checklist and formulary submission.",
  },
  {
    version: "1.0",
    date: "2026-08-28",
    summary: "Initial publication of the CLA-001 through CLA-012 suite (Consent & Legal Authorisation) and PIS-001 through PIS-011 (Patient Information Sheets).",
  },
];

export function ResearchTab({ onNavigate }: ResearchTabProps) {
  const { branding } = useBrandingState();
  const [attested, setAttested] = useState(hasAttested());

  function handleReAttest() {
    clearAttestation();
    setAttested(false);
    toast.message("Attestation cleared", {
      description: "You'll be asked to re-attest before your next clinical document generation.",
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="mb-10 max-w-3xl">
        <Badge
          variant="outline"
          className="mb-3 gap-1 border-brand-accent/30 bg-brand-accent/5 text-brand-accent"
        >
          <GraduationCap className="h-3 w-3" />
          Research &amp; methodology
        </Badge>
        <h2
          className={cn(
            "text-3xl font-bold tracking-tight sm:text-4xl",
            headingFontClass(branding.headingFont)
          )}
        >
          A research framework for peptide therapeutics consent
        </h2>
        <p className="mt-3 text-muted-foreground">
          {branding.companyName} is a research organisation developing
          consent and patient-information frameworks for the peptide
          therapeutics field. We publish our frameworks for adoption and seek
          collaboration with academic medical centres, NHS trusts, university
          research units and licensed clinical practices.
        </p>
      </motion.div>

      {/* Attestation status */}
      <motion.div {...fadeUp(0.05)} className="mb-8">
        <Card
          className={cn(
            "border",
            attested
              ? "border-emerald-200 dark:border-emerald-500/30"
              : "border-amber-200 dark:border-amber-500/30"
          )}
        >
          <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  attested
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                )}
              >
                <Stamp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {attested
                    ? "Clinician attestation active on this device"
                    : "Clinician attestation required"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attested
                    ? "You can generate clinical document drafts. Clear it to re-attest."
                    : "Complete the attestation before generating any clinical document."}
                </p>
              </div>
            </div>
            {attested ? (
              <Button size="sm" variant="outline" onClick={handleReAttest}>
                Clear attestation
              </Button>
            ) : (
              <Button
                size="sm"
                className="btn-brand"
                onClick={() => onNavigate("builder")}
              >
                Go to builder
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pillars */}
      <div className="grid gap-4 sm:grid-cols-2">
        {PILLARS.map((p, i) => (
          <motion.div key={p.title} {...fadeUp(0.05 * i)}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                  <p.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-2 text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">
                  {p.body}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Principles */}
      <motion.div {...fadeUp(0.1)} className="mt-10">
        <h3 className="text-xl font-bold tracking-tight">Operating principles</h3>
        <div className="mt-4 flex flex-col gap-2">
          {PRINCIPLES.map((p, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
            >
              <Sparkles className="mt-0.5 h-4 w-4 flex-none text-brand-accent-2" />
              <p className="text-sm leading-relaxed text-foreground">{p}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Reviewers placeholder */}
      <motion.div {...fadeUp(0.15)} className="mt-10">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-accent" />
              <CardTitle className="text-base">Independent review panel</CardTitle>
            </div>
            <CardDescription className="text-xs">
              The framework is reviewed by named clinical, pharmacy, legal and
              ethics professionals. Reviewer names and affiliations will be
              listed here before public launch. If you are interested in
              joining the review panel, please get in touch via the Collaborate
              tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              { role: "Clinical reviewer", placeholder: "Prescriber / PI" },
              { role: "Pharmacy reviewer", placeholder: "Chief Pharmacist" },
              { role: "Legal & ethics reviewer", placeholder: "Solicitor / IRB chair" },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-lg border border-dashed border-border p-3 text-center"
              >
                <p className="text-xs font-semibold text-foreground">{r.role}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.placeholder}</p>
                <Badge
                  variant="outline"
                  className="mt-2 text-[10px] font-normal"
                >
                  To be named
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Citation */}
      <motion.div {...fadeUp(0.2)} className="mt-10">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-brand-accent" />
              <CardTitle className="text-base">How to cite this work</CardTitle>
            </div>
            <CardDescription className="text-xs">
              If you adopt or reference a GLYvantix Research document in your
              own work, please cite it as follows:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
              {CITATION_EXAMPLE}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Version history */}
      <motion.div {...fadeUp(0.25)} className="mt-10">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-brand-accent" />
          <h3 className="text-xl font-bold tracking-tight">Version history</h3>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {VERSION_HISTORY.map((v) => (
            <div
              key={v.version}
              className="flex flex-col gap-1 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:gap-4"
            >
              <Badge
                variant="outline"
                className="flex-none font-mono text-xs"
              >
                v{v.version}
              </Badge>
              <span className="flex-none text-xs text-muted-foreground">
                {v.date}
              </span>
              <p className="text-sm text-foreground">{v.summary}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Closing CTA */}
      <motion.div {...fadeUp(0.3)} className="mt-12">
        <Separator className="mb-6" />
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe2 className="h-4 w-4 text-brand-accent" />
            <span>
              Want to collaborate, commission bespoke templates, or join the
              review panel?
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate("collaborate")}
            className="gap-2"
          >
            Collaborate with us
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
