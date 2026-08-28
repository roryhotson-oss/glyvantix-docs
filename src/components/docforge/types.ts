// Shared types for GLYvantix Docs single-page app.
// These mirror the API contract described in /home/z/my-project/API_CONTRACT.md.

export type Category = "Business" | "Legal" | "Marketing" | "Personal" | "HR";

export type FieldType = "text" | "email" | "textarea" | "select";

export interface TemplateField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: Category | string;
  icon: string;
  fields: TemplateField[];
  price: number;
  premium: boolean;
  estTime: number;
}

export type PlanId = "free" | "starter" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  credits: number;
  createdAt: string;
}

export interface Subscription {
  id: string;
  plan: PlanId;
  cycle: BillingCycle;
  amount: number;
  status: string;
  startedAt: string;
  expiresAt: string;
}

export interface UserResponse {
  user: User;
  subscription: Subscription | null;
  documentsCount: number;
  purchasesCount: number;
}

export type DocumentSource = "subscription" | "purchase" | "free";

export interface DocforgeDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  source: DocumentSource | string;
  templateId?: string;
  templateName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Purchase {
  id: string;
  type: string;
  amount: number;
  [key: string]: unknown;
}

export interface GenerateResponse {
  document: DocforgeDocument;
  user: User;
  remainingCredits: number;
}

export interface BuyResponse {
  purchase: Purchase;
  user: User;
  ok: boolean;
}

export interface CreditsResponse {
  user: User;
  purchase: Purchase;
  ok: boolean;
}

export interface NeedsPurchaseError {
  error: string;
  needsPurchase: true;
  price: number;
  templateId: string;
}
