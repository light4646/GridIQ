import Link from "next/link";
import type { Metadata } from "next";

import { getHistoryManifest } from "@/lib/history";
import F1TVBanner from "@/components/F1TVBanner";
import AdUnit from "@/components/AdUnit";
import { ADSENSE } from "@/lib/monetization";

export const metadata: Metadata = {
  title: "F1 World Champions 1950–2026 · GridIQ",
  description:
    "Complete list of every Formula 1 World Drivers' Champion and Constructors' Champion from 1950 to 2026. See wins, points, teams, and season profiles.",
  keywords: [
    "F1 world champions",
    "Formula 1 world champions list",
    "F1 drivers championship winners",
    "Formula 1 constructors champions",
    "F1 champion every year",
    "who won the F1 championship",
    "Formula 1 history champions",
  ],
  openGraph: {
    title: "F1 World Champions 1950–2026 · GridIQ",
    description: "Every Formula 1 World Drivers' Champion and Constructors' Champion from 1950 to 2026.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Formula 1 World Champions 1950–2026",
  description: "Complete list of every F1 World Drivers' Champion and Constructors' Champion from 1950 to 2026.",
  url: "https://gridiq-live.vercel.app/champions",
  creator: { "@type": "Organization", name: "GridIQ" },
};

export default function ChampionsPage() {
  const manifest = getHistoryManifest();
  const seasons = [...manifest.seasons].sort((a, b) => b.year - a.year);

  const driverChampions = seasons.filter((s) => s.driver_champion);
  const multiChampions = new Map<string, number>();
  for (const s of seasons) {
    if (s.driver_champion?.driver_name) {
      const name = s.driver_champion.driver_name;
      multiChampions.set(name, (multiChampions.get(name) ?? 0) + 1);
    }
  }
  const topChampions = [...multiChampions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const constructorWins = new Map<string, number>();
  for (const s of seasons) {
    if (s.constructor_champion?.constructor) {
      const name = s.constructor_champion.constructor;
      constructorWins.set(name, (constructorWins.get(name) ?? 0) + 1);
    }
  }
  const topConstructors = [...constructorWins.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="shell">
        <section className="hero compactHero">
          <div>
            <div className="eyebrow">GridIQ · Formula 1 championship history</div>
            <h1>F1 World Champions, 1950–2026.</h1>
            <p>
              Every Formula 1 World Drivers&apos; Champion and Constructors&apos; Champion since the
              inaugural 1950 season. Browse champion profiles, wins, points, and full season breakdowns.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/seasons">All seasons</Link>
            <Link className="ghostLink" href="/records">Records</Link>
            <Link className="ghostLink" href="/drivers">Drivers</Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Seasons</div>
            <div className="value">{driverChampions.length}</div>
            <p className="small">F1 seasons with a crowned world champion.</p>
          </div>
          <div className="card">
            <div className="label">Unique champions</div>
            <div className="value">{multiChampions.size}</div>
            <p className="small">Different drivers who have won the title.</p>
          </div>
          <div className="card">
            <div className="label">Most titles</div>
            <div className="value">{topChampions[0]?.[1] ?? "—"}</div>
            <p className="small">{topChampions[0]?.[0] ?? "—"}</p>
          </div>
          <div className="card">
            <div className="label">Most constructor titles</div>
            <div className="value">{topConstructors[0]?.[1] ?? "—"}</div>
            <p className="small">{topConstructors[0]?.[0] ?? "—"}</p>
          </div>
        </section>

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Most driver championships</h2>
                <p>Drivers with the most Formula 1 World Championship titles.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>#</th><th>Driver</th><th>Titles</th></tr>
              </thead>
              <tbody>
                {topChampions.map(([name, titles], index) => (
                  <tr key={name}>
                    <td className="rank">{index + 1}</td>
                    <td>{name}</td>
                    <td><strong>{titles}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Most constructor championships</h2>
                <p>Teams with the most Formula 1 Constructors&apos; Championship titles.</p>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>#</th><th>Constructor</th><th>Titles</th></tr>
              </thead>
              <tbody>
                {topConstructors.map(([name, titles], index) => (
                  <tr key={name}>
                    <td className="rank">{index + 1}</td>
                    <td>{name}</td>
                    <td><strong>{titles}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <AdUnit slot={ADSENSE.slots.inContent} />

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>All F1 World Champions by season</h2>
              <p>Every drivers&apos; and constructors&apos; champion from the 1950 season to present.</p>
            </div>
            <div className="pill">{driverChampions.length} seasons</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Driver champion</th>
                <th>Team</th>
                <th>Wins</th>
                <th>Points</th>
                <th>Constructor champion</th>
                <th>Season</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => {
                const driver = season.driver_champion;
                const constructor = season.constructor_champion;
                const driverHref = driver?.driver_id
                  ? `/drivers/${driver.driver_id.replace(/_/g, "-")}`
                  : driver?.driver_code
                  ? `/drivers/${driver.driver_code.toLowerCase()}`
                  : null;

                return (
                  <tr key={season.year}>
                    <td>
                      <Link className="tableLink" href={`/seasons/${season.year}`}>
                        {season.year}
                      </Link>
                    </td>
                    <td>
                      {driver ? (
                        driverHref ? (
                          <Link className="tableLink" href={driverHref}>
                            {driver.driver_name}
                          </Link>
                        ) : (
                          driver.driver_name
                        )
                      ) : "—"}
                    </td>
                    <td className="team">{driver?.constructors?.[0] ?? "—"}</td>
                    <td>{driver?.wins ?? "—"}</td>
                    <td>{driver?.points ?? "—"}</td>
                    <td>{constructor?.constructor ?? "—"}</td>
                    <td>
                      <Link className="tableLink" href={`/seasons/${season.year}`}>
                        {season.races} races
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <F1TVBanner />

        <div className="footer">
          Champion data sourced from Jolpica/Ergast historical F1 results. GridIQ is not affiliated with Formula 1.
        </div>
      </div>
    </main>
  );
}
