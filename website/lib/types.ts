export type RacePaceRow = {
  rank: number;
  driver: string;
  team: string;
  laps_counted: number;
  average_lap_seconds: number;
  gap_to_best_avg_seconds: number;
  median_lap_seconds: number;
  best_lap_seconds: number;
  consistency_std_seconds: number;
};

export type RaceSummary = {
  slug: string;
  source_laps: string;
  input_laps: number;
  valid_laps_counted: number;
  drivers: number;
  leader: RacePaceRow | null;
};

export type EventOption = {
  id: string;
  label: string;
  shortLabel: string;
  year: number;
  circuit: string;
  session: string;
  slug: string;
  description: string;
};

export type FastF1LapRow = {
  Driver: string;
  DriverNumber: string;
  Team: string;
  LapNumber: number;
  LapTime: string | null;
  Stint: number;
  PitOutTime: string | null;
  PitInTime: string | null;
  Sector1Time: string | null;
  Sector2Time: string | null;
  Sector3Time: string | null;
  SpeedI1: number | null;
  SpeedI2: number | null;
  SpeedFL: number | null;
  SpeedST: number | null;
  Compound: string | null;
  TyreLife: number | null;
  FreshTyre: boolean | null;
  IsAccurate: boolean | null;
  TrackStatus: string | null;
  Deleted: boolean | null;
  DeletedReason: string | null;
  LapTimeSeconds: number;
  Sector1TimeSeconds: number | null;
  Sector2TimeSeconds: number | null;
  Sector3TimeSeconds: number | null;
};

export type StintSummary = {
  driver: string;
  team: string;
  stint: number;
  compound: string;
  laps: number;
  from_lap: number;
  to_lap: number;
  average_lap_seconds: number;
  best_lap_seconds: number;
};

export type DriverLapPoint = {
  lap: number;
  seconds: number;
  compound: string;
};

export type DriverLapTrace = {
  driver: string;
  team: string;
  eventId: string;
  laps: DriverLapPoint[];
};

export type PitStopSummary = {
  driver: string;
  team: string;
  stopNumber: number;
  pitInLap: number;
  pitOutLap: number;
  fromCompound: string;
  toCompound: string;
  newTyreLife: number | null;
};

export type TyreUsageSummary = {
  compound: string;
  laps: number;
  drivers: number;
  share: number;
  averageLapSeconds: number;
  bestLapSeconds: number;
};

export type QualifyingRow = {
  rank: number;
  driver: string;
  team: string;
  best_lap_seconds: number;
  gap_to_pole_seconds: number;
  best_lap_number: number | null;
  sector1_seconds: number | null;
  sector2_seconds: number | null;
  sector3_seconds: number | null;
  laps_counted: number;
};

export type QualifyingRaceComparison = {
  driver: string;
  team: string;
  qualifyingRank: number;
  racePaceRank: number;
  rankDelta: number;
  qualifyingGapSeconds: number;
  racePaceGapSeconds: number;
  qualifyingLapSeconds: number;
  raceAverageLapSeconds: number;
};

export type StrategyStint = {
  stint: number;
  compound: string;
  fromLap: number;
  toLap: number;
  laps: number;
  averageLapSeconds: number;
  bestLapSeconds: number;
};

export type StrategyTimelineStint = StrategyStint & {
  widthPercent: number;
};

export type StrategyPitStop = {
  stopNumber: number;
  pitInLap: number;
  pitOutLap: number;
  fromCompound: string;
  toCompound: string;
};

export type DriverStrategy = {
  driver: string;
  team: string;
  racePaceRank: number;
  raceLapCount: number;
  stints: StrategyTimelineStint[];
  pitStops: StrategyPitStop[];
  summary: string;
};
