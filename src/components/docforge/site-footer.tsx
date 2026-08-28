"use client";

import {
  headingFontClass,
  useBrandingState,
} from "./branding-context";
import { BrandMonogram } from "./brand-logo";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  const { branding } = useBrandingState();

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <BrandMonogram companyName={branding.companyName} size={28} />
          <span
            className={cn(
              "font-semibold text-foreground",
              headingFontClass(branding.headingFont)
            )}
          >
            {branding.companyName}
          </span>
          <span className="text-muted-foreground">
            · Forged by AI · {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
          <a className="hover:text-foreground transition-colors" href="#">
            Privacy
          </a>
          <a className="hover:text-foreground transition-colors" href="#">
            Terms
          </a>
          <a className="hover:text-foreground transition-colors" href="#">
            Templates
          </a>
          <a className="hover:text-foreground transition-colors" href="#">
            Contact
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          {branding.contactEmail}
        </p>
      </div>
    </footer>
  );
}
