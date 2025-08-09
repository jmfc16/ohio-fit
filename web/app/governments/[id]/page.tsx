import Sparkline from "../../../components/Sparkline";
import BucketsCard from "../../../components/BucketsCard";

type Profile = {
  id: string;
  name: string;
  type: string;
  county: string;
  header?: any;
  summary?: any;
  revenues?: Array<{ bucket: string; amount: number; pct_of_total: number }>;
  expenditures?: Array<{ bucket: string; amount: number; pct_of_total: number }>;
  peers?: { group: string; size: number; averages: { revenues?: Array<{ bucket: string; amount: number; pct_of_total: number }>; expenditures?: Array<{ bucket: string; amount: number; pct_of_total: number }> } };
  ranks?: { within_type: { total_revenues?: number; total_expenditures?: number; taxes?: number; public_safety?: number } };
  trends?: { revenues?: number[]; expenditures?: number[] };
};

async function getProfile(id: string): Promise<Profile | null> {
  const base = process.env.API_BASE_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/governments/${id}/profile`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function GovernmentProfile({ params }: { params: { id: string } }) {
  const profile = await getProfile(params.id);
  if (!profile) {
    const base = process.env.API_BASE_URL || 'http://localhost:4000';
    return (
      <article>
        <div className="breadcrumbs">Explore / Individual Governments</div>
        <div className="page-title"><h1 style={{margin:0}}>Profile unavailable</h1></div>
        <div className="panel"><div className="subtle">Could not load profile. Is the API running at <code>{base}</code>?</div></div>
      </article>
    );
  }
  return (
    <article>
      <div className="breadcrumbs">Explore / Individual Governments</div>
      <div className="page-title">
        <h1 style={{ margin: 0 }}>{profile.name}</h1>
      </div>
      <div className="chips" style={{ marginTop: 6, marginBottom: 12 }}>
        <span className="chip">{profile.type}</span>
        <span className="chip">{profile.county} County</span>
        {!!profile.header?.website && (
          <a className="chip" href={profile.header.website} target="_blank" rel="noopener noreferrer">Website</a>
        )}
        <span className="chip status"><span className="dot"/> {profile.header?.filing_status?.summary ?? 'Filed on time'}</span>
      </div>
      {!!profile.header?.filing_status && (
        <div className="subtle" style={{ marginTop: -6, marginBottom: 12 }}>
          FY {profile.header.filing_status.fy}
          {profile.header.filing_status.filed_date ? (
            <>
              {" • "}
              <span title="Date the annual filing was submitted">
                Filed <time dateTime={profile.header.filing_status.filed_date}>{profile.header.filing_status.filed_date}</time>
              </span>
            </>
          ) : null}
          {profile.header.filing_status.revised_date ? (
            <>
              {" • "}
              <span title="Date the filing was last revised">
                Revised <time dateTime={profile.header.filing_status.revised_date}>{profile.header.filing_status.revised_date}</time>
              </span>
            </>
          ) : null}
        </div>
      )}

      <div className="grid">
        <div>
          <div className="cards">
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3>Financial Summary</h3>
                <span className="subtle">FY {profile.header?.filing_status?.fy ?? 2024}</span>
              </div>
              <ul className="list">
                <li><span>Beginning Balances</span><span className="metric">{profile.summary?.beginning_balance?.toLocaleString?.()}</span></li>
                <li><span>Revenues</span><span className="metric">{(profile.revenues||[]).reduce((a,b)=>a+b.amount,0).toLocaleString()}</span></li>
                <li><span>Other Increases</span><span className="metric">0</span></li>
                <li><span>Expenditures</span><span className="metric">{(profile.expenditures||[]).reduce((a,b)=>a+b.amount,0).toLocaleString()}</span></li>
                <li><span>Other Decreases</span><span className="metric">0</span></li>
                <li><span>Ending Balances</span><span className="metric">{profile.summary?.ending_balance?.toLocaleString?.()}</span></li>
              </ul>
            </div>

            <BucketsCard
              title="Revenues"
              total={(profile.revenues||[]).reduce((a,b)=>a+b.amount,0)}
              buckets={profile.revenues || []}
              peerAverages={profile.peers?.averages.revenues}
              trend={profile.trends?.revenues}
              color="#1f9d55"
            />

            <BucketsCard
              title="Expenditures"
              total={(profile.expenditures||[]).reduce((a,b)=>a+b.amount,0)}
              buckets={profile.expenditures || []}
              peerAverages={profile.peers?.averages.expenditures}
              trend={profile.trends?.expenditures}
              color="#6b5bd2"
            />
          </div>

          {profile.peers && (
            <div className="panel" style={{ marginTop:16 }}>
              <h3>Peer Averages ({profile.peers.group})</h3>
              <div className="subtle">Peers: {profile.peers.size}</div>
              <div style={{ display: 'flex', gap: '2rem', marginTop:8 }}>
                <div>
                  <h4 style={{ margin:'8px 0' }}>Revenues</h4>
                  <ul className="list">
                    {profile.peers.averages.revenues?.map(r => (
                      <li key={r.bucket}><span>{r.bucket}</span><span>{Math.round(r.amount).toLocaleString()} <span className="pct">({Math.round(r.pct_of_total*100)}%)</span></span></li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ margin:'8px 0' }}>Expenditures</h4>
                  <ul className="list">
                    {profile.peers.averages.expenditures?.map(e => (
                      <li key={e.bucket}><span>{e.bucket}</span><span>{Math.round(e.amount).toLocaleString()} <span className="pct">({Math.round(e.pct_of_total*100)}%)</span></span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="panel rankings">
            <h3>Rankings</h3>
            <div className="subtle">Among {profile.type}s (N={profile.peers?.size ?? '—'})</div>
            <ul>
              <li title={`Within ${profile.type}${profile.peers?.size ? ` (N=${profile.peers.size})` : ''}`}># {profile.ranks?.within_type.total_revenues ?? '—'} Revenues</li>
              <li title={`Within ${profile.type}${profile.peers?.size ? ` (N=${profile.peers.size})` : ''}`}># {profile.ranks?.within_type.total_expenditures ?? '—'} Expenditures</li>
              <li title={`Within ${profile.type}${profile.peers?.size ? ` (N=${profile.peers.size})` : ''}`}># {profile.ranks?.within_type.taxes ?? '—'} Taxes (Revenues)</li>
              <li title={`Within ${profile.type}${profile.peers?.size ? ` (N=${profile.peers.size})` : ''}`}># {profile.ranks?.within_type.public_safety ?? '—'} Public Safety (Expenditures)</li>
            </ul>
          </div>
          <div className="panel" style={{ marginTop:16 }}>
            <h3>Location</h3>
            <div className="subtle">{profile.county} County</div>
          </div>
        </aside>
      </div>

      <div className="panel" style={{ marginTop:16 }}>
        <h3>Export</h3>
        <a href={(process.env.API_BASE_URL || 'http://localhost:4000') + '/export'}>Download CSV</a>
      </div>
    </article>
  );
}
