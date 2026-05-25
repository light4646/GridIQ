

import Link from "next/link";

import { formatNumber, getHistoryManifest } from "@/lib/history";

export const metadata = {
  title: "Explore · GridIQ",
  description: "Explore the GridIQ Formula 1 historical database and race intelligence pages.",
};

const researchLinks = [
  {
    href: "/seasons",
    title: "Season database",
    description: "Browse every loaded F1 season from 2000 to 2026 with calendars, winners, and standings.",
  },
  {
    href: "/records",
    title: "Records hub",
    description: "Compare driver wins, podiums, points, poles, and constructor totals across the modern database.",
  },
  {
    href: "/drivers",
    title: "Driver database",
    description: "Open historical driver profiles with wins, podiums, points, teams, and season-by-season tables.",
  },
  {
    href: "/constructors",
    title: "Constructor database",
    description: "Review constructor titles, wins, podiums, points, seasons, and drivers from 2000 to 2026.",
  },
  {
    href: "/compare?driverA=lewis-hamilton&driverB=max-verstappen",
    title: "Driver comparison",
    description: "Compare two historical driver careers side-by-side with wins, podiums, poles, points, and teams.",
  },
  {
    href: "/seasons/2026",
    title: "Current loaded season",
    description: "Jump into the 2026 season loaded through May 24, 2026.",
  },
];

const eventLinks = [
  {
    href: "/events/2024-monza-race",
    title: "Monza 2024",
    description: "Italian GP race intelligence with pace rankings, stints, tyre usage, and strategy windows.",
  },
  {
    href: "/events/2024-silverstone-race",
    title: "Silverstone 2024",
    description: "British GP race intelligence with lap traces, pit stops, and qualifying-to-race comparison.",
  },
];

const quickCompares = [
  {
    href: "/compare?driverA=lewis-hamilton&driverB=max-verstappen",
    title: "Hamilton vs Verstappen",
  },
  {
    href: "/compare?driverA=lewis-hamilton&driverB=fernando-alonso",
    title: "Hamilton vs Alonso",
  },
  {
    href: "/compare?driverA=max-verstappen&driverB=sebastian-vettel",
    title: "Verstappen vs Vettel",
  },
  {
    href: "/compare?driverA=charles-leclerc&driverB=carlos-sainz-jr",
    title: "Leclerc vs Sainz",
  },
];

export default function ExplorePage() {
  const manifest = getHistoryManifest();
  const totalRaces = manifest.seasons.reduce((sum, season) => sum + season.races, 0);
  const totalRaceRows = manifest.seasons.reduce((sum, season) => sum + season.race_results, 0);
  const totalQualiRows = manifest.seasons.reduce((sum, season) => sum + season.qualifying_results, 0);

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ explorer</div>
            <h1>Explore the F1 historical database.</h1>
            <p>
              Start with seasons, records, drivers, constructors, comparisons, or selected
              FastF1 race intelligence pages. This is the main research hub for GridIQ.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/seasons">Seasons</Link>
            <Link className="ghostLink" href="/records">Records</Link>
            <Link className="ghostLink" href="/compare">Compare</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Seasons</div>
            <div className="value">{manifest.seasons.length}</div>
            <p className="small">Loaded from {manifest.start_year} to {manifest.end_year}.</p>
          </div>
          <div className="card">
            <div className="label">Races</div>
            <div className="value">{formatNumber(totalRaces)}</div>
            <p className="small">Completed races in the historical database.</p>
          </div>
          <div className="card">
            <div className="label">Race rows</div>
            <div className="value">{formatNumber(totalRaceRows)}</div>
            <p className="small">Driver race-result rows loaded locally.</p>
          </div>
          <div className="card">
            <div className="label">Through</div>
            <div className="value valueSmall">{manifest.through_date}</div>
            <p className="small">Latest included historical cutoff.</p>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Research shortcuts</h2>
              <p>Jump directly into the most useful GridIQ database views.</p>
            </div>
            <div className="pill">{formatNumber(totalQualiRows)} qualifying rows</div>
          </div>
          <div className="eventNav">
            {researchLinks.map((link) => (
              <Link className="eventLink" href={link.href} key={link.href}>
                <span>{link.title}</span>
                <small>{link.description}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Race intelligence</h2>
                <p>Deep FastF1 event dashboards currently loaded into GridIQ.</p>
              </div>
            </div>
            <div className="eventNav stackedNav">
              {eventLinks.map((link) => (
                <Link className="eventLink" href={link.href} key={link.href}>
                  <span>{link.title}</span>
                  <small>{link.description}</small>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Quick comparisons</h2>
                <p>Common historical matchups to test the compare page.</p>
              </div>
            </div>
            <div className="chart">
              {quickCompares.map((link) => (
                <Link className="ghostLink" href={link.href} key={link.href}>
                  {link.title}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>What you can research</h2>
              <p>GridIQ is now structured around historical context plus selected deep race analytics.</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Best page</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Who won a specific season?</td>
                <td><Link className="tableLink" href="/seasons">Seasons</Link></td>
                <td>Shows driver champion, constructor champion, calendar, winners, and standings.</td>
              </tr>
              <tr>
                <td>Which driver has the most wins since 2000?</td>
                <td><Link className="tableLink" href="/records">Records</Link></td>
                <td>Aggregates wins, podiums, poles, and points across loaded seasons.</td>
              </tr>
              <tr>
                <td>How does one driver compare to another?</td>
                <td><Link className="tableLink" href="/compare">Compare</Link></td>
                <td>Compares historical careers side by side.</td>
              </tr>
              <tr>
                <td>What teams did a driver race for?</td>
                <td><Link className="tableLink" href="/drivers">Drivers</Link></td>
                <td>Driver profiles show teams, active years, season rows, and race wins.</td>
              </tr>
              <tr>
                <td>Which constructor was strongest since 2000?</td>
                <td><Link className="tableLink" href="/constructors">Constructors</Link></td>
                <td>Ranks teams by titles, wins, podiums, starts, points, and active seasons.</td>
              </tr>
              <tr>
                <td>What happened inside a specific race?</td>
                <td><Link className="tableLink" href="/events/2024-monza-race">Race Analytics</Link></td>
                <td>Deep event dashboards show pace, stints, pit windows, tyre mix, and lap traces.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="footer">
          GridIQ Explorer uses local static JSON built from Jolpica historical data and selected FastF1 event datasets.
        </div>
      </div>
    </main>
  );
}