"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { deleteDocument, type TabId } from "./api";
import { badgeTintFor } from "./template-icon";
import { DocumentView } from "./document-view";
import type { DocforgeDocument, User, UserResponse } from "./types";

interface DashboardTabProps {
  user: User | null;
  subscription: UserResponse["subscription"] | null;
  documentsCount: number;
  documents: DocforgeDocument[];
  loadingUser: boolean;
  loadingDocuments: boolean;
  onNavigate: (tab: TabId) => void;
  onDocumentsChange: () => void;
}

type SortKey = "recent" | "oldest" | "title";

function sourceBadge(source: string) {
  switch (source) {
    case "subscription":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
          Subscription
        </Badge>
      );
    case "purchase":
      return (
        <Badge className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30">
          One-time
        </Badge>
      );
    case "free":
    default:
      return (
        <Badge variant="outline" className="font-normal">
          Free
        </Badge>
      );
  }
}

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

function planLabel(plan: string) {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function planBadgeClass(plan: string) {
  switch (plan) {
    case "pro":
      return "bg-emerald-600 text-white hover:bg-emerald-600";
    case "business":
      return "bg-rose-600 text-white hover:bg-rose-600";
    case "starter":
      return "bg-amber-500 text-white hover:bg-amber-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function DashboardTab({
  user,
  subscription,
  documentsCount,
  documents,
  loadingUser,
  loadingDocuments,
  onNavigate,
  onDocumentsChange,
}: DashboardTabProps) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [preview, setPreview] = useState<DocforgeDocument | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DocforgeDocument | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const userName = user?.name;
  const initials = useMemo(() => {
    if (!userName) return "DU";
    return userName
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }, [userName]);

  const sorted = useMemo(() => {
    const arr = [...documents];
    arr.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sort === "oldest" ? at - bt : bt - at;
    });
    return arr;
  }, [documents, sort]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return documents.filter((d) => new Date(d.createdAt) >= startOfMonth).length;
  }, [documents]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteDocument(pendingDelete.id);
      toast.success("Document deleted");
      setPendingDelete(null);
      onDocumentsChange();
    } catch (err) {
      toast.error("Failed to delete document", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          Your dashboard
        </h2>
        <p className="mt-2 text-muted-foreground">
          Everything you've forged so far, plus your subscription and credits.
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total documents"
          value={loadingDocuments ? "—" : String(documentsCount)}
          icon={<FileText className="h-4 w-4" />}
          loading={loadingDocuments}
        />
        <StatCard
          label="This month"
          value={loadingDocuments ? "—" : String(thisMonthCount)}
          icon={<Sparkles className="h-4 w-4" />}
          loading={loadingDocuments}
        />
        <StatCard
          label="Credits remaining"
          value={
            loadingUser || !user
              ? "—"
              : user.credits >= 99999
                ? "∞"
                : String(user.credits)
          }
          icon={<Zap className="h-4 w-4" />}
          loading={loadingUser}
        />
        <StatCard
          label="Plan tier"
          value={
            loadingUser || !user ? "—" : planLabel(user.plan)
          }
          icon={<Crown className="h-4 w-4" />}
          loading={loadingUser}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile + subscription column */}
        <div className="order-1 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {loadingUser || !user ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="bg-muted text-sm font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge
                      className={cn(
                        "gap-1 border-transparent",
                        planBadgeClass(user.plan)
                      )}
                    >
                      {user.plan === "pro" || user.plan === "business" ? (
                        <Crown className="h-3 w-3" />
                      ) : null}
                      {planLabel(user.plan)} plan
                    </Badge>
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Zap className="h-3 w-3 text-amber-500" />
                      {user.credits >= 99999 ? "Unlimited" : `${user.credits}`}{" "}
                      credits
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Subscription</CardTitle>
              <CardDescription className="text-xs">
                {subscription
                  ? "Manage your active subscription below."
                  : "You're on the free plan — upgrade any time."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {loadingUser ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : subscription ? (
                <div className="flex flex-col gap-2 text-xs">
                  <Row label="Plan" value={planLabel(subscription.plan)} />
                  <Row
                    label="Billing cycle"
                    value={subscription.cycle === "yearly" ? "Yearly" : "Monthly"}
                  />
                  <Row
                    label="Amount"
                    value={`$${subscription.amount.toFixed(2)} / ${
                      subscription.cycle === "yearly" ? "yr" : "mo"
                    }`}
                  />
                  <Row
                    label="Status"
                    value={
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
                      >
                        {subscription.status}
                      </Badge>
                    }
                  />
                  <Row
                    label="Started"
                    value={new Date(subscription.startedAt).toLocaleDateString()}
                  />
                  <Row
                    label="Renews"
                    value={new Date(subscription.expiresAt).toLocaleDateString()}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-muted-foreground">
                    The free plan includes 1 document and access to free
                    templates only. Upgrade for unlimited drafts.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => onNavigate("pricing")}
                    className="w-fit"
                  >
                    Upgrade
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents column */}
        <div className="order-2 lg:col-span-2">
          <Card className="flex h-full flex-col">
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Documents</CardTitle>
                <CardDescription className="text-xs">
                  {loadingDocuments
                    ? "Loading your documents..."
                    : `${documents.length} document${
                        documents.length === 1 ? "" : "s"
                      } saved`}
                </CardDescription>
              </div>
              <Select
                value={sort}
                onValueChange={(v) => setSort(v as SortKey)}
              >
                <SelectTrigger className="w-36" aria-label="Sort documents">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most recent</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="title">Title (A→Z)</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="flex-1">
              {loadingDocuments ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium">No documents yet</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Pick a template and forge your first document. It'll show up
                    here automatically.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onNavigate("builder")}
                    >
                      Open builder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate("templates")}
                    >
                      Browse templates
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="max-h-[480px] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:theme(colors.border)_transparent]">
                  {sorted.map((doc, i) => (
                    <motion.li
                      key={doc.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.02 * i }}
                    >
                      <div className="group flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-muted/40">
                        <button
                          type="button"
                          onClick={() => setPreview(doc)}
                          className="flex flex-1 items-center gap-3 text-left"
                          aria-label={`Preview ${doc.title}`}
                        >
                          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {doc.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {doc.templateName ?? doc.type} ·{" "}
                              {new Date(doc.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </button>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            className={cn(
                              "border font-normal",
                              badgeTintFor(doc.type)
                            )}
                          >
                            {doc.type}
                          </Badge>
                          {sourceBadge(doc.source)}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label="Download as Markdown"
                            onClick={() =>
                              downloadMarkdown(
                                `${slugify(doc.title) || "glyvantix-document"}.md`,
                                doc.content
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                            aria-label="Delete document"
                            onClick={() => setPendingDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview sheet */}
      <Sheet
        open={preview !== null}
        onOpenChange={(o) => !o && setPreview(null)}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-lg md:max-w-xl"
        >
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle className="font-serif text-base">
              {preview?.title ?? "Document"}
            </SheetTitle>
            {preview && (
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    "border font-normal",
                    badgeTintFor(preview.type)
                  )}
                >
                  {preview.type}
                </Badge>
                {sourceBadge(preview.source)}
                <span>·</span>
                <span>{new Date(preview.createdAt).toLocaleString()}</span>
              </SheetDescription>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.border)_transparent]">
            {preview && (
              <DocumentView
                content={preview.content}
                title={preview.title}
                readerEmail={user?.email}
                isSubscribed={!!user && user.plan !== "free"}
                onUpgrade={() => {
                  setPreview(null);
                  onNavigate("research");
                }}
                category={preview.type}
              />
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() =>
                preview &&
                downloadMarkdown(
                  `${slugify(preview.title) || "glyvantix-document"}.md`,
                  preview.content
                )
              }
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Download
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPreview(null)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !deleting && !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Delete this document?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  <strong className="text-foreground">
                    {pendingDelete.title}
                  </strong>{" "}
                  will be permanently removed. This action can't be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleDelete}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-muted text-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        </span>
        <div className="min-w-0">
          <div className="text-xl font-bold tracking-tight">
            {loading ? "—" : value}
          </div>
          <div className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
