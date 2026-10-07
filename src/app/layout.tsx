import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ProfileGate } from '@/components/ProfileGate';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter-loaded',
  display: 'swap',
});

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
    <html lang="es" className={inter.variable}>
      <body className="min-h-dvh bg-paper text-charcoal antialiased">
        <ProfileGate>{children}</ProfileGate>
      </body>
    </html>
  );
}