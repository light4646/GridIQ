import { EVENT_OPTIONS, getQualifyingRaceComparisonByEvent, getRacePaceByEvent } from "./static-data";
import type { EventOption, QualifyingRaceComparison, RacePaceRow } from "./types";

export type DriverEventResult = RacePaceRow & {
  event: EventOption;
};

export type DriverSummary = {
  driver: string;
  team: string;
  events_counted: number;
  best_rank: number;
  average_rank: number;
  average_pace_seconds: number;
  total_laps_counted: number;
  results: DriverEventResult[];
  qualifyingComparison: DriverQualifyingComparison[];
};

export type DriverQualifyingComparison = QualifyingRaceComparison & {
  event: EventOption;
};

export function getDriverResults(driver: string): DriverEventResult[] {
  const normalized = driver.toUpperCase();

  return EVENT_OPTIONS.flatMap((event) => {
    const row = getRacePaceByEvent(event.id).find((item) => item.driver.toUpperCase() === normalized);
    return row ? [{ ...row, event }] : [];
  });
}

export function getDriverSummary(driver: string): DriverSummary | null {
  const results = getDriverResults(driver);
  if (results.length === 0) return null;

  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const normalized = driver.toUpperCase();
  const qualifyingComparison = EVENT_OPTIONS.flatMap((event) => {
    const row = getQualifyingRaceComparisonByEvent(event.id).find((item) => item.driver.toUpperCase() === normalized);
    return row ? [{ ...row, event }] : [];
  });

  return {
    driver: results[0].driver,
    team: results[0].team,
    events_counted: results.length,
    best_rank: Math.min(...results.map((result) => result.rank)),
    average_rank: Number(average(results.map((result) => result.rank)).toFixed(2)),
    average_pace_seconds: Number(average(results.map((result) => result.average_lap_seconds)).toFixed(3)),
    total_laps_counted: results.reduce((sum, result) => sum + result.laps_counted, 0),
    results,
    qualifyingComparison,
  };
}

export function getAllDriverSummaries(): DriverSummary[] {
  const drivers = new Set<string>();

  for (const event of EVENT_OPTIONS) {
    for (const row of getRacePaceByEvent(event.id)) {
      drivers.add(row.driver);
    }
  }

  return Array.from(drivers)
    .map((driver) => getDriverSummary(driver))
    .filter((summary): summary is DriverSummary => summary !== null)
    .sort((a, b) => a.average_rank - b.average_rank || a.driver.localeCompare(b.driver));
}
