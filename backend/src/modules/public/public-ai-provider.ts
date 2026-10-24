import type { GroqMessage, GroqContentPart } from '../../lib/groq';
import type { PublicChatHistoryItem } from './public-ai';

export interface PublicAiImagePartInput {
  mimeType: string;
  buffer: Buffer;
}

interface BuildPublicAiMessagesInput {
  prompt: string;
  history: PublicChatHistoryItem[];
  image?: PublicAiImagePartInput;
  systemInstruction: string;
}

export function resolvePublicAiModel(input: {
  textModel: string;
  visionModel: string;
  hasImage: boolean;
}) {
  return input.hasImage ? input.visionModel : input.textModel;
}

export function buildPublicAiMessages(input: BuildPublicAiMessagesInput): GroqMessage[] {
  const userContent: string | GroqContentPart[] = input.image
    ? [
        { type: 'text', text: input.prompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${input.image.mimeType};base64,${input.image.buffer.toString('base64')}`,
          },
        },
      ]
    : input.prompt;

  return [
    { role: 'system', content: input.systemInstruction },
    ...input.history.map((item) => ({ role: item.role, content: item.content })),
    { role: 'user', content: userContent },
  ];
}

export function resolvePublicAiProviderError(input: {
  status: number;
  details: string;
  hasImage: boolean;
}) {
  const details = input.details.toLowerCase();

  if (input.hasImage && input.status === 400 && details.includes('image')) {
    return 'Gambar belum bisa dianalisis. Coba kirim foto yang lebih jelas atau lanjutkan dengan teks saja.';
  }

  if (input.status === 429) {
    return 'Tanya AI sedang ramai dipakai. Coba lagi beberapa saat.';
  }

  return 'Tanya AI sedang tidak tersedia. Silakan coba lagi sebentar lagi.';
}
