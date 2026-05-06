// components/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, ClipboardList, Calendar, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const items = [
    { href: '/beranda', label: 'Beranda', icon: Home },
    { href: '/materi', label: 'Materi', icon: BookOpen },
    { href: '/kuis', label: 'Kuis', icon: ClipboardList },
    {
      href: user?.role === 'guru' ? '/absensi/guru' : '/absensi',
      label: 'Absensi',
      icon: Calendar,
    },
    { href: '/profil', label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-white/70 bg-white/82 backdrop-blur-xl md:hidden z-40 safe-bottom">
      <div className="grid grid-cols-5 max-w-md mx-auto px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/beranda' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center py-2 px-1 text-xs min-h-[58px] rounded-md transition-colors ${
                active ? 'text-[#1A4A7A]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {active && <span className="absolute inset-x-2 top-1 h-8 rounded-md bg-[#eef6fb]" />}
              <Icon
                size={22}
                className={`relative ${active ? 'text-[#1A4A7A]' : 'text-slate-500'}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`relative mt-0.5 ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
