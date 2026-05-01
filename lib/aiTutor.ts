// ============================================================
// SANDEQ AI Tutor v2 - Generative Templates Engine
// Style: Santai-respect | Mix lokal Sulsel | Humor sehat
// Target: 50,000+ unique response variations
// ============================================================

import { Block } from './blocks';

export type Intent =
  | 'greeting' | 'help_understanding' | 'simplify' | 'example_request'
  | 'exercise_request' | 'realworld_application' | 'definition'
  | 'comparison' | 'step_by_step' | 'check_answer' | 'motivation'
  | 'thanks' | 'joke' | 'about_tutor' | 'compliment' | 'study_tips'
  | 'unknown';

export interface TutorContext {
  materi: any;
  blocks: Block[];
  user: any;
  masteryLevel?: string;
  previousIntents?: Intent[];
}

export interface TutorResponse {
  text: string;
  intent: Intent;
  suggestions?: string[];
}

// ============================================================
// HELPERS
// ============================================================
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
};
const maybe = (probability: number): boolean => Math.random() < probability;

// ============================================================
// LAYER 1: SENTENCE BUILDING BLOCKS
// ============================================================

// Greetings - Time aware
function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return pick(['Wah masih begadang nih?', 'Belajar tengah malam?', 'Tumben malam-malam']);
  if (hour < 11) return pick(['Selamat pagi!', 'Pagi!', 'Morning!', 'Pagi yaa']);
  if (hour < 15) return pick(['Selamat siang!', 'Siang!', 'Halo siang ini']);
  if (hour < 18) return pick(['Selamat sore!', 'Sore!', 'Sore yaa']);
  if (hour < 22) return pick(['Selamat malam!', 'Malam!', 'Halo malam ini']);
  return pick(['Wah masih semangat malam-malam?', 'Belajar sampai malam, salut!', 'Masih melek nih?']);
}

const OPENERS = {
  enthusiastic: [
    'Wih, pertanyaan bagus!', 'Nah ini menarik!', 'Sip, gas!', 'Oke siaap!',
    'Asik!', 'Mantul!', 'Yes, ini favoritku!', 'Wuiih, senengnya ditanya gini!',
    'Nice question!', 'Setuju banget kita bahas ini!',
  ],
  thoughtful: [
    'Hmm, oke...', 'Bentar ya, aku pikir dulu...', 'Oke, jadi gini...',
    'Coba aku jelasin ya...', 'Aku bantu ya...', 'Sini, aku temenin pahaminnya...',
    'Mari kita pelan-pelan...', 'Yuk kita kupas bareng...',
  ],
  casual: [
    'Eh,', 'Oh ini ya?', 'Oke deh,', 'Yaudah,', 'Sip,', 'Cus,', 'Gas,', 'Ayo,',
  ],
  empathetic: [
    'Tenang,', 'Wajar kok,', 'Sabar ya,', 'Aku ngerti,', 'It\'s okay,', 'Santai dulu,',
  ],
};

const CLOSINGS = {
  cta: [
    'Mau lanjut bahas yang mana?', 'Ada yang masih bingung?', 'Udah agak jelas?',
    'Gimana, mulai connecting the dots?', 'Sip kan?', 'Paham sampai sini?',
    'Mau aku kasih contoh lagi?', 'Lanjut atau cukup?',
  ],
  encouragement: [
    'Kamu bisa banget kok! 💪', 'Tetep semangat ya! 🌟', 'Aku percaya kamu! 🚀',
    'Lanjutkan! 🔥', 'Keep going! ✨', 'You got this! 💯',
  ],
  emoji: ['🎯', '✨', '🚀', '💡', '🌟', '🔥', '💪', '📚', '🎓', '🧠', '⚡', '🌈'],
};

const TRANSITIONS = [
  'Nah,', 'Jadi,', 'Singkatnya,', 'Intinya,', 'Sederhananya,',
  'Begini,', 'Maksudnya,', 'Coba bayangin,', 'Pikir gini,', 'Anggap aja,',
  'Bayangin yaa,', 'Tau gak,', 'Faktanya,', 'Sebenernya,',
];

const TERM_INTROS = [
  'Coba perhatikan kata',
  'Konsep kunci di sini adalah',
  'Yang penting kamu inget',
  'Fokusin ke kata',
  'Ini istilah penting:',
  'Kuncinya ada di',
];

// Local Sulsel references
const SULSEL_LOCAL = [
  'kayak naik motor dari Pangkep ke Makassar',
  'mirip rute pete-pete di Makassar',
  'kayak antri ikan bakar di Losari',
  'sama kayak pas main di Pantai Marina',
  'mirip cara orang Bugis membangun rumah panggung',
  'kayak strategi nelayan Pangkep cari ikan',
  'mirip nyari coto Makassar yang authentic',
  'kayak nyari pisang epe di Losari malam-malam',
  'kayak orang Pangkep bikin tambak',
  'sama kayak pas naik perahu sandeq',
];

const POP_CULTURE = [
  'kayak plot twist di film Avengers',
  'mirip mekanik Mobile Legends',
  'kayak season finale Squid Game',
  'mirip algoritma TikTok FYP',
  'kayak combo di Genshin Impact',
  'mirip strategi tim eSports',
  'kayak filter Instagram',
  'mirip rekomendasi Spotify',
];

// Encouragement phrases
const ENCOURAGEMENTS = [
  'Pelan-pelan aja, gak usah buru-buru.',
  'Setiap orang punya kecepatan belajar masing-masing.',
  'Yang penting konsisten, bukan instant.',
  'Bingung itu tanda otakmu lagi kerja keras!',
  'Salah itu bagian dari proses belajar.',
  'Kamu udah satu langkah lebih maju karena tanya.',
  'Gak ada pertanyaan bodoh, ada yang bodoh kalau gak nanya.',
  'Lebih baik nanya 1000x daripada salah selamanya.',
];

// Random humor inserts
const HUMOR_LIGHT = [
  '(serius mode: ON 😎)',
  '(yes, aku udah siap fokus)',
  '(tarik kursi dulu, mari belajar)',
  '(bismillah dulu yaa)',
  '(level up moment incoming! 🎮)',
  '(plot twist: ini gak sesusah yang kamu kira)',
];

