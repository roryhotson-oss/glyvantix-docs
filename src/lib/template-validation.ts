export interface ValidatableField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

export type FieldKind = "email" | "number" | "url" | "date" | "tel" | "text";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const URL_PATTERN = /^https?:\/\/[^\s]+\.[^\s]+$/i;
const DATE_PATTERN = /^(?:\d{1,4}[./-]){1,2}\d{1,4}$/;
const PHONE_PATTERN = /^[+\d(][\d\s().-]{6,}$/;
const NUMBER_PATTERN = /^\d+(?:[.,]\d+)?(?:\s?(?:%|[A-Za-z]{2,5}))?$/;
const SPAM_PATTERN = /(.)\1{7,}|(?:https?:\/\/|www\.)[^\s]+/i;

const NUMBER_HINT = /(?:amount|budget|count|credit|days?|duration|fee|hours?|number|percent|price|qty|quantity|rate|revenue|term|total|weeks?|years?)/i;
const URL_HINT = /(?:url|website|web address|domain)/i;
const DATE_HINT = /(?:date|month|year|deadline|effective|review)/i;
const TEL_HINT = /(?:phone|telephone|mobile|tel|fax)/i;

export function fieldKind(field: ValidatableField): FieldKind {
  const descriptor = `${field.name} ${field.label}`;
  if (field.type === "email" || /email|e-mail/i.test(descriptor)) return "email";
  if (field.type === "number" || (NUMBER_HINT.test(descriptor) && !/invoice|reference|registration|account|mrn|nhs|study|\bid\b/i.test(descriptor))) return "number";
  if (field.type === "url" || URL_HINT.test(descriptor)) return "url";
  if (field.type === "date" || DATE_HINT.test(descriptor)) return "date";
  if (field.type === "tel" || TEL_HINT.test(descriptor)) return "tel";
  return "text";
}

function cleanValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateFieldValue(field: ValidatableField, value: unknown): string | null {
  if (value !== undefined && value !== null && typeof value !== "string") {
    return `${field.label} must be text entered in the field.`;
  }
  const cleaned = cleanValue(value);
  if (!cleaned) return field.required ? `${field.label} is required.` : null;
  if (cleaned.length > (field.type === "textarea" ? 4000 : 240)) {
    return `${field.label} is too long.`;
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(cleaned) || (fieldKind(field) !== "url" && SPAM_PATTERN.test(cleaned))) {
    return `${field.label} contains invalid or spam-like content.`;
  }

  switch (fieldKind(field)) {
    case "email":
      return EMAIL_PATTERN.test(cleaned) ? null : `${field.label} must be a valid email address.`;
    case "number":
      return NUMBER_PATTERN.test(cleaned.replace(/[$£€]/g, ""))
        ? null
        : `${field.label} must contain a number.`;
    case "url":
      return URL_PATTERN.test(cleaned) ? null : `${field.label} must be a valid http(s) URL.`;
    case "date":
      return DATE_PATTERN.test(cleaned) || /^[A-Za-z]+\s+\d{4}$/.test(cleaned)
        ? null
        : `${field.label} must be a valid date or month.`;
    case "tel":
      return PHONE_PATTERN.test(cleaned) ? null : `${field.label} must be a valid telephone number.`;
    default:
      if (/name|company|business|institution|client|party|provider|applicant/i.test(`${field.name} ${field.label}`) && /^\d+$/.test(cleaned)) {
        return `${field.label} must be a name, not only numbers.`;
      }
      return null;
  }
}

export function validateTemplateFields(
  fields: ValidatableField[],
  values: Record<string, unknown>
): Record<string, string> {
  return Object.fromEntries(
    fields
      .map((field) => [field.name, validateFieldValue(field, values[field.name])] as const)
      .filter(([, error]) => error)
  );
}

export function validateCustomPrompt(value: unknown, maxLength = 8000): string | null {
  const prompt = cleanValue(value);
  if (prompt.length < 10) return "Please describe the document in at least 10 characters.";
  if (prompt.length > maxLength) return `Prompt is too long (max ${maxLength} characters).`;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(prompt) || /(.)\1{12,}/.test(prompt)) {
    return "Prompt contains invalid or spam-like content.";
  }
  return null;
}