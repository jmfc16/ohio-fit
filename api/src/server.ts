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
  const withPeers = attachPeerStats(data);
  return res.json(withPeers);
  }
  // Fallback to mock
  const file = path.join(mockDir, 'profiles', `${id.toUpperCase()}.json`);
  if (fs.existsSync(file)) {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const withPeers = attachPeerStats(data);
  return res.json(withPeers);
  }
  return res.status(404).json({ error: 'Not found' });
});

// Type summary placeholder
app.get('/types/:government_type/summary', (req: Request, res: Response) => {
  const { government_type } = req.params;
  const peers = readAllProfilesOfType(government_type);
  const count = peers.length;
  res.json({ government_type, count, filing_stats: { on_time: count, late: 0 } });
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

// --- helpers ---
type Bucket = { bucket: string; amount: number; pct_of_total: number };
type Profile = {
  id: string;
  name: string;
  type: string;
  county: string;
  header?: { website?: string; filing_status?: { summary: string; fy: number; filed_date?: string; revised_date?: string } };
  revenues?: Bucket[];
  expenditures?: Bucket[];
  peers?: { group: string; size: number; averages: { revenues?: Bucket[]; expenditures?: Bucket[] } };
  ranks?: { within_type: { total_revenues?: number; total_expenditures?: number; taxes?: number; public_safety?: number } };
  trends?: { revenues?: number[]; expenditures?: number[] };
};

function readAllProfilesOfType(govType: string): Profile[] {
  const profilesDir = path.join(mockDir, 'profiles');
  const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.json'));
  return files
    .map((f: string) => JSON.parse(fs.readFileSync(path.join(profilesDir, f), 'utf-8')) as Profile)
    .filter(p => p.type === govType);
}

function sumAmount(buckets?: Bucket[]): number {
  return (buckets || []).reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
}

function averageBuckets(profiles: Profile[], key: 'revenues' | 'expenditures'): Bucket[] {
  const bucketNames = new Set<string>();
  profiles.forEach(p => (p[key] || []).forEach(b => bucketNames.add(b.bucket)));
  const out: Bucket[] = [];
  bucketNames.forEach(name => {
    let total = 0;
    profiles.forEach(p => {
      const found = (p[key] || []).find(b => b.bucket === name);
      if (found) total += Number(found.amount) || 0;
    });
    const avg = profiles.length ? total / profiles.length : 0;
    out.push({ bucket: name, amount: avg, pct_of_total: 0 });
  });
  // compute pct_of_total on averages
  const totalAvg = sumAmount(out);
  return out.map(b => ({ ...b, pct_of_total: totalAvg ? b.amount / totalAvg : 0 }));
}

function attachPeerStats(profile: Profile): Profile {
  const peers = readAllProfilesOfType(profile.type);
  const averages = {
    revenues: averageBuckets(peers, 'revenues'),
    expenditures: averageBuckets(peers, 'expenditures'),
  };
  // Simple ranks by total amounts within type
  const totals = peers.map(p => ({ id: p.id, rev: sumAmount(p.revenues), exp: sumAmount(p.expenditures) }));
  const revSorted = [...totals].sort((a, b) => b.rev - a.rev).map(t => t.id);
  const expSorted = [...totals].sort((a, b) => b.exp - a.exp).map(t => t.id);
  const rankRev = revSorted.indexOf(profile.id) + 1 || undefined;
  const rankExp = expSorted.indexOf(profile.id) + 1 || undefined;
  // Bucket-specific ranks (Taxes, Public Safety)
  const taxTotals = peers.map(p => ({ id: p.id, amount: (p.revenues||[]).find(b => b.bucket === 'Taxes')?.amount || 0 }));
  const taxSorted = [...taxTotals].sort((a,b)=> b.amount - a.amount).map(t=>t.id);
  const psTotals = peers.map(p => ({ id: p.id, amount: (p.expenditures||[]).find(b => b.bucket === 'Public Safety')?.amount || 0 }));
  const psSorted = [...psTotals].sort((a,b)=> b.amount - a.amount).map(t=>t.id);
  const rankTaxes = taxSorted.indexOf(profile.id) + 1 || undefined;
  const rankPS = psSorted.indexOf(profile.id) + 1 || undefined;

  // Simple trends (mock last 4 years) based on totals +/- small variation
  const totalRev = sumAmount(profile.revenues);
  const totalExp = sumAmount(profile.expenditures);
  const revTrend = [0.9, 1.0, 1.1, 1.05].map(m => Math.round(totalRev * m));
  const expTrend = [0.85, 0.92, 0.98, 1.0].map(m => Math.round(totalExp * m));

  // Header/meta defaults
  const websiteMap: Record<string, string> = {
    CIN: 'https://www.cincinnati-oh.gov/',
    CLE: 'https://www.clevelandohio.gov/',
  };
  const header = profile.header || {
    website: websiteMap[profile.id] || undefined,
    filing_status: {
      summary: 'Filed on time the past 4 years',
      fy: 2024,
      filed_date: '2025-05-24',
      revised_date: '2025-06-26',
    },
  };
  return {
    ...profile,
    peers: { group: profile.type, size: peers.length, averages },
    ranks: { within_type: { total_revenues: rankRev, total_expenditures: rankExp, taxes: rankTaxes, public_safety: rankPS } },
    trends: { revenues: revTrend, expenditures: expTrend },
    header,
  };
}