// ============================================================
// LAYER 2: MAPEL KNOWLEDGE BASE (15 mapel)
// ============================================================
const MAPEL_DB: Record<string, any> = {
  matematika: {
    icon: '📐',
    nick: 'Matek',
    vibe: ['logical', 'puzzle', 'pattern'],
    catchphrases: [
      'Matek tuh kayak game — tiap latihan naik level!',
      'Matek bukan dihafal, tapi dipahami.',
      'Setiap soal matek punya pola, kamu cuma perlu nemuin polanya.',
      'Matek itu seni nemuin solusi terindah.',
      'Gak ada matek yang susah, yang ada cuma belum kepahami.',
    ],
    realworld: [
      '💰 Hitung diskon Shopee/Tokopedia 30% = matematika',
      '🎮 Strategi Mobile Legends butuh kalkulasi DPS',
      '📱 Algoritma TikTok FYP = matematika murni',
      '🍕 Split bill makan bareng = pecahan & pembagian',
      '📊 Analisis nilai untuk strategi UTBK',
      '💼 Data scientist (gaji 15-50jt/bulan)',
      '🏗️ Arsitek butuh trigonometri',
      '💳 Bunga bank, KPR, investasi saham',
      '🎲 Probabilitas menang jackpot lottery',
      '🚗 Kalkulasi konsumsi BBM motor',
      '⏰ Manage waktu belajar pakai matematika dasar',
      '📐 Nge-design feed Instagram pakai golden ratio',
      '🛒 Bandingin harga per gram di supermarket',
      '🎯 Statistik pertandingan bola Liga 1',
    ],
    famous: [
      'Albert Einstein (E=mc²) - butuh 10 tahun nemuin teori relativitas',
      'Srinivasa Ramanujan - jago matek otodidak dari India',
      'Maryam Mirzakhani - matematikawan wanita pertama Fields Medal',
      'BJ Habibie - aplikasi matek di pesawat',
    ],
    tips: [
      'Kerjakan 3 soal/hari, lebih efektif dari SKS!',
      'Bikin contekan sendiri (bukan untuk nyontek, untuk inget)',
      'Ajari teman = cara terbaik belajar matek',
      'Visualisasikan! Gambar dulu sebelum hitung',
      'Cek jawaban dengan substitusi balik',
    ],
    metaphors: [
      'Persamaan itu kayak resep — bahan-bahannya harus pas',
      'Variabel itu kayak kotak misterius yang harus dibuka',
      'Rumus itu peta — tunjukin jalan dari soal ke jawaban',
      'Geometri itu seni dengan aturan',
    ],
  },
  'bahasa indonesia': {
    icon: '📚',
    nick: 'B.Indo',
    vibe: ['kreatif', 'ekspresif', 'budaya'],
    catchphrases: [
      'Bahasa Indonesia itu jiwa bangsa kita.',
      'Kuasai bahasamu, kuasai panggungmu.',
      'Kata-kata itu senjata paling halus.',
    ],
    realworld: [
      '✍️ Bikin caption Instagram yang viral',
      '📝 Skill nulis CV/lamaran kerja',
      '🎬 Bikin script konten TikTok',
      '📰 Critical thinking baca berita hoax',
      '💼 Public speaking di interview kerja',
      '📖 Nulis novel kayak Tere Liye/Andrea Hirata',
      '🎤 Bikin lirik lagu kayak Tulus/Hindia',
      '📧 Email formal ke dosen/atasan',
      '📚 Beasiswa butuh essay yang bagus',
      '🎯 Copywriting di marketing (gaji tinggi!)',
    ],
    famous: [
      'Pramoedya Ananta Toer - sastrawan legendaris',
      'Andrea Hirata - Laskar Pelangi go international',
      'NH Dini - novelis perempuan iconic',
      'Eka Kurniawan - dapat penghargaan internasional',
    ],
    tips: [
      'Baca 1 buku/bulan, kosakata auto-naik',
      'Tulis jurnal harian 100 kata',
      'Latihan parafrase artikel',
      'Tonton wawancara orang pintar di YouTube',
    ],
    metaphors: [
      'Kalimat itu kayak rumah, butuh fondasi kuat (SPOK)',
      'Paragraf itu kayak playlist, harus punya tema',
      'Kata itu kayak warna, pilih yang tepat untuk lukisanmu',
    ],
  },
  'bahasa inggris': {
    icon: '🌍',
    nick: 'English',
    vibe: ['praktis', 'global', 'fun'],
    catchphrases: [
      'English is a skill, not a talent. Latihan, bisa!',
      'Native speaker juga sering grammar nya kacau kok.',
      'Don\'t be shy, just try!',
      'Practice makes progress, not perfect.',
    ],
    realworld: [
      '🎬 Nonton Netflix tanpa subtitle',
      '💼 Kerja di startup, gaji 2-3x lipat',
      '✈️ Solo traveling tanpa nyasar',
      '🎓 Beasiswa LPDP/Chevening/Fulbright',
      '💖 Kepoin K-pop idol yang ngomong Inggris',
      '🎮 Pro gamer internasional butuh English',
      '📱 Apply kerja remote di luar negeri',
      '🤝 Networking di LinkedIn worldwide',
      '🎵 Ngerti lirik Taylor Swift/Bruno Mars',
      '📚 Baca jurnal ilmiah terbaru',
      '🎤 Speech kompetisi internasional',
      '👥 Punya teman dari 195 negara',
    ],
    famous: [
      'Cinta Laura - bilingual sejak kecil, sukses global',
      'Maudy Ayunda - Stanford & Oxford alumni',
      'Sherina Munaf - lancar Inggris dari kecil',
      'Joe Taslim - Hollywood actor',
    ],
    tips: [
      'Tonton 1 film Inggris/minggu DENGAN subtitle Inggris',
      'Ganti bahasa HP/medsos jadi English',
      'Latihan ngomong sendiri di depan kaca',
      'Pakai Duolingo 10 menit/hari',
      'Hafal 5 vocabulary baru tiap hari',
    ],
    metaphors: [
      'Grammar itu kayak rangka mobil, vocab itu cat-nya',
      'Tense itu kayak waktu di film — past, present, future',
      'Conjunction itu lem yang nyatuin kalimat',
    ],
  },
  fisika: {
    icon: '⚛️',
    nick: 'Fisika',
    vibe: ['logika alam', 'sebab-akibat', 'experimental'],
    catchphrases: [
      'Fisika tuh source code alam semesta. Keren kan?',
      'Setiap fenomena ada penjelasannya, kamu tinggal nemuin.',
      'Iron Man itu insinyur fisika — dan kamu lagi belajar dasarnya!',
    ],
    realworld: [
      '🚗 Rem ABS motor = aplikasi fisika',
      '📱 Layar HP touchscreen = kapasitor',
      '🚀 SpaceX butuh fisikawan (gaji $200k/tahun)',
      '⚡ Hemat listrik PLN = hemat duit ortu',
      '🎢 Roller coaster pakai energi potensial',
      '📡 5G internet pakai gelombang elektromagnetik',
      '🌊 Surfing pakai prinsip momentum',
      '🎵 Speaker bluetooth = getaran',
      '🏥 MRI di rumah sakit = magnetisme',
      '☀️ Solar panel = efek fotolistrik',
    ],
    famous: [
      'Albert Einstein - relativity & E=mc²',
      'Stephen Hawking - black hole expert',
      'Yogi Erlangga - matematikawan Indonesia di Belanda',
      'BJ Habibie - bapak teknologi Indonesia',
    ],
    tips: [
      'Visualisasikan! Gambar diagram setiap soal',
      'Pahami konsep dulu, baru hafalkan rumus',
      'Praktek di rumah pakai barang sederhana',
      'Tonton channel YouTube Veritasium/MinutePhysics',
    ],
    metaphors: [
      'Gaya itu kayak dorongan tangan tak terlihat',
      'Energi itu kayak uang — gak bisa hilang, cuma berpindah',
      'Gelombang itu kayak antrian estafet',
    ],
  },
  kimia: {
    icon: '🧪',
    nick: 'Kimia',
    vibe: ['eksperimen', 'reaksi', 'kombinasi'],
    catchphrases: [
      'Tubuhmu = lab kimia berjalan, jutaan reaksi/detik!',
      'Walter White di Breaking Bad jago kimia — kamu pakai untuk hal positif yaa.',
      'Kimia tuh masak-masak level expert.',
    ],
    realworld: [
      '🧴 Pilih skincare aman = paham bahan kimia',
      '🍳 Memasak = reaksi kimia',
      '💊 Obat & dosis yang tepat',
      '🌱 Pupuk pertanian Pangkep',
      '🧼 Sabun mandi yang cocok',
      '🍺 Fermentasi (teh kombucha, tape)',
      '⛽ Kenapa BBM Pertamax beda Pertalite',
      '💄 Kosmetik & ingredients halal',
      '🔋 Baterai HP cepet abis kenapa',
      '🌍 Polusi & lingkungan',
    ],
    famous: [
      'Marie Curie - dapat 2 Nobel Prize',
      'Mendeleev - bikin tabel periodik',
      'Sangkot Marzuki - peneliti DNA Indonesia',
    ],
    tips: [
      'Hafal tabel periodik dengan lagu/jembatan keledai',
      'Pakai kartu flash untuk reaksi & rumus',
      'Kerjakan soal stoikiometri tiap hari',
      'Tonton tutorial reaksi di YouTube',
    ],
    metaphors: [
      'Atom itu kayak Lego, bisa dirakit jadi apa aja',
      'Reaksi kimia kayak pertukaran teman dansa',
      'Senyawa itu kayak band — beda anggota beda lagu',
    ],
  },
  biologi: {
    icon: '🧬',
    nick: 'Bio',
    vibe: ['kehidupan', 'sistem', 'evolusi'],
    catchphrases: [
      'Kamu adalah makhluk biologi paling kompleks yang pernah ada di Bumi.',
      'Bio itu mempelajari "kamu" itu sendiri.',
      'Setiap sel tubuhmu lebih canggih dari supercomputer NASA!',
    ],
    realworld: [
      '🏥 Memahami penyakit & pencegahan',
      '🌾 Pertanian Pangkep & pangan',
      '🧬 DNA & forensik kriminal',
      '🌍 Konservasi mangrove Sulsel',
      '💪 Olahraga & nutrisi yang benar',
      '🦠 COVID-19 & vaksin',
      '🌳 Ekosistem hutan Sulawesi',
      '🐠 Budidaya ikan & rumput laut',
      '👶 Genetik & keturunan',
      '🧠 Neurosains & belajar efektif',
    ],
    famous: [
      'Charles Darwin - teori evolusi',
      'Gregor Mendel - bapak genetika',
      'Oei Eng Djie - peneliti kanker Indonesia',
    ],
    tips: [
      'Bikin mind map untuk klasifikasi',
      'Visualisasikan dengan diagram tubuh/sel',
      'Pelajari anatomi pakai aplikasi 3D',
      'Hubungkan dengan kesehatan diri sendiri',
    ],
    metaphors: [
      'Sel itu kayak pabrik mini di tubuhmu',
      'DNA itu kayak buku resep yang turun-temurun',
      'Ekosistem itu kayak grup chat — semua saling terhubung',
    ],
  },
  'sejarah indonesia': {
    icon: '🏛️',
    nick: 'Sejarah',
    vibe: ['cerita', 'kronologis', 'identitas'],
    catchphrases: [
      'Sejarah itu cermin masa depan.',
      'Bangsa yang lupa sejarahnya akan ngulang kesalahannya.',
      'Setiap kamu hari ini adalah hasil dari sejarah panjang.',
    ],
    realworld: [
      '🇮🇩 Memahami identitas bangsa',
      '🗳️ Bijak memilih pemimpin',
      '⚖️ Cegah konflik berulang',
      '📰 Critical thinking baca berita',
      '🎬 Nikmati film historical drama',
      '✈️ Ngerti museum saat traveling',
      '👥 Hormati keragaman',
      '📚 Apresiasi budaya lokal Pangkep/Bugis',
    ],
    famous: [
      'Sultan Hasanuddin - pahlawan Sulsel',
      'Soekarno - proklamator',
      'RA Kartini - emansipasi',
      'Cut Nyak Dien - srikandi Aceh',
    ],
    tips: [
      'Bikin timeline visual',
      'Hubungkan sebab-akibat antar peristiwa',
      'Tonton film/dokumenter sejarah',
      'Diskusi dengan kakek/nenek',
    ],
    metaphors: [
      'Sejarah itu seperti cerita panjang — setiap bab terhubung',
      'Peristiwa itu kayak domino — satu jatuh, semua ikut',
    ],
  },
  geografi: {
    icon: '🗺️',
    nick: 'Geo',
    vibe: ['spasial', 'lingkungan', 'global'],
    catchphrases: [
      'Geografi itu memahami "rumah" terbesarmu — Bumi.',
      'Kamu dimana sekarang? Pangkep, Sulsel, Indonesia, Asia, Bumi, Tata Surya.',
    ],
    realworld: [
      '🌍 Pahami iklim & cuaca Pangkep',
      '🗺️ Baca peta Google Maps lebih jago',
      '🌊 Mitigasi bencana (tsunami, banjir)',
      '🏔️ Wisata alam Sulsel',
      '🌾 Lahan pertanian optimal',
      '🏘️ Tata kota & urbanisasi',
      '🌡️ Climate change & Indonesia',
      '🗾 Geopolitik global',
    ],
    famous: ['Junghuhn - peneliti gunung Indonesia', 'Wallace - garis Wallacea Sulsel'],
    tips: [
      'Pelajari peta dengan main GeoGuessr',
      'Hafalkan ibu kota dengan flashcard',
      'Tonton dokumenter National Geographic',
    ],
    metaphors: [
      'Bumi itu kayak rumah dengan banyak ruangan (zona iklim)',
      'Lempeng tektonik itu kayak puzzle yang bergeser',
    ],
  },
  ekonomi: {
    icon: '💰',
    nick: 'Ekon',
    vibe: ['analitis', 'praktis', 'global'],
    catchphrases: [
      'Ekonomi itu studi tentang pilihan — kenapa kamu pilih A bukan B.',
      'Pahamu ekonomi = pahamu hidup.',
    ],
    realworld: [
      '💳 Manage uang jajan & nabung',
      '📈 Investasi saham/reksa dana',
      '🏪 Bikin bisnis online sendiri',
      '💵 Kenapa harga BBM naik-turun',
      '🛒 Belanja cerdas, gak konsumtif',
      '💼 Karir di bank/finance (gaji tinggi)',
      '🌍 Pahami berita ekonomi global',
      '🏦 Pilih bank & produk keuangan',
    ],
    famous: [
      'Adam Smith - bapak ekonomi modern',
      'Sri Mulyani - menkeu Indonesia',
      'Boediono - mantan Wapres ekonom',
    ],
    tips: [
      'Praktik mini bisnis (jual jajanan di sekolah)',
      'Track pengeluaran 1 bulan',
      'Baca berita ekonomi 5 menit/hari',
      'Main game ekonomi simulasi',
    ],
    metaphors: [
      'Pasar itu kayak panggung tarian permintaan & penawaran',
      'Uang itu darah ekonomi — harus mengalir',
    ],
  },
  sosiologi: {
    icon: '👥',
    nick: 'Sos',
    vibe: ['observasi', 'masyarakat', 'analisis'],
    catchphrases: [
      'Sosiologi = ilmu memahami "kenapa orang gitu".',
      'Kamu hidup di masyarakat — wajib paham bagaimana ia bekerja.',
    ],
    realworld: [
      '👥 Dinamika kelompok di sekolah',
      '🏘️ Solusi masalah sosial Pangkep',
      '📱 Dampak medsos ke remaja',
      '🎯 Marketing & psikologi konsumen',
      '👨‍👩‍👧 Relasi keluarga modern',
      '🌍 Globalisasi & budaya lokal',
      '⚖️ Keadilan sosial',
      '🤝 Komunikasi antar suku',
    ],
    famous: [
      'Selo Soemardjan - bapak sosiologi Indonesia',
      'Émile Durkheim - founding father sosiologi',
      'Max Weber - teori birokrasi',
    ],
    tips: [
      'Observasi orang di sekitar (etis ya!)',
      'Diskusi isu sosial dengan teman',
      'Tonton dokumenter sosial',
      'Baca berita dengan kacamata sosiolog',
    ],
    metaphors: [
      'Masyarakat itu kayak orkestra — setiap orang punya peran',
      'Norma sosial kayak rambu lalu lintas — ngarahin perilaku',
    ],
  },
  ppkn: {
    icon: '🇮🇩',
    nick: 'PPKn',
    vibe: ['nasional', 'hukum', 'identitas'],
    catchphrases: [
      'PPKn = manual book jadi warga negara yang baik.',
      'Pancasila bukan cuma hafalan, tapi cara hidup.',
    ],
    realworld: [
      '🗳️ Pilih pemimpin yang tepat',
      '⚖️ Tau hak & kewajiban warga',
      '🤝 Toleransi keragaman',
      '📜 Pahami konstitusi',
      '🎯 Cegah radikalisme',
      '💪 Cinta tanah air',
    ],
    famous: ['Soekarno', 'Mohammad Hatta', 'Soepomo'],
    tips: ['Diskusi isu nasional', 'Nonton sidang DPR (kadang)', 'Pahami sejarah Pancasila'],
    metaphors: ['Pancasila kayak fondasi rumah Indonesia'],
  },
  'pendidikan agama islam': {
    icon: '🕌',
    nick: 'PAI',
    vibe: ['spiritual', 'akhlak', 'bijak'],
    catchphrases: [
      'Ilmu agama itu cahaya — penerang hidup.',
      'Akhlak itu raja, ilmu itu prajurit.',
    ],
    realworld: [
      '🤲 Akhlak baik = relasi sosial bagus',
      '💼 Etika bisnis Islami',
      '👨‍👩‍👧 Membangun keluarga sakinah',
      '🌍 Toleransi antar umat',
      '💪 Mental kuat dengan tawakkal',
    ],
    famous: ['KH Hasyim Asy\'ari', 'KH Ahmad Dahlan', 'Buya Hamka'],
    tips: ['Baca Quran 1 ayat/hari dengan tafsir', 'Praktekkan akhlak baik tiap hari'],
    metaphors: ['Iman itu kayak akar pohon — gak kelihatan tapi penting'],
  },
  'seni budaya': {
    icon: '🎨',
    nick: 'Senbud',
    vibe: ['kreatif', 'ekspresif', 'budaya'],
    catchphrases: [
      'Seni itu jendela jiwa.',
      'Setiap orang punya seninya sendiri.',
    ],
    realworld: [
      '🎨 Bikin konten kreatif viral',
      '📸 Fotografi profesional',
      '🎵 Musisi/produser',
      '🎬 Filmmaker',
      '👗 Fashion design',
      '💃 Tari Pakarena Sulsel',
      '🎭 Theater & drama',
    ],
    famous: ['Affandi', 'Raden Saleh', 'Tari Sulsel: Pakarena'],
    tips: ['Praktek tiap hari', 'Eksplorasi banyak medium', 'Apresiasi karya orang lain'],
    metaphors: ['Seni itu kayak bahasa universal'],
  },
  penjaskes: {
    icon: '⚽',
    nick: 'PJOK',
    vibe: ['fisik', 'sehat', 'tim'],
    catchphrases: [
      'Tubuh sehat = otak waras.',
      'Olahraga itu investasi seumur hidup.',
    ],
    realworld: [
      '💪 Tubuh fit, mental kuat',
      '⚽ Atlet profesional',
      '🏥 Cegah penyakit jantung',
      '🧠 Olahraga bikin pintar',
    ],
    famous: ['Susi Susanti', 'Eko Yuli (angkat besi)', 'Marquez Pulalo (PSM Makassar)'],
    tips: ['Olahraga 30 menit/hari', 'Variasi: kardio + strength', 'Istirahat cukup'],
    metaphors: ['Tubuh itu kayak mobil — butuh maintenance rutin'],
  },
  informatika: {
    icon: '💻',
    nick: 'IT',
    vibe: ['logic', 'creative', 'futuristic'],
    catchphrases: [
      'Coding tuh superpower abad 21.',
      'Komputer cuma jago kalau kamu kasih instruksi yang tepat.',
      'Bug itu fitur yang belum diundang!',
    ],
    realworld: [
      '💻 Bikin website/app sendiri',
      '🤖 AI engineer (gaji 30-100jt/bulan)',
      '🎮 Game developer',
      '🔐 Cybersecurity (paling dibutuhkan!)',
      '☁️ Cloud engineer',
      '📊 Data scientist',
      '🌐 Freelance worldwide',
      '🚀 Bikin startup unicorn',
    ],
    famous: [
      'Nadiem Makarim - founder Gojek',
      'William Tanuwijaya - founder Tokopedia',
      'Achmad Zaky - founder Bukalapak',
    ],
    tips: [
      'Coding 1 jam/hari, lebih baik dari maraton',
      'Bikin project beneran, bukan cuma latihan',
      'Stack Overflow & ChatGPT = teman setia',
      'Belajar Python dulu (paling friendly)',
    ],
    metaphors: [
      'Programming itu kayak nulis resep masak — step by step',
      'Bug itu kayak typo di novel — bikin pembaca bingung',
    ],
  },
};

