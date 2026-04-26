// SANDEQ Block System - 13 block types
// Inspired by: Notion + Khan Academy + Coursera

export type BlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'video'
  | 'audio'
  | 'callout'
  | 'code'
  | 'math'
  | 'table'
  | 'quote'
  | 'check'
  | 'file'
  | 'embed';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string; // markdown supported
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  caption?: string;
  alt?: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string; // YouTube URL
  caption?: string;
}

export interface AudioBlock extends BaseBlock {
  type: 'audio';
  url: string;
  caption?: string;
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  style: 'info' | 'tip' | 'warning' | 'danger';
  text: string;
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  language: string;
  code: string;
}

export interface MathBlock extends BaseBlock {
  type: 'math';
  latex: string;
  display: 'inline' | 'block';
}

export interface TableBlock extends BaseBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  source?: string;
}

export interface CheckBlock extends BaseBlock {
  type: 'check';
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface FileBlock extends BaseBlock {
  type: 'file';
  url: string;
  filename: string;
  size?: string;
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  provider: 'geogebra' | 'desmos' | 'phet' | 'codepen' | 'iframe';
  url: string;
  caption?: string;
  height?: number;
}

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | CalloutBlock
  | CodeBlock
  | MathBlock
  | TableBlock
  | QuoteBlock
  | CheckBlock
  | FileBlock
  | EmbedBlock;

// Helper: Generate unique block ID
export const generateBlockId = (): string => {
  return `blk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper: Create new block with default values
export const createBlock = (type: BlockType): Block => {
  const id = generateBlockId();
  switch (type) {
    case 'heading':
      return { id, type, level: 2, text: 'Judul' };
    case 'paragraph':
      return { id, type, text: '' };
    case 'image':
      return { id, type, url: '', caption: '' };
    case 'video':
      return { id, type, url: '', caption: '' };
    case 'audio':
      return { id, type, url: '', caption: '' };
    case 'callout':
      return { id, type, style: 'info', text: 'Catatan penting...' };
    case 'code':
      return { id, type, language: 'javascript', code: '' };
    case 'math':
      return { id, type, latex: 'E = mc^2', display: 'block' };
    case 'table':
      return { id, type, headers: ['Kolom 1', 'Kolom 2'], rows: [['', '']] };
    case 'quote':
      return { id, type, text: '', source: '' };
    case 'check':
      return {
        id,
        type,
        question: 'Tuliskan pertanyaan...',
        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
        correctIndex: 0,
        explanation: '',
      };
    case 'file':
      return { id, type, url: '', filename: '' };
    case 'embed':
      return { id, type, provider: 'iframe', url: '', height: 400 };
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
};

// Block type metadata for UI
export const BLOCK_TYPES_META: Array<{
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  category: 'text' | 'media' | 'akademik' | 'interaktif';
}> = [
  { type: 'heading', label: 'Heading', icon: '📌', description: 'Judul bagian', category: 'text' },
  { type: 'paragraph', label: 'Paragraf', icon: '📝', description: 'Teks biasa (markdown)', category: 'text' },
  { type: 'callout', label: 'Callout', icon: '💡', description: 'Kotak info/tip/warning', category: 'text' },
  { type: 'quote', label: 'Kutipan', icon: '💬', description: 'Kutipan/ayat/sumber', category: 'text' },
  { type: 'image', label: 'Gambar', icon: '🖼️', description: 'Upload gambar', category: 'media' },
  { type: 'video', label: 'Video', icon: '🎥', description: 'Embed YouTube', category: 'media' },
  { type: 'audio', label: 'Audio', icon: '🎵', description: 'File audio', category: 'media' },
  { type: 'file', label: 'File', icon: '📎', description: 'Lampiran PDF/DOCX', category: 'media' },
  { type: 'math', label: 'Persamaan', icon: '∑', description: 'LaTeX/Math equation', category: 'akademik' },
  { type: 'code', label: 'Kode', icon: '⚡', description: 'Code snippet', category: 'akademik' },
  { type: 'table', label: 'Tabel', icon: '📊', description: 'Tabel data', category: 'akademik' },
  { type: 'embed', label: 'Embed', icon: '🔗', description: 'GeoGebra/Desmos/PhET', category: 'akademik' },
  { type: 'check', label: 'Mini Quiz', icon: '✅', description: 'Cek pemahaman inline', category: 'interaktif' },
];