# ETL – Ohio FIT

Python ETL for Ohio Auditor Summarized Annual Financial Reports.

- Fetch XLSX from public index (seed: City 2023 & 2024 GAAP)
- Normalize headers, coerce types, preserve originals in data-dictionary (YAML)
- Map into FIT buckets, compute totals and percentages
- Precompute peer-type means/medians (11-year window)
- Output Parquet; stage aggregates JSON for API mock

Runbook in `runbooks/etl.md`.
