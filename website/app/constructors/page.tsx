

import Link from "next/link";

import {
  formatNumber,
  getAvailableSeasonYears,
  getConstructorStandings,
  getRaceResults,
} from "@/lib/history";

export const metadata = {
  title: "Constructors · GridIQ",
  description: "Historical Formula 1 constructor database from 2000 to 2026.",
};

type ConstructorSummary = {
  constructorId: string;
  constructorName: string;
  seasons: Set<number>;
  drivers: Set<string>;
  starts: number;
  wins: number;
  podiums: number;
  points: number;
  championships: number;
  bestChampionshipFinish: number | null;
};

function getConstructorKey(constructorId?: string, constructorName?: string) {
  return constructorId || constructorName || "unknown";
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

  return "Unknown";
}

function getConstructorSummaries() {
  const years = getAvailableSeasonYears();
  const constructors = new Map<string, ConstructorSummary>();

  for (const year of years) {
    const raceResults = getRaceResults(year);
    const standings = getConstructorStandings(year);

    for (const result of raceResults) {
      const constructorName = getConstructorName(result);
      const key = getConstructorKey(result.constructor_id, constructorName);
      const entry =
        constructors.get(key) ??
        {
          constructorId: key,
          constructorName,
          seasons: new Set<number>(),
          drivers: new Set<string>(),
          starts: 0,
          wins: 0,
          podiums: 0,
          points: 0,
          championships: 0,
          bestChampionshipFinish: null,
        };

      entry.seasons.add(year);
      entry.starts += 1;
      entry.points += result.points ?? 0;

      if (result.driver_name) {
        entry.drivers.add(result.driver_name);
      }

      if (result.position === 1) {
        entry.wins += 1;
      }

      if (result.position !== null && result.position !== undefined && result.position <= 3) {
        entry.podiums += 1;
      }

      constructors.set(key, entry);
    }

    for (const standing of standings) {
      const constructorName = getConstructorName(standing);
      const key = getConstructorKey(standing.constructor_id, constructorName);
      const entry =
        constructors.get(key) ??
        {
          constructorId: key,
          constructorName,
          seasons: new Set<number>(),
          drivers: new Set<string>(),
          starts: 0,
          wins: 0,
          podiums: 0,
          points: 0,
          championships: 0,
          bestChampionshipFinish: null,
        };

      entry.seasons.add(year);

      if (standing.position === 1) {
        entry.championships += 1;
      }

      if (
        standing.position &&
        (entry.bestChampionshipFinish === null || standing.position < entry.bestChampionshipFinish)
      ) {
        entry.bestChampionshipFinish = standing.position;
      }

      constructors.set(key, entry);
    }
  }

  return [...constructors.values()].sort((a, b) => {
    if (b.championships !== a.championships) return b.championships - a.championships;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.podiums !== a.podiums) return b.podiums - a.podiums;
    if (b.points !== a.points) return b.points - a.points;
    return a.constructorName.localeCompare(b.constructorName);
  });
}

export default function ConstructorsPage() {
  const constructors = getConstructorSummaries();
  const totalWins = constructors.reduce((sum, constructor) => sum + constructor.wins, 0);
  const totalPodiums = constructors.reduce((sum, constructor) => sum + constructor.podiums, 0);
  const totalStarts = constructors.reduce((sum, constructor) => sum + constructor.starts, 0);
  const totalChampionships = constructors.reduce(
    (sum, constructor) => sum + constructor.championships,
    0,
  );

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ historical constructor database</div>
            <h1>F1 constructors from 2000 to 2026.</h1>
            <p>
              Browse constructor championships, wins, podiums, points, starts, active
              seasons, drivers, and best championship finishes from the historical database.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/records">Records</Link>
            <Link className="ghostLink" href="/seasons">Seasons</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Constructors</div>
            <div className="value">{constructors.length}</div>
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
            <div className="label">Titles</div>
            <div className="value">{formatNumber(totalChampionships)}</div>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Constructor index</h2>
              <p>
                Sorted by championships, then wins, podiums, and points from the loaded
                2000–2026 historical results.
              </p>
            </div>
            <div className="pill">2000–2026</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Constructor</th>
                <th>Titles</th>
                <th>Wins</th>
                <th>Podiums</th>
                <th>Points</th>
                <th>Starts</th>
                <th>Seasons</th>
                <th>Best finish</th>
                <th>Drivers</th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((constructor, index) => (
                <tr key={constructor.constructorId}>
                  <td className="rank">{index + 1}</td>
                  <td>{constructor.constructorName}</td>
                  <td>{constructor.championships}</td>
                  <td>{constructor.wins}</td>
                  <td>{constructor.podiums}</td>
                  <td>{formatNumber(constructor.points)}</td>
                  <td>{formatNumber(constructor.starts)}</td>
                  <td>{constructor.seasons.size}</td>
                  <td>{constructor.bestChampionshipFinish ? `P${constructor.bestChampionshipFinish}` : "—"}</td>
                  <td className="team">{[...constructor.drivers].slice(0, 5).join(" / ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="footer">
          Historical constructor data is calculated from GridIQ race results and
          constructor standings from 2000 through 2026.
        </div>
      </div>
    </main>
  );
}