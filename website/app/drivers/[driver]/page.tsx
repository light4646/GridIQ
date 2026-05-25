import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatNumber,
  getAvailableSeasonYears,
  getDriverStandings,
  getQualifyingResults,
  getRaceResults,
} from "@/lib/history";

type Props = {
  params: Promise<{
    driver: string;
  }>;
};

type DriverCareerSummary = {
  driverId: string;
  driverName: string;
  driverCode?: string;
  seasons: Set<number>;
  constructors: Set<string>;
  starts: number;
  wins: number;
  podiums: number;
  points: number;
  poles: number;
  bestChampionshipFinish: number | null;
  seasonRows: Map<
    number,
    {
      year: number;
      wins: number;
      podiums: number;
      poles: number;
      points: number;
      starts: number;
      championshipPosition: number | null;
      constructors: Set<string>;
    }
  >;
  winRows: {
    year: number;
    round: number;
    eventName: string;
    constructorName: string;
  }[];
};


function slugifyDriverName(driverName?: string) {
  return (
    driverName
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown"
  );
}

function getDriverKey(_driverId?: string, driverName?: string) {
  return slugifyDriverName(driverName);
}

function getConstructorName(row: { constructor?: unknown; constructor_id?: unknown }) {
  if (
    Object.prototype.hasOwnProperty.call(row, "constructor") &&
    typeof row.constructor === "string" &&
    row.constructor.length > 0
  ) {
    return row.constructor;
  }

  if (typeof row.constructor_id === "string" && row.constructor_id.length > 0) {
    return row.constructor_id;
  }

  return "—";
}

function getOrCreateSeasonRow(driver: DriverCareerSummary, year: number) {
  const existing = driver.seasonRows.get(year);
  if (existing) return existing;

  const row = {
    year,
    wins: 0,
    podiums: 0,
    poles: 0,
    points: 0,
    starts: 0,
    championshipPosition: null as number | null,
    constructors: new Set<string>(),
  };
  driver.seasonRows.set(year, row);
  return row;
}

function createDriverSummary(driverId: string, driverName: string, driverCode?: string): DriverCareerSummary {
  return {
    driverId,
    driverName,
    driverCode,
    seasons: new Set<number>(),
    constructors: new Set<string>(),
    starts: 0,
    wins: 0,
    podiums: 0,
    points: 0,
    poles: 0,
    bestChampionshipFinish: null,
    seasonRows: new Map(),
    winRows: [],
  };
}

function getHistoricalDriverSummaries() {
  const years = getAvailableSeasonYears();
  const drivers = new Map<string, DriverCareerSummary>();

  for (const year of years) {
    const raceResults = getRaceResults(year);
    const qualifyingResults = getQualifyingResults(year);
    const standings = getDriverStandings(year);

    for (const result of raceResults) {
      const key = getDriverKey(result.driver_id, result.driver_name);
      const entry =
        drivers.get(key) ??
        createDriverSummary(
          key,
          result.driver_name || result.driver_code || result.driver_id || "Unknown",
          result.driver_code,
        );

      const constructorName = getConstructorName(result);
      const seasonRow = getOrCreateSeasonRow(entry, year);

      entry.seasons.add(year);
      entry.starts += 1;
      entry.points += result.points ?? 0;
      seasonRow.starts += 1;
      seasonRow.points += result.points ?? 0;

      if (result.driver_code && !entry.driverCode) {
        entry.driverCode = result.driver_code;
      }

      if (constructorName !== "—") {
        entry.constructors.add(constructorName);
        seasonRow.constructors.add(constructorName);
      }

      if (result.position === 1) {
        entry.wins += 1;
        seasonRow.wins += 1;
        entry.winRows.push({
          year,
          round: result.round,
          eventName: result.event_name,
          constructorName,
        });
      }

      if (result.position !== null && result.position !== undefined && result.position <= 3) {
        entry.podiums += 1;
        seasonRow.podiums += 1;
      }

      drivers.set(key, entry);
    }

    for (const result of qualifyingResults) {
      if (result.position !== 1) continue;

      const key = getDriverKey(result.driver_id, result.driver_name);
      const entry =
        drivers.get(key) ??
        createDriverSummary(
          key,
          result.driver_name || result.driver_code || result.driver_id || "Unknown",
          result.driver_code,
        );

      const constructorName = getConstructorName(result);
      const seasonRow = getOrCreateSeasonRow(entry, year);

      entry.seasons.add(year);
      entry.poles += 1;
      seasonRow.poles += 1;

      if (constructorName !== "—") {
        entry.constructors.add(constructorName);
        seasonRow.constructors.add(constructorName);
      }

      drivers.set(key, entry);
    }

    for (const standing of standings) {
      const key = getDriverKey(standing.driver_id, standing.driver_name);
      const entry =
        drivers.get(key) ??
        createDriverSummary(
          key,
          standing.driver_name || standing.driver_code || standing.driver_id || "Unknown",
          standing.driver_code,
        );

      const seasonRow = getOrCreateSeasonRow(entry, year);
      entry.seasons.add(year);

      if (standing.driver_code && !entry.driverCode) {
        entry.driverCode = standing.driver_code;
      }

      for (const constructorName of standing.constructors ?? []) {
        if (typeof constructorName === "string" && constructorName.length > 0) {
          entry.constructors.add(constructorName);
          seasonRow.constructors.add(constructorName);
        }
      }

      if (standing.position) {
        seasonRow.championshipPosition = standing.position;

        if (entry.bestChampionshipFinish === null || standing.position < entry.bestChampionshipFinish) {
          entry.bestChampionshipFinish = standing.position;
        }
      }

      drivers.set(key, entry);
    }
  }

  return [...drivers.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    if (b.points !== a.points) return b.points - a.points;
    return a.driverName.localeCompare(b.driverName);
  });
}

