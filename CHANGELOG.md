# Changelog

All notable changes to this project will be documented in this file.

## 2025-08-07

- Web: Individual Government Profile polish (sparklines for revenues/expenditures, header metadata with FY + filed/revised dates, peer delta arrows, rankings context)
- Web: New pages — Navigate By Dollars (`/dollars`) and Financial Health (`/health`)
- API: New endpoints — `/types`, enhanced `/dollars?type=&measure=`, and `/governments/:id/health`
- Styles: Bar list visuals for Dollars explorer; minor accessibility tweaks
- Reliability: Guards around fetch failures and undefined values in pages
- CI: GitHub Actions workflow to type-check API, build Web, and run ETL tests; badge added in README
