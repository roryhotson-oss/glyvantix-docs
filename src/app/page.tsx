"use client";

import { useCallback, useEffect, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

import { BrandingProvider } from "@/components/docforge/branding-context";
import { SiteHeader } from "@/components/docforge/site-header";
import { SiteFooter } from "@/components/docforge/site-footer";
import { HomeTab } from "@/components/docforge/home-tab";
import { ResearchTab } from "@/components/docforge/research-tab";
import { BuilderTab } from "@/components/docforge/builder-tab";
import { TemplatesTab } from "@/components/docforge/templates-tab";
import { CollaborateTab } from "@/components/docforge/collaborate-tab";
import { DashboardTab } from "@/components/docforge/dashboard-tab";
import { CustomizeTab } from "@/components/docforge/customize-tab";

import {
  fetchDocuments,
  fetchTemplates,
  fetchUser,
  type TabId,
} from "@/components/docforge/api";
import type {
  DocforgeDocument,
  Template,
  User,
  UserResponse,
} from "@/components/docforge/types";

export default function Home() {
  // Lifted state shared across tabs.
  const [activeTab, setActiveTab] = useState<TabId>("home");

  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] =
    useState<UserResponse["subscription"] | null>(null);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [loadingUser, setLoadingUser] = useState(true);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const [documents, setDocuments] = useState<DocforgeDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  const [selectedTemplate, setSelectedTemplate] =
    useState<Template | null>(null);

  const refreshUser = useCallback(async () => {
    setLoadingUser(true);
    try {
      const data = await fetchUser();
      setUser(data.user);
      setSubscription(data.subscription);
      setDocumentsCount(data.documentsCount);
    } catch (err) {
      console.error("Failed to load user", err);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const refreshTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates", err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  // Initial data load.
  useEffect(() => {
    refreshUser();
    refreshTemplates();
    refreshDocuments();
  }, [refreshDocuments, refreshTemplates, refreshUser]);

  function navigate(tab: TabId) {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSelectTemplate(t: Template | null) {
    setSelectedTemplate(t);
  }

  // When the user clicks "Use template" from the Templates tab we preselect the
  // template and jump to the builder.
  function useTemplateAndNavigate(t: Template) {
    setSelectedTemplate(t);
    navigate("builder");
  }

  return (
    <BrandingProvider>
      <TooltipProvider delayDuration={200}>
        <div className="flex min-h-screen flex-col bg-background">
          <SiteHeader
            user={user}
            activeTab={activeTab}
            onTabChange={navigate}
            loadingUser={loadingUser}
          />

          <main className="flex-1">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as TabId)}
              className="w-full"
            >
              {/* Desktop/mobile tab strip — visible only so screen readers and the
                  active tab indicator work. The SiteHeader renders its own nav. */}
              <TabsList className="sr-only">
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="research">Research</TabsTrigger>
                <TabsTrigger value="builder">Builder</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="collaborate">Collaborate</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="customize">Customize</TabsTrigger>
              </TabsList>

              <TabsContent value="home" className="outline-none">
                <HomeTab
                  onNavigate={navigate}
                  templatesCount={templates.length}
                />
              </TabsContent>

              <TabsContent value="research" className="outline-none">
                <ResearchTab onNavigate={navigate} />
              </TabsContent>

              <TabsContent value="builder" className="outline-none">
                <BuilderTab
                  templates={templates}
                  loadingTemplates={loadingTemplates}
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={handleSelectTemplate}
                  user={user}
                  onUserChange={refreshUser}
                  onDocumentGenerated={refreshDocuments}
                  onNavigate={navigate}
                />
              </TabsContent>

              <TabsContent value="templates" className="outline-none">
                <TemplatesTab
                  templates={templates}
                  loadingTemplates={loadingTemplates}
                  onSelectTemplate={useTemplateAndNavigate}
                  onNavigate={navigate}
                />
              </TabsContent>

              <TabsContent value="collaborate" className="outline-none">
                <CollaborateTab />
              </TabsContent>

              <TabsContent value="dashboard" className="outline-none">
                <DashboardTab
                  user={user}
                  subscription={subscription}
                  documentsCount={documentsCount}
                  documents={documents}
                  loadingUser={loadingUser}
                  loadingDocuments={loadingDocuments}
                  onNavigate={navigate}
                  onDocumentsChange={refreshDocuments}
                />
              </TabsContent>

              <TabsContent value="customize" className="outline-none">
                <CustomizeTab />
              </TabsContent>
            </Tabs>
          </main>

          <SiteFooter />
        </div>

        {/* Sonner toast container for the success/error toasts used across tabs. */}
        <SonnerToaster position="bottom-right" richColors closeButton />
      </TooltipProvider>
    </BrandingProvider>
  );
}
