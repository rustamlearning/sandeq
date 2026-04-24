// app/absensi/guru/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/AppShell';
import { useAuthStore } from '@/lib/store/auth';
import { db, Jadwal, User, Absensi } from '@/lib/db/schema';
import {
  Calendar, CheckCircle2, XCircle, MinusCircle,
  AlertCircle, Save, Users, CloudOff
} from 'lucide-react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

type Status = 'hadir' | 'sakit' | 'izin' | 'alpha';

export default function AbsensiGuruPage() {
  const { user } = useAuthStore();
  const isOnline = useOnlineStatus();
  const [jadwalHariIni, setJadwalHariIni] = useState<Jadwal[]>([]);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [siswaList, setSiswaList] = useState<User[]>([]);
  const [absensi, setAbsensi] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const hariIni = new Date().getDay();

  useEffect(() => {
    async function load() {
      if (!user || user.role !== 'guru') return;
      const js = await db.jadwal
        .where('guruId').equals(user.id)
        .and((j) => j.hari === hariIni)
        .toArray();
      js.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
      setJadwalHariIni(js);
    }
    load();
  }, [user, hariIni]);

  useEffect(() => {
    async function loadSiswa() {
      if (!selectedJadwal) {
        setSiswaList([]);
        setAbsensi({});
        return;
      }
      const siswa = await db.users
        .where('kelasId').equals(selectedJadwal.kelasId)
        .and((u) => u.role === 'siswa' && u.aktif)
        .toArray();
      siswa.sort((a, b) => a.nama.localeCompare(b.nama));
      setSiswaList(siswa);

      // Load existing absensi for today
      const existing = await db.absensi
        .where('jadwalId').equals(selectedJadwal.id)
        .and((a) => a.tanggal === today)
        .toArray();

      const map: Record<string, Status> = {};
      siswa.forEach((s) => {
        const rec = existing.find((e) => e.siswaId === s.id);
        map[s.id] = rec?.status || 'hadir';
      });
      setAbsensi(map);
      setSaved(false);
    }
    loadSiswa();
  }, [selectedJadwal, today]);

  const handleSave = async () => {
    if (!selectedJadwal || !user) return;
    setSaving(true);

    for (const siswa of siswaList) {
      const status = absensi[siswa.id] || 'hadir';
      const id = `abs-${siswa.id}-${selectedJadwal.id}-${today}`;
      const record: Absensi = {
        id,
        siswaId: siswa.id,
        jadwalId: selectedJadwal.id,
        tanggal: today,
        status,
        dicatatOleh: user.id,
        createdAt: new Date().toISOString(),
        syncedAt: isOnline ? new Date().toISOString() : undefined,
      };
      await db.absensi.put(record);

      if (!isOnline) {
        await db.syncQueue.add({
          type: 'absensi',
          action: 'create',
          data: record,
          createdAt: new Date().toISOString(),
        });
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const setAll = (status: Status) => {
    const newMap: Record<string, Status> = {};
    siswaList.forEach((s) => (newMap[s.id] = status));
    setAbsensi(newMap);
  };

  const stats = useMemo(() => {
    return {
      hadir: Object.values(absensi).filter((s) => s === 'hadir').length,
      sakit: Object.values(absensi).filter((s) => s === 'sakit').length,
      izin: Object.values(absensi).filter((s) => s === 'izin').length,
      alpha: Object.values(absensi).filter((s) => s === 'alpha').length,
    };
  }, [absensi]);

  if (!user || user.role !== 'guru') {
    return (
      <AppShell>
        <div className="p-6 text-center text-gray-500">Halaman khusus guru</div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Absensi Siswa">
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="md:hidden mb-4">
          <h1 className="text-2xl font-bold text-[#1A4A7A]">Absensi Siswa</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Pilih mapel */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
          <label className="block text-sm font-semibold text-[#1A4A7A] mb-2">Pilih Jadwal Hari Ini</label>
          {jadwalHariIni.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Tidak ada jadwal mengajar hari ini
            </p>
          ) : (
            <div className="grid gap-2">
              {jadwalHariIni.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJadwal(j)}
                  className={`text-left p-3 rounded-lg border-2 transition ${
                    selectedJadwal?.id === j.id
                      ? 'border-[#2E86C1] bg-[#F4F9FF]'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-800">{j.mapel}</p>
                  <p className="text-xs text-gray-500">{j.jamMulai} - {j.jamSelesai}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedJadwal && (
          <>
            {/* Ringkasan */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                <p className="text-[10px] text-gray-500">Hadir</p>
                <p className="text-lg font-bold text-green-600">{stats.hadir}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                <p className="text-[10px] text-gray-500">Sakit</p>
                <p className="text-lg font-bold text-orange-500">{stats.sakit}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                <p className="text-[10px] text-gray-500">Izin</p>
                <p className="text-lg font-bold text-[#2E86C1]">{stats.izin}</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-100">
                <p className="text-[10px] text-gray-500">Alpha</p>
                <p className="text-lg font-bold text-red-500">{stats.alpha}</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setAll('hadir')}
                className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-full whitespace-nowrap font-medium hover:bg-green-100"
              >
                ✓ Semua Hadir
              </button>
              <button
                onClick={() => setAll('alpha')}
                className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-full whitespace-nowrap font-medium hover:bg-red-100"
              >
                Reset
              </button>
            </div>

            {/* Daftar siswa */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
              {siswaList.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="mx-auto mb-2 text-gray-300" size={32} />
                  Belum ada siswa terdaftar di kelas ini
                </div>
              ) : (
                siswaList.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-3 ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#1A4A7A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {s.nama.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{s.nama}</p>
                      <p className="text-xs text-gray-400">{s.nisNip}</p>
                    </div>
                    <div className="flex gap-1">
                      <StatusBtn
                        active={absensi[s.id] === 'hadir'}
                        onClick={() => setAbsensi({ ...absensi, [s.id]: 'hadir' })}
                        color="#27AE60"
                        icon={CheckCircle2}
                        label="H"
                      />
                      <StatusBtn
                        active={absensi[s.id] === 'sakit'}
                        onClick={() => setAbsensi({ ...absensi, [s.id]: 'sakit' })}
                        color="#F39C12"
                        icon={AlertCircle}
                        label="S"
                      />
                      <StatusBtn
                        active={absensi[s.id] === 'izin'}
                        onClick={() => setAbsensi({ ...absensi, [s.id]: 'izin' })}
                        color="#2E86C1"
                        icon={MinusCircle}
                        label="I"
                      />
                      <StatusBtn
                        active={absensi[s.id] === 'alpha'}
                        onClick={() => setAbsensi({ ...absensi, [s.id]: 'alpha' })}
                        color="#E74C3C"
                        icon={XCircle}
                        label="A"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Simpan */}
            {siswaList.length > 0 && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-[#1A4A7A] hover:bg-[#153c61] text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  'Menyimpan...'
                ) : saved ? (
                  <>
                    <CheckCircle2 size={18} />
                    Tersimpan!
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Simpan Absensi
                    {!isOnline && <CloudOff size={14} className="ml-1 opacity-70" />}
                  </>
                )}
              </button>
            )}
            {!isOnline && (
              <p className="text-xs text-center text-gray-500 mt-2 italic">
                Mode offline — data akan tersinkron saat online
              </p>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatusBtn({ active, onClick, color, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs transition ${
        active ? 'text-white scale-105' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
      }`}
      style={{ backgroundColor: active ? color : undefined }}
      title={label === 'H' ? 'Hadir' : label === 'S' ? 'Sakit' : label === 'I' ? 'Izin' : 'Alpha'}
    >
      {label}
    </button>
  );
}