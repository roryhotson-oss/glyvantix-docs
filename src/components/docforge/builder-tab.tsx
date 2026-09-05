"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ClipboardCopy,
  Download,
  Lightbulb,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fieldKind,
  validateCustomPrompt,
  validateTemplateFields,
} from "@/lib/template-validation";

import { generateCustomDocument, generateDocument, type TabId } from "./api";
import { DocumentView } from "./document-view";
import {
  ClinicianAttestation,
  useClinicianAttestmentGate,
} from "./clinician-attestation";
import { TemplateIcon, iconTintFor } from "./template-icon";
import type { DocforgeDocument, Template, User } from "./types";
import { buildSupplyEnquiryUrl } from "@/lib/supply-enquiry";

interface BuilderTabProps {
  templates: Template[];
  loadingTemplates: boolean;
  selectedTemplate: Template | null;
  onSelectTemplate: (t: Template | null) => void;
  user: User | null;
  onUserChange: () => void;
  onDocumentGenerated: () => void;
  onNavigate: (tab: TabId) => void;
}

type GenState =
  | { status: "idle" }
  | { status: "generating"; progress: number }
  | {
      status: "done";
      document: DocforgeDocument;
      title: string;
    }
  | { status: "error"; message: string };

// A few suggested prompts to help users discover the free-form mode.
const PROMPT_SUGGESTIONS: string[] = [
  "Write a polite but firm email to a client who is 30 days late paying an invoice of £2,400.",
  "Draft a 2-week resignation letter for a marketing manager role. Warm but professional tone.",
  "Create a meeting agenda for a 45-minute product kickoff with engineering, design and marketing.",
  "Write a one-page refund policy for a small online course business, friendly and clear.",
  "Draft a LinkedIn post announcing I've joined a new company as Head of Growth. Excited tone.",
  "Write a short thank-you note to a customer who left a 5-star review.",
  "Create a weekly meal plan and shopping list for 2 people, vegetarian, £60 budget.",
  "Draft a cold outreach email to a SaaS founder offering freelance UX consulting.",
];

// Document categories that are clinical and require clinician attestation
// before generation.
const CLINICAL_CATEGORIES = new Set([
  "Consent & Legal Authorisation",
  "Patient Information",
  "Prescribing, Pharmacy & Dosing",
]);

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

