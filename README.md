# Ohio Financial Intelligence Tool (FIT) – Public Clone

A production-grade, serverless web app to explore Ohio local government finances (starting with Cities, GAAP basis), inspired by Washington’s FIT. Public, no-login access with sharable URLs, exports, peer overlays, rankings, and Ohio Financial Health Indicators (FHI).

## Monorepo layout

- infra/ – AWS CDK (TypeScript): S3 (raw/processed), Glue + Athena catalog, DynamoDB cache, Lambdas, API Gateway, CloudFront
- etl/ – Python ETL: fetch Ohio Auditor summarized reports, normalize, map into FIT buckets, compute aggregates, write Parquet
- api/ – Serverless (Node/TypeScript) Lambdas: search, profile, type summary, dollars explorer, export
- web/ – Next.js (TypeScript) frontend: Individual Government Profile, Types, Navigate by Dollars

## Quick start (local, minimal)

1. ETL (local sample)
	- Uses sample CSV if you don’t have Ohio XLSX yet. Produces local Parquet and a small JSON cache for the API mock.

2. API (local mock)
	- Serves endpoints from mocked data in `api/mock/` until you run a full ETL into S3/Athena.

3. Web
	- Next.js app points to the local API by default.

See per-folder READMEs for detailed steps.

## Roadmap

- Seed: City 2023–2024 GAAP summarized data
- Expand: other government types and bases, FHI ingestion, prod deploy via CDK

## License

MIT
