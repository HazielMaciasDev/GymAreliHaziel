import { type ReactNode } from 'react';
import { usePathname, useRouter } from '@/lib/router';
import { useProfile } from '@/hooks/useProfile';
import { PROFILES } from '@/lib/profiles';
import { Icon } from '@/components/Icon';
import { classNames } from '@/lib/format';

interface NavItem {
  path: string;
  label: string;
  icon: keyof typeof Icon;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/home', label: 'Inicio', icon: 'Home' },
  { path: '/routine', label: 'Rutina', icon: 'Calendar' },
  { path: '/exercises', label: 'Banco', icon: 'Library' },
  { path: '/history', label: 'Historial', icon: 'History' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, clearProfile } = useProfile();

  const profileMeta = profile ? PROFILES[profile] : null;

  return (
    <div className="min-h-dvh bg-[#f6f5f4] text-black">
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-[#f6f5f4]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:px-6">
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="flex items-center gap-2 text-left"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white text-[12px] font-bold tracking-tight">
              G
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[10px] font-medium tracking-[0.16em] uppercase text-black/50">
                Gym Guide
              </span>
              {profileMeta ? (
                <span className="mt-0.5 text-[13px] font-medium text-black">
                  Hola, {profileMeta.name}
                </span>
              ) : null}
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={classNames(
                    'inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors',
                    active
                      ? 'bg-[#e6f3fe] text-[#0075de]'
                      : 'text-black/60 hover:bg-black/[0.04] hover:text-black',
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              clearProfile();
              router.push('/');
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-black/60 transition-colors hover:bg-black/[0.04] hover:text-black"
            aria-label="Cambiar de perfil"
          >
            <Icon.Swap size={14} />
            <span className="hidden sm:inline">Cambiar</span>
          </button>
        </div>
      </header>

      <main className="pb-24 md:pb-12">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">{children}</div>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/[0.06] bg-[#f6f5f4]/95 backdrop-blur-md md:hidden"
        aria-label="Navegación inferior"
      >
        <ul className="mx-auto flex max-w-[600px]">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
            const IconComp = Icon[item.icon];
            return (
              <li key={item.path} className="flex-1">
                <button
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={classNames(
                    'flex w-full flex-col items-center justify-center gap-1 py-2.5 transition-colors',
                    active ? 'text-[#0075de]' : 'text-black/50 hover:text-black',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <IconComp size={22} strokeWidth={active ? 2 : 1.5} />
                  <span className={classNames('text-[10.5px]', active ? 'font-semibold' : 'font-medium')}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}