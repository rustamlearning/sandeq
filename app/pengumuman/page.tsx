// app/pengumuman/page.tsx
'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { db, Pengumuman } from '@/lib/db/schema';
import { Megaphone, Pin } from 'lucide-react';

export default function PengumumanPage() {
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [filter, setFilter] = useState<string>('semua');

  useEffect(() => {
    async function load() {
      const data = await db.pengumuman.orderBy('createdAt').reverse().toArray();
      data.sort((a, b) => {
        if (a.dipin && !b.dipin) return -1;
        if (!a.dipin && b.dipin) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      setPengumuman(data);
    }
    load();
  }, []);

  const filtered = filter === 'semua' ? pengumuman : pengumuman.filter((p) => p.kategori === filter);

  const kategoriColor: Record<string, string> = {
    akademik: '#2E86C1',
    kegiatan: '#27AE60',
    darurat: '#E74C3C',
    umum: '#F39C12',
  };

  return (
    <AppShell title="Pengumuman">
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="md:hidden mb-4">
          <h1 className="text-2xl font-bold text-[#1A4A7A]">Pengumuman</h1>
          <p className="text-sm text-gray-500">Kabar dari mercusuar sekolah</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {['semua', 'akademik', 'kegiatan', 'darurat', 'umum'].map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition capitalize ${
                filter === k
                  ? 'bg-[#1A4A7A] text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center border border-gray-100">
            <Megaphone className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500">Belum ada pengumuman</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-xl p-4 md:p-5 border transition ${
                  p.dipin ? 'border-[#E67E22]' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${kategoriColor[p.kategori]}18`,
                      color: kategoriColor[p.kategori],
                    }}
                  >
                    <Megaphone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor: `${kategoriColor[p.kategori]}18`,
                          color: kategoriColor[p.kategori],
                        }}
                      >
                        {p.kategori}
                      </span>
                      {p.dipin && (
                        <span className="flex items-center gap-1 text-[10px] text-[#E67E22] font-semibold">
                          <Pin size={10} /> Dipin
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{p.judul}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {p.konten}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(p.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}