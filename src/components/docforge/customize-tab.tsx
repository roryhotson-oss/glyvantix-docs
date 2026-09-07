"use client";

// CustomizeTab — white-label settings panel.
// Lets a buyer set company name, tagline, slug, contact email, logo,
// monogram icon, fonts, accent colors, and document-protection toggles.
// Saves via PUT /api/branding. Includes a live preview of the header
// logo + footer.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Palette,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Type,
  Upload,
  Wand2,
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  headingFontClass,
  useBranding,
  type Branding,
  type BrandingUpdate,
} from "./branding-context";
import { BrandLogo, BrandMonogram } from "./brand-logo";

const MONOGRAM_OPTIONS = [
  { value: "Sparkles", label: "Sparkles" },
  { value: "Feather", label: "Feather" },
  { value: "FileText", label: "Document" },
  { value: "PenTool", label: "Pen" },
  { value: "Stamp", label: "Stamp" },
] as const;

const FONT_OPTIONS = [
  { value: "serif", label: "Serif (elegant, editorial)" },
  { value: "sans", label: "Sans (clean, modern)" },
  { value: "mono", label: "Mono (technical)" },
] as const;

// Handful of preset accent palettes the buyer can one-click apply.
const COLOR_PRESETS: { name: string; accent: string; accent2: string }[] = [
  { name: "Midnight + Amber", accent: "#0f172a", accent2: "#f59e0b" },
  { name: "Forest + Gold", accent: "#065f46", accent2: "#d97706" },
  { name: "Burgundy + Cream", accent: "#7f1d1d", accent2: "#fde68a" },
  { name: "Slate + Sky", accent: "#334155", accent2: "#0ea5e9" },
  { name: "Charcoal + Rose", accent: "#18181b", accent2: "#f43f5e" },
  { name: "Plum + Mint", accent: "#4c1d95", accent2: "#10b981" },
];

