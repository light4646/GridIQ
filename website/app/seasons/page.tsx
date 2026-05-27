import Link from "next/link";
import type { Metadata } from "next";

import { formatNumber, getHistoryManifest } from "@/lib/history";

export const metadata: Metadata = {
  title: "F1 Seasons 1950–2026 · GridIQ",
  description:
    "Browse every Formula 1 season from 1950 to 2026. Race calendars, race winners, driver standings, constructor standings, world champions, and qualifying data for each season.",
  keywords: [
    "F1 seasons history",
    "Formula 1 season results",
    "F1 race calendar",
    "F1 driver standings by year",
    "Formula 1 standings history",
    "F1 results database",
  ],
  openGraph: {
    title: "F1 Seasons 1950–2026 · GridIQ",
    description: "Browse every Formula 1 season from 1950 to 2026, with champions, race results, and standings.",
  },
};

export default function SeasonsPage() {
  const manifest = getHistoryManifest();

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ historical database</div>
            <h1>F1 seasons from {manifest.start_year} to {manifest.end_year}.</h1>
            <p>
              Explore race calendars, race winners, driver standings, constructor
              standings, qualifying data, and world champions for every Formula 1 season
              from {manifest.start_year} to {manifest.end_year}.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/champions">Champions</Link>
            <Link className="ghostLink" href="/records">Records</Link>
            <Link className="ghostLink" href="/drivers">Drivers</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Seasons</div>
            <div className="value">{manifest.seasons.length}</div>
            <p className="small">F1 seasons loaded from {manifest.start_year} to {manifest.end_year}.</p>
          </div>
          <div className="card">
            <div className="label">First season</div>
            <div className="value">{manifest.start_year}</div>
            <p className="small">Inaugural Formula 1 World Championship season.</p>
          </div>
          <div className="card">
            <div className="label">Latest</div>
            <div className="value">{manifest.end_year}</div>
            <p className="small">Through {manifest.through_date}.</p>
          </div>
          <div className="card">
            <div className="label">Race rows</div>
            <div className="value">{formatNumber(manifest.seasons.reduce((s, y) => s + y.race_results, 0))}</div>
            <p className="small">Total race result rows in the database.</p>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Season index</h2>
              <p>Every Formula 1 season in the GridIQ historical database, with world champions and key stats.</p>
            </div>
            <div className="panelActions">
              <Link className="ghostLink" href="/champions">All champions</Link>
              <Link className="ghostLink" href="/records">Records</Link>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Races</th>
                <th>Driver champion</th>
                <th>Constructor champion</th>
                <th>Race rows</th>
                <th>Quali rows</th>
              </tr>
            </thead>
            <tbody>
              {manifest.seasons.map((season) => (
                <tr key={season.year}>
                  <td>
                    <Link className="tableLink" href={`/seasons/${season.year}`}>
                      {season.year}
                    </Link>
                  </td>
                  <td>{season.races}</td>
                  <td>{season.driver_champion?.driver_name ?? "—"}</td>
                  <td>{season.constructor_champion?.constructor ?? "—"}</td>
                  <td>{formatNumber(season.race_results)}</td>
                  <td>{formatNumber(season.qualifying_results)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="footer">
          Historical data covers {manifest.start_year}–{manifest.end_year} through {manifest.through_date}. GridIQ is independent and not affiliated with Formula 1.
        </div>
      </div>
    </main>
  );
}
