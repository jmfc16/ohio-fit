type TypesResponse = { types: { name: string; count: number }[] };

async function getTypes(): Promise<TypesResponse> {
  const base = process.env.API_BASE_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${base}/types`, { cache: 'no-store' });
    if (!res.ok) return { types: [] };
    return res.json();
  } catch {
    return { types: [] };
  }
}

export default async function TypesPage() {
  const data = await getTypes();
  const items = data.types || [];
  if (!items.length) {
    const base = process.env.API_BASE_URL || 'http://localhost:4000';
    return (
      <article>
        <div className="breadcrumbs">Explore / Government Types</div>
        <div className="page-title"><h1 style={{margin:0}}>Government Types</h1></div>
        <div className="panel">
          <div className="subtle">No types available. Is the API running at <code>{base}</code>?</div>
          <div style={{marginTop:8}}>
            <a className="chip" href="/governments/CIN">Open a sample profile</a>
            <a className="chip" href="/dollars">Go to Dollars explorer</a>
          </div>
        </div>
      </article>
    );
  }
  return (
    <article>
      <div className="breadcrumbs">Explore / Government Types</div>
      <div className="page-title"><h1 style={{margin:0}}>Government Types</h1></div>
      <ul className="list" style={{maxWidth:520}}>
        {items.map(i => (
          <li key={i.name}>
            <span>{i.name}</span>
            <span>
              <a className="chip" href={`/dollars?type=${encodeURIComponent(i.name)}`}>View Dollars</a>
              <span className="subtle" style={{marginLeft:8}}>({i.count})</span>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
