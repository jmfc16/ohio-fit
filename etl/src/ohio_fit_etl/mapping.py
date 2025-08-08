from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple
import pandas as pd
from ruamel.yaml import YAML

yaml = YAML(typ="safe")

@dataclass
class BucketResult:
    totals: Dict[str, float]
    total_sum: float
    percents: Dict[str, float]


def load_dictionary(path: Path) -> dict:
    with path.open('r', encoding='utf-8') as f:
        return yaml.load(f)


def compute_buckets(df: pd.DataFrame, mapping: dict) -> Tuple[BucketResult, BucketResult]:
    revenue_map = mapping["buckets"]["revenues"]
    exp_map = mapping["buckets"]["expenditures"]

    rev_totals: Dict[str, float] = {}
    for bucket, cols in revenue_map.items():
        existing = [c for c in cols if c in df.columns]
        if existing and len(df):
            rev_totals[bucket] = float(df[existing].sum(axis=1, skipna=True).iloc[0])
        else:
            rev_totals[bucket] = 0.0
    rev_total_sum = sum(rev_totals.values())
    rev_percents = {k: (v / rev_total_sum if rev_total_sum else 0.0) for k, v in rev_totals.items()}

    exp_totals: Dict[str, float] = {}
    for bucket, cols in exp_map.items():
        existing = [c for c in cols if c in df.columns]
        if existing and len(df):
            exp_totals[bucket] = float(df[existing].sum(axis=1, skipna=True).iloc[0])
        else:
            exp_totals[bucket] = 0.0
    exp_total_sum = sum(exp_totals.values())
    exp_percents = {k: (v / exp_total_sum if exp_total_sum else 0.0) for k, v in exp_totals.items()}

    return (
        BucketResult(rev_totals, rev_total_sum, rev_percents),
        BucketResult(exp_totals, exp_total_sum, exp_percents),
    )


def add_summary(df: pd.DataFrame, rev_total: float, exp_total: float) -> Dict[str, float]:
    begin = float(df["Beginning Balance"].iloc[0]) if "Beginning Balance" in df.columns else 0.0
    inc = float(df["Other Increases"].iloc[0]) if "Other Increases" in df.columns else 0.0
    dec = float(df["Other Decreases"].iloc[0]) if "Other Decreases" in df.columns else 0.0
    ending = begin + rev_total + inc - exp_total - dec
    return {
        "beginning_balance": begin,
        "revenues": rev_total,
        "other_increases": inc,
        "expenditures": exp_total,
        "other_decreases": dec,
        "ending_balance": ending,
    }
