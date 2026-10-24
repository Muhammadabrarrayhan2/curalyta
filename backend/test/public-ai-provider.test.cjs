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
      textModel: 'openai/gpt-oss-120b',
      visionModel: 'qwen/qwen3.8-27b',
      hasImage: false,
    }),
    'openai/gpt-oss-120b'
  );

  assert.equal(
    resolvePublicAiModel({
      textModel: 'openai/gpt-oss-120b',
      visionModel: 'qwen/qwen3.8-27b',
      hasImage: true,
    }),
    'qwen/qwen3.8-27b'
  );
});

test('buildPublicAiMessages builds OpenAI-style messages with inline image only for image requests', async () => {
  const { buildPublicAiMessages } = await loadProviderModule();

  const messages = buildPublicAiMessages({
    prompt: 'Tolong analisis keluhan ini.',
    history: [{ role: 'assistant', content: 'Halo, ceritakan keluhan Anda.' }],
    image: { mimeType: 'image/png', buffer: Buffer.from('fake-image') },
    systemInstruction: 'Gunakan bahasa Indonesia.',
  });

  assert.deepEqual(messages[0], { role: 'system', content: 'Gunakan bahasa Indonesia.' });
  assert.deepEqual(messages[1], { role: 'assistant', content: 'Halo, ceritakan keluhan Anda.' });
  assert.equal(messages[2].content[0].text, 'Tolong analisis keluhan ini.');
  assert.equal(
    messages[2].content[1].image_url.url,
    `data:image/png;base64,${Buffer.from('fake-image').toString('base64')}`
  );

  const textOnly = buildPublicAiMessages({ prompt: 'Batuk', history: [], systemInstruction: 'S' });
  assert.deepEqual(textOnly.at(-1), { role: 'user', content: 'Batuk' });
});

test('resolvePublicAiProviderError maps image processing failures to a friendly retry message', async () => {
  const { resolvePublicAiProviderError } = await loadProviderModule();

  assert.equal(
    resolvePublicAiProviderError({
      status: 400,
      details: 'Image must have at least 32 pixels in each dimension',
      hasImage: true,
    }),
    'Gambar belum bisa dianalisis. Coba kirim foto yang lebih jelas atau lanjutkan dengan teks saja.'
  );
});
