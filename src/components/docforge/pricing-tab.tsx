"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  CREDIT_PACKS,
  buyCredits,
  subscribe,
  type TabId,
} from "./api";
import type { BillingCycle, PlanId, User, UserResponse } from "./types";

interface PricingTabProps {
  user: User | null;
  subscription: UserResponse["subscription"] | null;
  loadingUser: boolean;
  onUserChange: () => void;
}

interface Tier {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  yearly: number;
  features: string[];
  cta: string;
  popular?: boolean;
  highlight?: boolean;
  accent: string;
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try GLYvantix Docs on a single document.",
    monthly: 0,
    yearly: 0,
    features: [
      "1 document included",
      "Free templates only",
      "Basic email support",
      "Download as Markdown",
    ],
    cta: "Current plan",
    accent: "from-neutral-100 to-neutral-50 dark:from-neutral-800/40 dark:to-neutral-900",
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For freelancers and solo writers.",
    monthly: 19,
    yearly: 190,
    features: [
      "30 documents / month",
      "All premium templates",
      "Email support",
      "Download as Markdown",
    ],
    cta: "Upgrade to Starter",
    accent: "from-amber-50 to-background dark:from-amber-500/10 dark:to-background",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Unlimited drafting for power users.",
    monthly: 39,
    yearly: 390,
    features: [
      "Unlimited documents",
      "All premium templates",
      "Priority support",
      "Export to PDF / DOCX",
    ],
    cta: "Upgrade to Pro",
    popular: true,
    accent: "from-emerald-50 to-background dark:from-emerald-500/10 dark:to-background",
  },
  {
    id: "business",
    name: "Business",
    tagline: "For teams that ship together.",
    monthly: 99,
    yearly: 990,
    features: [
      "Everything in Pro",
      "5 team seats",
      "Custom branding",
      "API access",
    ],
    cta: "Upgrade to Business",
    accent: "from-rose-50 to-background dark:from-rose-500/10 dark:to-background",
  },
];

const tierRank: Record<PlanId, number> = { free: 0, starter: 1, pro: 2, business: 3 };

function priceLabel(tier: Tier, cycle: BillingCycle) {
  if (tier.monthly === 0) return "$0";
  return cycle === "monthly" ? `$${tier.monthly}` : `$${tier.yearly}`;
}

