import { useEffect, useRef, useState, type TouchEvent } from 'react';
import { ExerciseMedia } from '@/components/ExerciseMedia';
import { Icon } from '@/components/Icon';
import { classNames } from '@/lib/format';

interface VideoCarouselProps {
  media: string[];
  alt: string;
  className?: string;
  ratio?: '4/3' | '1/1' | '16/9';
  rounded?: string;
}

const SWIPE_THRESHOLD = 50;

export function VideoCarousel({
  media,
  alt,
  className,
  ratio = '4/3',
  rounded = 'rounded-[50px]',
}: VideoCarouselProps) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const total = media.length;
  const current = media[index] ?? media[0];
  const canNavigate = total > 1;

  const goPrev = () => {
    if (!canNavigate) return;
    setIndex((i) => (i - 1 + total) % total);
  };
  const goNext = () => {
    if (!canNavigate) return;
    setIndex((i) => (i + 1) % total);
  };

  useEffect(() => {
    if (!canNavigate) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canNavigate]);

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const x = e.touches[0]?.clientX ?? touchStartX.current;
    setDrag(x - touchStartX.current);
  };
  const onTouchEnd = () => {
    if (touchStartX.current === null) return;
    if (Math.abs(drag) > SWIPE_THRESHOLD) {
      if (drag < 0) goNext();
      else goPrev();
    }
    setDrag(0);
    touchStartX.current = null;
  };

  return (
    <div
      className={classNames('relative', className)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className={classNames(
          'relative aspect-[var(--ratio)] overflow-hidden bg-white',
          rounded,
        )}
        style={{ ['--ratio' as string]: ratio.replace('/', ' / ') }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${drag}px)` }}
        >
          <ExerciseMedia
            src={current}
            alt={alt}
            className="h-full w-full object-cover"
            loading="eager"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.15';
            }}
          />
        </div>

        {canNavigate ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Video anterior"
              className={classNames(
                'absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#2c2e2a] shadow-md transition-opacity',
                'opacity-70 hover:opacity-100 md:opacity-0',
                isHovering && 'md:opacity-90',
              )}
            >
              <Icon.ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Video siguiente"
              className={classNames(
                'absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#2c2e2a] shadow-md transition-opacity',
                'opacity-70 hover:opacity-100 md:opacity-0',
                isHovering && 'md:opacity-90',
              )}
            >
              <Icon.ChevronRight size={18} />
            </button>

            <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#2c2e2a] px-3 py-1 text-[11px] font-semibold tabular-nums text-[#f5f1e4]">
              {index + 1}
              <span className="opacity-50">/</span>
              {total}
            </div>
          </>
        ) : null}
      </div>

      {canNavigate ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {media.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setIndex(idx)}
              aria-label={`Ver ángulo ${idx + 1}`}
              className={classNames(
                'h-2 rounded-full transition-all',
                idx === index ? 'w-8 bg-[#2c2e2a]' : 'w-2 bg-[#2c2e2a]/30 hover:bg-[#2c2e2a]/60',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
