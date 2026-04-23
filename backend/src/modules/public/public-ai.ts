export type PublicChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export const PUBLIC_AI_MAX_REPLY_CHARS = 980;
const PUBLIC_AI_MAX_HISTORY_CHARS = 1500;

const PUBLIC_AI_EMPTY_REPLY =
  'Keluhan Anda terdengar perlu dipantau. Coba istirahat cukup, minum yang cukup, dan perhatikan apakah gejala memburuk. Jika muncul tanda bahaya atau keluhan tidak membaik, barulah periksa ke dokter.';

export const PUBLIC_AI_SYSTEM_INSTRUCTION = [
  'Anda adalah asisten kesehatan umum Curalyta untuk pengguna publik di Indonesia.',
  `Balas dalam bahasa Indonesia yang hangat, jelas, alami, relevan, dan maksimal ${PUBLIC_AI_MAX_REPLY_CHARS} karakter.`,
  'Gunakan konteks riwayat percakapan bila ada agar jawaban terasa menyambung. Jika percakapan sudah berjalan, jangan mengulang salam, perkenalan, atau disclaimer panjang di setiap balasan.',
  'Mulai dengan empati singkat yang terasa manusiawi, lalu langsung jawab inti keluhan pengguna tanpa berputar-putar. Hindari interjeksi seperti "wah", "aduh", atau "duh".',
  'Untuk keluhan ringan, fokus pada kemungkinan penyebab yang paling umum atau paling masuk akal dari pesan pengguna, bukan daftar panjang diagnosis banding.',
  'Untuk gejala yang sangat ringan, baru muncul, dan belum mengganggu berat, sering kali belum perlu ke dokter dulu. Dahulukan perawatan rumahan yang aman, gunakan frasa seperti "belum perlu ke dokter dulu", "cukup dipantau dulu di rumah", dan "baru perlu diperiksa bila..." bila memang sesuai.',
  'Gunakan istilah yang jelas dan mudah dipahami. Hindari istilah kabur seperti "masuk angin" bila ada penjelasan yang lebih spesifik dan aman.',
  'Berikan langkah yang bisa dilakukan sekarang di rumah secara praktis dan spesifik sesuai keluhan.',
  'Jika relevan, Anda boleh menyebut obat bebas umum atau opsi pereda non-resep yang lazim dipakai sesuai gejala, misalnya parasetamol untuk demam atau nyeri ringan, saline untuk hidung tersumbat, antihistamin untuk gejala alergi ringan, oralit untuk diare ringan, atau pelembap, kalamin, dan kompres dingin untuk gatal ringan. Jika menyebut obat, usahakan sebut kategori atau contoh sederhana yang sesuai gejala, bukan frasa umum yang kabur.',
  'Jangan memberi dosis rinci, jangan menyarankan antibiotik rutin, obat keras, steroid oral, injeksi, atau obat resep. Untuk anak kecil, ibu hamil, menyusui, lansia, atau orang dengan penyakit kronis, sarankan cek label kemasan dan konfirmasi ke apoteker atau dokter sebelum minum obat.',
  'Jangan memberi diagnosis pasti. Jelaskan dengan bahasa seperti "sering", "bisa terkait", atau "paling sering disebabkan". Jangan menambahkan asumsi penyebab yang terlalu spesifik bila tidak didukung gejala pengguna, misalnya jangan langsung menyimpulkan infeksi bakteri tanpa petunjuk yang kuat.',
  'Sarankan ke dokter hanya jika ada tanda bahaya yang jelas, gejala berat, gejala cepat memburuk, tidak membaik dalam waktu yang wajar, atau pengguna menyebut kondisi berisiko tinggi. Jangan mendorong periksa ke dokter terlalu cepat untuk keluhan ringan yang masih wajar dipantau di rumah.',
  'Jika ada gambar, gabungkan informasi dari foto dan keluhan pengguna. Jika foto kurang jelas, pencahayaan buruk, atau sudutnya tidak membantu, katakan terus terang bahwa foto belum cukup jelas dan jangan menebak terlalu pasti.',
  'Jika pengguna menanyakan perbedaan beberapa kondisi, jelaskan pembeda gejala yang paling penting dalam bahasa sederhana dan fokus pada tanda praktis yang membedakan, bukan penyebab teknis yang belum tentu pasti.',
  'Gaya jawaban harus terasa menenangkan, tidak menggurui, tanpa markdown, dan biasanya 4 sampai 6 kalimat yang padat.',
].join('\n\n');

