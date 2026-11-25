export const CATEGORIES = {
  fis: {
    key: 'fis',
    label: 'Fisika',
    color: '#0284C7',
    gradient: 'linear-gradient(135deg, #0284C7, #0EA5E9)',
    description: 'Gaya, gerak, listrik, gelombang, dan elektromagnetik.',
  },
  kim: {
    key: 'kim',
    label: 'Kimia',
    color: '#0D9488',
    gradient: 'linear-gradient(135deg, #0284C7, #10B981)',
    description: 'Struktur atom, pH asam-basa, wujud zat, dan reaksi kimia.',
  },
  bio: {
    key: 'bio',
    label: 'Biologi',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #059669, #34D399)',
    description: 'Fotosintesis, struktur sel, genetika dasar, dan ekosistem.',
  },
  ast: {
    key: 'ast',
    label: 'Astronomi',
    color: '#D97706',
    gradient: 'linear-gradient(135deg, #F59E0B, #F97316)',
    description: 'Dinamika tata surya, fase bulan, fusi bintang, dan kosmologi.',
  },
};

export const AVATAR_OPTIONS = {
  suitColor: [
    { key: 'electric', label: 'Biru Elektrik', primary: '#0284C7', secondary: '#38BDF8', accent: '#F59E0B' },
    { key: 'emerald', label: 'Hijau Mint', primary: '#047857', secondary: '#34D399', accent: '#FBBF24' },
    { key: 'cyan', label: 'Biru Sian', primary: '#0369A1', secondary: '#22D3EE', accent: '#10B981' },
    { key: 'sunset', label: 'Oranye Emas', primary: '#EA580C', secondary: '#FBBF24', accent: '#0284C7' },
  ],
  hairStyle: [
    { key: 'wave', label: 'Gelombang' },
    { key: 'spiky', label: 'Spiky Eksplorer' },
    { key: 'bob', label: 'Klasik Rapi' },
    { key: 'helmet', label: 'Helm Astro' },
  ],
  visor: [
    { key: 'round', label: 'Kacamata Bulat' },
    { key: 'cyber', label: 'Visor Lab' },
    { key: 'none', label: 'Tanpa Kacamata' },
  ],
  accessory: [
    { key: 'atom', label: 'Pin Atom' },
    { key: 'planet', label: 'Bola Planet' },
    { key: 'flask', label: 'Labu Kimia' },
    { key: 'rocket', label: 'Lencana Roket' },
  ],
  skinTone: [
    { key: 'warm', label: 'Sawo Cerah', color: '#E8B89A', shade: '#C99374' },
    { key: 'tan', label: 'Sawo Matang', color: '#C68B66', shade: '#A16847' },
    { key: 'light', label: 'Kuning Langsat', color: '#F3CBB2', shade: '#D6A78C' },
    { key: 'deep', label: 'Cokelat Hangat', color: '#8D583B', shade: '#6A3F27' },
  ],
};

export const DEFAULT_AVATAR = {
  suitColor: 'electric',
  hairStyle: 'wave',
  visor: 'round',
  accessory: 'atom',
  skinTone: 'warm',
};

