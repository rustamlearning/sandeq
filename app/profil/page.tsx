// app/profil/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { db, Kelas } from '@/lib/db/schema';
import {
  User, LogOut, Info, Cloud, CloudOff, Shield,
  School, GraduationCap, Briefcase, ChevronRight, Download
} from 'lucide-react';
import SandeqLogo from '@/components/SandeqLogo';

export default function ProfilPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isOnline = useOnlineStatus();
  const [kelas, setKelas] = useState<Kelas | null>(null);
  const [syncPending, setSyncPending] = useState(0);
  const [storageInfo, setStorageInfo] = useState<{ materi: number; kuis: number; nilai: number; absensi: number }>({
    materi: 0, kuis: 0, nilai: 0, absensi: 0,
  });

  useEffect(() => {
    async function load() {
      if (!user) return;
      if (user.kelasId) {
        const k = await db.kelas.get(user.kelasId);
        setKelas(k || null);
      }
      const q = await db.syncQueue.count();
      setSyncPending(q);

      const materi = await db.materi.count();
      const kuis = await db.kuis.count();
      const nilai = await db.nilai.count();
      const absensi = await db.absensi.count();
      setStorageInfo({ materi, kuis, nilai, absensi });
    }
    load();
  }, [user]);

  const handleLogout = () => {
    if (confirm('Yakin ingin keluar dari aplikasi?')) {
      logout();
      router.push('/login');
    }
  };

  const handleClearData = async () => {
    if (!confirm('Ini akan menghapus semua data lokal. Anda perlu login ulang. Lanjutkan?')) return;
    await db.delete();
    logout();
    window.location.href = '/login';
  };

  if (!user) return null;

  const roleIcon = {
    siswa: GraduationCap,
    guru: Briefcase,
    admin: Shield,
  }[user.role];
  const RoleIcon = roleIcon;

  return (
    <AppShell title="Profil">
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="md:hidden mb-4">
          <h1 className="text-2xl font-bold text-[#1A4A7A]">Profil Saya</h1>
        </div>

        {/* Identitas */}
        <div className="bg-gradient-to-br from-[#1A4A7A] to-[#2E86C1] rounded-2xl p-5 md:p-6 text-white mb-4 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-15">
            <SandeqLogo className="w-36 h-36" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-3xl border-2 border-white/30">
              {user.nama.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-xs opacity-90 mb-1 capitalize">
                <RoleIcon size={12} />
                {user.role}
              </div>
              <h2 className="text-xl font-bold leading-tight">{user.nama}</h2>
              <p className="text-sm opacity-80 mt-1">{user.nisNip}</p>
              {kelas && (
                <p className="text-xs opacity-80 flex items-center gap-1 mt-1">
                  <School size={12} /> {kelas.nama} • {kelas.tahunAjaran}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <h3 className="font-bold text-[#1A4A7A] text-sm mb-3 flex items-center gap-2">
            <Info size={14} /> Status Aplikasi
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                {isOnline ? <Cloud size={14} className="text-green-600" /> : <CloudOff size={14} className="text-orange-500" />}
                Status Koneksi
              </span>
              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${isOnline ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Data belum tersinkron</span>
              <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${syncPending > 0 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                {syncPending} item
              </span>
            </div>
          </div>
        </div>

        {/* Storage lokal */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <h3 className="font-bold text-[#1A4A7A] text-sm mb-3 flex items-center gap-2">
            <Download size={14} /> Data Tersimpan Offline
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2.5 bg-[#F4F9FF] rounded-lg">
              <p className="text-xs text-gray-500">Materi</p>
              <p className="font-bold text-[#1A4A7A]">{storageInfo.materi}</p>
            </div>
            <div className="p-2.5 bg-[#F4F9FF] rounded-lg">
              <p className="text-xs text-gray-500">Kuis</p>
              <p className="font-bold text-[#1A4A7A]">{storageInfo.kuis}</p>
            </div>
            <div className="p-2.5 bg-[#F4F9FF] rounded-lg">
              <p className="text-xs text-gray-500">Nilai</p>
              <p className="font-bold text-[#1A4A7A]">{storageInfo.nilai}</p>
            </div>
            <div className="p-2.5 bg-[#F4F9FF] rounded-lg">
              <p className="text-xs text-gray-500">Absensi</p>
              <p className="font-bold text-[#1A4A7A]">{storageInfo.absensi}</p>
            </div>
          </div>
        </div>

        {/* Tentang */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <h3 className="font-bold text-[#1A4A7A] text-sm mb-3">Tentang Sandeq</h3>
          <p className="text-xs text-gray-600 leading-relaxed italic">
            "Seperti perahu Sandeq yang tak pernah gentar menghadapi ombak,
            mari terus melaju meraih ilmu tanpa batas jarak dan sinyal."
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            <p>Versi aplikasi: 1.0.0 (MVP)</p>
            <p>SMA Negeri 6 Pangkajene dan Kepulauan</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <span className="flex items-center gap-2">
              <Download size={16} /> Bersihkan Data Lokal
            </span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <LogOut size={16} />
            Keluar dari Aplikasi
          </button>
        </div>
      </div>
    </AppShell>
  );
}