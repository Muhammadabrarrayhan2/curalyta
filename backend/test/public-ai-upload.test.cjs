const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadUploadModule() {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '../src/modules/public/public-ai-upload.ts')
  ).href;
  return import(moduleUrl);
}

test('parsePublicAiHistoryInput accepts multipart JSON history strings', async () => {
  const { parsePublicAiHistoryInput } = await loadUploadModule();

  const history = parsePublicAiHistoryInput(
    JSON.stringify([{ role: 'user', content: 'Kulit saya gatal.' }])
  );

  assert.deepEqual(history, [{ role: 'user', content: 'Kulit saya gatal.' }]);
});

test('buildPublicAiPayload allows image-only requests but rejects fully empty submissions', async () => {
  const { buildPublicAiPayload } = await loadUploadModule();

  const imageOnlyPayload = buildPublicAiPayload({
    body: { message: '', history: '[]' },
    file: {
      originalname: 'ruam.png',
      mimetype: 'image/png',
      size: 128,
      buffer: Buffer.from('ruam'),
    },
  });

  assert.equal(imageOnlyPayload.message, '');
  assert.equal(imageOnlyPayload.image.mimeType, 'image/png');

  assert.throws(
    () =>
      buildPublicAiPayload({
        body: { message: '   ', history: '[]' },
      }),
    /Tulis pertanyaan atau tambahkan gambar dulu/i
  );
});

test('isAllowedPublicAiImageMime only accepts jpg png and webp', async () => {
  const { isAllowedPublicAiImageMime } = await loadUploadModule();

  assert.equal(isAllowedPublicAiImageMime('image/jpeg'), true);
  assert.equal(isAllowedPublicAiImageMime('image/png'), true);
  assert.equal(isAllowedPublicAiImageMime('image/webp'), true);
  assert.equal(isAllowedPublicAiImageMime('image/gif'), false);
  assert.equal(isAllowedPublicAiImageMime('application/pdf'), false);
});
