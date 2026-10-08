import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  suffix?: string;
  prefix?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { suffix, prefix, invalid, className, ...rest },
  ref,
) {
  return (
    <div
      className={classNames(
        'flex items-stretch h-11 rounded-[8px] border bg-white overflow-hidden',
        invalid
          ? 'border-[#f64932] focus-within:border-[#f64932]'
          : 'border-black/10 focus-within:border-black/40',
        className,
      )}
    >
      {prefix ? (
        <span className="flex items-center px-3 text-black/60 border-r border-black/5">
          {prefix}
        </span>
      ) : null}
      <input
        ref={ref}
        {...rest}
        className="flex-1 min-w-0 px-3 text-[15px] text-black placeholder:text-black/40 outline-none bg-transparent"
      />
      {suffix ? (
        <span className="flex items-center px-3 text-[12px] font-medium tracking-[0.04em] uppercase text-black/50 border-l border-black/5 bg-black/[0.02]">
          {suffix}
        </span>
      ) : null}
    </div>
  );
});