function createModuleDiagram(id, accent) {
  const scenes = {
    1: `
      <line x1="48" y1="26" x2="48" y2="150" stroke="#64748B" stroke-opacity="0.55" stroke-dasharray="4 4"/>
      <text x="58" y="36" fill="#334155" font-size="10" font-family="monospace">h = 100 m</text>
      <circle cx="160" cy="48" r="18" fill="${accent}" fill-opacity="0.18" stroke="${accent}" stroke-width="2.5"/>
      <circle cx="160" cy="48" r="7" fill="${accent}"/>
      <line x1="160" y1="68" x2="160" y2="112" stroke="#EA580C" stroke-width="3"/>
      <polygon points="160,122 154,110 166,110" fill="#EA580C"/>
      <text x="174" y="96" fill="#C2410C" font-size="11" font-weight="700" font-family="monospace">W = m·g</text>
      <path d="M60 144 Q160 128 260 144" fill="none" stroke="${accent}" stroke-width="2.4" stroke-opacity="0.85"/>
      <text x="206" y="160" fill="#1E293B" font-size="10" font-family="monospace">g = 9,8 m/s²</text>
    `,
    2: `
      <rect x="64" y="42" width="192" height="92" rx="12" fill="none" stroke="${accent}" stroke-width="2.5" stroke-opacity="0.9"/>
      <line x1="48" y1="74" x2="48" y2="102" stroke="#D97706" stroke-width="3.5"/>
      <line x1="56" y1="81" x2="56" y2="95" stroke="#D97706" stroke-width="2.4"/>
      <rect x="132" y="32" width="56" height="20" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.8"/>
      <text x="160" y="46" text-anchor="middle" fill="#1E293B" font-size="10" font-weight="700" font-family="monospace">R₁</text>
      <circle cx="256" cy="88" r="18" fill="#FEF3C7" stroke="#D97706" stroke-width="2.4"/>
      <path d="M250 88 L256 80 L262 88" fill="none" stroke="#B45309" stroke-width="2.2"/>
      <text x="160" y="156" text-anchor="middle" fill="#0369A1" font-size="11" font-weight="700" font-family="monospace">V = I × R</text>
    `,
    3: `
      <circle cx="64" cy="88" r="12" fill="${accent}"/>
      <path d="M88 64 A34 34 0 0 1 88 112" fill="none" stroke="${accent}" stroke-width="2.4"/>
      <path d="M108 48 A56 56 0 0 1 108 128" fill="none" stroke="${accent}" stroke-width="2.2" stroke-opacity="0.8"/>
      <path d="M130 34 A76 76 0 0 1 130 142" fill="none" stroke="${accent}" stroke-width="2" stroke-opacity="0.5"/>
      <path d="M164 88 Q182 54 200 88 T236 88 T272 88" fill="none" stroke="#059669" stroke-width="2.8"/>
      <text x="218" y="152" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">v = λ · f (Hz)</text>
    `,
    4: `
      <ellipse cx="160" cy="88" rx="74" ry="26" transform="rotate(28 160 88)" fill="none" stroke="#0284C7" stroke-width="2" stroke-opacity="0.78"/>
      <ellipse cx="160" cy="88" rx="74" ry="26" transform="rotate(-28 160 88)" fill="none" stroke="#059669" stroke-width="2" stroke-opacity="0.78"/>
      <ellipse cx="160" cy="88" rx="74" ry="26" transform="rotate(90 160 88)" fill="none" stroke="#0EA5E9" stroke-width="1.8" stroke-opacity="0.55"/>
      <circle cx="155" cy="85" r="10" fill="#F59E0B"/>
      <circle cx="166" cy="91" r="10" fill="#64748B"/>
      <circle cx="160" cy="79" r="8" fill="#EA580C"/>
      <circle cx="222" cy="54" r="5" fill="#0284C7"/>
      <circle cx="98" cy="122" r="5" fill="#059669"/>
      <text x="160" y="160" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">p⁺ + n⁰ | e⁻</text>
    `,
    5: `
      <defs>
        <linearGradient id="phGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#EA580C"/>
          <stop offset="50%" stop-color="#10B981"/>
          <stop offset="100%" stop-color="#0284C7"/>
        </linearGradient>
      </defs>
      <rect x="44" y="74" width="232" height="16" rx="8" fill="url(#phGrad)"/>
      <line x1="160" y1="60" x2="160" y2="104" stroke="#1E293B" stroke-width="2.4"/>
      <text x="52" y="116" fill="#C2410C" font-size="10" font-weight="700" font-family="monospace">pH 0 (Asam)</text>
      <text x="160" y="52" text-anchor="middle" fill="#1E293B" font-size="10" font-weight="700" font-family="monospace">pH 7 Netral</text>
      <text x="268" y="116" text-anchor="end" fill="#0369A1" font-size="10" font-weight="700" font-family="monospace">pH 14 (Basa)</text>
    `,
    6: `
      <rect x="48" y="64" width="48" height="48" rx="10" fill="#0284C7" fill-opacity="0.16" stroke="#0284C7" stroke-width="2"/>
      <text x="72" y="130" text-anchor="middle" fill="#1E293B" font-size="10" font-weight="600">Padat</text>
      <path d="M104 88 L128 88" stroke="#64748B" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M136 86 Q160 72 184 86 L184 112 L136 112 Z" fill="#10B981" fill-opacity="0.22" stroke="#059669" stroke-width="2"/>
      <text x="160" y="130" text-anchor="middle" fill="#1E293B" font-size="10" font-weight="600">Cair</text>
      <path d="M192 88 L216 88" stroke="#64748B" stroke-width="2" stroke-dasharray="3 3"/>
      <circle cx="236" cy="70" r="6" fill="#F59E0B"/>
      <circle cx="256" cy="84" r="7" fill="#0284C7"/>
      <circle cx="242" cy="100" r="5" fill="#10B981"/>
      <text x="248" y="130" text-anchor="middle" fill="#1E293B" font-size="10" font-weight="600">Gas</text>
    `,
    7: `
      <circle cx="72" cy="48" r="20" fill="#FEF3C7" stroke="#F59E0B" stroke-width="2.4"/>
      <line x1="94" y1="62" x2="128" y2="82" stroke="#D97706" stroke-width="2" stroke-dasharray="4 3"/>
      <ellipse cx="176" cy="96" rx="58" ry="30" fill="#D1FAE5" stroke="#059669" stroke-width="2.4"/>
      <line x1="126" y1="96" x2="226" y2="96" stroke="#047857" stroke-width="1.6"/>
      <text x="176" y="152" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">CO₂ + H₂O → C₆H₁₂O₆ + O₂</text>
    `,
    8: `
      <path d="M72 88 C72 44 134 32 186 38 C238 44 252 68 248 98 C244 130 202 146 148 142 C96 138 72 118 72 88Z" fill="#D1FAE5" stroke="#059669" stroke-width="2.4"/>
      <circle cx="154" cy="88" r="24" fill="#E0F2FE" stroke="#0284C7" stroke-width="2.4"/>
      <circle cx="154" cy="88" r="9" fill="#0284C7"/>
      <ellipse cx="206" cy="76" rx="14" ry="7" transform="rotate(20 206 76)" fill="#FEF3C7" stroke="#D97706" stroke-width="1.8"/>
      <text x="154" y="158" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">Membran · Sitoplasma · Nukleus</text>
    `,
    9: `
      <rect x="42" y="68" width="58" height="36" rx="10" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
      <text x="71" y="90" text-anchor="middle" fill="#065F46" font-size="10" font-weight="700">Produsen</text>
      <line x1="104" y1="86" x2="126" y2="86" stroke="#64748B" stroke-width="2"/>
      <rect x="130" y="68" width="60" height="36" rx="10" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>
      <text x="160" y="90" text-anchor="middle" fill="#0369A1" font-size="10" font-weight="700">Konsumen</text>
      <line x1="194" y1="86" x2="216" y2="86" stroke="#64748B" stroke-width="2"/>
      <rect x="220" y="68" width="60" height="36" rx="10" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
      <text x="250" y="90" text-anchor="middle" fill="#92400E" font-size="10" font-weight="700">Pengurai</text>
      <text x="160" y="140" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">Aliran Energi 10%</text>
    `,
    10: `
      <ellipse cx="160" cy="88" rx="116" ry="42" fill="none" stroke="#64748B" stroke-opacity="0.45" stroke-width="1.4"/>
      <ellipse cx="160" cy="88" rx="80" ry="29" fill="none" stroke="#0284C7" stroke-opacity="0.5" stroke-width="1.4"/>
      <ellipse cx="160" cy="88" rx="46" ry="17" fill="none" stroke="#059669" stroke-opacity="0.6" stroke-width="1.4"/>
      <circle cx="160" cy="88" r="15" fill="#F59E0B"/>
      <circle cx="204" cy="82" r="5" fill="#64748B"/>
      <circle cx="236" cy="98" r="7" fill="#0284C7"/>
      <circle cx="72" cy="64" r="9" fill="#10B981"/>
      <text x="160" y="156" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">Hukum Kepler: T² ∝ a³</text>
    `,
    11: `
      <circle cx="72" cy="88" r="18" fill="#1E293B" stroke="#475569" stroke-width="1.8"/>
      <path d="M128 70 A18 18 0 0 1 128 106 A10 18 0 0 0 128 70Z" fill="#FBBF24"/>
      <circle cx="128" cy="88" r="18" fill="none" stroke="#475569" stroke-width="1.6"/>
      <path d="M188 70 A18 18 0 0 1 188 106 L188 70Z" fill="#FBBF24"/>
      <circle cx="188" cy="88" r="18" fill="none" stroke="#475569" stroke-width="1.6"/>
      <circle cx="248" cy="88" r="18" fill="#FBBF24" stroke="#D97706" stroke-width="1.6"/>
      <text x="160" y="142" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">Baru · Sabit · Perbani · Purnama</text>
    `,
    12: `
      <circle cx="160" cy="84" r="36" fill="#FEF3C7"/>
      <circle cx="160" cy="84" r="24" fill="#FBBF24" stroke="#EA580C" stroke-width="2.4"/>
      <circle cx="160" cy="84" r="12" fill="#FFFBEB"/>
      <circle cx="64" cy="44" r="3" fill="#0284C7"/>
      <circle cx="256" cy="50" r="3" fill="#059669"/>
      <circle cx="242" cy="126" r="2.6" fill="#0284C7"/>
      <text x="160" y="152" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">Reaksi Fusi: 4H → He + Energi</text>
    `,
    13: `
      <path d="M56 136 Q155 24 264 136" fill="none" stroke="${accent}" stroke-width="2.8" stroke-dasharray="6 4"/>
      <circle cx="122" cy="70" r="8" fill="#F59E0B"/>
      <line x1="122" y1="70" x2="162" y2="54" stroke="#059669" stroke-width="2.4"/>
      <line x1="122" y1="70" x2="162" y2="70" stroke="#64748B" stroke-width="1.6" stroke-dasharray="2 2"/>
      <text x="166" y="54" fill="#047857" font-size="10" font-weight="700" font-family="monospace">v₀</text>
      <text x="160" y="156" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">R = v₀² sin(2θ) / g</text>
    `,
    14: `
      <rect x="70" y="52" width="52" height="52" rx="12" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>
      <text x="96" y="82" text-anchor="middle" fill="#0369A1" font-size="12" font-weight="700" font-family="monospace">Na⁺</text>
      <line x1="130" y1="78" x2="190" y2="78" stroke="#059669" stroke-width="2.5"/>
      <rect x="198" y="52" width="52" height="52" rx="12" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
      <text x="224" y="82" text-anchor="middle" fill="#047857" font-size="12" font-weight="700" font-family="monospace">Cl⁻</text>
      <text x="160" y="142" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">n = m / Mr · M = n / V</text>
    `,
    15: `
      <rect x="46" y="64" width="64" height="40" rx="10" fill="#D1FAE5" stroke="#059669" stroke-width="2"/>
      <text x="78" y="88" text-anchor="middle" fill="#065F46" font-size="10" font-weight="700">Glikolisis</text>
      <line x1="114" y1="84" x2="132" y2="84" stroke="#64748B" stroke-width="2"/>
      <circle cx="164" cy="84" r="24" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>
      <text x="164" y="88" text-anchor="middle" fill="#0369A1" font-size="10" font-weight="700">Krebs</text>
      <line x1="192" y1="84" x2="210" y2="84" stroke="#64748B" stroke-width="2"/>
      <rect x="214" y="64" width="64" height="40" rx="10" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
      <text x="246" y="88" text-anchor="middle" fill="#92400E" font-size="10" font-weight="700">38 ATP</text>
      <text x="160" y="142" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">C₆H₁₂O₆ + 6O₂ → Energi ATP</text>
    `,
    16: `
      <circle cx="104" cy="86" r="22" fill="#E0F2FE" stroke="#0284C7" stroke-width="2.2"/>
      <circle cx="216" cy="86" r="28" fill="#FEF3C7" stroke="#EA580C" stroke-width="2.2"/>
      <path d="M128 86 L184 86" stroke="#059669" stroke-width="2.2" stroke-dasharray="4 3"/>
      <text x="160" y="148" text-anchor="middle" fill="#1E293B" font-size="10" font-family="monospace">Diagram H-R · Spektrum Bintang</text>
    `,
  };

  return `<svg viewBox="0 0 320 176" class="diagram-svg" role="img" aria-hidden="true">
    <defs>
      <linearGradient id="diag-bg-${id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#F8FAFC"/>
        <stop offset="100%" stop-color="#EBF5FF"/>
      </linearGradient>
    </defs>
    <rect width="320" height="176" fill="url(#diag-bg-${id})"/>
    <g opacity="0.16" stroke="#0284C7" stroke-width="0.6">
      <line x1="0" y1="44" x2="320" y2="44"/>
      <line x1="0" y1="88" x2="320" y2="88"/>
      <line x1="0" y1="132" x2="320" y2="132"/>
      <line x1="80" y1="0" x2="80" y2="176"/>
      <line x1="160" y1="0" x2="160" y2="176"/>
      <line x1="240" y1="0" x2="240" y2="176"/>
    </g>
    ${scenes[id] || ''}
  </svg>`;
}

