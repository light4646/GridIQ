#!/usr/bin/env python3
"""Calculate qualifying order summaries from GridIQ lap exports."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd


def calculate_qualifying(laps_path: Path, output_dir: Path, slug: str) -> dict[str, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    laps = pd.read_csv(laps_path)

    if "LapTimeSeconds" not in laps.columns:
        raise ValueError("Input laps file must contain LapTimeSeconds. Run load_session_laps.py first.")

    valid = laps.copy()
    valid = valid[valid["LapTimeSeconds"].notna()]
    if "Deleted" in valid.columns:
        valid = valid[~valid["Deleted"].astype(str).str.lower().isin(["true", "1"])]
    if "IsAccurate" in valid.columns:
        valid = valid[valid["IsAccurate"].astype(str).str.lower().isin(["true", "1"])]

    rows = []
    for driver, group in valid.groupby("Driver", dropna=False):
        best = group.sort_values("LapTimeSeconds").iloc[0]
        team = best["Team"] if "Team" in best and pd.notna(best["Team"]) else "Unknown"
        rows.append({
            "driver": driver,
            "team": team,
            "rank": 0,
            "best_lap_seconds": round(float(best["LapTimeSeconds"]), 3),
            "gap_to_pole_seconds": 0.0,
            "best_lap_number": int(best["LapNumber"]) if "LapNumber" in best and pd.notna(best["LapNumber"]) else None,
            "sector1_seconds": round(float(best["Sector1TimeSeconds"]), 3) if "Sector1TimeSeconds" in best and pd.notna(best["Sector1TimeSeconds"]) else None,
            "sector2_seconds": round(float(best["Sector2TimeSeconds"]), 3) if "Sector2TimeSeconds" in best and pd.notna(best["Sector2TimeSeconds"]) else None,
            "sector3_seconds": round(float(best["Sector3TimeSeconds"]), 3) if "Sector3TimeSeconds" in best and pd.notna(best["Sector3TimeSeconds"]) else None,
            "laps_counted": int(len(group)),
        })

    quali = pd.DataFrame(rows).sort_values("best_lap_seconds").reset_index(drop=True)
    if not quali.empty:
        pole_time = float(quali.loc[0, "best_lap_seconds"])
        quali["rank"] = quali.index + 1
        quali["gap_to_pole_seconds"] = (quali["best_lap_seconds"] - pole_time).round(3)
        quali = quali[[
            "rank", "driver", "team", "best_lap_seconds", "gap_to_pole_seconds", "best_lap_number",
            "sector1_seconds", "sector2_seconds", "sector3_seconds", "laps_counted",
        ]]

    csv_path = output_dir / f"{slug}_qualifying.csv"
    json_path = output_dir / f"{slug}_qualifying.json"
    quali.to_csv(csv_path, index=False)
    json_path.write_text(json.dumps(quali.to_dict(orient="records"), indent=2), encoding="utf-8")

    summary = {
        "slug": slug,
        "source_laps": str(laps_path),
        "input_laps": int(len(laps)),
        "valid_laps_counted": int(len(valid)),
        "drivers": int(len(quali)),
        "pole": quali.iloc[0].to_dict() if not quali.empty else None,
    }
    summary_path = output_dir / f"{slug}_qualifying_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    return {"csv": csv_path, "json": json_path, "summary": summary_path}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--laps", type=Path, default=Path(__file__).resolve().parents[1] / "output" / "monza_2024_qualifying_laps.csv")
    parser.add_argument("--slug", default="monza_2024_qualifying")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parents[1] / "output")
    args = parser.parse_args()
    paths = calculate_qualifying(args.laps, args.output_dir, args.slug)
    print(json.dumps({k: str(v) for k, v in paths.items()}, indent=2))


if __name__ == "__main__":
    main()
