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

export function formatMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export const DAYS_OF_WEEK: { id: number; long: string; short: string }[] = [
  { id: 0, long: 'Lunes', short: 'LUN' },
  { id: 1, long: 'Martes', short: 'MAR' },
  { id: 2, long: 'Miércoles', short: 'MIÉ' },
  { id: 3, long: 'Jueves', short: 'JUE' },
  { id: 4, long: 'Viernes', short: 'VIE' },
  { id: 5, long: 'Sábado', short: 'SÁB' },
  { id: 6, long: 'Domingo', short: 'DOM' },
];

export const REST_DAYS: ReadonlySet<number> = new Set([5, 6]);
export const ACTIVE_DAYS: ReadonlyArray<{ id: number; long: string; short: string }> = DAYS_OF_WEEK.filter(
  (d) => !REST_DAYS.has(d.id),
);

export function isRestDay(dayId: number): boolean {
  return REST_DAYS.has(dayId);
}

export function dayOfWeekFromDate(d: Date): number {
  const js = d.getDay();
  return (js + 6) % 7;
}

export function toIsoDate(d: Date): string {
  const local = new Date(d);
  local.setHours(0, 0, 0, 0);
  return local.toISOString().slice(0, 10);
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
}

export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const js = out.getDay();
  const offset = (js + 6) % 7;
  out.setDate(out.getDate() - offset);
  return out;
}