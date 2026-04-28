'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface JadwalItem {
  id: string;
  kelas_id: string;
  guru_id: string;
  mapel: string;
  hari: number;
  jam_mulai: string;
  jam_selesai: string;
  guru?: { nama: string };
  kelas?: { nama: string };
}

const HARI_LIST = [
  { num: 1, short: 'Sen', full: 'Senin' },
  { num: 2, short: 'Sel', full: 'Selasa' },
  { num: 3, short: 'Rab', full: 'Rabu' },
  { num: 4, short: 'Kam', full: 'Kamis' },
  { num: 5, short: 'Jum', full: 'Jumat' },
];

const MAPEL_COLORS: Record<string, string> = {
  'Matematika': 'bg-blue-50 border-blue-200 text-blue-800',
  'Bahasa Indonesia': 'bg-green-50 border-green-200 text-green-800',
  'Bahasa Inggris': 'bg-purple-50 border-purple-200 text-purple-800',
  'Fisika': 'bg-cyan-50 border-cyan-200 text-cyan-800',
  'Kimia': 'bg-orange-50 border-orange-200 text-orange-800',
  'Biologi': 'bg-emerald-50 border-emerald-200 text-emerald-800',
};

function getMapelColor(mapel: string) {
  return MAPEL_COLORS[mapel] || 'bg-gray-50 border-gray-200 text-gray-800';
}

export default function JadwalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHari, setSelectedHari] = useState(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 1 : day;
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u) { router.push('/login'); return; }
    setUser(u);

    let query = supabase
      .from('jadwal')
      .select('*, guru:guru_id(nama), kelas:kelas_id(nama)')
      .order('jam_mulai');

    if (u.role === 'siswa' && u.kelas_id) {
      query = query.eq('kelas_id', u.kelas_id);
    } else if (u.role === 'guru') {
      query = query.eq('guru_id', u.id);
    }

    const { data } = await query;
    setJadwal(data || []);
    setLoading(false);
  };

  const jadwalHari = jadwal.filter((j) => j.hari === selectedHari);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📅</div>
          <p className="text-gray-600">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  const backPath = user?.role === 'guru' ? '/guru' : '/siswa';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-500 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-3">
          <button
            onClick={() => router.push(backPath)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Jadwal Pelajaran</h1>
            <p className="text-white/80 text-sm">
              {user?.role === 'siswa' ? 'Jadwal kelas kamu' : 'Jadwal mengajarmu'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Pilih hari */}
        <div className="bg-white rounded-xl shadow-sm p-3 mb-5">
          <div className="grid grid-cols-5 gap-2">
            {HARI_LIST.map((h) => (
              <button
                key={h.num}
                onClick={() => setSelectedHari(h.num)}
                className={`py-3 rounded-xl text-sm font-semibold transition ${
                  selectedHari === h.num
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="md:hidden">{h.short}</div>
                <div className="hidden md:block">{h.full}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Daftar jadwal */}
        {jadwal.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-gray-700">Belum ada jadwal</p>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === 'guru'
                ? 'Jadwal mengajarmu akan muncul di sini'
                : 'Jadwal kelas belum diisi oleh sekolah'}
            </p>
          </div>
        ) : jadwalHari.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <p className="font-semibold text-gray-700">
              Tidak ada pelajaran hari {HARI_LIST.find((h) => h.num === selectedHari)?.full}
            </p>
            <p className="text-sm text-gray-500 mt-1">Selamat beristirahat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jadwalHari.map((j, idx) => (
              <div
                key={j.id}
                className={`rounded-xl border-l-4 p-4 flex gap-4 items-center shadow-sm ${getMapelColor(j.mapel)}`}
              >
                {/* Jam */}
                <div className="text-center min-w-[64px]">
                  <p className="text-base font-bold">{j.jam_mulai}</p>
                  <p className="text-xs opacity-60">—</p>
                  <p className="text-base font-bold">{j.jam_selesai}</p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{j.mapel}</h3>
                  {user?.role === 'siswa' && j.guru && (
                    <p className="text-sm opacity-70 mt-0.5">👤 {j.guru.nama}</p>
                  )}
                  {user?.role === 'guru' && j.kelas && (
                    <p className="text-sm opacity-70 mt-0.5">🏫 {j.kelas.nama}</p>
                  )}
                  {user?.role === 'admin' && (
                    <p className="text-sm opacity-70 mt-0.5">
                      {j.guru?.nama} • {j.kelas?.nama}
                    </p>
                  )}
                </div>

                {/* Urutan */}
                <div className="text-2xl font-bold opacity-20">{idx + 1}</div>
              </div>
            ))}
          </div>
        )}

        {/* Summary minggu ini */}
        {jadwal.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">RINGKASAN MINGGU INI</p>
            <div className="grid grid-cols-5 gap-2">
              {HARI_LIST.map((h) => {
                const count = jadwal.filter((j) => j.hari === h.num).length;
                return (
                  <button
                    key={h.num}
                    onClick={() => setSelectedHari(h.num)}
                    className={`text-center p-2 rounded-lg transition ${
                      selectedHari === h.num ? 'bg-indigo-50 ring-1 ring-indigo-300' : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs text-gray-500">{h.short}</p>
                    <p className={`text-xl font-bold mt-1 ${count > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                      {count}
                    </p>
                    <p className="text-xs text-gray-400">mapel</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
