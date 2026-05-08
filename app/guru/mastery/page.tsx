'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Inbox, Lightbulb, Search, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

type MasteryLevel = 'belum_mulai' | 'familiar' | 'berkembang' | 'dikuasai';

interface Siswa {
  id: string;
  nama: string;
  nis_nip: string;
  xp: number;
  level: number;
}

interface Materi {
  id: string;
  judul: string;
  bab: string;
  mapel: string;
}

interface MasteryCell {
  level: MasteryLevel;
  attempts: number;
  last_practiced: string | null;
}

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; color: string; bg: string; icon: string }> = {
  belum_mulai: { label: 'Belum Mulai', color: '#94a3b8', bg: '#f1f5f9', icon: '○' },
  familiar:    { label: 'Familiar',    color: '#f59e0b', bg: '#fef3c7', icon: '◑' },
  berkembang:  { label: 'Berkembang',  color: '#3b82f6', bg: '#dbeafe', icon: '◕' },
  dikuasai:    { label: 'Dikuasai',    color: '#4f46e5', bg: '#d1fae5', icon: '●' },
};

export default function MasteryTrackerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);
  const [masteryMap, setMasteryMap] = useState<Map<string, MasteryCell>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<MasteryLevel | 'semua'>('semua');
  const [selectedMateri, setSelectedMateri] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedKelas) loadData(selectedKelas);
  }, [selectedKelas]);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'guru') { router.push('/login'); return; }
    setUser(u);
    const { data: kelas } = await supabase.from('kelas').select('*').order('nama');
    setKelasList(kelas || []);
    if (kelas && kelas.length > 0) setSelectedKelas(kelas[0].id);
    else setLoading(false);
  };

  const loadData = async (kelasId: string) => {
    setLoading(true);

    const [{ data: siswaData }, { data: materiData }] = await Promise.all([
      supabase.from('users').select('id, nama, nis_nip, xp, level').eq('role', 'siswa').eq('kelas_id', kelasId).order('nama'),
      supabase.from('materi').select('id, judul, bab, mapel').eq('kelas_id', kelasId).order('created_at'),
    ]);

    const siswaList = siswaData || [];
    const materiList = materiData || [];

    setSiswas(siswaList);
    setMateris(materiList);

    if (siswaList.length === 0 || materiList.length === 0) {
      setMasteryMap(new Map());
      setLoading(false);
      return;
    }

    // Fetch semua mastery progress untuk siswa di kelas ini
    const siswaIds = siswaList.map((s) => s.id);
    const materiIds = materiList.map((m) => m.id);

    const { data: progressData } = await supabase
      .from('mastery_progress')
      .select('user_id, materi_id, level, attempts, last_practiced')
      .in('user_id', siswaIds)
      .in('materi_id', materiIds);

    const map = new Map<string, MasteryCell>();
    (progressData || []).forEach((p) => {
      map.set(`${p.user_id}:${p.materi_id}`, {
        level: p.level as MasteryLevel,
        attempts: p.attempts,
        last_practiced: p.last_practiced,
      });
    });

    setMasteryMap(map);
    setLoading(false);
  };

  const VALID_LEVELS = new Set(['belum_mulai', 'familiar', 'berkembang', 'dikuasai']);

  const getCell = (siswaId: string, materiId: string): MasteryCell => {
    const cell = masteryMap.get(`${siswaId}:${materiId}`);
    if (!cell) return { level: 'belum_mulai', attempts: 0, last_practiced: null };
    // Normalize level yang tidak dikenal jadi 'belum_mulai'
    if (!VALID_LEVELS.has(cell.level)) return { ...cell, level: 'belum_mulai' };
    return cell;
  };

  // Hitung stats per siswa
  const getSiswaStats = (siswaId: string) => {
    const cells = materis.map((m) => getCell(siswaId, m.id));
    return {
      dikuasai: cells.filter((c) => c.level === 'dikuasai').length,
      berkembang: cells.filter((c) => c.level === 'berkembang').length,
      familiar: cells.filter((c) => c.level === 'familiar').length,
      belum: cells.filter((c) => c.level === 'belum_mulai').length,
      pct: materis.length ? Math.round((cells.filter((c) => c.level === 'dikuasai').length / materis.length) * 100) : 0,
    };
  };

  // Hitung stats per materi
  const getMateriStats = (materiId: string) => {
    const cells = siswas.map((s) => getCell(s.id, materiId));
    return {
      dikuasai: cells.filter((c) => c.level === 'dikuasai').length,
      pct: siswas.length ? Math.round((cells.filter((c) => c.level === 'dikuasai').length / siswas.length) * 100) : 0,
    };
  };

  // Filter siswa berdasarkan level di materi yang dipilih
  const filteredSiswas = siswas.filter((s) => {
    if (filterLevel === 'semua') return true;
    if (selectedMateri) {
      return getCell(s.id, selectedMateri).level === filterLevel;
    }
    // Filter: minimal satu materi di level tersebut
    return materis.some((m) => getCell(s.id, m.id).level === filterLevel);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Memuat mastery tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="inline-flex items-center gap-2 text-lg font-bold text-slate-800"><Target size={18} /> Mastery Tracker</h1>
              <p className="text-xs text-slate-500">Status penguasaan materi per siswa</p>
            </div>
          </div>
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {/* Legend + Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Filter:</span>
          {(['semua', 'belum_mulai', 'familiar', 'berkembang', 'dikuasai'] as const).map((lvl) => {
            const cfg = lvl === 'semua' ? null : MASTERY_CONFIG[lvl];
            const active = filterLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  active
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {cfg && <span style={{ color: cfg.color }}>{cfg.icon}</span>}
                {lvl === 'semua' ? 'Semua Siswa' : cfg!.label}
              </button>
            );
          })}
          {selectedMateri && (
            <button
              onClick={() => setSelectedMateri(null)}
              className="ml-2 text-xs text-indigo-600 hover:underline"
            >
              ✕ Reset filter materi
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.keys(MASTERY_CONFIG) as MasteryLevel[]).map((lvl) => {
            const cfg = MASTERY_CONFIG[lvl];
            const count = siswas.reduce((acc, s) => {
              const hasLevel = materis.some((m) => getCell(s.id, m.id).level === lvl);
              return acc + (hasLevel ? 1 : 0);
            }, 0);
            return (
              <div key={lvl} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: cfg.bg }}>
                  <span style={{ color: cfg.color }}>{cfg.icon}</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{count}</p>
                  <p className="text-xs text-slate-500">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabel Mastery */}
        {siswas.length === 0 || materis.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
              <Inbox size={25} />
            </div>
            <p className="font-medium">Belum ada data siswa atau materi</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {/* Kolom siswa */}
                    <th className="sticky left-0 z-20 bg-slate-50 text-left px-4 py-3 font-semibold text-slate-700 min-w-[200px] border-r border-slate-100">
                      Siswa ({filteredSiswas.length})
                    </th>
                    {/* Kolom materi */}
                    {materis.map((m) => {
                      const stats = getMateriStats(m.id);
                      const isSelected = selectedMateri === m.id;
                      return (
                        <th
                          key={m.id}
                          className={`px-2 py-3 text-center min-w-[100px] cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                          }`}
                          onClick={() => setSelectedMateri(isSelected ? null : m.id)}
                        >
                          <div className="text-xs font-medium text-slate-700 truncate max-w-[90px] mx-auto" title={m.judul}>
                            {m.judul}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">{m.bab}</div>
                          <div className="mt-1">
                            <span className="text-xs font-bold" style={{ color: MASTERY_CONFIG.dikuasai.color }}>
                              {stats.pct}%
                            </span>
                            <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                              <div
                                className="h-1 rounded-full transition-all"
                                style={{ width: `${stats.pct}%`, backgroundColor: MASTERY_CONFIG.dikuasai.color }}
                              />
                            </div>
                          </div>
                        </th>
                      );
                    })}
                    {/* Kolom progress */}
                    <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 font-semibold text-slate-700 min-w-[120px] border-l border-slate-100 text-center">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSiswas.map((s, idx) => {
                    const stats = getSiswaStats(s.id);
                    return (
                      <tr
                        key={s.id}
                        className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                      >
                        {/* Nama siswa */}
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 border-r border-slate-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                              {s.nama?.[0] || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 text-xs">{s.nama}</p>
                              <p className="text-slate-400 text-xs">{s.nis_nip}</p>
                            </div>
                          </div>
                        </td>

                        {/* Cell mastery per materi */}
                        {materis.map((m) => {
                          const cell = getCell(s.id, m.id);
                          const cfg = MASTERY_CONFIG[cell.level];
                          const cellKey = `${s.id}:${m.id}`;
                          const isHovered = hoveredCell === cellKey;
                          return (
                            <td
                              key={m.id}
                              className="px-2 py-3 text-center relative"
                              onMouseEnter={() => setHoveredCell(cellKey)}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              <div
                                className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center text-base cursor-default transition-transform hover:scale-110"
                                style={{ backgroundColor: cfg.bg, color: cfg.color }}
                                title={`${s.nama} — ${m.judul}: ${cfg.label}`}
                              >
                                {cfg.icon}
                              </div>
                              {/* Tooltip */}
                              {isHovered && (
                                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-slate-800 text-white text-xs rounded-lg p-2 pointer-events-none shadow-xl">
                                  <p className="font-semibold">{cfg.label}</p>
                                  <p className="text-slate-300 mt-0.5">{cell.attempts} attempts</p>
                                  {cell.last_practiced && (
                                    <p className="text-slate-400 mt-0.5">
                                      Terakhir: {new Date(cell.last_practiced).toLocaleDateString('id-ID')}
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Progress siswa */}
                        <td className="sticky right-0 z-10 bg-white px-4 py-3 border-l border-slate-100">
                          <div className="text-center">
                            <p className="text-sm font-bold" style={{ color: MASTERY_CONFIG.dikuasai.color }}>
                              {stats.pct}%
                            </p>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                              <div
                                className="h-1.5 rounded-full transition-all"
                                style={{ width: `${stats.pct}%`, backgroundColor: MASTERY_CONFIG.dikuasai.color }}
                              />
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{stats.dikuasai}/{materis.length}</p>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSiswas.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <Search className="mx-auto mb-2" size={26} />
                <p className="text-sm">Tidak ada siswa dengan filter ini</p>
              </div>
            )}
          </div>
        )}

        {/* Intervention Tips */}
        {filterLevel !== 'semua' && filteredSiswas.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              <span className="inline-flex items-center gap-1.5"><Lightbulb size={15} /> {filteredSiswas.length} siswa dengan status "{MASTERY_CONFIG[filterLevel as MasteryLevel]?.label}"</span>
            </p>
            <p className="text-xs text-amber-700">
              {filterLevel === 'belum_mulai' && 'Siswa ini belum memulai materi. Pertimbangkan untuk mengirim pengingat atau membuka akses materi.'}
              {filterLevel === 'familiar' && 'Siswa ini baru mengenal materi. Berikan latihan tambahan atau review untuk memperkuat pemahaman.'}
              {filterLevel === 'berkembang' && 'Siswa ini sedang berkembang. Dorong dengan kuis tambahan untuk mencapai level "Dikuasai".'}
              {filterLevel === 'dikuasai' && 'Siswa ini sudah menguasai materi. Berikan tantangan lebih atau materi lanjutan.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
