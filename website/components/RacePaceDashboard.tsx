"use client";

import { useState } from "react";
import Link from "next/link";

import { EventExplorer } from "@/components/EventExplorer";
import { formatGap, formatLap } from "@/lib/f1-utils";
import type { DriverLapTrace, EventOption, PitStopSummary, QualifyingRaceComparison, RacePaceRow, RaceSummary, StintSummary, TyreUsageSummary } from "@/lib/types";

type Props = {
  event: EventOption;
  pace: RacePaceRow[];
  summary: RaceSummary | null;
  events: EventOption[];
  stints: StintSummary[];
  lapTraces: DriverLapTrace[];
  pitStops: PitStopSummary[];
  tyreUsage: TyreUsageSummary[];
  qualifyingComparison: QualifyingRaceComparison[];
  strategies?: unknown[];
};

function compoundClass(compound: string): string {
  return `compound compound-${compound.toLowerCase()}`;
}

function eventYear(event: EventOption) {
  const match = event.id.match(/^(\d{4})-/);
  return match?.[1] ?? "2024";
}

function defaultCompareHref(pace: RacePaceRow[]) {
  const first = pace[0]?.driver?.toLowerCase();
  const second = pace[1]?.driver?.toLowerCase();

  if (first && second) {
    return `/compare?driverA=${first}&driverB=${second}`;
  }

  return "/compare?driverA=lewis-hamilton&driverB=max-verstappen";
}

function finalClassificationWinner(event: EventOption) {
  if (event.id === "2024-monza-race") {
    return {
      code: "LEC",
      name: "Charles Leclerc",
      team: "Ferrari",
      href: "/drivers/lec",
    };
  }

  if (event.id === "2024-silverstone-race") {
    return {
      code: "HAM",
      name: "Lewis Hamilton",
      team: "Mercedes",
      href: "/drivers/ham",
    };
  }

  return null;
}

function groupEventsByYear(events: EventOption[]) {
  return events.reduce<Record<number, EventOption[]>>((groups, option) => {
    groups[option.year] = [...(groups[option.year] ?? []), option];
    return groups;
  }, {});
}

type IntelligenceCard = {
  label: string;
  title: string;
  body: string;
};

function formatDelta(delta: number): string {
  if (delta === 0) return "level";
  return delta > 0 ? `lost ${delta} spots` : `gained ${Math.abs(delta)} spots`;
}

