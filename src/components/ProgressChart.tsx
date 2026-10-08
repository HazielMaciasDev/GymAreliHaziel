import type { ExerciseProgressPoint } from '@/lib/history';
import { formatDateShort } from '@/lib/format';

interface ProgressChartProps {
  data: ExerciseProgressPoint[];
  metric: 'maxWeight' | 'volume';
}

export function ProgressChart({ data, metric }: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[25px] border-2 border-dashed border-[#2c2e2a]/10 text-[12px] tracking-[0.08em] uppercase text-[#80827f]">
        Sin datos
      </div>
    );
  }

  const values = data.map((d) => (metric === 'maxWeight' ? d.maxWeightKg : d.totalVolume));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const widthPx = 600;
  const heightPx = 200;
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
      <svg viewBox={`0 0 ${widthPx} ${heightPx}`} className="h-48 w-full">
        <line x1={padding} y1={heightPx - padding} x2={widthPx - padding} y2={heightPx - padding} stroke="#2c2e2a" strokeOpacity="0.1" strokeWidth="2" strokeLinecap="round" />
        <line x1={padding} y1={padding} x2={padding} y2={heightPx - padding} stroke="#2c2e2a" strokeOpacity="0.1" strokeWidth="2" strokeLinecap="round" />
        <path d={areaPath} fill="#8ed462" opacity="0.25" />
        <path d={linePath} stroke="#2c2e2a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="5" fill="#2c2e2a" />
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-between t-eyebrow text-[#80827f]">
        <span>{formatDateShort(points[0].date)}</span>
        <span className="text-[#2c2e2a] font-semibold">
          {metric === 'maxWeight' ? 'Máx' : 'Vol'} · {max.toLocaleString('es-MX', { maximumFractionDigits: 1 })}
        </span>
        <span>{formatDateShort(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}