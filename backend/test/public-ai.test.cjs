const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadPublicAiModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '../src/modules/public/public-ai.ts')).href;
  return import(moduleUrl);
}

test('buildPublicAiPrompt keeps mild cases focused on self-care before referral', async () => {
  const { buildPublicAiPrompt } = await loadPublicAiModule();
  const prompt = buildPublicAiPrompt('Saya pilek ringan 1 hari tanpa sesak');

  assert.match(prompt, /maksimal 980 karakter/i);
  assert.match(prompt, /Sarankan ke dokter hanya jika ada tanda bahaya/i);
  assert.match(
    prompt,
    /Jangan mendorong periksa ke dokter terlalu cepat untuk keluhan ringan yang masih wajar dipantau di rumah/i
  );
});

test('finalizePublicAiReply keeps response concise and readable', async () => {
  const { PUBLIC_AI_MAX_REPLY_CHARS, finalizePublicAiReply } = await loadPublicAiModule();
  const longReply = `
    Flu ringan sering membaik dengan istirahat cukup, cairan yang banyak, dan makan teratur.
    Anda bisa memantau demam, sesak, dan apakah lendir makin kental atau berbau.
    Bila hidung tersumbat, coba uap hangat dan bilas hidung dengan saline.
    Jika muncul sesak, nyeri dada, bingung, bibir kebiruan, atau demam tinggi menetap, segera cari pertolongan.
    Flu ringan sering membaik dengan istirahat cukup, cairan yang banyak, dan makan teratur.
    Anda bisa memantau demam, sesak, dan apakah lendir makin kental atau berbau.
    Bila hidung tersumbat, coba uap hangat dan bilas hidung dengan saline.
    Jika muncul sesak, nyeri dada, bingung, bibir kebiruan, atau demam tinggi menetap, segera cari pertolongan.
  `;

  const result = finalizePublicAiReply(longReply);

  assert.ok(result.length <= PUBLIC_AI_MAX_REPLY_CHARS);
  assert.match(result, /[.!?]$/);
  assert.doesNotMatch(result, /\*\*/);
});
