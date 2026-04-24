// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import DatabaseProvider from '@/components/DatabaseProvider';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SANDEQ — Layarkan Ilmumu',
  description: 'Aplikasi belajar digital SMA Negeri 6 Pangkajene dan Kepulauan',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SANDEQ',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A4A7A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-title" content="SANDEQ" />
      </head>
      <body className={`${poppins.variable} ${inter.variable} font-sans antialiased`}>
        <DatabaseProvider>{children}</DatabaseProvider>
      </body>
    </html>
  );
}