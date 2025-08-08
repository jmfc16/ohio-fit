import pandas as pd
from ohio_fit_etl.mapping import compute_buckets, add_summary
from ruamel.yaml import YAML
from pathlib import Path

yaml = YAML(typ="safe")


def test_compute_buckets_and_summary():
    # Minimal one-row frame matching our seed columns
    data = {
        "Taxes": [100],
        "Intergovernmental": [50],
        "Charges for Services": [50],
        "Licenses & Permits": [0],
        "Fines & Penalties": [0],
        "Miscellaneous": [0],
        "Other Financing": [0],
        "Public Safety": [120],
        "Utilities": [40],
        "General Government": [20],
        "Transportation": [10],
        "Culture & Recreation": [10],
        "Natural & Economic Environment": [0],
        "Social Services": [0],
        "Capital Outlay": [0],
        "Debt Service": [0],
        "Transfers": [0],
        "Beginning Balance": [10],
        "Other Increases": [5],
        "Other Decreases": [2],
    }
    df = pd.DataFrame(data)

    mapping = yaml.load(Path("etl/config/data_dictionary.yml").read_text())
    rev_res, exp_res = compute_buckets(df, mapping)

    assert rev_res.total_sum == 200
    assert exp_res.total_sum == 200
    assert round(rev_res.percents["Taxes"], 3) == 0.5

    summary = add_summary(df, rev_res.total_sum, exp_res.total_sum)
    # ending = 10 + 200 + 5 - 200 - 2 = 13
    assert summary["ending_balance"] == 13
