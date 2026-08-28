"use client";

// CollaborateTab — the collaboration hub.
// Three pathways: submit an amendment to a document, join the consortium,
// or request advisory / bespoke drafting. All three open a pre-filled
// email to the research contact, which is the right channel for a human
// conversation about collaboration.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GitPullRequest,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  headingFontClass,
  useBrandingState,
} from "./branding-context";

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.45, delay, ease: "easeOut" as const },
  };
}

export function CollaborateTab() {
  const { branding } = useBrandingState();

  // Amendment form state.
  const [amendName, setAmendName] = useState("");
  const [amendEmail, setAmendEmail] = useState("");
  const [amendInstitution, setAmendInstitution] = useState("");
  const [amendDoc, setAmendDoc] = useState("");
  const [amendSection, setAmendSection] = useState("");
  const [amendProposal, setAmendProposal] = useState("");

  // Consortium form state.
  const [consName, setConsName] = useState("");
  const [consEmail, setConsEmail] = useState("");
  const [consInstitution, setConsInstitution] = useState("");
  const [consRole, setConsRole] = useState("");
  const [consMessage, setConsMessage] = useState("");

  // Advisory form state.
  const [advName, setAdvName] = useState("");
  const [advEmail, setAdvEmail] = useState("");
  const [advInstitution, setAdvInstitution] = useState("");
  const [advProject, setAdvProject] = useState("");
  const [advTimeline, setAdvTimeline] = useState("");

  function buildMailto(subject: string, body: string): string {
    const to = branding.contactEmail;
    return `mailto:${to}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }

  function submitAmendment(e: React.FormEvent) {
    e.preventDefault();
    if (
      !amendName.trim() ||
      !amendEmail.trim() ||
      !amendDoc.trim() ||
      !amendProposal.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    const subject = `Amendment proposal: ${amendDoc}`;
    const body = `Name: ${amendName}
Email: ${amendEmail}
Institution: ${amendInstitution || "—"}
Document: ${amendDoc}
Section: ${amendSection || "—"}

Proposed amendment:
${amendProposal}

---
Submitted via ${branding.companyName} collaboration portal`;
    window.location.href = buildMailto(subject, body);
    toast.success("Opening your email client…", {
      description: "Please review and send the pre-filled email.",
    });
  }

  function submitConsortium(e: React.FormEvent) {
    e.preventDefault();
    if (!consName.trim() || !consEmail.trim() || !consMessage.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    const subject = `Consortium membership enquiry`;
    const body = `Name: ${consName}
Email: ${consEmail}
Institution: ${consInstitution || "—"}
Role: ${consRole || "—"}

Why I'd like to join the consortium:
${consMessage}

---
Submitted via ${branding.companyName} collaboration portal`;
    window.location.href = buildMailto(subject, body);
    toast.success("Opening your email client…", {
      description: "Please review and send the pre-filled email.",
    });
  }

  function submitAdvisory(e: React.FormEvent) {
    e.preventDefault();
    if (
      !advName.trim() ||
      !advEmail.trim() ||
      !advProject.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    const subject = `Advisory / bespoke drafting enquiry`;
    const body = `Name: ${advName}
Email: ${advEmail}
Institution: ${advInstitution || "—"}
Timeline: ${advTimeline || "—"}

Project description:
${advProject}

---
Submitted via ${branding.companyName} collaboration portal`;
    window.location.href = buildMailto(subject, body);
    toast.success("Opening your email client…", {
      description: "Please review and send the pre-filled email.",
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
          <Users className="h-3 w-3" />
          Collaborate
        </Badge>
        <h2
          className={cn(
            "text-3xl font-bold tracking-tight sm:text-4xl",
            headingFontClass(branding.headingFont)
          )}
        >
          Collaborate with {branding.companyName} Research
        </h2>
        <p className="mt-3 text-muted-foreground">
          We publish our frameworks for adoption and actively seek
          collaboration with academic medical centres, NHS trusts, university
          research units, licensed clinical practices, regulators and fellow
          researchers. There are three ways to work with us.
        </p>
      </motion.div>

      <div className="flex flex-col gap-8">
        {/* 1. Submit an amendment */}
        <motion.div {...fadeUp(0.05)}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                    <GitPullRequest className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Submit an amendment
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Found a gap, an error, or a section that needs updating?
                      Propose an amendment to any CLA or PIS document. We review
                      every submission and credit contributors in the version
                      history.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="flex-none font-normal">
                  Open
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitAmendment} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Your name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={amendName}
                      onChange={(e) => setAmendName(e.target.value)}
                      placeholder="Dr Jane Smith"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Your email <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={amendEmail}
                      onChange={(e) => setAmendEmail(e.target.value)}
                      placeholder="jane.smith@nhs.net"
                      required
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium">
                    Institution (optional)
                  </Label>
                  <Input
                    value={amendInstitution}
                    onChange={(e) => setAmendInstitution(e.target.value)}
                    placeholder="St Mary's NHS Foundation Trust"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Document code <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={amendDoc}
                      onChange={(e) => setAmendDoc(e.target.value)}
                      placeholder="CLA-001"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Section (optional)
                    </Label>
                    <Input
                      value={amendSection}
                      onChange={(e) => setAmendSection(e.target.value)}
                      placeholder="Section 4 — Risks"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium">
                    Proposed amendment <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    rows={4}
                    value={amendProposal}
                    onChange={(e) => setAmendProposal(e.target.value)}
                    placeholder="Describe the change you're proposing and why. Reference the source/evidence if possible."
                    required
                  />
                </div>
                <Button type="submit" className="btn-brand ml-auto gap-2">
                  <Mail className="h-4 w-4" />
                  Submit amendment
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Join the consortium */}
        <motion.div {...fadeUp(0.1)}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Join the consortium
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Consortium members get early access to draft documents,
                      voting rights on amendments, quarterly roundtables,
                      named credit in publications, and discounts on bespoke
                      drafting. Membership is by institutional application.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="flex-none font-normal">
                  Institutional
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitConsortium} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Your name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={consName}
                      onChange={(e) => setConsName(e.target.value)}
                      placeholder="Prof. James Brown"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Your email <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={consEmail}
                      onChange={(e) => setConsEmail(e.target.value)}
                      placeholder="j.brown@uni.ac.uk"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Institution (optional)
                    </Label>
                    <Input
                      value={consInstitution}
                      onChange={(e) => setConsInstitution(e.target.value)}
                      placeholder="University Hospital Trust"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Role (optional)
                    </Label>
                    <Input
                      value={consRole}
                      onChange={(e) => setConsRole(e.target.value)}
                      placeholder="Clinical Pharmacologist"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium">
                    Why do you want to join? <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    rows={3}
                    value={consMessage}
                    onChange={(e) => setConsMessage(e.target.value)}
                    placeholder="Briefly describe your institution's interest in peptide therapeutics consent frameworks."
                    required
                  />
                </div>
                <Button type="submit" className="btn-brand ml-auto gap-2">
                  <Mail className="h-4 w-4" />
                  Apply to join
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Request advisory */}
        <motion.div {...fadeUp(0.15)}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      Request advisory / bespoke drafting
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Need help localising a document to your institution, or a
                      bespoke consent framework for a new peptide protocol?
                      Tell us about your project and we&apos;ll be in touch to
                      scope the engagement.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="flex-none font-normal">
                  Bespoke
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitAdvisory} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Your name <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={advName}
                      onChange={(e) => setAdvName(e.target.value)}
                      placeholder="Dr Sarah Lee"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Your email <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={advEmail}
                      onChange={(e) => setAdvEmail(e.target.value)}
                      placeholder="sarah.lee@clinic.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Institution (optional)
                    </Label>
                    <Input
                      value={advInstitution}
                      onChange={(e) => setAdvInstitution(e.target.value)}
                      placeholder="Lee Aesthetics Ltd"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">
                      Timeline (optional)
                    </Label>
                    <Select
                      value={advTimeline}
                      onValueChange={setAdvTimeline}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgent">Urgent (under 2 weeks)</SelectItem>
                        <SelectItem value="month">1–3 months</SelectItem>
                        <SelectItem value="quarter">3–6 months</SelectItem>
                        <SelectItem value="planning">Just exploring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium">
                    Project description <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    rows={4}
                    value={advProject}
                    onChange={(e) => setAdvProject(e.target.value)}
                    placeholder="What do you need? E.g. 'We're launching a semaglutide weight-management service and need CLA-001 + CLA-008 + a bespoke patient information sheet localised to our clinic.'"
                    required
                  />
                </div>
                <Button type="submit" className="btn-brand ml-auto gap-2">
                  <Mail className="h-4 w-4" />
                  Request advisory
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Closing */}
      <motion.div {...fadeUp(0.2)} className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowRight className="h-4 w-4 text-brand-accent" />
        <span>
          All submissions open a pre-filled email to{" "}
          <strong className="text-foreground">{branding.contactEmail}</strong>.
          We aim to respond within 5 working days.
        </span>
      </motion.div>
    </div>
  );
}
