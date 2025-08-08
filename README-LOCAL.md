# Local dev quickstart

- ETL (Python): create seed output
- API (Node): serve mock endpoints
- Web (Next.js): render profile page

Commands (PowerShell):

```powershell
# ETL
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -e etl; python -m ohio_fit_etl.cli seed --input-dir etl/sample --output-dir etl/out

# API
cd api; npm install; npm run dev

# Web (in new terminal)
cd web; npm install; $env:API_BASE_URL="http://localhost:4000"; npm run dev
```

Open <http://localhost:3000> and visit /governments/CIN
