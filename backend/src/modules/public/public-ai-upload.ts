export const PUBLIC_AI_ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export interface PublicAiUploadedImage {
  name: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface PublicAiPayload {
  message: string;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  image?: PublicAiUploadedImage;
}

export function isAllowedPublicAiImageMime(mimeType: string) {
  return PUBLIC_AI_ALLOWED_IMAGE_MIME.has(mimeType);
}

export function parsePublicAiHistoryInput(input: unknown) {
  const raw = typeof input === 'string' ? JSON.parse(input || '[]') : input;
  const history = Array.isArray(raw) ? raw : [];

  if (history.length > 8) {
    throw new Error('Riwayat chat terlalu panjang.');
  }

  return history.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Riwayat chat ke-${index + 1} tidak valid.`);
    }

    const role = 'role' in item ? item.role : undefined;
    const content = 'content' in item ? item.content : undefined;

    if (role !== 'user' && role !== 'assistant') {
      throw new Error(`Peran riwayat chat ke-${index + 1} tidak valid.`);
    }

    if (typeof content !== 'string' || !content.trim() || content.trim().length > 4000) {
      throw new Error(`Isi riwayat chat ke-${index + 1} tidak valid.`);
    }

    return {
      role,
      content: content.trim(),
    };
  });
}

export function buildPublicAiPayload(input: {
  body: { message?: unknown; history?: unknown };
  file?: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  };
}): PublicAiPayload {
  const message =
    typeof input.body.message === 'string' ? input.body.message.trim() : '';
  const history = parsePublicAiHistoryInput(input.body.history);

  if (!message && !input.file) {
    throw new Error('Tulis pertanyaan atau tambahkan gambar dulu.');
  }

  if (input.file && !isAllowedPublicAiImageMime(input.file.mimetype)) {
    throw new Error('Format gambar belum didukung. Gunakan JPG, PNG, atau WEBP.');
  }

  return {
    message,
    history,
    image: input.file
      ? {
          name: input.file.originalname,
          mimeType: input.file.mimetype,
          size: input.file.size,
          buffer: input.file.buffer,
        }
      : undefined,
  };
}
