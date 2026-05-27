import Link from "next/link";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteName = "GridIQ";
const siteDescription =
  "Formula 1 stats and race intelligence platform with historical seasons, records, standings, race winners, FastF1 event analytics, lap traces, tyre strategy, and driver comparisons.";
const siteUrl = "https://gridiq-live.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: `${siteName} | F1 Race Intelligence`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Formula 1 analytics",
    "F1 analytics",
    "F1 stats",
    "Formula 1 records",
    "F1 seasons",
    "F1 standings",
    "FastF1",
    "race pace",
    "F1 telemetry",
    "driver comparison",
    "tyre strategy",
    "pit stop strategy",
    "qualifying vs race pace",
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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1074761349548277"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <header className="siteNav">
          <Link href="/" className="siteBrand" aria-label="GridIQ home">
            GridIQ
          </Link>
          <nav className="siteNavLinks" aria-label="Main navigation">
            <Link href="/seasons">Seasons</Link>
            <Link href="/records">Records</Link>
            <Link href="/drivers">Drivers</Link>
            <Link href="/constructors">Constructors</Link>
            <Link href="/compare">Compare</Link>
            <Link href="/explore">Explorer</Link>
            <Link href="/events">Race Analytics</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
