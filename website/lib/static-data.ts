import fs from "node:fs";
import path from "node:path";

import monzaPace from "@/public/data/monza_2024_race_race_pace.json";
import monzaSummary from "@/public/data/monza_2024_race_summary.json";
import monzaQualifying from "@/public/data/monza_2024_qualifying_qualifying.json";
import silverstonePace from "@/public/data/silverstone_2024_race_race_pace.json";
import silverstoneSummary from "@/public/data/silverstone_2024_race_summary.json";
import silverstoneQualifying from "@/public/data/silverstone_2024_qualifying_qualifying.json";

import type { EventOption, QualifyingRaceComparison, QualifyingRow, RacePaceRow, RaceSummary } from "./types";

type GeneratedEventManifestItem = {
  year: number;
  round?: number;
  event?: string;
  event_name?: string;
  event_date?: string | null;
  session?: string;
  status?: string;
  output_dir?: string;
  metadata?: {
    year?: number;
    round?: number | null;
    event_name?: string;
    official_event_name?: string;
    location?: string;
    country?: string;
    event_slug?: string;
    session_slug?: string;
    rows_laps?: number;
    rows_clean_laps?: number;
    rows_pace?: number;
    drivers?: string[];
  };
};

type GeneratedEventManifest = {
  events?: GeneratedEventManifestItem[];
};

type GeneratedPaceRow = {
  pace_rank?: number;
  Driver?: string;
  Team?: string;
  DriverNumber?: string | number;
  clean_laps?: number;
  average_lap_seconds?: number;
  median_lap_seconds?: number;
  best_lap_seconds?: number;
  lap_time_std_seconds?: number;
  consistency_std_seconds?: number;
  gap_to_best_avg_seconds?: number;
};

const GENERATED_EVENTS_ROOT = path.join(process.cwd(), "public", "data", "events");
const GENERATED_EVENTS_MANIFEST = path.join(GENERATED_EVENTS_ROOT, "manifest.json");

const LEGACY_EVENT_OPTIONS: EventOption[] = [
  {
    id: "2024-monza-race",
    label: "2024 Italian Grand Prix",
    shortLabel: "Monza 2024",
    year: 2024,
    circuit: "Monza",
    session: "Race",
    slug: "monza_2024_race",
    description: "High-speed Italian Grand Prix race pace ranking from cleaned FastF1 lap data.",
  },
  {
    id: "2024-silverstone-race",
    label: "2024 British Grand Prix",
    shortLabel: "Silverstone 2024",
    year: 2024,
    circuit: "Silverstone",
    session: "Race",
    slug: "silverstone_2024_race",
    description: "British Grand Prix race pace ranking, useful as the second validation dataset.",
  },
];

const LEGACY_PACE_DATA_BY_EVENT: Record<string, RacePaceRow[]> = {
  "2024-monza-race": monzaPace as RacePaceRow[],
  "2024-silverstone-race": silverstonePace as RacePaceRow[],
};

const LEGACY_SUMMARY_BY_EVENT: Record<string, RaceSummary> = {
  "2024-monza-race": monzaSummary as RaceSummary,
  "2024-silverstone-race": silverstoneSummary as RaceSummary,
};

const LEGACY_QUALIFYING_BY_EVENT: Record<string, QualifyingRow[]> = {
  "2024-monza-race": monzaQualifying as QualifyingRow[],
  "2024-silverstone-race": silverstoneQualifying as QualifyingRow[],
};

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function eventIdFromParts(year: number, eventSlug: string, sessionSlug = "race") {
  return `${year}-${eventSlug}-${sessionSlug}`;
}

function eventSlugFromGeneratedItem(item: GeneratedEventManifestItem) {
  const fromMetadata = item.metadata?.event_slug;
  if (fromMetadata) return fromMetadata;

  const outputDir = item.output_dir;
  if (outputDir) {
    const normalizedOutputDir = outputDir.replace(/\\/g, "/");
    const parts = normalizedOutputDir.split("/");
    const eventSlug = parts.at(-2);
    if (eventSlug) return eventSlug;
  }

  return slugify(item.event_name ?? item.event ?? "event");
}

function generatedEventDirectory(item: GeneratedEventManifestItem) {
  const year = item.year;
  const eventSlug = eventSlugFromGeneratedItem(item);
  const sessionSlug = item.metadata?.session_slug ?? item.session ?? "race";
  return path.join(GENERATED_EVENTS_ROOT, String(year), eventSlug, sessionSlug);
}

function generatedEventToOption(item: GeneratedEventManifestItem): EventOption | null {
  const metadata = item.metadata;
  const year = metadata?.year ?? item.year;
  const eventSlug = eventSlugFromGeneratedItem(item);
  const sessionSlug = metadata?.session_slug ?? item.session ?? "race";
  const eventName = metadata?.event_name ?? item.event_name ?? item.event ?? eventSlug;
  const location = metadata?.location ?? eventName.replace(/ Grand Prix$/i, "");

  if (!year || !eventSlug) return null;

  return {
    id: eventIdFromParts(year, eventSlug, sessionSlug),
    label: `${year} ${eventName}`,
    shortLabel: `${location} ${year}`,
    year,
    circuit: location,
    session: sessionSlug === "race" ? "Race" : sessionSlug,
    slug: `${eventSlug}_${year}_${sessionSlug}`,
    description: `${eventName} ${year} race analytics from generated FastF1 lap data.`,
  };
}

