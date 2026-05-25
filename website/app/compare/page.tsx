import Link from "next/link";

import {
  formatNumber,
  getAvailableSeasonYears,
  getDriverStandings,
  getQualifyingResults,
  getRaceResults,
} from "@/lib/history";

type Props = {
  searchParams: Promise<{
    driverA?: string;
    driverB?: string;
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
};

export const metadata = {
  title: "Compare drivers · GridIQ",
  description: "Compare historical Formula 1 driver careers from 2000 to 2026.",
};

function getDriverKey(driverId?: string, driverName?: string) {
  return driverId || driverName || "unknown";
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

  return null;
}

function getDriverCareerSummaries() {
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

function compareValue(a: number, b: number, higherIsBetter = true) {
  if (a === b) return "Even";
  if (higherIsBetter) return a > b ? "Driver A" : "Driver B";
  return a < b ? "Driver A" : "Driver B";
}

function metricDelta(a: number, b: number) {
  const delta = a - b;
  if (delta === 0) return "Even";
  return delta > 0 ? `+${formatNumber(delta)}` : formatNumber(delta);
}

function finishLabel(value: number | null) {
  return value ? `P${value}` : "—";
}

function bestFinishWinner(driverA: DriverCareerSummary, driverB: DriverCareerSummary) {
  if (!driverA.bestChampionshipFinish && !driverB.bestChampionshipFinish) return "Even";
  if (!driverA.bestChampionshipFinish) return "Driver B";
  if (!driverB.bestChampionshipFinish) return "Driver A";
  return compareValue(driverA.bestChampionshipFinish, driverB.bestChampionshipFinish, false);
}

function driverOptionLabel(driver: DriverCareerSummary) {
  return driver.driverCode ? `${driver.driverName} (${driver.driverCode})` : driver.driverName;
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const drivers = getDriverCareerSummaries();
  const defaultDriverA =
    drivers.find((driver) => driver.driverId === params.driverA)?.driverId ??
    drivers.find((driver) => driver.driverCode?.toLowerCase() === params.driverA?.toLowerCase())?.driverId ??
    drivers[0]?.driverId;
  const defaultDriverB =
    drivers.find((driver) => driver.driverId === params.driverB)?.driverId ??
    drivers.find((driver) => driver.driverCode?.toLowerCase() === params.driverB?.toLowerCase())?.driverId ??
    drivers.find((driver) => driver.driverId !== defaultDriverA)?.driverId;

  const driverA = drivers.find((driver) => driver.driverId === defaultDriverA) ?? drivers[0];
  const driverB =
    drivers.find((driver) => driver.driverId === defaultDriverB) ??
    drivers.find((driver) => driver.driverId !== driverA?.driverId) ??
    drivers[1];

  if (!driverA || !driverB) {
    return (
      <main className="page">
        <div className="shell">
          <section className="panel">
            <h1>Not enough driver data</h1>
            <p className="team">GridIQ needs at least two drivers to build a comparison.</p>
          </section>
        </div>
      </main>
    );
  }

  const metrics = [
    {
      label: "Wins",
      driverA: driverA.wins,
      driverB: driverB.wins,
      winner: compareValue(driverA.wins, driverB.wins),
      delta: metricDelta(driverA.wins, driverB.wins),
    },
    {
      label: "Podiums",
      driverA: driverA.podiums,
      driverB: driverB.podiums,
      winner: compareValue(driverA.podiums, driverB.podiums),
      delta: metricDelta(driverA.podiums, driverB.podiums),
    },
    {
      label: "Poles",
      driverA: driverA.poles,
      driverB: driverB.poles,
      winner: compareValue(driverA.poles, driverB.poles),
      delta: metricDelta(driverA.poles, driverB.poles),
    },
    {
      label: "Points",
      driverA: driverA.points,
      driverB: driverB.points,
      winner: compareValue(driverA.points, driverB.points),
      delta: metricDelta(driverA.points, driverB.points),
    },
    {
      label: "Starts",
      driverA: driverA.starts,
      driverB: driverB.starts,
      winner: compareValue(driverA.starts, driverB.starts),
      delta: metricDelta(driverA.starts, driverB.starts),
    },
    {
      label: "Seasons active",
      driverA: driverA.seasons.size,
      driverB: driverB.seasons.size,
      winner: compareValue(driverA.seasons.size, driverB.seasons.size),
      delta: metricDelta(driverA.seasons.size, driverB.seasons.size),
    },
  ];

  const driverALeads = metrics.filter((metric) => metric.winner === "Driver A").length;
  const driverBLeads = metrics.filter((metric) => metric.winner === "Driver B").length;

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ historical comparison</div>
            <h1>Compare F1 driver careers.</h1>
            <p>
              Pick two drivers and compare wins, podiums, poles, points, starts,
              seasons active, best championship finish, and teams from 2000 to 2026.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/drivers">Drivers</Link>
            <Link className="ghostLink" href="/records">Records</Link>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Choose drivers</h2>
              <p>Change the dropdowns and submit to generate a new historical comparison.</p>
            </div>
            <div className="pill">2000–2026</div>
          </div>

          <form className="comparePicker" action="/compare">
            <label>
              Driver A
              <select name="driverA" defaultValue={driverA.driverId}>
                {drivers.map((driver) => (
                  <option value={driver.driverId} key={`a-${driver.driverId}`}>
                    {driverOptionLabel(driver)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Driver B
              <select name="driverB" defaultValue={driverB.driverId}>
                {drivers.map((driver) => (
                  <option value={driver.driverId} key={`b-${driver.driverId}`}>
                    {driverOptionLabel(driver)}
                  </option>
                ))}
              </select>
            </label>
            <button className="ghostLink" type="submit">Compare</button>
          </form>
        </section>

        <section className="cards compareCards">
          <div className="card">
            <div className="label">Matchup</div>
            <div className="value valueSmall">{driverA.driverName} vs {driverB.driverName}</div>
          </div>
          <div className="card">
            <div className="label">Metric lead</div>
            <div className="value valueSmall">
              {driverALeads === driverBLeads
                ? "Even"
                : driverALeads > driverBLeads
                  ? driverA.driverName
                  : driverB.driverName}
            </div>
          </div>
          <div className="card">
            <div className="label">{driverA.driverName}</div>
            <div className="value valueSmall">{driverALeads} metric leads</div>
          </div>
          <div className="card">
            <div className="label">{driverB.driverName}</div>
            <div className="value valueSmall">{driverBLeads} metric leads</div>
          </div>
        </section>

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Career metrics</h2>
                <p>Direct comparison from loaded race and qualifying results.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>{driverA.driverName}</th>
                  <th>{driverB.driverName}</th>
                  <th>Delta A-B</th>
                  <th>Leader</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.label}>
                    <td>{metric.label}</td>
                    <td>{formatNumber(metric.driverA)}</td>
                    <td>{formatNumber(metric.driverB)}</td>
                    <td>{metric.delta}</td>
                    <td>
                      {metric.winner === "Even"
                        ? "Even"
                        : metric.winner === "Driver A"
                          ? driverA.driverName
                          : driverB.driverName}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>Best championship finish</td>
                  <td>{finishLabel(driverA.bestChampionshipFinish)}</td>
                  <td>{finishLabel(driverB.bestChampionshipFinish)}</td>
                  <td>—</td>
                  <td>
                    {bestFinishWinner(driverA, driverB) === "Even"
                      ? "Even"
                      : bestFinishWinner(driverA, driverB) === "Driver A"
                        ? driverA.driverName
                        : driverB.driverName}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Career context</h2>
                <p>Teams and active season span for each driver.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Active seasons</th>
                  <th>Teams</th>
                </tr>
              </thead>
              <tbody>
                {[driverA, driverB].map((driver) => {
                  const seasons = [...driver.seasons].sort((a, b) => a - b);
                  return (
                    <tr key={driver.driverId}>
                      <td>{driver.driverName}</td>
                      <td>{seasons[0]}–{seasons[seasons.length - 1]} ({seasons.length})</td>
                      <td className="team">{[...driver.constructors].join(" / ") || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="footer">
          Historical driver comparisons are calculated from GridIQ race results,
          qualifying results, and season standings from 2000 through 2026.
        </div>
      </div>
    </main>
  );
}