export const MATERIALS = [
  {
    id: 1,
    title: 'Gaya Gravitasi',
    category: 'fis',
    gradeBand: 'SMP',
    subtitle: 'Mengapa benda jatuh?',
    content:
      'Gravitasi adalah gaya tarik antar benda bermassa. Berat = massa × g (g Bumi ≈ 9,8 m/s²). Di Bulan g ≈ 1,6 m/s²: berat lebih kecil, tetapi massa tetap.',
    keyFormula: 'W = m × g',
    keyPoints: [
      'Massa benda selalu tetap di mana pun berada (kg).',
      'Berat dipengaruhi percepatan gravitasi lokal (Newton).',
      'Benda jatuh bebas mengalami percepatan konstan tanpa hambatan udara.',
    ],
    videoSteps: [
      { title: '1. Gaya Tarik Massa', caption: 'Bumi menarik semua benda bermassa menuju pusatnya dengan percepatan g ≈ 9,8 m/s².' },
      { title: '2. Jatuh Bebas', caption: 'Kecepatan benda bertambah linear tiap detik (v = g × t) tidak bergantung pada massanya.' },
      { title: '3. Perbandingan Planet', caption: 'Di Bulan percepatan hanya 1/6 Bumi, sehingga waktu jatuh jauh lebih lambat.' },
    ],
    level: 'SMP · Kelas 7–8',
    readTime: '2 mnt',
    simLink: 'g',
  },
  {
    id: 2,
    title: 'Rangkaian Listrik',
    category: 'fis',
    gradeBand: 'SMP',
    subtitle: 'Seri, paralel, dan Hukum Ohm',
    content:
      'Hukum Ohm: V = I × R. Pada rangkaian seri hambatan dijumlahkan dan arus sama. Pada paralel tegangan sama dan hambatan total lebih kecil.',
    keyFormula: 'V = I × R',
    keyPoints: [
      'Pada rangkaian seri, arus listrik (I) sama di semua titik.',
      'Pada rangkaian paralel, tegangan (V) sama di setiap cabang.',
      'Jika satu beban seri putus, seluruh jalur arus terputus.',
    ],
    videoSteps: [
      { title: '1. Sumber Tegangan & Arus', caption: 'Baterai menciptakan beda potensial V yang mendorong muatan mengalir melalui penghantar.' },
      { title: '2. Rangkaian Seri', caption: 'Hambatan total R_tot = R1 + R2 membagi tegangan dan menurunkan arus.' },
      { title: '3. Rangkaian Paralel', caption: 'Cabang paralel menyediakan dua jalur arus sehingga nyala lampu tetap terang.' },
    ],
    level: 'SMP · Kelas 9',
    readTime: '3 mnt',
    simLink: 'c',
  },
  {
    id: 3,
    title: 'Gelombang Bunyi',
    category: 'fis',
    gradeBand: 'SMP',
    subtitle: 'Frekuensi dan medium rambat',
    content:
      'Bunyi adalah gelombang longitudinal yang merambat lewat medium (udara, air, padat). Cepat rambat bunyi memenuhi v = λ × f.',
    keyFormula: 'v = λ × f',
    keyPoints: [
      'Bunyi tidak merambat di ruang hampa karena tidak ada partikel perantara.',
      'Tinggi rendah nada ditentukan oleh frekuensi getaran (Hz).',
      'Cepat rambat bunyi paling besar pada medium padat.',
    ],
    videoSteps: [
      { title: '1. Sumber Getaran', caption: 'Benda bergetar menekan dan meregangkan molekul udara di sekitarnya.' },
      { title: '2. Rapatan & Regangan', caption: 'Gelombang longitudinal merambat searah dengan arah getaran partikel.' },
      { title: '3. Frekuensi & Resonansi', caption: 'Telinga manusia mendengar frekuensi antara 20 Hz hingga 20.000 Hz.' },
    ],
    level: 'SMP · Kelas 8',
    readTime: '2 mnt',
    simLink: null,
  },
  {
    id: 4,
    title: 'Atom dan Unsur',
    category: 'kim',
    gradeBand: 'SMP',
    subtitle: 'Partikel penyusun materi',
    content:
      'Atom tersusun atas proton (+) dan neutron (netral) di inti, serta elektron (−) yang mengelilingi inti. Molekul air tersusun dari H₂O.',
    keyFormula: 'H₂O = 2H + 1O',
    keyPoints: [
      'Inti atom (nukleus) menyimpan proton bermuatan positif dan neutron netral.',
      'Elektron bergerak pada kulit energi mengelilingi inti atom.',
      'Dua atau lebih atom berikatan membentuk molekul stabil.',
    ],
    videoSteps: [
      { title: '1. Inti Atom Padat', caption: 'Proton dan neutron berkumpul di pusat atom yang sangat kecil namun padat.' },
      { title: '2. Awan Elektron', caption: 'Elektron bermuatan negatif mengorbit inti pada tingkat energi tertentu.' },
      { title: '3. Pembentukan Molekul', caption: 'Atom hidrogen dan oksigen berbagi elektron membentuk molekul air H₂O.' },
    ],
    level: 'SMP · Kelas 7',
    readTime: '2 mnt',
    simLink: null,
  },
  {
    id: 5,
    title: 'Asam dan Basa',
    category: 'kim',
    gradeBand: 'SMP',
    subtitle: 'Skala pH dan indikator',
    content:
      'Skala pH berkisar dari 0–14. Larutan asam (pH < 7) membirukan atau memerahkan indikator lakmus biru, sedangkan basa (pH > 7) membirukan lakmus merah.',
    keyFormula: '0 ≤ pH ≤ 14',
    keyPoints: [
      'Larutan asam (pH < 7) mengubah kertas lakmus biru menjadi merah.',
      'Air murni bersuhu ruang berada pada titik netral pH = 7.',
      'Reaksi netralisasi asam + basa menghasilkan garam dan air.',
    ],
    videoSteps: [
      { title: '1. Ion Hidrogen (H⁺)', caption: 'Semakin tinggi konsentrasi ion H⁺, semakin rendah angka pH (semakin asam).' },
      { title: '2. Titik Netral pH 7', caption: 'Keseimbangan ion H⁺ dan OH⁻ menghasilkan sifat netral seperti air murni.' },
      { title: '3. Uji Kertas Lakmus', caption: 'Lakmus biru berubah merah pada asam; lakmus merah berubah biru pada basa.' },
    ],
    level: 'SMP · Kelas 7–8',
    readTime: '2 mnt',
    simLink: null,
  },
  {
    id: 6,
    title: 'Wujud Zat & Kalor',
    category: 'kim',
    gradeBand: 'SMP',
    subtitle: 'Padat, cair, dan gas',
    content:
      'Es mencair pada 0 °C dan air mendidih pada 100 °C (1 atm). Perubahan wujud merupakan perubahan fisika karena susunan kimia zat tetap.',
    keyFormula: 'Q = m · c · ΔT',
    keyPoints: [
      'Partikel zat padat tersusun rapat dan bergetar di tempat.',
      'Mencair dan menguap membutuhkan penyerapan energi kalor.',
      'Membeku dan mengembun melepaskan energi kalor ke lingkungan.',
    ],
    videoSteps: [
      { title: '1. Kisi Zat Padat', caption: 'Ikatan antar partikel kuat menjaga bentuk dan volume zat padat tetap.' },
      { title: '2. Transisi Cair', caption: 'Penyerapan kalor membuat partikel bergerak bebas namun tetap berdekatan.' },
      { title: '3. Ekspansi Gas', caption: 'Energi kinetik tinggi membebaskan partikel gas mengisi seluruh wadah.' },
    ],
    level: 'SMP · Kelas 7',
    readTime: '2 mnt',
    simLink: null,
  },
  {
    id: 7,
    title: 'Fotosintesis',
    category: 'bio',
    gradeBand: 'SMP',
    subtitle: 'Pabrik energi tumbuhan',
    content:
      'Tumbuhan menyerap CO₂ dan air, lalu dengan bantuan cahaya matahari di kloroplas menghasilkan glukosa dan gas oksigen.',
    keyFormula: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂',
    keyPoints: [
      'Berlangsung di organel kloroplas yang mengandung pigmen klorofil.',
      'Mengubah energi cahaya menjadi energi kimia dalam bentuk glukosa.',
      'Melepaskan gas oksigen (O₂) untuk respirasi makhluk hidup.',
    ],
    videoSteps: [
      { title: '1. Penyerapan Foton', caption: 'Klorofil di daun menangkap energi cahaya biru dan merah dari Matahari.' },
      { title: '2. Pemecahan Air', caption: 'Energi cahaya memecah molekul air menjadi ion hidrogen dan oksigen.' },
      { title: '3. Sintesis Glukosa', caption: 'Karbon dioksida diikat membentuk gula glukosa sebagai cadangan energi.' },
    ],
    level: 'SMP · Kelas 8',
    readTime: '3 mnt',
    simLink: null,
  },
  {
    id: 8,
    title: 'Struktur Sel',
    category: 'bio',
    gradeBand: 'SMA',
    subtitle: 'Organel dan fungsi hidup',
    content:
      'Sel adalah unit fungsional terkecil makhluk hidup. Inti sel mengendalikan aktivitas genetik DNA, sedangkan mitokondria menghasilkan energi ATP.',
    keyFormula: 'Membran · Sitoplasma · Nukleus',
    keyPoints: [
      'Sel eukariotik memiliki membran inti pelindung DNA.',
      'Mitokondria menjadi pusat respirasi seluler penghasil ATP.',
      'Ribosom berperan dalam sintesis protein sesuai kode genetik.',
    ],
    videoSteps: [
      { title: '1. Membran Selektif', caption: 'Lapisan fosfolipid mengatur keluar-masuknya nutrisi dan ion ke dalam sel.' },
      { title: '2. Nukleus & DNA', caption: 'Inti sel menyimpan cetak biru genetik yang mengatur pembelahan sel.' },
      { title: '3. Pabrik ATP', caption: 'Mitokondria mengubah nutrisi menjadi energi kimia ATP siap pakai.' },
    ],
    level: 'SMA · Kelas 11',
    readTime: '3 mnt',
    simLink: null,
  },
  {
    id: 9,
    title: 'Rantai Makanan',
    category: 'bio',
    gradeBand: 'SMP',
    subtitle: 'Aliran energi ekosistem',
    content:
      'Produsen (tumbuhan hijau) → konsumen → pengurai. Energi mengalir satu arah dan hanya sekitar 10% berpindah ke tingkat trofik berikutnya.',
    keyFormula: 'Produsen → Konsumen → Pengurai',
    keyPoints: [
      'Produsen membuat makanan sendiri melalui fotosintesis.',
      'Efisiensi transfer energi antar tingkat trofik sekitar 10%.',
      'Pengurai mendaur ulang unsur hara kembali ke tanah.',
    ],
    videoSteps: [
      { title: '1. Tingkat Produsen', caption: 'Tumbuhan hijau mengikat energi surya menjadi biomassa awal.' },
      { title: '2. Konsumen Berjenjang', caption: 'Herbivora dan karnivora meneruskan energi dengan kehilangan panas.' },
      { title: '3. Siklus Pengurai', caption: 'Bakteri dan jamur mengembalikan mineral organik ke ekosistem.' },
    ],
    level: 'SMP · Kelas 7',
    readTime: '2 mnt',
    simLink: null,
  },
  {
    id: 10,
    title: 'Tata Surya & Kepler',
    category: 'ast',
    gradeBand: 'SMA',
    subtitle: 'Hukum orbit planet 3D',
    content:
      'Delapan planet mengorbit Matahari mengikuti lintasan elips. Hukum III Kepler menyatakan kuadrat periode orbit sebanding dengan pangkat tiga jarak rata-ratanya.',
    keyFormula: 'T² ∝ a³',
    keyPoints: [
      'Planet dalam (Merkurius–Mars) berbatu padat; planet luar raksasa gas dan es.',
      'Planet bergerak lebih cepat saat berada di titik terdekat Matahari (perihelion).',
      'Simulasi 3D menunjukkan perbandingan langsung periode orbit tiap planet.',
    ],
    videoSteps: [
      { title: '1. Orbit Elips', caption: 'Matahari berada pada salah satu titik fokus elips lintasan planet.' },
      { title: '2. Hukum Luas Kepler', caption: 'Garis hubung planet-Matahari menyapu luas yang sama dalam waktu sama.' },
      { title: '3. Harmoni Periode', caption: 'Planet yang lebih jauh seperti Jupiter butuh tahun lebih panjang untuk 1 putaran.' },
    ],
    level: 'SMA · Kelas 10',
    readTime: '3 mnt',
    simLink: 's',
  },
  {
    id: 11,
    title: 'Fase Bulan',
    category: 'ast',
    gradeBand: 'SMP',
    subtitle: 'Siklus sinodis 29,5 hari',
    content:
      'Fase Bulan berubah karena posisi relatif Bulan terhadap Bumi dan Matahari bergeser setiap hari. Purnama terjadi saat sisi terang menghadap penuh ke Bumi.',
    keyFormula: 'Siklus Sinodis ≈ 29,5 hari',
    keyPoints: [
      'Bulan memantulkan cahaya Matahari, bukan memancarkan cahaya sendiri.',
      'Bulan Baru terjadi ketika Bulan berada di antara Matahari dan Bumi.',
      'Pasang surut laut dipengaruhi oleh gaya tarik gravitasi Bulan.',
    ],
    videoSteps: [
      { title: '1. Bulan Baru & Sabit', caption: 'Sisi gelap menghadap Bumi, lalu sabit tipis mulai terlihat saat bergerak.' },
      { title: '2. Kuartir Pertama', caption: 'Setengah piringan Bulan terlihat terang dari permukaan Bumi.' },
      { title: '3. Bulan Purnama', caption: 'Seluruh sisi terang Bulan menghadap Bumi di sisi berlawanan Matahari.' },
    ],
    level: 'SMP · Kelas 7–8',
    readTime: '2 mnt',
    simLink: null,
  },
  {
    id: 12,
    title: 'Bintang & Fusi Nuklir',
    category: 'ast',
    gradeBand: 'SMA',
    subtitle: 'Mesin energi di inti bintang',
    content:
      'Bintang memancarkan energi melalui reaksi fusi nuklir hidrogen menjadi helium di intinya yang bersuhu jutaan Kelvin.',
    keyFormula: '4 ¹H → ⁴He + Energi',
    keyPoints: [
      'Tekanan gravitasi ke dalam diseimbangkan tekanan radiasi fusi ke luar.',
      'Warna bintang menunjukkan suhu permukaannya (biru terpanas, merah dingin).',
      'Matahari mengonversi jutaan ton hidrogen tiap detik menjadi energi.',
    ],
    videoSteps: [
      { title: '1. Keruntuhan Gravitasi', caption: 'Awan gas hidrogen memadat hingga inti mencapai suhu fusi 15 juta Kelvin.' },
      { title: '2. Fusi Proton-Proton', caption: 'Empat inti hidrogen bergabung membentuk helium dan melepaskan foton gamma.' },
      { title: '3. Keseimbangan Bintang', caption: 'Energi merambat ke fotosfer lalu memancarkan cahaya ke tata surya.' },
    ],
    level: 'SMA · Kelas 11',
    readTime: '3 mnt',
    simLink: 's',
  },
  {
    id: 13,
    title: 'Kinematika & Gerak Parabola',
    category: 'fis',
    gradeBand: 'SMA',
    subtitle: 'Perpaduan GLB dan GLBB',
    content:
      'Gerak parabola menggabungkan gerak horizontal konstan (GLB) dengan gerak vertikal yang dipengaruhi percepatan gravitasi (GLBB). Jangkauan maksimum tercapai pada sudut 45°.',
    keyFormula: 'R = v₀² sin(2θ) / g',
    keyPoints: [
      'Komponen kecepatan horizontal v_x = v₀ cos θ selalu konstan tanpa hambatan udara.',
      'Pada titik tertinggi lintasan, komponen kecepatan vertikal v_y bernilai nol.',
      'Sudut elevasi peluncuran 45° menghasilkan jarak tempuh mendatar terjauh.',
    ],
    videoSteps: [
      { title: '1. Penguraian Vektor', caption: 'Kecepatan awal v₀ dipecah menjadi komponen mendatar dan vertikal.' },
      { title: '2. Puncak Lintasan', caption: 'Gravitasi memperlambat v_y hingga nol tepat di ketinggian maksimum.' },
      { title: '3. Simetri Jatuh', caption: 'Waktu naik sama dengan waktu turun pada bidang datar yang rata.' },
    ],
    level: 'SMA · Kelas 10',
    readTime: '3 mnt',
    simLink: 'g',
  },
  {
    id: 14,
    title: 'Ikatan Kimia & Stoikiometri',
    category: 'kim',
    gradeBand: 'SMA',
    subtitle: 'Mol, massa molar, dan ikatan ion/kovalen',
    content:
      'Atom mencapai kestabilan oktet melalui serah-terima elektron (ikatan ion) atau pemakaian elektron bersama (ikatan kovalen). Jumlah zat dihitung dengan satuan mol.',
    keyFormula: 'n = m / Mr · M = n / V',
    keyPoints: [
      'Ikatan ion terbentuk antara logam dan non-logam seperti NaCl.',
      'Satu mol zat mengandung 6,022 × 10²³ partikel (Bilangan Avogadro).',
      'Persamaan reaksi setara menjaga hukum kekekalan massa Lavoisier.',
    ],
    videoSteps: [
      { title: '1. Transfer Elektron', caption: 'Natrium melepaskan 1 elektron ke Klorin membentuk pasangan ion Na⁺ dan Cl⁻.' },
      { title: '2. Konsep Mol', caption: 'Massa dalam gram dibagi massa molekul relatif (Mr) menghasilkan jumlah mol.' },
      { title: '3. Molaritas Larutan', caption: 'Konsentrasi molar mengukur jumlah mol zat terlarut dalam tiap liter larutan.' },
    ],
    level: 'SMA · Kelas 10–11',
    readTime: '3 mnt',
    simLink: null,
  },
  {
    id: 15,
    title: 'Respirasi Sel & ATP',
    category: 'bio',
    gradeBand: 'SMA',
    subtitle: 'Glikolisis hingga transpor elektron',
    content:
      'Respirasi aerob mengubah glukosa dan oksigen melalui glikolisis, siklus Krebs, dan rantai transpor elektron di mitokondria menjadi sekitar 36–38 ATP.',
    keyFormula: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38 ATP',
    keyPoints: [
      'Glikolisis berlangsung di sitoplasma dan menghasilkan 2 asam piruvat.',
      'Siklus Krebs di matriks mitokondria melepas CO₂ dan pembawa elektron NADH/FADH₂.',
      'Oksigen berperan sebagai akseptor elektron terakhir pada rantai transpor elektron.',
    ],
    videoSteps: [
      { title: '1. Glikolisis Sitoplasma', caption: 'Pemecahan 1 molekul glukosa berkarbon-6 menjadi dua piruvat berkarbon-3.' },
      { title: '2. Siklus Krebs', caption: 'Oksidasi lengkap dalam matriks mitokondria memanen elektron berenergi tinggi.' },
      { title: '3. Sintesis ATP Masif', caption: 'Gradien proton memutar enzim ATP sintase menghasilkan puluhan molekul ATP.' },
    ],
    level: 'SMA · Kelas 12',
    readTime: '3 mnt',
    simLink: null,
  },
  {
    id: 16,
    title: 'Diagram H-R & Evolusi Bintang',
    category: 'ast',
    gradeBand: 'SMA',
    subtitle: 'Klasifikasi suhu dan luminositas',
    content:
      'Diagram Hertzsprung-Russell memetakan luminositas bintang terhadap suhu permukaannya, memperlihatkan Deret Utama, Raksasa Merah, dan Katai Putih.',
    keyFormula: 'L = 4π R² σ T⁴',
    keyPoints: [
      'Bintang bermassa mirip Matahari hidup di Deret Utama sekitar 10 miliar tahun.',
      'Bintang masif mengakhiri hidupnya melalui ledakan supernova spektakuler.',
      'Luminositas meningkat drastis terhadap pangkat empat suhu permukaan.',
    ],
    videoSteps: [
      { title: '1. Sumbu Suhu & Terang', caption: 'Bintang panas berwarna biru berada di kiri diagram, bintang dingin merah di kanan.' },
      { title: '2. Jalur Deret Utama', caption: 'Mayoritas bintang stabil membakar hidrogen sepanjang pita diagonal tengah.' },
      { title: '3. Akhir Evolusi', caption: 'Kehabisan bahan bakar inti mendorong bintang mengembang menjadi raksasa merah.' },
    ],
    level: 'SMA · Kelas 12',
    readTime: '3 mnt',
    simLink: 's',
  },
].map((item) => ({
  ...item,
  diagramSvg: createModuleDiagram(item.id, CATEGORIES[item.category].color),
}));

