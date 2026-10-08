import type { ExerciseProgressPoint } from '@/lib/history';
import { formatDateShort } from '@/lib/format';

interface ProgressChartProps {
  data: ExerciseProgressPoint[];
  metric: 'maxWeight' | 'volume';
}

export function ProgressChart({ data, metric }: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[12px] border border-dashed border-black/10 text-[12px] tracking-[0.08em] uppercase text-black/50">
        Sin datos
      </div>
    );
  }

  const values = data.map((d) => (metric === 'maxWeight' ? d.maxWeightKg : d.totalVolume));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const widthPx = 600;
  const heightPx = 180;
  const padding = 24;

  const xStep = data.length > 1 ? (widthPx - padding * 2) / (data.length - 1) : 0;
  const points = data.map((d, idx) => {
    const value = metric === 'maxWeight' ? d.maxWeightKg : d.totalVolume;
    const x = padding + idx * xStep;
    const y = heightPx - padding - ((value - min) / range) * (heightPx - padding * 2);
    return { x, y, value, date: d.date };
  });

  const linePath = points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${heightPx - padding} L ${points[0].x} ${heightPx - padding} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${widthPx} ${heightPx}`} className="h-44 w-full">
        <line x1={padding} y1={heightPx - padding} x2={widthPx - padding} y2={heightPx - padding} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={heightPx - padding} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        <path d={areaPath} fill="#e6f3fe" opacity="0.7" />
        <path d={linePath} stroke="#0075de" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#0075de" />
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-between text-[11px] tracking-[0.04em] uppercase text-black/50">
        <span>{formatDateShort(points[0].date)}</span>
        <span className="text-black font-semibold">
          {metric === 'maxWeight' ? 'Máx' : 'Vol'} · {max.toLocaleString('es-MX', { maximumFractionDigits: 1 })}
        </span>
        <span>{formatDateShort(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}