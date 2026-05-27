import Link from "next/link";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteName = "GridIQ";
const siteDescription =
  "Formula 1 statistics and race intelligence platform. Browse every F1 season from 1950 to 2026, world champions, driver records, constructor standings, race winners, lap traces, and deep race analytics.";
const siteUrl = "https://gridiq-live.vercel.app";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "GridIQ",
      description: siteDescription,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/drivers?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "GridIQ",
      url: siteUrl,
      description: "Independent Formula 1 statistics, race analytics, and historical records platform.",
      foundingDate: "2024",
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: `${siteName} | F1 Race Intelligence`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Formula 1 statistics",
    "F1 stats",
    "F1 season history",
    "Formula 1 records",
    "F1 world champions",
    "F1 driver standings",
    "F1 constructor standings",
    "Formula 1 race results",
    "F1 analytics",
    "FastF1 race analytics",
    "race pace analysis",
    "F1 lap times",
    "tyre strategy F1",
    "qualifying vs race pace",
    "F1 historical data",
    "Formula 1 1950 to 2026",
  ],
  authors: [{ name: "Nour Zaki" }],
  creator: "Nour Zaki",
  publisher: siteName,
  category: "sports analytics",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: `${siteName} | F1 Race Intelligence`,
    description: siteDescription,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | F1 Race Intelligence`,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  other: {
    "impact-site-verification": "5327bbc7-6290-40fc-af13-d46227d051f5",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#08090d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1074761349548277"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <header className="siteNav">
          <Link href="/" className="siteBrand" aria-label="GridIQ home">
            GridIQ
          </Link>
          <nav className="siteNavLinks" aria-label="Main navigation">
            <Link href="/seasons">Seasons</Link>
            <Link href="/champions">Champions</Link>
            <Link href="/records">Records</Link>
            <Link href="/drivers">Drivers</Link>
            <Link href="/constructors">Constructors</Link>
            <Link href="/compare">Compare</Link>
            <Link href="/events">Race Analytics</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
