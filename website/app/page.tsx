import Link from "next/link";

const featureCards = [
  {
    title: "Race intelligence",
    body: "Auto-generated story cards summarize pace leaders, strategy triggers, tyre mix, and qualifying-to-race swings.",
  },
  {
    title: "Driver analytics",
    body: "Explore driver pages with race pace, event-by-event performance, lap traces, and comparison links.",
  },
  {
    title: "Strategy view",
    body: "Review best stints, pit stop windows, tyre compound usage, and clean-lap race pace rankings.",
  },
  {
    title: "Saturday vs Sunday",
    body: "Compare qualifying rank against Sunday race pace to see who gained or lost performance over the race.",
  },
];

const mainLinks = [
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
  {
    href: "/explore",
    title: "Explorer",
    subtitle: "Interactive event and driver view",
  },
  {
    href: "/compare",
    title: "Compare",
    subtitle: "Driver-vs-driver analytics",
  },
];

export default function HomePage() {
  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ v1.0 · FastF1 race intelligence</div>
            <h1>Turn Formula 1 lap data into readable race stories.</h1>
            <p>
              GridIQ transforms static FastF1 JSON into race pace rankings, driver
              pages, stint analysis, pit windows, tyre mix, qualifying-vs-race
              comparisons, lap traces, and copyable insight cards.
            </p>
          </div>

          <div className="heroActions">
            <Link className="ghostLink" href="/events/2024-monza-race">
              Open Monza
            </Link>
            <Link className="ghostLink" href="/explore">
              Launch Explorer
            </Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Datasets</div>
            <div className="value">2</div>
            <p className="small">Monza + Silverstone race and qualifying sessions.</p>
          </div>

          <div className="card">
            <div className="label">Source</div>
            <div className="value valueSmall">FastF1</div>
            <p className="small">Processed locally into static JSON dashboards.</p>
          </div>

          <div className="card">
            <div className="label">Insights</div>
            <div className="value">6</div>
            <p className="small">Copyable race intelligence cards per event.</p>
          </div>

          <div className="card">
            <div className="label">Mode</div>
            <div className="value valueSmall">Static MVP</div>
            <p className="small">No live API calls from the public frontend.</p>
          </div>
        </section>

        <section className="panel widePanel intelligencePanel">
          <div className="panelHeader">
            <div>
              <h2>What GridIQ does</h2>
              <p>
                A lightweight F1 analytics product that makes race data easier to
                understand, compare, and share.
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
                <p>Jump into the most useful v1.0 pages.</p>
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
              <Link className="ghostLink" href="/drivers/lec">
                Example driver: LEC
              </Link>
              <Link className="ghostLink" href="/drivers/ham">
                Example driver: HAM
              </Link>
              <Link className="ghostLink" href="/compare?driverA=lec&driverB=ham">
                Compare LEC vs HAM
              </Link>
            </div>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Built for the next phase</h2>
              <p>
                v1.0 is intentionally static and reliable. The next production phase
                can add Supabase sync, automated dataset generation, deployment, and
                richer telemetry views.
              </p>
            </div>
            <Link className="ghostLink" href="/events/2024-silverstone-race">
              View latest event
            </Link>
          </div>
        </section>

        <div className="footer">
          GridIQ is an independent analytics prototype powered by processed FastF1
          data. It is not affiliated with Formula 1.
        </div>
      </div>
    </main>
  );
}