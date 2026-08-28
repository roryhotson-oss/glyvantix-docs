"use client";

// BrandLogo — renders the white-label logo.
// If branding.logoUrl is set, show the image. Otherwise render a monogram
// (first letters of companyName) inside a brand-accented square, optionally
// with a Lucide icon if branding.monogramIcon is set.

import {
  Sparkles,
  Feather,
  FileText,
  PenTool,
  Stamp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Map of allowed monogram icons. Keeps the surface area small — a buyer
// can't inject arbitrary JSX via the API, only pick from this list.
const MONOGRAM_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Feather,
  FileText,
  PenTool,
  Stamp,
};

interface BrandLogoProps {
  logoUrl: string;
  monogramIcon: string;
  companyName: string;
  className?: string;
  // Size of the logo box in pixels (default 36).
  size?: number;
  // When true, render at a larger size for the settings preview.
  large?: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function BrandLogo({
  logoUrl,
  monogramIcon,
  companyName,
  className,
  size = 36,
  large = false,
}: BrandLogoProps) {
  const Icon = MONOGRAM_ICONS[monogramIcon] ?? Sparkles;
  const px = large ? 64 : size;

  if (logoUrl && logoUrl.trim().length > 0) {
    return (
      <img
        src={logoUrl}
        alt={`${companyName} logo`}
        width={px}
        height={px}
        className={cn("rounded-xl object-contain", className)}
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <span
      className={cn(
        "flex flex-none items-center justify-center rounded-xl bg-brand-accent text-background shadow-sm",
        className
      )}
      style={{ width: px, height: px }}
      aria-hidden
    >
      <Icon style={{ width: px * 0.5, height: px * 0.5 }} />
    </span>
  );
}

// A small badge with the company initials — used as a compact favicon-style
// marker in places where the full logo would be too big.
export function BrandMonogram({
  companyName,
  className,
  size = 28,
}: {
  companyName: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-lg bg-brand-accent font-semibold text-background",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(companyName)}
    </span>
  );
}
