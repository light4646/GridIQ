import monzaLaps from "@/public/data/monza_2024_race_laps.json";
import silverstoneLaps from "@/public/data/silverstone_2024_race_laps.json";

import type { DriverLapTrace, EventOption, FastF1LapRow, PitStopSummary, StintSummary, TyreUsageSummary } from "./types";
import { EVENT_OPTIONS } from "./static-data";

const LAP_DATA_BY_EVENT: Record<string, FastF1LapRow[]> = {
  "2024-monza-race": monzaLaps as FastF1LapRow[],
  "2024-silverstone-race": silverstoneLaps as FastF1LapRow[],
};

function validRaceLap(row: FastF1LapRow): boolean {
  return typeof row.LapTimeSeconds === "number" && row.LapTimeSeconds > 0 && row.Deleted !== true;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

export function getLapsByEvent(eventId: string): FastF1LapRow[] {
  return LAP_DATA_BY_EVENT[eventId] ?? [];
}

export function getStintSummariesByEvent(eventId: string, limit = 14): StintSummary[] {
  const groups = new Map<string, FastF1LapRow[]>();

  for (const lap of getLapsByEvent(eventId).filter(validRaceLap)) {
    const key = `${lap.Driver}-${lap.Stint}`;
    const current = groups.get(key) ?? [];
    current.push(lap);
    groups.set(key, current);
  }

  return Array.from(groups.values())
    .map((laps) => {
      const first = laps[0];
      const times = laps.map((lap) => lap.LapTimeSeconds);
      const lapNumbers = laps.map((lap) => lap.LapNumber);
      return {
        driver: first.Driver,
        team: first.Team,
        stint: first.Stint,
        compound: first.Compound ?? "UNKNOWN",
        laps: laps.length,
        from_lap: Math.min(...lapNumbers),
        to_lap: Math.max(...lapNumbers),
        average_lap_seconds: Number(average(times).toFixed(3)),
        best_lap_seconds: Number(Math.min(...times).toFixed(3)),
      };
    })
    .filter((stint) => stint.laps >= 3)
    .sort((a, b) => a.average_lap_seconds - b.average_lap_seconds)
    .slice(0, limit);
}

export function getDriverLapTracesByEvent(eventId: string, driverLimit = 8): DriverLapTrace[] {
  const event = EVENT_OPTIONS.find((option: EventOption) => option.id === eventId);
  const laps = getLapsByEvent(eventId).filter(validRaceLap);
  const drivers = Array.from(new Set(laps.map((lap) => lap.Driver))).slice(0, driverLimit);

  return drivers.map((driver) => {
    const driverLaps = laps
      .filter((lap) => lap.Driver === driver)
      .sort((a, b) => a.LapNumber - b.LapNumber)
      .map((lap) => ({
        lap: lap.LapNumber,
        seconds: Number(lap.LapTimeSeconds.toFixed(3)),
        compound: lap.Compound ?? "UNKNOWN",
      }));

    const team = laps.find((lap) => lap.Driver === driver)?.Team ?? "Unknown";
    return {
      driver,
      team,
      eventId: event?.id ?? eventId,
      laps: driverLaps,
    };
  });
}

export function getPitStopsByEvent(eventId: string): PitStopSummary[] {
  const laps = getLapsByEvent(eventId).filter(validRaceLap);
  const drivers = Array.from(new Set(laps.map((lap) => lap.Driver)));

  return drivers.flatMap((driver) => {
    const driverLaps = laps
      .filter((lap) => lap.Driver === driver)
      .sort((a, b) => a.LapNumber - b.LapNumber);

    return driverLaps
      .filter((lap) => lap.PitOutTime !== null && lap.LapNumber > 1)
      .map((outLap, index) => {
        const previousLap = driverLaps.find((lap) => lap.LapNumber === outLap.LapNumber - 1);
        return {
          driver,
          team: outLap.Team,
          stopNumber: index + 1,
          pitInLap: previousLap?.LapNumber ?? outLap.LapNumber - 1,
          pitOutLap: outLap.LapNumber,
          fromCompound: previousLap?.Compound ?? "UNKNOWN",
          toCompound: outLap.Compound ?? "UNKNOWN",
          newTyreLife: outLap.TyreLife,
        };
      });
  });
}

export function getTyreUsageByEvent(eventId: string): TyreUsageSummary[] {
  const laps = getLapsByEvent(eventId).filter(validRaceLap);
  const totalLaps = Math.max(laps.length, 1);
  const groups = new Map<string, FastF1LapRow[]>();

  for (const lap of laps) {
    const compound = lap.Compound ?? "UNKNOWN";
    const current = groups.get(compound) ?? [];
    current.push(lap);
    groups.set(compound, current);
  }

  return Array.from(groups.entries())
    .map(([compound, compoundLaps]) => {
      const times = compoundLaps.map((lap) => lap.LapTimeSeconds);
      return {
        compound,
        laps: compoundLaps.length,
        drivers: new Set(compoundLaps.map((lap) => lap.Driver)).size,
        share: compoundLaps.length / totalLaps,
        averageLapSeconds: Number(average(times).toFixed(3)),
        bestLapSeconds: Number(Math.min(...times).toFixed(3)),
      };
    })
    .sort((a, b) => b.laps - a.laps);
}
