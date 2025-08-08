"use client";
export default function Sparkline({ data, color = "#1f9d55", height = 32 }: { data?: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const w = 120;
  const h = height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
    </svg>
  );
}
