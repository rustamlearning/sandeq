// lib/exportRapor.ts
// ============================================================
// SANDEQ - PDF Rapor Generator
// ============================================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from './supabase';
import { LEVELS, getLevelInfo } from './gamification';

// ============================================================
// TYPES
// ============================================================

export interface RaporData {
  siswa: {
    id: string;
    nama: string;
    nis_nip: string;
    kelas_nama: string;
    xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
  };
  guru: {
    nama: string;
    role: string;
  };
  ringkasan: {
    total_materi_selesai: number;
    total_kuis_selesai: number;
    total_kuis_lulus: number;
    rata_nilai_kuis: number;
    total_badges: number;
    total_mapel_dipelajari: number;
  };
  kuis_per_mapel: {
    mapel: string;
    items: Array<{
      judul: string;
      tanggal: string;
      nilai: number;
      kkm: number;
      durasi: number;
      lulus: boolean;
    }>;
    rata_rata: number;
  }[];
  mastery_list: {
    materi_judul: string;
    mapel: string;
    level: string;
    persen: number;
  }[];
  badges: {
    icon: string;
    name: string;
    description: string;
    rarity: string;
    earned_at: string;
  }[];
  metadata: {
    tahun_ajaran: string;
    semester: string;
    tanggal_cetak: string;
    nama_sekolah: string;
  };
}

// ============================================================
// FETCH DATA
// ============================================================

export async function fetchRaporData(siswaId: string, guruId: string): Promise<RaporData | null> {
  // 1. Siswa info
  const { data: siswa } = await supabase
    .from('users')
    .select('id, nama, nis_nip, kelas_id, xp, level, current_streak, longest_streak')
    .eq('id', siswaId)
    .single();

  if (!siswa) return null;

  // Kelas
  const { data: kelas } = await supabase
    .from('kelas')
    .select('nama')
    .eq('id', siswa.kelas_id)
    .single();

  // Guru info
  const { data: guru } = await supabase
    .from('users')
    .select('nama, role')
    .eq('id', guruId)
    .single();

  // 2. Kuis attempts (best per kuis)
  const { data: attempts } = await supabase
    .from('kuis_attempts')
    .select(`
      id,
      kuis_id,
      nilai_total,
      nilai_persen,
      durasi_aktual_detik,
      submitted_at,
      kuis:kuis_id(judul, mapel, kkm, total_poin)
    `)
    .eq('user_id', siswaId)
    .eq('selesai', true)
    .order('submitted_at', { ascending: false });

  // Group by mapel, ambil best attempt per kuis
  const bestPerKuis = new Map<string, any>();
  (attempts || []).forEach((a: any) => {
    const existing = bestPerKuis.get(a.kuis_id);
    if (!existing || (a.nilai_persen || 0) > (existing.nilai_persen || 0)) {
      bestPerKuis.set(a.kuis_id, a);
    }
  });

  const kuisGrouped: Record<string, any[]> = {};
  Array.from(bestPerKuis.values()).forEach((a: any) => {
    const mapel = a.kuis?.mapel || 'Lainnya';
    if (!kuisGrouped[mapel]) kuisGrouped[mapel] = [];
    kuisGrouped[mapel].push({
      judul: a.kuis?.judul || '-',
      tanggal: a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('id-ID') : '-',
      nilai: a.nilai_persen || 0,
      kkm: a.kuis?.kkm || 75,
      durasi: a.durasi_aktual_detik || 0,
      lulus: (a.nilai_persen || 0) >= (a.kuis?.kkm || 75),
    });
  });

  const kuis_per_mapel = Object.entries(kuisGrouped).map(([mapel, items]) => ({
    mapel,
    items,
    rata_rata: items.reduce((s, i) => s + i.nilai, 0) / items.length,
  }));

  // 3. Ringkasan
  const totalKuisSelesai = bestPerKuis.size;
  const totalKuisLulus = Array.from(bestPerKuis.values()).filter(
    (a: any) => (a.nilai_persen || 0) >= (a.kuis?.kkm || 75)
  ).length;
  const totalNilai = Array.from(bestPerKuis.values()).reduce(
    (s: number, a: any) => s + (a.nilai_persen || 0),
    0
  );
  const rataNilai = totalKuisSelesai > 0 ? totalNilai / totalKuisSelesai : 0;

  // Materi selesai
  const { count: materiSelesai } = await supabase
    .from('progress_materi')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', siswaId)
    .eq('selesai', true);

  // 4. Mastery
  const { data: mastery } = await supabase
    .from('mastery_progress')
    .select('level, materi:materi_id(judul, mapel)')
    .eq('user_id', siswaId);

  const mastery_list = (mastery || []).map((m: any) => ({
    materi_judul: m.materi?.judul || '-',
    mapel: m.materi?.mapel || '-',
    level: m.level,
    persen: m.level === 'dikuasai' ? 100 : m.level === 'mahir' ? 75 : m.level === 'familiar' ? 50 : 0,
  }));

  // 5. Badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('earned_at, badge:badge_id(icon, name, description, rarity)')
    .eq('user_id', siswaId)
    .order('earned_at', { ascending: false });

  const badges = (userBadges || []).map((ub: any) => ({
    icon: ub.badge?.icon || '🏅',
    name: ub.badge?.name || '-',
    description: ub.badge?.description || '-',
    rarity: ub.badge?.rarity || 'common',
    earned_at: ub.earned_at ? new Date(ub.earned_at).toLocaleDateString('id-ID') : '-',
  }));

  // 6. Mapel unik
  const mapelSet = new Set([
    ...kuis_per_mapel.map((k) => k.mapel),
    ...mastery_list.map((m) => m.mapel),
  ]);

  return {
    siswa: {
      ...siswa,
      kelas_nama: kelas?.nama || '-',
    },
    guru: {
      nama: guru?.nama || '-',
      role: guru?.role || 'guru',
    },
    ringkasan: {
      total_materi_selesai: materiSelesai || 0,
      total_kuis_selesai: totalKuisSelesai,
      total_kuis_lulus: totalKuisLulus,
      rata_nilai_kuis: Math.round(rataNilai * 10) / 10,
      total_badges: badges.length,
      total_mapel_dipelajari: mapelSet.size,
    },
    kuis_per_mapel,
    mastery_list,
    badges,
    metadata: {
      tahun_ajaran: getCurrentTahunAjaran(),
      semester: getCurrentSemester(),
      tanggal_cetak: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      nama_sekolah: 'SMA Negeri 6 Pangkajene dan Kepulauan',
    },
  };
}

