"use client";

// ClinicianAttestation — a one-time gate shown the first time a user tries
// to generate a clinical (CLA/PIS) document. The user must confirm they are
// an appropriately licensed prescriber acting within scope of practice and
// will localise the template + obtain their institution's legal/ethics
// approval before use with any patient.
//
// The acceptance is stored in localStorage so the user isn't nagged on every
// generation, but they can re-attest from the Research tab if needed.

import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Clock,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const STORAGE_KEY = "glyvantix.clinician-attestation.v1";

export function hasAttested(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "accepted";
}

export function clearAttestation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

const ATTESTATION_ITEMS = [
  {
    id: "licensed",
    text: "I am an appropriately licensed and credentialled prescriber, or I am generating this document on behalf of a licensed prescriber who will review it before use.",
  },
  {
    id: "scope",
    text: "I am acting within my scope of practice and within the lawful context of an IRB/REC-approved research protocol, an authorised expanded-access pathway, or clinical care delivered by a licensed prescriber.",
  },
  {
    id: "localise",
    text: "I understand this is a TEMPLATE. I will localise every field, verify all clinical content against current licensed product information and local formulary, and obtain review by my institution's legal, pharmacy, information-governance and ethics functions before use with any patient.",
  },
  {
    id: "no-patient-data",
    text: "I will not enter real patient-identifiable data (patient name, DOB, NHS/MRN number) into this platform. Patient-specific fields are completed by hand on the localised, printed document at the point of use.",
  },
  {
    id: "not-advice",
    text: "I understand GLYvantix Research provides research frameworks and templates, not medical or legal advice. GLYvantix accepts no liability for clinical outcomes arising from use of these templates.",
  },
];

interface ClinicianAttestationProps {
  open: boolean;
  onAccepted: () => void;
  onCancel: () => void;
}

export function ClinicianAttestation({
  open,
  onAccepted,
  onCancel,
}: ClinicianAttestationProps) {
  // The checkbox state is reset on every open via the `key` prop on the
  // rendered Dialog (see end of this component), which forces a fresh mount
  // and avoids the setState-in-effect anti-pattern.
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const allChecked = ATTESTATION_ITEMS.every((i) => checked[i.id]);

  function handleAccept() {
    if (!allChecked) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "accepted");
    }
    toast.success("Attestation recorded", {
      description:
        "You can now generate localised clinical document drafts for review.",
    });
    onAccepted();
  }

  return (
    <Dialog
      key={open ? "attest-open" : "attest-closed"}
      open={open}
      onOpenChange={(o) => !o && onCancel()}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
            <ShieldCheck className="h-6 w-6 text-amber-700 dark:text-amber-400" />
          </div>
          <DialogTitle className="font-serif text-xl">
            Clinician attestation required
          </DialogTitle>
          <DialogDescription className="text-sm">
            Before generating a clinical document from the GLYvantix Research
            framework, please read and confirm each statement below. This is a
            one-time attestation — you won&apos;t be asked again on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <p>
              <strong>Mandatory legal notice.</strong> The GLYvantix Research
              templates are controlled document templates, not approved
              clinical documents. They are supplied for use only within a
              lawful, supervised context and are not medical advice. Localise,
              verify, and obtain institutional approval before use.
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          {ATTESTATION_ITEMS.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <Checkbox
                id={`attest-${item.id}`}
                checked={!!checked[item.id]}
                onCheckedChange={(v) =>
                  setChecked((s) => ({ ...s, [item.id]: !!v }))
                }
                className="mt-0.5"
              />
              <Label
                htmlFor={`attest-${item.id}`}
                className="text-sm font-normal leading-relaxed text-foreground cursor-pointer"
              >
                {item.text}
              </Label>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>
            Recorded locally on this device. Re-attest any time from the
            Research tab.
          </span>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!allChecked}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            I confirm and accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Convenience hook used by the Builder tab to gate clinical generation.
export function useClinicianAttestmentGate() {
  const [showGate, setShowGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  function gateAction(action: () => void) {
    if (hasAttested()) {
      action();
    } else {
      setPendingAction(() => action);
      setShowGate(true);
    }
  }

  function handleAccepted() {
    setShowGate(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }

  function handleCancel() {
    setShowGate(false);
    setPendingAction(null);
    toast.error("Attestation required", {
      description:
        "You must complete the clinician attestation before generating clinical documents.",
    });
  }

  return {
    showGate,
    gateAction,
    handleAccepted,
    handleCancel,
  };
}

// Unused import shim for Lock — kept available for future use.
void Lock;