export const MATERIAL_BY_ID = Object.fromEntries(MATERIALS.map((m) => [m.id, m]));

export const QUESTIONS = [
  [1, 1, 'Apa yang menyebabkan benda jatuh ke permukaan Bumi?', ['Gaya gravitasi', 'Gaya magnet', 'Tekanan udara'], 0, 'Gravitasi Bumi menarik semua benda bermassa ke pusat Bumi.'],
  [2, 1, 'Gravitasi Bulan dibanding Bumi kira-kira…', ['Sama besar', 'Sekitar 1/6', '6 kali lebih besar'], 1, 'Bulan bermassa lebih kecil sehingga gravitasinya sekitar 1/6 Bumi.'],
  [3, 2, 'Pada rangkaian seri, jika satu lampu putus maka lampu lain…', ['Makin terang', 'Tetap menyala', 'Padam'], 2, 'Rangkaian seri hanya punya satu jalur arus; jika terputus, arus berhenti.'],
  [4, 2, 'Tegangan 6 V dan hambatan 3 Ω menghasilkan arus…', ['2 A', '18 A', '0,5 A'], 0, 'I = V / R = 6 / 3 = 2 A.'],
  [5, 3, 'Bunyi tidak dapat merambat di…', ['Air', 'Ruang hampa', 'Besi'], 1, 'Bunyi membutuhkan medium; ruang hampa tidak punya partikel perantara.'],
  [6, 3, 'Satuan frekuensi adalah…', ['Newton', 'Hertz', 'Joule'], 1, 'Frekuensi (getaran per detik) diukur dalam Hertz.'],
  [7, 4, 'Rumus kimia air adalah…', ['CO₂', 'H₂O', 'O₂'], 1, 'Satu molekul air = 2 atom hidrogen + 1 atom oksigen.'],
  [8, 4, 'Partikel bermuatan positif di inti atom adalah…', ['Elektron', 'Neutron', 'Proton'], 2, 'Proton positif, neutron netral, elektron negatif dan berada di luar inti.'],
  [9, 5, 'Larutan dengan pH 2 bersifat…', ['Asam', 'Netral', 'Basa'], 0, 'pH di bawah 7 berarti asam.'],
  [10, 5, 'Lakmus biru dalam larutan asam berubah menjadi…', ['Hijau', 'Merah', 'Tetap biru'], 1, 'Asam mengubah lakmus biru menjadi merah.'],
  [11, 6, 'Perubahan wujud es menjadi air disebut…', ['Menguap', 'Membeku', 'Mencair'], 2, 'Padat → cair = mencair; cair → padat = membeku.'],
  [12, 6, 'Air murni mendidih pada tekanan 1 atm di suhu…', ['50 °C', '100 °C', '0 °C'], 1, 'Titik didih air murni 100 °C pada 1 atm.'],
  [13, 7, 'Gas yang diserap tumbuhan saat fotosintesis adalah…', ['Karbon dioksida', 'Oksigen', 'Nitrogen'], 0, 'Tumbuhan menyerap CO₂ dan melepaskan O₂.'],
  [14, 7, 'Fotosintesis terjadi di organel…', ['Mitokondria', 'Inti sel', 'Kloroplas'], 2, 'Kloroplas berisi klorofil penangkap cahaya.'],
  [15, 8, 'Pusat pengendali aktivitas sel yang menyimpan DNA adalah…', ['Inti sel', 'Dinding sel', 'Vakuola'], 0, 'Inti sel (nukleus) menyimpan DNA dan mengatur seluruh kegiatan sel.'],
  [16, 9, 'Produsen dalam rantai makanan adalah…', ['Singa', 'Tumbuhan hijau', 'Jamur'], 1, 'Tumbuhan hijau membuat makanan sendiri lewat fotosintesis.'],
  [17, 10, 'Planet terdekat dari Matahari adalah…', ['Venus', 'Bumi', 'Merkurius'], 2, 'Merkurius punya orbit terkecil.'],
  [18, 10, 'Planet terbesar di tata surya adalah…', ['Jupiter', 'Saturnus', 'Neptunus'], 0, 'Jupiter berdiameter sekitar 11 kali Bumi.'],
  [19, 11, 'Purnama terjadi ketika…', ['Bulan di antara Bumi dan Matahari', 'Bumi di antara Matahari dan Bulan', 'Bulan tertutup awan'], 1, 'Sisi Bulan yang terang menghadap Bumi penuh.'],
  [20, 12, 'Matahari memancarkan energi sendiri melalui reaksi…', ['Pembakaran kimia', 'Fusi nuklir', 'Fisi batuan'], 1, 'Fusi inti menggabungkan hidrogen menjadi helium dan energi.'],
  [21, 13, 'Pada gerak parabola di bidang datar, jangkauan horizontal terjauh dicapai pada sudut elevasi…', ['30°', '45°', '60°'], 1, 'Karena sin(2 × 45°) = sin(90°) = 1 bernilai maksimum.'],
  [22, 13, 'Saat proyektil mencapai titik tertinggi, komponen kecepatan vertikal (v_y) bernilai…', ['Maksimum', 'Sama dengan v₀', 'Nol'], 2, 'Di puncak lintasan gerak vertikal berhenti sesaat sebelum turun kembali.'],
  [23, 14, 'Ikatan yang terbentuk akibat serah-terima elektron antara Na⁺ dan Cl⁻ adalah…', ['Ikatan kovalen', 'Ikatan ion', 'Ikatan hidrogen'], 1, 'Gaya tarik elektrostatik antar ion positif dan negatif membentuk ikatan ion.'],
  [24, 14, 'Jumlah mol dari 36 gram air (Mr H₂O = 18 g/mol) adalah…', ['0,5 mol', '2 mol', '18 mol'], 1, 'n = massa / Mr = 36 / 18 = 2 mol.'],
  [25, 15, 'Tahapan pertama respirasi seluler yang terjadi di sitoplasma disebut…', ['Glikolisis', 'Siklus Krebs', 'Fosforilasi oksidatif'], 0, 'Glikolisis memecah glukosa menjadi piruvat di luar mitokondria.'],
  [26, 15, 'Dalam respirasi aerob, akseptor elektron terakhir pada rantai transpor elektron adalah…', ['Karbon dioksida', 'Oksigen', 'Nitrogen'], 1, 'Oksigen menerima elektron dan proton membentuk molekul air.'],
  [27, 16, 'Pada diagram H-R, bintang biru yang sangat panas terletak di sisi…', ['Kiri diagram', 'Kanan diagram', 'Bawah kanan'], 0, 'Sumbu suhu pada diagram H-R diurutkan dari paling panas di sebelah kiri.'],
  [28, 16, 'Bintang bermassa sangat besar mengakhiri siklus evolusinya dengan ledakan…', ['Nova ringan', 'Supernova', 'Komet'], 1, 'Keruntuhan inti bintang masif memicu ledakan supernova.'],
].map((row) => ({
  id: row[0],
  materialId: row[1],
  gradeBand: MATERIAL_BY_ID[row[1]]?.gradeBand || 'SMP',
  question: row[2],
  options: row[3],
  answerIndex: row[4],
  explanation: row[5],
  points: 10,
}));

