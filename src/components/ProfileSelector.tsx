
import { useRouter } from '@/lib/router';
import { Button } from '@/components/ui/Button';
import { PROFILE_LIST } from '@/lib/profiles';

export function ProfileSelector() {
  const router = useRouter();

  const handleSelect = (id: 'haziel' | 'areli') => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('gym.profile', id);
    }
    router.push('/workouts');
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-[1200px] flex-col px-6 py-12 md:px-10 md:py-20">
      <header className="mb-10 md:mb-16">
        <span className="inline-flex items-center gap-2 rounded-pill bg-fog px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-forest-ink">
          <span className="h-1.5 w-1.5 rounded-pill bg-lime-voltage" />
          Gym Guide
        </span>
        <h1 className="text-display mt-6 text-obsidian md:text-[89px]">
          ¿QUIÉN ENTRENA HOY?
        </h1>
        <p className="mt-4 max-w-[44ch] text-[16px] leading-[1.5] text-slate">
          Elige tu perfil para empezar. Cada quien tiene sus rutinas guardadas y puede volver cuando quiera.
        </p>
      </header>

      <section className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        {PROFILE_LIST.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => handleSelect(profile.id)}
            className="group flex flex-col items-start gap-6 rounded-large border border-fog bg-paper p-7 text-left transition-all duration-200 hover:-translate-y-1 hover:border-lime-voltage hover:shadow-lift md:p-10"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex h-16 w-16 items-center justify-center rounded-mask bg-lime-voltage text-display text-[36px] text-forest-ink">
                {profile.initials}
              </div>
              <span className="text-[40px] transition-transform duration-200 group-hover:scale-110 md:text-[56px]">
                {profile.emoji}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pebble">
                Perfil
              </p>
              <h2 className="text-[40px] font-black leading-[0.95] tracking-[-0.02em] text-forest-ink md:text-[56px]">
                {profile.name}
              </h2>
              <p className="mt-3 text-[14px] leading-[1.55] text-slate md:text-[16px]">
                &ldquo;{profile.tagline}&rdquo;
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconRight={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              }
            >
              Empezar
            </Button>
          </button>
        ))}
      </section>

      <footer className="mt-12 flex flex-col gap-2 border-t border-fog pt-6 text-[12px] text-pebble md:mt-16 md:flex-row md:items-center md:justify-between">
        <span>Gym Guide · Para {PROFILE_LIST.map((p) => p.name).join(' & ')}</span>
        <span className="uppercase tracking-[0.16em]">
          v0.1 · Wise design system
        </span>
      </footer>
    </main>
  );
}