function getCurrentTahunAjaran(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // Tahun ajaran Indonesia: Juli - Juni
  return month >= 7 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

function getCurrentSemester(): string {
  const month = new Date().getMonth() + 1;
  return month >= 7 || month <= 12 ? 'Ganjil' : 'Genap';
}

// ============================================================
// PDF GENERATION
// ============================================================

export function generateRaporPDF(data: RaporData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Brand color
  const PRIMARY = [26, 74, 122] as [number, number, number]; // #1A4A7A
  const ACCENT = [96, 165, 250] as [number, number, number];

  // ========== HEADER ==========
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(data.metadata.nama_sekolah.toUpperCase(), pageWidth / 2, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Pangkajene dan Kepulauan, Sulawesi Selatan', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `RAPOR DIGITAL - SEMESTER ${data.metadata.semester.toUpperCase()} ${data.metadata.tahun_ajaran}`,
    pageWidth / 2,
    27,
    { align: 'center' }
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('SANDEQ - Layarkan Ilmumu', pageWidth / 2, 32, { align: 'center' });

  y = 45;

  // ========== IDENTITAS SISWA ==========
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTITAS SISWA', margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1, pageWidth - margin, y + 1);
  y += 6;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const identityCol1X = margin;
  const identityCol2X = pageWidth / 2 + 5;

  const drawIdentity = (label: string, value: string, x: number, yPos: number) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, yPos);
    doc.text(':', x + 30, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 33, yPos);
  };

  drawIdentity('Nama', data.siswa.nama, identityCol1X, y);
  drawIdentity('Kelas', data.siswa.kelas_nama, identityCol2X, y);
  y += 5;

  drawIdentity('NIS', data.siswa.nis_nip, identityCol1X, y);
  drawIdentity('Wali Kelas', data.guru.nama, identityCol2X, y);
  y += 5;

  const levelInfo = getLevelInfo(data.siswa.xp);
  drawIdentity(
    'Level',
    `${levelInfo.title} (Lvl ${levelInfo.level}) - ${data.siswa.xp.toLocaleString()} XP`,
    identityCol1X,
    y
  );
  y += 5;

  drawIdentity(
    'Streak',
    `${data.siswa.current_streak} hari (terpanjang: ${data.siswa.longest_streak} hari)`,
    identityCol1X,
    y
  );
  y += 10;

  // ========== RINGKASAN ==========
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RINGKASAN PEMBELAJARAN', margin, y);
  doc.line(margin, y + 1, pageWidth - margin, y + 1);
  y += 6;

  // 6 stat boxes
  const stats = [
    { label: 'Materi Selesai', value: data.ringkasan.total_materi_selesai.toString() },
    { label: 'Kuis Dikerjakan', value: data.ringkasan.total_kuis_selesai.toString() },
    { label: 'Kuis Lulus KKM', value: data.ringkasan.total_kuis_lulus.toString() },
    { label: 'Rata-rata Nilai', value: data.ringkasan.rata_nilai_kuis.toFixed(1) },
    { label: 'Badge Diperoleh', value: data.ringkasan.total_badges.toString() },
    { label: 'Mapel Dipelajari', value: data.ringkasan.total_mapel_dipelajari.toString() },
  ];

  const boxWidth = (pageWidth - margin * 2 - 10) / 3;
  const boxHeight = 18;
  const gap = 5;

  stats.forEach((s, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * (boxWidth + gap);
    const yBox = y + row * (boxHeight + gap);

    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yBox, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setTextColor(...PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(s.value, x + boxWidth / 2, yBox + 9, { align: 'center' });

    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(s.label, x + boxWidth / 2, yBox + 14, { align: 'center' });
  });
  y += 2 * (boxHeight + gap) + 5;

  // ========== TABEL NILAI KUIS PER MAPEL ==========
  if (data.kuis_per_mapel.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NILAI KUIS PER MATA PELAJARAN', margin, y);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    y += 4;

    data.kuis_per_mapel.forEach((mapel) => {
      const tableData = mapel.items.map((item, idx) => [
        (idx + 1).toString(),
        item.judul,
        item.tanggal,
        item.nilai.toFixed(0),
        item.kkm.toString(),
        item.lulus ? 'LULUS' : 'BLM LULUS',
      ]);

      autoTable(doc, {
        head: [
          [
            {
              content: `${mapel.mapel} (Rata-rata: ${mapel.rata_rata.toFixed(1)})`,
              colSpan: 6,
              styles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
            },
          ],
          ['No', 'Judul Kuis', 'Tanggal', 'Nilai', 'KKM', 'Status'],
        ],
        body: tableData,
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 70 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 25, halign: 'center' },
        },
        didParseCell: (hookData) => {
          if (hookData.section === 'body' && hookData.column.index === 5) {
            const statusText = hookData.cell.text[0];
            if (statusText === 'LULUS') {
              hookData.cell.styles.textColor = [22, 163, 74];
              hookData.cell.styles.fontStyle = 'bold';
            } else if (statusText === 'BLM LULUS') {
              hookData.cell.styles.textColor = [220, 38, 38];
              hookData.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 4;
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Belum ada kuis yang dikerjakan', margin, y);
    y += 8;
  }

  // ========== MASTERY (kalau ada) ==========
  if (data.mastery_list.length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PENGUASAAN MATERI', margin, y);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    y += 4;

    const masteryTable = data.mastery_list.map((m, idx) => [
      (idx + 1).toString(),
      m.materi_judul,
      m.mapel,
      m.level.toUpperCase().replace('_', ' '),
    ]);

    autoTable(doc, {
      head: [['No', 'Materi', 'Mapel', 'Tingkat Penguasaan']],
      body: masteryTable,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          const lvl = hookData.cell.text[0];
          if (lvl === 'DIKUASAI') hookData.cell.styles.textColor = [22, 163, 74];
          else if (lvl === 'MAHIR') hookData.cell.styles.textColor = [37, 99, 235];
          else if (lvl === 'FAMILIAR') hookData.cell.styles.textColor = [202, 138, 4];
          else hookData.cell.styles.textColor = [120, 120, 120];
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // ========== BADGES (kalau ada) ==========
  if (data.badges.length > 0) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`BADGE PENGHARGAAN (${data.badges.length})`, margin, y);
    doc.line(margin, y + 1, pageWidth - margin, y + 1);
    y += 6;

    const badgeTable = data.badges.map((b, idx) => [
      (idx + 1).toString(),
      b.name,
      b.description,
      b.rarity.toUpperCase(),
      b.earned_at,
    ]);

    autoTable(doc, {
      head: [['No', 'Nama Badge', 'Deskripsi', 'Tingkat', 'Diperoleh']],
      body: badgeTable,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 70 },
        3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 30, halign: 'center' },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // ========== TANDA TANGAN ==========
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  y = Math.max(y + 10, pageHeight - 50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const ttdLeft = margin + 20;
  const ttdRight = pageWidth - margin - 50;

  doc.text(`Pangkep, ${data.metadata.tanggal_cetak}`, ttdRight, y);
  y += 5;
  doc.text('Wali Kelas,', ttdRight, y);

  doc.text('Mengetahui,', ttdLeft, y);
  doc.text('Kepala Sekolah', ttdLeft, y + 5);

  y += 25;

  doc.setFont('helvetica', 'bold');
  doc.text('(_______________________)', ttdLeft, y);
  doc.text(`(${data.guru.nama})`, ttdRight, y);

  // ========== FOOTER ==========
  const footerY = pageHeight - 8;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Rapor digital ini dicetak otomatis oleh sistem SANDEQ pada ${data.metadata.tanggal_cetak}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc;
}

export async function downloadRapor(siswaId: string, guruId: string): Promise<boolean> {
  try {
    const data = await fetchRaporData(siswaId, guruId);
    if (!data) return false;

    const doc = generateRaporPDF(data);
    const filename = `Rapor_${data.siswa.nama.replace(/\s+/g, '_')}_${data.metadata.semester}_${data.metadata.tahun_ajaran.replace('/', '-')}.pdf`;
    doc.save(filename);
    return true;
  } catch (e) {
    console.error('Generate rapor error:', e);
    return false;
  }
}
