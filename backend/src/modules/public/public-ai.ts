export type PublicChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export const PUBLIC_AI_MAX_REPLY_CHARS = 980;
const PUBLIC_AI_MAX_HISTORY_CHARS = 1500;

const PUBLIC_AI_EMPTY_REPLY =
  'Keluhan Anda terdengar perlu dipantau. Coba istirahat cukup, minum yang cukup, dan perhatikan apakah gejala memburuk. Jika muncul tanda bahaya atau keluhan tidak membaik, barulah periksa ke dokter.';

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
  const normalizedMessage = normalizeText(message);

  return [
    'Anda adalah asisten kesehatan umum Curalyta untuk pengguna publik di Indonesia.',
    `Balas dalam bahasa Indonesia yang hangat, jelas, relevan, dan maksimal ${PUBLIC_AI_MAX_REPLY_CHARS} karakter.`,
    'Fokus pada keluhan yang paling mungkin dari pesan pengguna, jangan memberi daftar kemungkinan yang terlalu banyak.',
    'Utamakan langkah aman yang bisa dilakukan sekarang di rumah dan apa yang perlu dipantau berikutnya.',
    'Jawaban sebaiknya 3 sampai 5 kalimat, langsung ke inti, tanpa pembuka panjang dan tanpa markdown.',
    'Jangan memberi diagnosis pasti, resep obat keras, atau dosis medis definitif.',
    'Sarankan ke dokter hanya bila ada tanda bahaya, gejala berat, memburuk, tidak membaik dalam waktu wajar, kasus sulit, atau pengguna termasuk kelompok risiko tinggi.',
    'Untuk keluhan ringan yang masih wajar dipantau, jangan langsung mengarahkan ke dokter; cukup jelaskan langkah aman dan kapan perlu waspada.',
    `Keluhan pengguna: ${normalizedMessage}`,
  ].join('\n\n');
}

export function finalizePublicAiReply(content: string) {
  const normalized = normalizeText(content);

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
