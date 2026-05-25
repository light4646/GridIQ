import Link from "next/link";
import { notFound } from "next/navigation";

import { formatGap, formatLap } from "@/lib/f1-utils";
import { getAllDriverSummaries, getDriverSummary } from "@/lib/drivers";

type Props = {
  params: Promise<{
    driver: string;
  }>;
};

export function generateStaticParams() {
  return getAllDriverSummaries().map((summary) => ({ driver: summary.driver.toLowerCase() }));
}

export async function generateMetadata({ params }: Props) {
  const { driver } = await params;
  const summary = getDriverSummary(driver);
  if (!summary) return { title: "Driver not found · GridIQ" };

  return {
    title: `${summary.driver} driver detail · GridIQ`,
    description: `${summary.driver} race pace across loaded GridIQ events.`,
  };
}

export default async function DriverDetailPage({ params }: Props) {
  const { driver } = await params;
  const summary = getDriverSummary(driver);
  if (!summary) notFound();
  const comparisonOpponent = summary.driver === "HAM" ? "lec" : "ham";

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">Driver detail</div>
            <h1>{summary.driver}</h1>
            <p>{summary.team} · {summary.events_counted} loaded race events</p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/drivers">All drivers</Link>
            <Link className="ghostLink" href={`/compare?driverA=${summary.driver.toLowerCase()}&driverB=${comparisonOpponent}`}>Compare</Link>
            <Link className="ghostLink" href="/">Dashboard</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card"><div className="label">Events</div><div className="value">{summary.events_counted}</div></div>
          <div className="card"><div className="label">Best rank</div><div className="value">{summary.best_rank}</div></div>
          <div className="card"><div className="label">Avg rank</div><div className="value">{summary.average_rank.toFixed(2)}</div></div>
          <div className="card"><div className="label">Avg pace</div><div className="value valueSmall">{formatLap(summary.average_pace_seconds)}</div></div>
        </section>

        <section className="grid">
          <div className="panel">
            <h2>{summary.driver} across events</h2>
            <table>
              <thead><tr><th>Event</th><th>Rank</th><th>Team</th><th>Avg</th><th>Gap</th><th>Median</th><th>Best</th><th>Laps</th></tr></thead>
              <tbody>
                {summary.results.map((result) => (
                  <tr key={`${summary.driver}-${result.event.id}`}>
                    <td><Link className="tableLink" href={`/events/${result.event.id}`}>{result.event.shortLabel}</Link></td>
                    <td className="rank">{result.rank}</td>
                    <td className="team">{result.team}</td>
                    <td>{formatLap(result.average_lap_seconds)}</td>
                    <td>{formatGap(result.gap_to_best_avg_seconds)}</td>
                    <td>{formatLap(result.median_lap_seconds)}</td>
                    <td>{formatLap(result.best_lap_seconds)}</td>
                    <td>{result.laps_counted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h2>Rank trend</h2>
            <div className="chart">
              {summary.results.map((result) => {
                const width = Math.max(18, 100 - (result.rank - 1) * 4);
                return (
                  <div className="barRow" key={`${summary.driver}-trend-${result.event.id}`}>
                    <strong>{result.event.circuit.slice(0, 3).toUpperCase()}</strong>
                    <div className="barTrack"><div className="bar" style={{ width: `${width}%` }} /></div>
                    <span className="small">P{result.rank}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Saturday vs Sunday</h2>
              <p>Qualifying position against race-pace ranking for each loaded event.</p>
            </div>
          </div>
          <table>
            <thead><tr><th>Event</th><th>Quali</th><th>Race pace</th><th>Rank swing</th><th>Quali gap</th><th>Race gap</th><th>Best quali lap</th><th>Race avg</th></tr></thead>
            <tbody>
              {summary.qualifyingComparison.map((row) => (
                <tr key={`${summary.driver}-saturday-sunday-${row.event.id}`}>
                  <td><Link className="tableLink" href={`/events/${row.event.id}`}>{row.event.shortLabel}</Link></td>
                  <td className="rank">P{row.qualifyingRank}</td>
                  <td>P{row.racePaceRank}</td>
                  <td className={row.rankDelta > 0 ? "deltaNegative" : row.rankDelta < 0 ? "deltaPositive" : "team"}>
                    {row.rankDelta === 0 ? "—" : row.rankDelta > 0 ? `-${row.rankDelta}` : `+${Math.abs(row.rankDelta)}`}
                  </td>
                  <td>{formatGap(row.qualifyingGapSeconds)}</td>
                  <td>{formatGap(row.racePaceGapSeconds)}</td>
                  <td>{formatLap(row.qualifyingLapSeconds)}</td>
                  <td>{formatLap(row.raceAverageLapSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="footer">Total counted laps: {summary.total_laps_counted}. No cloud backend yet; all stats are from local JSON exports.</div>
      </div>
    </main>
  );
}
