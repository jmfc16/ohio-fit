import pandas as pd
from ohio_fit_etl.aggregates import compute_peer_stats, add_ranks_within_peers


def test_peer_stats_and_ranks():
    df = pd.DataFrame({
        'type': ['City','City','City','Village'],
        'year': [2024,2024,2024,2024],
        'total_revenues': [100, 200, 300, 50],
    })
    stats = compute_peer_stats(df, ['type','year'], ['total_revenues'])
    row = stats[(stats['type']=='City') & (stats['year']==2024)].iloc[0]
    assert row['total_revenues_mean'] == 200
    assert row['total_revenues_median'] == 200

    ranked = add_ranks_within_peers(df, ['type','year'], 'total_revenues', ascending=False)
    city = ranked[ranked['type']=='City'].sort_values('total_revenues', ascending=False)
    assert list(city['rank']) == [1.0, 2.0, 3.0]
    assert list(city['of_n'].unique()) == [3]