function getGeneratedManifest() {
  return readJsonFile<GeneratedEventManifest>(GENERATED_EVENTS_MANIFEST);
}

function getGeneratedEventItems() {
  const manifest = getGeneratedManifest();
  return (manifest?.events ?? []).filter((item) => item.status === "built" || item.status === "skipped_existing");
}

function getGeneratedEventItemById(eventId: string) {
  return getGeneratedEventItems().find((item) => {
    const option = generatedEventToOption(item);
    return option?.id === eventId;
  });
}

function mapGeneratedPaceRow(row: GeneratedPaceRow): RacePaceRow {
  return {
    rank: row.pace_rank ?? 0,
    driver: row.Driver ?? "—",
    team: row.Team ?? "—",
    average_lap_seconds: row.average_lap_seconds ?? 0,
    gap_to_best_avg_seconds: row.gap_to_best_avg_seconds ?? 0,
    median_lap_seconds: row.median_lap_seconds ?? 0,
    best_lap_seconds: row.best_lap_seconds ?? 0,
    consistency_std_seconds: row.consistency_std_seconds ?? row.lap_time_std_seconds ?? 0,
    laps_counted: row.clean_laps ?? 0,
  };
}

function getGeneratedRacePaceByEvent(eventId: string): RacePaceRow[] {
  const item = getGeneratedEventItemById(eventId);
  if (!item) return [];

  const rows = readJsonFile<GeneratedPaceRow[]>(path.join(generatedEventDirectory(item), "pace.json"));
  return (rows ?? []).map(mapGeneratedPaceRow);
}

function getGeneratedRaceSummaryByEvent(eventId: string): RaceSummary | null {
  const item = getGeneratedEventItemById(eventId);
  if (!item) return null;

  const metadata = readJsonFile<GeneratedEventManifestItem["metadata"]>(path.join(generatedEventDirectory(item), "metadata.json"));
  const pace = getGeneratedRacePaceByEvent(eventId);
  const leader = pace[0];

  return {
    event: eventId,
    drivers: metadata?.drivers?.length ?? pace.length,
    valid_laps_counted: metadata?.rows_clean_laps ?? 0,
    leader: leader
      ? {
          driver: leader.driver,
          team: leader.team,
          average_lap_seconds: leader.average_lap_seconds,
        }
      : null,
  } as unknown as RaceSummary;
}

const GENERATED_EVENT_OPTIONS: EventOption[] = getGeneratedEventItems()
  .map(generatedEventToOption)
  .filter((event): event is EventOption => Boolean(event))
  .sort((a, b) => a.year - b.year || a.label.localeCompare(b.label));

export const EVENT_OPTIONS: EventOption[] = GENERATED_EVENT_OPTIONS.length > 0 ? GENERATED_EVENT_OPTIONS : LEGACY_EVENT_OPTIONS;

export function getEventById(eventId: string): EventOption | undefined {
  return EVENT_OPTIONS.find((event) => event.id === eventId);
}

export function getRacePaceByEvent(eventId: string): RacePaceRow[] {
  const generatedPace = getGeneratedRacePaceByEvent(eventId);
  if (generatedPace.length > 0) return generatedPace;
  return LEGACY_PACE_DATA_BY_EVENT[eventId] ?? [];
}

export function getRaceSummaryByEvent(eventId: string): RaceSummary | null {
  return getGeneratedRaceSummaryByEvent(eventId) ?? LEGACY_SUMMARY_BY_EVENT[eventId] ?? null;
}

export function getQualifyingByEvent(eventId: string): QualifyingRow[] {
  return LEGACY_QUALIFYING_BY_EVENT[eventId] ?? [];
}

export function getQualifyingRaceComparisonByEvent(eventId: string): QualifyingRaceComparison[] {
  const raceRows = getRacePaceByEvent(eventId);
  const raceByDriver = new Map(raceRows.map((row) => [row.driver.toUpperCase(), row]));

  return getQualifyingByEvent(eventId)
    .flatMap((qualifyingRow) => {
      const raceRow = raceByDriver.get(qualifyingRow.driver.toUpperCase());
      if (!raceRow) return [];
      return [
        {
          driver: qualifyingRow.driver,
          team: raceRow.team,
          qualifyingRank: qualifyingRow.rank,
          racePaceRank: raceRow.rank,
          rankDelta: raceRow.rank - qualifyingRow.rank,
          qualifyingGapSeconds: qualifyingRow.gap_to_pole_seconds,
          racePaceGapSeconds: raceRow.gap_to_best_avg_seconds,
          qualifyingLapSeconds: qualifyingRow.best_lap_seconds,
          raceAverageLapSeconds: raceRow.average_lap_seconds,
        },
      ];
    })
    .sort((a, b) => Math.abs(b.rankDelta) - Math.abs(a.rankDelta) || a.racePaceRank - b.racePaceRank);
}
