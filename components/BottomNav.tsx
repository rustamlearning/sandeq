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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 safe-bottom">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/beranda' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs min-h-[56px] ${
                active ? 'text-[#1A4A7A]' : 'text-gray-500'
              }`}
            >
              <Icon
                size={22}
                className={active ? 'text-[#1A4A7A]' : 'text-gray-500'}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`mt-0.5 ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}