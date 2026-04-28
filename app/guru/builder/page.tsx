"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
type TipeSoal = "pg" | "essay";

interface Opsi {
  key: string;
  text: string;
}

interface SoalDraft {
  id: string; // local-only uuid for key
  pertanyaan: string;
  tipe_soal: TipeSoal;
  opsi: Opsi[];
  kunci_jawaban: string;
  poin: number;
  penjelasan: string;
  sumber: "manual" | "ai" | "import";
}

interface KuisForm {
  judul: string;
  mapel: string;
  deskripsi: string;
  durasi_menit: number;
  kkm: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blankSoal(sumber: SoalDraft["sumber"] = "manual"): SoalDraft {
  return {
    id: uid(),
    pertanyaan: "",
    tipe_soal: "pg",
    opsi: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
    ],
    kunci_jawaban: "A",
    poin: 10,
    penjelasan: "",
    sumber,
  };
}

// ── AI Generate ──────────────────────────────────────────────────────────────
async function generateSoalAI(
  topik: string,
  jumlah: number,
  tipe: TipeSoal,
  tingkat: string
): Promise<SoalDraft[]> {
  const prompt = `Kamu adalah guru Bahasa Inggris. Buat ${jumlah} soal ${
    tipe === "pg" ? "pilihan ganda (4 opsi A/B/C/D)" : "essay"
  } tentang "${topik}" untuk tingkat ${tingkat}.

Balas HANYA dengan JSON array, tanpa markdown, tanpa komentar:
[
  {
    "pertanyaan": "...",
    "tipe_soal": "${tipe}",
    "opsi": ${
      tipe === "pg"
        ? '[{"key":"A","text":"..."},{"key":"B","text":"..."},{"key":"C","text":"..."},{"key":"D","text":"..."}]'
        : "[]"
    },
    "kunci_jawaban": "${tipe === "pg" ? "A/B/C/D" : "contoh jawaban ideal"}",
    "poin": 10,
    "penjelasan": "penjelasan singkat mengapa jawaban itu benar"
  }
]`;

  const res = await fetch("/api/generate-soal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  const text = data.text ?? "[]";

  let parsed: any[];
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("AI mengembalikan format yang tidak valid");
  }

  return parsed.map((s: any) => ({
    id: uid(),
    pertanyaan: s.pertanyaan ?? "",
    tipe_soal: s.tipe_soal ?? tipe,
    opsi: s.opsi ?? [],
    kunci_jawaban: s.kunci_jawaban ?? "",
    poin: Number(s.poin) || 10,
    penjelasan: s.penjelasan ?? "",
    sumber: "ai" as const,
  }));
}