function findDriver(driverParam: string) {
  const normalizedParam = driverParam.toLowerCase();
  return getHistoricalDriverSummaries().find(
    (driver) =>
      driver.driverId === normalizedParam ||
      driver.driverCode?.toLowerCase() === normalizedParam ||
      slugifyDriverName(driver.driverName) === normalizedParam,
  );
}

export function generateStaticParams() {
  return getHistoricalDriverSummaries().flatMap((driver) => {
    const params = [{ driver: driver.driverId }];
    if (driver.driverCode) {
      params.push({ driver: driver.driverCode.toLowerCase() });
    }
    return params;
  });
}

export async function generateMetadata({ params }: Props) {
  const { driver } = await params;
  const summary = findDriver(driver);
  if (!summary) return { title: "Driver not found · GridIQ" };

  return {
    title: `${summary.driverName} driver profile · GridIQ`,
    description: `${summary.driverName} Formula 1 career stats from 2000 to 2026.`,
  };
}

export default async function DriverDetailPage({ params }: Props) {
  const { driver } = await params;
  const summary = findDriver(driver);
  if (!summary) notFound();

  const seasons = [...summary.seasonRows.values()].sort((a, b) => b.year - a.year);
  const wins = [...summary.winRows].sort((a, b) => b.year - a.year || b.round - a.round);
  const activeYears = [...summary.seasons].sort((a, b) => a - b);
  const firstSeason = activeYears[0];
  const lastSeason = activeYears[activeYears.length - 1];
  const compareOpponent = summary.driverId === "lewis-hamilton" ? "max-verstappen" : "lewis-hamilton";

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ historical driver profile</div>
            <h1>{summary.driverName}</h1>
            <p>
              {summary.driverCode ? `${summary.driverCode} · ` : ""}
              {firstSeason}–{lastSeason} · {[...summary.constructors].join(" / ") || "No constructor data"}
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/drivers">All drivers</Link>
            <Link className="ghostLink" href={`/compare?driverA=${summary.driverId}&driverB=${compareOpponent}`}>Compare</Link>
            <Link className="ghostLink" href="/records">Records</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card"><div className="label">Wins</div><div className="value">{summary.wins}</div></div>
          <div className="card"><div className="label">Podiums</div><div className="value">{summary.podiums}</div></div>
          <div className="card"><div className="label">Poles</div><div className="value">{summary.poles}</div></div>
          <div className="card"><div className="label">Points</div><div className="value">{formatNumber(summary.points)}</div></div>
        </section>

        <section className="cards">
          <div className="card"><div className="label">Starts</div><div className="value">{formatNumber(summary.starts)}</div></div>
          <div className="card"><div className="label">Seasons</div><div className="value">{summary.seasons.size}</div></div>
          <div className="card"><div className="label">Best championship finish</div><div className="value valueSmall">{summary.bestChampionshipFinish ? `P${summary.bestChampionshipFinish}` : "—"}</div></div>
          <div className="card"><div className="label">Constructors</div><div className="value">{summary.constructors.size}</div></div>
        </section>

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Season-by-season</h2>
                <p>Career production by season from the historical database.</p>
              </div>
            </div>
            <table>
              <thead><tr><th>Year</th><th>Teams</th><th>Wins</th><th>Podiums</th><th>Poles</th><th>Points</th><th>Starts</th><th>Standings</th></tr></thead>
              <tbody>
                {seasons.map((season) => (
                  <tr key={`${summary.driverId}-${season.year}`}>
                    <td><Link className="tableLink" href={`/seasons/${season.year}`}>{season.year}</Link></td>
                    <td className="team">{[...season.constructors].join(" / ") || "—"}</td>
                    <td>{season.wins}</td>
                    <td>{season.podiums}</td>
                    <td>{season.poles}</td>
                    <td>{formatNumber(season.points)}</td>
                    <td>{season.starts}</td>
                    <td>{season.championshipPosition ? `P${season.championshipPosition}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Career context</h2>
                <p>Quick profile summary.</p>
              </div>
            </div>
            <table>
              <tbody>
                <tr><td>Driver code</td><td>{summary.driverCode ?? "—"}</td></tr>
                <tr><td>Active seasons</td><td>{firstSeason}–{lastSeason}</td></tr>
                <tr><td>Teams</td><td className="team">{[...summary.constructors].join(" / ") || "—"}</td></tr>
                <tr><td>Best championship finish</td><td>{summary.bestChampionshipFinish ? `P${summary.bestChampionshipFinish}` : "—"}</td></tr>
                <tr><td>Total starts</td><td>{formatNumber(summary.starts)}</td></tr>
                <tr><td>Total points</td><td>{formatNumber(summary.points)}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Race wins</h2>
              <p>{wins.length > 0 ? "Every loaded race win for this driver." : "No race wins in the loaded 2000–2026 database."}</p>
            </div>
          </div>
          {wins.length > 0 ? (
            <table>
              <thead><tr><th>Year</th><th>Round</th><th>Grand Prix</th><th>Constructor</th></tr></thead>
              <tbody>
                {wins.map((win) => (
                  <tr key={`${summary.driverId}-${win.year}-${win.round}-${win.eventName}`}>
                    <td><Link className="tableLink" href={`/seasons/${win.year}`}>{win.year}</Link></td>
                    <td>{win.round}</td>
                    <td>{win.eventName}</td>
                    <td>{win.constructorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="team">No wins found for this driver in the loaded historical data.</p>
          )}
        </section>

        <div className="footer">
          Historical driver profile calculated from GridIQ race results, qualifying results, and season standings from 2000 through 2026.
        </div>
      </div>
    </main>
  );
}
