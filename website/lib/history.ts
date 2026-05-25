import fs from "node:fs";
import path from "node:path";

const HISTORY_DIR = path.join(process.cwd(), "public", "data", "history");

export type SeasonSummary = {
  year: number;
  generated_at?: string;
  through_date?: string;
  source?: string;
  races: number;
  race_results: number;
  qualifying_results: number;
  drivers: number;
  constructors: number;
  driver_champion?: DriverStanding | null;
  constructor_champion?: ConstructorStanding | null;
};

export type HistoryManifest = {
  generated_at: string;
  through_date: string;
  start_year: number;
  end_year: number;
  seasons: SeasonSummary[];
  failures: { year: number; error: string }[];
};

export type ScheduleRace = {
  year: number;
  round: number;
  event_id: string;
  event_name: string;
  event_slug: string;
  date?: string;
  time?: string;
  circuit_id?: string;
  circuit_name?: string;
  locality?: string;
  country?: string;
};

export type RaceResult = {
  year: number;
  round: number;
  event_id: string;
  event_name: string;
  driver_id?: string;
  driver_code?: string;
  driver_number?: string;
  driver_name: string;
  constructor_id?: string;
  constructor: string;
  grid_position?: number | null;
  position?: number | null;
  points?: number | null;
  laps?: number | null;
  status?: string;
};

export type QualifyingResult = {
  year: number;
  round: number;
  event_id: string;
  event_name: string;
  driver_id?: string;
  driver_code?: string;
  driver_name: string;
  constructor: string;
  position?: number | null;
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
};

export type DriverStanding = {
  year: number;
  position: number;
  points: number;
  wins: number;
  driver_id?: string;
  driver_code?: string;
  driver_number?: string;
  driver_name: string;
  constructors?: string[];
};

export type ConstructorStanding = {
  year: number;
  position: number;
  points: number;
  wins: number;
  constructor_id?: string;
  constructor: string;
};

function readJson<T>(relativePath: string): T {
  const filePath = path.join(HISTORY_DIR, relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function getHistoryManifest() {
  const manifest = readJson<HistoryManifest>("manifest.json");
  return {
    ...manifest,
    seasons: [...manifest.seasons].sort((a, b) => b.year - a.year),
  };
}

export function getAvailableSeasonYears() {
  return getHistoryManifest().seasons.map((season) => season.year);
}

export function getSeasonSummary(year: number) {
  return readJson<SeasonSummary>(`${year}/season_summary.json`);
}

export function getSeasonSchedule(year: number) {
  return readJson<ScheduleRace[]>(`${year}/schedule.json`);
}

export function getDriverStandings(year: number) {
  return readJson<DriverStanding[]>(`${year}/driver_standings.json`);
}

export function getConstructorStandings(year: number) {
  return readJson<ConstructorStanding[]>(`${year}/constructor_standings.json`);
}

export function getRaceResults(year: number) {
  return readJson<RaceResult[]>(`${year}/race_results.json`);
}

export function getQualifyingResults(year: number) {
  return readJson<QualifyingResult[]>(`${year}/qualifying_results.json`);
}

export function getRaceWinners(year: number) {
  return getRaceResults(year)
    .filter((result) => result.position === 1)
    .sort((a, b) => a.round - b.round);
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function aggregateRecords() {
  const years = getAvailableSeasonYears();
  const driverTotals = new Map<
    string,
    { driver: string; wins: number; podiums: number; points: number; starts: number; poles: number }
  >();
  const constructorTotals = new Map<
    string,
    { constructor: string; wins: number; podiums: number; points: number; starts: number }
  >();

  for (const year of years) {
    const raceResults = getRaceResults(year);
    const qualifyingResults = getQualifyingResults(year);

    for (const result of raceResults) {
      const driver = result.driver_name || result.driver_code || result.driver_id || "Unknown";
      const constructor = result.constructor || result.constructor_id || "Unknown";

      const driverEntry =
        driverTotals.get(driver) ??
        { driver, wins: 0, podiums: 0, points: 0, starts: 0, poles: 0 };

      driverEntry.starts += 1;
      driverEntry.points += result.points ?? 0;
      if (result.position === 1) driverEntry.wins += 1;
      if (result.position !== null && result.position !== undefined && result.position <= 3) {
        driverEntry.podiums += 1;
      }
      driverTotals.set(driver, driverEntry);

      const constructorEntry =
        constructorTotals.get(constructor) ??
        { constructor, wins: 0, podiums: 0, points: 0, starts: 0 };

      constructorEntry.starts += 1;
      constructorEntry.points += result.points ?? 0;
      if (result.position === 1) constructorEntry.wins += 1;
      if (result.position !== null && result.position !== undefined && result.position <= 3) {
        constructorEntry.podiums += 1;
      }
      constructorTotals.set(constructor, constructorEntry);
    }

    for (const result of qualifyingResults) {
      if (result.position !== 1) continue;
      const driver = result.driver_name || result.driver_code || result.driver_id || "Unknown";
      const driverEntry =
        driverTotals.get(driver) ??
        { driver, wins: 0, podiums: 0, points: 0, starts: 0, poles: 0 };
      driverEntry.poles += 1;
      driverTotals.set(driver, driverEntry);
    }
  }

  const drivers = [...driverTotals.values()];
  const constructors = [...constructorTotals.values()];

  return {
    driverWins: [...drivers].sort((a, b) => b.wins - a.wins).slice(0, 20),
    driverPodiums: [...drivers].sort((a, b) => b.podiums - a.podiums).slice(0, 20),
    driverPoints: [...drivers].sort((a, b) => b.points - a.points).slice(0, 20),
    driverPoles: [...drivers].sort((a, b) => b.poles - a.poles).slice(0, 20),
    constructorWins: [...constructors].sort((a, b) => b.wins - a.wins).slice(0, 20),
    constructorPoints: [...constructors].sort((a, b) => b.points - a.points).slice(0, 20),
  };
}
