import type { MetadataRoute } from "next";

import { getAvailableSeasonYears, getHistoryManifest } from "@/lib/history";
import { EVENT_OPTIONS } from "@/lib/static-data";

const BASE_URL = "https://gridiq-live.vercel.app";

function url(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly"): MetadataRoute.Sitemap[number] {
  return { url: `${BASE_URL}${path}`, lastModified: new Date(), changeFrequency, priority };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const years = getAvailableSeasonYears();
  const manifest = getHistoryManifest();

  const driverIds = new Set<string>();
  for (const season of manifest.seasons) {
    if (season.driver_champion?.driver_id) driverIds.add(season.driver_champion.driver_id);
  }

  const staticPages: MetadataRoute.Sitemap = [
    url("/", 1.0, "weekly"),
    url("/seasons", 0.9, "weekly"),
    url("/records", 0.9, "monthly"),
    url("/drivers", 0.9, "monthly"),
    url("/constructors", 0.9, "monthly"),
    url("/champions", 0.9, "monthly"),
    url("/compare", 0.7, "monthly"),
    url("/explore", 0.7, "monthly"),
    url("/events", 0.8, "weekly"),
  ];

  const seasonPages = years.map((year) =>
    url(`/seasons/${year}`, 0.8, "monthly")
  );

  const driverPages = [...driverIds].map((id) =>
    url(`/drivers/${id.replace(/_/g, "-")}`, 0.7, "monthly")
  );

  const eventPages = EVENT_OPTIONS.map((event) =>
    url(`/events/${event.id}`, 0.75, "monthly")
  );

  return [...staticPages, ...seasonPages, ...driverPages, ...eventPages];
}
