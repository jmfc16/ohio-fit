from pathlib import Path
from typing import Optional
import typer

from .ingest import ingest_seed
from .process import process_to_parquet

app = typer.Typer(help="Ohio FIT ETL CLI")

@app.command()
def seed(
    input_dir: Path = typer.Option(Path("etl/sample"), exists=True, file_okay=False),
    output_dir: Path = typer.Option(Path("etl/out"), file_okay=False),
):
    """Load sample CSV/XLSX from input_dir and write normalized parquet + aggregates to output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)
    ingest_seed(input_dir, output_dir)
    typer.echo(f"Seed ingest complete: {output_dir}")

@app.command()
def process(
    raw_dir: Path = typer.Option(Path("etl/raw"), file_okay=False),
    output_dir: Path = typer.Option(Path("etl/out"), file_okay=False),
):
    """Process raw Ohio summarized files into parquet and aggregates."""
    output_dir.mkdir(parents=True, exist_ok=True)
    process_to_parquet(raw_dir, output_dir)
    typer.echo(f"Process complete: {output_dir}")

if __name__ == "__main__":
    app()
