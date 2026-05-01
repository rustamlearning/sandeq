// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import DatabaseProvider from '@/components/DatabaseProvider';
import { ToastProvider } from '@/components/ui/Toast';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

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
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
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
        <meta name="apple-mobile-web-app-title" content="SANDEQ" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${poppins.variable} ${inter.variable} font-sans antialiased`}>
        <ServiceWorkerRegister />
        <DatabaseProvider>
          <ToastProvider>{children}</ToastProvider>
        </DatabaseProvider>
      </body>
    </html>
  );
}
