import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { AppShell } from '@/components/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { Icon } from '@/components/Icon';
import { Illustration, Sparkle } from '@/components/Illustration';
import { ProgressChart } from '@/components/ProgressChart';
import {
  type BodyMetric,
  type PersonalRecord,
  type SessionVolumePoint,
  deleteBodyMetric,
  fetchPersonalRecords,
  fetchSessionVolume,
  getProfileMeta,
  listBodyMetrics,
  setProfileHeight,
  upsertBodyMetric,
} from '@/lib/body-metrics';
import { EXERCISES } from '@/data/exercises';
import { MUSCLES } from '@/lib/muscles';
import { classNames, formatDateShort, toIsoDate } from '@/lib/format';
import type { Exercise, ProfileId } from '@/types';

function exerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

function profileExercises(profile: ProfileId): Exercise[] {
  return EXERCISES.filter((e) => !e.profiles || e.profiles.includes(profile));
}

function bmiCategory(bmi: number): { label: string; tone: 'grass' | 'sunshine' | 'coral' | 'sandstone' } {
  if (bmi < 18.5) return { label: 'Bajo peso', tone: 'sunshine' };
  if (bmi < 25) return { label: 'Saludable', tone: 'grass' };
  if (bmi < 30) return { label: 'Sobrepeso', tone: 'sunshine' };
  return { label: 'Alto', tone: 'coral' };
}

