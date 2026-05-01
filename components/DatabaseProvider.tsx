// components/DatabaseProvider.tsx
'use client';

import { useEffect, useState } from 'react';
import { seedDatabase } from '@/lib/db/seed';
import { LoadingState } from './ui/Skeleton';

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
    return <LoadingState title="SANDEQ" description="Menyiapkan aplikasi belajar." />;
  }

  return <>{children}</>;
}
