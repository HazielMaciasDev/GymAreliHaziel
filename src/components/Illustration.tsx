interface IllustrationProps {
  className?: string;
  variant?: 'dumbbell' | 'kettle' | 'plate' | 'cup' | 'shoe' | 'medal' | 'leaves' | 'star' | 'wave' | 'arrow' | 'sun';
  size?: number;
  float?: boolean;
}

export function Illustration({ className, variant = 'dumbbell', size = 120, float = false }: IllustrationProps) {
  const inner = (() => {
    switch (variant) {
      case 'dumbbell':
        return (
          <>
            <rect x="20" y="46" width="12" height="28" rx="4" fill="#2c2e2a" />
            <rect x="34" y="40" width="6" height="40" rx="2" fill="#2c2e2a" />
            <rect x="40" y="50" width="40" height="20" rx="6" fill="#2c2e2a" />
            <rect x="80" y="40" width="6" height="40" rx="2" fill="#2c2e2a" />
            <rect x="86" y="46" width="12" height="28" rx="4" fill="#2c2e2a" />
            <circle cx="26" cy="60" r="3" fill="#8ed462" />
            <circle cx="92" cy="60" r="3" fill="#ff705d" />
          </>
        );
      case 'kettle':
        return (
          <>
            <path d="M40 30 Q40 18 60 18 Q80 18 80 30" stroke="#2c2e2a" strokeWidth="6" fill="none" strokeLinecap="round" />
            <ellipse cx="60" cy="64" rx="32" ry="30" fill="#ff705d" />
            <ellipse cx="60" cy="64" rx="32" ry="30" fill="none" stroke="#2c2e2a" strokeWidth="5" />
            <circle cx="48" cy="60" r="4" fill="#2c2e2a" />
            <circle cx="72" cy="60" r="4" fill="#2c2e2a" />
            <path d="M48 76 Q60 84 72 76" stroke="#2c2e2a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case 'plate':
        return (
          <>
            <circle cx="60" cy="60" r="38" fill="#2ba0ff" />
            <circle cx="60" cy="60" r="38" fill="none" stroke="#2c2e2a" strokeWidth="5" />
            <circle cx="60" cy="60" r="24" fill="#f5e211" />
            <circle cx="60" cy="60" r="24" fill="none" stroke="#2c2e2a" strokeWidth="4" />
            <circle cx="60" cy="60" r="8" fill="#2c2e2a" />
            <circle cx="42" cy="42" r="3" fill="#ffffff" opacity="0.6" />
          </>
        );
      case 'cup':
        return (
          <>
            <path d="M30 28 L36 92 Q36 100 60 100 Q84 100 84 92 L90 28 Z" fill="#8ed462" />
            <path d="M30 28 L36 92 Q36 100 60 100 Q84 100 84 92 L90 28 Z" fill="none" stroke="#2c2e2a" strokeWidth="5" strokeLinejoin="round" />
            <path d="M30 28 L90 28" stroke="#2c2e2a" strokeWidth="5" strokeLinecap="round" />
            <rect x="60" y="20" width="14" height="14" rx="2" fill="#ff705d" stroke="#2c2e2a" strokeWidth="4" transform="rotate(15 67 27)" />
            <text x="50" y="70" fontFamily="Inter" fontWeight="700" fontSize="20" fill="#2c2e2a">1°</text>
          </>
        );
      case 'shoe':
        return (
          <>
            <path d="M18 64 L24 44 Q26 40 32 40 L52 40 Q60 40 68 50 L82 58 Q92 60 92 70 L92 76 Q92 80 86 80 L20 80 Q14 80 14 74 L14 70 Q14 66 18 64 Z" fill="#2c2e2a" />
            <path d="M30 50 L48 50" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 58 L52 58" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M30 66 L48 66" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="80" cy="48" r="6" fill="#8ed462" stroke="#2c2e2a" strokeWidth="3" />
          </>
        );
      case 'medal':
        return (
          <>
            <path d="M40 12 L48 38 L72 38 L52 54 L60 80 L40 64 L20 80 L28 54 L8 38 L32 38 Z" fill="#f5e211" />
            <path d="M40 12 L48 38 L72 38 L52 54 L60 80 L40 64 L20 80 L28 54 L8 38 L32 38 Z" fill="none" stroke="#2c2e2a" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="40" cy="48" r="10" fill="#ff705d" stroke="#2c2e2a" strokeWidth="3" />
            <text x="40" y="53" textAnchor="middle" fontFamily="Inter" fontWeight="700" fontSize="12" fill="#ffffff">1</text>
          </>
        );
      case 'leaves':
        return (
          <>
            <path d="M60 90 Q20 60 20 30 Q40 20 60 30 Q60 60 60 90" fill="#8ed462" />
            <path d="M60 90 Q100 60 100 30 Q80 20 60 30 Q60 60 60 90" fill="#8ed462" />
            <path d="M60 90 Q20 60 20 30 Q40 20 60 30 Q60 60 60 90" fill="none" stroke="#2c2e2a" strokeWidth="4" strokeLinejoin="round" />
            <path d="M60 90 Q100 60 100 30 Q80 20 60 30 Q60 60 60 90" fill="none" stroke="#2c2e2a" strokeWidth="4" strokeLinejoin="round" />
            <path d="M60 90 L60 30" stroke="#2c2e2a" strokeWidth="3" />
            <circle cx="40" cy="50" r="3" fill="#ff705d" />
            <circle cx="80" cy="50" r="3" fill="#2ba0ff" />
          </>
        );
      case 'star':
        return (
          <>
            <path d="M60 12 L74 44 L108 48 L82 70 L90 104 L60 86 L30 104 L38 70 L12 48 L46 44 Z" fill="#f5e211" />
            <path d="M60 12 L74 44 L108 48 L82 70 L90 104 L60 86 L30 104 L38 70 L12 48 L46 44 Z" fill="none" stroke="#2c2e2a" strokeWidth="4" strokeLinejoin="round" />
            <circle cx="60" cy="60" r="8" fill="#ff705d" stroke="#2c2e2a" strokeWidth="3" />
          </>
        );
      case 'wave':
        return (
          <>
            <path d="M10 60 Q30 30 50 60 Q70 90 90 60 Q110 30 110 60" stroke="#2ba0ff" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M10 80 Q30 50 50 80 Q70 110 90 80" stroke="#ff705d" strokeWidth="6" fill="none" strokeLinecap="round" />
            <circle cx="20" cy="40" r="4" fill="#8ed462" />
            <circle cx="100" cy="40" r="4" fill="#f5e211" />
          </>
        );
      case 'arrow':
        return (
          <>
            <path d="M20 60 L80 60" stroke="#2c2e2a" strokeWidth="6" strokeLinecap="round" />
            <path d="M70 40 L90 60 L70 80" stroke="#2c2e2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="20" cy="60" r="8" fill="#8ed462" stroke="#2c2e2a" strokeWidth="4" />
          </>
        );
      case 'sun':
        return (
          <>
            <circle cx="60" cy="60" r="22" fill="#f5e211" />
            <circle cx="60" cy="60" r="22" fill="none" stroke="#2c2e2a" strokeWidth="4" />
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * Math.PI) / 4;
              const x1 = 60 + Math.cos(a) * 32;
              const y1 = 60 + Math.sin(a) * 32;
              const x2 = 60 + Math.cos(a) * 42;
              const y2 = 60 + Math.sin(a) * 42;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#2c2e2a"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              );
            })}
          </>
        );
    }
  })();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      style={float ? { animation: 'float 4s ease-in-out infinite' } : undefined}
    >
      {inner}
    </svg>
  );
}

export function Sparkle({ size = 16, color = '#ff705d', className }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2 L13.5 9.5 L21 12 L13.5 14.5 L12 22 L10.5 14.5 L3 12 L10.5 9.5 Z"
        fill={color}
        stroke="#2c2e2a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Blob({ className, color = '#8ed462' }: { className?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden
      preserveAspectRatio="none"
    >
      <path
        d="M40 60 Q20 30 60 20 Q110 10 140 30 Q180 50 170 100 Q160 160 110 170 Q60 180 30 140 Q10 100 40 60"
        fill={color}
        stroke="#2c2e2a"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}