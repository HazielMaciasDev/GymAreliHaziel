
import type { ReactNode } from 'react';
import { classNames } from '@/lib/format';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  badge?: ReactNode;
}

interface SegmentedTabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  size?: 'md' | 'lg';
  className?: string;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  size = 'md',
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={classNames(
        'flex items-center gap-1 rounded-pill border border-fog bg-paper p-1',
        size === 'lg' ? 'h-12' : 'h-10',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={classNames(
              'flex-1 inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-all duration-150',
              size === 'lg' ? 'h-10 px-5 text-[14px]' : 'h-8 px-4 text-[13px]',
              active
                ? 'bg-lime-voltage text-forest-ink'
                : 'bg-transparent text-charcoal hover:bg-fog',
            )}
          >
            {item.label}
            {item.badge ? (
              <span
                className={classNames(
                  'rounded-pill px-2 text-[10px] font-bold',
                  active ? 'bg-forest-ink text-lime-voltage' : 'bg-fog text-slate',
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
