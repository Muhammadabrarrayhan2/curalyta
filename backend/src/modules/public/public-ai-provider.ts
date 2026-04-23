import type { PublicChatHistoryItem } from './public-ai';

export interface PublicAiImagePartInput {
  mimeType: string;
  buffer: Buffer;
}

interface FetchPublicAiResponseInput {
  url: string;
  apiKey: string;
  requestBody: Record<string, unknown>;
  fetchImpl?: typeof fetch;
  attempts?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
}

interface BuildPublicAiRequestBodyInput {
  prompt: string;
  history: PublicChatHistoryItem[];
  image?: PublicAiImagePartInput;
  supportsSystemInstruction: boolean;
  systemInstruction: string;
}

export function resolvePublicAiModel(input: {
  textModel: string;
  visionModel: string;
  hasImage: boolean;
}) {
  return input.hasImage ? input.visionModel : input.textModel;
}

function isRetryablePublicAiStatus(status: number) {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

function isRetryablePublicAiTransportError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  const cause = (error as Error & { cause?: { code?: string; message?: string } }).cause;
  const causeCode = cause?.code?.toLowerCase?.() ?? '';
  const causeMessage = cause?.message?.toLowerCase?.() ?? '';

  return (
    name === 'aborterror' ||
    message.includes('fetch failed') ||
    message.includes('timed out') ||
    causeMessage.includes('timed out') ||
    causeCode === 'econnreset' ||
    causeCode === 'enotfound' ||
    causeCode === 'eai_again' ||
    causeCode === 'und_err_connect_timeout' ||
    causeCode === 'und_err_headers_timeout'
  );
}

async function waitPublicAiRetry(delayMs: number) {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function fetchPublicAiResponse(input: FetchPublicAiResponseInput) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const attempts = Math.max(1, input.attempts ?? 2);
  const timeoutMs = input.timeoutMs ?? 20000;
  const retryDelayMs = input.retryDelayMs ?? 350;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(input.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': input.apiKey,
        },
        body: JSON.stringify(input.requestBody),
        signal: controller.signal,
      });

      if (attempt < attempts && isRetryablePublicAiStatus(response.status)) {
        await response.arrayBuffer().catch(() => undefined);
        await waitPublicAiRetry(retryDelayMs);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt >= attempts || !isRetryablePublicAiTransportError(error)) {
        throw error;
      }

      await waitPublicAiRetry(retryDelayMs);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Public AI request failed');
}

export function buildPublicAiRequestBody(input: BuildPublicAiRequestBodyInput) {
  const parts: Array<Record<string, unknown>> = [{ text: input.prompt }];

  if (input.image) {
    parts.push({
      inline_data: {
        mime_type: input.image.mimeType,
        data: input.image.buffer.toString('base64'),
      },
    });
  }

  const body: Record<string, unknown> = {
    contents: [
      ...input.history.map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      })),
      {
        role: 'user',
        parts,
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 420,
    },
  };

  if (input.supportsSystemInstruction) {
    body.systemInstruction = {
      parts: [{ text: input.systemInstruction }],
    };
  }

  return body;
}

export function resolvePublicAiProviderError(input: {
  status: number;
  details: string;
  hasImage: boolean;
}) {
  const details = input.details.toLowerCase();

  if (input.hasImage && details.includes('unable to process input image')) {
    return 'Gambar belum bisa dianalisis. Coba kirim foto yang lebih jelas atau lanjutkan dengan teks saja.';
  }

  if (input.status === 429) {
    return 'Tanya AI sedang ramai dipakai. Coba lagi beberapa saat.';
  }

  return 'Tanya AI sedang tidak tersedia. Silakan coba lagi sebentar lagi.';
}
