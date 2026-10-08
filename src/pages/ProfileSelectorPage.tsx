import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { PROFILE_LIST } from '@/lib/profiles';

export function ProfileSelectorPage() {
  const router = useRouter();
  const { setProfile } = useProfile();

  const handleSelect = (id: 'haziel' | 'areli') => {
    setProfile(id);
    router.push('/home');
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col px-6 py-12 md:px-10 md:py-16">
      <header className="mb-12 md:mb-20">
        <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
          Gym Guide
        </span>
        <h1 className="mt-6 font-display text-[clamp(56px,11vw,140px)] text-forest-ink leading-[0.85]">
          QUIÉN<br />ENTRENA<br />HOY
        </h1>
        <p className="mt-6 max-w-[44ch] text-[15px] leading-[1.5] text-slate">
          Cada perfil tiene su rutina semanal y su historial propio. Elegí uno para empezar.
        </p>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {PROFILE_LIST.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => handleSelect(profile.id)}
            className="group flex flex-col items-start justify-between gap-8 border border-fog bg-paper p-7 text-left transition-colors hover:border-forest-ink md:p-10 min-h-[280px]"
          >
            <div>
                <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
                  Perfil
                </p>
                <h2 className="mt-3 font-display text-[clamp(48px,6vw,80px)] leading-[0.9] text-forest-ink">
                  {profile.name}
                </h2>
                <p className="mt-4 max-w-[36ch] text-[14px] leading-[1.5] text-slate">
                  {profile.tagline}
                </p>
              </div>
            <div className="flex w-full items-center justify-between border-t border-fog pt-5">
              <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-pebble">
                Empezar
              </span>
              <span className="flex h-10 w-10 items-center justify-center border border-forest-ink text-forest-ink transition-colors group-hover:bg-forest-ink group-hover:text-paper">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>
          </button>
        ))}
      </section>

      <footer className="mt-12 border-t border-fog pt-6 flex items-center justify-between text-[10px] tracking-[0.18em] uppercase text-pebble">
        <span>Gym Guide · Areli & Haziel</span>
        <span>v2.0</span>
      </footer>
    </main>
  );
}