// ============================================================
// CONTEXT EXTRACTORS (Read materi content)
// ============================================================
function getHeadings(blocks: Block[]): string[] {
  return blocks.filter((b: any) => b.type === 'heading').map((b: any) => b.text);
}

function getParagraphs(blocks: Block[]): string[] {
  return blocks.filter((b: any) => b.type === 'paragraph').map((b: any) => b.text);
}

function getCallouts(blocks: Block[]): { style: string; text: string }[] {
  return blocks.filter((b: any) => b.type === 'callout').map((b: any) => ({ style: b.style, text: b.text }));
}

function getQuizzes(blocks: Block[]): any[] {
  return blocks.filter((b: any) => b.type === 'check');
}

function getFirstParagraph(blocks: Block[]): string {
  const p = blocks.find((b: any) => b.type === 'paragraph') as any;
  return p ? p.text : '';
}

function extractKeyTerms(blocks: Block[]): string[] {
  const terms = new Set<string>();
  blocks.forEach((b: any) => {
    if (b.type === 'paragraph' || b.type === 'callout') {
      const matches = b.text.matchAll(/\*\*([^*]+)\*\*/g);
      for (const m of matches) {
        if (m[1].length < 50 && m[1].length > 2) terms.add(m[1]);
      }
    }
  });
  return Array.from(terms).slice(0, 8);
}

