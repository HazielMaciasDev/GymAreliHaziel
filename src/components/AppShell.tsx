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
    <div className="flex min-h-dvh flex-col bg-paper text-charcoal">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-fog bg-paper px-4 md:px-8">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="flex items-center gap-3 group"
        >
          <span className="flex h-7 w-7 items-center justify-center bg-forest-ink text-paper">
            <span className="text-[11px] font-black tracking-tight">GYM</span>
          </span>
          <span className="hidden text-[12px] font-medium tracking-[0.16em] uppercase text-pebble md:inline">
            {profileMeta?.name ?? 'Guide'}
          </span>
        </button>

        <div className="flex items-center gap-1">
          {profileMeta ? (
            <span className="text-[12px] tracking-[0.08em] uppercase text-slate mr-2 hidden sm:inline">
              {profileMeta.name}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              clearProfile();
              router.push('/');
            }}
            className="inline-flex items-center gap-2 px-3 h-9 text-[12px] font-medium tracking-[0.08em] uppercase text-forest-ink hover:bg-fog transition-colors"
            aria-label="Cambiar usuario"
          >
            <Icon.Swap size={14} />
            <span className="hidden sm:inline">Cambiar</span>
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-10">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-fog bg-paper md:hidden">
        <ul className="flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.path);
            const IconComp = Icon[item.icon];
            return (
              <li key={item.path} className="flex-1">
                <button
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={classNames(
                    'flex w-full flex-col items-center justify-center gap-1 py-3 transition-colors',
                    active ? 'text-forest-ink' : 'text-pebble hover:text-forest-ink',
                  )}
                >
                  <span className="relative">
                    <IconComp size={20} strokeWidth={active ? 2 : 1.5} />
                    {active ? (
                      <span className="absolute -bottom-1.5 left-1/2 h-0.5 w-4 -translate-x-1/2 bg-forest-ink" />
                    ) : null}
                  </span>
                  <span className={classNames('text-[10px] tracking-[0.08em] uppercase', active ? 'font-semibold' : 'font-medium')}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="sticky top-14 hidden border-b border-fog bg-paper md:block">
        <ul className="mx-auto flex max-w-[1200px] gap-1 px-8">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.path);
            return (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => router.push(item.path)}
                  className={classNames(
                    'flex items-center gap-2 px-4 h-12 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors border-b-2',
                    active
                      ? 'text-forest-ink border-forest-ink'
                      : 'text-pebble border-transparent hover:text-forest-ink',
                  )}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}