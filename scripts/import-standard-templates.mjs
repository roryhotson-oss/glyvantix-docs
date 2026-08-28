import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { PrismaClient } from "@prisma/client";

const archivePath = process.argv[2];
if (!archivePath) {
  console.error("Usage: node scripts/import-standard-templates.mjs /path/to/archive.zip");
  process.exit(1);
}

const db = new PrismaClient();
const tempDir = mkdtempSync(join(tmpdir(), "glyvantix-docs-"));
const fields = JSON.stringify([
  { name: "institutionName", label: "Institution name", type: "text", required: true },
  { name: "department", label: "Department / service line", type: "text", required: false },
  { name: "siteAddress", label: "Site address", type: "text", required: false },
  { name: "email", label: "Professional contact email", type: "email", required: false },
  { name: "effectiveDate", label: "Effective date", type: "text", required: false },
  { name: "reviewDate", label: "Scheduled review date", type: "text", required: false },
]);

function categoryFor(code) {
  const prefix = code.split("-")[0];
  return {
    CLA: "Consent & Legal Authorisation",
    PIS: "Patient Information",
    RXP: "Prescribing, Pharmacy & Dosing",
    RGE: "Research Governance & Ethics",
    SPV: "Safety & Pharmacovigilance",
    QSC: "Quality, Supply Chain & Compliance",
    PEC: "Patient Education & Self-Care",
    CAM: "Clinical Assessment & Monitoring",
    PCO: "Private Clinic Operations & Advertising",
  }[prefix] || "Research Documentation";
}

function extractFiles() {
  execFileSync("unzip", ["-q", "-o", archivePath, "-d", tempDir]);
  const listing = execFileSync("find", [tempDir, "-type", "f"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((file) => /\.(pdf|docx)$/i.test(file));
  return listing;
}

function extractText(file) {
  if (/\.pdf$/i.test(file)) {
    try {
      return execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
    } catch {
      return "Source PDF text could not be extracted automatically; review the original file.";
    }
  }
  return `Source DOCX filename: ${basename(file)}. Review the original DOCX before adoption.`;
}

function codeFrom(file) {
  const match = basename(file).match(/\b([A-Z]{2,4}-\d{3})\b/);
  return match?.[1] || basename(file).replace(/\.(pdf|docx)$/i, "");
}

function titleFrom(file, code) {
  return basename(file)
    .replace(/\.(pdf|docx)$/i, "")
    .replace(/^[^_]+_/, "")
    .replace(/[_]+/g, " ")
    .replace(/—/g, " - ")
    .replace(/\s+/g, " ")
    .trim() || code;
}

const notice =
  "RESEARCH / SAMPLE TEMPLATE — FOR QUALIFIED CLINICIANS, RESEARCHERS AND INSTITUTIONAL RECORD-KEEPING REVIEW. This non-authoritative sample is provided for professional review and local adaptation only. It is not medical advice, a prescription, treatment instruction, regulatory approval, or evidence of ethics approval. Verify all content and obtain the responsible institution's professional, legal, information-governance, pharmacy, and ethics approvals before use.";

try {
  const files = extractFiles();
  let imported = 0;
  for (const file of files) {
    const code = codeFrom(file);
    const title = `${code} - ${titleFrom(file, code)}`;
    const category = categoryFor(code);
    const sourceFilename = basename(file);
    const sourceText = extractText(file).slice(0, 120000);
    const prompt = `${notice}\n\nSource filename: ${sourceFilename}\n\nCreate a professional research/sample record-keeping template based on the source document below. Preserve its structure, tables, checklists, and placeholders, but do not claim legal compliance or approval. Do not add clinical advice or patient-specific instructions. Require local professional review before use.\n\nSOURCE DOCUMENT:\n${sourceText}`;

    await db.template.upsert({
      where: { id: `standard-${code.toLowerCase()}` },
      update: { name: title, description: `Research/sample ${category.toLowerCase()} template for qualified professional review and institutional record-keeping.`, category, prompt, fields, price: 0, premium: false },
      create: { id: `standard-${code.toLowerCase()}`, name: title, description: `Research/sample ${category.toLowerCase()} template for qualified professional review and institutional record-keeping.`, category, icon: "FileText", prompt, fields, price: 0, premium: false, estTime: 20 },
    });
    imported += 1;
  }
  console.log(`Imported ${imported} standard templates from ${basename(archivePath)}.`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  await db.$disconnect();
}