// ── Parse bulk import text ────────────────────────────────────────────────────
function parseBulkText(raw: string): SoalDraft[] {
  const blocks = raw
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim());
    const pertanyaan = lines[0].replace(/^\d+[\.\)]\s*/, "");
    const opsiLines = lines.filter((l) => /^[A-Da-d][\.\)]\s/.test(l));
    const opsi: Opsi[] = opsiLines.map((l) => {
      const key = l[0].toUpperCase();
      const text = l.slice(2).trim();
      return { key, text };
    });
    const kunciLine = lines.find((l) => /^(jawaban|kunci|answer)\s*[:=]/i.test(l));
    const kunci_jawaban = kunciLine ? kunciLine.split(/[:=]/)[1].trim().toUpperCase() : "A";
    return {
      id: uid(),
      pertanyaan,
      tipe_soal: opsi.length > 0 ? "pg" : "essay",
      opsi,
      kunci_jawaban,
      poin: 10,
      penjelasan: "",
      sumber: "import" as const,
    } satisfies SoalDraft;
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function KuisBuilderPage() {
  const router = useRouter();

  // Kuis metadata
  const [form, setForm] = useState<KuisForm>({
    judul: "",
    mapel: "Bahasa Inggris",
    deskripsi: "",
    durasi_menit: 30,
    kkm: 70,
  });

  // Soal list
  const [soalList, setSoalList] = useState<SoalDraft[]>([blankSoal()]);

  // UI state
  const [tab, setTab] = useState<"manual" | "ai" | "import">("manual");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // AI panel state
  const [aiTopik, setAiTopik] = useState("");
  const [aiJumlah, setAiJumlah] = useState(5);
  const [aiTipe, setAiTipe] = useState<TipeSoal>("pg");
  const [aiTingkat, setAiTingkat] = useState("SMP kelas 7");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Bulk import state
  const [bulkText, setBulkText] = useState("");

  // ── Soal CRUD ──
  const updateSoal = useCallback((id: string, patch: Partial<SoalDraft>) => {
    setSoalList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  const deleteSoal = useCallback((id: string) => {
    setSoalList((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addManual = () => {
    setSoalList((prev) => [...prev, blankSoal("manual")]);
    setTab("manual");
  };

  const updateOpsi = (soalId: string, key: string, text: string) => {
    setSoalList((prev) =>
      prev.map((s) =>
        s.id === soalId
          ? { ...s, opsi: s.opsi.map((o) => (o.key === key ? { ...o, text } : o)) }
          : s
      )
    );
  };

  // ── AI Generate ──
  const handleAIGenerate = async () => {
    if (!aiTopik.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const results = await generateSoalAI(aiTopik, aiJumlah, aiTipe, aiTingkat);
      setSoalList((prev) => [...prev, ...results]);
      setSaveMsg(`✅ ${results.length} soal berhasil di-generate!`);
      setTimeout(() => setSaveMsg(null), 3000);
      setTab("manual");
    } catch (e: any) {
      setAiError(e.message || "Gagal generate soal");
    } finally {
      setAiLoading(false);
    }
  };

  // ── Bulk Import ──
  const handleImport = () => {
    const parsed = parseBulkText(bulkText);
    if (parsed.length === 0) return;
    setSoalList((prev) => [...prev, ...parsed]);
    setBulkText("");
    setSaveMsg(`✅ ${parsed.length} soal berhasil diimpor!`);
    setTimeout(() => setSaveMsg(null), 3000);
    setTab("manual");
  };

  // ── Save to Supabase ──
  const handleSave = async () => {
    if (!form.judul.trim()) {
      setSaveMsg("❌ Judul kuis wajib diisi");
      return;
    }
    if (soalList.length === 0) {
      setSaveMsg("❌ Minimal 1 soal diperlukan");
      return;
    }

    setSaving(true);
    setSaveMsg(null);

    try {
      // 1. Insert kuis
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const kuisPayload: any = {
        judul: form.judul,
        mapel: form.mapel,
        deskripsi: form.deskripsi || null,
        durasi_menit: form.durasi_menit,
        kkm: form.kkm,
        guru_id: user?.id,
        is_published: false,
      };

      const { data: kuisData, error: kuisErr } = await supabase
        .from("kuis")
        .insert(kuisPayload)
        .select("id")
        .single();

      if (kuisErr) throw kuisErr;
      const kuisId = kuisData.id;

      // 2. Insert soal
      const soalPayload = soalList.map((s, i) => ({
        kuis_id: kuisId,
        teks: s.pertanyaan,
        tipe: s.tipe_soal,
        pilihan:
          s.tipe_soal === "pg"
            ? s.opsi.map((o) => o.text)
            : null,
        jawaban: s.kunci_jawaban || null,
        poin: s.poin,
        penjelasan: s.penjelasan || null,
        urutan: i + 1,
      }));

      const { error: soalErr } = await supabase.from("soal").insert(soalPayload);
      if (soalErr) throw soalErr;

      setSaveMsg("✅ Kuis berhasil disimpan!");
      setTimeout(() => router.push(`/guru/kuis/${kuisId}`), 1500);
    } catch (e: any) {
      setSaveMsg(`❌ Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const totalPoin = soalList.reduce((sum, s) => sum + s.poin, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kuis Builder</h1>
            <p className="text-sm text-gray-500">
              {soalList.length} soal · {totalPoin} poin total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  saveMsg.startsWith("✅")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {saveMsg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? "Menyimpan..." : "💾 Simpan Kuis"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* ── Metadata Kuis ── */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">📋 Info Kuis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Judul Kuis *
              </label>
              <input
                type="text"
                value={form.judul}
                onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
                placeholder="Contoh: Ulangan Conjunctions Kelas 7A"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={form.mapel}
                onChange={(e) => setForm((f) => ({ ...f, mapel: e.target.value }))}
                placeholder="Contoh: Bahasa Inggris"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                rows={2}
                placeholder="Instruksi atau keterangan tambahan..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ⏱ Durasi (menit)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={form.durasi_menit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durasi_menit: Number(e.target.value) }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🎯 KKM (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.kkm}
                onChange={(e) =>
                  setForm((f) => ({ ...f, kkm: Number(e.target.value) }))
                }
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ── Tambah Soal Panel ── */}
        <div className="bg-white rounded-xl border overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            {[
              { key: "manual", label: "✏️ Manual" },
              { key: "ai", label: "🤖 AI Generate" },
              { key: "import", label: "📥 Bulk Import" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`px-5 py-3 text-sm font-medium transition ${
                  tab === t.key
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Manual Tab – just a button to add blank soal */}
          {tab === "manual" && (
            <div className="p-5">
              <button
                onClick={addManual}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition text-sm font-medium"
              >
                + Tambah Soal Manual
              </button>
            </div>
          )}

          {/* AI Tab */}
          {tab === "ai" && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Topik / Materi *
                  </label>
                  <input
                    type="text"
                    value={aiTopik}
                    onChange={(e) => setAiTopik(e.target.value)}
                    placeholder="Contoh: Conjunctions (and, but, or, so)"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Soal
                  </label>
                  <select
                    value={aiJumlah}
                    onChange={(e) => setAiJumlah(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[3, 5, 10, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n} soal
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Soal
                  </label>
                  <select
                    value={aiTipe}
                    onChange={(e) => setAiTipe(e.target.value as TipeSoal)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pg">Pilihan Ganda</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tingkat Kesulitan / Kelas
                  </label>
                  <select
                    value={aiTingkat}
                    onChange={(e) => setAiTingkat(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[
                      "SD kelas 4",
                      "SD kelas 5",
                      "SD kelas 6",
                      "SMP kelas 7",
                      "SMP kelas 8",
                      "SMP kelas 9",
                      "SMA kelas 10",
                      "SMA kelas 11",
                      "SMA kelas 12",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {aiError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  ❌ {aiError}
                </p>
              )}
              <button
                onClick={handleAIGenerate}
                disabled={aiLoading || !aiTopik.trim()}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <span className="animate-spin">⏳</span> Generating {aiJumlah} soal...
                  </>
                ) : (
                  <>🤖 Generate {aiJumlah} Soal dengan AI</>
                )}
              </button>
            </div>
          )}

          {/* Bulk Import Tab */}
          {tab === "import" && (
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <p className="font-medium">📌 Format teks:</p>
                <pre className="font-mono whitespace-pre-wrap">
                  {`1. What is the correct conjunction?
A. and
B. but
C. or
D. so
Jawaban: B

2. Essay atau soal selanjutnya...`}
                </pre>
              </div>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={10}
                placeholder="Paste soal-soal di sini..."
                className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <button
                onClick={handleImport}
                disabled={!bulkText.trim()}
                className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                📥 Import Soal
              </button>
            </div>
          )}
        </div>

        {/* ── Soal List ── */}
        <div className="space-y-4">
          {soalList.length === 0 && (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">
              Belum ada soal. Tambah manual, generate dengan AI, atau bulk import.
            </div>
          )}

          {soalList.map((soal, idx) => (
            <SoalCard
              key={soal.id}
              soal={soal}
              index={idx}
              onUpdate={(patch) => updateSoal(soal.id, patch)}
              onDelete={() => deleteSoal(soal.id)}
              onUpdateOpsi={(key, text) => updateOpsi(soal.id, key, text)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SoalCard ─────────────────────────────────────────────────────────────────
function SoalCard({
  soal,
  index,
  onUpdate,
  onDelete,
  onUpdateOpsi,
}: {
  soal: SoalDraft;
  index: number;
  onUpdate: (patch: Partial<SoalDraft>) => void;
  onDelete: () => void;
  onUpdateOpsi: (key: string, text: string) => void;
}) {
  const sourceBadge =
    soal.sumber === "ai"
      ? "🤖 AI"
      : soal.sumber === "import"
      ? "📥 Import"
      : "✏️ Manual";

  return (
    <div className="bg-white rounded-xl border hover:border-blue-300 transition">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-3">
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
            #{index + 1}
          </span>
          <span className="text-xs text-gray-400">{sourceBadge}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={soal.tipe_soal}
            onChange={(e) => onUpdate({ tipe_soal: e.target.value as TipeSoal })}
            className="text-xs border rounded px-2 py-1 focus:outline-none"
          >
            <option value="pg">Pilihan Ganda</option>
            <option value="essay">Essay</option>
          </select>
          <input
            type="number"
            min={1}
            value={soal.poin}
            onChange={(e) => onUpdate({ poin: Number(e.target.value) })}
            className="w-16 text-xs border rounded px-2 py-1 focus:outline-none text-center"
            title="Poin"
          />
          <span className="text-xs text-gray-400">poin</span>
          <button
            onClick={onDelete}
            className="text-gray-300 hover:text-red-500 transition text-lg leading-none"
            title="Hapus soal"
          >
            ×
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-4">
        {/* Pertanyaan */}
        <textarea
          value={soal.pertanyaan}
          onChange={(e) => onUpdate({ pertanyaan: e.target.value })}
          rows={2}
          placeholder="Tulis pertanyaan di sini..."
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        {/* Opsi – hanya untuk multiple choice */}
        {soal.tipe_soal === "pg" && (
          <div className="space-y-2">
            {soal.opsi.map((o) => (
              <div key={o.key} className="flex items-center gap-2">
                <button
                  onClick={() => onUpdate({ kunci_jawaban: o.key })}
                  className={`w-8 h-8 rounded-full text-xs font-bold flex-shrink-0 border-2 transition ${
                    soal.kunci_jawaban === o.key
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 text-gray-500 hover:border-green-400"
                  }`}
                  title={`Jadikan ${o.key} sebagai jawaban benar`}
                >
                  {o.key}
                </button>
                <input
                  type="text"
                  value={o.text}
                  onChange={(e) => onUpdateOpsi(o.key, e.target.value)}
                  placeholder={`Opsi ${o.key}`}
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <p className="text-xs text-gray-400">
              💡 Klik lingkaran hijau untuk menandai jawaban benar
            </p>
          </div>
        )}

        {/* Essay – kunci jawaban = contoh jawaban */}
        {soal.tipe_soal === "essay" && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Contoh Jawaban Ideal
            </label>
            <textarea
              value={soal.kunci_jawaban}
              onChange={(e) => onUpdate({ kunci_jawaban: e.target.value })}
              rows={3}
              placeholder="Tuliskan contoh jawaban yang baik..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {/* Penjelasan */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Penjelasan (opsional)
          </label>
          <input
            type="text"
            value={soal.penjelasan}
            onChange={(e) => onUpdate({ penjelasan: e.target.value })}
            placeholder="Mengapa jawaban itu benar?"
            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