function buildRaceIntelligence({
  event,
  pace,
  stints,
  pitStops,
  tyreUsage,
  qualifyingComparison,
}: {
  event: EventOption;
  pace: RacePaceRow[];
  stints: StintSummary[];
  pitStops: PitStopSummary[];
  tyreUsage: TyreUsageSummary[];
  qualifyingComparison: QualifyingRaceComparison[];
}): IntelligenceCard[] {
  const leader = pace[0];
  const closestChaser = pace[1];
  const bestStint = stints[0];
  const mostUsedTyre = [...tyreUsage].sort((a, b) => b.laps - a.laps)[0];
  const biggestRaceGain = [...qualifyingComparison].sort((a, b) => a.rankDelta - b.rankDelta)[0];
  const biggestRaceDrop = [...qualifyingComparison].sort((a, b) => b.rankDelta - a.rankDelta)[0];
  const earliestStop = [...pitStops]
    .filter((stop) => Number.isFinite(stop.pitInLap))
    .sort((a, b) => a.pitInLap - b.pitInLap)[0];

  const cards: IntelligenceCard[] = [];

  if (leader) {
    cards.push({
      label: "Race pace leader",
      title: `${leader.driver} set the benchmark`,
      body: closestChaser
        ? `${leader.driver} led ${event.shortLabel} on average clean-lap pace at ${formatLap(leader.average_lap_seconds)}, with ${closestChaser.driver} next at ${formatGap(closestChaser.gap_to_best_avg_seconds)}.`
        : `${leader.driver} led ${event.shortLabel} on average clean-lap pace at ${formatLap(leader.average_lap_seconds)}.`,
    });
  }

  if (biggestRaceGain) {
    cards.push({
      label: "Saturday vs Sunday",
      title: `${biggestRaceGain.driver} improved most on race pace`,
      body: `${biggestRaceGain.driver} qualified P${biggestRaceGain.qualifyingRank} but ranked P${biggestRaceGain.racePaceRank} on Sunday pace, a ${formatDelta(biggestRaceGain.rankDelta)} swing.`,
    });
  }

  if (biggestRaceDrop && biggestRaceDrop.driver !== biggestRaceGain?.driver) {
    cards.push({
      label: "Pace warning",
      title: `${biggestRaceDrop.driver} slipped on race pace`,
      body: `${biggestRaceDrop.driver} qualified P${biggestRaceDrop.qualifyingRank} but ranked P${biggestRaceDrop.racePaceRank} on Sunday pace, a ${formatDelta(biggestRaceDrop.rankDelta)} swing.`,
    });
  }

  if (bestStint) {
    cards.push({
      label: "Best stint",
      title: `${bestStint.driver} on ${bestStint.compound}`,
      body: `The strongest counted stint was ${bestStint.driver}'s ${bestStint.compound} run from laps ${bestStint.from_lap}-${bestStint.to_lap}, averaging ${formatLap(bestStint.average_lap_seconds)} across ${bestStint.laps} laps.`,
    });
  }

  if (earliestStop) {
    cards.push({
      label: "Strategy trigger",
      title: `${earliestStop.driver} stopped earliest`,
      body: `${earliestStop.driver} made the first detected stop window, pitting around lap ${earliestStop.pitInLap} and switching from ${earliestStop.fromCompound} to ${earliestStop.toCompound}.`,
    });
  }

  if (mostUsedTyre) {
    cards.push({
      label: "Tyre mix",
      title: `${mostUsedTyre.compound} carried the race sample`,
      body: `${mostUsedTyre.compound} accounted for ${Math.round(mostUsedTyre.share * 100)}% of clean counted laps, with ${mostUsedTyre.laps} laps across ${mostUsedTyre.drivers} drivers.`,
    });
  }

  return cards.slice(0, 6);
}

function CopyableInsightCard({ event, card }: { event: EventOption; card: IntelligenceCard }) {
  const [copied, setCopied] = useState(false);

  const copyText = `GridIQ insight — ${event.shortLabel} — ${card.label}: ${card.title}. ${card.body}`;

  async function copyInsight() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="insightCard">
      <div className="label">{card.label}</div>
      <h3>{card.title}</h3>
      <p>{card.body}</p>
      <button
        type="button"
        className={copied ? "copyInsight copied" : "copyInsight"}
        onClick={copyInsight}
        aria-label={`Copy ${card.label} insight`}
      >
        {copied ? "Copied" : "Copy insight"}
      </button>
    </article>
  );
}

