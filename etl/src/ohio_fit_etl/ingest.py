from pathlib import Path
import json
import pandas as pd
from .mapping import load_dictionary, compute_buckets, add_summary

# Minimal seed: read any CSV in input_dir/sample and write a normalized CSV + simple aggregates JSON

def ingest_seed(input_dir: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    # Expect one or more CSV files with one row per government-year
    samples = list((input_dir).glob("*.csv"))
    if not samples:
        # Create a tiny sample if none exists
        sample = output_dir / "city_gaap_2024_sample.csv"
        pd.DataFrame([
            {
                "government_id": "CIN",
                "name": "Cincinnati",
                "type": "City",
                "county": "Hamilton",
                "year": 2024,
                "basis": "GAAP",
                "Taxes": 850000000,
                "Intergovernmental": 200000000,
                "Charges for Services": 150000000,
                "Licenses & Permits": 10000000,
                "Fines & Penalties": 5000000,
                "Miscellaneous": 25000000,
                "Other Financing": 100000000,
                "Public Safety": 600000000,
                "Utilities": 220000000,
                "General Government": 180000000,
                "Transportation": 120000000,
                "Culture & Recreation": 40000000,
                "Natural & Economic Environment": 30000000,
                "Social Services": 20000000,
                "Capital Outlay": 90000000,
                "Debt Service": 110000000,
                "Transfers": 50000000,
                "Beginning Balance": 300000000,
                "Other Increases": 20000000,
                "Other Decreases": 15000000,
            }
        ]).to_csv(sample, index=False)
        samples = [sample]

    frames = []
    for s in samples:
        df = pd.read_csv(s)
        frames.append(df)

    df_all = pd.concat(frames, ignore_index=True)
    # Compute totals per row if missing
    revenue_cols = [
        "Taxes",
        "Intergovernmental",
        "Charges for Services",
        "Licenses & Permits",
        "Fines & Penalties",
        "Miscellaneous",
        "Other Financing",
    ]
    exp_cols = [
        "Public Safety",
        "Utilities",
        "General Government",
        "Transportation",
        "Culture & Recreation",
        "Natural & Economic Environment",
        "Social Services",
        "Capital Outlay",
        "Debt Service",
        "Transfers",
    ]

    if "Total Revenues" not in df_all.columns:
        df_all["Total Revenues"] = df_all.reindex(columns=revenue_cols, fill_value=0).sum(axis=1, skipna=True)
    if "Total Expenditures" not in df_all.columns:
        df_all["Total Expenditures"] = df_all.reindex(columns=exp_cols, fill_value=0).sum(axis=1, skipna=True)
    if "Ending Balance" not in df_all.columns:
        df_all["Ending Balance"] = (
            df_all.get("Beginning Balance", 0).fillna(0)
            + df_all["Total Revenues"].fillna(0)
            + df_all.get("Other Increases", 0).fillna(0)
            - df_all["Total Expenditures"].fillna(0)
            - df_all.get("Other Decreases", 0).fillna(0)
        )

    # Write normalized CSV for visibility
    out_csv = output_dir / "normalized_city_gaap_seed.csv"
    df_all.to_csv(out_csv, index=False)

    # Compute bucket percentages per row and write one profile per government
    # Resolve dictionary path robustly regardless of current working directory
    etl_root = Path(__file__).resolve().parents[2]  # .../etl
    candidate_paths = [
        etl_root / "config" / "data_dictionary.yml",
        Path("etl/config/data_dictionary.yml"),
        Path("config/data_dictionary.yml"),
    ]
    dict_path = next((p for p in candidate_paths if p.exists()), None)
    if dict_path is None:
        raise FileNotFoundError(
            f"Could not locate data_dictionary.yml. Tried: {', '.join(str(p) for p in candidate_paths)}"
        )
    mapping = load_dictionary(dict_path)

    agg_dir = output_dir / "aggregates"
    agg_dir.mkdir(parents=True, exist_ok=True)
    print(f"Ingest seed: {len(df_all)} rows -> {agg_dir}")

    written = []
    for idx, row in df_all.iterrows():
        # Debug: show iteration and ID
        try:
            dbg_id = str(row.get("government_id", "")).strip()
        except Exception:
            dbg_id = "<err>"
        print(f"  row {idx}: id={dbg_id}")
        row_df = pd.DataFrame([row])
        rev_res, exp_res = compute_buckets(row_df, mapping)
        summary = add_summary(row_df, rev_res.total_sum, exp_res.total_sum)

        gov_id = str(row.get("government_id", "")).strip() or f"ROW{idx}"
        profile = {
            "id": gov_id,
            "name": row.get("name", gov_id),
            "type": row.get("type", "City"),
            "county": row.get("county", ""),
            "year": int(row.get("year", 2024)),
            "basis": row.get("basis", "GAAP"),
            "summary": summary,
            "revenues": [
                {"bucket": k, "amount": float(v), "pct_of_total": float(rev_res.percents[k])} for k, v in rev_res.totals.items()
            ],
            "expenditures": [
                {"bucket": k, "amount": float(v), "pct_of_total": float(exp_res.percents[k])} for k, v in exp_res.totals.items()
            ],
        }
        out_file = agg_dir / f"profile_{gov_id}.json"
        print(f"  writing {out_file}")
        out_file.write_text(json.dumps(profile))
        written.append(gov_id)
    (agg_dir / "_manifest.txt").write_text("\n".join(written))
    print(f"Wrote {len(written)} profiles: {', '.join(written)}")
