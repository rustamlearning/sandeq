// app/materi/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { db, Materi } from '@/lib/db/schema';
import { ArrowLeft, BookOpen, User, Clock } from 'lucide-react';

export default function MateriDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [materi, setMateri] = useState<Materi | null>(null);
  const [guruNama, setGuruNama] = useState('');

  useEffect(() => {
    async function load() {
      if (!id) return;
      const m = await db.materi.get(id as string);
      if (m) {
        setMateri(m);
        const guru = await db.users.get(m.guruId);
        setGuruNama(guru?.nama || '-');
      }
    }
    load();
  }, [id]);

  if (!materi) {
    return (
      <AppShell>
        <div className="p-6 text-center text-gray-500">Memuat materi...</div>
      </AppShell>
    );
  }

  // Simple markdown -> HTML renderer
  const renderContent = (md: string) => {
    let html = md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="numbered">$1</li>');

    // Wrap list items
    html = html.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, (m) =>
      m.includes('numbered') ? `<ol>${m.replace(/ class="numbered"/g, '')}</ol>` : `<ul>${m}</ul>`
    );

    // Paragraphs
    html = html
      .split('\n\n')
      .map((block) => {
        if (block.match(/^<(h\d|ul|ol|li|p|pre)/)) return block;
        if (block.trim() === '') return '';
        return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
      })
      .join('\n');

    return html;
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-600 mb-4 hover:text-[#1A4A7A]"
        >
          <ArrowLeft size={16} /> Kembali
        </button>

        <div className="bg-white rounded-2xl p-5 md:p-8 border border-gray-100">
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs font-semibold px-2.5 py-1 bg-[#F4F9FF] text-[#1A4A7A] rounded-full">
                {materi.mapel}
              </span>
              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                {materi.bab}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A4A7A] mb-3">{materi.judul}</h1>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><User size={12} /> {guruNama}</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Diperbarui {new Date(materi.updatedAt).toLocaleDateString('id-ID')}
              </span>
            </div>
          </div>

          <div
            className="prose-sandeq"
            dangerouslySetInnerHTML={{ __html: renderContent(materi.konten) }}
          />

          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400 italic">
            <BookOpen size={14} />
            Materi ini tersimpan offline di perangkatmu. Terus berlayar bersama ilmu!
          </div>
        </div>
      </div>
    </AppShell>
  );
}