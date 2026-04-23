const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadPublicAiModule() {
  const moduleUrl = pathToFileURL(
    path.join(__dirname, '../src/modules/public/public-ai.ts')
  ).href;
  return import(moduleUrl);
}

test('public AI system instruction encourages natural follow-up, focused causes, and OTC guidance', async () => {
  const { PUBLIC_AI_SYSTEM_INSTRUCTION } = await loadPublicAiModule();

  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /jangan mengulang salam/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /hindari interjeksi seperti "wah"/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /kemungkinan penyebab yang paling umum/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /hindari istilah kabur seperti "masuk angin"/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /obat bebas umum/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /parasetamol/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /saline/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /antihistamin/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /oralit/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /sarankan ke dokter hanya jika ada tanda bahaya/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /belum perlu ke dokter dulu/i);
  assert.match(PUBLIC_AI_SYSTEM_INSTRUCTION, /jika ada gambar/i);
});

test('buildPublicAiPrompt asks the model to continue the current conversation naturally', async () => {
  const { buildPublicAiPrompt } = await loadPublicAiModule();

  const prompt = buildPublicAiPrompt('Apa beda flu, alergi, dan sinusitis?');

  assert.match(prompt, /gunakan konteks riwayat percakapan/i);
  assert.match(prompt, /jangan ulangi salam/i);
  assert.match(prompt, /kemungkinan penyebab/i);
  assert.match(prompt, /obat bebas\/opsi pereda/i);
});

test('buildPublicAiPromptWithOptions adds image guidance when a photo is attached', async () => {
  const { buildPublicAiPromptWithOptions } = await loadPublicAiModule();

  const prompt = buildPublicAiPromptWithOptions('Tolong lihat ruam ini.', {
    hasImage: true,
  });

  assert.match(prompt, /gabungkan informasi dari foto dan keluhan pengguna/i);
  assert.match(prompt, /jika foto kurang jelas/i);
});

test('buildPublicAiCaseHint adds specific guidance for common cough and comparison questions', async () => {
  const { buildPublicAiCaseHint } = await loadPublicAiModule();

  const coughHint = buildPublicAiCaseHint(
    'Saya batuk dan pilek 3 hari, belum demam, obat apa yang bisa dicoba dulu?'
  );
  const compareHint = buildPublicAiCaseHint('Apa beda gejala flu, alergi, dan sinusitis?');

  assert.match(coughHint, /common cold/i);
  assert.match(coughHint, /saline spray/i);
  assert.match(compareHint, /demam, pegal, lemas/i);
  assert.match(compareHint, /jangan langsung menyebut sinusitis sebagai infeksi bakteri/i);
});

test('finalizePublicAiReply strips repeated greeting on follow-up turns', async () => {
  const { finalizePublicAiReply } = await loadPublicAiModule();

  const result = finalizePublicAiReply(
    'Wah, semoga gatalnya segera reda ya. Keluhan ini paling sering terkait iritasi ringan. Coba kompres dingin dan gunakan pelembap.',
    { hasHistory: true }
  );

  assert.doesNotMatch(result, /^(Halo|Wah)/i);
  assert.match(result, /iritasi ringan/i);
});

test('finalizePublicAiReply keeps opening greeting on the first turn', async () => {
  const { finalizePublicAiReply } = await loadPublicAiModule();

  const result = finalizePublicAiReply(
    'Halo! Keluhan ini paling sering terkait iritasi ringan. Coba kompres dingin dan gunakan pelembap.'
  );

  assert.match(result, /^Halo!/i);
});

test('modelSupportsPublicAiSystemInstruction only enables system instruction for Gemini models', async () => {
  const { modelSupportsPublicAiSystemInstruction } = await loadPublicAiModule();

  assert.equal(modelSupportsPublicAiSystemInstruction('gemini-2.5-flash'), true);
  assert.equal(modelSupportsPublicAiSystemInstruction('gemma-3-27b-it'), false);
});
