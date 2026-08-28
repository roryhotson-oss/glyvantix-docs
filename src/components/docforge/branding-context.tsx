"use client";

// Branding context + types for the GLYvantix Docs white-label system.
// A single Branding object is fetched once on app mount and shared via
// React context so every component (header, footer, builder, dashboard,
// settings) reads from the same source of truth.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface Branding {
  id: string;
  companyName: string;
  tagline: string;
  slug: string;
  contactEmail: string;
  logoUrl: string;
  monogramIcon: string;
  headingFont: string;
  bodyFont: string;
  accentColor: string;
  accentColor2: string;
  watermarkEnabled: boolean;
  paywallEnabled: boolean;
  copyProtectEnabled: boolean;
  updatedAt: string;
}

// A subset of Branding that a PUT body may include.
export type BrandingUpdate = Partial<Omit<Branding, "id" | "updatedAt">>;

interface BrandingContextValue {
  branding: Branding | null;
  loading: boolean;
  error: string | null;
  // Re-fetch from the server.
  refresh: () => Promise<void>;
  // Persist a partial update. Throws on non-2xx.
  save: (patch: BrandingUpdate) => Promise<Branding>;
  // Reset to defaults.
  reset: () => Promise<Branding>;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

async function parseJSON<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/branding", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load branding (${res.status})`);
      const data = await parseJSON<{ branding: Branding }>(res);
      setBranding(data.branding);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load branding");
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(
    async (patch: BrandingUpdate): Promise<Branding> => {
      const res = await fetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await parseJSON<{ error?: string }>(res);
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }
      const data = await parseJSON<{ branding: Branding }>(res);
      setBranding(data.branding);
      return data.branding;
    },
    []
  );

  const reset = useCallback(async (): Promise<Branding> => {
    const res = await fetch("/api/branding/reset", { method: "POST" });
    if (!res.ok) {
      const body = await parseJSON<{ error?: string }>(res);
      throw new Error(body.error ?? `Reset failed (${res.status})`);
    }
    const data = await parseJSON<{ branding: Branding }>(res);
    setBranding(data.branding);
    return data.branding;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Apply branding to the document as inline CSS custom properties so the
  // whole app reacts to accent color + font changes without re-rendering
  // every component manually.
  useEffect(() => {
    if (!branding) return;
    const root = document.documentElement;
    root.style.setProperty("--brand-accent", branding.accentColor);
    root.style.setProperty("--brand-accent-2", branding.accentColor2);
    root.dataset.brandHeadingFont = branding.headingFont;
    root.dataset.brandBodyFont = branding.bodyFont;
    // Page title in the browser tab.
    if (branding.companyName) {
      document.title = `${branding.companyName} — ${branding.tagline}`;
    }
  }, [branding]);

  const value = useMemo(
    () => ({ branding, loading, error, refresh, save, reset }),
    [branding, loading, error, refresh, save, reset]
  );

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error("useBranding must be used inside a BrandingProvider");
  }
  return ctx;
}

// Convenience hook that returns the branding object (or defaults while loading)
// plus computed helpers used across the app.
export function useBrandingState() {
  const { branding, loading } = useBranding();
  // Sensible defaults while the first fetch is in flight.
  const b: Branding = branding ?? {
    id: "",
    companyName: "GLYvantix Docs",
    tagline: "AI document studio",
    slug: "glyvantix-docs",
    contactEmail: "hello@glyvantix.app",
    logoUrl: "",
    monogramIcon: "Sparkles",
    headingFont: "serif",
    bodyFont: "sans",
    accentColor: "#0f172a",
    accentColor2: "#f59e0b",
    watermarkEnabled: true,
    paywallEnabled: false,
    copyProtectEnabled: true,
    updatedAt: "",
  };
  return { branding: b, loading };
}

// Map a brand font token to a Tailwind-friendly font-family class.
export function headingFontClass(font: string): string {
  switch (font) {
    case "sans":
      return "font-sans";
    case "mono":
      return "font-mono";
    case "serif":
    default:
      return "font-serif";
  }
}

export function bodyFontClass(font: string): string {
  switch (font) {
    case "serif":
      return "font-serif";
    case "mono":
      return "font-mono";
    case "sans":
    default:
      return "font-sans";
  }
}