export function RacePaceDashboard({ event, pace, summary, events, stints, lapTraces, pitStops, tyreUsage, qualifyingComparison }: Props) {
  const fastestAverage = pace[0]?.average_lap_seconds ?? 0;
  const slowestAverage = pace.at(-1)?.average_lap_seconds ?? fastestAverage;
  const spread = Math.max(slowestAverage - fastestAverage, 0.001);
  const allTraceSeconds = lapTraces.flatMap((trace) => trace.laps.map((lap) => lap.seconds));
  const traceMin = Math.min(...allTraceSeconds);
  const traceMax = Math.max(...allTraceSeconds);
  const traceRange = Math.max(traceMax - traceMin, 0.001);
  const intelligenceCards = buildRaceIntelligence({
    event,
    pace,
    stints,
    pitStops,
    tyreUsage,
    qualifyingComparison,
  });

  const year = eventYear(event);
  const paceLeader = pace[0];
  const secondFastest = pace[1];
  const bestStint = stints[0];
  const mostUsedTyre = [...tyreUsage].sort((a, b) => b.laps - a.laps)[0];
  const compareHref = defaultCompareHref(pace);
  const raceWinner = finalClassificationWinner(event);
  const eventsByYear = groupEventsByYear(events);
  const sortedEventYears = Object.keys(eventsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <main className="page">
      <div className="shell">
        <section className="hero">
          <div>
            <div className="eyebrow">GridIQ race analytics · {event.session}</div>
            <h1>{event.shortLabel} race analytics.</h1>
            <p>
              {event.description} Explore clean-lap pace, qualifying-to-race movement,
              stint strength, pit windows, tyre mix, lap traces, and copyable race intelligence.
            </p>
          </div>
          <div className="heroActions">
            <Link className="ghostLink" href="/seasons">All seasons</Link>
            <Link className="ghostLink" href="/explore">Explorer</Link>
            <Link className="ghostLink" href={compareHref}>Compare leaders</Link>
          </div>
        </section>

        <details className="panel widePanel raceSelectorPanel">
          <summary className="raceYearSummary">
            <span>Switch race dashboard</span>
            <small>{events.length} race dashboards</small>
          </summary>
          <div className="raceYearContent">
            <div className="raceList" aria-label="Race events">
              {sortedEventYears.map((raceYear) => {
                const yearEvents = eventsByYear[raceYear]
                  .slice()
                  .sort((a, b) => a.shortLabel.localeCompare(b.shortLabel));

                return (
                  <details className="raceYearGroup" key={raceYear} open={raceYear === event.year}>
                    <summary className="raceYearSummary">
                      <span>{raceYear}</span>
                      <small>{yearEvents.length} race dashboards</small>
                    </summary>
                    <div className="raceYearContent">
                      <div className="raceYearLinks">
                        {yearEvents.map((option) => {
                          const href = `/events/${option.id}`;
                          const active = option.id === event.id;
                          return (
                            <Link className={active ? "raceListLink active" : "raceListLink"} href={href} key={option.id}>
                              <span>{option.shortLabel}</span>
                              <small>{option.circuit}</small>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </details>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Event research links</h2>
              <p>Jump from this race dashboard into the related historical pages.</p>
            </div>
            <div className="pill">FastF1 event dataset</div>
          </div>
          <div className="eventNav">
            <Link className="eventLink" href="/seasons">
              <span>All seasons</span>
              <small>Browse every loaded season, calendar, winners, standings, and champions</small>
            </Link>
            <Link className="eventLink" href="/drivers">
              <span>Driver database</span>
              <small>Career profiles and historical season tables</small>
            </Link>
            <Link className="eventLink" href="/constructors">
              <span>Constructor database</span>
              <small>Titles, wins, podiums, points, and active seasons</small>
            </Link>
            <Link className="eventLink" href={compareHref}>
              <span>Compare race leaders</span>
              <small>{paceLeader?.driver ?? "Leader"} vs {secondFastest?.driver ?? "closest rival"}</small>
            </Link>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Final classification</div>
            <div className="value valueSmall">{raceWinner?.code ?? "—"}</div>
            <p className="small">
              {raceWinner ? (
                <>
                  Winner: <Link className="tableLink" href={raceWinner.href}>{raceWinner.name}</Link> · {raceWinner.team}
                </>
              ) : (
                "Final race winner unavailable for this event."
              )}
            </p>
          </div>
          <div className="card">
            <div className="label">Drivers</div>
            <div className="value">{summary?.drivers ?? 0}</div>
            <p className="small">Classified drivers in the event dataset.</p>
          </div>
          <div className="card">
            <div className="label">Valid laps</div>
            <div className="value">{summary?.valid_laps_counted ?? 0}</div>
            <p className="small">Clean laps counted for pace analysis.</p>
          </div>
          <div className="card">
            <div className="label">Clean-lap pace leader</div>
            <div className="value">{paceLeader?.driver ?? summary?.leader?.driver ?? "—"}</div>
            <p className="small">
              {paceLeader ? `${formatLap(paceLeader.average_lap_seconds)} average clean-lap pace, not final classification.` : "No pace leader detected."}
            </p>
          </div>
        </section>

        <section className="cards">
          <div className="card">
            <div className="label">Closest chaser</div>
            <div className="value valueSmall">{secondFastest?.driver ?? "—"}</div>
            <p className="small">{secondFastest ? `${formatGap(secondFastest.gap_to_best_avg_seconds)} behind on average pace.` : "No comparison available."}</p>
          </div>
          <div className="card">
            <div className="label">Best stint</div>
            <div className="value valueSmall">{bestStint?.driver ?? "—"}</div>
            <p className="small">{bestStint ? `${bestStint.compound} · laps ${bestStint.from_lap}-${bestStint.to_lap}` : "No stint sample available."}</p>
          </div>
          <div className="card">
            <div className="label">Main tyre</div>
            <div className="value valueSmall">{mostUsedTyre?.compound ?? "—"}</div>
            <p className="small">{mostUsedTyre ? `${Math.round(mostUsedTyre.share * 100)}% of counted laps.` : "No tyre mix available."}</p>
          </div>
          <div className="card">
            <div className="label">Race intelligence</div>
            <div className="value">{intelligenceCards.length}</div>
            <p className="small">Copyable insight cards generated for this race.</p>
          </div>
        </section>

        <EventExplorer activeEvent={event} events={events} lapTraces={lapTraces} />

        <section className="panel widePanel intelligencePanel">
          <div className="panelHeader">
            <div>
              <h2>Race intelligence</h2>
              <p>Auto-generated takeaways from pace, qualifying, stints, pit windows, and tyre usage. Final classification is shown separately above.</p>
            </div>
            <div className="pill">copyable insight layer</div>
          </div>
          <div className="insightGrid">
            {intelligenceCards.map((card) => (
              <CopyableInsightCard
                card={card}
                event={event}
                key={`${event.id}-${card.label}-${card.title}`}
              />
            ))}
          </div>
        </section>

        <section className="grid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Clean-lap race pace ranking</h2>
                <p>{event.label} · {event.circuit} · pace ranking is separate from final classification</p>
              </div>
              <div className="panelActions">
                <Link className="ghostLink" href="/drivers">Drivers</Link>
                <Link className="ghostLink" href={compareHref}>Compare leaders</Link>
                <Link className="ghostLink" href="/seasons">All seasons</Link>
              </div>
            </div>
            <table>
              <thead><tr><th>#</th><th>Driver</th><th>Team</th><th>Avg</th><th>Gap</th><th>Median</th><th>Best</th><th>Laps</th></tr></thead>
              <tbody>
                {pace.map((row) => (
                  <tr key={`${event.id}-${row.driver}`}>
                    <td className="rank">{row.rank}</td>
                    <td><Link className="tableLink" href={`/drivers/${row.driver.toLowerCase()}`}>{row.driver}</Link></td>
                    <td className="team">{row.team}</td>
                    <td>{formatLap(row.average_lap_seconds)}</td>
                    <td>{formatGap(row.gap_to_best_avg_seconds)}</td>
                    <td>{formatLap(row.median_lap_seconds)}</td>
                    <td>{formatLap(row.best_lap_seconds)}</td>
                    <td>{row.laps_counted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <h2>Average pace gap</h2>
            <div className="chart">
              {pace.slice(0, 10).map((row) => {
                const width = 100 - ((row.average_lap_seconds - fastestAverage) / spread) * 78;
                return (
                  <div className="barRow" key={`${event.id}-bar-${row.driver}`}>
                    <strong>{row.driver}</strong>
                    <div className="barTrack"><div className="bar" style={{ width: `${Math.max(width, 18)}%` }} /></div>
                    <span className="small">+{row.gap_to_best_avg_seconds.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="panel widePanel">
          <div className="panelHeader">
            <div>
              <h2>Qualifying vs race pace</h2>
              <p>Saturday one-lap rank compared with Sunday clean-lap race pace rank.</p>
            </div>
          </div>
          <table>
            <thead><tr><th>Driver</th><th>Team</th><th>Quali</th><th>Race pace</th><th>Rank swing</th><th>Quali gap</th><th>Race gap</th><th>Saturday lap</th><th>Sunday avg</th></tr></thead>
            <tbody>
              {qualifyingComparison.slice(0, 12).map((row) => (
                <tr key={`${event.id}-quali-race-${row.driver}`}>
                  <td><Link className="tableLink" href={`/drivers/${row.driver.toLowerCase()}`}>{row.driver}</Link></td>
                  <td className="team">{row.team}</td>
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

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Best stints</h2>
                <p>Fastest tyre runs with 3+ valid laps counted.</p>
              </div>
            </div>
            <table>
              <thead><tr><th>Driver</th><th>Tyre</th><th>Stint</th><th>Laps</th><th>Range</th><th>Avg</th><th>Best</th></tr></thead>
              <tbody>
                {stints.map((stint) => (
                  <tr key={`${event.id}-${stint.driver}-${stint.stint}`}>
                    <td><Link className="tableLink" href={`/drivers/${stint.driver.toLowerCase()}`}>{stint.driver}</Link></td>
                    <td><span className={compoundClass(stint.compound)}>{stint.compound}</span></td>
                    <td>{stint.stint}</td>
                    <td>{stint.laps}</td>
                    <td>{stint.from_lap}-{stint.to_lap}</td>
                    <td>{formatLap(stint.average_lap_seconds)}</td>
                    <td>{formatLap(stint.best_lap_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Lap trace</h2>
                <p>Mini pace map for the first eight classified drivers.</p>
              </div>
            </div>
            <div className="traceList">
              {lapTraces.map((trace) => (
                <div className="traceRow" key={`${event.id}-trace-${trace.driver}`}>
                  <div className="traceDriver">
                    <Link className="tableLink" href={`/drivers/${trace.driver.toLowerCase()}`}>{trace.driver}</Link>
                    <small>{trace.team}</small>
                  </div>
                  <div className="traceDots" aria-label={`${trace.driver} lap trace`}>
                    {trace.laps.filter((_, index) => index % 3 === 0).map((lap) => {
                      const intensity = 1 - (lap.seconds - traceMin) / traceRange;
                      const height = 8 + intensity * 24;
                      return (
                        <span
                          className={compoundClass(lap.compound)}
                          key={`${trace.driver}-${lap.lap}`}
                          title={`Lap ${lap.lap}: ${formatLap(lap.seconds)} on ${lap.compound}`}
                          style={{ height: `${height}px` }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid analyticsGrid">
          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Pit stop windows</h2>
                <p>Detected from FastF1 pit-out laps, with tyre-change context.</p>
              </div>
            </div>
            <table>
              <thead><tr><th>Driver</th><th>Stop</th><th>In</th><th>Out</th><th>From</th><th>To</th><th>Tyre age</th></tr></thead>
              <tbody>
                {pitStops.slice(0, 16).map((stop) => (
                  <tr key={`${event.id}-${stop.driver}-stop-${stop.stopNumber}`}>
                    <td><Link className="tableLink" href={`/drivers/${stop.driver.toLowerCase()}`}>{stop.driver}</Link></td>
                    <td>{stop.stopNumber}</td>
                    <td>{stop.pitInLap}</td>
                    <td>{stop.pitOutLap}</td>
                    <td><span className={compoundClass(stop.fromCompound)}>{stop.fromCompound}</span></td>
                    <td><span className={compoundClass(stop.toCompound)}>{stop.toCompound}</span></td>
                    <td>{stop.newTyreLife ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panelHeader">
              <div>
                <h2>Tyre mix</h2>
                <p>Clean-lap distribution by compound.</p>
              </div>
            </div>
            <div className="chart">
              {tyreUsage.map((compound) => (
                <div className="tyreMixRow" key={`${event.id}-${compound.compound}`}>
                  <div className="tyreMixLabel">
                    <span className={compoundClass(compound.compound)}>{compound.compound}</span>
                    <small>{compound.laps} laps · {compound.drivers} drivers</small>
                  </div>
                  <div className="barTrack">
                    <div className="bar tyreMixBar" style={{ width: `${Math.max(compound.share * 100, 8)}%` }} />
                  </div>
                  <div className="small">{Math.round(compound.share * 100)}% · best {formatLap(compound.bestLapSeconds)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="footer">
          Generated from FastF1 event data and connected to the GridIQ historical database. Final classification is shown separately from clean-lap pace ranking because the fastest average race pace sample does not always equal the race winner.
        </div>
      </div>
    </main>
  );
}
