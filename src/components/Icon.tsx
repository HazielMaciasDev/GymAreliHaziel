import type { ReactNode } from 'react';

interface IconProps {
  className?: string;
  strokeWidth?: number;
  size?: number;
  children?: ReactNode;
}

function svg(props: IconProps) {
  const { size = 18, strokeWidth = 1.5, className, children } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const Icon = {
  Home: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M10 20v-6h4v6" />
        </>
      ),
    }),
  Calendar: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
          <path d="M8 3v4M16 3v4" />
        </>
      ),
    }),
  Library: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 9v12" />
        </>
      ),
    }),
  History: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 7v5l3 2" />
        </>
      ),
    }),
  Plus: (p: IconProps) =>
    svg({ ...p, children: <><path d="M12 5v14M5 12h14" /></> }),
  Close: (p: IconProps) =>
    svg({ ...p, children: <><path d="M6 6l12 12M18 6l-12 12" /></> }),
  Play: (p: IconProps) => {
    const { size = 18, className } = p;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden
      >
        <path d="M7 5v14l11-7z" />
      </svg>
    );
  },
  ChevronRight: (p: IconProps) =>
    svg({ ...p, children: <path d="M9 6l6 6-6 6" /> }),
  ChevronLeft: (p: IconProps) =>
    svg({ ...p, children: <path d="M15 6l-6 6 6 6" /> }),
  ChevronDown: (p: IconProps) =>
    svg({ ...p, children: <path d="M6 9l6 6 6-6" /> }),
  Trash: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <path d="M4 7h16" />
          <path d="M9 7V4h6v3" />
          <path d="M6 7l1 13h10l1-13" />
        </>
      ),
    }),
  Drag: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <circle cx="9" cy="6" r="1.2" fill="currentColor" />
          <circle cx="15" cy="6" r="1.2" fill="currentColor" />
          <circle cx="9" cy="12" r="1.2" fill="currentColor" />
          <circle cx="15" cy="12" r="1.2" fill="currentColor" />
          <circle cx="9" cy="18" r="1.2" fill="currentColor" />
          <circle cx="15" cy="18" r="1.2" fill="currentColor" />
        </>
      ),
    }),
  Check: (p: IconProps) =>
    svg({ ...p, children: <path d="M5 12l5 5L20 7" /> }),
  Search: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </>
      ),
    }),
  Swap: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <path d="M16 3l5 5-5 5" />
          <path d="M21 8H8" />
          <path d="M8 21l-5-5 5-5" />
          <path d="M3 16h13" />
        </>
      ),
    }),
  Logout: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </>
      ),
    }),
  Save: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <path d="M5 3h11l3 3v15H5z" />
          <path d="M8 3v6h7V3" />
          <path d="M8 14h8v7H8z" />
        </>
      ),
    }),
  Timer: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2 2" />
          <path d="M9 2h6" />
        </>
      ),
    }),
  Note: (p: IconProps) =>
    svg({
      ...p,
      children: (
        <>
          <path d="M5 3h11l3 3v15H5z" />
          <path d="M9 3v6h7" />
          <path d="M9 13h6M9 17h4" />
        </>
      ),
    }),
};