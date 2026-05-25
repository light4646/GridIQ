import Link from "next/link";

import { EVENT_OPTIONS } from "@/lib/static-data";

export const metadata = {
  title: "Race Analytics · GridIQ",
  description: "Browse generated Formula 1 race analytics dashboards by season.",
};

function groupEventsByYear() {
  return EVENT_OPTIONS.reduce<Record<number, typeof EVENT_OPTIONS>>((groups, event) => {
    groups[event.year] = [...(groups[event.year] ?? []), event];
    return groups;
  }, {});
}

export default function EventsPage() {
  const eventsByYear = groupEventsByYear();
  const years = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => b - a);
  const totalEvents = EVENT_OPTIONS.length;

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ race analytics library</div>
            <h1>Race analytics dashboards.</h1>
            <p>
              Browse every generated FastF1 race dashboard by season. Each race page includes
              clean-lap pace, stints, tyre usage, pit windows, lap traces, and copyable race intelligence.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/explore">Explorer</Link>
            <Link className="ghostLink" href="/seasons">Seasons</Link>
            <Link className="ghostLink" href="/drivers">Drivers</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Dashboards</div>
            <div className="value">{totalEvents}</div>
            <p className="small">Generated race analytics pages currently available.</p>
          </div>
          <div className="card">
            <div className="label">Seasons</div>
            <div className="value">{years.length}</div>
            <p className="small">Race analytics coverage grouped by season.</p>
          </div>
          <div className="card">
            <div className="label">Latest season</div>
            <div className="value valueSmall">{years[0] ?? "—"}</div>
            <p className="small">Newest generated race analytics season.</p>
          </div>
          <div className="card">
            <div className="label">Mode</div>
            <div className="value valueSmall">FastF1</div>
            <p className="small">Deep lap-data dashboards from generated event datasets.</p>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>All race dashboards</h2>
              <p>Select a race below. The list is grouped by season to avoid a giant wall of event cards.</p>
            </div>
            <div className="pill">{totalEvents} race pages</div>
          </div>

          <div className="raceList" aria-label="Race analytics dashboards">
            {years.map((year) => (
              <div className="raceYearGroup" key={year}>
                <div className="raceYearHeader">{year}</div>
                <div className="raceYearLinks">
                  {eventsByYear[year]
                    .slice()
                    .sort((a, b) => a.shortLabel.localeCompare(b.shortLabel))
                    .map((event) => (
                      <Link className="raceListLink" href={`/events/${event.id}`} key={event.id}>
                        <span>{event.shortLabel}</span>
                        <small>{event.circuit}</small>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="footer">
          Race Analytics dashboards are generated from FastF1 event data and connected to the GridIQ historical database.
        </div>
      </div>
    </main>
  );
}
