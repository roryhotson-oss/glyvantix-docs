import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Read the canonical URL + indexability from env so dev/staging/sandbox
// environments tell Google to stay away, while production invites Google
// in with a single canonical URL. This prevents the duplicate-content +
// domain-cannibalisation problem the user flagged.
const canonicalUrl = process.env.SITE_CANONICAL_URL?.replace(/\/$/, "") || "";
const indexable = process.env.SITE_INDEXABLE === "true";

// Compose the description + title to match the current research/collaboration
// product (not the old commercial copy).
const siteTitle = "GLYvantix Docs — Research Framework for Peptide Therapeutics Consent";
const siteDescription =
  "GLYvantix Docs provides a reviewed research-document framework for peptide research governance, consent records, patient information, and professional sample record-keeping. Templates require local institutional review before use.";

export const metadata: Metadata = {
  // When SITE_INDEXABLE is not "true", tell every search engine to drop the
  // current URL from its index and never crawl it. This is the single most
  // important line for protecting the production domain from dev duplicates.
  robots: indexable
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true, nosnippet: true },
  // Canonical URL — Google uses this to deduplicate. If 5 domains all point
  // at this app, only the canonical one keeps the ranking.
  ...(canonicalUrl ? { alternates: { canonical: canonicalUrl + "/" } } : {}),
  title: siteTitle,
  description: siteDescription,
  keywords: [
    "GLYvantix",
    "GLYvantix Docs",
    "GLYvantix Research",
    "peptide therapeutics",
    "consent framework",
    "patient information sheet",
    "informed consent",
    "21 CFR 50",
    "45 CFR 46",
    "UK GDPR",
    "ICH E6(R3)",
    "Montgomery v Lanarkshire",
    "CLA-001",
    "PIS-001",
    "clinical research",
    "Good Clinical Practice",
  ],
  authors: [{ name: "GLYvantix Research" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    siteName: "GLYvantix Docs",
    type: "website",
    ...(canonicalUrl ? { url: canonicalUrl + "/" } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Explicit robots meta tag as a belt-and-braces backstop to the
            HTTP-level `robots` metadata above. If both somehow disagree,
            the stricter one wins, so we keep this in sync with SITE_INDEXABLE. */}
        {indexable ? null : (
          <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        )}
        {/* Canonical link tag — Google's preferred deduplication signal.
            When SITE_CANONICAL_URL is unset (dev/sandbox), we emit no
            canonical so Google doesn't accidentally canonicalise the
            production domain to a dev URL. */}
        {canonicalUrl ? (
          <link rel="canonical" href={canonicalUrl + "/"} />
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
