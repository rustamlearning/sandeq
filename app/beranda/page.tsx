// app/beranda/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { db, Pengumuman, Jadwal, Kuis } from '@/lib/db/schema';
import {
  BookOpen, ClipboardList, Calendar, Award,
  Megaphone, MessageSquare, ChevronRight, Pin
} from 'lucide-react';

export default function BerandaPage() {
  const { user } = useAuthStore();
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [jadwalHariIni, setJadwalHariIni] = useState<Jadwal[]>([]);
  const [kuisAktif, setKuisAktif] = useState<Kuis[]>([]);
  const [stats, setStats] = useState({ materi: 0, kuis: 0, nilai: 0 });

  const hariNama = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hariIni = new Date().getDay();

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      // Pengumuman terbaru (dipin di atas)
      const allPeng = await db.pengumuman.orderBy('createdAt').reverse().toArray();
      const sorted = [...allPeng].sort((a, b) => {
        if (a.dipin && !b.dipin) return -1;
        if (!a.dipin && b.dipin) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      setPengumuman(sorted.slice(0, 3));

      if (user.role === 'siswa' && user.kelasId) {
        const jadwal = await db.jadwal
          .where('kelasId')
          .equals(user.kelasId)
          .and((j) => j.hari === hariIni)
          .toArray();
        jadwal.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
        setJadwalHariIni(jadwal);

        const kuis = await db.kuis
          .where('kelasId')
          .equals(user.kelasId)
          .and((k) => k.aktif)
          .toArray();
        setKuisAktif(kuis);

        const materiCount = await db.materi.where('kelasId').equals(user.kelasId).count();
        const kuisCount = kuis.length;
        const nilaiCount = await db.nilai.where('siswaId').equals(user.id).count();
        setStats({ materi: materiCount, kuis: kuisCount, nilai: nilaiCount });
      } else if (user.role === 'guru') {
        const jadwal = await db.jadwal
          .where('guruId')
          .equals(user.id)
          .and((j) => j.hari === hariIni)
          .toArray();
        jadwal.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
        setJadwalHariIni(jadwal);

        const materiCount = await db.materi.where('guruId').equals(user.id).count();
        const kuisCount = await db.kuis.where('guruId').equals(user.id).count();
        setStats({ materi: materiCount, kuis: kuisCount, nilai: 0 });
      }
    }
    loadData();
  }, [user, hariIni]);

  if (!user) return null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  return (
    <AppShell title="Beranda">
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Hero greeting */}
        <div className="bg-gradient-to-br from-[#1A4A7A] via-[#2E86C1] to-[#1A4A7A] rounded-2xl p-5 md:p-6 text-white mb-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-20">
            <svg width="180" height="180" viewBox="0 0 200 200">
              <path d="M 0 150 Q 50 140 100 150 T 200 150 L 200 200 L 0 200 Z" fill="white" />
            </svg>
          </div>
          <div className="relative">
            <p className="text-sm opacity-90 mb-1">{greeting()},</p>
            <h2 className="text-xl md:text-2xl font-bold mb-1">{user.nama.split(',')[0]}!</h2>
            <p className="text-xs md:text-sm opacity-80">
              {hariNama[hariIni]}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="mt-3 text-xs italic opacity-90">
              "Terus berlayar, ombak apapun takkan menghentikanmu."
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard color="#1A4A7A" icon={BookOpen} label="Materi" value={stats.materi} />
          <StatCard color="#E67E22" icon={ClipboardList} label="Kuis" value={stats.kuis} />
          <StatCard color="#27AE60" icon={Award} label={user.role === 'siswa' ? 'Nilai' : 'Kelas'} value={user.role === 'siswa' ? stats.nilai : jadwalHariIni.length} />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Jadwal hari ini */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#1A4A7A] flex items-center gap-2">
                <Calendar size={18} />
                Jadwal Hari Ini
              </h3>
              <Link href="/jadwal" className="text-xs text-[#2E86C1] hover:underline flex items-center gap-0.5">
                Lihat semua <ChevronRight size={14} />
              </Link>
            </div>
            {jadwalHariIni.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <Calendar className="mx-auto mb-2 opacity-40" size={32} />
                Tidak ada jadwal hari ini. Selamat beristirahat!
              </div>
            ) : (
              <div className="space-y-2">
                {jadwalHariIni.map((j) => (
                  <div key={j.id} className="flex items-center gap-3 p-3 bg-[#F4F9FF] rounded-lg">
                    <div className="w-1 h-10 bg-[#2E86C1] rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800">{j.mapel}</p>
                      <p className="text-xs text-gray-500">{j.jamMulai} - {j.jamSelesai}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pengumuman */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#1A4A7A] flex items-center gap-2">
                <Megaphone size={18} />
                Pengumuman
              </h3>
              <Link href="/pengumuman" className="text-xs text-[#2E86C1] hover:underline flex items-center gap-0.5">
                Semua <ChevronRight size={14} />
              </Link>
            </div>
            {pengumuman.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Belum ada pengumuman
              </div>
            ) : (
              <div className="space-y-3">
                {pengumuman.map((p) => (
                  <Link
                    href="/pengumuman"
                    key={p.id}
                    className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start gap-2">
                      {p.dipin && <Pin size={14} className="text-[#E67E22] mt-0.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 line-clamp-1">{p.judul}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{p.konten}</p>
                        <p className="text-[10px] text-gray-400 mt-1 capitalize">{p.kategori}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Shortcut (siswa: kuis aktif, guru: akses cepat) */}
          {user.role === 'siswa' && kuisAktif.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#1A4A7A] flex items-center gap-2">
                  <ClipboardList size={18} />
                  Kuis Tersedia
                </h3>
                <Link href="/kuis" className="text-xs text-[#2E86C1] hover:underline flex items-center gap-0.5">
                  Semua <ChevronRight size={14} />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {kuisAktif.slice(0, 4).map((k) => (
                  <Link
                    href={`/kuis/${k.id}`}
                    key={k.id}
                    className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-[#2E86C1] transition"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.tipe === 'ulangan' ? 'bg-orange-100 text-[#E67E22]' : 'bg-blue-100 text-[#2E86C1]'}`}>
                      <ClipboardList size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{k.judul}</p>
                      <p className="text-xs text-gray-500">{k.mapel} • {k.durasiMenit ? `${k.durasiMenit} menit` : 'Tanpa batas waktu'}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Akses cepat */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 md:col-span-2">
            <h3 className="font-bold text-[#1A4A7A] mb-3">Akses Cepat</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <QuickLink href="/materi" icon={BookOpen} label="Materi" color="#1A4A7A" />
              <QuickLink href="/kuis" icon={ClipboardList} label="Kuis" color="#E67E22" />
              <QuickLink href="/jadwal" icon={Calendar} label="Jadwal" color="#2E86C1" />
              <QuickLink href="/nilai" icon={Award} label="Nilai" color="#27AE60" />
              <QuickLink href="/pengumuman" icon={Megaphone} label="Info" color="#F39C12" />
              <QuickLink href="/forum" icon={MessageSquare} label="Forum" color="#7F8C8D" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-xl p-3 md:p-4 border border-gray-100 flex items-center gap-3">
      <div
        className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xl md:text-2xl font-bold text-gray-800 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, color }: any) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-gray-50 transition"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={20} />
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
    </Link>
  );
}