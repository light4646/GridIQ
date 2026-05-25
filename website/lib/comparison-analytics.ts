import { EVENT_OPTIONS, getRacePaceByEvent } from "@/lib/static-data";
import type { RacePaceRow } from "@/lib/types";

export type DriverComparisonEvent = {
  eventId: string;
  eventLabel: string;
  eventShortLabel: string;
  driverA: RacePaceRow;
  driverB: RacePaceRow;
  medianGapSeconds: number;
  averageGapSeconds: number;
  bestLapGapSeconds: number;
  rankGap: number;
  fasterByMedian: string;
  fasterByAverage: string;
};

export type DriverComparisonSummary = {
  driverA: string;
  driverB: string;
  events: DriverComparisonEvent[];
  driverAWinsMedian: number;
  driverBWinsMedian: number;
  driverAWinsAverage: number;
  driverBWinsAverage: number;
  averageMedianGapSeconds: number;
  averageRacePaceGapSeconds: number;
  driverAAverageRank: number;
  driverBAverageRank: number;
  driverABestLapSeconds: number;
  driverBBestLapSeconds: number;
  driverACleanLaps: number;
  driverBCleanLaps: number;
};

function normalizeDriver(code: string): string {
  return code.trim().toUpperCase();
}

function getDriverRow(rows: RacePaceRow[], code: string): RacePaceRow | undefined {
  const target = normalizeDriver(code);
  return rows.find((row) => row.driver.toUpperCase() === target);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getDriverComparison(driverAInput: string, driverBInput: string): DriverComparisonSummary | null {
  const driverA = normalizeDriver(driverAInput);
  const driverB = normalizeDriver(driverBInput);

  if (!driverA || !driverB || driverA === driverB) {
    return null;
  }

  const events: DriverComparisonEvent[] = [];

  for (const event of EVENT_OPTIONS) {
    const rows = getRacePaceByEvent(event.id);
    const rowA = getDriverRow(rows, driverA);
    const rowB = getDriverRow(rows, driverB);

    if (!rowA || !rowB) {
      continue;
    }

    const medianGapSeconds = Number((rowA.median_lap_seconds - rowB.median_lap_seconds).toFixed(3));
    const averageGapSeconds = Number((rowA.average_lap_seconds - rowB.average_lap_seconds).toFixed(3));
    const bestLapGapSeconds = Number((rowA.best_lap_seconds - rowB.best_lap_seconds).toFixed(3));
    const rankGap = rowA.rank - rowB.rank;

    events.push({
      eventId: event.id,
      eventLabel: event.label,
      eventShortLabel: event.shortLabel,
      driverA: rowA,
      driverB: rowB,
      medianGapSeconds,
      averageGapSeconds,
      bestLapGapSeconds,
      rankGap,
      fasterByMedian: medianGapSeconds <= 0 ? driverA : driverB,
      fasterByAverage: averageGapSeconds <= 0 ? driverA : driverB,
    });
  }

  if (events.length === 0) {
    return null;
  }

  return {
    driverA,
    driverB,
    events,
    driverAWinsMedian: events.filter((event) => event.fasterByMedian === driverA).length,
    driverBWinsMedian: events.filter((event) => event.fasterByMedian === driverB).length,
    driverAWinsAverage: events.filter((event) => event.fasterByAverage === driverA).length,
    driverBWinsAverage: events.filter((event) => event.fasterByAverage === driverB).length,
    averageMedianGapSeconds: Number(average(events.map((event) => event.medianGapSeconds)).toFixed(3)),
    averageRacePaceGapSeconds: Number(average(events.map((event) => event.averageGapSeconds)).toFixed(3)),
    driverAAverageRank: Number(average(events.map((event) => event.driverA.rank)).toFixed(2)),
    driverBAverageRank: Number(average(events.map((event) => event.driverB.rank)).toFixed(2)),
    driverABestLapSeconds: Math.min(...events.map((event) => event.driverA.best_lap_seconds)),
    driverBBestLapSeconds: Math.min(...events.map((event) => event.driverB.best_lap_seconds)),
    driverACleanLaps: events.reduce((sum, event) => sum + event.driverA.laps_counted, 0),
    driverBCleanLaps: events.reduce((sum, event) => sum + event.driverB.laps_counted, 0),
  };
}
