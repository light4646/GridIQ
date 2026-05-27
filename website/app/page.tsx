import Link from "next/link";
import type { Metadata } from "next";

import F1TVBanner from "@/components/F1TVBanner";
import { getHistoryManifest, formatNumber } from "@/lib/history";
import { EVENT_OPTIONS } from "@/lib/static-data";
import { ADSENSE } from "@/lib/monetization";
import AdUnit from "@/components/AdUnit";

export const metadata: Metadata = {
  title: "GridIQ | F1 Statistics, Records & Race Analytics 1950–2026",
  description:
    "GridIQ is a Formula 1 statistics platform with every season from 1950 to 2026. Browse world champions, race results, driver standings, constructor records, lap traces, and deep race analytics.",
  openGraph: {
    title: "GridIQ | F1 Statistics, Records & Race Analytics 1950–2026",
    description:
      "Every Formula 1 season from 1950 to 2026. World champions, race results, driver and constructor records, and FastF1 race analytics.",
  },
  alternates: { canonical: "/" },
};

const featureCards = [
  {
    title: "75 years of F1 history",
    body: "Browse every Formula 1 season from the inaugural 1950 World Championship through 2026, with race calendars, winners, driver standings, and constructor standings.",
  },
  {
    title: "World champions database",
    body: "See every F1 World Drivers' Champion and Constructors' Champion since 1950, with wins, points, teams, and full season breakdowns.",
  },
  {
    title: "Driver & constructor records",
    body: "All-time rankings for most wins, podiums, pole positions, and points — covering every loaded season in the historical database.",
  },
  {
    title: "Race intelligence dashboards",
    body: "Auto-generated story cards for pace leaders, strategy triggers, tyre mix, and qualifying-to-race swings from FastF1 event data.",
  },
  {
    title: "Deep race analytics",
    body: "Per-race dashboards with lap traces, stint analysis, pit stop windows, tyre usage, and qualifying-vs-race comparisons for 75+ events.",
  },
];

