from pathlib import Path
import json
import pandas as pd
from .mapping import load_dictionary, compute_buckets, add_summary

# Minimal seed: read any CSV in input_dir/sample and write a normalized CSV + simple aggregates JSON

def ingest_seed(input_dir: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    # Expect a sample file for Cities GAAP 2024
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
    # Compute totals
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

    df_all["Total Revenues"] = df_all[revenue_cols].sum(axis=1, skipna=True)
    df_all["Total Expenditures"] = df_all[exp_cols].sum(axis=1, skipna=True)
    df_all["Ending Balance"] = (
        df_all["Beginning Balance"].fillna(0)
        + df_all["Total Revenues"].fillna(0)
        + df_all["Other Increases"].fillna(0)
        - df_all["Total Expenditures"].fillna(0)
        - df_all["Other Decreases"].fillna(0)
    )

    # Write normalized CSV for now
    out_csv = output_dir / "normalized_city_gaap_2024.csv"
    df_all.to_csv(out_csv, index=False)

    # Compute bucket percentages using dictionary
    dict_path = Path("etl/config/data_dictionary.yml")
    mapping = load_dictionary(dict_path)
    rev_res, exp_res = compute_buckets(df_all, mapping)
    summary = add_summary(df_all, rev_res.total_sum, exp_res.total_sum)

    # Simple aggregates JSON for API mock (one profile)
    profile = {
        "id": df_all.iloc[0]["government_id"],
        "name": df_all.iloc[0]["name"],
        "type": df_all.iloc[0]["type"],
        "county": df_all.iloc[0]["county"],
        "year": int(df_all.iloc[0]["year"]),
        "basis": df_all.iloc[0]["basis"],
        "summary": summary,
        "revenues": [
            {"bucket": k, "amount": v, "pct_of_total": rev_res.percents[k]} for k, v in rev_res.totals.items()
        ],
        "expenditures": [
            {"bucket": k, "amount": v, "pct_of_total": exp_res.percents[k]} for k, v in exp_res.totals.items()
        ],
    }

    (output_dir / "aggregates").mkdir(exist_ok=True)
    (output_dir / "aggregates" / f"profile_{profile['id']}.json").write_text(
        json.dumps(profile)
    )
