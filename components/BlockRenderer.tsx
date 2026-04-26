'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { InlineMath, BlockMath } from 'react-katex';
import { supabase } from '@/lib/supabase';
import { Block } from '@/lib/blocks';
import 'katex/dist/katex.min.css';

interface BlockRendererProps {
  blocks: Block[];
  materiId: string;
  userId: string;
}

export default function BlockRenderer({ blocks, materiId, userId }: BlockRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <SingleBlock
          key={block.id}
          block={block}
          materiId={materiId}
          userId={userId}
        />
      ))}
    </div>
  );
}

function SingleBlock({
  block,
  materiId,
  userId,
}: {
  block: Block;
  materiId: string;
  userId: string;
}) {
  if (block.type === 'heading') {
    if (block.level === 1) return <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900">{block.text}</h1>;
    if (block.level === 2) return <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-900">{block.text}</h2>;
    return <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-800">{block.text}</h3>;
  }

  if (block.type === 'paragraph') {
    return (
      <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
          {block.text}
        </ReactMarkdown>
      </div>
    );
  }

  if (block.type === 'image') {
    return (
      <figure className="my-6">
        {block.url && <img src={block.url} alt={block.alt || block.caption || ''} className="w-full max-w-2xl mx-auto rounded-lg shadow-md" />}
        {block.caption && <figcaption className="text-sm text-gray-500 text-center mt-2 italic">{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === 'video') {
    const videoId = extractYouTubeId(block.url);
    if (!videoId) return <div className="bg-gray-100 p-4 rounded-lg text-gray-500">Video tidak valid. Pastikan link YouTube.</div>;
    return (
      <figure className="my-6">
        <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-md">
          <iframe src={`https://www.youtube.com/embed/${videoId}`} className="absolute inset-0 w-full h-full" allowFullScreen />
        </div>
        {block.caption && <figcaption className="text-sm text-gray-500 text-center mt-2 italic">{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === 'audio') {
    return (
      <figure className="my-6">
        <audio controls className="w-full max-w-2xl mx-auto">
          <source src={block.url} />
        </audio>
        {block.caption && <figcaption className="text-sm text-gray-500 text-center mt-2 italic">{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === 'callout') {
    const styles: Record<string, string> = {
      info: 'bg-blue-50 border-blue-400 text-blue-900',
      tip: 'bg-green-50 border-green-400 text-green-900',
      warning: 'bg-yellow-50 border-yellow-400 text-yellow-900',
      danger: 'bg-red-50 border-red-400 text-red-900',
    };
    const icons: Record<string, string> = { info: 'ℹ️', tip: '💡', warning: '⚠️', danger: '🚨' };
    return (
      <div className={`border-l-4 p-4 rounded-r-lg ${styles[block.style]}`}>
        <div className="flex gap-3">
          <span className="text-2xl">{icons[block.style]}</span>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.text}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'code') {
    return (
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
        <code className={`language-${block.language}`}>{block.code}</code>
      </pre>
    );
  }

  if (block.type === 'math') {
    if (block.display === 'inline') return <div className="my-4 text-center"><InlineMath math={block.latex} /></div>;
    return <div className="my-6 text-center text-lg"><BlockMath math={block.latex} /></div>;
  }

  if (block.type === 'table') {
    return (
      <div className="my-6 overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              {block.headers.map((header, i) => (
                <th key={i} className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 text-sm text-gray-600 border-b">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-4 border-gray-400 pl-4 py-2 my-6 italic text-gray-700">
        <p className="text-lg">&ldquo;{block.text}&rdquo;</p>
        {block.source && <cite className="text-sm text-gray-500 not-italic block mt-2">— {block.source}</cite>}
      </blockquote>
    );
  }

  if (block.type === 'check') {
    return <CheckBlockRender block={block} materiId={materiId} userId={userId} />;
  }

  if (block.type === 'file') {
    return (
      <a href={block.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg my-4 transition">
        <span className="text-3xl">📎</span>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{block.filename}</p>
          {block.size && <p className="text-sm text-gray-500">{block.size}</p>}
        </div>
        <span className="text-blue-600 text-sm font-medium">Download</span>
      </a>
    );
  }

  if (block.type === 'embed') {
    return (
      <figure className="my-6">
        <iframe src={block.url} className="w-full rounded-lg shadow-md" style={{ height: block.height || 400 }} allowFullScreen />
        {block.caption && <figcaption className="text-sm text-gray-500 text-center mt-2 italic">{block.caption}</figcaption>}
      </figure>
    );
  }

  return null;
}

function CheckBlockRender({ block, materiId, userId }: { block: any; materiId: string; userId: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (selected === null) return;
    setSubmitted(true);
    const isCorrect = selected === block.correctIndex;
    await supabase.from('embedded_quiz_attempts').insert({
      user_id: userId,
      materi_id: materiId,
      block_id: block.id,
      jawaban: block.options[selected],
      benar: isCorrect,
    });
  };

  const handleRetry = () => {
    setSelected(null);
    setSubmitted(false);
  };

  const isCorrect = submitted && selected === block.correctIndex;

  return (
    <div className="my-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">✅</span>
        <h4 className="font-semibold text-blue-900">Cek Pemahaman</h4>
      </div>
      <p className="text-gray-800 mb-4 font-medium">{block.question}</p>
      <div className="space-y-2">
        {block.options.map((option: string, i: number) => {
          const isSelected = selected === i;
          const isAnswer = i === block.correctIndex;
          let cls = 'w-full text-left p-3 rounded-lg border-2 transition cursor-pointer ';
          if (submitted) {
            if (isAnswer) cls += 'bg-green-100 border-green-500 text-green-900';
            else if (isSelected && !isAnswer) cls += 'bg-red-100 border-red-500 text-red-900';
            else cls += 'bg-white border-gray-200 text-gray-500';
          } else {
            cls += isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300';
          }
          return (
            <button key={i} onClick={() => !submitted && setSelected(i)} disabled={submitted} className={cls}>
              <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
              {option}
              {submitted && isAnswer && <span className="ml-2">✓</span>}
              {submitted && isSelected && !isAnswer && <span className="ml-2">✗</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex gap-2">
        {!submitted && (
          <button onClick={handleSubmit} disabled={selected === null} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium">
            Submit Jawaban
          </button>
        )}
        {submitted && (
          <button onClick={handleRetry} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium">
            Coba Lagi
          </button>
        )}
      </div>
      {submitted && (
        <div className={`mt-3 p-3 rounded-lg ${isCorrect ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
          <p className="font-semibold">{isCorrect ? '🎉 Benar!' : '❌ Belum tepat'}</p>
          {block.explanation && <p className="text-sm mt-1">{block.explanation}</p>}
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}