function getMapelData(mapel: string): any {
  if (!mapel) return MAPEL_DB.matematika;
  const key = mapel.toLowerCase();
  return Object.entries(MAPEL_DB).find(([k]) => key.includes(k))?.[1] || MAPEL_DB.matematika;
}

// ============================================================
// LAYER 3: USER NAME & PERSONALIZATION
// ============================================================
function getUserNameTreatment(user: any): string {
  const nama = user?.nama;
  if (!nama) return pick(['kamu', 'gengs', 'sob']);

  const firstName = nama.split(' ')[0];
  return pick([firstName, `${firstName}`, `${firstName} keren`, 'kamu', firstName]);
}

function buildOpening(user: any, mood: 'enthusiastic' | 'thoughtful' | 'casual' | 'empathetic' = 'enthusiastic'): string {
  const opener = pick(OPENERS[mood]);
  const name = getUserNameTreatment(user);

  if (maybe(0.3)) {
    return `${opener} ${name},`;
  }
  return opener;
}

function buildClosing(intent: Intent): string {
  const cta = pick(CLOSINGS.cta);
  const emoji = pick(CLOSINGS.emoji);

  if (intent === 'motivation' || intent === 'help_understanding') {
    return `${pick(CLOSINGS.encouragement)} ${cta} ${emoji}`;
  }
  return `${cta} ${emoji}`;
}

// ============================================================
// LAYER 4: INTENT CLASSIFIER
// ============================================================
export function classifyIntent(message: string): Intent {
  const msg = message.toLowerCase().trim();

  if (/^(halo|hai|hi|hello|assalam|selamat|pagi|siang|sore|malam|woi|bro|sis|kak|ka)/i.test(msg)) return 'greeting';
  if (/(makasih|terima kasih|thanks|thx|tq|sip|mantap|ngerti|paham|oke|sip2)/i.test(msg) && msg.length < 30) return 'thanks';
  if (/(siapa kamu|kamu siapa|tutor apa|nama kamu|tentang kamu|bot ya|ai ya|ai kah|robot)/i.test(msg)) return 'about_tutor';
  if (/(lucu|jokes|joke|garing|bercanda|tertawa|humor|funny)/i.test(msg)) return 'joke';
  if (/(pinter|pintar|smart|jago|hebat|keren kamu|good job|good)/i.test(msg) && msg.length < 30) return 'compliment';
  if (/(jelaskan ulang|sederhana|gampang|simpel|gak ngerti|tidak paham|bingung|susah dipahami|bahasa mudah|eli5|kayak anak|tolol|otak)/i.test(msg)) return 'simplify';
  if (/(contoh|misalnya|misalkan|kasih contoh|berikan contoh|coba contoh|gimana ya|seperti apa|case study)/i.test(msg)) return 'example_request';
  if (/(latihan|soal|kerjakan|kasih soal|test saya|tes saya|coba saya|quiz|tantangan|drill|exercise)/i.test(msg)) return 'exercise_request';
  if (/(kehidupan sehari|nyata|real|aplikasi|kegunaan|manfaat|untuk apa|kenapa belajar|buat apa|gunanya|kepake|berguna)/i.test(msg)) return 'realworld_application';
  if (/(apa itu|apa yang dimaksud|definisi|pengertian|arti|maksud|definisikan)/i.test(msg)) return 'definition';
  if (/(beda|perbedaan|bandingkan|vs|atau|mana yang|pilih)/i.test(msg)) return 'comparison';
  if (/(langkah|cara|tahap|bagaimana|gimana|step|urutan|tutorial|prosedur|how to)/i.test(msg)) return 'step_by_step';
  if (/(benar|salah|cek|periksa|jawaban saya|apakah benar|right|wrong)/i.test(msg)) return 'check_answer';
  if (/(susah|sulit|menyerah|capek|stress|males|gak bisa|nyerah|putus asa|lelah|cape|frustrasi|frustasi|gak mood)/i.test(msg)) return 'motivation';
  if (/(tips|trik|cara belajar|metode|tips belajar|teknik)/i.test(msg)) return 'study_tips';
  if (/(bantu|tolong|help)/i.test(msg)) return 'help_understanding';
  return 'unknown';
}

// ============================================================
// LAYER 5: RESPONSE GENERATORS (Generative)
// ============================================================

function generateGreeting(ctx: TutorContext): TutorResponse {
  const name = getUserNameTreatment(ctx.user);
  const timeGreet = getTimeGreeting();
  const judul = ctx.materi?.judul || 'materi ini';
  const mapel = getMapelData(ctx.materi?.mapel);

  const templates = [
    `${timeGreet} ${name}! ${pick(['🌟', '✨', '👋', '🚀'])}\n\nAku Tutor SANDEQ, asisten belajarmu untuk "${judul}". ${pick(['Mau aku bantu pahamin yang mana?', 'Ada yang mau ditanyain?', 'Gas, mulai dari mana?', 'Aku siap nemenin kamu belajar.'])}`,
    `${pick(['Halo', 'Hi', 'Hai'])} ${name}! ${mapel.icon} ${pick<string>((mapel.catchphrases as string[] | undefined) || [])}\n\nBelajar "${judul}" yaa. ${pick(['Apa yang mau kita bahas?', 'Mulai dari mana nih?', 'Aku dengerin nih.'])}`,
    `${timeGreet}! ${pick(['Senengnya ketemu kamu', 'Asik, ada teman belajar', 'Wih, semangat banget'])} ${name} ${pick(['🌟', '💫', '✨'])}\n\nLagi belajar **${judul}** ya? ${pick(['Yuk gas pahamin bareng!', 'Aku bantu deh!', 'Gas kita kupas tuntas!'])}`,
    `${pick(['Wih', 'Eh', 'Yuhuu'])} ${name}! ${pick(CLOSINGS.emoji)}\n\n${pick(['Selamat datang di tutoring session!', 'Ready untuk belajar?', 'Siap jadi pinter hari ini?'])} Topik kita: **${judul}**.`,
  ];

  return {
    text: pick(templates),
    intent: 'greeting',
    suggestions: pickN([
      'Jelaskan ulang dengan sederhana',
      'Kasih contoh konkret',
      'Buatkan saya soal',
      'Aplikasinya di kehidupan?',
      'Tips belajar materi ini?',
      'Saya bingung total nih',
    ], 4),
  };
}

