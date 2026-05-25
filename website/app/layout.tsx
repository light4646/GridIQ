import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteName = "GridIQ";
const siteDescription =
  "FastF1-powered Formula 1 analytics for race pace, stints, tyre strategy, pit windows, qualifying comparisons, and driver performance.";
const siteUrl = "http://127.0.0.1:3010";

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
      <body>{children}</body>
    </html>
  );
}
