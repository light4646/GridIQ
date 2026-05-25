#!/usr/bin/env python3
"""Build all GridIQ MVP data artifacts."""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from calculate_race_pace import calculate_pace
from load_session_laps import load_laps


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--gp", default="Italy")
    parser.add_argument("--session", default="R")
    parser.add_argument("--slug", default="monza_2024_race")
    root = Path(__file__).resolve().parents[1]
    parser.add_argument("--output-dir", type=Path, default=root / "output")
    parser.add_argument("--cache-dir", type=Path, default=root / "cache")
    parser.add_argument("--website-data-dir", type=Path, default=root.parents[0] / "website" / "public" / "data")
    args = parser.parse_args()

    lap_paths = load_laps(args.year, args.gp, args.session, args.output_dir, args.cache_dir, args.slug)
    pace_paths = calculate_pace(lap_paths["csv"], args.output_dir, args.slug)

    args.website_data_dir.mkdir(parents=True, exist_ok=True)
    copied = []
    for path in [lap_paths["json"], lap_paths["manifest"], pace_paths["json"], pace_paths["summary"]]:
        dest = args.website_data_dir / path.name
        shutil.copy2(path, dest)
        copied.append(str(dest))

    print(json.dumps({"laps": {k: str(v) for k, v in lap_paths.items()}, "pace": {k: str(v) for k, v in pace_paths.items()}, "copied_to_website": copied}, indent=2))


if __name__ == "__main__":
    main()
