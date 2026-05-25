import { getPitStopsByEvent, getStintSummariesByEvent } from "./laps";
import { getRacePaceByEvent } from "./static-data";
import type { DriverStrategy, StrategyStint } from "./types";

function stintWidth(stint: StrategyStint, raceLapCount: number): number {
  const span = Math.max(stint.toLap - stint.fromLap + 1, 1);
  return Math.max((span / Math.max(raceLapCount, 1)) * 100, 3);
}

export function getStrategyTimelineByEvent(eventId: string): DriverStrategy[] {
  const paceRows = getRacePaceByEvent(eventId);
  const stints = getStintSummariesByEvent(eventId, Number.POSITIVE_INFINITY);
  const stops = getPitStopsByEvent(eventId);
  const maxLapFromStints = Math.max(...stints.map((stint) => stint.to_lap), 0);
  const maxLapFromStops = Math.max(...stops.map((stop) => stop.pitOutLap), 0);
  const raceLapCount = Math.max(maxLapFromStints, maxLapFromStops, 1);

  return paceRows.slice(0, 12).flatMap((paceRow) => {
    const driverStints = stints
      .filter((stint) => stint.driver === paceRow.driver)
      .sort((a, b) => a.from_lap - b.from_lap)
      .map((stint) => ({
        stint: stint.stint,
        compound: stint.compound,
        fromLap: stint.from_lap,
        toLap: stint.to_lap,
        laps: stint.laps,
        averageLapSeconds: stint.average_lap_seconds,
        bestLapSeconds: stint.best_lap_seconds,
      }));

    if (driverStints.length === 0) return [];

    const driverStops = stops
      .filter((stop) => stop.driver === paceRow.driver)
      .sort((a, b) => a.pitInLap - b.pitInLap)
      .map((stop) => ({
        stopNumber: stop.stopNumber,
        pitInLap: stop.pitInLap,
        pitOutLap: stop.pitOutLap,
        fromCompound: stop.fromCompound,
        toCompound: stop.toCompound,
      }));

    const fastestStint = [...driverStints].sort((a, b) => a.averageLapSeconds - b.averageLapSeconds)[0];
    const tyrePlan = driverStints.map((stint) => stint.compound).join(" → ");
    const stopLabel = driverStops.length === 1 ? "1 stop" : `${driverStops.length} stops`;

    return [{
      driver: paceRow.driver,
      team: paceRow.team,
      racePaceRank: paceRow.rank,
      raceLapCount,
      stints: driverStints.map((stint) => ({
        ...stint,
        widthPercent: stintWidth(stint, raceLapCount),
      })),
      pitStops: driverStops,
      summary: `${stopLabel} · ${tyrePlan} · best stint ${fastestStint.compound} laps ${fastestStint.fromLap}-${fastestStint.toLap}`,
    }];
  });
}