export function PricingTab({
  user,
  subscription,
  loadingUser,
  onUserChange,
}: PricingTabProps) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [pendingAction, setPendingAction] = useState<
    | { type: "subscribe"; tier: Tier }
    | { type: "credits"; amount: number; price: number; label: string }
    | null
  >(null);
  const [busy, setBusy] = useState(false);

  const currentPlan: PlanId = user?.plan ?? "free";

  function openSubscribe(tier: Tier) {
    if (tier.id === "free" || tierRank[tier.id] <= tierRank[currentPlan]) return;
    setPendingAction({ type: "subscribe", tier });
  }

  function openCredits(amount: number, price: number, label: string) {
    setPendingAction({ type: "credits", amount, price, label });
  }

  async function confirm() {
    if (!pendingAction) return;
    setBusy(true);
    try {
      if (pendingAction.type === "subscribe") {
        const tier = pendingAction.tier;
        const result = await subscribe(
          tier.id as "starter" | "pro" | "business",
          cycle
        );
        if (result.subscription) {
          toast.success(`Upgraded to ${tier.name} 🎉`, {
            description:
              cycle === "monthly"
                ? `Billed $${tier.monthly}/mo`
                : `Billed $${tier.yearly}/yr`,
          });
        } else {
          toast.success(`You're now on ${tier.name}`);
        }
      } else {
        const { amount, price, label } = pendingAction;
        await buyCredits(amount, price);
        toast.success("Credit pack purchased", {
          description: label,
        });
      }
      setPendingAction(null);
      onUserChange();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Heading + current status */}
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Choose your plan
        </h2>
        <p className="mt-3 text-muted-foreground">
          Subscribe for unlimited drafts, or buy a single document whenever
          inspiration strikes.
        </p>
      </div>

      {/* Current plan / credits summary */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        {loadingUser || !user ? (
          <Skeleton className="h-12 w-72 rounded-xl" />
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Current plan:</span>
            <Badge
              className={cn(
                "gap-1 border-transparent",
                user.plan === "pro" || user.plan === "business"
                  ? "bg-emerald-600 text-white"
                  : user.plan === "starter"
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {user.plan === "pro" || user.plan === "business" ? (
                <Crown className="h-3 w-3" />
              ) : null}
              {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
            </Badge>
            {subscription && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-muted-foreground">
                  {subscription.cycle === "yearly" ? "Yearly" : "Monthly"} ·
                  renews {new Date(subscription.expiresAt).toLocaleDateString()}
                </span>
              </>
            )}
            <Separator orientation="vertical" className="h-4" />
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {user.credits >= 99999 ? "Unlimited" : `${user.credits}`} credits
            </span>
          </div>
        )}
      </div>

      {/* Billing cycle toggle */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <ToggleGroup
          type="single"
          value={cycle}
          onValueChange={(v) => v && setCycle(v as BillingCycle)}
          variant="outline"
          aria-label="Billing cycle"
        >
          <ToggleGroupItem value="monthly" className="px-4">
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="px-4">
            Yearly
          </ToggleGroupItem>
        </ToggleGroup>
        {cycle === "yearly" && (
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
            Save 17% with annual billing
          </Badge>
        )}
      </div>

      {/* Tier cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier, i) => {
          const isCurrent = tier.id === currentPlan;
          const isDowngrade = tierRank[tier.id] <= tierRank[currentPlan];
          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <Card
                className={cn(
                  "relative flex h-full flex-col overflow-hidden",
                  tier.popular &&
                    "border-emerald-500 ring-1 ring-emerald-500 shadow-md"
                )}
              >
                {tier.popular && (
                  <div className="absolute right-0 top-0 bg-emerald-600 px-3 py-1 text-xs font-semibold text-white rounded-bl-lg">
                    Most popular
                  </div>
                )}
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-60",
                    tier.accent
                  )}
                />
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {tier.id === "pro" || tier.id === "business" ? (
                      <Crown className="h-4 w-4 text-emerald-600" />
                    ) : null}
                    {tier.name}
                  </CardTitle>
                  <CardDescription>{tier.tagline}</CardDescription>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-bold tracking-tight">
                      {priceLabel(tier, cycle)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {tier.monthly === 0
                        ? "forever"
                        : cycle === "monthly"
                          ? "/mo"
                          : "/yr"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={
                      isCurrent
                        ? "outline"
                        : tier.popular
                          ? "default"
                          : "outline"
                    }
                    disabled={isCurrent || isDowngrade || busy}
                    onClick={() => openSubscribe(tier)}
                  >
                    {isCurrent
                      ? "Current plan"
                      : isDowngrade
                        ? "Included in your plan"
                        : tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Credit packs */}
      <section className="mt-14">
        <div className="mb-6 text-center">
          <Badge
            variant="outline"
            className="mb-3 gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"
          >
            <Zap className="h-3 w-3" />
            No subscription needed
          </Badge>
          <h3 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Or buy documents individually
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Top up your credit balance and use a credit each time you generate a
            premium document. Credits never expire.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack, i) => (
            <motion.div
              key={pack.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
            >
              <Card className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {pack.amount} credits
                    </CardTitle>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                      <Sparkles className="h-4 w-4" />
                    </span>
                  </div>
                  <CardDescription>{pack.label}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="font-serif text-3xl font-bold tracking-tight">
                    ${pack.price}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ≈ ${(pack.price / pack.amount).toFixed(2)} per document
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() =>
                      openCredits(pack.amount, pack.price, pack.label)
                    }
                  >
                    Buy {pack.amount} credits
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Confirmation dialog */}
      <Dialog
        open={pendingAction !== null}
        onOpenChange={(o) => !busy && !o && setPendingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">
              {pendingAction?.type === "subscribe"
                ? `Confirm your subscription to ${pendingAction.tier.name}`
                : pendingAction?.type === "credits"
                  ? "Confirm your credit pack"
                  : "Confirm purchase"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.type === "subscribe" && (
                <>
                  You'll be billed{" "}
                  <strong className="text-foreground">
                    {cycle === "monthly"
                      ? `$${pendingAction.tier.monthly}/mo`
                      : `$${pendingAction.tier.yearly}/yr`}
                  </strong>{" "}
                  on the {pendingAction.tier.name} plan. Your credits will be
                  refreshed and any existing subscription will be replaced.
                </>
              )}
              {pendingAction?.type === "credits" && (
                <>
                  You'll be charged{" "}
                  <strong className="text-foreground">
                    ${pendingAction.price}
                  </strong>{" "}
                  and receive{" "}
                  <strong className="text-foreground">
                    {pendingAction.amount} credits
                  </strong>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingAction(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button onClick={confirm} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
