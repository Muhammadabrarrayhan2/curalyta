/**
 * Groq client with API key rotation.
 *
 * Keys come from GROQ_API_KEYS (comma or newline separated). Each request
 * starts from the next key in round-robin order, spreading load across keys.
 * If a key is rate-limited (429), rejected (401/403), or the provider has a
 * transient failure, the same request is retried with the next key.
 */

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type GroqContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | GroqContentPart[];
}

export class GroqApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly details: string
  ) {
    super(`Groq API error ${status}`);
    this.name = 'GroqApiError';
  }
}

export function parseGroqApiKeys(raw: string): string[] {
  const keys = raw
    .split(/[,\n]/)
    .map((key) => key.trim())
    .filter(Boolean);
  return Array.from(new Set(keys));
}

export interface GroqKeyRotator {
  readonly size: number;
  /** All keys, starting from the next one in round-robin order. */
  order(): string[];
}

export function createGroqKeyRotator(keys: string[]): GroqKeyRotator {
  let cursor = 0;

  return {
    size: keys.length,
    order() {
      if (!keys.length) return [];
      const start = cursor % keys.length;
      cursor = (cursor + 1) % keys.length;
      return [...keys.slice(start), ...keys.slice(0, start)];
    },
  };
}

function shouldTryNextKey(status: number) {
  return (
    status === 401 ||
    status === 403 ||
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function isTransportError(error: unknown) {
  if (!(error instanceof Error)) return false;
  if (error instanceof GroqApiError) return false;

  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  const cause = (error as Error & { cause?: { code?: string } }).cause;
  const causeCode = cause?.code?.toLowerCase?.() ?? '';

  return (
    name === 'aborterror' ||
    message.includes('fetch failed') ||
    message.includes('timed out') ||
    causeCode === 'econnreset' ||
    causeCode === 'enotfound' ||
    causeCode === 'eai_again' ||
    causeCode === 'und_err_connect_timeout' ||
    causeCode === 'und_err_headers_timeout'
  );
}

function stripReasoning(text: string) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export function buildGroqRequestBody(input: {
  model: string;
  messages: GroqMessage[];
  maxTokens: number;
  temperature?: number;
}) {
  const body: Record<string, unknown> = {
    model: input.model,
    messages: input.messages,
    max_tokens: input.maxTokens,
    temperature: input.temperature ?? 0.3,
  };

  // gpt-oss models spend completion tokens on reasoning; keep it short.
  if (/gpt-oss/i.test(input.model)) {
    body.reasoning_effort = 'low';
  }

  return body;
}

interface GroqChatInput {
  rotator: GroqKeyRotator;
  model: string;
  messages: GroqMessage[];
  maxTokens?: number;
  temperature?: number;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retryDelayMs?: number;
}

interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

export async function groqChatCompletion(input: GroqChatInput): Promise<string> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const timeoutMs = input.timeoutMs ?? 30000;
  const retryDelayMs = input.retryDelayMs ?? 250;
  const keys = input.rotator.order();

  if (!keys.length) {
    throw new GroqApiError(401, 'No Groq API key configured');
  }

  const body = JSON.stringify(
    buildGroqRequestBody({
      model: input.model,
      messages: input.messages,
      maxTokens: input.maxTokens ?? 1500,
      temperature: input.temperature,
    })
  );

  let lastError: unknown;

  for (let i = 0; i < keys.length; i += 1) {
    const isLastKey = i === keys.length - 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(GROQ_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${keys[i]}`,
        },
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const details = await response.text().catch(() => '');
        const error = new GroqApiError(response.status, details);
        if (isLastKey || !shouldTryNextKey(response.status)) throw error;
        lastError = error;
        if (retryDelayMs) await new Promise((r) => setTimeout(r, retryDelayMs));
        continue;
      }

      const data = (await response.json()) as GroqChatResponse;
      return stripReasoning(data.choices?.[0]?.message?.content ?? '');
    } catch (error) {
      if (error instanceof GroqApiError) throw error;
      if (isLastKey || !isTransportError(error)) throw error;
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Groq request failed');
}
