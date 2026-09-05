"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CreditCard,
  FileText,
  Rocket,
  Shield,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { TabId } from "./api";

interface HomeTabProps {
  onNavigate: (tab: TabId) => void;
  templatesCount: number;
}

const FEATURES = [
  {
    icon: Wand2,
    title: "AI-localised clinical documents",
    body: "Pick a CLA consent form or PIS patient sheet, fill in your institution details, and the AI generates a localised draft anchored to 21 CFR 50, 45 CFR 46, UK GDPR and ICH E6(R3).",
    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  {
    icon: FileText,
    title: "30 framework documents",
    body: "12 consent & legal authorisation forms, 11 patient information sheets and 7 prescribing, pharmacy & dosing records covering the full peptide therapeutics lifecycle — from master consent to dispensing.",
    accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    icon: Shield,
    title: "Traceable & protected",
    body: "Every generated document carries a letterhead, a watermark (your email + institution + date), and copy-protection. Every copy is traceable.",
    accent: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  {
    icon: Users,
    title: "Open for collaboration",
    body: "Submit amendments, join the consortium, or request advisory. We seek collaboration with academic medical centres, NHS trusts and licensed clinical practices.",
    accent: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Pick a framework document",
    body: "Browse 30 CLA, PIS and RXP documents covering the full peptide therapeutics consent, patient information and prescribing lifecycle.",
  },
  {
    n: "02",
    title: "Fill in your institution details",
    body: "Add your institution name, department, contact details and effective date. Patient-specific fields are completed by hand at the point of use.",
  },
  {
    n: "03",
    title: "Generate, localise & approve",
    body: "The AI produces a localised draft. You then review with your institution's legal, pharmacy, information-governance and ethics functions before use.",
  },
];

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.45, delay, ease: "easeOut" as const },
  };
}

export function HomeTab({ onNavigate, templatesCount }: HomeTabProps) {
  return (
    <div className="flex flex-col gap-16 pb-8 sm:gap-20">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Abstract background shapes */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
          <div className="absolute top-10 right-0 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-500/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(0,0,0,0.03),transparent_60%)]" />
          <svg
            className="absolute inset-x-0 top-0 h-full w-full opacity-[0.04] dark:opacity-[0.06]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:pt-24 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge
              variant="outline"
              className="mb-5 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
            >
              <Sparkles className="h-3 w-3" />
              Research framework · {templatesCount || 23} documents published
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-serif text-4xl font-bold tracking-tight text-balance sm:text-6xl"
          >
            Consent frameworks for{" "}
            <span className="relative whitespace-nowrap text-emerald-600">
              peptide therapeutics
              <svg
                viewBox="0 0 200 12"
                className="absolute left-0 right-0 -bottom-1.5 w-full text-amber-400"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M2 9C45 3 95 3 198 9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            A research framework of 30 clinical and pharmacy
            documents for the peptide therapeutics field. Localise
            any document to your institution, then seek collaboration on the
            next version.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mx-auto mt-4 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          >
            GLYvantix builds intelligence-led systems that help organisations organise
            information, verify evidence, and make better-informed decisions. Users and
            adopting organisations remain responsible for compliance, localisation,
            institutional review, and authorised use of every document or generated output.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => onNavigate("builder")}
              className="group h-11 px-6 text-sm"
            >
              Open the builder
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("research")}
              className="h-11 px-6 text-sm"
            >
              Read the methodology
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 text-xs text-muted-foreground"
          >
            Published for adoption · Localise and approve before use · We seek collaboration
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <motion.h2
            {...fadeUp(0)}
            className="font-serif text-3xl font-bold tracking-tight sm:text-4xl"
          >
            A complete consent & legal authorisation framework
          </motion.h2>
          <motion.p
            {...fadeUp(0.08)}
            className="mt-3 text-muted-foreground"
          >
            30 documents covering the full peptide therapeutics consent, patient information and prescribing lifecycle, anchored to 21 CFR 50, 45 CFR 46, UK GDPR and ICH E6(R3).
          </motion.p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fadeUp(0.05 * i)}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div
                    className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.accent}`}
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {f.body}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <motion.h2
            {...fadeUp(0)}
            className="font-serif text-3xl font-bold tracking-tight sm:text-4xl"
          >
            How it works
          </motion.h2>
          <motion.p {...fadeUp(0.08)} className="mt-3 text-muted-foreground">
            Three steps from blank page to ready-to-send document.
          </motion.p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} {...fadeUp(0.05 * i)}>
              <Card className="relative h-full overflow-hidden">
                <div className="absolute right-4 top-3 font-serif text-5xl font-bold text-muted-foreground/15 select-none">
                  {s.n}
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {s.body}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats row */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.div
          {...fadeUp(0)}
          className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-muted/40 p-4 sm:grid-cols-4 sm:p-6"
        >
          {[
            { label: "Framework documents", value: "20", icon: FileText },
            { label: "Categories", value: "2", icon: Rocket },
            { label: "Regulatory anchors", value: "7+", icon: Sparkles },
            { label: "Collaborators", value: "Open", icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 px-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-foreground shadow-sm">
                <stat.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-xl font-bold tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* CTA band */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-8 text-center dark:from-emerald-500/10 dark:via-background dark:to-amber-500/10 sm:p-12"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl"
          />
          <h3 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to forge your first document?
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Start on the Free plan with one complimentary document, no card
            required. Upgrade any time you need more.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => onNavigate("builder")}
              className="h-11 px-6"
            >
              Open the builder
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate("templates")}
              className="h-11 px-6"
            >
              Browse templates
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