function normalizeText(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/[`*_>#-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function clampHistoryContent(content: string) {
  const normalized = normalizeText(content);

  if (normalized.length <= PUBLIC_AI_MAX_HISTORY_CHARS) return normalized;

  return `${normalized.slice(0, PUBLIC_AI_MAX_HISTORY_CHARS - 3).trimEnd()}...`;
}

export function buildPublicAiPrompt(message: string) {
  return buildPublicAiPromptWithOptions(message, {
    inlineSystemInstruction: true,
  });
}

export function modelSupportsPublicAiSystemInstruction(model: string) {
  return /^gemini-/i.test(model.trim());
}

export function buildPublicAiCaseHint(message: string) {
  const normalized = normalizeText(message).toLowerCase();
  const hints: string[] = [];

  if ((normalized.includes('batuk') || normalized.includes('pilek')) && !normalized.includes('sesak')) {
    hints.push(
      'Untuk batuk atau pilek ringan beberapa hari tanpa tanda bahaya, penyebab tersering adalah infeksi virus saluran napas atas atau common cold, bukan otomatis influenza berat.'
    );
    hints.push(
      'Jika relevan, arahkan ke langkah yang lebih spesifik seperti istirahat, cairan, saline spray atau bilas hidung, madu untuk batuk bila aman, dan parasetamol bila ada nyeri atau demam. Jangan menyarankan antibiotik.'
    );
  }

  if (
    normalized.includes('flu') &&
    normalized.includes('alerg') &&
    normalized.includes('sinus')
  ) {
    hints.push(
      'Untuk pertanyaan perbedaan flu, alergi, dan sinusitis, fokus pada pola gejala utama: flu cenderung demam, pegal, lemas; alergi cenderung gatal, bersin, mata atau hidung berair tanpa demam; sinusitis cenderung tekanan atau nyeri wajah, hidung tersumbat, dan lendir lebih kental. Jangan langsung menyebut sinusitis sebagai infeksi bakteri tanpa petunjuk kuat.'
    );
  }

  if (normalized.includes('gatal')) {
    hints.push(
      'Untuk gatal ringan, penyebab umum yang paling aman disebut adalah kulit kering, iritasi, gigitan serangga, atau reaksi alergi ringan. Bila relevan, opsi pereda yang aman disebut adalah kompres dingin, pelembap tanpa pewangi, kalamin, atau antihistamin sesuai label.'
    );
  }

  if (normalized.includes('diare') || normalized.includes('mencret')) {
    hints.push(
      'Untuk diare ringan, utamakan cairan, oralit, dan pemantauan tanda dehidrasi. Waspadai bila ada darah, lemas berat, demam tinggi, atau nyeri perut hebat.'
    );
  }

  return hints.join('\n\n');
}

export function buildPublicAiPromptWithOptions(
  message: string,
  options: { inlineSystemInstruction?: boolean; hasImage?: boolean } = {}
) {
  const normalizedMessage = normalizeText(message);
  const inlineSystemInstruction = options.inlineSystemInstruction ?? false;
  const hasImage = options.hasImage ?? false;
  const caseHint = buildPublicAiCaseHint(normalizedMessage);
  const userMessageSection =
    normalizedMessage || !hasImage
      ? `Pesan pengguna: ${normalizedMessage}`
      : 'Pengguna hanya mengirim gambar tanpa keterangan tambahan. Fokus pada hal yang terlihat dan langkah aman awal.';

  const sections = [
    'Gunakan konteks riwayat percakapan sebelumnya bila ada agar jawaban terasa menyambung.',
    'Jangan ulangi salam atau perkenalan bila ini bukan balasan pertama.',
    'Jawab dengan urutan yang alami: kemungkinan penyebab paling umum, langkah aman yang bisa dilakukan sekarang, obat bebas/opsi pereda yang relevan bila memang cocok, lalu tanda bahaya atau kapan perlu diperiksa bila benar-benar perlu.',
    'Jika pertanyaannya berupa perbandingan beberapa kondisi, jawab perbedaan utamanya dulu dengan bahasa sederhana.',
    userMessageSection,
  ];

  if (inlineSystemInstruction) {
    sections.unshift(PUBLIC_AI_SYSTEM_INSTRUCTION);
  }

  if (hasImage) {
    sections.splice(
      sections.length - 1,
      0,
      'Gabungkan informasi dari foto dan keluhan pengguna. Jika foto kurang jelas, katakan dengan jujur dan fokus pada saran aman yang masih masuk akal.'
    );
  }

  if (caseHint) {
    sections.splice(sections.length - 1, 0, `Petunjuk tambahan untuk kasus ini:\n${caseHint}`);
  }

  return sections.join('\n\n');
}

function stripRepeatedGreeting(content: string) {
  return content
    .replace(/^(halo|hai|hi)\s*[,!.\-–—]*\s*/i, '')
    .replace(/^(wah|aduh|duh|baik|tentu|oke|ya)\b[^.!?]*[.!?]\s*/i, '')
    .replace(/^semoga[^.!?]*[.!?]\s*/i, '');
}

export function finalizePublicAiReply(
  content: string,
  options: { hasHistory?: boolean } = {}
) {
  let normalized = normalizeText(content);

  if (options.hasHistory) {
    normalized = stripRepeatedGreeting(normalized);
  }

  if (!normalized) return PUBLIC_AI_EMPTY_REPLY;
  if (normalized.length <= PUBLIC_AI_MAX_REPLY_CHARS) return normalized;

  const sentences =
    normalized.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];

  let concise = '';
  for (const sentence of sentences) {
    const next = concise ? `${concise} ${sentence}` : sentence;
    if (next.length > PUBLIC_AI_MAX_REPLY_CHARS) break;
    concise = next;
  }

  if (!concise) {
    concise = normalized.slice(0, PUBLIC_AI_MAX_REPLY_CHARS).trimEnd();
  }

  if (!/[.!?]$/.test(concise)) {
    concise = `${concise.replace(/[,:;\s-]+$/, '')}.`;
  }

  return concise;
}
