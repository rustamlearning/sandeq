// app/nilai/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { db, Nilai } from '@/lib/db/schema';
import { Award, TrendingUp } from 'lucide-react';

export default function NilaiPage() {
  const { user } = useAuthStore();
  const [nilai, setNilai] = useState<Nilai[]>([]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      if (user.role === 'siswa') {
        const data = await db.nilai.where('siswaId').equals(user.id).toArray();
        setNilai(data);
      } else {
        setNilai([]);
      }
    }
    load();
  }, [user]);

  // Kelompok per mapel
  const byMapel = useMemo(() => {
    const map = new Map<string, Nilai[]>();
    nilai.forEach((n) => {
      if (!map.has(n.mapel)) map.set(n.mapel, []);
      map.get(n.mapel)!.push(n);
    });
    return Array.from(map.entries()).map(([mapel, items]) => {
      const totalBobot = items.reduce((s, i) => s + i.bobot, 0);
      const weighted = items.reduce((s, i) => s + (i.nilai * i.bobot), 0);
      const akhir = totalBobot > 0 ? weighted / totalBobot : 0;
      return { mapel, items, nilaiAkhir: akhir };
    });
  }, [nilai]);

  const rataRata = useMemo(() => {
    if (byMapel.length === 0) return 0;
    return byMapel.reduce((s, m) => s + m.nilaiAkhir, 0) / byMapel.length;
  }, [byMapel]);

  const predikat = (n: number) => {
    if (n >= 90) return { label: 'Sangat Baik', color: '#27AE60' };
    if (n >= 80) return { label: 'Baik', color: '#2E86C1' };
    if (n >= 70) return { label: 'Cukup', color: '#F39C12' };
    return { label: 'Perlu Perbaikan', color: '#E74C3C' };
  };

  if (user?.role !== 'siswa') {
    return (
      <AppShell title="Nilai">
        <div className="p-6 text-center text-gray-500">
          <Award className="mx-auto mb-2 text-gray-300" size={48} />
          <p>Halaman ini khusus untuk siswa</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Nilai & Rapor">
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="md:hidden mb-4">
          <h1 className="text-2xl font-bold text-[#1A4A7A]">Nilai & Rapor</h1>
          <p className="text-sm text-gray-500">Pencapaian akademik pelayaranmu</p>
        </div>

        {/* Ringkasan */}
        <div className="bg-gradient-to-br from-[#1A4A7A] to-[#2E86C1] rounded-2xl p-6 text-white mb-5 text-center">
          <TrendingUp className="mx-auto mb-2" size={32} />
          <p className="text-sm opacity-90">Rata-rata Nilai</p>
          <p className="text-5xl font-bold my-2">{rataRata.toFixed(1)}</p>
          <p className="text-xs opacity-80">{predikat(rataRata).label}</p>
        </div>

        {/* Per mapel */}
        {byMapel.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <Award className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500">Belum ada nilai tercatat</p>
          </div>
        ) : (
          <div className="space-y-3">
            {byMapel.map(({ mapel, items, nilaiAkhir }) => {
              const p = predikat(nilaiAkhir);
              return (
                <div key={mapel} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <h3 className="font-bold text-[#1A4A7A]">{mapel}</h3>
                      <p className="text-xs" style={{ color: p.color }}>{p.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold" style={{ color: p.color }}>
                        {nilaiAkhir.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-gray-400">Nilai Akhir</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((i) => (
                      <div key={i.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-[#F4F9FF] text-[#1A4A7A] px-2 py-0.5 rounded">
                            {i.komponen}
                          </span>
                          <span className="text-xs text-gray-500">Bobot {i.bobot}%</span>
                        </div>
                        <span className="font-semibold text-gray-700">{i.nilai}</span>
                      </div>
                    ))}
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