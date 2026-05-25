#!/usr/bin/env python3
"""Calculate driver race pace summaries from GridIQ lap exports."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd


def calculate_pace(laps_path: Path, output_dir: Path, slug: str) -> dict[str, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    laps = pd.read_csv(laps_path)

    if "LapTimeSeconds" not in laps.columns:
        raise ValueError("Input laps file must contain LapTimeSeconds. Run load_session_laps.py first.")

    valid = laps.copy()
    valid = valid[valid["LapTimeSeconds"].notna()]
    if "IsAccurate" in valid.columns:
        valid = valid[valid["IsAccurate"].astype(str).str.lower().isin(["true", "1"])]
    if "PitInTime" in valid.columns:
        valid = valid[valid["PitInTime"].isna()]
    if "PitOutTime" in valid.columns:
        valid = valid[valid["PitOutTime"].isna()]
    if "Deleted" in valid.columns:
        valid = valid[~valid["Deleted"].astype(str).str.lower().isin(["true", "1"])]

    grouped = valid.groupby("Driver", dropna=False)
    rows = []
    for driver, group in grouped:
        team = group["Team"].dropna().iloc[0] if "Team" in group and not group["Team"].dropna().empty else "Unknown"
        rows.append({
            "driver": driver,
            "team": team,
            "laps_counted": int(len(group)),
            "average_lap_seconds": round(float(group["LapTimeSeconds"].mean()), 3),
            "median_lap_seconds": round(float(group["LapTimeSeconds"].median()), 3),
            "best_lap_seconds": round(float(group["LapTimeSeconds"].min()), 3),
            "consistency_std_seconds": round(float(group["LapTimeSeconds"].std(ddof=0)), 3),
        })

    pace = pd.DataFrame(rows).sort_values("average_lap_seconds").reset_index(drop=True)
    if not pace.empty:
        best_avg = float(pace.loc[0, "average_lap_seconds"])
        pace["rank"] = pace.index + 1
        pace["gap_to_best_avg_seconds"] = (pace["average_lap_seconds"] - best_avg).round(3)
        pace = pace[["rank", "driver", "team", "laps_counted", "average_lap_seconds", "gap_to_best_avg_seconds", "median_lap_seconds", "best_lap_seconds", "consistency_std_seconds"]]

    csv_path = output_dir / f"{slug}_race_pace.csv"
    json_path = output_dir / f"{slug}_race_pace.json"
    pace.to_csv(csv_path, index=False)
    json_path.write_text(json.dumps(pace.to_dict(orient="records"), indent=2), encoding="utf-8")

    summary = {
        "slug": slug,
        "source_laps": str(laps_path),
        "input_laps": int(len(laps)),
        "valid_laps_counted": int(len(valid)),
        "drivers": int(len(pace)),
        "leader": pace.iloc[0].to_dict() if not pace.empty else None,
    }
    summary_path = output_dir / f"{slug}_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return {"csv": csv_path, "json": json_path, "summary": summary_path}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--laps", type=Path, default=Path(__file__).resolve().parents[1] / "output" / "monza_2024_race_laps.csv")
    parser.add_argument("--slug", default="monza_2024_race")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1] / "output")
    args = parser.parse_args()
    paths = calculate_pace(args.laps, args.output_dir, args.slug)
    print(json.dumps({k: str(v) for k, v in paths.items()}, indent=2))


if __name__ == "__main__":
    main()
