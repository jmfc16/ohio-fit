from pathlib import Path
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq


def process_to_parquet(raw_dir: Path, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    # Placeholder: convert any CSV in raw_dir to parquet unified schema
    csvs = list(Path(raw_dir).glob("*.csv"))
    if not csvs:
        return
    frames = [pd.read_csv(p) for p in csvs]
    df = pd.concat(frames, ignore_index=True)
    table = pa.Table.from_pandas(df)
    pq.write_table(table, output_dir / "ohio_city_gaap.parquet")
