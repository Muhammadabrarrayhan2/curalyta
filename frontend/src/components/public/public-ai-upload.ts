export const PUBLIC_AI_IMAGE_MAX_MB = 5;

const PUBLIC_AI_ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export type PublicAiHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export function validatePublicAiImageFile(file: {
  type: string;
  size: number;
}) {
  if (!PUBLIC_AI_ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false as const,
      message: 'Format gambar belum didukung. Gunakan JPG, PNG, atau WEBP.',
    };
  }

  if (file.size > PUBLIC_AI_IMAGE_MAX_MB * 1024 * 1024) {
    return {
      ok: false as const,
      message: `Ukuran gambar terlalu besar. Maksimal ${PUBLIC_AI_IMAGE_MAX_MB}MB.`,
    };
  }

  return { ok: true as const };
}

export function buildPublicAiRequestPayload(input: {
  message: string;
  history: PublicAiHistoryMessage[];
  imageFile?: File;
}) {
  if (!input.imageFile) {
    return {
      kind: 'json' as const,
      data: {
        message: input.message,
        history: input.history,
      },
    };
  }

  const formData = new FormData();
  formData.set('message', input.message);
  formData.set('history', JSON.stringify(input.history));
  formData.set('image', input.imageFile);

  return {
    kind: 'form-data' as const,
    data: formData,
  };
}