export const BADGES = [
  {
    id: 'first',
    name: 'Langkah Pertama',
    icon: 'award',
    description: 'Jawab 1 kuis dengan benar',
    check: (state) => Object.keys(state.quiz).length >= 1,
  },
  {
    id: 'lvl3',
    name: 'Level 3',
    icon: 'bolt',
    description: 'Capai Level 3 (100 XP)',
    check: (state) => Math.floor(state.xp / 50) + 1 >= 3,
  },
  {
    id: 'read',
    name: 'Kutu Buku',
    icon: 'book',
    description: 'Selesaikan 6 materi belajar',
    check: (state) => Object.keys(state.read).length >= 6,
  },
  {
    id: 'cat',
    name: 'Ahli Kategori',
    icon: 'trophy',
    description: 'Selesaikan semua kuis dalam satu kategori',
    check: (state) =>
      Object.keys(CATEGORIES).some((catKey) =>
        QUESTIONS.filter((q) => MATERIAL_BY_ID[q.materialId].category === catKey).every(
          (q) => Boolean(state.quiz[q.id])
        )
      ),
  },
  {
    id: 'sim',
    name: 'Penjelajah 3D',
    icon: 'orbit',
    description: 'Coba seluruh 3 simulasi interaktif',
    check: (state) => Object.keys(state.sims).length >= 3,
  },
  {
    id: 'day',
    name: 'Pejuang Harian',
    icon: 'flame',
    description: 'Selesaikan Tantangan Harian',
    check: (state) => Object.keys(state.daily).length >= 1,
  },
];