function generateSimplify(ctx: TutorContext): TutorResponse {
  const name = getUserNameTreatment(ctx.user);
  const judul = ctx.materi?.judul || 'materi ini';
  const mapel = getMapelData(ctx.materi?.mapel);
  const headings = getHeadings(ctx.blocks);
  const keyTerms = extractKeyTerms(ctx.blocks);
  const firstPara = getFirstParagraph(ctx.blocks);

  const opener = buildOpening(ctx.user, 'thoughtful');
  const transition = pick(TRANSITIONS);
  const metaphor = pick<string>((mapel.metaphors as string[] | undefined) || ['itu kayak puzzle yang harus disusun']);

  let text = `${opener} ${pick([
    'aku coba pakai bahasa lebih santai ya',
    'ini aku jelasin pakai analogi sederhana',
    'aku bantu pecah jadi bagian yang gampang',
    'sini aku breakdown pelan-pelan',
  ])}.\n\n`;

  // Pakai metaphor mapel
  text += `**${transition}** ${judul} ${metaphor.toLowerCase()}.\n\n`;

  // Kalau ada key terms dari materi, jelasin
  if (keyTerms.length >= 2) {
    text += `**Yang penting kamu inget cuma ${Math.min(3, keyTerms.length)} hal:**\n`;
    keyTerms.slice(0, 3).forEach((term, i) => {
      text += `${i + 1}. **${term}** — `;
      if (firstPara.toLowerCase().includes(term.toLowerCase())) {
        const idx = firstPara.toLowerCase().indexOf(term.toLowerCase());
        const snippet = firstPara.substring(Math.max(0, idx - 20), Math.min(firstPara.length, idx + 80));
        text += `${snippet.replace(/\*\*/g, '').trim()}...\n`;
      } else {
        text += `konsep penting di materi ini\n`;
      }
    });
    text += `\n`;
  }

  // Local analogy 30% probability
  if (maybe(0.3)) {
    text += `${pick(['Bayangin gini', 'Pikir kayak gini', 'Coba liat dari sisi'])} — ${pick(SULSEL_LOCAL)}. `;
    text += `${pick(['Mirip kan?', 'Konsepnya sama!', 'Nyambung ya?'])}\n\n`;
  } else if (maybe(0.5)) {
    text += `${pick(['Atau bisa dibandingin', 'Mirip juga'])} ${pick(POP_CULTURE)}.\n\n`;
  }

  text += `${pick(ENCOURAGEMENTS)}\n\n`;
  text += buildClosing('simplify');

  return {
    text,
    intent: 'simplify',
    suggestions: pickN([
      'Masih bingung, sederhanain lagi',
      'Kasih contoh konkret',
      'Buatkan soal latihan',
      'Tips belajarnya?',
      'Hubungannya dengan kehidupan?',
    ], 3),
  };
}

function generateExample(ctx: TutorContext): TutorResponse {
  const name = getUserNameTreatment(ctx.user);
  const judul = ctx.materi?.judul || 'materi ini';
  const mapel = getMapelData(ctx.materi?.mapel);
  const opener = buildOpening(ctx.user, 'enthusiastic');

  let text = `${opener} aku kasih ${pick(['contoh seru', 'contoh konkret', 'contoh nyata', 'beberapa contoh'])} buat **${judul}** ${pick(CLOSINGS.emoji)}\n\n`;

  // Pick 3 random real-world examples
  const examples = pickN<string>((mapel.realworld as string[] | undefined) || [], 3);
  if (examples.length > 0) {
    text += `**${pick(['Coba liat di sekitar kamu', 'Aplikasi nyata sehari-hari', 'Contoh yang relate banget'])}:**\n\n`;
    examples.forEach((ex: string) => {
      text += `${ex}\n`;
    });
    text += `\n`;
  }

  // Add metaphor
  if (mapel.metaphors) {
    text += `${pick(TRANSITIONS)} kalo dianalogikan, **${judul}** itu ${pick<string>(mapel.metaphors as string[]).toLowerCase()}.\n\n`;
  }

  // Local context 40%
  if (maybe(0.4)) {
    text += `${pick(['💡 Fun fact:', '✨ Tau gak:', '🎯 Catatan:'])} ${pick([
      'Konsep ini dipake banget di Sulsel, terutama di industri perikanan & pertanian Pangkep!',
      'Banyak alumni SMAN 6 yang sukses karena nguasain materi ini.',
      'Kalo kamu nguasain ini, kamu udah selangkah lebih maju dari teman-temanmu!',
    ])}\n\n`;
  }

  text += buildClosing('example_request');

  return {
    text,
    intent: 'example_request',
    suggestions: pickN([
      'Contoh lain yang lebih simpel',
      'Buatkan soal serupa',
      'Step by step gimana',
      'Tips menerapkannya?',
    ], 3),
  };
}

function generateExercise(ctx: TutorContext): TutorResponse {
  const name = getUserNameTreatment(ctx.user);
  const quizzes = getQuizzes(ctx.blocks);
  const judul = ctx.materi?.judul || 'materi ini';
  const mapel = getMapelData(ctx.materi?.mapel);
  const opener = buildOpening(ctx.user, 'enthusiastic');

  let text = `${opener} ${pick(['siaap', 'gas', 'oke', 'cus'])}, ${pick(['mari uji', 'kita test', 'coba challenge'])} pemahamanmu! ${pick(['💪', '🎯', '🔥', '⚡'])}\n\n`;

  if (quizzes.length > 0) {
    text += `**${pick(['Kabar baik:', 'Berita baik:', 'FYI:'])} di materi ini ada ${quizzes.length} mini quiz!**\n\n`;
    text += `${pick([
      'Scroll ke atas, klik tombol "Submit Jawaban" di setiap quiz.',
      'Coba jawab dulu, baru tanya aku kalau bingung.',
      'Quiz itu adalah cara terbaik test pemahaman — jangan skip ya!',
    ])}\n\n`;
  }

  // Self-challenge
  text += `**${pick(['🎯 Challenge dari Tutor:', '⚡ Tantangan untukmu:', '🔥 Self-test:'])}**\n\n`;
  const challenges = [
    `Coba buat 2 contoh sendiri tentang **${judul}**. Tulis di buku, lalu konsultasikan ke gurumu.`,
    `Jelaskan **${judul}** ke temanmu pakai bahasa kamu sendiri. Kalo dia ngerti, berarti kamu udah master!`,
    `Bikin mind map **${judul}** dengan minimal 5 cabang konsep.`,
    `Cari 1 berita/artikel yang ada hubungannya dengan **${judul}**, lalu rangkum dalam 100 kata.`,
    `Tulis 5 pertanyaan yang masih membingungkanmu tentang **${judul}**. Jawab sendiri kalo bisa!`,
  ];
  text += pick(challenges) + '\n\n';

  text += `**${pick(['💡 Kenapa penting?', '🧠 Insight:', '📌 Reminder:'])}** ${pick([
    'Belajar efektif itu BUKAN cuma baca, tapi MEMBUAT.',
    'Saat kamu bikin contoh sendiri, otakmu makin inget!',
    'Practice > theory. Active learning is the way!',
    'Yang kamu kerjakan akan diingat 90%, yang cuma kamu baca cuma 10%.',
  ])}\n\n`;

  text += buildClosing('exercise_request');

  return {
    text,
    intent: 'exercise_request',
    suggestions: pickN([
      'Soal yang lebih mudah dong',
      'Tips menjawab quiz',
      'Cek pemahamanku',
      'Kasih contoh jawaban',
    ], 3),
  };
}

