// Thin API helpers around fetch() for the GLYvantix Docs endpoints.
// All endpoints use relative paths so Caddy can route correctly.

import type {
  BuyResponse,
  CreditsResponse,
  DocforgeDocument,
  GenerateResponse,
  Template,
  UserResponse,
} from "./types";

export type TabId =
  | "home"
  | "research"
  | "builder"
  | "templates"
  | "collaborate"
  | "dashboard"
  | "customize"
  | "pricing";

async function parseJSON<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export async function fetchUser(): Promise<UserResponse> {
  const res = await fetch("/api/user", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load user (${res.status})`);
  return parseJSON<UserResponse>(res);
}

export async function fetchTemplates(): Promise<Template[]> {
  const res = await fetch("/api/templates", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
  const data = await parseJSON<{ templates: Template[] }>(res);
  return data.templates ?? [];
}

export async function fetchDocuments(): Promise<DocforgeDocument[]> {
  const res = await fetch("/api/documents", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
  const data = await parseJSON<{ documents: DocforgeDocument[] }>(res);
  return data.documents ?? [];
}

export async function subscribe(
  plan: "starter" | "pro" | "business",
  cycle: "monthly" | "yearly"
): Promise<UserResponse> {
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, cycle }),
  });
  if (!res.ok) throw new Error(`Failed to subscribe (${res.status})`);
  return parseJSON<UserResponse>(res);
}

export async function buyTemplate(templateId: string): Promise<BuyResponse> {
  const res = await fetch("/api/buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId }),
  });
  if (!res.ok) throw new Error(`Failed to purchase template (${res.status})`);
  return parseJSON<BuyResponse>(res);
}

export async function buyCredits(
  amount: number,
  price: number
): Promise<CreditsResponse> {
  const res = await fetch("/api/credits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, price }),
  });
  if (!res.ok) throw new Error(`Failed to buy credits (${res.status})`);
  return parseJSON<CreditsResponse>(res);
}

export interface GenerateResult {
  ok: true;
  data: GenerateResponse;
}

export interface GenerateNeedsPurchase {
  ok: false;
  needsPurchase: true;
  price: number;
  templateId: string;
  message: string;
}

export interface GenerateError {
  ok: false;
  needsPurchase: false;
  message: string;
}

export type GenerateOutcome =
  | GenerateResult
  | GenerateNeedsPurchase
  | GenerateError;

export async function generateDocument(
  templateId: string,
  fields: Record<string, string>
): Promise<GenerateOutcome> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId, fields }),
  });
  return parseGenerateResponse(res, templateId);
}

export async function generateCustomDocument(
  prompt: string,
  title?: string
): Promise<GenerateOutcome> {
  const res = await fetch("/api/generate-custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, title }),
  });
  // For custom docs there is no real templateId; use "custom" so the
  // needs-purchase flow can route the user to pricing instead of buying
  // a specific template.
  return parseGenerateResponse(res, "custom");
}

async function parseGenerateResponse(
  res: Response,
  fallbackTemplateId: string
): Promise<GenerateOutcome> {
  if (res.status === 402) {
    const body = await parseJSON<{
      error?: string;
      needsPurchase?: boolean;
      price?: number;
      templateId?: string;
    }>(res);
    return {
      ok: false,
      needsPurchase: true,
      price: Number(body.price ?? 0),
      templateId: body.templateId ?? fallbackTemplateId,
      message: body.error ?? "Purchase required to generate this document.",
    };
  }
  if (!res.ok) {
    const body = await parseJSON<{ error?: string }>(res);
    return {
      ok: false,
      needsPurchase: false,
      message: body.error ?? `Generation failed (${res.status})`,
    };
  }
  const data = await parseJSON<GenerateResponse>(res);
  return { ok: true, data };
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete document (${res.status})`);
}

// Pricing constants for the pricing tab + helpers.
export const PLAN_PRICES: Record<
  "starter" | "pro" | "business",
  { monthly: number; yearly: number; docs: string }
> = {
  starter: { monthly: 19, yearly: 190, docs: "30 documents / month" },
  pro: { monthly: 39, yearly: 390, docs: "Unlimited documents" },
  business: { monthly: 99, yearly: 990, docs: "Unlimited + team seats" },
};

export const CREDIT_PACKS: { amount: number; price: number; label: string }[] = [
  { amount: 5, price: 19.99, label: "5 documents for $19.99" },
  { amount: 10, price: 34.99, label: "10 documents for $34.99" },
  { amount: 25, price: 69.99, label: "25 documents for $69.99" },
];
