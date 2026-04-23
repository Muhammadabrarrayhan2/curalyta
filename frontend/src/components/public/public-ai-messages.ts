export const FALLBACK_PUBLIC_AI_ERROR_MESSAGE =
  'Tanya AI belum bisa menjawab saat ini. Jika layanan sedang sibuk atau koneksi ke AI bermasalah, coba lagi sebentar. Kalau gejala Anda berat atau mendadak memburuk, segera cari bantuan medis langsung.';

export function resolvePublicAiErrorMessage(message: string) {
  const normalized = message.trim();
  return normalized || FALLBACK_PUBLIC_AI_ERROR_MESSAGE;
}
