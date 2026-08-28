// Shared helpers for the branding singleton (used by /api/branding and /api/branding/reset).
import { db } from '@/lib/db';
import type { Branding } from '@prisma/client';

// Public shape returned by every branding endpoint.
export type BrandingPublic = {
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
  updatedAt: string; // ISO
};

export function serializeBranding(b: Branding): BrandingPublic {
  return {
    id: b.id,
    companyName: b.companyName,
    tagline: b.tagline,
    slug: b.slug,
    contactEmail: b.contactEmail,
    logoUrl: b.logoUrl,
    monogramIcon: b.monogramIcon,
    headingFont: b.headingFont,
    bodyFont: b.bodyFont,
    accentColor: b.accentColor,
    accentColor2: b.accentColor2,
    watermarkEnabled: b.watermarkEnabled,
    paywallEnabled: b.paywallEnabled,
    copyProtectEnabled: b.copyProtectEnabled,
    updatedAt: b.updatedAt.toISOString(),
  };
}

// Ensure the singleton "default" branding row exists, creating it with defaults
// if necessary. Always returns the row.
export async function getOrCreateBranding(): Promise<Branding> {
  const existing = await db.branding.findUnique({ where: { key: 'default' } });
  if (existing) return existing;
  return db.branding.create({ data: { key: 'default' } });
}

const FONT_VALUES = ['serif', 'sans', 'mono'] as const;
const SLUG_RE = /^[a-z0-9-]+$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// The list of fields a PUT body is allowed to update.
const UPDATABLE_KEYS = [
  'companyName',
  'tagline',
  'slug',
  'contactEmail',
  'logoUrl',
  'monogramIcon',
  'headingFont',
  'bodyFont',
  'accentColor',
  'accentColor2',
  'watermarkEnabled',
  'paywallEnabled',
  'copyProtectEnabled',
] as const;

export type BrandingUpdateData = Partial<
  Pick<
    Branding,
    | 'companyName'
    | 'tagline'
    | 'slug'
    | 'contactEmail'
    | 'logoUrl'
    | 'monogramIcon'
    | 'headingFont'
    | 'bodyFont'
    | 'accentColor'
    | 'accentColor2'
    | 'watermarkEnabled'
    | 'paywallEnabled'
    | 'copyProtectEnabled'
  >
>;

// Validate a partial branding update body. Returns either `{ data }` ready to
// pass to `db.branding.update`, or `{ error }` with a 400-status message.
export function parseBrandingUpdate(
  body: unknown
): { data: BrandingUpdateData } | { error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;

  // Reject unknown keys early so callers don't silently drop typos.
  for (const key of Object.keys(obj)) {
    if (!UPDATABLE_KEYS.includes(key as (typeof UPDATABLE_KEYS)[number])) {
      return { error: `Unknown field "${key}".` };
    }
  }

  const data: BrandingUpdateData = {};

  if ('companyName' in obj) {
    const v = obj.companyName;
    if (typeof v !== 'string' || v.length < 1 || v.length > 60) {
      return { error: 'companyName must be a string of 1–60 characters.' };
    }
    data.companyName = v;
  }

  if ('tagline' in obj) {
    const v = obj.tagline;
    if (typeof v !== 'string' || v.length > 80) {
      return { error: 'tagline must be a string of at most 80 characters.' };
    }
    data.tagline = v;
  }

  if ('slug' in obj) {
    const v = obj.slug;
    if (typeof v !== 'string' || v.length > 40 || !SLUG_RE.test(v)) {
      return {
        error:
          'slug must match /^[a-z0-9-]+$/ and be at most 40 characters.',
      };
    }
    data.slug = v;
  }

  if ('contactEmail' in obj) {
    const v = obj.contactEmail;
    if (typeof v !== 'string' || !EMAIL_RE.test(v)) {
      return { error: 'contactEmail must be a valid email address.' };
    }
    data.contactEmail = v;
  }

  if ('logoUrl' in obj) {
    const v = obj.logoUrl;
    if (typeof v !== 'string' || v.length > 200_000) {
      return {
        error:
          'logoUrl must be a string of at most 200,000 characters (empty string allowed).',
      };
    }
    data.logoUrl = v;
  }

  if ('monogramIcon' in obj) {
    const v = obj.monogramIcon;
    if (typeof v !== 'string' || v.length === 0) {
      return { error: 'monogramIcon must be a non-empty string.' };
    }
    data.monogramIcon = v;
  }

  if ('headingFont' in obj) {
    const v = obj.headingFont;
    if (typeof v !== 'string' || !FONT_VALUES.includes(v as (typeof FONT_VALUES)[number])) {
      return { error: 'headingFont must be one of "serif" | "sans" | "mono".' };
    }
    data.headingFont = v;
  }

  if ('bodyFont' in obj) {
    const v = obj.bodyFont;
    if (typeof v !== 'string' || !FONT_VALUES.includes(v as (typeof FONT_VALUES)[number])) {
      return { error: 'bodyFont must be one of "serif" | "sans" | "mono".' };
    }
    data.bodyFont = v;
  }

  if ('accentColor' in obj) {
    const v = obj.accentColor;
    if (typeof v !== 'string' || !HEX_RE.test(v)) {
      return { error: 'accentColor must be a hex color like "#0f172a".' };
    }
    data.accentColor = v;
  }

  if ('accentColor2' in obj) {
    const v = obj.accentColor2;
    if (typeof v !== 'string' || !HEX_RE.test(v)) {
      return { error: 'accentColor2 must be a hex color like "#f59e0b".' };
    }
    data.accentColor2 = v;
  }

  if ('watermarkEnabled' in obj) {
    const v = obj.watermarkEnabled;
    if (typeof v !== 'boolean') {
      return { error: 'watermarkEnabled must be a boolean.' };
    }
    data.watermarkEnabled = v;
  }

  if ('paywallEnabled' in obj) {
    const v = obj.paywallEnabled;
    if (typeof v !== 'boolean') {
      return { error: 'paywallEnabled must be a boolean.' };
    }
    data.paywallEnabled = v;
  }

  if ('copyProtectEnabled' in obj) {
    const v = obj.copyProtectEnabled;
    if (typeof v !== 'boolean') {
      return { error: 'copyProtectEnabled must be a boolean.' };
    }
    data.copyProtectEnabled = v;
  }

  return { data };
}
