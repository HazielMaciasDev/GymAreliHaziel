import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { PROFILE_LIST } from '@/lib/profiles';
import { Button } from '@/components/ui/Button';
import { Illustration, Sparkle, Blob } from '@/components/Illustration';

const ACCENT: Record<string, { bg: string; text: string; illustration: 'dumbbell' | 'cup' | 'leaves' | 'star' }> = {
  haziel: { bg: 'bg-[#2ba0ff]', text: 'text-white', illustration: 'dumbbell' },
  areli: { bg: 'bg-[#ff705d]', text: 'text-white', illustration: 'star' },
};

export function ProfileSelectorPage() {
  const router = useRouter();
  const { setProfile } = useProfile();

  const handleSelect = (id: 'haziel' | 'areli') => {
    setProfile(id);
    router.push('/home');
  };

  return (
    <main className="min-h-dvh overflow-hidden bg-[#f5f1e4]">
      <div className="mx-auto flex min-h-dvh max-w-[1200px] flex-col px-5 py-8 md:px-10 md:py-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8ed462] text-[18px] font-semibold text-[#2c2e2a] md:h-12 md:w-12">
              G
            </span>
            <div className="flex flex-col leading-none">
              <span className="t-micro text-[#80827f]">Gym Guide</span>
              <span className="mt-1 text-[15px] font-medium text-[#2c2e2a]">v3 · Editorial</span>
            </div>
          </div>
          <span className="hidden text-[14px] text-[#80827f] sm:block">
            Areli &amp; Haziel
          </span>
        </header>

        {/* Hero */}
        <section className="relative mt-10 md:mt-16">
          <div className="flex flex-wrap items-start gap-3">
            <span className="t-eyebrow text-[#80827f]">Lunes · Edición diaria</span>
            <Sparkle size={18} color="#8ed462" className="animate-float" />
          </div>
          <h1 className="mt-5 t-display-lg text-[#2c2e2a]">
            Quién
            <br />
            entrena
            <br />
            <span className="relative inline-block">
              <Blob className="absolute -inset-x-2 inset-y-0 -z-0 h-full w-full" color="#8ed462" />
              <span className="relative">hoy.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-[44ch] t-body-lg text-[#2c2e2a]">
            Dos atletas, dos rutinas, un solo entrenamiento. Elegí tu perfil y empezá la sesión de hoy.
          </p>
        </section>

        {/* Decorative illustration row */}
        <div className="mt-8 flex items-end gap-3 md:mt-12 md:gap-6">
          <Illustration variant="kettle" size={80} className="hidden md:block" />
          <Illustration variant="plate" size={60} className="animate-float" />
          <Illustration variant="medal" size={50} className="hidden md:block" />
        </div>

        {/* Profile cards */}
        <section className="mt-10 grid flex-1 grid-cols-1 gap-4 md:mt-16 md:grid-cols-2 md:gap-6">
          {PROFILE_LIST.map((profile) => {
            const accent = ACCENT[profile.id];
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleSelect(profile.id)}
                className="group relative flex flex-col items-stretch overflow-hidden rounded-[50px] border-2 border-[#2c2e2a] bg-white text-left transition-transform duration-200 hover:-translate-y-1"
              >
                <div className={`flex items-start justify-between px-7 pt-7 md:px-9 md:pt-9 ${accent.bg} ${accent.text}`}>
                  <span className="t-eyebrow opacity-80">Perfil {String(PROFILE_LIST.indexOf(profile) + 1).padStart(2, '0')}</span>
                  <Illustration variant={accent.illustration} size={56} className="opacity-95" />
                </div>

                <div className="flex flex-1 flex-col gap-4 px-7 pb-7 pt-6 md:px-9 md:pb-9 md:pt-8">
                  <div className="flex items-baseline gap-3">
                    <span className="t-display text-[#2c2e2a] leading-none">
                      {profile.initials}
                    </span>
                    <span className="t-eyebrow text-[#80827f]">atleta</span>
                  </div>
                  <h2 className="t-heading text-[#2c2e2a]">{profile.name}</h2>
                  <p className="t-body text-[#2c2e2a]/80">
                    {profile.tagline}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t-2 border-dashed border-[#2c2e2a]/15 pt-5">
                    <span className="t-eyebrow text-[#80827f]">Empezar rutina</span>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#2c2e2a] bg-white text-[#2c2e2a] transition-colors group-hover:bg-[#2c2e2a] group-hover:text-white">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>

        {/* Footer accent (yellow band) */}
        <footer className="mt-12 flex flex-col items-center gap-4 rounded-[50px] bg-[#f5e211] px-6 py-5 text-center md:mt-16 md:flex-row md:justify-between md:text-left">
          <p className="t-body text-[#2c2e2a]">
            Hecho con cariño, series y repeticiones · 2026
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#ff705d]" />
            <span className="h-2 w-2 rounded-full bg-[#2ba0ff]" />
            <span className="h-2 w-2 rounded-full bg-[#8ed462]" />
          </div>
        </footer>
      </div>
    </main>
  );
}