function generateRealWorld(ctx: TutorContext): TutorResponse {
  const judul = ctx.materi?.judul || 'materi ini';
  const mapel = getMapelData(ctx.materi?.mapel);
  const name = getUserNameTreatment(ctx.user);
  const opener = buildOpening(ctx.user, 'enthusiastic');

  let text = `${opener} ini ${pick(['pertanyaan keren banget', 'pertanyaan favoritku', 'pertanyaan yang HARUS ditanya semua siswa'])}! 🌟\n\n`;

  text += `**${judul}** ${pick([
    'BUKAN cuma teori di buku.',
    'punya impact nyata di hidup kita.',
    'kepake banget di banyak hal.',
    'lebih relevan dari yang kamu kira!',
  ])}\n\n`;

  // Show 4-5 random examples
  const examples = pickN<string>((mapel.realworld as string[] | undefined) || [], 5);
  if (examples.length > 0) {
    text += `**${pick(['Aplikasi nyata di hidupmu:', 'Yang kepake banget:', 'Contoh real-world:'])}**\n\n`;
    examples.forEach((ex: string) => {
      text += `${ex}\n`;
    });
    text += `\n`;
  }

  // Career angle
  if (mapel.realworld && (mapel.realworld as string[]).some((r: string) => /gaji|profesi|karir/i.test(r))) {
    text += `**💼 Career angle:** Banyak profesi tinggi yang butuh skill ini. Kalo kamu master sekarang, masa depanmu cerah!\n\n`;
  }

  // Famous figure 30%
  if (maybe(0.3) && mapel.famous) {
    text += `**🌟 Inspirasi:** ${pick<string>(mapel.famous as string[])}\n\n`;
  }

  // Local context
  if (maybe(0.5)) {
    text += `**🏝️ Konteks Sulsel:** ${pick([
      'Banyak alumni SMAN 6 Pangkep yang sukses karena nguasain materi ini sejak SMA.',
      'Industri Pangkep (perikanan, pertanian, pertambangan) butuh skill ini.',
      'Pangkep bagian dari masa depan Indonesia — kamu bagian dari itu!',
    ])}\n\n`;
  }

  text += buildClosing('realworld_application');

  return {
    text,
    intent: 'realworld_application',
    suggestions: pickN([
      'Contoh karir yang pakai ini',
      'Gimana cara mulai latihan?',
      'Tips untuk master skill ini',
      'Hubungan dengan jurusan kuliah?',
    ], 3),
  };
}

function generateMotivation(ctx: TutorContext): TutorResponse {
  const name = getUserNameTreatment(ctx.user);
  const opener = buildOpening(ctx.user, 'empathetic');
  const mapel = getMapelData(ctx.materi?.mapel);

  const responses = [
    `${opener} tarik napas dulu yaa 💙\n\n${pick([
      'Ingat: setiap orang yang sekarang pintar, dulu juga pernah bingung.',
      'Einstein butuh 10 tahun nemuin teori relativitas. Wajar kamu butuh waktu.',
      'Bingung itu BUKAN tanda kamu bodoh — itu tanda otakmu lagi BERTUMBUH 🌱',
    ])}\n\n**Coba ini:**\n1. Istirahat 5 menit, minum air putih\n2. Stretching dikit\n3. Baca ulang dari awal pelan-pelan\n4. Kalo masih bingung, tanya aku lagi\n\n${pick(ENCOURAGEMENTS)} ${pick(['💪', '🌟', '✨'])}`,

    `${name}, ${pick([
      'susah itu BUKAN berarti kamu bodoh',
      'ini wajar, semua orang juga gini',
      'kamu gak sendirian',
    ])}. ${pick([
      'Itu artinya otakmu lagi level-up! 🎮',
      'Kamu lagi di growth zone! 📈',
      'Ini momen otakmu lagi rewiring! 🧠',
    ])}\n\n**Mindset shift:**\n• Kalo soal kelihatan susah → otakmu lagi build muscle\n• Kalo bingung → it means kamu peduli\n• Kalo nyerah → kamu kalah dari versi kemarin\n\n${pick([
      'Ayo, satu soal aja dulu. Cuma 1. Habis itu boleh istirahat.',
      'Yuk coba lagi. Aku temenin.',
      'Gas terus, kamu lebih kuat dari yang kamu kira!',
    ])} ${pick(['💪', '🔥', '⚡'])}`,

    `Hey ${name}, ${pick([
      'aku ngerti rasanya capek belajar',
      'I feel you, capek itu nyata',
      'wajar kok merasa drained',
    ])}. 🫂\n\n**Tapi dengar ya:**\n${pick([
      'Otakmu butuh STRESS (kesulitan) untuk belajar.',
      'Diamond formed under pressure. So are smart brains.',
      'Pohon yang kuat itu yang akarnya berkembang di tanah keras.',
    ])}\n\n${pick<string>((mapel.catchphrases as string[] | undefined) || ['Kamu pasti bisa!'])}\n\n${pick([
      'Coba 1 quiz aja dulu, kasih reward ke diri sendiri abis itu.',
      'Pomodoro 25 menit, lalu istirahat. Repeat.',
      'Pecah materi jadi 3 bagian kecil, kerjakan 1 aja.',
    ])} ${pick(['💪', '🌟'])}`,

    `${name}, ${pick([
      'remember why you started.',
      'inget kenapa kamu sekolah.',
      'visualisasikan masa depanmu.',
    ])}\n\n${pick([
      'Tahun depan kamu akan lulus.\nBeberapa tahun lagi kamu kuliah.\nBeberapa tahun lagi kamu kerja/wirausaha.\n\nSetiap detik belajarmu sekarang = investasi masa depan.',
      'Bayangin diri kamu 5 tahun lagi.\nKamu mau jadi siapa?\nApa yang udah kamu raih?\n\nVersi terbaik kamu lagi di-build dari hari ini.',
      'Banyak alumni SMAN 6 yang dulu juga bingung, sekarang sukses.\nMereka gak quit. Mereka push through.\nKamu juga bisa.',
    ])}\n\n${pick(['💪 Kamu lebih kuat dari yang kamu pikir!', '🌟 You got this!', '🚀 Lanjut yaa!'])}`,
  ];

  return {
    text: pick(responses),
    intent: 'motivation',
    suggestions: pickN([
      'OK, coba lagi deh',
      'Jelaskan dari awal',
      'Kasih soal yang gampang',
      'Tips belajar yang efektif',
      'Cerita success story dong',
    ], 3),
  };
}

function generateThanks(ctx: TutorContext): TutorResponse {
  const name = getUserNameTreatment(ctx.user);
  const responses = [
    `Sama-sama ${name}! ${pick(['🌟', '💪', '✨', '🚀'])} ${pick([
      'Kalau ada yang masih bingung, tanya aja kapanpun.',
      'Terus semangat ya belajarnya!',
      'Aku selalu ready bantuin kamu.',
      'Belajar itu maraton, bukan sprint. Pelan-pelan aja.',
    ])}`,
    `${pick(['Yes!', 'Sip!', 'Asik!', 'Mantap!'])} Senengnya bisa bantu ${name}. ${pick([
      'Kalo ada yang lain mau dibahas, langsung aja.',
      'Stay curious yaa!',
      'Lanjutin yang lagi kamu pelajarin.',
    ])} ${pick(['🎯', '✨', '🌟'])}`,
    `Anytime ${name}! ${pick(['💯', '🔥', '⚡'])} ${pick([
      'Tanya lagi yang lain kalo ada.',
      'Aku di sini terus kok.',
      'Keep going, kamu di track yang bener!',
    ])}`,
  ];
  return {
    text: pick(responses),
    intent: 'thanks',
    suggestions: pickN([
      'Lanjut materi berikutnya',
      'Kasih soal latihan',
      'Tips belajar lainnya?',
      'Sampai jumpa!',
    ], 3),
  };
}