export function ProgressPage() {
  const router = useRouter();
  const { profile } = useProfile();
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [volume, setVolume] = useState<SessionVolumePoint[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(() => toIsoDate(new Date()));
  const [savingWeight, setSavingWeight] = useState(false);

  const [heightInput, setHeightInput] = useState('');
  const [savingHeight, setSavingHeight] = useState(false);

  useEffect(() => {
    if (!profile) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [m, meta, v, r] = await Promise.all([
          listBodyMetrics(profile),
          getProfileMeta(profile),
          fetchSessionVolume(profile, 30),
          fetchPersonalRecords(profile),
        ]);
        if (cancelled) return;
        setMetrics(m);
        if (meta?.height_cm) {
          setHeightCm(Number(meta.height_cm));
          setHeightInput(String(Math.round(Number(meta.height_cm))));
        }
        setVolume(v);
        setRecords(r);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('No se pudo cargar el progreso.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, router]);

  const lastMetric = metrics[metrics.length - 1] ?? null;
  const previousMetric = metrics.length >= 2 ? metrics[metrics.length - 2] : null;
  const delta =
    lastMetric && previousMetric ? Number((lastMetric.weight_kg - previousMetric.weight_kg).toFixed(1)) : 0;

  const bmi = useMemo(() => {
    if (!lastMetric || !heightCm) return null;
    const hM = heightCm / 100;
    return Number((lastMetric.weight_kg / (hM * hM)).toFixed(1));
  }, [lastMetric, heightCm]);

  const onSaveWeight = async () => {
    if (!profile) return;
    const value = Number(newWeight);
    if (!value || value <= 0 || value >= 500) return;
    if (!newDate) return;
    setSavingWeight(true);
    try {
      const saved = await upsertBodyMetric(profile, newDate, value);
      setMetrics((prev) => {
        const idx = prev.findIndex((m) => m.measured_on === saved.measured_on);
        if (idx === -1) return [...prev, saved];
        const next = [...prev];
        next[idx] = saved;
        return next;
      });
      setNewWeight('');
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar el peso.');
    } finally {
      setSavingWeight(false);
    }
  };

  const onDeleteWeight = async (id: string) => {
    try {
      await deleteBodyMetric(id);
      setMetrics((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      setError('No se pudo borrar el registro.');
    }
  };

  const onSaveHeight = async () => {
    if (!profile) return;
    const value = Number(heightInput);
    if (!value || value <= 0 || value >= 300) {
      setHeightInput('');
      setHeightCm(null);
      await setProfileHeight(profile, null);
      return;
    }
    setSavingHeight(true);
    try {
      await setProfileHeight(profile, value);
      setHeightCm(value);
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la altura.');
    } finally {
      setSavingHeight(false);
    }
  };

  if (!profile) return null;

  const hasAnyData = metrics.length > 0 || heightCm !== null || volume.length > 0 || records.length > 0;

  return (
    <AppShell>
      <div className="py-6 md:py-10">
        {/* Hero */}
        <section className="relative">
          <span className="t-eyebrow text-[#80827f]">Tu cuerpo</span>
          <h1 className="mt-3 t-display text-[#2c2e2a]">Progreso.</h1>
          <p className="mt-3 max-w-[44ch] t-body-lg text-[#2c2e2a]">
            Peso corporal, altura, IMC, volumen por sesión y tus records personales.
          </p>
          <div className="absolute -right-2 top-0 hidden md:block">
            <Sparkle size={32} color="#8ed462" className="animate-float" />
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-[20px] border-2 border-[#ff705d] bg-white px-4 py-3 text-[14px] text-[#ff705d]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <Card padding="lg" className="mt-6 text-center">
            <p className="text-[16px] text-[#80827f]">Cargando progreso…</p>
          </Card>
        ) : !hasAnyData ? (
          <EmptyState onGoRoutine={() => router.push('/routine')} />
        ) : (
          <>
            {/* Weight hero card */}
            <section className="mt-8 grid grid-cols-1 gap-3 md:mt-10 md:grid-cols-2 md:gap-4">
              <WeightHero
                lastMetric={lastMetric}
                delta={delta}
                total={metrics.length}
                onRegisterClick={() => {
                  const el = document.getElementById('register-weight');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
              <HeightCard
                heightCm={heightCm}
                heightInput={heightInput}
                onChange={setHeightInput}
                onSave={onSaveHeight}
                saving={savingHeight}
                bmi={bmi}
                bmiCategory={bmi ? bmiCategory(bmi) : null}
              />
            </section>

            {/* Weight chart */}
            {metrics.length >= 2 ? (
              <section className="mt-8 md:mt-12">
                <Card padding="lg">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="t-eyebrow text-[#80827f]">Tendencia</span>
                      <h2 className="mt-1 t-heading-sm text-[#2c2e2a]">Peso corporal</h2>
                    </div>
                    <span className="t-eyebrow text-[#80827f] tabular-nums">
                      {metrics.length} {metrics.length === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>
                  <div className="mt-5">
                    <WeightChart data={metrics} />
                  </div>
                </Card>
              </section>
            ) : null}

            {/* Register weight */}
            <section id="register-weight" className="mt-8 md:mt-12 scroll-mt-20">
              <Card padding="lg">
                <span className="t-eyebrow text-[#80827f]">Nuevo registro</span>
                <h2 className="mt-1 t-heading-sm text-[#2c2e2a]">Registra tu peso</h2>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div>
                    <label className="t-eyebrow text-[#80827f]">Fecha</label>
                    <div className="mt-1.5">
                      <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="t-eyebrow text-[#80827f]">Peso (kg)</label>
                    <div className="mt-1.5">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min={0}
                        placeholder="70.0"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        suffix={<span className="t-eyebrow text-[#80827f]">kg</span>}
                      />
                    </div>
                  </div>
                  <Button
                    variant="coral"
                    size="md"
                    onClick={onSaveWeight}
                    disabled={savingWeight || !newWeight}
                    iconLeft={<Icon.Save size={14} />}
                    dotColor="sunshine"
                  >
                    Guardar
                  </Button>
                </div>

                {metrics.length > 0 ? (
                  <div className="mt-6 flex flex-col gap-2">
                    <span className="t-eyebrow text-[#80827f]">Últimos</span>
                    <ul className="flex flex-col gap-2">
                      {[...metrics].reverse().slice(0, 5).map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center gap-3 rounded-[20px] border border-[#2c2e2a]/10 bg-white p-3"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f1e4] text-[11px] font-semibold uppercase text-[#2c2e2a]">
                            {new Date(m.measured_on + 'T00:00:00').toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-semibold tabular-nums text-[#2c2e2a]">
                              {Number(m.weight_kg).toFixed(1)} <span className="text-[12px] text-[#80827f]">kg</span>
                            </p>
                            <p className="t-eyebrow text-[#80827f]">
                              {new Date(m.measured_on + 'T00:00:00').toLocaleDateString('es-MX', {
                                weekday: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteWeight(m.id)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#80827f] hover:bg-[#ff705d]/10 hover:text-[#ff705d]"
                            aria-label="Borrar registro"
                          >
                            <Icon.Trash size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
            </section>

            {/* Volume per session */}
            {volume.length >= 2 ? (
              <section className="mt-8 md:mt-12">
                <Card padding="lg">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="t-eyebrow text-[#80827f]">Por sesión</span>
                      <h2 className="mt-1 t-heading-sm text-[#2c2e2a]">Volumen total</h2>
                      <p className="mt-1 max-w-[36ch] t-body-sm text-[#80827f]">
                        Suma de peso × repeticiones de cada set completado.
                      </p>
                    </div>
                    <span className="t-eyebrow text-[#80827f] tabular-nums">{volume.length} sesiones</span>
                  </div>
                  <div className="mt-5">
                    <VolumeChart data={volume} />
                  </div>
                </Card>
              </section>
            ) : null}

            {/* Personal records */}
            {records.length > 0 ? (
              <section className="mt-8 md:mt-12">
                <Card padding="lg">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <span className="t-eyebrow text-[#80827f]">Máximos</span>
                      <h2 className="mt-1 t-heading-sm text-[#2c2e2a]">Records personales</h2>
                    </div>
                    <span className="t-eyebrow text-[#80827f] tabular-nums">{records.length}</span>
                  </div>
                  <ul className="mt-5 flex flex-col gap-2">
                    {records.slice(0, 10).map((r, idx) => {
                      const ex = exerciseById(r.exerciseId);
                      if (!ex) return null;
                      const primary = MUSCLES[ex.primaryMuscle];
                      return (
                        <li
                          key={r.exerciseId}
                          className="flex items-center gap-3 overflow-hidden rounded-[20px] border border-[#2c2e2a]/10 bg-white p-3"
                        >
                          <span
                            className={classNames(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums',
                              idx === 0
                                ? 'bg-[#f5e211] text-[#2c2e2a]'
                                : idx === 1
                                  ? 'bg-[#e0dbce] text-[#2c2e2a]'
                                  : idx === 2
                                    ? 'bg-[#ff705d] text-white'
                                    : 'bg-[#f5f1e4] text-[#2c2e2a]',
                            )}
                          >
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-[#2c2e2a]">{ex.name}</p>
                            <p className="t-eyebrow text-[#80827f]">
                              {primary.label} · {formatDateShort(r.achievedOn)}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[18px] font-semibold tabular-nums text-[#2c2e2a]">
                              {r.maxWeight}<span className="text-[12px] text-[#80827f]"> kg</span>
                            </p>
                            <p className="t-eyebrow text-[#80827f]">×{r.reps}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}

function WeightHero({
  lastMetric,
  delta,
  total,
  onRegisterClick,
}: {
  lastMetric: BodyMetric | null;
  delta: number;
  total: number;
  onRegisterClick: () => void;
}) {
  return (
    <Card padding="lg" tone="ink" className="relative overflow-hidden">
      <div className="absolute -right-4 -top-6 select-none opacity-10">
        <Illustration variant="plate" size={160} />
      </div>
      <div className="relative">
        <span className="t-eyebrow text-white/60">Peso actual</span>
        {lastMetric ? (
          <>
            <p className="mt-2 t-display text-white leading-[0.9] tabular-nums">
              {Number(lastMetric.weight_kg).toFixed(1)}
              <span className="text-[28px] text-white/60"> kg</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {delta !== 0 ? (
                <Tag tone={delta > 0 ? 'coral' : 'grass'}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} kg
                </Tag>
              ) : null}
              <span className="t-eyebrow text-white/60">
                vs. registro anterior
              </span>
            </div>
            <p className="mt-4 t-body-sm text-white/60">
              {total} {total === 1 ? 'registro' : 'registros'} · último{' '}
              {formatDateShort(lastMetric.measured_on)}
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                size="md"
                onClick={onRegisterClick}
                iconLeft={<Icon.Plus size={14} />}
              >
                Registrar peso
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 t-display text-white leading-[0.9]">—</p>
            <p className="mt-3 max-w-[24ch] t-body-sm text-white/70">
              Sin registros todavía. Anota tu primer peso para empezar a ver la tendencia.
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                size="md"
                onClick={onRegisterClick}
                iconLeft={<Icon.Plus size={14} />}
              >
                Registrar peso
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function HeightCard({
  heightCm,
  heightInput,
  onChange,
  onSave,
  saving,
  bmi,
  bmiCategory,
}: {
  heightCm: number | null;
  heightInput: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  bmi: number | null;
  bmiCategory: { label: string; tone: 'grass' | 'sunshine' | 'coral' | 'sandstone' } | null;
}) {
  return (
    <Card padding="lg" tone="white">
      <span className="t-eyebrow text-[#80827f]">Tu cuerpo</span>
      <h2 className="mt-1 t-heading-sm text-[#2c2e2a]">Altura & IMC</h2>

      <div className="mt-5 flex items-end gap-3">
        <div className="flex-1">
          <label className="t-eyebrow text-[#80827f]">Altura (cm)</label>
          <div className="mt-1.5">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={300}
              placeholder="170"
              value={heightInput}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onSave}
              suffix={<span className="t-eyebrow text-[#80827f]">cm</span>}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={onSave}
          disabled={saving}
          iconLeft={<Icon.Save size={14} />}
        >
          Guardar
        </Button>
      </div>

      {heightCm ? (
        <div className="mt-5 rounded-[20px] bg-[#f5f1e4] p-4">
          <div className="flex items-baseline justify-between">
            <span className="t-eyebrow text-[#80827f]">IMC</span>
            {bmiCategory ? (
              <Tag tone={bmiCategory.tone} size="sm">{bmiCategory.label}</Tag>
            ) : null}
          </div>
          <p className="mt-1 text-[36px] font-medium tabular-nums leading-[1] text-[#2c2e2a]">
            {bmi !== null ? bmi : '—'}
          </p>
          {bmi !== null ? (
            <p className="mt-2 t-body-sm text-[#80827f]">
              {Number(heightCm).toFixed(0)} cm · índice de masa corporal
            </p>
          ) : (
            <p className="mt-2 t-body-sm text-[#80827f]">
              Registra tu peso para calcular el IMC.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 t-body-sm text-[#80827f]">
          Ingresa tu altura una sola vez. La usamos para calcular el IMC.
        </p>
      )}
    </Card>
  );
}

function WeightChart({ data }: { data: BodyMetric[] }) {
  if (data.length < 2) return null;
  const values = data.map((d) => Number(d.weight_kg));
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 0.1);
  const widthPx = 600;
  const heightPx = 200;
  const padding = 28;
  const xStep = (widthPx - padding * 2) / (data.length - 1);
  const points = data.map((d, idx) => {
    const v = Number(d.weight_kg);
    const x = padding + idx * xStep;
    const y = heightPx - padding - ((v - min) / range) * (heightPx - padding * 2);
    return { x, y, value: v, date: d.measured_on };
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
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="5" fill="#2c2e2a" />
            <circle cx={p.x} cy={p.y} r="2.5" fill="#f5e211" />
          </g>
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-between t-eyebrow text-[#80827f]">
        <span>{formatDateShort(points[0].date)}</span>
        <span className="text-[#2c2e2a] font-semibold tabular-nums">
          {min.toFixed(1)} – {max.toFixed(1)} kg
        </span>
        <span>{formatDateShort(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

function VolumeChart({ data }: { data: SessionVolumePoint[] }) {
  if (data.length < 2) return null;
  const values = data.map((d) => d.totalVolume);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const widthPx = 600;
  const heightPx = 200;
  const padding = 28;
  const xStep = (widthPx - padding * 2) / (data.length - 1);
  const points = data.map((d, idx) => {
    const v = d.totalVolume;
    const x = padding + idx * xStep;
    const y = heightPx - padding - ((v - min) / range) * (heightPx - padding * 2);
    return { x, y, value: v, date: d.date };
  });
  const linePath = points.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${heightPx - padding} L ${points[0].x} ${heightPx - padding} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${widthPx} ${heightPx}`} className="h-48 w-full">
        <line x1={padding} y1={heightPx - padding} x2={widthPx - padding} y2={heightPx - padding} stroke="#2c2e2a" strokeOpacity="0.1" strokeWidth="2" strokeLinecap="round" />
        <line x1={padding} y1={padding} x2={padding} y2={heightPx - padding} stroke="#2c2e2a" strokeOpacity="0.1" strokeWidth="2" strokeLinecap="round" />
        <path d={areaPath} fill="#2ba0ff" opacity="0.18" />
        <path d={linePath} stroke="#2ba0ff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="5" fill="#2ba0ff" />
        ))}
      </svg>
      <div className="mt-3 flex items-center justify-between t-eyebrow text-[#80827f]">
        <span>{formatDateShort(points[0].date)}</span>
        <span className="text-[#2c2e2a] font-semibold tabular-nums">
          Máx · {max.toLocaleString('es-MX', { maximumFractionDigits: 0 })} kg
        </span>
        <span>{formatDateShort(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}

function EmptyState({ onGoRoutine }: { onGoRoutine: () => void }) {
  return (
    <Card padding="xl" className="mt-8 text-center md:mt-12">
      <Illustration variant="cup" size={120} className="mx-auto" />
      <h2 className="mt-6 t-heading text-[#2c2e2a]">Sin datos todavía</h2>
      <p className="mt-2 max-w-[40ch] mx-auto t-body text-[#80827f]">
        Registra tu primer peso, completa sesiones y vuelve. Acá vas a ver tu evolución.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button
          variant="dark"
          size="md"
          onClick={onGoRoutine}
          iconRight={<Icon.ChevronRight size={14} />}
          dotColor="grass"
        >
          Ir a Rutina
        </Button>
      </div>
    </Card>
  );
}
