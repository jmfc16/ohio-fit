type Indicator = { key: string; label: string; value: number; unit: 'pct' | 'ratio' | 'count'; score: number; percentile: number; trend: number[]; benchmark?: { warn: number; good: number } };

type Health = {
  id: string;
  name: string;
  type: string;
  fiscal_year: number;
  peers: { group: string; size: number };
  overall: { score: number; rating: string };
  indicators: Indicator[];
};

async function getGovernments(): Promise<Array<{ id: string; name: string; type: string; county: string }>> {
  const base = process.env.API_BASE_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/governments/search?q=`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

import Sparkline from "../../components/Sparkline";

async function getHealth(id: string): Promise<Health | null> {
  const base = process.env.API_BASE_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/governments/${id}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function Gauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, (score - 1) / 4));
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{width:80,height:8,background:'#f1f5f9',border:'1px solid #e5e7eb',borderRadius:999}}>
        <div style={{width:`${pct*100}%`,height:'100%',background:pct>0.75?'#1f9d55':pct>0.5?'#84cc16':pct>0.25?'#f59e0b':'#ef4444',borderRadius:999}}/>
      </div>
      <span className="subtle">{score.toFixed(1)}/5</span>
    </div>
  );
}

export default async function HealthPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id || 'CIN';
  const [data, governments] = await Promise.all([
    getHealth(id),
    getGovernments(),
  ]);
  if (!data) {
    return (
      <article>
        <div className="breadcrumbs">Explore / Financial Health</div>
        <div className="page-title"><h1 style={{margin:0}}>Financial Health</h1></div>
        <div className="chips" style={{ marginTop: 6, marginBottom: 12 }}>
          <span className="chip">{id}</span>
        </div>
        <div className="panel">
          <h3>Not available</h3>
          <div className="subtle">Health indicators aren’t available for this government yet. Try another ID or restart the API server to pick up the new endpoint.</div>
        </div>
        <div className="chips" style={{ marginTop: 6, marginBottom: 12 }}>
          <form action="/health" method="get" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <label className="chip" style={{gap:4}}>
              <span className="subtle">Government</span>
              <select name="id" defaultValue={id} style={{border:0,outline:0,background:'transparent'}}>
                {governments.map((g: { id: string; name: string; type: string; county: string }) => (
                  <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                ))}
              </select>
            </label>
            <button className="chip" type="submit">View</button>
          </form>
        </div>
      </article>
    );
  }
  const fmtPct = (v: number) => `${Math.round(v*100)}%`;
  return (
    <article>
      <div className="breadcrumbs">Explore / Financial Health</div>
      <div className="page-title"><h1 style={{margin:0}}>Financial Health</h1></div>
      <div className="chips" style={{ marginTop: 6, marginBottom: 12 }}>
        <span className="chip">{data.name}</span>
        <span className="chip">{data.type}</span>
        <span className="chip">FY {data.fiscal_year}</span>
        <span className="chip">Peers: {data.peers.size}</span>
        <form action="/health" method="get" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <label className="chip" style={{gap:4}}>
            <span className="subtle">Government</span>
            <select name="id" defaultValue={id} style={{border:0,outline:0,background:'transparent'}}>
              {(governments || []).map((g: { id: string; name: string; type: string; county: string }) => (
                <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
              ))}
            </select>
          </label>
          <button className="chip" type="submit">View</button>
        </form>
      </div>

      <div className="panel">
        <h3>Overall</h3>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Gauge score={data.overall.score} />
          <strong>{data.overall.rating}</strong>
        </div>
      </div>

      <div className="cards" style={{marginTop:16}}>
  {data.indicators.map((ind: Indicator) => (
          <div key={ind.key} className="card" title={`Percentile ${Math.round(ind.percentile*100)}%`}>
            <h3>{ind.label}</h3>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
              <div>
                <div className="metric">{fmtPct(ind.value)}</div>
                <div className="subtle">Percentile: {Math.round(ind.percentile*100)}%</div>
                {ind.benchmark ? (
                  <div className="subtle" style={{marginTop:6,display:'flex',gap:8,alignItems:'center'}}>
                    <span className="chip" style={{borderColor:'#eab308',color:'#a16207'}}>Warn ≥ {fmtPct(ind.benchmark.warn)}</span>
                    <span className="chip" style={{borderColor:'#16a34a',color:'#15803d'}}>Good ≥ {fmtPct(ind.benchmark.good)}</span>
                  </div>
                ) : null}
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                <Gauge score={ind.score} />
                {ind.trend && ind.trend.length > 1 ? (
                  <div aria-label="Trend" title="Trend (recent years)">
                    <Sparkline data={ind.trend} color="#6b5bd2" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
