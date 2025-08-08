async function getTypes() {
  const base = process.env.API_BASE_URL || 'http://localhost:4000';
  const types = ['City'];
  const entries = await Promise.all(
    types.map(async t => {
      const res = await fetch(`${base}/types/${t}/summary`, { cache: 'no-store' });
      const data = await res.json();
      return { type: t, count: data.count };
    })
  );
  return entries;
}

export default async function TypesPage() {
  const items = await getTypes();
  return (
    <main>
      <h1>Government Types</h1>
      <ul>
        {items.map(i => (
          <li key={i.type}>
            <a href="/governments/CIN">{i.type}</a> ({i.count})
          </li>
        ))}
      </ul>
    </main>
  );
}
