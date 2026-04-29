'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { fetchRaporData, generateRaporPDF, RaporData } from '@/lib/exportRapor';
import { getLevelInfo } from '@/lib/gamification';

export default function ExportRaporPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<string>('');
  const [previewData, setPreviewData] = useState<RaporData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (selectedKelas) {
      loadSiswa(selectedKelas);
    }
  }, [selectedKelas]);

  useEffect(() => {
    if (selectedSiswa && user) {
      loadPreview(selectedSiswa);
    } else {
      setPreviewData(null);
    }
  }, [selectedSiswa, user]);

  const init = async () => {
    const u = await getCurrentUser();
    if (!u || u.role !== 'guru') {
      router.push('/login');
      return;
    }
    setUser(u);

    const { data: kelas } = await supabase.from('kelas').select('*').order('nama');
    setKelasList(kelas || []);
    if (kelas && kelas.length > 0) {
      setSelectedKelas(kelas[0].id);
    }

    setLoading(false);
  };

  const loadSiswa = async (kelasId: string) => {
    const { data } = await supabase
      .from('users')
      .select('id, nama, nis_nip, xp, level')
      .eq('role', 'siswa')
      .eq('kelas_id', kelasId)
      .order('nama');
    setSiswaList(data || []);
    setSelectedSiswa('');
  };

  const loadPreview = async (siswaId: string) => {
    const data = await fetchRaporData(siswaId, user.id);
    setPreviewData(data);
  };

  const downloadSingle = async () => {
    if (!previewData) return;
    setGenerating(true);
    try {
      const doc = generateRaporPDF(previewData);
      const filename = `Rapor_${previewData.siswa.nama.replace(/\s+/g, '_')}_${previewData.metadata.semester}_${previewData.metadata.tahun_ajaran.replace('/', '-')}.pdf`;
      doc.save(filename);
    } catch (e) {
      alert('Gagal generate PDF: ' + (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadBulk = async () => {
    if (siswaList.length === 0) return;
    if (!confirm(`Generate ${siswaList.length} rapor sekaligus? Browser akan download satu per satu.`)) return;

    setGenerating(true);
    setProgress({ current: 0, total: siswaList.length });

    try {
      for (let i = 0; i < siswaList.length; i++) {
        const s = siswaList[i];
        setProgress({ current: i + 1, total: siswaList.length });
        const data = await fetchRaporData(s.id, user.id);
        if (data) {
          const doc = generateRaporPDF(data);
          const filename = `Rapor_${data.siswa.nama.replace(/\s+/g, '_')}_${data.metadata.semester}_${data.metadata.tahun_ajaran.replace('/', '-')}.pdf`;
          doc.save(filename);
          // Small delay supaya browser gak crash dari rapid download
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      alert(`✅ ${siswaList.length} rapor berhasil di-generate!`);
    } catch (e) {
      alert('Error: ' + (e as Error).message);
    } finally {
      setGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F9FF]">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3 flex-wrap">
          <button onClick={() => router.push('/guru')} className="text-blue-600 text-sm">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold flex-1">📄 Export Rapor</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Mode Selector */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBulkMode(false)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                !bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              👤 Per Siswa
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              👥 Bulk (Satu Kelas)
            </button>
          </div>

          {/* Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Kelas</label>
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>

            {!bulkMode && (
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Siswa</label>
                <select
                  value={selectedSiswa}
                  onChange={(e) => setSelectedSiswa(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">-- Pilih siswa --</option>
                  {siswaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.nis_nip})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* PER SISWA: Preview */}
        {!bulkMode && previewData && (
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              👁️ Preview Rapor
            </h2>

            {/* Identitas */}
            <section>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Identitas Siswa</h3>
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
                <div><span className="text-gray-500">Nama:</span> <strong>{previewData.siswa.nama}</strong></div>
                <div><span className="text-gray-500">NIS:</span> <strong>{previewData.siswa.nis_nip}</strong></div>
                <div><span className="text-gray-500">Kelas:</span> <strong>{previewData.siswa.kelas_nama}</strong></div>
                <div><span className="text-gray-500">Wali Kelas:</span> <strong>{previewData.guru.nama}</strong></div>
                <div className="col-span-2">
                  <span className="text-gray-500">Level:</span>{' '}
                  <strong>
                    {getLevelInfo(previewData.siswa.xp).emoji} {getLevelInfo(previewData.siswa.xp).title} (Lvl {previewData.siswa.level}) - {previewData.siswa.xp.toLocaleString()} XP
                  </strong>
                </div>
              </div>
            </section>

            {/* Ringkasan */}
            <section>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Ringkasan</h3>
              <div className="grid grid-cols-3 gap-2">
                <PreviewStat label="Materi Selesai" value={previewData.ringkasan.total_materi_selesai} />
                <PreviewStat label="Kuis Dikerjakan" value={previewData.ringkasan.total_kuis_selesai} />
                <PreviewStat label="Lulus KKM" value={previewData.ringkasan.total_kuis_lulus} />
                <PreviewStat label="Rata-rata" value={previewData.ringkasan.rata_nilai_kuis.toFixed(1)} />
                <PreviewStat label="Badge" value={previewData.ringkasan.total_badges} />
                <PreviewStat label="Mapel" value={previewData.ringkasan.total_mapel_dipelajari} />
              </div>
            </section>

            {/* Kuis per Mapel */}
            {previewData.kuis_per_mapel.length > 0 && (
              <section>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                  Nilai Kuis ({previewData.kuis_per_mapel.length} mapel)
                </h3>
                <div className="space-y-2">
                  {previewData.kuis_per_mapel.map((mapel) => (
                    <div key={mapel.mapel} className="border rounded-lg overflow-hidden">
                      <div className="bg-blue-50 px-3 py-2 flex justify-between items-center">
                        <span className="font-semibold text-sm text-blue-900">{mapel.mapel}</span>
                        <span className="text-xs bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                          Rata: {mapel.rata_rata.toFixed(1)}
                        </span>
                      </div>
                      <div className="divide-y">
                        {mapel.items.map((item, idx) => (
                          <div key={idx} className="px-3 py-2 flex justify-between items-center text-sm">
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium">{item.judul}</p>
                              <p className="text-xs text-gray-500">{item.tanggal}</p>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <span className={`font-bold text-base ${item.lulus ? 'text-green-600' : 'text-red-600'}`}>
                                {item.nilai.toFixed(0)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                item.lulus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {item.lulus ? 'Lulus' : 'Belum'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {previewData.mastery_list.length > 0 && (
              <section>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                  Penguasaan Materi ({previewData.mastery_list.length})
                </h3>
                <div className="text-xs text-gray-500">
                  {previewData.mastery_list.filter((m) => m.level === 'dikuasai').length} dikuasai •{' '}
                  {previewData.mastery_list.filter((m) => m.level === 'mahir').length} mahir •{' '}
                  {previewData.mastery_list.filter((m) => m.level === 'familiar').length} familiar
                </div>
              </section>
            )}

            {previewData.badges.length > 0 && (
              <section>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">
                  Badge ({previewData.badges.length})
                </h3>
                <div className="flex flex-wrap gap-1">
                  {previewData.badges.slice(0, 10).map((b, i) => (
                    <span key={i} className="text-xl" title={b.name}>{b.icon}</span>
                  ))}
                  {previewData.badges.length > 10 && (
                    <span className="text-xs text-gray-500 self-center ml-1">
                      +{previewData.badges.length - 10}
                    </span>
                  )}
                </div>
              </section>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={downloadSingle}
                disabled={generating}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-lg font-medium hover:from-[#0d3562] hover:to-[#1A4A7A] disabled:opacity-50"
              >
                {generating ? '⏳ Generating...' : '📥 Download PDF Rapor'}
              </button>
            </div>
          </div>
        )}

        {/* PER SISWA: Empty state */}
        {!bulkMode && !previewData && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-5xl mb-3">👆</div>
            <p className="text-gray-600 font-medium">Pilih siswa untuk melihat preview rapor</p>
          </div>
        )}

        {/* BULK MODE */}
        {bulkMode && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold mb-3">👥 Bulk Export</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate rapor untuk <strong>semua {siswaList.length} siswa</strong> di kelas terpilih.
              Browser akan download satu per satu.
            </p>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded mb-4">
              <p className="text-xs text-yellow-800">
                💡 <strong>Tip:</strong> Browser mungkin minta izin untuk multiple downloads. Klik "Allow" / "Izinkan".
              </p>
            </div>

            {generating && progress.total > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>{progress.current} / {progress.total} rapor</span>
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={downloadBulk}
              disabled={generating || siswaList.length === 0}
              className="w-full px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              {generating
                ? `⏳ Generating ${progress.current}/${progress.total}...`
                : `📥 Generate ${siswaList.length} Rapor Sekaligus`}
            </button>

            {/* List preview */}
            {siswaList.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-600 mb-2">Daftar siswa:</p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {siswaList.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm py-1 px-2 bg-gray-50 rounded">
                      <span className="text-gray-500 text-xs">{s.nis_nip}</span>
                      <span className="flex-1">{s.nama}</span>
                      <span className="text-xs text-gray-500">Lv {s.level || 1} • {s.xp || 0} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-blue-50 rounded-lg p-2 text-center">
      <p className="text-xl font-bold text-blue-700">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}
