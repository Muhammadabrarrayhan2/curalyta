const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadHealthModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '../src/lib/health.ts')).href;
  return import(moduleUrl);
}

test('checkHealth reports ok with database latency when ping succeeds', async () => {
  const { checkHealth } = await loadHealthModule();

  const result = await checkHealth({ ping: async () => undefined });

  assert.equal(result.httpStatus, 200);
  assert.equal(result.body.status, 'ok');
  assert.equal(result.body.database.status, 'up');
  assert.equal(typeof result.body.database.latencyMs, 'number');
  assert.equal(typeof result.body.responseTimeMs, 'number');
  assert.ok(result.body.timestamp);
});

test('checkHealth returns 503 and hides driver details when ping fails', async () => {
  const { checkHealth } = await loadHealthModule();

  const result = await checkHealth({
    ping: async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.5:5432 password=secret');
    },
  });

  assert.equal(result.httpStatus, 503);
  assert.equal(result.body.status, 'error');
  assert.equal(result.body.database.status, 'down');
  assert.ok(!JSON.stringify(result.body).includes('secret'));
});

test('checkHealth treats a ping slower than the timeout as down', async () => {
  const { checkHealth } = await loadHealthModule();

  const result = await checkHealth({
    ping: () => new Promise((resolve) => setTimeout(resolve, 200)),
    timeoutMs: 20,
  });

  assert.equal(result.httpStatus, 503);
  assert.equal(result.body.database.status, 'down');
});
