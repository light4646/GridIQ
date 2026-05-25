# GridIQ F1 Analytics Site

Local-first F1 analytics prototype for Nour.

## MVP

- FastF1 data pipeline pulls the 2024 Italian Grand Prix race.
- Pipeline outputs clean CSV + JSON.
- Next.js website reads the generated JSON and shows:
  - race pace ranking
  - best lap ranking
  - consistency ranking
  - driver/team/lap count summaries

## Project layout

```text
data-pipeline/
  scripts/
    load_session_laps.py
    calculate_race_pace.py
    build_all.py
  output/
  cache/
  requirements.txt
website/
```

## Run data pipeline

```bash
cd data-pipeline
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/build_all.py --year 2024 --gp Italy --session R --slug monza_2024_race
```

## Run website

```bash
cd website
npm install
npm run dev
```

Then open http://localhost:3000
