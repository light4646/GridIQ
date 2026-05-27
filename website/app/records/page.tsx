import Link from "next/link";
import type { Metadata } from "next";

import F1TVBanner from "@/components/F1TVBanner";
import AdUnit from "@/components/AdUnit";
import { ADSENSE } from "@/lib/monetization";
import { aggregateRecords, formatNumber, getHistoryManifest } from "@/lib/history";

export const metadata: Metadata = {
  title: "F1 Records — Wins, Podiums, Poles, Points · GridIQ",
  description:
    "Formula 1 all-time records: most race wins, podiums, pole positions, and points by driver and constructor across the full historical database. Updated through 2026.",
  keywords: [
    "F1 most wins record",
    "Formula 1 records",
    "F1 most podiums",
    "F1 most poles",
    "most F1 points all time",
    "F1 constructor records",
    "Hamilton wins record",
    "Verstappen wins",
  ],
  openGraph: {
    title: "F1 Records — Wins, Podiums, Poles, Points · GridIQ",
    description: "Formula 1 all-time records by driver and constructor from 1950 to 2026.",
  },
};

type RecordRow = Record<string, string | number>;

function RecordsTable({
  title,
  rows,
  nameKey,
  statKey,
  statLabel,
}: {
  title: string;
  rows: RecordRow[];
  nameKey: string;
  statKey: string;
  statLabel: string;
}) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <div>
          <h2>{title}</h2>
          <p>All-time, using loaded historical results from the full database.</p>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>{statLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 15).map((row, index) => (
            <tr key={`${title}-${String(row[nameKey])}`}>
              <td className="rank">{index + 1}</td>
              <td>{String(row[nameKey])}</td>
              <td>{formatNumber(Number(row[statKey]))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecordsPage() {
  const manifest = getHistoryManifest();
  const records = aggregateRecords();

  return (
    <main className="page">
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ records</div>
            <h1>F1 records — wins, podiums, poles, and points.</h1>
            <p>
              All-time Formula 1 records for wins, podiums, pole positions, points, and constructor
              totals calculated from the GridIQ historical database covering {manifest.start_year}–{manifest.end_year}.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/seasons">Seasons</Link>
            <Link className="ghostLink" href="/">Home</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Range</div>
            <div className="value valueSmall">{manifest.start_year}–{manifest.end_year}</div>
          </div>
          <div className="card">
            <div className="label">Seasons</div>
            <div className="value">{manifest.seasons.length}</div>
          </div>
          <div className="card">
            <div className="label">Through</div>
            <div className="value valueSmall">{manifest.through_date}</div>
          </div>
          <div className="card">
            <div className="label">Failures</div>
            <div className="value">{manifest.failures.length}</div>
          </div>
        </section>

        <section className="grid analyticsGrid">
          <RecordsTable
            title="Most driver wins"
            rows={records.driverWins}
            nameKey="driver"
            statKey="wins"
            statLabel="Wins"
          />
          <RecordsTable
            title="Most podiums"
            rows={records.driverPodiums}
            nameKey="driver"
            statKey="podiums"
            statLabel="Podiums"
          />
        </section>

        <section className="grid analyticsGrid">
          <RecordsTable
            title="Most points"
            rows={records.driverPoints}
            nameKey="driver"
            statKey="points"
            statLabel="Points"
          />
          <RecordsTable
            title="Most poles"
            rows={records.driverPoles}
            nameKey="driver"
            statKey="poles"
            statLabel="Poles"
          />
        </section>

        <AdUnit slot={ADSENSE.slots.inContent} />

        <section className="grid analyticsGrid">
          <RecordsTable
            title="Constructor wins"
            rows={records.constructorWins}
            nameKey="constructor"
            statKey="wins"
            statLabel="Wins"
          />
          <RecordsTable
            title="Constructor points"
            rows={records.constructorPoints}
            nameKey="constructor"
            statKey="points"
            statLabel="Points"
          />
        </section>
        <F1TVBanner />
      </div>
    </main>
  );
}
