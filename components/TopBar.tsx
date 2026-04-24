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
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 md:bg-transparent md:border-0">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="md:hidden flex items-center gap-2">
          <Link href="/beranda" className="flex items-center gap-2">
            <SandeqLogo className="w-8 h-8" />
            <span className="font-bold text-[#1A4A7A]">SANDEQ</span>
          </Link>
        </div>

        {title && (
          <h1 className="hidden md:block text-xl font-bold text-[#1A4A7A]">{title}</h1>
        )}

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isOnline
                ? 'bg-green-50 text-green-700'
                : 'bg-orange-50 text-orange-700'
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
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Pengumuman"
          >
            <Bell size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}