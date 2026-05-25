import Link from "next/link";
import { Suspense } from "react";

import { ComparePicker } from "@/components/ComparePicker";
import { getDriverComparison } from "@/lib/comparison-analytics";
import { getAllDriverSummaries } from "@/lib/drivers";
import { formatLap } from "@/lib/f1-utils";

type Props = {
  searchParams: Promise<{
    driverA?: string;
    driverB?: string;
  }>;
};

export const metadata = {
  title: "Compare drivers · GridIQ",
  description: "Head-to-head F1 race pace comparisons across loaded GridIQ events.",
};

function signedDelta(seconds: number): string {
  if (seconds === 0) return "0.000s";
  return `${seconds > 0 ? "+" : ""}${seconds.toFixed(3)}s`;
}

function winnerLabel(summary: NonNullable<ReturnType<typeof getDriverComparison>>): string {
  if (summary.driverAWinsMedian === summary.driverBWinsMedian) {
    return "Even on median pace";
  }
  return summary.driverAWinsMedian > summary.driverBWinsMedian
    ? `${summary.driverA} leads on median pace`
    : `${summary.driverB} leads on median pace`;
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  const drivers = getAllDriverSummaries().map((summary) => summary.driver);
  const defaultDriverA = params.driverA?.toUpperCase() ?? drivers[0] ?? "LEC";
  const defaultDriverB = params.driverB?.toUpperCase() ?? drivers.find((driver) => driver !== defaultDriverA) ?? "HAM";
  const comparison = getDriverComparison(defaultDriverA, defaultDriverB);

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ v0.4</div>
            <h1>Driver compare.</h1>
            <p>Pick two drivers and compare shared-event pace, rank, best lap, and clean-lap volume.</p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/drivers">Drivers</Link>
            <Link className="ghostLink" href="/">Dashboard</Link>
          </div>
        </section>

        <Suspense fallback={<div className="panel">Loading compare picker…</div>}>
          <ComparePicker drivers={drivers} defaultDriverA={defaultDriverA} defaultDriverB={defaultDriverB} />
        </Suspense>

        {comparison ? (
          <>
            <section className="cards compareCards">
              <div className="card"><div className="label">Matchup</div><div className="value valueSmall">{comparison.driverA} vs {comparison.driverB}</div></div>
              <div className="card"><div className="label">Shared events</div><div className="value">{comparison.events.length}</div></div>
              <div className="card"><div className="label">Median winner</div><div className="value valueSmall">{winnerLabel(comparison)}</div></div>
              <div className="card"><div className="label">Avg median gap</div><div className="value valueSmall">{signedDelta(comparison.averageMedianGapSeconds)}</div></div>
            </section>

            <section className="grid">
              <div className="panel">
                <h2>Head-to-head summary</h2>
                <table>
                  <thead><tr><th>Metric</th><th>{comparison.driverA}</th><th>{comparison.driverB}</th></tr></thead>
                  <tbody>
                    <tr><td>Median wins</td><td>{comparison.driverAWinsMedian}</td><td>{comparison.driverBWinsMedian}</td></tr>
                    <tr><td>Average pace wins</td><td>{comparison.driverAWinsAverage}</td><td>{comparison.driverBWinsAverage}</td></tr>
                    <tr><td>Average rank</td><td>{comparison.driverAAverageRank.toFixed(2)}</td><td>{comparison.driverBAverageRank.toFixed(2)}</td></tr>
                    <tr><td>Best lap</td><td>{formatLap(comparison.driverABestLapSeconds)}</td><td>{formatLap(comparison.driverBBestLapSeconds)}</td></tr>
                    <tr><td>Clean laps</td><td>{comparison.driverACleanLaps}</td><td>{comparison.driverBCleanLaps}</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="panel">
                <h2>Who was faster?</h2>
                <div className="chart">
                  {comparison.events.map((event) => (
                    <div className="compareEvent" key={event.eventId}>
                      <strong>{event.eventShortLabel}</strong>
                      <span className="small">Median: {event.fasterByMedian} ({signedDelta(event.medianGapSeconds)})</span>
                      <span className="small">Average: {event.fasterByAverage} ({signedDelta(event.averageGapSeconds)})</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel compareTablePanel">
              <div className="panelHeader">
                <div>
                  <h2>Event-by-event comparison</h2>
                  <p>Positive gaps mean {comparison.driverA} was slower than {comparison.driverB}; negative gaps mean {comparison.driverA} was faster.</p>
                </div>
              </div>
              <table>
                <thead><tr><th>Event</th><th>{comparison.driverA} rank</th><th>{comparison.driverB} rank</th><th>Median gap</th><th>Avg gap</th><th>Best-lap gap</th><th>{comparison.driverA} laps</th><th>{comparison.driverB} laps</th></tr></thead>
                <tbody>
                  {comparison.events.map((event) => (
                    <tr key={`${event.eventId}-${comparison.driverA}-${comparison.driverB}`}>
                      <td><Link className="tableLink" href={`/events/${event.eventId}`}>{event.eventShortLabel}</Link></td>
                      <td className="rank">{event.driverA.rank}</td>
                      <td className="rank">{event.driverB.rank}</td>
                      <td>{signedDelta(event.medianGapSeconds)}</td>
                      <td>{signedDelta(event.averageGapSeconds)}</td>
                      <td>{signedDelta(event.bestLapGapSeconds)}</td>
                      <td>{event.driverA.laps_counted}</td>
                      <td>{event.driverB.laps_counted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        ) : (
          <section className="panel">
            <h2>No shared-event comparison yet</h2>
            <p className="team">Pick two different drivers that both appear in at least one loaded event.</p>
          </section>
        )}
      </div>
    </main>
  );
}