export const DEMO_PEERS = [
  {
    name: 'Nova (SMA 11)',
    gradeBand: 'SMA',
    xp: 340,
    weeklyXp: 180,
    dailyXp: 60,
    avatarConfig: { suitColor: 'cyan', hairStyle: 'spiky', visor: 'cyber', accessory: 'rocket', skinTone: 'warm' },
  },
  {
    name: 'Rafi (SMP 8)',
    gradeBand: 'SMP',
    xp: 260,
    weeklyXp: 140,
    dailyXp: 50,
    avatarConfig: { suitColor: 'electric', hairStyle: 'wave', visor: 'round', accessory: 'atom', skinTone: 'tan' },
  },
  {
    name: 'Sari (SMA 10)',
    gradeBand: 'SMA',
    xp: 190,
    weeklyXp: 110,
    dailyXp: 40,
    avatarConfig: { suitColor: 'emerald', hairStyle: 'bob', visor: 'round', accessory: 'flask', skinTone: 'light' },
  },
  {
    name: 'Dimas (SMP 9)',
    gradeBand: 'SMP',
    xp: 120,
    weeklyXp: 70,
    dailyXp: 30,
    avatarConfig: { suitColor: 'sunset', hairStyle: 'helmet', visor: 'cyber', accessory: 'planet', skinTone: 'deep' },
  },
];
