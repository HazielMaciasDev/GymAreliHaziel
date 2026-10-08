import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { PROFILE_LIST } from '@/lib/profiles';
import { Illustration, Sparkle, Blob } from '@/components/Illustration';

const ACCENT: Record<string, { bg: string; text: string; illustration: 'dumbbell' | 'star' }> = {
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
        {/* Hero */}
        <section className="relative mt-8 md:mt-16">
          <div className="flex items-center gap-2">
            <span className="t-eyebrow text-[#80827f]">Lunes</span>
            <Sparkle size={14} color="#8ed462" className="animate-float" />
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
            Dos perfiles, dos rutinas, un solo entrenamiento. Elegí el tuyo y empezá la sesión de hoy.
          </p>
        </section>

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
                  <span className="t-display leading-none">
                    {profile.initials}
                  </span>
                  <Illustration variant={accent.illustration} size={56} className="opacity-95" />
                </div>

                <div className="flex flex-1 flex-col gap-3 px-7 pb-7 pt-6 md:px-9 md:pb-9 md:pt-8">
                  <h2 className="t-heading text-[#2c2e2a]">{profile.name}</h2>
                  <p className="t-body text-[#2c2e2a]/80">
                    {profile.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
