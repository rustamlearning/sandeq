// app/kuis/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { db, Kuis, Pengerjaan } from '@/lib/db/schema';
import { ClipboardList, Clock, CheckCircle2, ChevronRight, CloudOff } from 'lucide-react';

export default function KuisPage() {
  const { user } = useAuthStore();
  const [kuisList, setKuisList] = useState<Kuis[]>([]);
  const [pengerjaan, setPengerjaan] = useState<Map<string, Pengerjaan>>(new Map());

  useEffect(() => {
    async function load() {
      if (!user) return;
      let data: Kuis[] = [];
      if (user.role === 'siswa' && user.kelasId) {
        data = await db.kuis
          .where('kelasId')
          .equals(user.kelasId)
          .and((k) => k.aktif)
          .toArray();
      } else if (user.role === 'guru') {
        data = await db.kuis.where('guruId').equals(user.id).toArray();
      } else {
        data = await db.kuis.toArray();
      }
      setKuisList(data);

      if (user.role === 'siswa') {
        const ps = await db.pengerjaan.where('siswaId').equals(user.id).toArray();
        const map = new Map<string, Pengerjaan>();
        ps.forEach((p) => map.set(p.kuisId, p));
        setPengerjaan(map);
      }
    }
    load();
  }, [user]);

  return (
    <AppShell title="Kuis & Latihan">
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="md:hidden mb-4">
          <h1 className="text-2xl font-bold text-[#1A4A7A]">Kuis & Latihan</h1>
          <p className="text-sm text-gray-500">Uji pemahamanmu, offline pun tetap bisa</p>
        </div>

        {kuisList.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <ClipboardList className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500">Belum ada kuis tersedia</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {kuisList.map((k) => {
              const done = pengerjaan.get(k.id);
              return (
                <Link
                  href={`/kuis/${k.id}`}
                  key={k.id}
                  className="bg-white rounded-xl p-4 border border-gray-100 hover:border-[#2E86C1] hover:shadow-sm transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                          k.tipe === 'ulangan'
                            ? 'bg-orange-100 text-[#E67E22]'
                            : 'bg-blue-100 text-[#2E86C1]'
                        }`}
                      >
                        {k.tipe}
                      </span>
                      <span className="text-[10px] text-gray-400">{k.mapel}</span>
                    </div>
                    {done && (
                      <div className="flex items-center gap-1 text-[10px] text-green-600">
                        <CheckCircle2 size={12} />
                        Selesai
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-[#1A4A7A]">
                    {k.judul}
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {k.durasiMenit && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {k.durasiMenit} menit
                        </span>
                      )}
                      {done && (
                        <span className="flex items-center gap-1 font-semibold text-[#1A4A7A]">
                          Skor: {done.skor?.toFixed(0)}
                        </span>
                      )}
                      {done && !done.syncedAt && (
                        <span className="flex items-center gap-1 text-orange-500" title="Menunggu sinkronisasi">
                          <CloudOff size={12} />
                        </span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-[#1A4A7A]" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}