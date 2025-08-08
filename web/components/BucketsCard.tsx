"use client";
import { useId, useState } from "react";
import Sparkline from "./Sparkline";

type Bucket = { bucket: string; amount: number; pct_of_total: number };

export default function BucketsCard({
  title,
  total,
  buckets,
  peerAverages,
  trend,
  color = "#1f9d55",
  defaultShow = false,
}: {
  title: string;
  total: number;
  buckets: Bucket[];
  peerAverages?: Bucket[];
  trend?: number[];
  color?: string;
  defaultShow?: boolean;
}) {
  const id = useId();
  const [showAvg, setShowAvg] = useState<boolean>(defaultShow);
  const peerByBucket = new Map((peerAverages || []).map(b => [b.bucket, b]));
  const toggleDisabled = !peerAverages || peerAverages.length === 0;
  return (
    <div className="card">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h3>
          {title} <span className="metric">{Number(total || 0).toLocaleString()}</span>
        </h3>
        <label className="toggle" htmlFor={id} style={toggleDisabled ? { opacity: .5 } : undefined}>
          <input
            id={id}
            type="checkbox"
            aria-label="Show statewide averages"
            checked={showAvg}
            onChange={() => setShowAvg(v => !v)}
            disabled={toggleDisabled}
          />
          Show statewide averages
        </label>
      </div>
      {trend && trend.length > 1 ? (<Sparkline data={trend} color={color} />) : null}
      <ul className="list">
        {buckets?.map((b) => {
          const peer = peerByBucket.get(b.bucket);
          const peerPct = peer?.pct_of_total ?? 0;
          const delta = (b.pct_of_total ?? 0) - peerPct;
          const up = delta > 0.0005;
          const down = delta < -0.0005;
          const deltaPct = Math.abs(delta * 100);
          return (
            <li key={b.bucket} title={peer ? `Peer avg: ${(peerPct*100).toFixed(0)}%` : undefined}>
              <span>{b.bucket}</span>
              <span>
                {b.amount.toLocaleString()} <span className="pct">({Math.round((b.pct_of_total||0)*100)}%)</span>
                {showAvg && (up || down) && (
                  <span className={`delta ${up ? 'delta-up' : 'delta-down'}`}>{up ? '▲' : '▼'} {deltaPct.toFixed(0)}%</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite" className="sr-only">{showAvg ? 'Showing statewide averages deltas' : 'Hiding statewide averages deltas'}</div>
    </div>
  );
}