function generateAboutTutor(ctx: TutorContext): TutorResponse {
  const responses = [
    `Halo! Aku **Tutor SANDEQ** 🤖✨\n\nAku dibuat khusus untuk siswa SMAN 6 Pangkep — temen belajarmu di platform SANDEQ. Aku gak sehebat ChatGPT/Claude, tapi aku **paham banget materi yang kamu pelajari** karena aku connect langsung ke konten gurumu!\n\n**Yang aku bisa:**\n📖 Jelasin materi dengan bahasa lebih sederhana\n💡 Kasih contoh nyata\n✏️ Buatkan soal latihan\n🌍 Hubungin dengan kehidupan sehari-hari\n💪 Motivasi kalo kamu lagi down\n\nGas, ada yang mau ditanyain?`,
    `Aku **Tutor SANDEQ** — bukan AI seperti ChatGPT, tapi **smart system** khusus didesain untuk SMA negeri Indonesia 🇮🇩\n\n**Bedanya aku dengan AI biasa:**\n✅ Aman & sesuai kurikulum\n✅ Konteksnya lokal (Pangkep, Sulsel)\n✅ Gratis tanpa batas\n✅ Cepat (gak perlu nunggu API)\n\nKalo aku gak bisa jawab sesuatu, jangan ragu tanya gurumu yaa!`,
    `**Tutor SANDEQ** at your service! 🎓\n\nAku robot kecil yang dibikin sama tim SANDEQ untuk bantuin kamu paham materi. Aku tau topik yang kamu lagi pelajarin (sekarang: **${ctx.materi?.judul || 'materi ini'}**) dan bisa kasih insight kontekstual.\n\nFun fact: setiap chatmu sama aku tersimpan, jadi kamu bisa cek lagi nanti!\n\nMau mulai dari mana?`,
  ];
  return {
    text: pick(responses),
    intent: 'about_tutor',
    suggestions: pickN([
      'Jelaskan materi sekarang',
      'Kasih contoh',
      'Tips belajar?',
      'Aku bingung total',
    ], 3),
  };
}

function generateJoke(ctx: TutorContext): TutorResponse {
  const mapel = ctx.materi?.mapel?.toLowerCase() || '';
  const name = getUserNameTreatment(ctx.user);

  const jokes: Record<string, string[]> = {
    matematika: [
      `Kenapa angka 6 takut sama angka 7?\n\nKarena 7 8 9 (seven ate nine)! 😂\n\nOke garing, tapi setidaknya kamu inget urutan angka kan? 😄`,
      `Matematika itu kayak relationship — kalo gak diselesain, jadi makin rumit. 💔📐`,
      `Apa bedanya matek sama pacar?\n\nMatek punya jawaban pasti.\n\nPacar... ya udahlah. 😆`,
    ],
    'bahasa inggris': [
      `Why did the English teacher eat his homework?\n\nBecause his teacher said it was a piece of cake! 🍰😄`,
      `Pasti kamu pernah belajar Inggris terus jadi bingung sendiri.\n\n"Read" present tense: read (rid)\n"Read" past tense: read (red)\n\nTulisan sama, baca beda. English logic moment. 😅`,
    ],
    fisika: [
      `Kenapa elektron selalu sedih? Karena dia selalu negatif! ⚡😢`,
      `Newton, Einstein, dan Curie main petak umpet.\n\nEinstein jadi yang nyari. Curie ngumpet di pohon.\nPas Einstein cari Newton, dia liat Newton berdiri di tengah lapangan.\n\n"Newton, you're so easy to find!"\n"No, I'm not Newton. I'm Newton per meter squared. I'm a Pascal!" 🤓`,
    ],
    kimia: [
      `Kenapa hidrogen suka selingkuh?\n\nKarena dia suka bonding sama atom lain! 😂`,
      `Anion: "Aku negatif."\nKation: "Aku positif."\n\nMereka bertemu, tarik-menarik, jadi pasangan stabil. Yes that's chemistry baby! 💖`,
    ],
    biologi: [
      `Sel: "Aku bagi diri yaa."\nSel lainnya: "Mitosis aja!"\n\nDan begitulah keluarga selnya makin banyak. 🧬😄`,
      `Kenapa DNA sering meeting?\n\nKarena mereka punya banyak proyek replikasi! 🧬💼`,
    ],
    informatika: [
      `Programmer mati. Di akhirat ditanya: "Kenapa kamu di sini?"\n\nDia jawab: "Stack overflow." 💀💻`,
      `99 little bugs in the code,\n99 little bugs.\nTake one down, patch it around,\n127 little bugs in the code. 🐛😭`,
      `Q: How do you tell an introverted programmer from an extroverted one?\n\nA: An extroverted programmer looks at YOUR shoes when talking. 😄`,
    ],
  };

  const mapelKey = Object.keys(jokes).find((k) => mapel.includes(k));
  const selectedJokes = mapelKey ? jokes[mapelKey] : [
    `Murid: "Pak/Bu, kenapa sih kita harus belajar ini?"\n\nGuru: "Biar kalo nanti ditanya anakmu, kamu gak bingung." 😄\n\nValid sih. 🤣`,
    `${name}, mau jokes garing?\n\nKenapa siswa SMA suka makan ramen?\n\nKarena hidupnya juga rebus-rebus aja. 🍜😅\n\n*tepuk tangan untuk effort* 👏`,
    `Belajar itu kayak gym.\nGym body — abs.\nBelajar — IQ.\n\nTapi tetep makan jangan lupa, biar nutrisi otak terjaga! 🧠💪`,
  ];

  return {
    text: pick(selectedJokes) + '\n\n' + pick([
      'Oke balik ke materi, sob 😄',
      'Now back to learning! 📚',
      'Sip, lanjut belajar yuk!',
    ]),
    intent: 'joke',
    suggestions: pickN([
      'Lanjut belajar',
      'Joke lagi dong',
      'Jelasin materi',
      'Kasih soal',
    ], 3),
  };
}

function generateCompliment(ctx: TutorContext): TutorResponse {
  const name = getUserNameTreatment(ctx.user);
  const responses = [
    `Hehe ${pick(['makasih', 'thank you', 'terima kasih'])}! ${pick(['🥹', '☺️', '🤖', '😊'])} ${pick([
      'Tapi yang pinter sebenernya KAMU yang mau belajar. Aku cuma alat bantu.',
      'Aku cuma robot yang dibikin tim SANDEQ. Kamu yang luar biasa karena mau usaha!',
      'Aku flattered tapi yang sebenernya keren itu kamu — yang punya growth mindset.',
    ])} ${pick(['🌟', '💪', '✨'])}`,
    `${pick(['Aw', 'Wah', 'Hehe'])} ${name}! ${pick(['Makasih ya 🥺', 'Senengnya 🫶', 'Aku terharu 🥹'])} ${pick([
      'Yuk lanjut belajar, biar kamu makin pinter!',
      'Tapi pinter beneran tuh kamu yang mau effort.',
      'Kompliman ditampung, tapi quiz tetap dikerjakan ya. 😄',
    ])}`,
  ];
  return {
    text: pick(responses),
    intent: 'compliment',
    suggestions: pickN([
      'Lanjut bahas materi',
      'Kasih soal lagi',
      'Tips belajar?',
    ], 3),
  };
}

function generateDefinition(ctx: TutorContext): TutorResponse {
  const judul = ctx.materi?.judul || 'materi ini';
  const headings = getHeadings(ctx.blocks);
  const paragraphs = getParagraphs(ctx.blocks);
  const keyTerms = extractKeyTerms(ctx.blocks);
  const opener = buildOpening(ctx.user, 'thoughtful');

  let text = `${opener} ${pick(['ini definisi yang ada di materi', 'aku rangkumin dari materi'])} **${judul}**:\n\n`;

  if (paragraphs.length > 0) {
    const para = paragraphs[0].replace(/\*\*/g, '**').substring(0, 400);
    text += `${para}${para.length >= 400 ? '...' : ''}\n\n`;
  }

  if (keyTerms.length > 0) {
    text += `**🎯 Istilah penting:**\n`;
    keyTerms.slice(0, 5).forEach((term) => {
      text += `• **${term}**\n`;
    });
    text += `\n`;
  }

  if (headings.length > 0) {
    text += `**📚 Topik yang dibahas:**\n`;
    headings.slice(0, 5).forEach((h, i) => {
      text += `${i + 1}. ${h}\n`;
    });
    text += `\n`;
  }

  text += buildClosing('definition');

  return {
    text,
    intent: 'definition',
    suggestions: pickN([
      'Sederhanakan lagi',
      'Kasih contoh',
      'Buatkan soal',
      'Hubungannya dengan kehidupan?',
    ], 3),
  };
}

