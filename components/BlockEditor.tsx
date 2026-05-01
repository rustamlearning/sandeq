'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileUp,
  Image,
  Link,
  Paperclip,
  Plus,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
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

const compactFieldClass = 'w-full rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#2e86c1]/70 focus:ring-4 focus:ring-[#2e86c1]/14'
const blockShellClass = 'rounded-xl border border-slate-200/75 bg-white/82 p-4 shadow-[0_10px_26px_rgba(18,61,100,0.05)] transition hover:border-slate-300/80 hover:bg-white'

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
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/62 px-6 py-12 text-center">
          <p className="mb-4 text-sm text-slate-500">Belum ada konten. Tambahkan block pertama.</p>
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
          <div className="absolute -left-12 top-2 hidden flex-col gap-1 opacity-0 transition group-hover:opacity-100 md:flex">
            <button
              onClick={() => moveBlock(index, 'up')}
              className="rounded-lg border border-slate-200 bg-white/85 p-1.5 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
              title="Pindah ke atas"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => moveBlock(index, 'down')}
              className="rounded-lg border border-slate-200 bg-white/85 p-1.5 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
              title="Pindah ke bawah"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={() => deleteBlock(index)}
              className="rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-500 shadow-sm transition hover:bg-red-100"
              title="Hapus"
            >
              <X size={14} />
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
    text: 'Teks',
    media: 'Media',
    akademik: 'Akademik',
    interaktif: 'Interaktif',
  };

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="inline-flex items-center rounded-full border border-slate-200 bg-white/86 px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
      >
        <span className="inline-flex items-center gap-1.5"><Plus size={14} /> Tambah block</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm" onClick={onToggle} />
          <div className="surface-card fixed left-1/2 top-1/2 z-50 flex max-h-[80vh] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/70 bg-white/60 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-950">Pilih tipe block</h3>
              <button onClick={onToggle} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-950"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto p-3">
              {categories.map((cat) => (
                <div key={cat} className="mb-3 last:mb-0">
                  <p className="mb-1.5 px-1 text-xs font-medium text-slate-500">
                    {labels[cat]}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BLOCK_TYPES_META.filter((b) => b.category === cat).map((meta) => (
                      <button
                        key={meta.type}
                        onClick={() => onSelect(meta.type)}
                        className="flex items-center gap-2 rounded-xl border border-transparent p-2.5 text-left transition hover:border-slate-200 hover:bg-white"
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-black text-blue-700">{meta.label.slice(0, 2).toUpperCase()}</span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{meta.label}</p>
                          <p className="truncate text-[11px] text-slate-400">{meta.description}</p>
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

  const wrapperClass = blockShellClass;

  switch (block.type) {
    case 'heading':
      return (
        <div className={wrapperClass}>
          <div className="flex items-center gap-2 mb-2">
            <select
              value={block.level}
              onChange={(e) => update({ level: parseInt(e.target.value) as 1 | 2 | 3 })}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#2e86c1]/70 focus:ring-2 focus:ring-[#2e86c1]/14"
            >
              <option value={1}>H1 - Besar</option>
              <option value={2}>H2 - Sedang</option>
              <option value={3}>H3 - Kecil</option>
            </select>
            <span className="text-xs text-slate-500">Heading</span>
          </div>
          <input
            type="text"
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Tulis judul..."
            className={`w-full border-none bg-transparent text-slate-950 outline-none placeholder:text-slate-400 ${
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
          <p className="mb-1 text-xs text-slate-500">Paragraf (markdown didukung: **bold**, *italic*, `code`)</p>
          <textarea
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Tulis paragraf di sini..."
            rows={4}
            className="w-full resize-none border-none bg-transparent leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
      );

    case 'image':
      return (
        <div className={wrapperClass}>
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><Image size={13} /> Gambar</p>
          <ImageUploader
            currentUrl={block.url}
            onUpload={(url) => update({ url })}
          />
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => update({ caption: e.target.value })}
            placeholder="Caption (opsional)"
            className="mt-2 w-full border-t border-slate-200 bg-transparent px-2 pt-2 text-sm text-slate-600 outline-none placeholder:text-slate-400"
          />
        </div>
      );

    case 'video':
      return (
        <div className={wrapperClass}>
          <p className="mb-2 text-xs text-slate-500">Video YouTube</p>
          <input
            type="text"
            value={block.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="https://youtube.com/watch?v=..."
            className={compactFieldClass}
          />
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => update({ caption: e.target.value })}
            placeholder="Caption (opsional)"
            className={`${compactFieldClass} mt-2`}
          />
        </div>
      );

    case 'audio':
      return (
        <div className={wrapperClass}>
          <p className="mb-2 text-xs text-slate-500">Audio</p>
          <input
            type="text"
            value={block.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="URL audio (mp3, wav)"
            className={compactFieldClass}
          />
          <input
            type="text"
            value={block.caption || ''}
            onChange={(e) => update({ caption: e.target.value })}
            placeholder="Caption (opsional)"
            className={`${compactFieldClass} mt-2`}
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
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#2e86c1]/70 focus:ring-2 focus:ring-[#2e86c1]/14"
            >
              <option value="info">Info</option>
              <option value="tip">Tip</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger</option>
            </select>
            <span className="text-xs text-slate-500">Callout</span>
          </div>
          <textarea
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Tulis catatan penting..."
            rows={3}
            className="w-full resize-none border-none bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
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
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#2e86c1]/70 focus:ring-2 focus:ring-[#2e86c1]/14"
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
            <span className="text-xs text-slate-500">Code</span>
          </div>
          <textarea
            value={block.code}
            onChange={(e) => update({ code: e.target.value })}
            placeholder="// Tulis kode di sini..."
            rows={6}
            className="w-full resize-none rounded-lg bg-slate-950 p-3 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500"
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
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#2e86c1]/70 focus:ring-2 focus:ring-[#2e86c1]/14"
            >
              <option value="block">Block (besar, center)</option>
              <option value="inline">Inline (kecil)</option>
            </select>
            <span className="text-xs text-slate-500">Math/LaTeX</span>
          </div>
          <input
            type="text"
            value={block.latex}
            onChange={(e) => update({ latex: e.target.value })}
            placeholder="contoh: \\int_0^1 x^2 dx atau E = mc^2"
            className={`${compactFieldClass} font-mono`}
          />
          <p className="mt-1 text-xs text-slate-500">
            Pakai sintaks LaTeX. Contoh: <code>\frac{`{a}{b}`}</code>, <code>x^2</code>, <code>\sqrt{`{x}`}</code>
          </p>
        </div>
      );

    case 'table':
      return <TableEditor block={block} onChange={onChange} />;

    case 'quote':
      return (
        <div className={wrapperClass}>
          <p className="mb-2 text-xs text-slate-500">Kutipan</p>
          <textarea
            value={block.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Tulis kutipan/ayat..."
            rows={2}
            className="w-full resize-none border-none bg-transparent italic text-slate-700 outline-none placeholder:text-slate-400"
          />
          <input
            type="text"
            value={block.source || ''}
            onChange={(e) => update({ source: e.target.value })}
            placeholder="Sumber (contoh: QS. Al-Fatihah:1, Soekarno, dll)"
            className="mt-2 w-full border-t border-slate-200 bg-transparent px-2 pt-2 text-sm text-slate-500 outline-none placeholder:text-slate-400"
          />
        </div>
      );

    case 'check':
      return <CheckEditor block={block} onChange={onChange} />;

    case 'file':
      return (
        <div className={wrapperClass}>
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><Paperclip size={13} /> File lampiran</p>
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
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#2e86c1]/70 focus:ring-2 focus:ring-[#2e86c1]/14"
            >
              <option value="iframe">Generic iframe</option>
              <option value="geogebra">GeoGebra</option>
              <option value="desmos">Desmos</option>
              <option value="phet">PhET Simulation</option>
              <option value="codepen">CodePen</option>
            </select>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Link size={13} /> Embed</span>
          </div>
          <input
            type="text"
            value={block.url}
            onChange={(e) => update({ url: e.target.value })}
            placeholder="URL embed..."
            className={compactFieldClass}
          />
          <input
            type="number"
            value={block.height || 400}
            onChange={(e) => update({ height: parseInt(e.target.value) })}
            placeholder="Tinggi (px)"
            className={`${compactFieldClass} mt-2`}
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
          <img src={currentUrl} alt="" className="mx-auto max-h-64 rounded-xl shadow-sm" />
          <button
            onClick={() => onUpload('')}
            className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            Ganti
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer rounded-xl border border-dashed border-slate-200 bg-white/62 p-8 text-center transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <p className="text-sm font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <FileUp className={uploading ? 'animate-pulse' : ''} size={16} />
              {uploading ? 'Mengunggah gambar...' : 'Klik untuk upload gambar'}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-400">PNG, JPG, WebP (maks 5 MB)</p>
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
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3">
          <Paperclip className="text-blue-600" size={20} />
          <span className="flex-1 truncate text-sm text-slate-700">{currentFilename}</span>
          <button
            onClick={() => onUpload('', '')}
            className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer rounded-xl border border-dashed border-slate-200 bg-white/62 p-6 text-center transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white">
          <input
            type="file"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
          <p className="text-sm font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <FileUp className={uploading ? 'animate-pulse' : ''} size={16} />
              {uploading ? 'Mengunggah file...' : 'Klik untuk upload file'}
            </span>
          </p>
          <p className="mt-1 text-xs text-slate-400">PDF, DOCX, PPTX, dan lainnya</p>
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
    <div className={blockShellClass}>
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><Table2 size={13} /> Tabel</p>
      <div className="overflow-x-auto">
        <table className="min-w-full overflow-hidden rounded-lg text-sm">
          <thead>
            <tr>
              {block.headers.map((h: string, i: number) => (
                <th key={i} className="border border-slate-200 bg-slate-50 p-1">
                  <input
                    value={h}
                    onChange={(e) => updateHeader(i, e.target.value)}
                    className="w-full bg-transparent px-2 py-1 font-semibold text-slate-800 outline-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row: string[], rowIdx: number) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="border border-slate-200 bg-white p-1">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                      className="w-full bg-transparent px-2 py-1 text-slate-700 outline-none"
                    />
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => removeRow(rowIdx)}
                    className="px-2 text-sm font-semibold text-red-500"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={addRow} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100">
          + Baris
        </button>
        <button onClick={addCol} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">
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
    <div className="rounded-xl border border-blue-100 bg-blue-50/72 p-4">
      <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700"><CheckCircle2 size={13} /> Mini quiz (cek pemahaman)</p>
      <textarea
        value={block.question}
        onChange={(e) => onChange({ ...block, question: e.target.value })}
        placeholder="Tulis pertanyaan..."
        rows={2}
        className={`${compactFieldClass} mb-3 resize-none`}
      />
      <p className="mb-1 text-xs text-slate-600">Pilihan jawaban. Pilih radio untuk jawaban benar.</p>
      <div className="space-y-2">
        {block.options.map((opt: string, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              checked={block.correctIndex === i}
              onChange={() => onChange({ ...block, correctIndex: i })}
              className="h-4 w-4"
            />
            <span className="text-sm font-medium text-slate-700">{String.fromCharCode(65 + i)}.</span>
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#2e86c1]/70 focus:ring-4 focus:ring-[#2e86c1]/14"
            />
            <button
              onClick={() => removeOption(i)}
              className="text-sm font-semibold text-red-500 disabled:opacity-30"
              disabled={block.options.length <= 2}
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addOption}
        className="mt-3 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200"
      >
        + Tambah Pilihan
      </button>
      <input
        value={block.explanation || ''}
        onChange={(e) => onChange({ ...block, explanation: e.target.value })}
        placeholder="Penjelasan jawaban (opsional, ditampilkan setelah submit)"
        className={`${compactFieldClass} mt-3`}
      />
    </div>
  );
}
