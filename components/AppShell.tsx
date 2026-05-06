// components/AppShell.tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import TopBar from './TopBar';
import { LoadingState } from './ui/Skeleton';

interface Props {
  children: ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: Props) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    // Give zustand/persist time to rehydrate
    const t = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }, 100);
    return () => clearTimeout(t);
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return <LoadingState title="Menyiapkan ruang belajar" description="Kami sedang memuat sesi dan navigasimu." />;
  }

  return (
    <div className="app-canvas">
      <Sidebar />
      <div className="md:ml-64">
        <TopBar title={title} />
        <main className="pb-20 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
