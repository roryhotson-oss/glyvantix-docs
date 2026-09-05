"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Search, Sparkles } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { type TabId } from "./api";
import { TemplateIcon, iconTintFor } from "./template-icon";
import type { Template } from "./types";
import { buildSupplyEnquiryUrl } from "@/lib/supply-enquiry";

interface TemplatesTabProps {
  templates: Template[];
  loadingTemplates: boolean;
  onSelectTemplate: (t: Template) => void;
  onNavigate: (tab: TabId) => void;
}

const CATEGORIES = ["All", "Business", "Legal", "Marketing", "Personal", "HR"];

export function TemplatesTab({
  templates,
  loadingTemplates,
  onSelectTemplate,
  onNavigate,
}: TemplatesTabProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [purchaseTarget, setPurchaseTarget] = useState<Template | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesCat = category === "All" || t.category === category;
      const matchesQuery =
        q.length === 0 ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [templates, search, category]);

  async function handleBuy(t: Template) {
    window.location.assign(buildSupplyEnquiryUrl(t.name, t.price));
  }

  function handleUse(t: Template) {
    onSelectTemplate(t);
    onNavigate("builder");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 max-w-2xl">
        <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Template library
        </h2>
        <p className="mt-2 text-muted-foreground">
          {templates.length} curated templates across 5 categories. Use them
          with a subscription or buy a single document on demand.
        </p>
      </div>

      {/* Search + filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
            aria-label="Search templates"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by category">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loadingTemplates ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">No templates found</p>
            <p className="text-xs text-muted-foreground">
              Try a different search or category filter.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="mt-2"
            >
              Reset filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.03 * i }}
            >
              <Card className="group flex h-full flex-col transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl",
                        iconTintFor(t.category)
                      )}
                    >
                      <TemplateIcon name={t.icon} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="font-normal">
                        {t.category}
                      </Badge>
                      {t.premium ? (
                        <Badge className="bg-amber-500 text-white">
                          Premium
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        >
                          Free
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="mt-3 text-base">{t.name}</CardTitle>
                  <CardDescription className="line-clamp-2 leading-relaxed">
                    {t.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>~{t.estTime}s · {t.fields.length} fields</span>
                    {t.premium ? (
                      <span className="font-semibold text-foreground">
                        ${t.price.toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600">
                        Free
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center gap-2 pt-0">
                  <Button
                    size="sm"
                    onClick={() => handleUse(t)}
                    className="group/btn flex-1"
                  >
                    Use template
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                  </Button>
                  {t.premium && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPurchaseTarget(t)}
                    >
                      <Lock className="mr-1 h-3.5 w-3.5" />
                      Buy
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Buy dialog */}
      <Dialog
        open={purchaseTarget !== null}
        onOpenChange={(o) => !o && setPurchaseTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Buy this template
            </DialogTitle>
            <DialogDescription>
              {purchaseTarget && (
                <>
                  This opens a GLYvantix supply enquiry for{" "}
                  <strong className="text-foreground">
                    ${purchaseTarget.price.toFixed(2)}
                  </strong>{" "}
                  with bank-transfer payment instructions confirmed directly.
                  You will not be charged in this window.
                  {" "}
                  <strong className="text-foreground">
                    {purchaseTarget.name}
                  </strong>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPurchaseTarget(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => purchaseTarget && handleBuy(purchaseTarget)}
              disabled={!purchaseTarget}
            >
              {purchaseTarget ? "Open supply enquiry" : "Open enquiry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
