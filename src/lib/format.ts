export function formatKg(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value === 0) return '0 kg';
  return `${value} kg`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}