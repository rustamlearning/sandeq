// app/absensi/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { db, Absensi, Jadwal } from '@/lib/db/schema';
import { Calendar, CheckCircle2, XCircle, MinusCircle, AlertCircle } from 'lucide-react';

export default function AbsensiSiswaPage() {
  const { user } = useAuthStore();
  const [absensi, setAbsensi] = useState<Absensi[]>([]);
  const [jadwalMap, setJadwalMap] = useState<Map<string, Jadwal>>(new Map());

  useEffect(() => {
    async function load() {
      if (!user) return;
      const data = await db.absensi.where('siswaId').equals(user.id).toArray();
      data.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      setAbsensi(data);

      const jadwalIds = Array.from(new Set(data.map((a) => a.jadwalId)));
      const jadwals = await Promise.all(jadwalIds.map((id) => db.jadwal.get(id)));
      const m = new Map<string, Jadwal>();
      jadwals.forEach((j) => j && m.set(j.id, j));
      setJadwalMap(m);
    }
    load();
  }, [user]);

  const stats = {
    hadir: absensi.filter((a) => a.status === 'hadir').length,
    sakit: absensi.filter((a) => a.status === 'sakit').length,
    izin: absensi.filter((a) => a.status === 'izin').length,
    alpha: absensi.filter((a) => a.status === 'alpha').length,
  };
  const total = absensi.length || 1;
  const persentase = ((stats.hadir / total) * 100).toFixed(0);

  return (
    <AppShell title="Rekap Absensi">
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="md:hidden mb-4">
          <h1 className="text-2xl font-bold text-[#1A4A7A]">Rekap Absensi</h1>
          <p className="text-sm text-gray-500">Catatan kehadiranmu</p>
        </div>

        {/* Ringkasan */}
        <div className="bg-gradient-to-br from-[#1A4A7A] to-[#2E86C1] rounded-2xl p-5 text-white mb-5">
          <p className="text-sm opacity-90">Persentase Kehadiran</p>
          <p className="text-4xl font-bold my-1">{persentase}%</p>
          <p className="text-xs opacity-80">{absensi.length} total pertemuan</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5">
          <StatusCard label="Hadir" count={stats.hadir} color="#27AE60" icon={CheckCircle2} />
          <StatusCard label="Sakit" count={stats.sakit} color="#F39C12" icon={AlertCircle} />
          <StatusCard label="Izin" count={stats.izin} color="#2E86C1" icon={MinusCircle} />
          <StatusCard label="Alpha" count={stats.alpha} color="#E74C3C" icon={XCircle} />
        </div>

        {/* Riwayat */}
        <h2 className="font-bold text-[#1A4A7A] mb-3">Riwayat Kehadiran</h2>
        {absensi.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <Calendar className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500">Belum ada data absensi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {absensi.map((a) => {
              const jadwal = jadwalMap.get(a.jadwalId);
              return (
                <div key={a.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <StatusBadge status={a.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{jadwal?.mapel || 'Mata Pelajaran'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(a.tanggal).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    {a.catatan && <p className="text-xs text-gray-400 italic mt-0.5">{a.catatan}</p>}
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

function StatusCard({ label, count, color, icon: Icon }: any) {
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
      <Icon size={18} className="mx-auto mb-1" style={{ color }} />
      <p className="text-lg font-bold text-gray-800">{count}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: any; label: string }> = {
    hadir: { color: '#27AE60', icon: CheckCircle2, label: 'H' },
    sakit: { color: '#F39C12', icon: AlertCircle, label: 'S' },
    izin: { color: '#2E86C1', icon: MinusCircle, label: 'I' },
    alpha: { color: '#E74C3C', icon: XCircle, label: 'A' },
  };
  const c = config[status] || config.hadir;
  const Icon = c.icon;
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: `${c.color}18`, color: c.color }}
    >
      <Icon size={18} />
    </div>
  );
}