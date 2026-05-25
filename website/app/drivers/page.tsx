import Link from "next/link";

import {
  formatNumber,
  getAvailableSeasonYears,
  getDriverStandings,
  getQualifyingResults,
  getRaceResults,
} from "@/lib/history";

export const metadata = {
  title: "Drivers · GridIQ",
  description: "Historical Formula 1 driver database from 2000 to 2026.",
};

type HistoricalDriverSummary = {
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

function driverProfileHref(driver: HistoricalDriverSummary) {
  return `/drivers/${driver.driverCode?.toLowerCase() || driver.driverId}`;
}

function getConstructorName(row: unknown) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;
  const directValues = [
    record.constructor,
    record.constructor_id,
    record.constructorName,
    record.constructor_name,
    record.team,
    record.team_name,
  ];

  for (const value of directValues) {
    if (typeof value === "string" && value.length > 0 && value !== "function Object() { [native code] }") {
      return value;
    }
  }

  const nestedConstructor = record.Constructor;
  if (nestedConstructor && typeof nestedConstructor === "object") {
    const nestedRecord = nestedConstructor as Record<string, unknown>;
    if (typeof nestedRecord.name === "string" && nestedRecord.name.length > 0) {
      return nestedRecord.name;
    }
  }

  return null;
}

function getHistoricalDriverSummaries() {
  const years = getAvailableSeasonYears();
  const drivers = new Map<string, HistoricalDriverSummary>();

  for (const year of years) {
    const raceResults = getRaceResults(year);
    const qualifyingResults = getQualifyingResults(year);
    const standings = getDriverStandings(year);

    for (const result of raceResults) {
      const key = getDriverKey(result.driver_id, result.driver_name);
      const entry =
        drivers.get(key) ??
        {
          driverId: key,
          driverName: result.driver_name || result.driver_code || result.driver_id || "Unknown",
          driverCode: result.driver_code,
          seasons: new Set<number>(),
          constructors: new Set<string>(),
          starts: 0,
          wins: 0,
          podiums: 0,
          points: 0,
          poles: 0,
          bestChampionshipFinish: null,
        };

      entry.seasons.add(year);
      entry.starts += 1;
      entry.points += result.points ?? 0;

      if (result.driver_code && !entry.driverCode) {
        entry.driverCode = result.driver_code;
      }

      const constructorName = getConstructorName(result);
      if (constructorName) {
        entry.constructors.add(constructorName);
      }

      if (result.position === 1) {
        entry.wins += 1;
      }

      if (result.position !== null && result.position !== undefined && result.position <= 3) {
        entry.podiums += 1;
      }

      drivers.set(key, entry);
    }

    for (const result of qualifyingResults) {
      if (result.position !== 1) continue;

      const key = getDriverKey(result.driver_id, result.driver_name);
      const entry =
        drivers.get(key) ??
        {
          driverId: key,
          driverName: result.driver_name || result.driver_code || result.driver_id || "Unknown",
          driverCode: result.driver_code,
          seasons: new Set<number>(),
          constructors: new Set<string>(),
          starts: 0,
          wins: 0,
          podiums: 0,
          points: 0,
          poles: 0,
          bestChampionshipFinish: null,
        };

      entry.seasons.add(year);
      entry.poles += 1;

      const constructorName = getConstructorName(result);
      if (constructorName) {
        entry.constructors.add(constructorName);
      }

      drivers.set(key, entry);
    }

    for (const standing of standings) {
      const key = getDriverKey(standing.driver_id, standing.driver_name);
      const entry =
        drivers.get(key) ??
        {
          driverId: key,
          driverName: standing.driver_name || standing.driver_code || standing.driver_id || "Unknown",
          driverCode: standing.driver_code,
          seasons: new Set<number>(),
          constructors: new Set<string>(),
          starts: 0,
          wins: 0,
          podiums: 0,
          points: 0,
          poles: 0,
          bestChampionshipFinish: null,
        };

      entry.seasons.add(year);

      if (standing.driver_code && !entry.driverCode) {
        entry.driverCode = standing.driver_code;
      }

      const standingConstructorName = getConstructorName(standing);
      if (standingConstructorName) {
        entry.constructors.add(standingConstructorName);
      }

      for (const constructorName of standing.constructors ?? []) {
        if (typeof constructorName === "string" && constructorName.length > 0) {
          entry.constructors.add(constructorName);
        }
      }

      if (
        standing.position &&
        (entry.bestChampionshipFinish === null || standing.position < entry.bestChampionshipFinish)
      ) {
        entry.bestChampionshipFinish = standing.position;
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

export default function DriversPage() {
  const drivers = getHistoricalDriverSummaries();
  const totalWins = drivers.reduce((sum, driver) => sum + driver.wins, 0);
  const totalPodiums = drivers.reduce((sum, driver) => sum + driver.podiums, 0);
  const totalStarts = drivers.reduce((sum, driver) => sum + driver.starts, 0);

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ historical driver database</div>
            <h1>F1 drivers from 2000 to 2026.</h1>
            <p>
              Browse driver wins, podiums, points, poles, starts, active seasons,
              teams, and best championship finishes from the loaded historical database.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/records">Records</Link>
            <Link className="ghostLink" href="/seasons">Seasons</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Drivers</div>
            <div className="value">{drivers.length}</div>
          </div>
          <div className="card">
            <div className="label">Starts</div>
            <div className="value">{formatNumber(totalStarts)}</div>
          </div>
          <div className="card">
            <div className="label">Wins</div>
            <div className="value">{formatNumber(totalWins)}</div>
          </div>
          <div className="card">
            <div className="label">Podiums</div>
            <div className="value">{formatNumber(totalPodiums)}</div>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Driver index</h2>
              <p>
                Sorted by wins, then podiums, then points. Select a driver name to open
                the full historical profile.
              </p>
            </div>
            <div className="pill">2000–2026</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Driver</th>
                <th>Code</th>
                <th>Wins</th>
                <th>Podiums</th>
                <th>Poles</th>
                <th>Points</th>
                <th>Starts</th>
                <th>Seasons</th>
                <th>Best finish</th>
                <th>Teams</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver, index) => (
                <tr key={driver.driverId}>
                  <td className="rank">{index + 1}</td>
                  <td>
                    <Link className="tableLink" href={driverProfileHref(driver)}>
                      {driver.driverName}
                    </Link>
                  </td>
                  <td>{driver.driverCode ?? "—"}</td>
                  <td>{driver.wins}</td>
                  <td>{driver.podiums}</td>
                  <td>{driver.poles}</td>
                  <td>{formatNumber(driver.points)}</td>
                  <td>{formatNumber(driver.starts)}</td>
                  <td>{driver.seasons.size}</td>
                  <td>{driver.bestChampionshipFinish ? `P${driver.bestChampionshipFinish}` : "—"}</td>
                  <td className="team">{[...driver.constructors].filter(Boolean).slice(0, 4).join(" / ") || "Needs data refresh"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="footer">
          Historical driver data is calculated from GridIQ race results, qualifying
          results, and season standings from 2000 through 2026. Select a driver name
          to open the full historical profile.
        </div>
      </div>
    </main>
  );
}
