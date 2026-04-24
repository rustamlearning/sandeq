// app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import SandeqLogo from '@/components/SandeqLogo';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(isAuthenticated ? '/beranda' : '/login');
    }, 600);
    return () => clearTimeout(t);
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1A4A7A] to-[#2E86C1] text-white p-6">
      <SandeqLogo className="w-28 h-28 mb-4" />
      <h1 className="text-3xl font-bold mb-1">SANDEQ</h1>
      <p className="text-sm opacity-80 italic">Layarkan Ilmumu</p>
    </div>
  );
}