export function CustomizeTab() {
  const { branding: live, loading, save, reset } = useBranding();
  const [draft, setDraft] = useState<Branding | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep the draft in sync with the live branding from context.
  useEffect(() => {
    if (live) setDraft(live);
  }, [live]);

  if (loading || !draft) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(live);

  function patch<K extends keyof BrandingUpdate>(key: K, value: BrandingUpdate[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const next = await save({
        companyName: draft.companyName,
        tagline: draft.tagline,
        slug: draft.slug,
        contactEmail: draft.contactEmail,
        logoUrl: draft.logoUrl,
        monogramIcon: draft.monogramIcon,
        headingFont: draft.headingFont,
        bodyFont: draft.bodyFont,
        accentColor: draft.accentColor,
        accentColor2: draft.accentColor2,
        watermarkEnabled: draft.watermarkEnabled,
        paywallEnabled: draft.paywallEnabled,
        copyProtectEnabled: draft.copyProtectEnabled,
      });
      toast.success("Branding saved", {
        description: `${next.companyName} is now live across the app.`,
      });
    } catch (e) {
      toast.error("Could not save branding", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const next = await reset();
      setDraft(next);
      toast.success("Reset to defaults", {
        description: "All branding settings are back to GLYvantix Docs defaults.",
      });
    } catch (e) {
      toast.error("Reset failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setResetting(false);
    }
  }

  function handleLogoUpload(file: File) {
    // Limit to 200KB to match the API cap.
    if (file.size > 200_000) {
      toast.error("Logo too large", {
        description: "Please upload an image under 200KB.",
      });
      return;
    }
    if (!["image/png", "image/svg+xml", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Unsupported logo format", {
        description: "Please upload a PNG, SVG, JPEG, or WebP image.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      patch("logoUrl", dataUrl);
    };
    reader.onerror = () => toast.error("Could not read the file.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Header row */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 border-brand-accent/30 bg-brand-accent/5 text-brand-accent"
            >
              <Settings2 className="h-3 w-3" />
              White-label
            </Badge>
          </div>
          <h2 className={cn("text-3xl font-bold tracking-tight", headingFontClass(draft.headingFont))}>
            Customize your brand
          </h2>
          <p className="mt-2 text-muted-foreground">
            Make {draft.companyName || "the app"} your own. Set your company
            name, upload a logo, pick fonts and brand colors, and choose how
            generated documents are protected. Changes apply across the whole
            app instantly.
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetting || saving}
            className="gap-2"
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="btn-brand gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save branding
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: form fields (2 cols on desktop) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Identity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-brand-accent" />
                <CardTitle className="text-base">Brand identity</CardTitle>
              </div>
              <CardDescription className="text-xs">
                The company name and tagline shown in the header, footer and
                document letterheads.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="companyName" className="text-sm font-medium">
                    Company name
                  </Label>
                  <Input
                    id="companyName"
                    value={draft.companyName}
                    maxLength={60}
                    onChange={(e) => patch("companyName", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    URL slug
                  </Label>
                  <Input
                    id="slug"
                    value={draft.slug}
                    maxLength={40}
                    onChange={(e) => patch("slug", e.target.value.toLowerCase())}
                    placeholder="acme-docs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers and hyphens. Used in download
                    filenames.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tagline" className="text-sm font-medium">
                  Tagline
                </Label>
                <Input
                  id="tagline"
                  value={draft.tagline}
                  maxLength={80}
                  onChange={(e) => patch("tagline", e.target.value)}
                  placeholder="AI document studio"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contactEmail" className="text-sm font-medium">
                  Contact email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={draft.contactEmail}
                  onChange={(e) => patch("contactEmail", e.target.value)}
                  placeholder="hello@yourcompany.com"
                />
                <p className="text-xs text-muted-foreground">
                  Shown in the footer and used in document watermarks.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Logo + monogram */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-brand-accent" />
                <CardTitle className="text-base">Logo &amp; monogram</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Upload a logo (PNG/SVG up to 200KB) or pick a monogram icon —
                the icon is used when no logo is set.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <BrandLogo
                  logoUrl={draft.logoUrl}
                  monogramIcon={draft.monogramIcon}
                  companyName={draft.companyName}
                  size={56}
                  large
                />
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoUpload(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload logo
                  </Button>
                  {draft.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => patch("logoUrl", "")}
                      className="text-xs text-muted-foreground"
                    >
                      Remove logo
                    </Button>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">Monogram icon</Label>
                <Select
                  value={draft.monogramIcon}
                  onValueChange={(v) => patch("monogramIcon", v)}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONOGRAM_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used only when no logo is uploaded.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-brand-accent" />
                <CardTitle className="text-base">Typography</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Choose the font family for headings and body text. Applies to
                the whole app and to generated documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">Heading font</Label>
                <Select
                  value={draft.headingFont}
                  onValueChange={(v) => patch("headingFont", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={cn("text-lg font-bold", headingFontClass(draft.headingFont))}>
                  {draft.companyName || "Your company name"}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">Body font</Label>
                <Select
                  value={draft.bodyFont}
                  onValueChange={(v) => patch("bodyFont", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-brand-accent" />
                <CardTitle className="text-base">Brand colors</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Pick a primary accent (buttons, highlights, badges) and a
                secondary accent (premium highlights, watermarks).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {COLOR_PRESETS.map((p) => {
                  const active =
                    draft.accentColor.toLowerCase() === p.accent.toLowerCase() &&
                    draft.accentColor2.toLowerCase() === p.accent2.toLowerCase();
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        patch("accentColor", p.accent);
                        patch("accentColor2", p.accent2);
                      }}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-2 text-left transition-colors",
                        active
                          ? "border-brand-accent ring-1 ring-brand-accent"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      <span className="flex flex-none">
                        <span
                          className="h-7 w-7 rounded-l-md border border-r-0 border-border"
                          style={{ backgroundColor: p.accent }}
                        />
                        <span
                          className="h-7 w-7 rounded-r-md border border-border"
                          style={{ backgroundColor: p.accent2 }}
                        />
                      </span>
                      <span className="text-xs font-medium">{p.name}</span>
                    </button>
                  );
                })}
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField
                  label="Primary accent"
                  value={draft.accentColor}
                  onChange={(v) => patch("accentColor", v)}
                />
                <ColorField
                  label="Secondary accent"
                  value={draft.accentColor2}
                  onChange={(v) => patch("accentColor2", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Protection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-accent" />
                <CardTitle className="text-base">Document protection</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Control how generated documents can be copied, shared and
                previewed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ToggleRow
                title="Watermark documents"
                description="Stamp each generated document with the reader's email + your company name + timestamp. Discourages leaks."
                checked={draft.watermarkEnabled}
                onChange={(v) => patch("watermarkEnabled", v)}
              />
              <Separator />
              <ToggleRow
                title="Paywall full document"
                description="Free (non-subscribed) users only see the first paragraph. They must upgrade or buy a credit to unlock the full document."
                checked={draft.paywallEnabled}
                onChange={(v) => patch("paywallEnabled", v)}
              />
              <Separator />
              <ToggleRow
                title="Block right-click & selection"
                description="Disable the right-click menu and text selection on document previews. Deters casual copy-paste."
                checked={draft.copyProtectEnabled}
                onChange={(v) => patch("copyProtectEnabled", v)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: sticky live preview (1 col on desktop) */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Live preview</CardTitle>
                <CardDescription className="text-xs">
                  How your header, footer and documents will look.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Mini header preview */}
                <div className="rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2">
                    <BrandLogo
                      logoUrl={draft.logoUrl}
                      monogramIcon={draft.monogramIcon}
                      companyName={draft.companyName}
                      size={28}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-bold",
                          headingFontClass(draft.headingFont)
                        )}
                      >
                        {draft.companyName || "Your company name"}
                      </p>
                      <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                        {draft.tagline || "Your tagline"}
                      </p>
                    </div>
                    <span
                      className="ml-auto rounded px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: draft.accentColor }}
                    >
                      Preview
                    </span>
                  </div>
                </div>

                {/* Mini document preview with letterhead + watermark */}
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <BrandMonogram
                      companyName={draft.companyName}
                      size={22}
                    />
                    <p
                      className={cn(
                        "text-sm font-bold",
                        headingFontClass(draft.headingFont)
                      )}
                    >
                      {draft.companyName || "Your company name"}
                    </p>
                  </div>
                  <div className="relative py-3">
                    <p
                      className={cn(
                        "text-xs leading-relaxed text-muted-foreground",
                        headingFontClass(draft.bodyFont) === "font-serif"
                          ? "font-serif"
                          : headingFontClass(draft.bodyFont) === "font-mono"
                            ? "font-mono"
                            : "font-sans"
                      )}
                    >
                      Dear [Recipient], Thank you for your enquiry. We are
                      pleased to share the full details of our proposal below.
                      Please do not hesitate to reach out with any questions…
                    </p>
                    {draft.watermarkEnabled && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span
                          className="rotate-[-24deg] select-none text-[10px] font-semibold uppercase tracking-widest opacity-30"
                          style={{ color: draft.accentColor2 }}
                        >
                          {draft.contactEmail.split("@")[0]} ·{" "}
                          {(draft.companyName || "brand").slice(0, 14)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border pt-2">
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: draft.accentColor }}
                    >
                      Primary
                    </span>
                    <span
                      className="rounded px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: draft.accentColor2 }}
                    >
                      Secondary
                    </span>
                    <span
                      className="rounded border px-2 py-0.5 text-[10px] font-medium"
                      style={{ borderColor: draft.accentColor, color: draft.accentColor }}
                    >
                      Outline
                    </span>
                  </div>
                </div>

                {/* Mini footer preview */}
                <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BrandMonogram companyName={draft.companyName} size={18} />
                    <span className="font-medium text-foreground">
                      {draft.companyName || "Your company name"}
                    </span>
                    <span className="ml-auto">{draft.contactEmail}</span>
                  </div>
                </div>

                {dirty && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-amber-600"
                  >
                    You have unsaved changes.
                  </motion.p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-border bg-background p-1"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
          className="font-mono text-sm"
          placeholder="#0f172a"
        />
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
