#!/usr/bin/env python3
"""Build processed FastF1 datasets for one event/session or many races.

Examples:
  python scripts/build_event_dataset.py --year 2024 --event Monza --session R
  python scripts/build_event_dataset.py --year 2024 --event Silverstone --session Q

  # Build Race analytics for every completed race in a season range
  python scripts/build_event_dataset.py --all-races --start-year 2024 --end-year 2024 --session Race --skip-existing
  python scripts/build_event_dataset.py --all-races --start-year 2000 --end-year 2026 --session Race --through-date 2026-05-24 --skip-existing

Outputs are written to:
  output/events/<year>/<event-slug>/<session-slug>/
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import fastf1
import pandas as pd


PROJECT_DIR = Path(__file__).resolve().parents[1]
CACHE_DIR = PROJECT_DIR / "cache"
OUTPUT_DIR = PROJECT_DIR / "output"

SESSION_SLUGS = {
    "r": "race",
    "race": "race",
    "q": "qualifying",
    "qualifying": "qualifying",
    "fp1": "fp1",
    "fp2": "fp2",
    "fp3": "fp3",
    "s": "sprint",
    "sprint": "sprint",
    "sq": "sprint-qualifying",
    "sprint qualifying": "sprint-qualifying",
}

FASTF1_SESSION_ALIASES = {
    "race": "R",
    "qualifying": "Q",
    "fp1": "FP1",
    "fp2": "FP2",
    "fp3": "FP3",
    "sprint": "S",
    "sprint-qualifying": "SQ",
}

LAP_COLUMNS = [
    "Driver",
    "DriverNumber",
    "Team",
    "LapNumber",
    "LapTime",
    "LapTimeSeconds",
    "Sector1Time",
    "Sector2Time",
    "Sector3Time",
    "Compound",
    "TyreLife",
    "Stint",
    "PitOutTime",
    "PitInTime",
    "Position",
    "IsPersonalBest",
    "TrackStatus",
]

QUALIFYING_COLUMNS = [
    "Abbreviation",
    "DriverNumber",
    "BroadcastName",
    "FullName",
    "TeamName",
    "Position",
    "Q1",
    "Q2",
    "Q3",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build processed FastF1 event datasets.")
    parser.add_argument("--year", type=int, help="Season year, e.g. 2024")
    parser.add_argument("--event", type=str, help="Event name/location, e.g. Monza")
    parser.add_argument("--session", type=str, default="Race", help="Session, e.g. R, Race, Q, Qualifying")
    parser.add_argument("--all-races", action="store_true", help="Build race analytics for every race in a season range")
    parser.add_argument("--start-year", type=int, help="First season year for --all-races")
    parser.add_argument("--end-year", type=int, help="Last season year for --all-races")
    parser.add_argument("--through-date", type=str, help="Only build events on or before this YYYY-MM-DD date")
    parser.add_argument("--skip-existing", action="store_true", help="Skip events whose metadata.json already exists")
    return parser.parse_args()


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def normalize_session_slug(session: str) -> str:
    return SESSION_SLUGS.get(session.strip().lower(), slugify(session))


def fastf1_session_code(session: str) -> str:
    slug = normalize_session_slug(session)
    return FASTF1_SESSION_ALIASES.get(slug, session)


def event_output_dir(year: int, event_name: str, session: str) -> Path:
    return OUTPUT_DIR / "events" / str(year) / slugify(event_name) / normalize_session_slug(session)


def event_metadata_path(year: int, event_name: str, session: str) -> Path:
    return event_output_dir(year, event_name, session) / "metadata.json"


def event_has_existing_output(year: int, event_name: str, session: str) -> bool:
    return event_metadata_path(year, event_name, session).exists()


def parse_cutoff_date(value: str | None) -> pd.Timestamp | None:
    if not value:
        return None
    return pd.Timestamp(value).tz_localize(None)


def event_date_value(event_row: pd.Series) -> pd.Timestamp | None:
    for column in ["EventDate", "Session5Date", "Session4Date", "Session3Date", "Session2Date", "Session1Date"]:
        value = event_row.get(column)
        if pd.notna(value):
            return pd.Timestamp(value).tz_localize(None)
    return None


def scheduled_race_events(year: int, through_date: str | None = None) -> list[dict[str, Any]]:
    cutoff = parse_cutoff_date(through_date)
    schedule = fastf1.get_event_schedule(year, include_testing=False)
    events: list[dict[str, Any]] = []

    for _, row in schedule.iterrows():
        event_name = str(row.get("EventName", "")).strip()
        round_number = row.get("RoundNumber")
        event_format = str(row.get("EventFormat", "")).lower()
        event_date = event_date_value(row)

        if not event_name or event_name.lower() == "nan":
            continue
        if pd.isna(round_number) or int(round_number) <= 0:
            continue
        if "testing" in event_format:
            continue
        if cutoff is not None and event_date is not None and event_date > cutoff:
            continue

        events.append(
            {
                "year": year,
                "round": int(round_number),
                "event_name": event_name,
                "event_date": event_date.isoformat() if event_date is not None else None,
            }
        )

    return sorted(events, key=lambda item: item["round"])


def timedelta_to_seconds(value: Any) -> float | None:
    if pd.isna(value):
        return None
    return float(pd.to_timedelta(value).total_seconds())


def dataframe_to_json_records(frame: pd.DataFrame) -> list[dict[str, Any]]:
    cleaned = frame.copy()

    for column in cleaned.columns:
        if pd.api.types.is_timedelta64_dtype(cleaned[column]):
            cleaned[column] = cleaned[column].apply(lambda value: None if pd.isna(value) else str(value))
        elif pd.api.types.is_datetime64_any_dtype(cleaned[column]):
            cleaned[column] = cleaned[column].apply(lambda value: None if pd.isna(value) else value.isoformat())

    cleaned = cleaned.where(pd.notnull(cleaned), None)
    return cleaned.to_dict(orient="records")


def export_json_csv(frame: pd.DataFrame, csv_path: Path, json_path: Path) -> None:
    frame.to_csv(csv_path, index=False)
    json_path.write_text(json.dumps(dataframe_to_json_records(frame), indent=2), encoding="utf-8")


def prepare_laps(session: fastf1.core.Session) -> pd.DataFrame:
    laps = session.laps.copy()
    laps["LapTimeSeconds"] = laps["LapTime"].apply(timedelta_to_seconds)
    laps = laps.dropna(subset=["LapTime"])

    available_columns = [column for column in LAP_COLUMNS if column in laps.columns]
    result = laps[available_columns].copy()

    sort_columns = [column for column in ["LapNumber", "Position", "Driver"] if column in result.columns]
    if sort_columns:
        result = result.sort_values(sort_columns, na_position="last")

    return result.reset_index(drop=True)


def clean_race_laps(laps: pd.DataFrame) -> pd.DataFrame:
    clean = laps.dropna(subset=["Driver", "LapTimeSeconds"]).copy()
    clean = clean[clean["LapTimeSeconds"] > 0]

    if "PitOutTime" in clean.columns:
        clean = clean[clean["PitOutTime"].isna()]
    if "PitInTime" in clean.columns:
        clean = clean[clean["PitInTime"].isna()]

    filtered_groups: list[pd.DataFrame] = []
    for _, group in clean.groupby("Driver", sort=False):
        if len(group) >= 8:
            upper = group["LapTimeSeconds"].quantile(0.95)
            group = group[group["LapTimeSeconds"] <= upper]
        filtered_groups.append(group)

    if not filtered_groups:
        return clean.iloc[0:0]

    return pd.concat(filtered_groups, ignore_index=True)


def calculate_pace(clean_laps: pd.DataFrame) -> pd.DataFrame:
    if clean_laps.empty:
        return pd.DataFrame(
            columns=[
                "pace_rank",
                "Driver",
                "Team",
                "DriverNumber",
                "clean_laps",
                "average_lap_seconds",
                "median_lap_seconds",
                "best_lap_seconds",
                "lap_time_std_seconds",
                "gap_to_best_avg_seconds",
            ]
        )

    group_columns = ["Driver"]
    if "Team" in clean_laps.columns:
        group_columns.append("Team")
    if "DriverNumber" in clean_laps.columns:
        group_columns.append("DriverNumber")

    pace = (
        clean_laps.groupby(group_columns, dropna=False)
        .agg(
            clean_laps=("LapTimeSeconds", "count"),
            average_lap_seconds=("LapTimeSeconds", "mean"),
            median_lap_seconds=("LapTimeSeconds", "median"),
            best_lap_seconds=("LapTimeSeconds", "min"),
            lap_time_std_seconds=("LapTimeSeconds", "std"),
        )
        .reset_index()
    )

    for column in [
        "average_lap_seconds",
        "median_lap_seconds",
        "best_lap_seconds",
        "lap_time_std_seconds",
    ]:
        pace[column] = pace[column].fillna(0).round(3)

    pace = pace.sort_values(["median_lap_seconds", "average_lap_seconds"]).reset_index(drop=True)
    pace.insert(0, "pace_rank", range(1, len(pace) + 1))

    best_avg = float(pace["average_lap_seconds"].min()) if not pace.empty else 0
    pace["gap_to_best_avg_seconds"] = (pace["average_lap_seconds"] - best_avg).round(3)

    return pace


def calculate_stints(clean_laps: pd.DataFrame) -> pd.DataFrame:
    if clean_laps.empty or "Stint" not in clean_laps.columns:
        return pd.DataFrame()

    stints = (
        clean_laps.groupby(["Driver", "Team", "Compound", "Stint"], dropna=False)
        .agg(
            from_lap=("LapNumber", "min"),
            to_lap=("LapNumber", "max"),
            laps=("LapTimeSeconds", "count"),
            average_lap_seconds=("LapTimeSeconds", "mean"),
            median_lap_seconds=("LapTimeSeconds", "median"),
            best_lap_seconds=("LapTimeSeconds", "min"),
        )
        .reset_index()
    )

    for column in ["average_lap_seconds", "median_lap_seconds", "best_lap_seconds"]:
        stints[column] = stints[column].round(3)

    stints = stints.sort_values(["average_lap_seconds", "laps"], ascending=[True, False]).reset_index(drop=True)
    stints.insert(0, "stint_rank", range(1, len(stints) + 1))
    return stints


def calculate_tyre_usage(clean_laps: pd.DataFrame) -> pd.DataFrame:
    if clean_laps.empty or "Compound" not in clean_laps.columns:
        return pd.DataFrame()

    total_laps = len(clean_laps)
    usage = (
        clean_laps.groupby("Compound", dropna=False)
        .agg(
            laps=("LapTimeSeconds", "count"),
            drivers=("Driver", "nunique"),
            average_lap_seconds=("LapTimeSeconds", "mean"),
            best_lap_seconds=("LapTimeSeconds", "min"),
        )
        .reset_index()
    )
    usage["share"] = (usage["laps"] / total_laps).round(4)
    usage["average_lap_seconds"] = usage["average_lap_seconds"].round(3)
    usage["best_lap_seconds"] = usage["best_lap_seconds"].round(3)
    return usage.sort_values("laps", ascending=False).reset_index(drop=True)


def calculate_pit_stops(laps: pd.DataFrame) -> pd.DataFrame:
    if laps.empty or "PitInTime" not in laps.columns or "PitOutTime" not in laps.columns:
        return pd.DataFrame()

    stops: list[dict[str, Any]] = []

    for driver, driver_laps in laps.groupby("Driver"):
        driver_laps = driver_laps.sort_values("LapNumber")
        pit_in_laps = driver_laps[driver_laps["PitInTime"].notna()]

        for _, pit_in in pit_in_laps.iterrows():
            lap_number = int(pit_in["LapNumber"])
            next_laps = driver_laps[driver_laps["LapNumber"] > lap_number]
            next_lap = next_laps.iloc[0] if not next_laps.empty else None

            stops.append(
                {
                    "Driver": driver,
                    "Team": pit_in.get("Team"),
                    "pitInLap": lap_number,
                    "pitOutLap": int(next_lap["LapNumber"]) if next_lap is not None else None,
                    "fromCompound": pit_in.get("Compound"),
                    "toCompound": next_lap.get("Compound") if next_lap is not None else None,
                }
            )

    return pd.DataFrame(stops).sort_values(["pitInLap", "Driver"]).reset_index(drop=True)


def prepare_qualifying_results(session: fastf1.core.Session) -> pd.DataFrame:
    results = session.results.copy()
    available_columns = [column for column in QUALIFYING_COLUMNS if column in results.columns]
    qualifying = results[available_columns].copy()

    qualifying = qualifying.rename(
        columns={
            "Abbreviation": "Driver",
            "TeamName": "Team",
            "Position": "qualifying_rank",
            "Q1": "q1_time",
            "Q2": "q2_time",
            "Q3": "q3_time",
        }
    )

    for column in ["q1_time", "q2_time", "q3_time"]:
        if column in qualifying.columns:
            qualifying[f"{column}_seconds"] = qualifying[column].apply(timedelta_to_seconds)

    def best_qualifying_time(row: pd.Series) -> float | None:
        times = [
            row.get("q1_time_seconds"),
            row.get("q2_time_seconds"),
            row.get("q3_time_seconds"),
        ]
        valid = [float(time) for time in times if pd.notna(time)]
        return min(valid) if valid else None

    qualifying["best_qualifying_seconds"] = qualifying.apply(best_qualifying_time, axis=1)
    pole_time = qualifying["best_qualifying_seconds"].dropna().min()

    if pd.notna(pole_time):
        qualifying["gap_to_pole_seconds"] = (qualifying["best_qualifying_seconds"] - pole_time).round(3)
    else:
        qualifying["gap_to_pole_seconds"] = None

    return qualifying.sort_values("qualifying_rank").reset_index(drop=True)


def build_metadata(
    *,
    year: int,
    event_input: str,
    session_input: str,
    session: fastf1.core.Session,
    output_dir: Path,
) -> dict[str, Any]:
    event = session.event
    event_name = str(event.get("EventName", event_input))
    official_event_name = str(event.get("OfficialEventName", event_name))
    country = str(event.get("Country", ""))
    location = str(event.get("Location", event_input))
    round_number = event.get("RoundNumber")

    return {
        "year": year,
        "round": int(round_number) if pd.notna(round_number) else None,
        "event_input": event_input,
        "event_name": event_name,
        "official_event_name": official_event_name,
        "country": country,
        "location": location,
        "event_slug": slugify(event_input),
        "session_input": session_input,
        "session_slug": normalize_session_slug(session_input),
        "generated_output_dir": str(output_dir),
        "source": "FastF1",
    }


def build_one_event_dataset(year: int, event: str, session_input: str, skip_existing: bool = False) -> dict[str, Any]:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    fastf1.Cache.enable_cache(str(CACHE_DIR))

    session_slug = normalize_session_slug(session_input)
    session_code = fastf1_session_code(session_input)
    out_dir = event_output_dir(year, event, session_input)

    if skip_existing and event_has_existing_output(year, event, session_input):
        print(f"Skipping existing dataset: {year} {event} {session_slug}")
        return {
            "year": year,
            "event": event,
            "session": session_slug,
            "status": "skipped_existing",
            "output_dir": str(out_dir),
        }

    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading FastF1 session: {year} {event} {session_code}")
    loaded_session = fastf1.get_session(year, event, session_code)
    loaded_session.load(laps=True, telemetry=False, weather=False, messages=False)

    metadata = build_metadata(
        year=year,
        event_input=event,
        session_input=session_input,
        session=loaded_session,
        output_dir=out_dir,
    )

    if session_slug in {"race", "sprint", "fp1", "fp2", "fp3"}:
        laps = prepare_laps(loaded_session)
        export_json_csv(laps, out_dir / "laps.csv", out_dir / "laps.json")

        metadata["rows_laps"] = int(len(laps))
        metadata["drivers"] = sorted(laps["Driver"].dropna().unique().tolist())

        if session_slug in {"race", "sprint"}:
            clean_laps = clean_race_laps(laps)
            pace = calculate_pace(clean_laps)
            stints = calculate_stints(clean_laps)
            pit_stops = calculate_pit_stops(laps)
            tyre_usage = calculate_tyre_usage(clean_laps)

            export_json_csv(pace, out_dir / "pace.csv", out_dir / "pace.json")
            export_json_csv(stints, out_dir / "stints.csv", out_dir / "stints.json")
            export_json_csv(pit_stops, out_dir / "pit_stops.csv", out_dir / "pit_stops.json")
            export_json_csv(tyre_usage, out_dir / "tyre_usage.csv", out_dir / "tyre_usage.json")

            metadata["rows_clean_laps"] = int(len(clean_laps))
            metadata["rows_pace"] = int(len(pace))
            metadata["rows_stints"] = int(len(stints))
            metadata["rows_pit_stops"] = int(len(pit_stops))
            metadata["rows_tyre_usage"] = int(len(tyre_usage))

    elif session_slug == "qualifying":
        qualifying = prepare_qualifying_results(loaded_session)
        export_json_csv(qualifying, out_dir / "qualifying.csv", out_dir / "qualifying.json")
        metadata["rows_qualifying"] = int(len(qualifying))
        metadata["drivers"] = sorted(qualifying["Driver"].dropna().unique().tolist())

    else:
        raise ValueError(f"Unsupported session type for this builder: {session_input}")

    (out_dir / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print("Done.")
    print(f"Output directory: {out_dir}")
    print(json.dumps(metadata, indent=2))

    return {
        "year": year,
        "event": event,
        "session": session_slug,
        "status": "built",
        "output_dir": str(out_dir),
        "metadata": metadata,
    }


def build_all_races(args: argparse.Namespace) -> None:
    if args.start_year is None or args.end_year is None:
        raise ValueError("--all-races requires --start-year and --end-year")

    results: list[dict[str, Any]] = []
    failed: list[dict[str, Any]] = []

    for year in range(args.start_year, args.end_year + 1):
        print(f"\n=== Discovering races for {year} ===")
        events = scheduled_race_events(year, through_date=args.through_date)
        print(f"Found {len(events)} race events for {year}")

        for event_info in events:
            event_name = event_info["event_name"]
            try:
                result = build_one_event_dataset(
                    year=year,
                    event=event_name,
                    session_input=args.session,
                    skip_existing=args.skip_existing,
                )
                result["round"] = event_info["round"]
                result["event_date"] = event_info["event_date"]
                results.append(result)
            except Exception as exc:
                failure = {
                    "year": year,
                    "round": event_info["round"],
                    "event": event_name,
                    "session": normalize_session_slug(args.session),
                    "status": "failed",
                    "error": str(exc),
                }
                failed.append(failure)
                results.append(failure)
                print(f"FAILED: {year} {event_name}: {exc}")

    manifest = {
        "start_year": args.start_year,
        "end_year": args.end_year,
        "through_date": args.through_date,
        "session": normalize_session_slug(args.session),
        "built": sum(1 for item in results if item.get("status") == "built"),
        "skipped_existing": sum(1 for item in results if item.get("status") == "skipped_existing"),
        "failed": len(failed),
        "events": results,
    }

    manifest_path = OUTPUT_DIR / "events" / "manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("\n=== Event dataset batch complete ===")
    print(
        json.dumps(
            {
                "start_year": manifest["start_year"],
                "end_year": manifest["end_year"],
                "through_date": manifest["through_date"],
                "session": manifest["session"],
                "built": manifest["built"],
                "skipped_existing": manifest["skipped_existing"],
                "failed": manifest["failed"],
            },
            indent=2,
        )
    )
    print(f"Manifest: {manifest_path}")


def main() -> None:
    args = parse_args()

    if args.all_races:
        build_all_races(args)
        return

    if args.year is None or not args.event:
        raise ValueError("Single-event mode requires --year and --event")

    build_one_event_dataset(
        year=args.year,
        event=args.event,
        session_input=args.session,
        skip_existing=args.skip_existing,
    )


if __name__ == "__main__":
    main()