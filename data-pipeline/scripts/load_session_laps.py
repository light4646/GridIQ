#!/usr/bin/env python3
"""Load F1 session laps with FastF1 and export clean CSV/JSON."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import fastf1
import pandas as pd


def seconds_or_none(value: Any) -> float | None:
    if pd.isna(value):
        return None
    if hasattr(value, "total_seconds"):
        return round(float(value.total_seconds()), 3)
    return None


def text_or_none(value: Any) -> str | None:
    if pd.isna(value):
        return None
    return str(value)


def load_laps(year: int, gp: str, session_code: str, output_dir: Path, cache_dir: Path, slug: str) -> dict[str, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    cache_dir.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(cache_dir))

    session = fastf1.get_session(year, gp, session_code)
    session.load(laps=True, telemetry=False, weather=False, messages=False)
    laps = session.laps.copy()

    wanted = [
        "Driver", "DriverNumber", "Team", "LapNumber", "LapTime", "Stint",
        "PitOutTime", "PitInTime", "Sector1Time", "Sector2Time", "Sector3Time",
        "SpeedI1", "SpeedI2", "SpeedFL", "SpeedST", "Compound", "TyreLife",
        "FreshTyre", "IsAccurate", "TrackStatus", "Deleted", "DeletedReason",
    ]
    existing = [col for col in wanted if col in laps.columns]
    clean = laps[existing].copy()

    for col in ["LapTime", "Sector1Time", "Sector2Time", "Sector3Time"]:
        if col in clean.columns:
            clean[f"{col}Seconds"] = clean[col].map(seconds_or_none)
            clean[col] = clean[col].map(text_or_none)

    for col in ["PitOutTime", "PitInTime"]:
        if col in clean.columns:
            clean[col] = clean[col].map(text_or_none)

    if "LapNumber" in clean.columns:
        clean["LapNumber"] = clean["LapNumber"].astype("Int64")

    csv_path = output_dir / f"{slug}_laps.csv"
    json_path = output_dir / f"{slug}_laps.json"
    clean.to_csv(csv_path, index=False)
    clean.to_json(json_path, orient="records", indent=2)

    manifest = {
        "name": "GridIQ session laps",
        "year": year,
        "gp": gp,
        "session": session_code,
        "event_name": session.event.get("EventName", None),
        "meeting_name": session.event.get("MeetingName", None),
        "session_name": session.name,
        "rows": int(len(clean)),
        "csv": str(csv_path),
        "json": str(json_path),
    }
    manifest_path = output_dir / f"{slug}_laps_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return {"csv": csv_path, "json": json_path, "manifest": manifest_path}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--gp", default="Italy")
    parser.add_argument("--session", default="R")
    parser.add_argument("--slug", default="monza_2024_race")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1] / "output")
    parser.add_argument("--cache-dir", type=Path, default=Path(__file__).resolve().parents[1] / "cache")
    args = parser.parse_args()
    paths = load_laps(args.year, args.gp, args.session, args.output_dir, args.cache_dir, args.slug)
    print(json.dumps({k: str(v) for k, v in paths.items()}, indent=2))


if __name__ == "__main__":
    main()
