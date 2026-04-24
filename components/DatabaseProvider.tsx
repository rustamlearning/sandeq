// components/DatabaseProvider.tsx
'use client';

import { useEffect, useState } from 'react';
import { seedDatabase } from '@/lib/db/seed';
import SandeqLogo from './SandeqLogo';

export default function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDatabase()
      .then(() => setReady(true))
      .catch((err) => {
        console.error('Seed error:', err);
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1A4A7A] to-[#2E86C1] text-white p-6">
        <div className="animate-pulse mb-4">
          <SandeqLogo className="w-24 h-24" />
        </div>
        <h1 className="text-2xl font-bold mb-2">SANDEQ</h1>
        <p className="text-sm opacity-80">Sandeq sedang berlayar...</p>
      </div>
    );
  }

  return <>{children}</>;
}