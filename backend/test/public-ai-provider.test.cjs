const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadProviderModule() {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '../src/modules/public/public-ai-provider.ts')
  ).href;
  return import(moduleUrl);
}

test('resolvePublicAiModel switches to vision model when an image is attached', async () => {
  const { resolvePublicAiModel } = await loadProviderModule();

  assert.equal(
    resolvePublicAiModel({
      textModel: 'gemma-3-27b-it',
      visionModel: 'gemini-2.5-flash',
      hasImage: false,
    }),
    'gemma-3-27b-it'
  );

  assert.equal(
    resolvePublicAiModel({
      textModel: 'gemma-3-27b-it',
      visionModel: 'gemini-2.5-flash',
      hasImage: true,
    }),
    'gemini-2.5-flash'
  );
});

test('buildPublicAiRequestBody adds inline image data only for image requests', async () => {
  const { buildPublicAiRequestBody } = await loadProviderModule();

  const body = buildPublicAiRequestBody({
    prompt: 'Tolong analisis keluhan ini.',
    history: [{ role: 'assistant', content: 'Halo, ceritakan keluhan Anda.' }],
    image: {
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image'),
    },
    supportsSystemInstruction: true,
    systemInstruction: 'Gunakan bahasa Indonesia.',
  });

  assert.ok(body.contents.length >= 2);
  assert.equal(body.systemInstruction.parts[0].text, 'Gunakan bahasa Indonesia.');
  assert.equal(body.contents.at(-1).parts[0].text, 'Tolong analisis keluhan ini.');
  assert.equal(body.contents.at(-1).parts[1].inline_data.mime_type, 'image/png');
  assert.equal(
    body.contents.at(-1).parts[1].inline_data.data,
    Buffer.from('fake-image').toString('base64')
  );
});

test('resolvePublicAiProviderError maps image processing failures to a friendly retry message', async () => {
  const { resolvePublicAiProviderError } = await loadProviderModule();

  assert.equal(
    resolvePublicAiProviderError({
      status: 400,
      details: 'Unable to process input image. Please retry',
      hasImage: true,
    }),
    'Gambar belum bisa dianalisis. Coba kirim foto yang lebih jelas atau lanjutkan dengan teks saja.'
  );
});

test('fetchPublicAiResponse retries once after a transient network failure', async () => {
  const { fetchPublicAiResponse } = await loadProviderModule();

  let attempts = 0;
  const response = await fetchPublicAiResponse({
    url: 'https://example.com',
    apiKey: 'secret',
    requestBody: { hello: 'world' },
    attempts: 2,
    retryDelayMs: 0,
    fetchImpl: async () => {
      attempts += 1;

      if (attempts === 1) {
        throw new TypeError('fetch failed', {
          cause: { code: 'ECONNRESET', message: 'socket hang up' },
        });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });

  assert.equal(attempts, 2);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('fetchPublicAiResponse retries retryable provider statuses before returning success', async () => {
  const { fetchPublicAiResponse } = await loadProviderModule();

  let attempts = 0;
  const response = await fetchPublicAiResponse({
    url: 'https://example.com',
    apiKey: 'secret',
    requestBody: { hello: 'world' },
    attempts: 2,
    retryDelayMs: 0,
    fetchImpl: async () => {
      attempts += 1;

      if (attempts === 1) {
        return new Response('busy', { status: 503 });
      }

      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });

  assert.equal(attempts, 2);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});
