# Seed samples

Place seed CSV files here with one row per government-year. The CLI will synthesize a tiny sample if empty.

Minimum columns supported (case-sensitive headers):

- government_id, name, type, county, year, basis
- Revenues: Taxes, Intergovernmental, Charges for Services, Licenses & Permits, Fines & Penalties, Miscellaneous, Other Financing
- Expenditures: Public Safety, Utilities, General Government, Transportation, Culture & Recreation, Natural & Economic Environment, Social Services, Capital Outlay, Debt Service, Transfers
- Balance items: Beginning Balance, Other Increases, Other Decreases

You can start from `template_city_gaap.csv` in this folder and add more rows.

How to load locally:

1. Drop or edit CSV(s) here (keep headers). Multiple files are allowed.
2. Run the ETL seed to generate per-government profiles under `etl/out/aggregates`.
3. Restart or refresh the API; it will pick up the new profiles automatically for search, types, dollars, and peers.

Example PowerShell:

```powershell
cd etl
python -m pip install pandas pyarrow openpyxl requests ruamel.yaml typer
python -m ohio_fit_etl.cli seed
```

Outputs:

- etl/out/normalized_city_gaap_seed.csv (joined inputs)
- etl/out/aggregates/profile_&lt;ID&gt;.json (one per government)
