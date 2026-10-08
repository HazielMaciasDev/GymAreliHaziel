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
  const profileInitial = profileMeta?.name.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="min-h-dvh bg-[#f5f1e4] text-[#2c2e2a]">
      {/* Floating pill nav */}
      <header className="sticky top-3 z-40 px-3 md:top-5 md:px-5">
        <nav
          className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 rounded-full bg-white px-3 md:h-16 md:gap-3 md:px-5"
          aria-label="Principal"
        >
          <button
            type="button"
            onClick={() => router.push('/home')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8ed462] text-[#2c2e2a] transition-transform hover:scale-105 md:h-12 md:w-12"
            aria-label="Ir a inicio"
          >
            <span className="text-[18px] font-semibold leading-none">G</span>
          </button>

          <span className="hidden text-[15px] font-medium text-[#2c2e2a] md:inline">
            Gym Guide
          </span>

          <span className="hidden text-[#80827f] md:inline">·</span>

          <div className="hidden items-center gap-2 md:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5e211] text-[13px] font-semibold text-[#2c2e2a]">
              {profileInitial}
            </span>
            <span className="text-[14px] font-medium text-[#2c2e2a]">
              {profileMeta?.name ?? '—'}
            </span>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={classNames(
                    'inline-flex h-10 items-center rounded-full px-4 text-[14px] font-medium transition-colors',
                    active
                      ? 'bg-[#2c2e2a] text-white'
                      : 'text-[#2c2e2a] hover:bg-[#2c2e2a]/5',
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f5e211] text-[12px] font-semibold text-[#2c2e2a] md:hidden">
              {profileInitial}
            </span>
            <button
              type="button"
              onClick={() => {
                clearProfile();
                router.push('/');
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2c2e2a] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#1f211d] md:h-10 md:px-4 md:text-[13px]"
              aria-label="Cambiar de perfil"
            >
              <Icon.Swap size={13} />
              <span>Cambiar</span>
            </button>
          </div>
        </nav>
      </header>

      <main className="pb-32 md:pb-12">
        <div className="mx-auto max-w-[1200px] px-4 pt-6 md:px-6 md:pt-10">
          {children}
        </div>
      </main>

      {/* Floating pill bottom tab bar (mobile) */}
      <nav
        className="fixed bottom-3 left-3 right-3 z-30 md:hidden"
        aria-label="Navegación inferior"
      >
        <ul className="mx-auto flex h-16 max-w-[420px] items-center gap-1 rounded-full bg-white p-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
            const IconComp = Icon[item.icon];
            return (
              <li key={item.path} className="flex-1">
                <button
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={classNames(
                    'flex h-full w-full items-center justify-center gap-1.5 rounded-full transition-colors',
                    active
                      ? 'bg-[#2c2e2a] text-white'
                      : 'text-[#2c2e2a] hover:bg-[#2c2e2a]/5',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <IconComp size={18} strokeWidth={active ? 2 : 1.7} />
                  <span className={classNames('text-[12px]', active ? 'font-semibold' : 'font-medium')}>
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