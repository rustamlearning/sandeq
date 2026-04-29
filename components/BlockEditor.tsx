'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Block,
  BlockType,
  BLOCK_TYPES_META,
  createBlock,
  generateBlockId,
} from '@/lib/blocks';

interface BlockEditorProps {
  initialBlocks?: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function BlockEditor({ initialBlocks = [], onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);

  const updateBlocks = (newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(newBlocks);
  };

  const addBlock = (type: BlockType, afterIndex: number) => {
    const newBlock = createBlock(type);
    const newBlocks = [...blocks];
    newBlocks.splice(afterIndex + 1, 0, newBlock);
    updateBlocks(newBlocks);
    setShowAddMenu(null);
  };

  const updateBlock = (index: number, updated: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updated;
    updateBlocks(newBlocks);
  };

  const deleteBlock = (index: number) => {
    if (!confirm('Hapus block ini?')) return;
    const newBlocks = blocks.filter((_, i) => i !== index);
    updateBlocks(newBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    updateBlocks(newBlocks);
  };

  return (
    <div className="space-y-2">
      {blocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">Belum ada konten. Tambahkan block pertama:</p>
          <AddBlockButton
            onSelect={(type) => addBlock(type, -1)}
            isOpen={showAddMenu === -1}
            onToggle={() => setShowAddMenu(showAddMenu === -1 ? null : -1)}
          />
        </div>
      )}

      {blocks.map((block, index) => (
        <div key={block.id} className="group relative">
          {/* Block Controls */}
          <div className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition flex flex-col gap-1">
            <button
              onClick={() => moveBlock(index, 'up')}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Pindah ke atas"
            >
              ↑
            </button>
            <button
              onClick={() => moveBlock(index, 'down')}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
              title="Pindah ke bawah"
            >
              ↓
            </button>
            <button
              onClick={() => deleteBlock(index)}
              className="p-1 hover:bg-red-100 rounded text-red-500"
              title="Hapus"
            >
              ✕
            </button>
          </div>

          {/* Block Content */}
          <BlockEditorItem
            block={block}
            onChange={(updated) => updateBlock(index, updated)}
          />

          {/* Add Block Between */}
          <div className="flex justify-center my-2">
            <AddBlockButton
              onSelect={(type) => addBlock(type, index)}
              isOpen={showAddMenu === index}
              onToggle={() => setShowAddMenu(showAddMenu === index ? null : index)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// ADD BLOCK BUTTON (with menu)
// ============================================
function AddBlockButton({
  onSelect,
  isOpen,
  onToggle,
}: {
  onSelect: (type: BlockType) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const categories = ['text', 'media', 'akademik', 'interaktif'] as const;
  const labels = {
    text: '📝 Teks',
    media: '🎬 Media',
    akademik: '🎓 Akademik',
    interaktif: '⚡ Interaktif',
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition"
      >
        + Tambah Block
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={onToggle} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <h3 className="text-white font-bold text-sm">Pilih Tipe Block</h3>
              <button onClick={onToggle} className="text-white/80 hover:text-white text-lg w-7 h-7 flex items-center justify-center">✕</button>
            </div>
            <div className="overflow-y-auto p-3">
              {categories.map((cat) => (
                <div key={cat} className="mb-3 last:mb-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5 px-1">
                    {labels[cat]}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BLOCK_TYPES_META.filter((b) => b.category === cat).map((meta) => (
                      <button
                        key={meta.type}
                        onClick={() => onSelect(meta.type)}
                        className="flex items-center gap-2 p-2.5 hover:bg-blue-50 rounded-xl text-left transition border border-transparent hover:border-blue-100"
                      >
                        <span className="text-xl flex-shrink-0">{meta.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-gray-800">{meta.label}</p>
                          <p className="text-[11px] text-gray-400 truncate">{meta.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// SINGLE BLOCK EDITOR (form per block type)
// ============================================
function BlockEditorItem({
  block,
  onChange,
}: {
  block: Block;
  onChange: (block: Block) => void;
}) {
  const update = (patch: Partial<Block>) => {
    onChange({ ...block, ...patch } as Block);
  };

  const wrapperClass = 'border border-gray-200 rounded-lg p-3 bg-white hover:border-blue-300 transition';

  switch (block.type) {
    case 'heading':
      return (
        <div className={wrapperClass}>
          <div className="flex items-center gap-2 mb-2">
            <select
              value={block.level}
              onChange={(e) => update({ level: parseInt(e.target.value) as 1 | 2 | 3 })}
              className="text-xs border rounded px-2 py-1"
            >
              <option value={1}>H1 - Besar</option>
              <option value={2}>H2 - Sedang</option>
              <option value={3}>H3 - Kecil</option>
            </select>
            <span className="text-xs text-gray-500">📌 Heading</span>
          </div>
          <input
            type="text"
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Tulis judul..."
            className={`w-full border-none outline-none ${
              block.level === 1
                ? 'text-3xl font-bold'
                : block.level === 2
                ? 'text-2xl font-bold'
                : 'text-xl font-semibold'
            }`}
          />
        </div>
      );

    case 'paragraph':
      return (
        <div className={wrapperClass}>
          <p className="text-xs text-gray-500 mb-1">📝 Paragraf (markdown supported: **bold**, *italic*, `code`)</p>
          <textarea
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Tulis paragraf di sini..."
            rows={4}
            className="w-full border-none outline-none resize-none text-gray-800 leading-relaxed"
          />
        </div>
      );

    case 'image':
      return (
        <div className={wrapperClass}>
          <p className="text-xs text-gray-500 mb-2">🖼️ Gambar</p>
          <ImageUploader
            currentUrl={block.url}
            onUpload={(url) => update({ url })}
          />
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => update({ caption: e.target.value })}
            placeholder="Caption (opsional)"
            className="w-full border-t mt-2 pt-2 px-2 outline-none text-sm text-gray-600"
          />
        </div>
      );

    case 'video':
      return (
        <div className={wrapperClass}>
          <p className="text-xs text-gray-500 mb-2">🎥 Video YouTube</p>
          <input
            type="text"
            value={block.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => update({ caption: e.target.value })}
            placeholder="Caption (opsional)"
            className="w-full border rounded px-3 py-2 text-sm mt-2"
          />
        </div>
      );

    case 'audio':
      return (
        <div className={wrapperClass}>
          <p className="text-xs text-gray-500 mb-2">🎵 Audio</p>
          <input
            type="text"
            value={block.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="URL audio (mp3, wav)"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => update({ caption: e.target.value })}
            placeholder="Caption (opsional)"
            className="w-full border rounded px-3 py-2 text-sm mt-2"
          />
        </div>
      );

    case 'callout':
      return (
        <div className={wrapperClass}>
          <div className="flex items-center gap-2 mb-2">
            <select
              value={block.style}
              onChange={(e) => update({ style: e.target.value as any })}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="info">ℹ️ Info</option>
              <option value="tip">💡 Tip</option>
              <option value="warning">⚠️ Warning</option>
              <option value="danger">🚨 Danger</option>
            </select>
            <span className="text-xs text-gray-500">Callout</span>
          </div>
          <textarea
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Tulis catatan penting..."
            rows={3}
            className="w-full border-none outline-none resize-none"
          />
        </div>
      );

    case 'code':
      return (
        <div className={wrapperClass}>
          <div className="flex items-center gap-2 mb-2">
            <select
              value={block.language}
              onChange={(e) => update({ language: e.target.value })}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="text">Plain Text</option>
            </select>
            <span className="text-xs text-gray-500">⚡ Code</span>
          </div>
          <textarea
            value={block.code}
            onChange={(e) => update({ code: e.target.value })}
            placeholder="// Tulis kode di sini..."
            rows={6}
            className="w-full bg-gray-900 text-gray-100 font-mono text-sm rounded p-3 outline-none resize-none"
          />
        </div>
      );

    case 'math':
      return (
        <div className={wrapperClass}>
          <div className="flex items-center gap-2 mb-2">
            <select
              value={block.display}
              onChange={(e) => update({ display: e.target.value as 'inline' | 'block' })}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="block">Block (besar, center)</option>
              <option value="inline">Inline (kecil)</option>
            </select>
            <span className="text-xs text-gray-500">∑ Math/LaTeX</span>
          </div>
          <input
            type="text"
            value={block.latex}
            onChange={(e) => update({ latex: e.target.value })}
            placeholder="contoh: \\int_0^1 x^2 dx atau E = mc^2"
            className="w-full border rounded px-3 py-2 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Pakai sintaks LaTeX. Contoh: <code>\frac{`{a}{b}`}</code>, <code>x^2</code>, <code>\sqrt{`{x}`}</code>
          </p>
        </div>
      );

    case 'table':
      return <TableEditor block={block} onChange={onChange} />;

    case 'quote':
      return (
        <div className={wrapperClass}>
          <p className="text-xs text-gray-500 mb-2">💬 Kutipan</p>
          <textarea
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Tulis kutipan/ayat..."
            rows={2}
            className="w-full border-none outline-none resize-none italic text-gray-700"
          />
          <input
            type="text"
            value={block.source || ''}
            onChange={(e) => update({ source: e.target.value })}
            placeholder="Sumber (contoh: QS. Al-Fatihah:1, Soekarno, dll)"
            className="w-full border-t mt-2 pt-2 px-2 outline-none text-sm text-gray-500"
          />
        </div>
      );

    case 'check':
      return <CheckEditor block={block} onChange={onChange} />;

    case 'file':
      return (
        <div className={wrapperClass}>
          <p className="text-xs text-gray-500 mb-2">📎 File Lampiran</p>
          <FileUploader
            currentUrl={block.url}
            currentFilename={block.filename}
            onUpload={(url, filename) => onChange({ ...block, url, filename })}
          />
        </div>
      );

    case 'embed':
      return (
        <div className={wrapperClass}>
          <div className="flex items-center gap-2 mb-2">
            <select
              value={block.provider}
              onChange={(e) => update({ provider: e.target.value as any })}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="iframe">Generic iframe</option>
              <option value="geogebra">GeoGebra</option>
              <option value="desmos">Desmos</option>
              <option value="phet">PhET Simulation</option>
              <option value="codepen">CodePen</option>
            </select>
            <span className="text-xs text-gray-500">🔗 Embed</span>
          </div>
          <input
            type="text"
            value={block.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="URL embed..."
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={block.height || 400}
            onChange={(e) => update({ height: parseInt(e.target.value) })}
            placeholder="Tinggi (px)"
            className="w-full border rounded px-3 py-2 text-sm mt-2"
          />
        </div>
      );

    default:
      return <div className="text-red-500">Unknown block type</div>;
  }
}

// ============================================
// IMAGE UPLOADER
// ============================================
function ImageUploader({
  currentUrl,
  onUpload,
}: {
  currentUrl: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
      const path = `images/${filename}`;

      const { error } = await supabase.storage.from('materi-assets').upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from('materi-assets').getPublicUrl(path);
      onUpload(data.publicUrl);
    } catch (e: any) {
      alert('Gagal upload: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {currentUrl ? (
        <div className="relative">
          <img src={currentUrl} alt="" className="max-h-64 mx-auto rounded" />
          <button
            onClick={() => onUpload('')}
            className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Ganti
          </button>
        </div>
      ) : (
        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <p className="text-gray-500">
            {uploading ? '⏳ Uploading...' : '📁 Klik untuk upload gambar'}
          </p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP (max 5MB)</p>
        </label>
      )}
    </div>
  );
}

// ============================================
// FILE UPLOADER
// ============================================
function FileUploader({
  currentUrl,
  currentFilename,
  onUpload,
}: {
  currentUrl: string;
  currentFilename: string;
  onUpload: (url: string, filename: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const filename = `${Date.now()}-${file.name}`;
      const path = `files/${filename}`;

      const { error } = await supabase.storage.from('materi-assets').upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from('materi-assets').getPublicUrl(path);
      onUpload(data.publicUrl, file.name);
    } catch (e: any) {
      alert('Gagal upload: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {currentUrl ? (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
          <span className="text-2xl">📎</span>
          <span className="flex-1 text-sm truncate">{currentFilename}</span>
          <button
            onClick={() => onUpload('', '')}
            className="bg-red-500 text-white px-2 py-1 rounded text-xs"
          >
            Hapus
          </button>
        </div>
      ) : (
        <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition">
          <input
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <p className="text-gray-500">
            {uploading ? '⏳ Uploading...' : '📁 Klik untuk upload file'}
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, dll</p>
        </label>
      )}
    </div>
  );
}

// ============================================
// TABLE EDITOR
// ============================================
function TableEditor({ block, onChange }: { block: any; onChange: (b: Block) => void }) {
  const updateHeader = (i: number, val: string) => {
    const headers = [...block.headers];
    headers[i] = val;
    onChange({ ...block, headers });
  };

  const updateCell = (rowIdx: number, colIdx: number, val: string) => {
    const rows = block.rows.map((r: string[]) => [...r]);
    rows[rowIdx][colIdx] = val;
    onChange({ ...block, rows });
  };

  const addRow = () => {
    const newRow = block.headers.map(() => '');
    onChange({ ...block, rows: [...block.rows, newRow] });
  };

  const addCol = () => {
    const headers = [...block.headers, `Kolom ${block.headers.length + 1}`];
    const rows = block.rows.map((r: string[]) => [...r, '']);
    onChange({ ...block, headers, rows });
  };

  const removeRow = (i: number) => {
    onChange({ ...block, rows: block.rows.filter((_: any, idx: number) => idx !== i) });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <p className="text-xs text-gray-500 mb-2">📊 Tabel</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              {block.headers.map((h: string, i: number) => (
                <th key={i} className="border p-1">
                  <input
                    value={h}
                    onChange={(e) => updateHeader(i, e.target.value)}
                    className="w-full font-bold outline-none bg-gray-50 px-2 py-1"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row: string[], rowIdx: number) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="border p-1">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      className="w-full outline-none px-2 py-1"
                    />
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => removeRow(rowIdx)}
                    className="text-red-500 px-2"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={addRow} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded">
          + Baris
        </button>
        <button onClick={addCol} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded">
          + Kolom
        </button>
      </div>
    </div>
  );
}

// ============================================
// CHECK (MINI QUIZ) EDITOR
// ============================================
function CheckEditor({ block, onChange }: { block: any; onChange: (b: Block) => void }) {
  const updateOption = (i: number, val: string) => {
    const options = [...block.options];
    options[i] = val;
    onChange({ ...block, options });
  };

  const addOption = () => {
    onChange({ ...block, options: [...block.options, `Pilihan ${block.options.length + 1}`] });
  };

  const removeOption = (i: number) => {
    if (block.options.length <= 2) return;
    const options = block.options.filter((_: any, idx: number) => idx !== i);
    const correctIndex = block.correctIndex >= options.length ? 0 : block.correctIndex;
    onChange({ ...block, options, correctIndex });
  };

  return (
    <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-3">
      <p className="text-xs text-blue-700 font-semibold mb-2">✅ Mini Quiz (Cek Pemahaman)</p>
      <textarea
        value={block.question}
        onChange={(e) => onChange({ ...block, question: e.target.value })}
        placeholder="Tulis pertanyaan..."
        rows={2}
        className="w-full border rounded px-3 py-2 mb-3"
      />
      <p className="text-xs text-gray-600 mb-1">Pilihan jawaban (klik radio untuk pilih jawaban benar):</p>
      <div className="space-y-2">
        {block.options.map((opt: string, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              checked={block.correctIndex === i}
              onChange={() => onChange({ ...block, correctIndex: i })}
              className="w-4 h-4"
            />
            <span className="font-medium">{String.fromCharCode(65 + i)}.</span>
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 border rounded px-3 py-1 text-sm"
            />
            <button
              onClick={() => removeOption(i)}
              className="text-red-500 text-sm"
              disabled={block.options.length <= 2}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addOption}
        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded mt-2"
      >
        + Tambah Pilihan
      </button>
      <input
        value={block.explanation || ''}
        onChange={(e) => onChange({ ...block, explanation: e.target.value })}
        placeholder="Penjelasan jawaban (opsional, ditampilkan setelah submit)"
        className="w-full border rounded px-3 py-2 text-sm mt-3"
      />
    </div>
  );
}