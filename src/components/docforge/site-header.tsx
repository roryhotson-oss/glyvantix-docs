"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Crown, Menu, Settings2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { TabId } from "./api";
import type { User } from "./types";
import {
  headingFontClass,
  useBrandingState,
} from "./branding-context";
import { BrandLogo } from "./brand-logo";

interface SiteHeaderProps {
  user: User | null;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  loadingUser: boolean;
}

const NAV: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "research", label: "Research" },
  { id: "builder", label: "Builder" },
  { id: "templates", label: "Templates" },
  { id: "collaborate", label: "Collaborate" },
  { id: "dashboard", label: "Dashboard" },
  { id: "customize", label: "Customize" },
];

function planBadgeClass(plan: string) {
  switch (plan) {
    case "pro":
      return "text-white";
    case "business":
      return "text-white";
    case "starter":
      return "text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function planLabel(plan: string) {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function planBadgeStyle(plan: string, accent: string, accent2: string) {
  switch (plan) {
    case "pro":
      return { backgroundColor: accent };
    case "business":
      return { backgroundColor: accent2 };
    case "starter":
      return { backgroundColor: accent2 };
    default:
      return {};
  }
}

function CreditsPill({
  user,
  loading,
}: {
  user: User | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="h-7 w-24 rounded-full bg-muted animate-pulse" aria-hidden />
    );
  }
  if (!user) return null;
  const credits = user.credits;
  const isUnlimited = credits >= 99999;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium",
            "bg-background/60 backdrop-blur-sm"
          )}
        >
          <Zap className="h-3.5 w-3.5 text-brand-accent-2" />
          {isUnlimited ? (
            <span>Unlimited credits</span>
          ) : (
            <span>
              {credits} credit{credits === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {isUnlimited
          ? "Your plan includes unlimited document generation."
          : "Use a credit each time you generate a premium document."}
      </TooltipContent>
    </Tooltip>
  );
}

export function SiteHeader({
  user,
  activeTab,
  onTabChange,
  loadingUser,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { branding } = useBrandingState();

  const initials =
    user?.name
      ?.split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() ?? "DU";

  function startSignIn() {
    router.push("/api/auth/signin/google");
  }

  async function handleSignOut() {
    const csrfResponse = await fetch("/api/auth/csrf");
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
    await fetch("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken,
        callbackUrl: window.location.origin,
      }),
    });
    window.location.reload();
  }

  function go(tab: TabId) {
    onTabChange(tab);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Logo + wordmark */}
        <button
          type="button"
          onClick={() => go("home")}
          className="group inline-flex items-center gap-2.5"
          aria-label={`${branding.companyName} home`}
        >
          <motion.span
            whileHover={{ rotate: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <BrandLogo
              logoUrl={branding.logoUrl}
              monogramIcon={branding.monogramIcon}
              companyName={branding.companyName}
              size={36}
            />
          </motion.span>
          <span className="flex flex-col items-start leading-tight">
            <span
              className={cn(
                "text-base font-bold tracking-tight",
                headingFontClass(branding.headingFont)
              )}
            >
              {branding.companyName}
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block">
              {branding.tagline}
            </span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              aria-current={activeTab === item.id ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                activeTab === item.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {item.id === "customize" && (
                <Settings2 className="h-3.5 w-3.5" />
              )}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right: plan badge + credits + avatar (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          {!user && !loadingUser ? (
            <Button variant="outline" size="sm" onClick={startSignIn}>
              Sign in
            </Button>
          ) : null}
          {user && (
            <Badge
              className={cn(
                "gap-1 border-transparent font-medium",
                planBadgeClass(user.plan)
              )}
              style={planBadgeStyle(user.plan, branding.accentColor, branding.accentColor2)}
              variant="secondary"
            >
              {user.plan === "pro" || user.plan === "business" ? (
                <Crown className="h-3 w-3" />
              ) : null}
              {planLabel(user.plan)}
            </Badge>
          )}
          <CreditsPill user={user} loading={loadingUser} />
          {user && (
            <Avatar className="h-9 w-9 border border-border">
              <AvatarFallback className="bg-muted text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          )}
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          ) : null}
        </div>

        {/* Mobile: credits + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <CreditsPill user={user} loading={loadingUser} />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 gap-0 p-0">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle
                  className={cn(
                    "flex items-center gap-2",
                    headingFontClass(branding.headingFont)
                  )}
                >
                  <BrandLogo
                    logoUrl={branding.logoUrl}
                    monogramIcon={branding.monogramIcon}
                    companyName={branding.companyName}
                    size={28}
                  />
                  {branding.companyName}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.id)}
                      aria-current={activeTab === item.id ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        activeTab === item.id
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      {item.id === "customize" && (
                        <Settings2 className="h-3.5 w-3.5" />
                      )}
                      {item.label}
                    </button>
                  </SheetClose>
                ))}
              </nav>
              {user && (
                <div className="mt-auto border-t border-border p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-muted text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "mt-3 gap-1 border-transparent font-medium",
                      planBadgeClass(user.plan)
                    )}
                    style={planBadgeStyle(user.plan, branding.accentColor, branding.accentColor2)}
                    variant="secondary"
                  >
                    {user.plan === "pro" || user.plan === "business" ? (
                      <Crown className="h-3 w-3" />
                    ) : null}
                    {planLabel(user.plan)} plan
                  </Badge>
                  <Button
                    className="mt-3 w-full"
                    variant="outline"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
