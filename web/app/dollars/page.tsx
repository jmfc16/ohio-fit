type DollarsResponse = {
  government_type: string;
  measure: 'revenues' | 'expenditures';
  count: number;
  total_avg: number;
  buckets: Array<{ bucket: string; avg_amount: number; avg_pct_of_total: number }>;
};

async function getTypes(): Promise<{ types: { name: string; count: number }[] }> {
  const base = process.env.API_BASE_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/types`, { cache: 'no-store' });
    if (!res.ok) return { types: [] };
    return res.json();
  } catch {
    return { types: [] };
  }
}

async function getDollars(type: string, measure: 'revenues' | 'expenditures'): Promise<DollarsResponse> {
  const base = process.env.API_BASE_URL || 'http://localhost:4000';
  const url = new URL(`${base}/dollars`);
  url.searchParams.set('type', type);
  url.searchParams.set('measure', measure);
  try {
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      return { government_type: type, measure, count: 0, total_avg: 0, buckets: [] };
    }
    return res.json();
  } catch {
    return { government_type: type, measure, count: 0, total_avg: 0, buckets: [] };
  }
}

export default async function DollarsPage({ searchParams }: { searchParams: { type?: string; measure?: 'revenues' | 'expenditures' } }) {
  const all = await getTypes();
  if (!all.types.length) {
    return (
      <article>
        <div className="breadcrumbs">Explore / Navigate By Dollars</div>
        <div className="page-title"><h1 style={{margin:0}}>Navigate By Dollars</h1></div>
        <div className="panel">
          <div className="subtle">No government types available yet.</div>
        </div>
      </article>
    );
  }
  const type = searchParams.type || all.types[0]?.name || 'City';
  const measure = searchParams.measure || 'revenues';
  const data = await getDollars(type, measure);
  const fmt = (n?: number) => (typeof n === 'number' ? n.toLocaleString() : '—');
  return (
    <article>
      <div className="breadcrumbs">Explore / Navigate By Dollars</div>
      <div className="page-title"><h1 style={{margin:0}}>Navigate By Dollars</h1></div>
      <div className="chips" style={{ marginTop: 6, marginBottom: 12 }}>
        <form action="/dollars" method="get" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <label className="chip" style={{gap:4}}>
            <span className="subtle">Type</span>
            <select name="type" defaultValue={type} style={{border:0,outline:0,background:'transparent'}}>
              {all.types.map(t => <option key={t.name} value={t.name}>{t.name} ({t.count})</option>)}
            </select>
          </label>
          <label className="chip" style={{gap:4}}>
            <span className="subtle">Measure</span>
            <select name="measure" defaultValue={measure} style={{border:0,outline:0,background:'transparent'}}>
              <option value="revenues">Revenues</option>
              <option value="expenditures">Expenditures</option>
            </select>
          </label>
          <button className="chip" type="submit">Apply</button>
        </form>
      </div>

      <div className="panel">
        <h3>{type} — {measure[0].toUpperCase() + measure.slice(1)} distribution (N={data.count})</h3>
        <div className="subtle" style={{marginBottom:8}}>Average total: {fmt(data.total_avg)}</div>
        <ul className="bars">
          {(data.buckets || []).map(b => (
            <li key={b.bucket}>
              <span className="label">{b.bucket}</span>
              <div className="bar"><div className="fill" style={{width: `${Math.round((b.avg_pct_of_total || 0)*100)}%`}}/></div>
              <span className="value">{Math.round((b.avg_pct_of_total || 0)*100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
