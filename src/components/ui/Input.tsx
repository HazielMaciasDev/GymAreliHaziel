import { forwardRef, type InputHTMLAttributes } from 'react';
import { classNames } from '@/lib/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { suffix, invalid, className, ...rest },
  ref,
) {
  return (
    <div className={classNames('flex items-stretch h-11 border bg-paper', invalid ? 'border-alarm-red' : 'border-fog focus-within:border-forest-ink', className)}>
      <input
        ref={ref}
        {...rest}
        className="flex-1 min-w-0 px-3 text-[14px] text-forest-ink placeholder:text-pebble outline-none bg-transparent"
      />
      {suffix ? (
        <span className="flex items-center px-3 text-[11px] font-medium tracking-[0.08em] uppercase text-pebble border-l border-fog bg-fog/40">
          {suffix}
        </span>
      ) : null}
    </div>
  );
});