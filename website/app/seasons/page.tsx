import Link from "next/link";
import { formatNumber, getHistoryManifest } from "@/lib/history";

export default function SeasonsPage() {
  const manifest = getHistoryManifest();

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ historical database</div>
            <h1>F1 seasons from 2000 to 2026.</h1>
            <p>
              Explore race calendars, race winners, driver standings, constructor
              standings, qualifying data, and season summaries built from historical F1 results.
            </p>
          </div>
          <div className="pill">Through {manifest.through_date}</div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Seasons</div>
            <div className="value">{manifest.seasons.length}</div>
          </div>
          <div className="card">
            <div className="label">Start</div>
            <div className="value">{manifest.start_year}</div>
          </div>
          <div className="card">
            <div className="label">Latest</div>
            <div className="value">{manifest.end_year}</div>
          </div>
          <div className="card">
            <div className="label">Failures</div>
            <div className="value">{manifest.failures.length}</div>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Season index</h2>
              <p>Every season currently loaded into the GridIQ historical database.</p>
            </div>
            <Link className="ghostLink" href="/records">View records</Link>
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
          Historical data covers 2000–2026 through {manifest.through_date}. GridIQ is independent and not affiliated with Formula 1.
        </div>
      </div>
    </main>
  );
}
