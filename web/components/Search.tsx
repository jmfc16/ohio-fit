"use client";
import { useEffect, useState } from "react";

type Result = { id: string; name: string; type: string; county: string };

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || "http://localhost:4000";

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q) { setResults([]); return; }
      try {
        const res = await fetch(`${base}/governments/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, base]);

  return (
    <div role="search" aria-label="Search governments" style={{ position: 'relative' }}>
      <label className="sr-only" htmlFor="search-input">Search</label>
      <input
        id="search-input"
        placeholder="Search governments..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-autocomplete="list"
        aria-controls="search-results"
        style={{ padding: '0.5rem', minWidth: 240 }}
      />
      {results.length > 0 && (
        <ul id="search-results" role="listbox" style={{ position: 'absolute', zIndex: 10, background: '#fff', border: '1px solid #ddd', width: '100%', marginTop: 4, listStyle: 'none', padding: 0 }}>
          {results.map(r => (
            <li key={r.id} role="option" style={{ padding: '0.5rem' }}>
              <a href={`/governments/${r.id}`}>{r.name} ({r.type}, {r.county})</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
