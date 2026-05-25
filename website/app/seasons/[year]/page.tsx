import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatNumber,
  getAvailableSeasonYears,
  getConstructorStandings,
  getDriverStandings,
  getRaceWinners,
  getSeasonSchedule,
  getSeasonSummary,
} from "@/lib/history";

function getConstructorName(row: { constructor?: unknown; constructor_id?: unknown }) {
  if (
    Object.prototype.hasOwnProperty.call(row, "constructor") &&
    typeof row.constructor === "string" &&
    row.constructor.length > 0
  ) {
    return row.constructor;
  }

  if (typeof row.constructor_id === "string" && row.constructor_id.length > 0) {
    return row.constructor_id;
  }

  return "—";
}

type PageProps = {
  params: Promise<{
    year: string;
  }>;
};

export function generateStaticParams() {
  return getAvailableSeasonYears().map((year) => ({
    year: String(year),
  }));
}

export default async function SeasonDetailPage({ params }: PageProps) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);

  if (!Number.isFinite(year) || !getAvailableSeasonYears().includes(year)) {
    notFound();
  }

  const summary = getSeasonSummary(year);
  const schedule = getSeasonSchedule(year);
  const driverStandings = getDriverStandings(year);
  const constructorStandings = getConstructorStandings(year);
  const raceWinners = getRaceWinners(year);

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ season profile</div>
            <h1>{year} Formula 1 season.</h1>
            <p>
              Season calendar, race winners, driver standings, and constructor standings
              from the GridIQ historical database.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/seasons">All seasons</Link>
            <Link className="ghostLink" href="/records">Records</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Races</div>
            <div className="value">{summary.races}</div>
          </div>
          <div className="card">
            <div className="label">Driver champion</div>
            <div className="value valueSmall">{summary.driver_champion?.driver_name ?? "—"}</div>
          </div>
          <div className="card">
            <div className="label">Constructor champion</div>
            <div className="value valueSmall">
              {summary.constructor_champion ? getConstructorName(summary.constructor_champion) : "—"}
            </div>
          </div>
          <div className="card">
            <div className="label">Race rows</div>
            <div className="value">{formatNumber(summary.race_results)}</div>
          </div>
        </section>

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Race winners</h2>
                <p>Grand Prix winners in round order.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Grand Prix</th>
                  <th>Winner</th>
                  <th>Constructor</th>
                </tr>
              </thead>
              <tbody>
                {raceWinners.map((winner) => (
                  <tr key={`${winner.year}-${winner.round}`}>
                    <td>{winner.round}</td>
                    <td>{winner.event_name}</td>
                    <td>{winner.driver_name}</td>
                    <td>{getConstructorName(winner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Calendar</h2>
                <p>{schedule.length} completed races loaded.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Race</th>
                  <th>Circuit</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((race) => (
                  <tr key={race.event_id}>
                    <td>{race.round}</td>
                    <td>{race.event_name}</td>
                    <td>{race.circuit_name ?? "—"}</td>
                    <td>{race.date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Driver standings</h2>
                <p>Final/current standings for the selected season.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Driver</th>
                  <th>Team(s)</th>
                  <th>Wins</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {driverStandings.slice(0, 20).map((driver) => (
                  <tr key={`${driver.position}-${driver.driver_id}`}>
                    <td className="rank">{driver.position}</td>
                    <td>{driver.driver_name}</td>
                    <td className="team">{driver.constructors?.join(" / ") ?? "—"}</td>
                    <td>{driver.wins}</td>
                    <td>{formatNumber(driver.points)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Constructor standings</h2>
                <p>Final/current constructor table.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Constructor</th>
                  <th>Wins</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {constructorStandings.map((constructorRow) => (
                  <tr key={`${constructorRow.position}-${constructorRow.constructor_id ?? getConstructorName(constructorRow)}`}>
                    <td className="rank">{constructorRow.position}</td>
                    <td>{getConstructorName(constructorRow)}</td>
                    <td>{constructorRow.wins}</td>
                    <td>{formatNumber(constructorRow.points)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="footer">
          Source: {summary.source}. Generated through {summary.through_date}.
        </div>
      </div>
    </main>
  );
}
