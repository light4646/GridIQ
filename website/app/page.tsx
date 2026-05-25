import Link from "next/link";

const featureCards = [
  {
    title: "Historical database",
    body: "Browse every loaded F1 season from 2000 to 2026, including calendars, winners, driver standings, and constructor standings.",
  },
  {
    title: "Records hub",
    body: "Compare wins, podiums, points, poles, and constructor records across the modern historical database.",
  },
  {
    title: "Constructor database",
    body: "Review constructor wins, podiums, points, active seasons, titles, drivers, and championship finishes from 2000 to 2026.",
  },
  {
    title: "Race intelligence",
    body: "Auto-generated story cards summarize pace leaders, strategy triggers, tyre mix, and qualifying-to-race swings.",
  },
  {
    title: "Deep event analytics",
    body: "Explore race pace, best stints, pit windows, tyre usage, lap traces, and qualifying-vs-race comparisons for selected FastF1 events.",
  },
];

const mainLinks = [
  {
    href: "/seasons",
    title: "Seasons",
    subtitle: "2000–2026 historical database",
  },
  {
    href: "/records",
    title: "Records",
    subtitle: "Wins, podiums, points, poles",
  },
  {
    href: "/constructors",
    title: "Constructors",
    subtitle: "Teams, wins, titles, points",
  },
  {
    href: "/seasons/2026",
    title: "2026 Season",
    subtitle: "Current season through May 24",
  },
  {
    href: "/seasons/2024",
    title: "2024 Season",
    subtitle: "Full historical season profile",
  },
  {
    href: "/events/2024-monza-race",
    title: "Monza 2024",
    subtitle: "Italian GP race intelligence",
  },
  {
    href: "/events/2024-silverstone-race",
    title: "Silverstone 2024",
    subtitle: "British GP race intelligence",
  },
];

export default function HomePage() {
  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ · F1 stats and race intelligence</div>
            <h1>Formula 1 stats, seasons, records, and race intelligence.</h1>
            <p>
              GridIQ combines a historical F1 database from 2000 to 2026 with selected
              FastF1 race analytics, giving you season pages, records, constructor
              tables, standings, race winners, lap traces, strategy windows, and copyable insights.
            </p>
          </div>

          <div className="heroActions">
            <Link className="ghostLink" href="/seasons">
              Seasons
            </Link>
            <Link className="ghostLink" href="/records">
              Records
            </Link>
            <Link className="ghostLink" href="/drivers">
              Drivers
            </Link>
            <Link className="ghostLink" href="/constructors">
              Constructors
            </Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Seasons</div>
            <div className="value">27</div>
            <p className="small">Historical data from 2000 through 2026.</p>
          </div>

          <div className="card">
            <div className="label">Sources</div>
            <div className="value valueSmall">Jolpica + FastF1</div>
            <p className="small">Historical results plus selected deep race analytics.</p>
          </div>

          <div className="card">
            <div className="label">Constructors</div>
            <div className="value valueSmall">Live</div>
            <p className="small">Team titles, wins, podiums, points, and driver histories.</p>
          </div>

          <div className="card">
            <div className="label">Frontend</div>
            <div className="value valueSmall">Static</div>
            <p className="small">Fast loading pages generated from local JSON data.</p>
          </div>
        </section>

        <section className="panel widePanel intelligencePanel">
          <div className="panelHeader">
            <div>
              <h2>What GridIQ does</h2>
              <p>
                A real F1 stats platform with historical seasons, records, drivers,
                constructors, standings, and selected race intelligence dashboards.
              </p>
            </div>
            <div className="pill">Production-ready MVP</div>
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

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Start exploring</h2>
                <p>Start with the historical database, then jump into race analytics.</p>
              </div>
            </div>

            <div className="eventNav">
              {mainLinks.map((link) => (
                <Link className="eventLink" href={link.href} key={link.href}>
                  <span>{link.title}</span>
                  <small>{link.subtitle}</small>
                </Link>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Core pages</h2>
                <p>Product paths for driver research and comparison.</p>
              </div>
            </div>

            <div className="chart">
              <Link className="ghostLink" href="/drivers">
                Driver index
              </Link>
              <Link className="ghostLink" href="/constructors">
                Constructor index
              </Link>
              <Link className="ghostLink" href="/seasons">
                Season index
              </Link>
              <Link className="ghostLink" href="/records">
                Records hub
              </Link>
              <Link className="ghostLink" href="/drivers/lec">
                Example driver: LEC
              </Link>
              <Link className="ghostLink" href="/drivers/ham">
                Example driver: HAM
              </Link>
              <Link className="ghostLink" href="/compare?driverA=lewis-hamilton&driverB=max-verstappen">
                Compare Hamilton vs Verstappen
              </Link>
            </div>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Built for the next phase</h2>
              <p>
                The historical backbone is now loaded from 2000 to 2026. The next phase
                can add richer driver profiles, constructor profiles, charts, search, and
                automated updates after every Grand Prix.
              </p>
            </div>
            <Link className="ghostLink" href="/seasons/2026">
              View 2026 season
            </Link>
          </div>
        </section>

        <div className="footer">
          GridIQ is an independent Formula 1 stats and analytics project powered by
          processed Jolpica and FastF1 data. It is not affiliated with Formula 1.
        </div>
      </div>
    </main>
  );
}