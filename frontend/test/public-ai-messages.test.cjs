const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadMessageModule() {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '../src/components/public/public-ai-messages.ts')
  ).href;
  return import(moduleUrl);
}

test('resolvePublicAiErrorMessage keeps specific backend message when available', async () => {
  const { FALLBACK_PUBLIC_AI_ERROR_MESSAGE, resolvePublicAiErrorMessage } =
    await loadMessageModule();

  assert.equal(
    resolvePublicAiErrorMessage('Tanya AI sedang tidak tersedia. Silakan coba lagi sebentar lagi.'),
    'Tanya AI sedang tidak tersedia. Silakan coba lagi sebentar lagi.'
  );
  assert.notEqual(
    resolvePublicAiErrorMessage('Tanya AI sedang tidak tersedia. Silakan coba lagi sebentar lagi.'),
    FALLBACK_PUBLIC_AI_ERROR_MESSAGE
  );
});

test('resolvePublicAiErrorMessage falls back when backend message is empty', async () => {
  const { FALLBACK_PUBLIC_AI_ERROR_MESSAGE, resolvePublicAiErrorMessage } =
    await loadMessageModule();

  assert.equal(resolvePublicAiErrorMessage(''), FALLBACK_PUBLIC_AI_ERROR_MESSAGE);
});

test('resolvePublicAiErrorMessage keeps specific image-analysis guidance from backend', async () => {
  const { resolvePublicAiErrorMessage } = await loadMessageModule();

  assert.equal(
    resolvePublicAiErrorMessage(
      'Gambar belum bisa dianalisis. Coba kirim foto yang lebih jelas atau lanjutkan dengan teks saja.'
    ),
    'Gambar belum bisa dianalisis. Coba kirim foto yang lebih jelas atau lanjutkan dengan teks saja.'
  );
});
