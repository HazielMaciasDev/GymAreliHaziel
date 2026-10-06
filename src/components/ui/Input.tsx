import { forwardRef, type InputHTMLAttributes } from 'react';
import { classNames } from '@/lib/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { suffix, className, ...rest },
  ref,
) {
  if (suffix) {
    return (
      <div className="flex h-11 items-stretch overflow-hidden rounded-card border border-pebble focus-within:border-forest-ink">
        <input
          ref={ref}
          {...rest}
          className="flex-1 bg-paper px-4 text-[16px] text-charcoal outline-none placeholder:text-pebble"
        />
        <span className="flex items-center bg-fog px-3 text-[12px] font-medium uppercase text-slate">
          {suffix}
        </span>
      </div>
    );
  }
  return (
    <input
      ref={ref}
      {...rest}
      className={classNames(
        'h-11 w-full rounded-card border border-pebble bg-paper px-4 text-[16px] text-charcoal outline-none placeholder:text-pebble focus:border-forest-ink',
        className,
      )}
    />
  );
});