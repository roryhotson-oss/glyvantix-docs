"use client";

import {
  BarChart3,
  Briefcase,
  ClipboardList,
  FileSignature,
  FileText,
  Megaphone,
  Newspaper,
  ReceiptText,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  ReceiptText,
  FileSignature,
  Megaphone,
  ClipboardList,
  BarChart3,
  Scale,
  Briefcase,
  Newspaper,
  FileText,
};

const FALLBACK = FileText;

/**
 * Maps a template's stored `icon` string back to a Lucide component.
 * Falls back to FileText when the icon name isn't recognised.
 */
export function TemplateIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? FALLBACK;
  return <Icon className={cn("h-5 w-5", className)} />;
}

/** Coloured background circle for a template icon, based on category. */
export function iconTintFor(category: string): string {
  switch (category) {
    case "Business":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "Legal":
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300";
    case "Marketing":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    case "Personal":
      return "bg-neutral-200 text-neutral-700 dark:bg-neutral-700/40 dark:text-neutral-200";
    case "HR":
      return "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/** Subtle tint used for the type/source badges in the dashboard list. */
export function badgeTintFor(category: string): string {
  switch (category) {
    case "business":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";
    case "legal":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30";
    case "marketing":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30";
    case "personal":
      return "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-700/30 dark:text-neutral-200 dark:border-neutral-600";
    case "hr":
      return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}