export function BuilderTab({
  templates,
  loadingTemplates,
  selectedTemplate,
  onSelectTemplate,
  user,
  onUserChange,
  onDocumentGenerated,
  onNavigate,
}: BuilderTabProps) {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [genState, setGenState] = useState<GenState>({ status: "idle" });
  const [purchasePrompt, setPurchasePrompt] = useState<{
    templateId: string;
    price: number;
    isCustom: boolean;
  } | null>(null);

  // Free-form ("ask the AI anything") mode state.
  const [customMode, setCustomMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clinician attestation gate — required before generating clinical (CLA/PIS) docs.
  const {
    showGate,
    gateAction,
    handleAccepted,
    handleCancel,
  } = useClinicianAttestmentGate();

  // Reset form when template changes OR when toggling custom mode.
  useEffect(() => {
    setFields({});
    setGenState({ status: "idle" });
  }, [selectedTemplate?.id, customMode]);

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const requiredFields = useMemo(
    () => (selectedTemplate?.fields ?? []).filter((f) => f.required),
    [selectedTemplate]
  );

  const missingRequired = useMemo(() => {
    if (!selectedTemplate) return true;
    return requiredFields.some((f) => {
      const v = fields[f.name];
      return !v || v.trim().length === 0;
    });
  }, [selectedTemplate, fields, requiredFields]);

  const fieldErrors = useMemo(
    () => (selectedTemplate ? validateTemplateFields(selectedTemplate.fields, fields) : {}),
    [selectedTemplate, fields]
  );

  const customPromptError = validateCustomPrompt(customPrompt);
  const customPromptTooShort = Boolean(customPromptError);

  function startProgressAnimation(estSeconds: number) {
    if (progressTimer.current) clearInterval(progressTimer.current);
    const total = Math.max(2, estSeconds) * 1000;
    const startedAt = Date.now();
    setGenState({ status: "generating", progress: 0 });
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(90, (elapsed / total) * 100);
      setGenState({ status: "generating", progress: pct });
    }, 120);
  }

  function stopProgressAnimation() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  }

  // Shared handler for a successful/failed outcome from either generation path.
  function handleOutcome(
    outcome:
      | { ok: true; data: import("./types").GenerateResponse }
      | { ok: false; needsPurchase: true; price: number; templateId: string; message: string }
      | { ok: false; needsPurchase: false; message: string },
    successVerb: string
  ) {
    stopProgressAnimation();
    if (outcome.ok) {
      setGenState({
        status: "done",
        document: outcome.data.document,
        title: outcome.data.document.title,
      });
      toast.success("Document generated!", {
        description: successVerb,
      });
      onDocumentGenerated();
      onUserChange();
    } else if (outcome.needsPurchase) {
      setGenState({ status: "idle" });
      setPurchasePrompt({
        templateId: outcome.templateId,
        price: outcome.price,
        isCustom: outcome.templateId === "custom",
      });
    } else {
      setGenState({ status: "error", message: outcome.message });
      toast.error("Failed to generate document", {
        description: outcome.message,
      });
    }
  }

  async function handleGenerate() {
    if (!selectedTemplate || missingRequired || Object.keys(fieldErrors).length > 0) {
      toast.error("Please correct the highlighted fields before generating.");
      return;
    }
    // Clinical templates require the clinician attestation gate.
    const isClinical = CLINICAL_CATEGORIES.has(selectedTemplate.category);
    const doGenerate = async () => {
      startProgressAnimation(selectedTemplate.estTime);
      try {
        const outcome = await generateDocument(selectedTemplate.id, fields);
        handleOutcome(outcome, `${selectedTemplate.name} is ready to review.`);
      } catch (err) {
        stopProgressAnimation();
        setGenState({
          status: "error",
          message: err instanceof Error ? err.message : "Unexpected error",
        });
        toast.error("Failed to generate document");
      }
    };
    if (isClinical) {
      gateAction(() => { void doGenerate(); });
    } else {
      await doGenerate();
    }
  }

  async function handleGenerateCustom() {
    if (customPromptTooShort) {
      toast.error(customPromptError ?? "Please enter a valid document request.");
      return;
    }
    // Free-form generation tends to take a touch longer than structured templates.
    startProgressAnimation(16);
    try {
      const outcome = await generateCustomDocument(
        customPrompt.trim(),
        customTitle.trim() || undefined
      );
      handleOutcome(outcome, "Your custom document is ready to review.");
    } catch (err) {
      stopProgressAnimation();
      setGenState({
        status: "error",
        message: err instanceof Error ? err.message : "Unexpected error",
      });
      toast.error("Failed to generate document");
    }
  }

  function handleSupplyEnquiry() {
    if (!purchasePrompt) return;
    if (purchasePrompt.isCustom) {
      setPurchasePrompt(null);
      onNavigate("pricing");
      return;
    }
    if (!selectedTemplate) return;
    window.location.assign(buildSupplyEnquiryUrl(selectedTemplate.name, purchasePrompt.price));
  }

  function handleCopy() {
    if (genState.status !== "done") return;
    navigator.clipboard
      .writeText(genState.document.content)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy to clipboard"));
  }

  function handleDownload() {
    if (genState.status !== "done") return;
    downloadMarkdown(
      `${slugify(genState.document.title) || "glyvantix-document"}.md`,
      genState.document.content
    );
    toast.success("Downloaded as Markdown");
  }

  function resetAll() {
    setFields({});
    setCustomPrompt("");
    setCustomTitle("");
    setGenState({ status: "idle" });
  }

  function pickAnother() {
    onSelectTemplate(null);
    setCustomMode(false);
    resetAll();
  }

  const previewTitle =
    genState.status === "done"
      ? genState.document.title
      : customMode
        ? "Custom document"
        : selectedTemplate?.name ?? "";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Document builder
        </h2>
        <p className="mt-2 text-muted-foreground">
          Describe anything in your own words, or pick a template — the AI
          forges a polished document in seconds.
        </p>
      </div>

      {/* Step 1: choose a mode / template */}
      {!selectedTemplate && !customMode && (
        <section aria-labelledby="step1-heading">
          <div className="mb-4 flex items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-foreground/20 bg-foreground text-background"
            >
              Step 1
            </Badge>
            <h3 id="step1-heading" className="text-lg font-semibold">
              How do you want to start?
            </h3>
          </div>

          {/* Free-form "ask the AI" card — the new way */}
          <button
            type="button"
            onClick={() => setCustomMode(true)}
            className="group mb-4 block w-full text-left"
          >
            <Card className="overflow-hidden border-emerald-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="relative bg-gradient-to-br from-emerald-50 via-background to-amber-50 p-6 dark:from-emerald-500/10 dark:via-background dark:to-amber-500/10 sm:p-8">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-16 right-6 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl"
                />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                      <Wand2 className="h-6 w-6" />
                    </div>
                    <div className="max-w-2xl">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="font-serif text-lg font-bold">
                          Describe anything
                        </span>
                        <Badge className="gap-1 bg-emerald-600 text-white">
                          <Sparkles className="h-3 w-3" />
                          Free-form AI
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Skip the templates and just type what you need in plain
                        English — “write a polite chase email for an unpaid
                        invoice”, “draft a 2-week resignation letter”, “make a
                        meeting agenda for a product kickoff”. The AI writes
                        the whole document for you.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex flex-none items-center gap-1 text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    Start typing
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Card>
          </button>

          <div className="mb-3 mt-6 flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              or pick a template
            </span>
            <Separator className="flex-1" />
          </div>

          {loadingTemplates ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No templates available yet. Ask the backend to seed templates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid max-h-[640px] gap-4 overflow-y-auto pb-2 pr-1 sm:grid-cols-2 lg:grid-cols-3 [scrollbar-width:thin] [scrollbar-color:theme(colors.border)_transparent]">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTemplate(t)}
                  className="group text-left"
                >
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={cn(
                            "flex h-10 w-10 flex-none items-center justify-center rounded-xl",
                            iconTintFor(t.category)
                          )}
                        >
                          <TemplateIcon name={t.icon} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="font-normal">
                            {t.category}
                          </Badge>
                          {t.premium ? (
                            <Badge className="bg-amber-500 text-white">
                              ${t.price.toFixed(2)}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            >
                              Free
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="mt-3 text-base">{t.name}</CardTitle>
                      <CardDescription className="line-clamp-2 leading-relaxed">
                        {t.description}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between pt-0">
                      <span className="text-xs text-muted-foreground">
                        ~{t.estTime}s · {t.fields.length} fields
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        Use template
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </CardFooter>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 2 & 3: free-form custom mode */}
      {customMode && (
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Prompt column */}
          <div className="order-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-foreground/20 bg-foreground text-background"
              >
                Step 2
              </Badge>
              <h3 className="text-lg font-semibold">Describe your document</h3>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
                      <Wand2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Free-form AI</CardTitle>
                      <CardDescription className="text-xs">
                        Type anything · uses 1 credit per document
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={pickAnother}
                    className="text-xs"
                  >
                    Change
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-prompt" className="text-sm font-medium">
                    What do you want to create? <span className="text-rose-500">*</span>
                  </Label>
                  <Textarea
                    id="custom-prompt"
                    rows={7}
                    placeholder="e.g. Write a warm but professional two-week resignation letter for my role as Marketing Manager at Northwind Traders. I've enjoyed my time here and want to leave on good terms. My last day will be 13 September."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    maxLength={8000}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {customPromptError
                        ? customPromptError
                        : "Tip: include names, dates, tone and any must-have details."}
                    </span>
                    <span>{customPrompt.length.toLocaleString()} / 8,000</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="custom-title" className="text-sm font-medium">
                    Title <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="custom-title"
                    placeholder="e.g. Resignation letter — Alex Patel"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>

                {/* Suggested prompts */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    Need inspiration? Try one of these:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {PROMPT_SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setCustomPrompt(s);
                          if (!customTitle.trim()) {
                            setCustomTitle(s.split(" ").slice(0, 4).join(" ") + "…");
                          }
                        }}
                        className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground"
                      >
                        {s.length > 64 ? s.slice(0, 64) + "…" : s}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {user && user.credits >= 99999 ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                      >
                        Unlimited credits
                      </Badge>
                    ) : user ? (
                      <Badge variant="outline" className="font-normal">
                        <Lock className="mr-1 h-3 w-3" />
                        {user.credits} credit{user.credits === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"
                    >
                      Premium feature
                    </Badge>
                  </div>
                  <Button
                    onClick={handleGenerateCustom}
                    disabled={
                      customPromptTooShort || genState.status === "generating"
                    }
                    className="ml-auto"
                  >
                    {genState.status === "generating" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Forging...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate document
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview column (shared) */}
          <div className="order-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-foreground/20 bg-foreground text-background"
              >
                Step 3
              </Badge>
              <h3 className="text-lg font-semibold">Preview</h3>
            </div>

            <Card className="flex min-h-[420px] flex-1 flex-col">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-base">{previewTitle}</CardTitle>
                <CardDescription className="text-xs">
                  {genState.status === "done"
                    ? `Generated ${new Date(
                        genState.document.createdAt
                      ).toLocaleString()}`
                    : "Your generated document will appear here."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.border)_transparent]">
                <BuilderPreview
                  genState={genState}
                  onRetry={handleGenerateCustom}
                  user={user}
                  onNavigate={onNavigate}
                />
              </CardContent>

              {genState.status === "done" && (
                <CardFooter className="flex flex-wrap items-center gap-2 border-t border-border p-3">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <ClipboardCopy className="mr-2 h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      toast.message("Already saved to your dashboard", {
                        description: "Find it under the Dashboard tab.",
                      })
                    }
                  >
                    <Check className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                    Saved
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetAll}
                    className="ml-auto"
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Generate another
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* Step 2 & 3: template mode */}
      {selectedTemplate && !customMode && (
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Form column */}
          <div className="order-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-foreground/20 bg-foreground text-background"
              >
                Step 2
              </Badge>
              <h3 className="text-lg font-semibold">Fill in the details</h3>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        iconTintFor(selectedTemplate.category)
                      )}
                    >
                      <TemplateIcon name={selectedTemplate.icon} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {selectedTemplate.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {selectedTemplate.category} · {selectedTemplate.fields.length}{" "}
                        fields · ~{selectedTemplate.estTime}s
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={pickAnother}
                    className="text-xs"
                  >
                    Change
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {selectedTemplate.fields.map((f) => {
                  const id = `field-${f.name}`;
                  const value = fields[f.name] ?? "";
                  const error = fieldErrors[f.name];
                  const kind = fieldKind(f);
                  const isSelect = f.type === "select";
                  const options = isSelect
                    ? (f.placeholder ?? "")
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    : [];
                  return (
                    <div key={f.name} className="flex flex-col gap-1.5">
                      <Label htmlFor={id} className="text-sm font-medium">
                        {f.label}
                        {f.required && (
                          <span className="ml-0.5 text-rose-500">*</span>
                        )}
                      </Label>
                      {f.type === "textarea" ? (
                        <Textarea
                          id={id}
                          rows={4}
                          placeholder={f.placeholder}
                          value={value}
                          aria-invalid={Boolean(error)}
                          onChange={(e) =>
                            setFields((s) => ({ ...s, [f.name]: e.target.value }))
                          }
                        />
                      ) : isSelect ? (
                        <Select
                          value={value}
                          onValueChange={(v) =>
                            setFields((s) => ({ ...s, [f.name]: v }))
                          }
                        >
                          <SelectTrigger id={id} aria-invalid={Boolean(error)}>
                            <SelectValue
                              placeholder={
                                f.placeholder?.startsWith("Choose")
                                  ? f.placeholder
                                  : `Choose ${f.label.toLowerCase()}`
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={id}
                          type={kind === "email" ? "email" : "text"}
                          inputMode={kind === "number" ? "decimal" : kind === "tel" ? "tel" : undefined}
                          placeholder={f.placeholder}
                          value={value}
                          aria-invalid={Boolean(error)}
                          onChange={(e) =>
                            setFields((s) => ({ ...s, [f.name]: e.target.value }))
                          }
                        />
                      )}
                      {error && <p className="text-xs text-rose-600">{error}</p>}
                    </div>
                  );
                })}

                {requiredFields.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <span className="text-rose-500">*</span> Required ·{" "}
                    {requiredFields.length} field
                    {requiredFields.length === 1 ? "" : "s"}
                  </p>
                )}

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {user && user.credits >= 99999 ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                      >
                        Unlimited credits
                      </Badge>
                    ) : user ? (
                      <Badge variant="outline" className="font-normal">
                        <Lock className="mr-1 h-3 w-3" />
                        {user.credits} credit{user.credits === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                    {!selectedTemplate.premium && (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                      >
                        Free template
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleGenerate}
                    disabled={missingRequired || genState.status === "generating"}
                    className="ml-auto"
                  >
                    {genState.status === "generating" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Forging...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate document
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview column */}
          <div className="order-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-foreground/20 bg-foreground text-background"
              >
                Step 3
              </Badge>
              <h3 className="text-lg font-semibold">Preview</h3>
            </div>

            <Card className="flex min-h-[420px] flex-1 flex-col">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-base">{previewTitle}</CardTitle>
                <CardDescription className="text-xs">
                  {genState.status === "done"
                    ? `Generated ${new Date(
                        genState.document.createdAt
                      ).toLocaleString()}`
                    : "Your generated document will appear here."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.border)_transparent]">
                <BuilderPreview
                  genState={genState}
                  onRetry={handleGenerate}
                  estSeconds={selectedTemplate.estTime}
                  user={user}
                  onNavigate={onNavigate}
                  category={selectedTemplate.category}
                />
              </CardContent>

              {genState.status === "done" && (
                <CardFooter className="flex flex-wrap items-center gap-2 border-t border-border p-3">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <ClipboardCopy className="mr-2 h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      toast.message("Already saved to your dashboard", {
                        description: "Find it under the Dashboard tab.",
                      })
                    }
                  >
                    <Check className="mr-2 h-3.5 w-3.5 text-emerald-600" />
                    Saved
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetAll}
                    className="ml-auto"
                  >
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Generate another
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* Purchase-required dialog (shared) */}
      <Dialog
        open={purchasePrompt !== null}
        onOpenChange={(o) => !o && setPurchasePrompt(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {purchasePrompt?.isCustom
                ? "Subscription or credits needed"
                : "Purchase required"}
            </DialogTitle>
            <DialogDescription>
              {purchasePrompt ? (
                purchasePrompt.isCustom ? (
                  <>
                    Free-form AI generation needs an active subscription or a
                    credit pack. Subscribers get unlimited documents; or buy 5
                    credits for{" "}
                    <strong className="text-foreground">
                      ${purchasePrompt.price.toFixed(2)}
                    </strong>{" "}
                    and generate 5 custom docs.
                  </>
                ) : (
                  <>
                    This premium template needs a subscription or a one-time
                    purchase. You can buy this document for{" "}
                    <strong className="text-foreground">
                      ${purchasePrompt.price.toFixed(2)}
                    </strong>{" "}
                    and we&apos;ll add 1 credit to your account, or upgrade to a
                    plan that includes all premium templates.
                  </>
                )
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setPurchasePrompt(null);
                onNavigate("pricing");
              }}
            >
              {purchasePrompt?.isCustom
                ? "See plans & credit packs"
                : "See subscription plans"}
            </Button>
            {!purchasePrompt?.isCustom && (
              <Button
                onClick={handleSupplyEnquiry}
                className="gap-2"
              >
                {purchasePrompt ? (
                  <>
                      <ArrowRight className="h-4 w-4" />
                      Open supply enquiry
                  </>
                ) : null}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clinician attestation gate (shown before first clinical doc generation) */}
      <ClinicianAttestation
        open={showGate}
        onAccepted={handleAccepted}
        onCancel={handleCancel}
      />
    </div>
  );
}

// Shared preview pane used by both template and custom generation paths.
function BuilderPreview({
  genState,
  onRetry,
  estSeconds,
  user,
  onNavigate,
  category,
}: {
  genState: GenState;
  onRetry: () => void;
  estSeconds?: number;
  user: User | null;
  onNavigate: (tab: TabId) => void;
  category?: string;
}) {
  if (genState.status === "idle") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="max-w-xs text-sm">
          Fill the form and press{" "}
          <span className="font-medium text-foreground">Generate document</span>{" "}
          to forge your draft.
        </p>
      </div>
    );
  }

  if (genState.status === "generating") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-12">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        >
          <Loader2 className="h-6 w-6 animate-spin" />
        </motion.div>
        <p className="text-sm font-medium">Forging your document...</p>
        {estSeconds ? (
          <p className="text-xs text-muted-foreground">~{estSeconds}s estimated</p>
        ) : (
          <p className="text-xs text-muted-foreground">This can take a little longer for free-form requests.</p>
        )}
        <Progress
          value={genState.progress}
          className="mt-2 h-1.5 w-full max-w-sm"
        />
      </div>
    );
  }

  if (genState.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
          <span className="text-xl">!</span>
        </div>
        <p className="text-sm font-medium">Generation failed</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {genState.message}
        </p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  // Done — render the branded, protected document view.
  return (
    <DocumentView
      content={genState.document.content}
      title={genState.document.title}
      readerEmail={user?.email}
      isSubscribed={!!user && user.plan !== "free"}
      onUpgrade={() => onNavigate("research")}
      className="py-1"
      category={category}
    />
  );
}
