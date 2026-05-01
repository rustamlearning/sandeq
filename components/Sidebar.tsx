'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, BookOpen, ClipboardList, Calendar, User, Megaphone,
  Award, MessageSquare, LogOut, Users, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import SandeqLogo from './SandeqLogo';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const baseItems = [
    { href: '/beranda', label: 'Beranda', icon: Home },
    { href: '/materi', label: 'Materi', icon: BookOpen },
    { href: '/kuis', label: 'Kuis', icon: ClipboardList },
    { href: '/jadwal', label: 'Jadwal', icon: Calendar },
    {
      href: user?.role === 'guru' ? '/absensi/guru' : '/absensi',
      label: 'Absensi',
      icon: Users,
    },
    { href: '/nilai', label: 'Nilai', icon: Award },
    { href: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
    { href: '/forum', label: 'Forum Diskusi', icon: MessageSquare },
    { href: '/profil', label: 'Profil', icon: User },
  ];

  const adminItems = [
    { href: '/admin/pengguna', label: 'Manajemen Pengguna', icon: ShieldCheck },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 border-r border-white/70 bg-white/74 backdrop-blur-xl flex-col z-30">
      <div className="p-5 border-b border-slate-200/70">
        <Link href="/beranda" className="flex items-center gap-3 rounded-lg p-1 transition hover:bg-white/70">
          <SandeqLogo className="w-10 h-10" />
          <div>
            <h1 className="font-semibold text-[#1A4A7A] text-lg leading-tight">SANDEQ</h1>
            <p className="text-xs text-slate-500 leading-tight">Layarkan Ilmumu</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {baseItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== '/beranda' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 ${
                active
                  ? 'bg-white text-[#1A4A7A] font-semibold shadow-sm ring-1 ring-slate-200/80'
                  : 'text-slate-600 hover:bg-white/64 hover:text-slate-950'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}

        {user?.role === 'admin' && (
          <>
            <div className="px-5 pt-4 pb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-200 ${
                    active
                      ? 'bg-white text-[#1A4A7A] font-semibold shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:bg-white/64 hover:text-slate-950'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-200/70">
        <div className="flex items-center gap-3 p-2 mb-2 rounded-lg bg-white/70 ring-1 ring-slate-200/70">
          <div className="w-10 h-10 rounded-lg bg-[#1A4A7A] text-white flex items-center justify-center font-semibold shadow-sm">
            {user?.nama?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.nama}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  );
}
