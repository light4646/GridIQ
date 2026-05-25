
#!/usr/bin/env python3
"""Build historical F1 results data from 2000 onward using Jolpica/Ergast.

This script is the historical backbone for GridIQ. It uses Jolpica's
Ergast-compatible API for schedules, race results, qualifying results, driver
standings, and constructor standings. This is much faster and more complete for
2000+ history than loading every session one-by-one with FastF1.

Examples:
  python scripts/build_historical_results.py --year 2024
  python scripts/build_historical_results.py --start-year 2000 --end-year 2026 --through-date 2026-05-24 --skip-existing
  python scripts/build_historical_results.py --start-year 2000 --end-year 2026 --through-date 2026-05-24 --skip-existing --include-incomplete

Outputs:
  output/history/manifest.json
  output/history/<year>/schedule.json
  output/history/<year>/race_results.json
  output/history/<year>/qualifying_results.json
  output/history/<year>/driver_standings.json
  output/history/<year>/constructor_standings.json
  output/history/<year>/season_summary.json
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import time
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


PROJECT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_DIR / "output" / "history"
DEFAULT_START_YEAR = 2000
JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1"
REQUEST_LIMIT = 1000
REQUEST_SLEEP_SECONDS = 1.0
MAX_RETRIES = 6
RATE_LIMIT_STATUS = 429


def parse_args() -> argparse.Namespace:
    current_year = datetime.now(timezone.utc).year

    parser = argparse.ArgumentParser(description="Build historical F1 results data for GridIQ.")
    parser.add_argument("--year", type=int, help="Build one season only, e.g. 2024")
    parser.add_argument("--start-year", type=int, default=DEFAULT_START_YEAR)
    parser.add_argument("--end-year", type=int, default=current_year)
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip seasons that already have output/history/<year>/season_summary.json.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Rebuild seasons even if outputs already exist.",
    )
    parser.add_argument(
        "--through-date",
        type=str,
        default=datetime.now(timezone.utc).date().isoformat(),
        help="Include only events on or before this date, in YYYY-MM-DD format. Defaults to today.",
    )
    parser.add_argument(
        "--include-incomplete",
        action="store_true",
        help="Continue if one season fails instead of stopping the whole build.",
    )
    return parser.parse_args()


def slugify(value: str) -> str:
    value = str(value).lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def parse_through_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def parse_api_date(value: str | None) -> date | None:
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def event_is_completed(event_date_value: str | None, through_date: date) -> bool:
    event_date = parse_api_date(event_date_value)
    if event_date is None:
        return True
    return event_date <= through_date


def safe_int(value: Any) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def safe_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def flatten_for_csv_value(value: Any) -> str | int | float | None:
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=False)
    return value


def write_csv(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    if not records:
        path.write_text("", encoding="utf-8")
        return

    fieldnames = sorted({key for record in records for key in record.keys()})
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow({key: flatten_for_csv_value(record.get(key)) for key in fieldnames})


def season_already_built(year: int) -> bool:
    year_dir = OUTPUT_DIR / str(year)
    required_files = [
        year_dir / "schedule.json",
        year_dir / "race_results.json",
        year_dir / "driver_standings.json",
        year_dir / "constructor_standings.json",
        year_dir / "season_summary.json",
    ]
    return all(path.exists() and path.stat().st_size > 0 for path in required_files)


def jolpica_get(path: str, *, limit: int = REQUEST_LIMIT, offset: int = 0) -> dict[str, Any]:
    query = urlencode({"limit": limit, "offset": offset})
    url = f"{JOLPICA_BASE_URL}/{path.lstrip('/')}?{query}"
    request = Request(url, headers={"User-Agent": "GridIQ/1.0 historical builder"})

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urlopen(request, timeout=40) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            if exc.code == RATE_LIMIT_STATUS and attempt < MAX_RETRIES:
                wait_seconds = min(90, 10 * attempt)
                print(
                    f"  Rate limited by Jolpica. Waiting {wait_seconds}s "
                    f"before retry {attempt}/{MAX_RETRIES}: {url}"
                )
                time.sleep(wait_seconds)
                continue
            raise RuntimeError(f"HTTP {exc.code} while fetching {url}") from exc
        except URLError as exc:
            if attempt < MAX_RETRIES:
                wait_seconds = min(60, 5 * attempt)
                print(
                    f"  Network issue. Waiting {wait_seconds}s "
                    f"before retry {attempt}/{MAX_RETRIES}: {url}"
                )
                time.sleep(wait_seconds)
                continue
            raise RuntimeError(f"Network error while fetching {url}: {exc.reason}") from exc

    raise RuntimeError(f"Failed to fetch {url} after {MAX_RETRIES} retries")


def jolpica_get_all(path: str) -> dict[str, Any]:
    offset = 0
    merged_data: dict[str, Any] | None = None
    table_key: str | None = None

    while True:
        data = jolpica_get(path, limit=REQUEST_LIMIT, offset=offset)
        mrdata = data.get("MRData", {})
        total = safe_int(mrdata.get("total")) or 0
        current_limit = safe_int(mrdata.get("limit")) or REQUEST_LIMIT
        current_offset = safe_int(mrdata.get("offset")) or offset

        if merged_data is None:
            merged_data = data
            table = find_result_table(mrdata)
            table_key = table[0] if table else None
        else:
            source_table = find_result_table(mrdata)
            target_table = find_result_table(merged_data.get("MRData", {}))
            if source_table and target_table:
                _, source_list = source_table
                _, target_list = target_table
                target_list.extend(source_list)

        offset = current_offset + current_limit
        if offset >= total:
            break
        time.sleep(REQUEST_SLEEP_SECONDS)

    return merged_data or {"MRData": {}}


def find_result_table(mrdata: dict[str, Any]) -> tuple[str, list[Any]] | None:
    for table_name in [
        "RaceTable",
        "StandingsTable",
        "DriverTable",
        "ConstructorTable",
        "CircuitTable",
    ]:
        table = mrdata.get(table_name)
        if not isinstance(table, dict):
            continue
        for key, value in table.items():
            if isinstance(value, list):
                return key, value
    return None


def get_races_from_response(data: dict[str, Any]) -> list[dict[str, Any]]:
    return data.get("MRData", {}).get("RaceTable", {}).get("Races", [])


def get_standings_lists(data: dict[str, Any], key: str) -> list[dict[str, Any]]:
    lists = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
    if not lists:
        return []
    return lists[0].get(key, [])


def normalize_schedule(year: int, races: list[dict[str, Any]], through_date: date) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    for race in races:
        if not event_is_completed(race.get("date"), through_date):
            continue

        circuit = race.get("Circuit", {})
        location = circuit.get("Location", {})
        round_number = safe_int(race.get("round"))
        race_name = race.get("raceName")
        locality = location.get("locality") or race_name
        event_slug = slugify(locality or race_name or f"round-{round_number}")

        records.append(
            {
                "year": year,
                "round": round_number,
                "event_id": f"{year}-{event_slug}",
                "event_name": race_name,
                "event_slug": event_slug,
                "date": race.get("date"),
                "time": race.get("time"),
                "season": race.get("season"),
                "url": race.get("url"),
                "circuit_id": circuit.get("circuitId"),
                "circuit_name": circuit.get("circuitName"),
                "circuit_url": circuit.get("url"),
                "locality": location.get("locality"),
                "country": location.get("country"),
                "latitude": safe_float(location.get("lat")),
                "longitude": safe_float(location.get("long")),
            }
        )

    return records


def normalize_race_results(year: int, races: list[dict[str, Any]], included_rounds: set[int]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []

    for race in races:
        round_number = safe_int(race.get("round"))
        if round_number is None or round_number not in included_rounds:
            continue

        race_name = race.get("raceName")
        event_slug = slugify(race.get("Circuit", {}).get("Location", {}).get("locality") or race_name or f"round-{round_number}")
        event_id = f"{year}-{event_slug}"

        for result in race.get("Results", []):
            driver = result.get("Driver", {})
            constructor = result.get("Constructor", {})
            fastest_lap = result.get("FastestLap", {})
            fastest_lap_time = fastest_lap.get("Time", {}) if isinstance(fastest_lap, dict) else {}
            average_speed = fastest_lap.get("AverageSpeed", {}) if isinstance(fastest_lap, dict) else {}

            results.append(
                {
                    "year": year,
                    "round": round_number,
                    "event_id": event_id,
                    "event_name": race_name,
                    "driver_id": driver.get("driverId"),
                    "driver_code": driver.get("code"),
                    "driver_number": driver.get("permanentNumber") or result.get("number"),
                    "driver_name": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                    "driver_nationality": driver.get("nationality"),
                    "constructor_id": constructor.get("constructorId"),
                    "constructor": constructor.get("name"),
                    "constructor_nationality": constructor.get("nationality"),
                    "grid_position": safe_int(result.get("grid")),
                    "position": safe_int(result.get("position")),
                    "position_text": result.get("positionText"),
                    "points": safe_float(result.get("points")),
                    "laps": safe_int(result.get("laps")),
                    "status": result.get("status"),
                    "time": result.get("Time", {}).get("time") if isinstance(result.get("Time"), dict) else None,
                    "milliseconds": safe_int(result.get("Time", {}).get("millis")) if isinstance(result.get("Time"), dict) else None,
                    "fastest_lap_rank": safe_int(fastest_lap.get("rank")) if isinstance(fastest_lap, dict) else None,
                    "fastest_lap_lap": safe_int(fastest_lap.get("lap")) if isinstance(fastest_lap, dict) else None,
                    "fastest_lap_time": fastest_lap_time.get("time") if isinstance(fastest_lap_time, dict) else None,
                    "fastest_lap_average_speed": safe_float(average_speed.get("speed")) if isinstance(average_speed, dict) else None,
                    "fastest_lap_average_speed_units": average_speed.get("units") if isinstance(average_speed, dict) else None,
                }
            )

    return results


def normalize_qualifying_results(year: int, races: list[dict[str, Any]], included_rounds: set[int]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []

    for race in races:
        round_number = safe_int(race.get("round"))
        if round_number is None or round_number not in included_rounds:
            continue

        race_name = race.get("raceName")
        event_slug = slugify(race.get("Circuit", {}).get("Location", {}).get("locality") or race_name or f"round-{round_number}")
        event_id = f"{year}-{event_slug}"

        for result in race.get("QualifyingResults", []):
            driver = result.get("Driver", {})
            constructor = result.get("Constructor", {})

            results.append(
                {
                    "year": year,
                    "round": round_number,
                    "event_id": event_id,
                    "event_name": race_name,
                    "driver_id": driver.get("driverId"),
                    "driver_code": driver.get("code"),
                    "driver_number": driver.get("permanentNumber") or result.get("number"),
                    "driver_name": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                    "driver_nationality": driver.get("nationality"),
                    "constructor_id": constructor.get("constructorId"),
                    "constructor": constructor.get("name"),
                    "constructor_nationality": constructor.get("nationality"),
                    "position": safe_int(result.get("position")),
                    "q1": result.get("Q1"),
                    "q2": result.get("Q2"),
                    "q3": result.get("Q3"),
                }
            )

    return results


def normalize_driver_standings(year: int, standings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    for standing in standings:
        driver = standing.get("Driver", {})
        constructors = standing.get("Constructors", [])

        records.append(
            {
                "year": year,
                "position": safe_int(standing.get("position")),
                "position_text": standing.get("positionText"),
                "points": safe_float(standing.get("points")),
                "wins": safe_int(standing.get("wins")) or 0,
                "driver_id": driver.get("driverId"),
                "driver_code": driver.get("code"),
                "driver_number": driver.get("permanentNumber"),
                "driver_name": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                "driver_nationality": driver.get("nationality"),
                "constructors": [constructor.get("name") for constructor in constructors],
                "constructor_ids": [constructor.get("constructorId") for constructor in constructors],
            }
        )

    return records


def normalize_constructor_standings(year: int, standings: list[dict[str, Any]]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []

    for standing in standings:
        constructor = standing.get("Constructor", {})

        records.append(
            {
                "year": year,
                "position": safe_int(standing.get("position")),
                "position_text": standing.get("positionText"),
                "points": safe_float(standing.get("points")),
                "wins": safe_int(standing.get("wins")) or 0,
                "constructor_id": constructor.get("constructorId"),
                "constructor": constructor.get("name"),
                "constructor_nationality": constructor.get("nationality"),
                "constructor_url": constructor.get("url"),
            }
        )

    return records


def build_season_summary(
    year: int,
    schedule: list[dict[str, Any]],
    race_results: list[dict[str, Any]],
    qualifying_results: list[dict[str, Any]],
    driver_standings: list[dict[str, Any]],
    constructor_standings: list[dict[str, Any]],
    through_date: date,
) -> dict[str, Any]:
    return {
        "year": year,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "through_date": through_date.isoformat(),
        "source": "Jolpica Ergast-compatible API",
        "races": len(schedule),
        "race_results": len(race_results),
        "qualifying_results": len(qualifying_results),
        "drivers": len(driver_standings),
        "constructors": len(constructor_standings),
        "driver_champion": driver_standings[0] if driver_standings else None,
        "constructor_champion": constructor_standings[0] if constructor_standings else None,
    }


def build_year(year: int, through_date: date) -> dict[str, Any]:
    print(f"Building historical season: {year}")
    year_dir = OUTPUT_DIR / str(year)
    year_dir.mkdir(parents=True, exist_ok=True)

    race_schedule_data = jolpica_get_all(f"/{year}/races.json")
    time.sleep(REQUEST_SLEEP_SECONDS)
    race_results_data = jolpica_get_all(f"/{year}/results.json")
    time.sleep(REQUEST_SLEEP_SECONDS)
    qualifying_results_data = jolpica_get_all(f"/{year}/qualifying.json")
    time.sleep(REQUEST_SLEEP_SECONDS)
    driver_standings_data = jolpica_get_all(f"/{year}/driverstandings.json")
    time.sleep(REQUEST_SLEEP_SECONDS)
    constructor_standings_data = jolpica_get_all(f"/{year}/constructorstandings.json")

    schedule_races = get_races_from_response(race_schedule_data)
    race_result_races = get_races_from_response(race_results_data)
    qualifying_result_races = get_races_from_response(qualifying_results_data)

    schedule = normalize_schedule(year, schedule_races, through_date)
    included_rounds = {record["round"] for record in schedule if record["round"] is not None}

    race_results = normalize_race_results(year, race_result_races, included_rounds)
    qualifying_results = normalize_qualifying_results(year, qualifying_result_races, included_rounds)
    driver_standings = normalize_driver_standings(
        year,
        get_standings_lists(driver_standings_data, "DriverStandings"),
    )
    constructor_standings = normalize_constructor_standings(
        year,
        get_standings_lists(constructor_standings_data, "ConstructorStandings"),
    )

    summary = build_season_summary(
        year,
        schedule,
        race_results,
        qualifying_results,
        driver_standings,
        constructor_standings,
        through_date,
    )

    outputs = {
        "schedule": schedule,
        "race_results": race_results,
        "qualifying_results": qualifying_results,
        "driver_standings": driver_standings,
        "constructor_standings": constructor_standings,
        "season_summary": summary,
    }

    for name, records in outputs.items():
        write_json(year_dir / f"{name}.json", records)
        if isinstance(records, list):
            write_csv(year_dir / f"{name}.csv", records)

    print(
        f"  Done {year}: {summary['races']} races, "
        f"{summary['race_results']} race result rows, "
        f"{summary['qualifying_results']} qualifying rows"
    )
    return summary


def year_range_from_args(args: argparse.Namespace) -> Iterable[int]:
    if args.year:
        return [args.year]
    return range(args.start_year, args.end_year + 1)


def main() -> None:
    args = parse_args()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    through_date = parse_through_date(args.through_date)

    summaries: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []

    for year in year_range_from_args(args):
        if args.skip_existing and not args.force and season_already_built(year):
            summary_path = OUTPUT_DIR / str(year) / "season_summary.json"
            try:
                existing_summary = json.loads(summary_path.read_text(encoding="utf-8"))
                summaries.append(existing_summary)
                print(f"Skipping {year}: existing historical outputs found")
                continue
            except json.JSONDecodeError:
                print(f"Existing summary for {year} is invalid; rebuilding")

        try:
            summaries.append(build_year(year, through_date))
        except Exception as exc:  # noqa: BLE001
            print(f"FAILED {year}: {exc}")
            failures.append({"year": year, "error": str(exc)})
            if not args.include_incomplete:
                raise

    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "through_date": through_date.isoformat(),
        "start_year": min((summary["year"] for summary in summaries), default=None),
        "end_year": max((summary["year"] for summary in summaries), default=None),
        "seasons": summaries,
        "failures": failures,
    }

    write_json(OUTPUT_DIR / "manifest.json", manifest)
    print(f"Wrote manifest: {OUTPUT_DIR / 'manifest.json'}")


if __name__ == "__main__":
    main()