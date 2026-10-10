import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  suffix?: ReactNode;
  prefix?: ReactNode;
  invalid?: boolean;
  pillSize?: 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { suffix, prefix, invalid, pillSize = 'md', className, ...rest },
  ref,
) {
  return (
    <div
      className={classNames(
        'flex items-stretch bg-white border overflow-hidden',
        pillSize === 'lg' ? 'h-14 rounded-full' : 'h-12 rounded-full',
        invalid
          ? 'border-[#ff705d]'
          : 'border-[#2c2e2a]',
        className,
      )}
    >
      {prefix ? (
        <span className="flex items-center pl-5 pr-2 text-[#80827f]">
          {prefix}
        </span>
      ) : null}
      <input
        ref={ref}
        {...rest}
        className="flex-1 min-w-0 bg-transparent px-5 text-[16px] text-[#2c2e2a] placeholder:text-[#80827f] outline-none"
      />
      {suffix ? (
        <span className="flex items-center px-5 text-[12px] font-medium tracking-[0.04em] uppercase text-[#80827f]">
          {suffix}
        </span>
      ) : null}
    </div>
  );
});