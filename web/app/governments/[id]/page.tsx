type Profile = {
  id: string;
  name: string;
  type: string;
  county: string;
  header?: any;
  summary?: any;
  revenues?: Array<{ bucket: string; amount: number; pct_of_total: number }>;
  expenditures?: Array<{ bucket: string; amount: number; pct_of_total: number }>;
};

async function getProfile(id: string): Promise<Profile> {
  const base = process.env.API_BASE_URL || 'http://localhost:4000';
  const res = await fetch(`${base}/governments/${id}/profile`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Profile not found');
  return res.json();
}

export default async function GovernmentProfile({ params }: { params: { id: string } }) {
  const profile = await getProfile(params.id);
  return (
    <article>
      <h1>{profile.name}</h1>
      <p>{profile.type} — {profile.county} County</p>

      <section aria-labelledby="glance">
        <h2 id="glance">Finances at a Glance</h2>
        <div>
          <strong>Beginning balance:</strong> {profile.summary?.beginning_balance?.toLocaleString?.()}
        </div>
        <div>
          <strong>Ending balance:</strong> {profile.summary?.ending_balance?.toLocaleString?.()}
        </div>
      </section>

      <section aria-labelledby="revenues">
        <h2 id="revenues">Revenues</h2>
        <ul>
          {profile.revenues?.map(r => (
            <li key={r.bucket}>{r.bucket}: {r.amount.toLocaleString()} ({Math.round(r.pct_of_total * 100)}%)</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="expenditures">
        <h2 id="expenditures">Expenditures</h2>
        <ul>
          {profile.expenditures?.map(e => (
            <li key={e.bucket}>{e.bucket}: {e.amount.toLocaleString()} ({Math.round(e.pct_of_total * 100)}%)</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="export">
        <h2 id="export">Export</h2>
        <a href={(process.env.API_BASE_URL || 'http://localhost:4000') + '/export'}>Download CSV</a>
      </section>
    </article>
  );
}
