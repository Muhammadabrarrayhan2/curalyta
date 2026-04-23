const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadUploadModule() {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '../src/components/public/public-ai-upload.ts')
  ).href;
  return import(moduleUrl);
}

test('validatePublicAiImageFile accepts png and rejects unsupported or oversized files', async () => {
  const { PUBLIC_AI_IMAGE_MAX_MB, validatePublicAiImageFile } = await loadUploadModule();

  assert.equal(
    validatePublicAiImageFile({ type: 'image/png', size: 1024 }).ok,
    true
  );

  assert.equal(
    validatePublicAiImageFile({ type: 'image/gif', size: 1024 }).message,
    'Format gambar belum didukung. Gunakan JPG, PNG, atau WEBP.'
  );

  assert.equal(
    validatePublicAiImageFile({
      type: 'image/jpeg',
      size: (PUBLIC_AI_IMAGE_MAX_MB + 1) * 1024 * 1024,
    }).message,
    `Ukuran gambar terlalu besar. Maksimal ${PUBLIC_AI_IMAGE_MAX_MB}MB.`
  );
});

test('buildPublicAiRequestPayload keeps json for text-only and form-data for image requests', async () => {
  const { buildPublicAiRequestPayload } = await loadUploadModule();
  const history = [{ role: 'user', content: 'Kulit saya gatal.' }];

  const textPayload = buildPublicAiRequestPayload({
    message: 'Apa yang harus saya lakukan?',
    history,
  });

  assert.equal(textPayload.kind, 'json');
  assert.deepEqual(textPayload.data, {
    message: 'Apa yang harus saya lakukan?',
    history,
  });

  const imagePayload = buildPublicAiRequestPayload({
    message: 'Tolong lihat ini.',
    history,
    imageFile: new File(['halo'], 'ruam.png', { type: 'image/png' }),
  });

  assert.equal(imagePayload.kind, 'form-data');
  assert.equal(imagePayload.data.get('message'), 'Tolong lihat ini.');
  assert.equal(imagePayload.data.get('history'), JSON.stringify(history));
  assert.equal(imagePayload.data.get('image').name, 'ruam.png');
});
