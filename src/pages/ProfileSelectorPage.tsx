import { useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { PROFILE_LIST } from '@/lib/profiles';
import { Icon } from '@/components/Icon';

const ACCENT_BG: Record<string, string> = {
  sky: 'bg-[#62aef0]',
  marigold: 'bg-[#ffb110]',
};

const ACCENT_TEXT: Record<string, string> = {
  sky: 'text-[#02093a]',
  marigold: 'text-black',
};

export function ProfileSelectorPage() {
  const router = useRouter();
  const { setProfile } = useProfile();

  const handleSelect = (id: 'haziel' | 'areli') => {
    setProfile(id);
    router.push('/home');
  };

  return (
    <main className="min-h-dvh bg-[#f6f5f4]">
      <div className="mx-auto flex min-h-dvh max-w-[1100px] flex-col px-5 py-8 md:px-10 md:py-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white text-[12px] font-bold tracking-tight">
              G
            </span>
            <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-black/50">
              Gym Guide · v2
            </span>
          </div>
          <span className="hidden text-[12px] text-black/50 sm:block">
            Areli &amp; Haziel
          </span>
        </header>

        <section className="my-10 md:my-16">
          <span className="text-eyebrow text-black/50">Bienvenido de vuelta</span>
          <h1 className="mt-4 text-display text-black">
            Quién <span className="inline-block bg-[#f6d5b8] px-3 py-1 rounded-full text-black">entrena</span> hoy.
          </h1>
          <p className="mt-5 max-w-[44ch] font-serif text-[18px] leading-[1.56] text-[#615d59]">
            Cada perfil tiene su rutina semanal y su historial propio. Elegí uno para empezar.
          </p>
        </section>

        <section className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {PROFILE_LIST.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => handleSelect(profile.id)}
              className="group relative flex flex-col items-stretch overflow-hidden rounded-[12px] border border-black/[0.08] bg-white text-left transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className={`relative h-32 md:h-40 ${ACCENT_BG[profile.accent]} ${ACCENT_TEXT[profile.accent]} flex items-end p-6`}>
                <div className="flex w-full items-end justify-between">
                  <span className="text-[64px] md:text-[80px] font-semibold leading-none">
                    {profile.initials}
                  </span>
                  <span className="text-[11px] font-medium tracking-[0.16em] uppercase opacity-70">
                    Perfil
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
                <div>
                  <p className="text-eyebrow text-black/50">Atleta</p>
                  <h2 className="mt-2 text-[40px] font-semibold leading-[0.95] tracking-[-0.02em] text-black">
                    {profile.name}
                  </h2>
                </div>
                <p className="font-serif text-[18px] leading-[1.56] text-[#615d59]">
                  {profile.tagline}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-black/[0.06] pt-5">
                  <span className="text-[11px] font-medium tracking-[0.16em] uppercase text-black/50">
                    Empezar
                  </span>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 transition-colors group-hover:bg-black group-hover:text-white group-hover:border-black">
                    <Icon.ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </section>

        <footer className="mt-12 flex items-center justify-between text-[11px] tracking-[0.16em] uppercase text-black/40">
          <span>Gym Guide</span>
          <span>Hecho con tiempo y series</span>
        </footer>
      </div>
    </main>
  );
}