export default function HomePage() {
  const manifest = getHistoryManifest();
  const totalRaces = manifest.seasons.reduce((sum, s) => sum + s.races, 0);
  const totalRaceRows = manifest.seasons.reduce((sum, s) => sum + s.race_results, 0);

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ · F1 statistics and race intelligence</div>
            <h1>Formula 1 statistics from 1950 to 2026.</h1>
            <p>
              Every F1 season, world champion, race result, driver record, and constructor title
              from the 1950 World Championship through the {manifest.end_year} season.
              Plus deep FastF1 race analytics with lap traces, strategy windows, and race intelligence.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/seasons">All seasons</Link>
            <Link className="ghostLink" href="/champions">Champions</Link>
            <Link className="ghostLink" href="/records">Records</Link>
            <Link className="ghostLink" href="/events">Race Analytics</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Seasons</div>
            <div className="value">{manifest.seasons.length}</div>
            <p className="small">F1 seasons from {manifest.start_year} to {manifest.end_year}.</p>
          </div>
          <div className="card">
            <div className="label">Races</div>
            <div className="value">{formatNumber(totalRaces)}</div>
            <p className="small">Total Grands Prix in the historical database.</p>
          </div>
          <div className="card">
            <div className="label">Race result rows</div>
            <div className="value">{formatNumber(totalRaceRows)}</div>
            <p className="small">Driver-race result rows loaded.</p>
          </div>
          <div className="card">
            <div className="label">Race analytics</div>
            <div className="value">{EVENT_OPTIONS.length}</div>
            <p className="small">Deep FastF1 race dashboards available.</p>
          </div>
        </section>

        <section className="panel widePanel intelligencePanel">
          <div className="panelHeader">
            <div>
              <h2>What GridIQ covers</h2>
              <p>
                A complete Formula 1 statistics platform — from the 1950 World Championship
                to the latest 2026 season, with deep per-race analytics.
              </p>
            </div>
            <div className="pill">75 years of F1</div>
          </div>
          <div className="insightGrid">
            {featureCards.map((feature) => (
              <article className="insightCard" key={feature.title}>
                <div className="label">Feature</div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <AdUnit slot={ADSENSE.slots.heroLeaderboard} />

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Start exploring</h2>
                <p>Jump into the historical database, champions, records, or race analytics.</p>
              </div>
            </div>
            <div className="eventNav">
              <Link className="eventLink" href="/seasons">
                <span>All seasons</span>
                <small>{manifest.start_year}–{manifest.end_year} · {manifest.seasons.length} seasons</small>
              </Link>
              <Link className="eventLink" href="/champions">
                <span>World champions</span>
                <small>Every F1 title winner since 1950</small>
              </Link>
              <Link className="eventLink" href="/records">
                <span>Records</span>
                <small>Most wins, podiums, poles, points</small>
              </Link>
              <Link className="eventLink" href="/drivers">
                <span>Driver database</span>
                <small>Career profiles, wins, podiums, teams</small>
              </Link>
              <Link className="eventLink" href="/constructors">
                <span>Constructor database</span>
                <small>Titles, wins, podiums, seasons</small>
              </Link>
              <Link className="eventLink" href="/events">
                <span>Race Analytics</span>
                <small>{EVENT_OPTIONS.length} deep race dashboards from FastF1</small>
              </Link>
              <Link className="eventLink" href="/seasons/2026">
                <span>2026 season</span>
                <small>Current season through {manifest.through_date}</small>
              </Link>
              <Link className="eventLink" href="/compare?driverA=lewis-hamilton&driverB=max-verstappen">
                <span>Compare drivers</span>
                <small>Side-by-side career comparison</small>
              </Link>
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Recent champions</h2>
                <p>The last ten Formula 1 World Drivers&apos; Champions.</p>
              </div>
              <Link className="ghostLink" href="/champions">All champions</Link>
            </div>
            <table>
              <thead>
                <tr><th>Year</th><th>Champion</th><th>Team</th><th>Wins</th></tr>
              </thead>
              <tbody>
                {manifest.seasons.slice(0, 10).map((season) => (
                  <tr key={season.year}>
                    <td>
                      <Link className="tableLink" href={`/seasons/${season.year}`}>
                        {season.year}
                      </Link>
                    </td>
                    <td>{season.driver_champion?.driver_name ?? "—"}</td>
                    <td className="team">{season.driver_champion?.constructors?.[0] ?? "—"}</td>
                    <td>{season.driver_champion?.wins ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <F1TVBanner />

        <AdUnit slot={ADSENSE.slots.inContent} />

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Popular searches on GridIQ</h2>
              <p>Common Formula 1 research questions you can answer here.</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Best page</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Who are all the F1 world champions?</td>
                <td><Link className="tableLink" href="/champions">Champions</Link></td>
              </tr>
              <tr>
                <td>Who has the most F1 wins?</td>
                <td><Link className="tableLink" href="/records">Records</Link></td>
              </tr>
              <tr>
                <td>Who won the 2024 F1 championship?</td>
                <td><Link className="tableLink" href="/seasons/2024">2024 Season</Link></td>
              </tr>
              <tr>
                <td>What is the F1 driver standings history?</td>
                <td><Link className="tableLink" href="/seasons">Seasons</Link></td>
              </tr>
              <tr>
                <td>Which constructor has the most F1 titles?</td>
                <td><Link className="tableLink" href="/constructors">Constructors</Link></td>
              </tr>
              <tr>
                <td>How did Verstappen compare to Hamilton in race pace?</td>
                <td><Link className="tableLink" href="/compare?driverA=max-verstappen&driverB=lewis-hamilton">Compare</Link></td>
              </tr>
              <tr>
                <td>What happened in the 2024 Italian GP race?</td>
                <td><Link className="tableLink" href="/events/2024-italian-grand-prix-race">Race Analytics</Link></td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="footer">
          GridIQ is an independent Formula 1 statistics and analytics project powered by
          Jolpica/Ergast historical data and FastF1 lap data. Not affiliated with Formula 1 or the FIA.
        </div>
      </div>
    </main>
  );
}
