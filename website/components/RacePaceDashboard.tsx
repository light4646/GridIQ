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

  return (
    <main className="page">
      <div className="shell">
        <section className="hero">
          <div>
            <div className="eyebrow">GridIQ MVP · {event.session}</div>
            <h1>F1 race pace, made readable.</h1>
            <p>{event.description}</p>
          </div>
          <div className="pill">Local FastF1 data · event selector live</div>
        </section>

        <nav className="eventNav" aria-label="Race events">
          {events.map((option) => {
            const href = option.id === "2024-monza-race" ? "/" : `/events/${option.id}`;
            const active = option.id === event.id;
            return (
              <Link className={active ? "eventLink active" : "eventLink"} href={href} key={option.id}>
                <span>{option.shortLabel}</span>
                <small>{option.circuit}</small>
              </Link>
            );
          })}
        </nav>

        <section className="cards">
          <div className="card"><div className="label">Event</div><div className="value valueSmall">{event.shortLabel}</div></div>
          <div className="card"><div className="label">Drivers</div><div className="value">{summary?.drivers ?? 0}</div></div>
          <div className="card"><div className="label">Valid laps</div><div className="value">{summary?.valid_laps_counted ?? 0}</div></div>
          <div className="card"><div className="label">Pace leader</div><div className="value">{summary?.leader?.driver ?? "—"}</div></div>
        </section>

        <EventExplorer activeEvent={event} events={events} lapTraces={lapTraces} />

        <section className="panel widePanel intelligencePanel">
          <div className="panelHeader">
            <div>
              <h2>Race intelligence</h2>
              <p>Auto-generated takeaways from pace, qualifying, stints, pit windows, and tyre usage.</p>
            </div>
            <div className="pill">v0.9 insight layer</div>
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
                <h2>Race pace ranking</h2>
                <p>{event.label} · {event.circuit}</p>
              </div>
              <div className="panelActions">
                <Link className="ghostLink" href="/drivers">Drivers</Link>
                <Link className="ghostLink" href="/compare">Compare</Link>
                <Link className="ghostLink" href={`/events/${event.id}`}>Open detail</Link>
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
          Generated from FastF1. Now supports multiple race datasets, qualifying-vs-race comparisons, driver pages, stint tables, lap traces, pit windows, and tyre-mix analytics.
        </div>
      </div>
    </main>
  );
}
