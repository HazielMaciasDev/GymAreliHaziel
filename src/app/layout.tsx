import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gym Guide',
  description: 'Tu guía personal de gym — Haziel & Areli',
  manifest: '/GymAreliHaziel/manifest.json',
  icons: { icon: '/GymAreliHaziel/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#163300',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-dvh bg-paper text-charcoal antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}