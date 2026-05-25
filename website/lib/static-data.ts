import monzaPace from "@/public/data/monza_2024_race_race_pace.json";
import monzaSummary from "@/public/data/monza_2024_race_summary.json";
import monzaQualifying from "@/public/data/monza_2024_qualifying_qualifying.json";
import silverstonePace from "@/public/data/silverstone_2024_race_race_pace.json";
import silverstoneSummary from "@/public/data/silverstone_2024_race_summary.json";
import silverstoneQualifying from "@/public/data/silverstone_2024_qualifying_qualifying.json";

import type { EventOption, QualifyingRaceComparison, QualifyingRow, RacePaceRow, RaceSummary } from "./types";

export const EVENT_OPTIONS: EventOption[] = [
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

const PACE_DATA_BY_EVENT: Record<string, RacePaceRow[]> = {
  "2024-monza-race": monzaPace as RacePaceRow[],
  "2024-silverstone-race": silverstonePace as RacePaceRow[],
};

const SUMMARY_BY_EVENT: Record<string, RaceSummary> = {
  "2024-monza-race": monzaSummary as RaceSummary,
  "2024-silverstone-race": silverstoneSummary as RaceSummary,
};

const QUALIFYING_BY_EVENT: Record<string, QualifyingRow[]> = {
  "2024-monza-race": monzaQualifying as QualifyingRow[],
  "2024-silverstone-race": silverstoneQualifying as QualifyingRow[],
};

export function getEventById(eventId: string): EventOption | undefined {
  return EVENT_OPTIONS.find((event) => event.id === eventId);
}

export function getRacePaceByEvent(eventId: string): RacePaceRow[] {
  return PACE_DATA_BY_EVENT[eventId] ?? [];
}

export function getRaceSummaryByEvent(eventId: string): RaceSummary | null {
  return SUMMARY_BY_EVENT[eventId] ?? null;
}

export function getQualifyingByEvent(eventId: string): QualifyingRow[] {
  return QUALIFYING_BY_EVENT[eventId] ?? [];
}

export function getQualifyingRaceComparisonByEvent(eventId: string): QualifyingRaceComparison[] {
  const raceRows = getRacePaceByEvent(eventId);
  const raceByDriver = new Map(raceRows.map((row) => [row.driver.toUpperCase(), row]));

  return getQualifyingByEvent(eventId)
    .flatMap((qualifyingRow) => {
      const raceRow = raceByDriver.get(qualifyingRow.driver.toUpperCase());
      if (!raceRow) return [];
      return [{
        driver: qualifyingRow.driver,
        team: raceRow.team,
        qualifyingRank: qualifyingRow.rank,
        racePaceRank: raceRow.rank,
        rankDelta: raceRow.rank - qualifyingRow.rank,
        qualifyingGapSeconds: qualifyingRow.gap_to_pole_seconds,
        racePaceGapSeconds: raceRow.gap_to_best_avg_seconds,
        qualifyingLapSeconds: qualifyingRow.best_lap_seconds,
        raceAverageLapSeconds: raceRow.average_lap_seconds,
      }];
    })
    .sort((a, b) => Math.abs(b.rankDelta) - Math.abs(a.rankDelta) || a.racePaceRank - b.racePaceRank);
}
