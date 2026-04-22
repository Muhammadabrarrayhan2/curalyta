const test = require('node:test');
const assert = require('node:assert/strict');

const {
  PUBLIC_AI_MAX_REPLY_CHARS,
  buildPublicAiPrompt,
  finalizePublicAiReply,
} = require('../dist/modules/public/public-ai.js');

test('buildPublicAiPrompt keeps mild cases focused on self-care before referral', () => {
  const prompt = buildPublicAiPrompt('Saya pilek ringan 1 hari tanpa sesak');

  assert.match(prompt, /maksimal 980 karakter/i);
  assert.match(prompt, /Sarankan ke dokter hanya bila ada tanda bahaya/i);
  assert.match(
    prompt,
    /Untuk keluhan ringan yang masih wajar dipantau, jangan langsung mengarahkan ke dokter/i
  );
});

test('finalizePublicAiReply keeps response concise and readable', () => {
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
