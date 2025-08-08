import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
// Resolve to api/mock when running from api/ working directory
const mockDir = path.resolve(process.cwd(), 'mock');

// Health
app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

// Governments search (very simple mock)
app.get('/governments/search', (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.toLowerCase() ?? '';
  const profilesDir = path.join(mockDir, 'profiles');
  const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.json'));
  const results = files.map((f: string) => JSON.parse(fs.readFileSync(path.join(profilesDir, f), 'utf-8')))
    .filter((p: any) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
    .map((p: any) => ({ id: p.id, name: p.name, type: p.type, county: p.county }));
  res.json({ results });
});

// Government profile
app.get('/governments/:id/profile', (req: Request, res: Response) => {
  const { id } = req.params;
  // Prefer ETL aggregate output if present
  const etlProfile = path.resolve(process.cwd(), '..', 'etl', 'out', 'aggregates', `profile_${id.toUpperCase()}.json`);
  if (fs.existsSync(etlProfile)) {
    const data = JSON.parse(fs.readFileSync(etlProfile, 'utf-8'));
    return res.json(data);
  }
  // Fallback to mock
  const file = path.join(mockDir, 'profiles', `${id.toUpperCase()}.json`);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return res.json(data);
  }
  return res.status(404).json({ error: 'Not found' });
});

// Type summary placeholder
app.get('/types/:government_type/summary', (req: Request, res: Response) => {
  const { government_type } = req.params;
  res.json({ government_type, count: 1, filing_stats: { on_time: 1, late: 0 } });
});

// Dollars explorer placeholder
app.get('/dollars', (_req: Request, res: Response) => {
  res.json({ series: [] });
});

// Export placeholder
app.get('/export', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
  res.send('id,name,metric,value\nCIN,Cincinnati,total_revenues,1');
});

app.listen(PORT, () => {
  console.log(`Mock API listening on http://localhost:${PORT}`);
});
