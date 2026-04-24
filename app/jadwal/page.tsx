// app/jadwal/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { db, Jadwal, User } from '@/lib/db/schema';
import { Calendar, Clock } from 'lucide-react';

export default function JadwalPage() {
  const { user } = useAuthStore();
  const [jadwal, setJadwal] = useState<Jadwal[]>([]);
  const [guruMap, setGuruMap] = useState<Map<string, User>>(new Map());
  const [selectedHari, setSelectedHari] = useState(new Date().getDay() || 1);

  const hariList = [
    { num: 1, short: 'Sen', full: 'Senin' },
    { num: 2, short: 'Sel', full: 'Selasa' },
    { num: 3, short: 'Rab', full: 'Rabu' },
    { num: 4, short: 'Kam', full: 'Kamis' },
    { num: 5, short: 'Jum', full: 'Jumat' },
  ];

  useEffect(() => {
    async function load() {
      if (!user) return;
      let data: Jadwal[] = [];
      if (user.role === 'siswa' && user.kelasId) {
        data = await db.jadwal.where('kelasId').equals(user.kelasId).toArray();
      } else if (user.role === 'guru') {
        data = await db.jadwal.where('guruId').equals(user.id).toArray();
      } else {
        data = await db.jadwal.toArray();
      }
      setJadwal(data);

      const guruIds = Array.from(new Set(data.map((j) => j.guruId)));
      const gurus = await Promise.all(guruIds.map((id) => db.users.get(id)));
      const m = new Map<string, User>();
      gurus.forEach((g) => g && m.set(g.id, g));
      setGuruMap(m);
    }
    load();
  }, [user]);

  const jadwalHari = jadwal
    .filter((j) => j.hari === selectedHari)
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

  return (
    <AppShell title="Jadwal Pelajaran">
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="md:hidden mb-4">
          <h1 className="text-2xl font-bold text-[#1A4A7A]">Jadwal Pelajaran</h1>
          <p className="text-sm text-gray-500">Kompas pelayaran mingguanmu</p>
        </div>

        {/* Pilih hari */}
        <div className="bg-white rounded-xl p-3 border border-gray-100 mb-4">
          <div className="grid grid-cols-5 gap-2">
            {hariList.map((h) => (
              <button
                key={h.num}
                onClick={() => setSelectedHari(h.num)}
                className={`py-2.5 rounded-lg text-sm font-medium transition ${
                  selectedHari === h.num
                    ? 'bg-[#1A4A7A] text-white'
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
        {jadwalHari.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <Calendar className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500">Tidak ada jadwal di {hariList.find((h) => h.num === selectedHari)?.full}</p>
            <p className="text-xs text-gray-400 mt-1">Selamat beristirahat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jadwalHari.map((j) => {
              const guru = guruMap.get(j.guruId);
              return (
                <div key={j.id} className="bg-white rounded-xl p-4 border border-gray-100 flex gap-4">
                  <div className="flex flex-col items-center justify-center bg-[#F4F9FF] rounded-lg px-3 py-2 min-w-[72px]">
                    <Clock size={14} className="text-[#2E86C1] mb-1" />
                    <p className="text-xs font-bold text-[#1A4A7A]">{j.jamMulai}</p>
                    <p className="text-[10px] text-gray-400">s/d</p>
                    <p className="text-xs font-bold text-[#1A4A7A]">{j.jamSelesai}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-0.5">{j.mapel}</h3>
                    {user?.role === 'siswa' && guru && (
                      <p className="text-xs text-gray-500">Pengajar: {guru.nama}</p>
                    )}
                    {user?.role === 'guru' && (
                      <p className="text-xs text-gray-500">Kelas mengajar</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <span className="text-[10px] px-2 py-0.5 bg-[#F4F9FF] text-[#2E86C1] rounded-full">
                        {hariList.find((h) => h.num === j.hari)?.full}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}