from __future__ import annotations
from dataclasses import dataclass
import pandas as pd


@dataclass
class PeerStats:
    mean: pd.Series
    median: pd.Series


def compute_peer_stats(df: pd.DataFrame, group_cols: list[str], value_cols: list[str]) -> pd.DataFrame:
    """Compute mean/median per peer group across provided value columns.

    Returns a wide DataFrame indexed by group_cols with columns like '{col}_mean' and '{col}_median'.
    """
    grouped = df.groupby(group_cols)[value_cols]
    agg = grouped.agg(['mean', 'median']).reset_index()
    # Flatten MultiIndex columns
    agg.columns = [
        '_'.join(c).strip('_') if isinstance(c, tuple) else c  # e.g., Taxes_mean
        for c in agg.columns
    ]
    return agg


def add_ranks_within_peers(df: pd.DataFrame, group_cols: list[str], metric: str, ascending: bool = False) -> pd.DataFrame:
    """Add 'rank' per peer group for the given metric. By default, larger value => better (descending)."""
    df = df.copy()
    df['rank'] = df.groupby(group_cols)[metric].rank(method='min', ascending=ascending)
    df['of_n'] = df.groupby(group_cols)[metric].transform('count')
    return df