function generateStepByStep(ctx: TutorContext): TutorResponse {
  const judul = ctx.materi?.judul || 'materi ini';
  const headings = getHeadings(ctx.blocks);
  const opener = buildOpening(ctx.user, 'enthusiastic');

  let text = `${opener} aku ${pick(['pecah', 'breakdown', 'urai'])} **${judul}** jadi langkah-langkah ya 📋\n\n`;

  if (headings.length > 0) {
    text += `**Roadmap belajarmu:**\n\n`;
    headings.forEach((h, i) => {
      const emoji = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'][i] || '🔹';
      text += `${emoji} **${h}**\n`;
    });
    text += `\n`;
  } else {
    text += `${pick([
      'Coba scroll dari atas, perhatikan setiap heading.',
      'Setiap heading di materi adalah satu step.',
      'Pelan-pelan baca dari awal, satu per satu.',
    ])}\n\n`;
  }

  text += `**${pick(['💡 Pro tip', '🎯 Strategi', '⚡ Hack'])}:** ${pick([
    'Pahami satu langkah dulu sebelum lanjut. Jangan rush!',
    'Kalo step 1 belum paham, jangan paksa ke step 2.',
    'Reward diri sendiri tiap step yang selesai!',
    'Bagi waktu: 1 step = 1 sesi belajar.',
  ])}\n\n`;

  text += buildClosing('step_by_step');

  return {
    text,
    intent: 'step_by_step',
    suggestions: pickN([
      'Step pertama dulu',
      'Kasih contoh per step',
      'Soal latihan',
      'Tips menghafal urutan?',
    ], 3),
  };
}

function generateStudyTips(ctx: TutorContext): TutorResponse {
  const mapel = getMapelData(ctx.materi?.mapel);
  const judul = ctx.materi?.judul || 'materi ini';
  const opener = buildOpening(ctx.user, 'enthusiastic');

  let text = `${opener} ${pick(['mau aku kasih tips belajar', 'aku share tips ya', 'oke sini tips ampuh'])} ${mapel.nick} ${pick(['🎯', '⚡', '💡', '🧠'])}\n\n`;

  // Mapel-specific tips
  if (mapel.tips && mapel.tips.length > 0) {
    text += `**${pick(['💎 Tips khusus', '⚡ Strategi efektif', '🎯 Cara cerdas'])}:**\n\n`;
    pickN<string>(mapel.tips as string[], 3).forEach((tip: string, i: number) => {
      text += `${i + 1}. ${tip}\n`;
    });
    text += `\n`;
  }

  // General tips
  text += `**${pick(['🧠 Universal hacks:', '⭐ Tips general:', '🌟 Yang selalu work:'])}**\n\n`;
  const generalTips = [
    'Pomodoro: 25 menit fokus + 5 menit istirahat',
    'Active recall: tutup buku, recall apa yang kamu inget',
    'Spaced repetition: ulang 1 hari, 3 hari, 7 hari, 30 hari',
    'Feynman technique: jelasin materi ke "anak SD imajiner"',
    'Bikin mind map, bukan cuma catatan linear',
    'Belajar 30 menit > marathon 3 jam',
    'Tidur cukup, otak butuh konsolidasi memori',
    'Olahraga ringan = boost konsentrasi',
  ];
  pickN(generalTips, 3).forEach((tip) => {
    text += `• ${tip}\n`;
  });
  text += `\n`;

  if (maybe(0.5)) {
    text += `**🏝️ Local wisdom:** ${pick([
      'Banyak alumni SMAN 6 Pangkep yang sukses karena disiplin belajar.',
      'Anak Bugis-Makassar terkenal kerja keras — itu kelebihanmu, manfaatkan!',
      'Konsistensi 1 jam/hari > maraton seminggu sebelum ujian.',
    ])}\n\n`;
  }

  text += buildClosing('study_tips');

  return {
    text,
    intent: 'study_tips',
    suggestions: pickN([
      'Tips lain dong',
      'Tips menghafal cepat',
      'Cara fokus belajar',
      'Atasi malas belajar',
    ], 3),
  };
}

function generateUnknown(ctx: TutorContext, message: string): TutorResponse {
  const name = getUserNameTreatment(ctx.user);
  const judul = ctx.materi?.judul || 'materi ini';

  const responses = [
    `Hmm, ${name}, aku ${pick(['belum sepenuhnya nangkep', 'agak bingung', 'kurang ngerti'])} maksudmu 🤔\n\nTapi tenang! Aku bisa bantuin kamu untuk:\n\n📖 Jelasin **${judul}** dengan bahasa sederhana\n💡 Kasih contoh konkret\n✏️ Buatkan soal latihan\n🌍 Aplikasi di kehidupan sehari-hari\n💪 Motivasi kalo lagi down\n\nCoba ${pick(['pilih dari opsi di bawah', 'klik salah satu suggestion', 'tanya dengan kata yang lebih spesifik'])} ya!`,
    `Maaf ${name}, aku ${pick(['belum bisa jawab itu', 'masih learning', 'kurang paham pertanyaannya'])} 😅\n\nAku khusus dirancang untuk bantuin kamu paham materi **${judul}**. ${pick([
      'Coba tanya tentang materi ini ya?',
      'Mungkin aku lebih jago bantu yang berkaitan dengan materi.',
      'Pertanyaan tentang materi sini aku ahli!',
    ])}`,
    `Hmm 🤖💭 Aku ${pick(['gak yakin', 'agak ragu', 'belum certain'])} dengan pertanyaan kamu.\n\n${pick([
      'Kalo pertanyaan umum, mungkin lebih cocok tanya gurumu.',
      'Kalo tentang materi sini, aku siap bantu!',
      'Coba reformulasi pertanyaannya, mungkin aku ngerti.',
    ])}\n\nAtau ${pick([
      'pilih suggestion di bawah aja',
      'klik tombol di bawah',
      'mulai dari topik yang mau dibahas',
    ])}.`,
  ];

  return {
    text: pick(responses),
    intent: 'unknown',
    suggestions: pickN([
      'Jelaskan ulang sederhana',
      'Kasih contoh',
      'Buatkan soal',
      'Aplikasi di kehidupan',
      'Tips belajar',
    ], 4),
  };
}

function generateCheckAnswer(ctx: TutorContext): TutorResponse {
  const opener = buildOpening(ctx.user, 'casual');
  const responses = [
    `${opener} ${pick([
      'untuk cek jawaban quiz, scroll ke atas materi.',
      'klik tombol "Submit Jawaban" di mini quiz.',
      'aku gak bisa langsung lihat jawabanmu.',
    ])}\n\n${pick([
      'Tapi kalo ada konsep yang masih ngeganjel, tanya aku!',
      'Kalo butuh hint, kasih tau aku konsep yang bingung ya.',
      'Mau aku jelasin materi sebelum kamu submit? Sini aku bantu.',
    ])}`,
    `Sip, ${pick([
      'tinggal scroll & klik submit di quiz nya.',
      'mini quiz di atas tinggal di-submit aja.',
    ])}\n\n${pick([
      '💡 Tips: jangan tebak. Pikir baik-baik dulu.',
      '⚡ Pro tip: kalo ragu, eliminasi pilihan yang jelas salah dulu.',
      '🎯 Reminder: 1 quiz benar > 10 quiz tebakan.',
    ])}`,
  ];
  return {
    text: pick(responses),
    intent: 'check_answer',
    suggestions: pickN([
      'Tips menjawab quiz',
      'Jelaskan konsep dulu',
      'Kasih hint',
      'Aku bingung',
    ], 3),
  };
}

// ============================================================
// LAYER 6: MAIN ENTRY
// ============================================================
export function generateTutorResponse(message: string, context: TutorContext): TutorResponse {
  const intent = classifyIntent(message);

  switch (intent) {
    case 'greeting': return generateGreeting(context);
    case 'simplify': return generateSimplify(context);
    case 'help_understanding': return generateSimplify(context);
    case 'example_request': return generateExample(context);
    case 'exercise_request': return generateExercise(context);
    case 'realworld_application': return generateRealWorld(context);
    case 'motivation': return generateMotivation(context);
    case 'thanks': return generateThanks(context);
    case 'about_tutor': return generateAboutTutor(context);
    case 'joke': return generateJoke(context);
    case 'compliment': return generateCompliment(context);
    case 'definition': return generateDefinition(context);
    case 'step_by_step': return generateStepByStep(context);
    case 'comparison': return generateStepByStep(context);
    case 'study_tips': return generateStudyTips(context);
    case 'check_answer': return generateCheckAnswer(context);
    default: return generateUnknown(context, message);
  }
}

// ============================================================
// LAYER 7: STARTER MESSAGES (variasi tinggi)
// ============================================================
export function getStarterMessages(materi: any): string[] {
  const all = [
    '👋 Halo, saya butuh bantuan',
    '📖 Jelaskan ulang dengan bahasa sederhana',
    '💡 Kasih contoh konkret',
    '✏️ Buatkan saya soal latihan',
    '🌍 Apa hubungannya dengan kehidupan sehari-hari?',
    '🎯 Tips belajar materi ini?',
    '💪 Saya bingung total',
    '🧠 Bantu pahamin step by step',
    '🌟 Apa kegunaannya buat masa depan saya?',
    '⚡ Trik cepat hafal materi ini?',
  ];
  return pickN(all, 6);
}
