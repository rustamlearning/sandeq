'use client';

import { useState } from 'react';
import { Soal, SoalTipe, SOAL_TIPE_LABELS, SOAL_TIPE_ICONS } from '@/lib/kuis';

interface SoalEditorProps {
  soal: Partial<Soal>;
  onChange: (soal: Partial<Soal>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  index: number;
}

export default function SoalEditor({ soal, onChange, onDelete, onDuplicate, index }: SoalEditorProps) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (patch: Partial<Soal>) => {
    onChange({ ...soal, ...patch });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <select
            value={soal.tipe}
            onChange={(e) => {
              const newTipe = e.target.value as SoalTipe;
              // Reset jawaban saat ganti tipe
              update({
                tipe: newTipe,
                pilihan: newTipe === 'pg' ? ['', '', '', ''] : newTipe === 'true_false' ? ['Benar', 'Salah'] : null,
                jawaban_benar: '',
                kunci_jawaban_alt: [],
                matching_pairs: newTipe === 'matching' ? {
                  pairs: [
                    { id: 'A', kiri: '', kanan: '1' },
                    { id: 'B', kiri: '', kanan: '2' },
                  ],
                  correct: { A: '1', B: '2' },
                } : null,
              });
            }}
            className="text-sm font-medium border rounded-lg px-2 py-1 bg-white"
          >
            <option value="pg">{SOAL_TIPE_ICONS.pg} Pilihan Ganda</option>
            <option value="true_false">{SOAL_TIPE_ICONS.true_false} Benar/Salah</option>
            <option value="isian">{SOAL_TIPE_ICONS.isian} Isian Singkat</option>
            <option value="matching">{SOAL_TIPE_ICONS.matching} Mencocokkan</option>
            <option value="essay">{SOAL_TIPE_ICONS.essay} Essay</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            value={soal.poin || 1}
            onChange={(e) => update({ poin: parseFloat(e.target.value) || 1 })}
            min="1"
            className="w-16 px-2 py-1 border rounded text-sm text-center"
            title="Poin"
          />
          <span className="text-xs text-gray-500">pts</span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▼' : '▲'}
          </button>
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
              title="Duplikat"
            >
              📋
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-100 rounded text-red-600"
              title="Hapus"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Pertanyaan */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Pertanyaan</label>
            <textarea
              value={soal.teks || ''}
              onChange={(e) => update({ teks: e.target.value })}
              placeholder="Tulis pertanyaan di sini..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>

          {/* Editor sesuai tipe */}
          {soal.tipe === 'pg' && <PGEditor soal={soal} update={update} />}
          {soal.tipe === 'true_false' && <TrueFalseEditor soal={soal} update={update} />}
          {soal.tipe === 'isian' && <IsianEditor soal={soal} update={update} />}
          {soal.tipe === 'matching' && <MatchingEditor soal={soal} update={update} />}
          {soal.tipe === 'essay' && <EssayEditor soal={soal} update={update} />}

          {/* Penjelasan (optional) */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Penjelasan (opsional, ditampilkan setelah siswa selesai)
            </label>
            <textarea
              value={soal.penjelasan || ''}
              onChange={(e) => update({ penjelasan: e.target.value })}
              placeholder="Penjelasan jawaban untuk siswa..."
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PILIHAN GANDA EDITOR
// ============================================
function PGEditor({ soal, update }: { soal: Partial<Soal>; update: (p: Partial<Soal>) => void }) {
  const pilihan: string[] = soal.pilihan || ['', '', '', ''];

  const updatePilihan = (i: number, value: string) => {
    const newPilihan = [...pilihan];
    newPilihan[i] = value;
    update({ pilihan: newPilihan });
  };

  const addPilihan = () => {
    if (pilihan.length < 6) update({ pilihan: [...pilihan, ''] });
  };

  const removePilihan = (i: number) => {
    if (pilihan.length <= 2) return;
    const newPilihan = pilihan.filter((_, idx) => idx !== i);
    update({ pilihan: newPilihan, jawaban_benar: soal.jawaban_benar === pilihan[i] ? '' : soal.jawaban_benar });
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600 block">Pilihan Jawaban (klik radio untuk tandai jawaban benar)</label>
      {pilihan.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="radio"
            name={`jawaban_${soal.id || 'new'}`}
            checked={soal.jawaban_benar === p && p !== ''}
            onChange={() => update({ jawaban_benar: p })}
            className="w-4 h-4 text-blue-600 flex-shrink-0"
          />
          <span className="font-bold text-gray-500 w-6">{String.fromCharCode(65 + i)}.</span>
          <input
            type="text"
            value={p}
            onChange={(e) => updatePilihan(i, e.target.value)}
            placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          {pilihan.length > 2 && (
            <button onClick={() => removePilihan(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
              ✕
            </button>
          )}
        </div>
      ))}
      {pilihan.length < 6 && (
        <button onClick={addPilihan} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">
          + Tambah pilihan
        </button>
      )}
    </div>
  );
}

// ============================================
// TRUE/FALSE EDITOR
// ============================================
function TrueFalseEditor({ soal, update }: { soal: Partial<Soal>; update: (p: Partial<Soal>) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600 block">Jawaban Benar</label>
      <div className="flex gap-3">
        <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer flex-1 hover:bg-green-50 transition" 
          style={{ borderColor: soal.jawaban_benar === 'Benar' ? '#10b981' : '#e5e7eb' }}>
          <input
            type="radio"
            name={`tf_${soal.id || 'new'}`}
            checked={soal.jawaban_benar === 'Benar'}
            onChange={() => update({ jawaban_benar: 'Benar' })}
            className="w-4 h-4"
          />
          <span className="font-medium">✅ Benar</span>
        </label>
        <label className="flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer flex-1 hover:bg-red-50 transition"
          style={{ borderColor: soal.jawaban_benar === 'Salah' ? '#ef4444' : '#e5e7eb' }}>
          <input
            type="radio"
            name={`tf_${soal.id || 'new'}`}
            checked={soal.jawaban_benar === 'Salah'}
            onChange={() => update({ jawaban_benar: 'Salah' })}
            className="w-4 h-4"
          />
          <span className="font-medium">❌ Salah</span>
        </label>
      </div>
    </div>
  );
}

// ============================================
// ISIAN SINGKAT EDITOR
// ============================================
function IsianEditor({ soal, update }: { soal: Partial<Soal>; update: (p: Partial<Soal>) => void }) {
  const altJawaban: string[] = soal.kunci_jawaban_alt || [];

  const addAlt = () => {
    update({ kunci_jawaban_alt: [...altJawaban, ''] });
  };

  const updateAlt = (i: number, value: string) => {
    const newAlt = [...altJawaban];
    newAlt[i] = value;
    update({ kunci_jawaban_alt: newAlt });
  };

  const removeAlt = (i: number) => {
    update({ kunci_jawaban_alt: altJawaban.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Jawaban Benar (case-insensitive)
        </label>
        <input
          type="text"
          value={soal.jawaban_benar || ''}
          onChange={(e) => update({ jawaban_benar: e.target.value })}
          placeholder="Contoh: fotosintesis"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Jawaban Alternatif (opsional, untuk variasi penulisan)
        </label>
        <div className="space-y-2">
          {altJawaban.map((alt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={alt}
                onChange={(e) => updateAlt(i, e.target.value)}
                placeholder={`Alternatif ${i + 1}`}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button onClick={() => removeAlt(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                ✕
              </button>
            </div>
          ))}
          <button onClick={addAlt} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">
            + Tambah alternatif
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Tip: Tambahkan variasi penulisan (misal: "fotosintesa", "photosynthesis")
        </p>
      </div>
    </div>
  );
}

// ============================================
// MATCHING EDITOR
// ============================================
function MatchingEditor({ soal, update }: { soal: Partial<Soal>; update: (p: Partial<Soal>) => void }) {
  const pairs = soal.matching_pairs?.pairs || [];

  const addPair = () => {
    if (pairs.length >= 8) return;
    const id = String.fromCharCode(65 + pairs.length);
    const num = String(pairs.length + 1);
    update({
      matching_pairs: {
        pairs: [...pairs, { id, kiri: '', kanan: num }],
        correct: { ...soal.matching_pairs?.correct, [id]: num },
      },
    });
  };

  const updatePair = (i: number, field: 'kiri' | 'kanan', value: string) => {
    const newPairs = [...pairs];
    newPairs[i] = { ...newPairs[i], [field]: value };

    const newCorrect = { ...soal.matching_pairs?.correct };
    if (field === 'kanan') {
      newCorrect[newPairs[i].id] = value;
    }

    update({
      matching_pairs: { pairs: newPairs, correct: newCorrect },
    });
  };

  const removePair = (i: number) => {
    if (pairs.length <= 2) return;
    const removedPair = pairs[i];
    const newPairs = pairs.filter((_: any, idx: number) => idx !== i);
    const newCorrect = { ...soal.matching_pairs?.correct };
    delete newCorrect[removedPair.id];

    update({
      matching_pairs: { pairs: newPairs, correct: newCorrect },
    });
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600 block">
        Pasangan (siswa akan mencocokkan kiri dengan kanan)
      </label>
      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500">
        <span>Kolom A (Pertanyaan)</span>
        <span>Kolom B (Jawaban)</span>
      </div>
      {pairs.map((pair: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="font-bold text-gray-500 w-5">{pair.id}</span>
          <input
            type="text"
            value={pair.kiri}
            onChange={(e) => updatePair(i, 'kiri', e.target.value)}
            placeholder="Item kiri"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <span className="text-gray-400">↔</span>
          <input
            type="text"
            value={pair.kanan}
            onChange={(e) => updatePair(i, 'kanan', e.target.value)}
            placeholder="Pasangan kanan"
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          {pairs.length > 2 && (
            <button onClick={() => removePair(i)} className="p-1 text-red-500 hover:bg-red-50 rounded">
              ✕
            </button>
          )}
        </div>
      ))}
      {pairs.length < 8 && (
        <button onClick={addPair} className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded">
          + Tambah pasangan
        </button>
      )}
      <p className="text-xs text-gray-500">
        Tip: Saat siswa mengerjakan, kolom kanan akan diacak otomatis
      </p>
    </div>
  );
}

// ============================================
// ESSAY EDITOR
// ============================================
function EssayEditor({ soal, update }: { soal: Partial<Soal>; update: (p: Partial<Soal>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Contoh Jawaban Ideal (untuk acuan grading)
        </label>
        <textarea
          value={soal.jawaban_benar || ''}
          onChange={(e) => update({ jawaban_benar: e.target.value })}
          placeholder="Tulis jawaban ideal/rubrik di sini..."
          rows={4}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
        <p className="text-xs text-yellow-800">
          💡 <strong>Essay</strong> akan dinilai manual oleh guru (atau AI assist).
          Jawaban ideal di atas hanya untuk referensi grading, tidak ditampilkan ke siswa.
        </p>
      </div>
    </div>
  );
}
