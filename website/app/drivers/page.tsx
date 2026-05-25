import Link from "next/link";

import { formatLap } from "@/lib/f1-utils";
import { getAllDriverSummaries } from "@/lib/drivers";

export const metadata = {
  title: "Drivers · GridIQ",
  description: "Driver race pace summaries across loaded GridIQ events.",
};

export default function DriversPage() {
  const drivers = getAllDriverSummaries();

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ v0.3</div>
            <h1>Driver detail index.</h1>
            <p>Compare each driver's average race pace across the currently loaded Monza and Silverstone datasets.</p>
          </div>
          <Link className="ghostLink" href="/">Back to dashboard</Link>
        </section>

        <section className="panel">
          <table>
            <thead><tr><th>Driver</th><th>Team</th><th>Events</th><th>Best rank</th><th>Avg rank</th><th>Avg pace</th><th>Total laps</th></tr></thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.driver}>
                  <td><Link className="tableLink" href={`/drivers/${driver.driver.toLowerCase()}`}>{driver.driver}</Link></td>
                  <td className="team">{driver.team}</td>
                  <td>{driver.events_counted}</td>
                  <td>{driver.best_rank}</td>
                  <td>{driver.average_rank.toFixed(2)}</td>
                  <td>{formatLap(driver.average_pace_seconds)}</td>
                  <td>{driver.total_laps_counted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="footer">Driver pages: /drivers/lec, /drivers/ham, /drivers/ver, and every loaded driver code.</div>
      </div>
    </main>
  );
}
