const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadGroqModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '../src/lib/groq.ts')).href;
  return import(moduleUrl);
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function okReply(text) {
  return jsonResponse(200, { choices: [{ message: { role: 'assistant', content: text } }] });
}

test('parseGroqApiKeys splits comma/newline lists, trims, and dedupes', async () => {
  const { parseGroqApiKeys } = await loadGroqModule();

  assert.deepEqual(parseGroqApiKeys(' gsk_a , gsk_b\ngsk_a,,  '), ['gsk_a', 'gsk_b']);
  assert.deepEqual(parseGroqApiKeys(''), []);
});

test('createGroqKeyRotator hands out keys round-robin', async () => {
  const { createGroqKeyRotator } = await loadGroqModule();
  const rotator = createGroqKeyRotator(['k1', 'k2', 'k3']);

  assert.deepEqual(
    [rotator.order(), rotator.order(), rotator.order(), rotator.order()].map((o) => o[0]),
    ['k1', 'k2', 'k3', 'k1']
  );
  assert.deepEqual(rotator.order(), ['k2', 'k3', 'k1']);
});

test('groqChatCompletion rotates successive requests across keys', async () => {
  const { groqChatCompletion, createGroqKeyRotator } = await loadGroqModule();
  const rotator = createGroqKeyRotator(['k1', 'k2']);
  const usedKeys = [];

  const fetchImpl = async (_url, init) => {
    usedKeys.push(init.headers.Authorization);
    return okReply('halo');
  };

  for (let i = 0; i < 3; i += 1) {
    await groqChatCompletion({
      rotator,
      model: 'm',
      messages: [{ role: 'user', content: 'hi' }],
      fetchImpl,
    });
  }

  assert.deepEqual(usedKeys, ['Bearer k1', 'Bearer k2', 'Bearer k1']);
});

test('groqChatCompletion fails over to the next key on 429 and 401', async () => {
  const { groqChatCompletion, createGroqKeyRotator } = await loadGroqModule();
  const rotator = createGroqKeyRotator(['k1', 'k2', 'k3']);
  const usedKeys = [];
  const statuses = [429, 401, 200];

  const fetchImpl = async (_url, init) => {
    usedKeys.push(init.headers.Authorization);
    const status = statuses.shift();
    return status === 200 ? okReply('berhasil') : jsonResponse(status, { error: { message: 'x' } });
  };

  const text = await groqChatCompletion({
    rotator,
    model: 'm',
    messages: [{ role: 'user', content: 'hi' }],
    fetchImpl,
    retryDelayMs: 0,
  });

  assert.equal(text, 'berhasil');
  assert.deepEqual(usedKeys, ['Bearer k1', 'Bearer k2', 'Bearer k3']);
});

test('groqChatCompletion does not rotate on a 400 request error', async () => {
  const { groqChatCompletion, createGroqKeyRotator, GroqApiError } = await loadGroqModule();
  const rotator = createGroqKeyRotator(['k1', 'k2']);
  let calls = 0;

  const fetchImpl = async () => {
    calls += 1;
    return jsonResponse(400, { error: { message: 'bad image' } });
  };

  await assert.rejects(
    groqChatCompletion({ rotator, model: 'm', messages: [], fetchImpl }),
    (err) => err instanceof GroqApiError && err.status === 400 && err.details.includes('bad image')
  );
  assert.equal(calls, 1);
});

test('groqChatCompletion throws the last error after every key fails', async () => {
  const { groqChatCompletion, createGroqKeyRotator, GroqApiError } = await loadGroqModule();
  const rotator = createGroqKeyRotator(['k1', 'k2']);
  let calls = 0;

  const fetchImpl = async () => {
    calls += 1;
    return jsonResponse(429, { error: { message: 'rate limit' } });
  };

  await assert.rejects(
    groqChatCompletion({ rotator, model: 'm', messages: [], fetchImpl, retryDelayMs: 0 }),
    (err) => err instanceof GroqApiError && err.status === 429
  );
  assert.equal(calls, 2);
});

test('groqChatCompletion strips <think> reasoning blocks from replies', async () => {
  const { groqChatCompletion, createGroqKeyRotator } = await loadGroqModule();

  const text = await groqChatCompletion({
    rotator: createGroqKeyRotator(['k1']),
    model: 'm',
    messages: [],
    fetchImpl: async () => okReply('<think>analisis internal</think>\n\nJawaban akhir.'),
  });

  assert.equal(text, 'Jawaban akhir.');
});

test('buildGroqRequestBody adds low reasoning effort only for gpt-oss models', async () => {
  const { buildGroqRequestBody } = await loadGroqModule();

  const oss = buildGroqRequestBody({ model: 'openai/gpt-oss-120b', messages: [], maxTokens: 100 });
  const qwen = buildGroqRequestBody({ model: 'qwen/qwen3.8-27b', messages: [], maxTokens: 100 });

  assert.equal(oss.reasoning_effort, 'low');
  assert.equal(qwen.reasoning_effort, undefined);
  assert.equal(qwen.max_tokens, 100);
});

test('groqChatCompletion fails over to the next key after a transient network error', async () => {
  const { groqChatCompletion, createGroqKeyRotator } = await loadGroqModule();
  let calls = 0;

  const text = await groqChatCompletion({
    rotator: createGroqKeyRotator(['k1', 'k2']),
    model: 'm',
    messages: [],
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
      }
      return okReply('pulih');
    },
  });

  assert.equal(text, 'pulih');
  assert.equal(calls, 2);
});
