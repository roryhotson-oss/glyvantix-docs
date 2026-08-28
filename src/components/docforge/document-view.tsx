"use client";

// DocumentView — the generated-document preview with white-label branding.
// Renders a brand letterhead (monogram + company name) above the document,
// a regulatory warning banner for clinical categories, an optional watermark
// (reader email + company + timestamp) overlaid on the body, optional
// copy-protection (disabled right-click + text selection), and an optional
// paywall that shows only the first paragraph to free users.

import { useMemo, type MouseEvent, type ReactNode } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  bodyFontClass,
  headingFontClass,
  useBrandingState,
} from "./branding-context";
import { BrandMonogram } from "./brand-logo";
import { Markdown } from "./markdown";

// Document categories that are clinical and require the regulatory warning.
// Comparison is case-insensitive because documents store `type` lowercased
// while templates store `category` in display case.
const CLINICAL_CATEGORIES = [
  "consent & legal authorisation",
  "patient information",
  "prescribing, pharmacy & dosing",
];

function isClinicalCategory(category?: string): boolean {
  if (!category) return false;
  return CLINICAL_CATEGORIES.includes(category.toLowerCase());
}

interface DocumentViewProps {
  // The full Markdown content.
  content: string;
  // Document title (used in the letterhead + watermark label).
  title?: string;
  // The reader's email — included in the watermark so leaks are traceable.
  readerEmail?: string;
  // Whether the reader has an active subscription. When the paywall is ON,
  // non-subscribers only see the first paragraph + an upgrade prompt.
  isSubscribed: boolean;
  // Called when the user clicks "Upgrade" on the paywall overlay.
  onUpgrade?: () => void;
  className?: string;
  // When true, suppress the letterhead (used inline in small previews).
  compact?: boolean;
  // Document category — when it's a clinical category, a regulatory
  // warning banner is rendered above the letterhead.
  category?: string;
}

// Split content into "first block" (everything up to and including the first
// blank-line-separated paragraph after the first heading) and "the rest",
// so the paywall can reveal just enough to be useful.
function splitForPaywall(content: string): { preview: string; rest: string } {
  const blocks = content.split(/\n\s*\n/);
  if (blocks.length <= 2) {
    return { preview: content, rest: "" };
  }
  // Show the first heading + the first paragraph.
  const preview = blocks.slice(0, 2).join("\n\n");
  const rest = blocks.slice(2).join("\n\n");
  return { preview, rest: rest ? "\n\n" + rest : "" };
}

export function DocumentView({
  content,
  title,
  readerEmail,
  isSubscribed,
  onUpgrade,
  className,
  compact = false,
  category,
}: DocumentViewProps) {
  const { branding } = useBrandingState();
  const isClinical = isClinicalCategory(category);

  const showPaywall =
    branding.paywallEnabled && !isSubscribed && content.trim().length > 0;
  const { preview, rest } = useMemo(
    () => (showPaywall ? splitForPaywall(content) : { preview: content, rest: "" }),
    [content, showPaywall]
  );

  // Copy-protection: block the browser's context menu and disable text
  // selection on this element. Determined users can still screenshot or
  // view-source, but this stops casual copy-paste.
  const copyProtect = branding.copyProtectEnabled;

  function handleContextMenu(e: MouseEvent<HTMLDivElement>) {
    if (copyProtect) e.preventDefault();
  }
  function handleCopy(e: React.ClipboardEvent<HTMLDivElement>) {
    if (copyProtect) {
      e.preventDefault();
      e.clipboardData?.setData(
        "text/plain",
        `This document is protected by ${branding.companyName}.`
      );
    }
  }
  function handleDragStart(e: MouseEvent<HTMLDivElement>) {
    if (copyProtect) e.preventDefault();
  }

  // Watermark text: reader email + company + date.
  const watermarkText = useMemo(() => {
    const parts: string[] = [];
    if (readerEmail) parts.push(readerEmail);
    parts.push(branding.companyName);
    parts.push(new Date().toLocaleDateString());
    return parts.join(" · ");
  }, [readerEmail, branding.companyName]);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3",
        copyProtect && "select-none",
        className
      )}
      onContextMenu={handleContextMenu}
      onCopy={handleCopy}
      onCut={handleCopy}
      onDragStart={handleDragStart}
    >
      {/* Regulatory warning banner for clinical documents */}
      {isClinical && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-700 dark:text-amber-400" />
            <div className="text-xs text-amber-900 dark:text-amber-200">
              <p className="font-semibold">
                Template — not for direct patient use.
              </p>
              <p className="mt-0.5 leading-relaxed">
                This is a controlled document template. It must be localised,
                verified against current licensed product information and local
                formulary, and approved by your institution&apos;s legal,
                pharmacy, information-governance and ethics functions before
                use with any patient. Not medical or legal advice.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Letterhead */}
      {!compact && (
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <BrandMonogram companyName={branding.companyName} size={28} />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate text-sm font-bold",
                headingFontClass(branding.headingFont)
              )}
            >
              {branding.companyName}
            </p>
            <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
              {branding.tagline}
            </p>
          </div>
          {title && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {title}
            </span>
          )}
        </div>
      )}

      {/* Document body (with watermark overlay) */}
      <div className="relative">
        <div className={cn(bodyFontClass(branding.bodyFont))}>
          <Markdown content={preview} />
        </div>

        {/* Watermark overlay */}
        {branding.watermarkEnabled && content.trim().length > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <span
              className="rotate-[-24deg] select-none whitespace-nowrap text-base font-semibold uppercase tracking-widest opacity-[0.07] sm:text-lg"
              style={{ color: branding.accentColor2 }}
            >
              {watermarkText}
            </span>
          </div>
        )}

        {/* Paywall overlay */}
        {showPaywall && rest.length > 0 && (
          <div className="relative">
            {/* Gradient fade over the hidden portion */}
            <div className="pointer-events-none -mt-12 h-12 bg-gradient-to-t from-background to-transparent" />
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-brand-accent/40 bg-muted/30 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/10">
                <Lock className="h-5 w-5 text-brand-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  This is a premium document
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                  You&apos;re seeing a free preview. Subscribe to {branding.companyName}{" "}
                  for unlimited access to the full document, or buy a credit to
                  unlock this one.
                </p>
              </div>
              {onUpgrade && (
                <Button size="sm" onClick={onUpgrade} className="btn-brand">
                  Unlock full document
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tiny shim so unused ReactNode import is referenced (keeps TS happy in some
// toolchains) without affecting runtime.
void (null as unknown as ReactNode);
