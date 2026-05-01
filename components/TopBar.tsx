// components/TopBar.tsx
'use client';

import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { Cloud, CloudOff, Bell } from 'lucide-react';
import Link from 'next/link';
import SandeqLogo from './SandeqLogo';
import { useAuthStore } from '@/lib/store/auth';

interface Props {
  title?: string;
}

export default function TopBar({ title }: Props) {
  const isOnline = useOnlineStatus();
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/78 backdrop-blur-xl md:bg-transparent md:border-0">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="md:hidden flex items-center gap-2">
          <Link href="/beranda" className="flex items-center gap-2 rounded-md">
            <SandeqLogo className="w-8 h-8" />
            <span className="font-semibold text-[#1A4A7A]">SANDEQ</span>
          </Link>
        </div>

        {title && (
          <h1 className="hidden md:block text-xl font-semibold text-slate-950">{title}</h1>
        )}

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ring-1 ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                : 'bg-orange-50 text-orange-700 ring-orange-100'
            }`}
            title={isOnline ? 'Terhubung' : 'Mode Offline'}
          >
            {isOnline ? (
              <>
                <Cloud size={14} />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <CloudOff size={14} />
                <span className="hidden sm:inline">Offline</span>
              </>
            )}
          </div>
          <Link
            href="/pengumuman"
            className="p-2 rounded-md hover:bg-white/80 text-slate-600 transition"
            aria-label="Pengumuman"
          >
            <Bell size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
