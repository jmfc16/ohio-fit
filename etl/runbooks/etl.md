# ETL Runbook

Local quickstart:

- Create and activate a Python 3.11 venv
- Install: `pip install -e .`
- Seed sample: `python -m ohio_fit_etl.cli seed --input-dir etl/sample --output-dir etl/out`

Outputs:

- `etl/out/normalized_city_gaap_2024.csv`
- `etl/out/aggregates/profile_<ID>.json`
