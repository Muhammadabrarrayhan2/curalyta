const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadEnvPathModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '../src/config/env-path.ts')).href;
  return import(moduleUrl);
}

test('resolveEnvFilePaths prefers backend .env and falls back to repo root .env', async () => {
  const { resolveEnvFilePaths } = await loadEnvPathModule();
  const cwd = path.join('D:', 'curalyta', 'backend');

  const paths = resolveEnvFilePaths(cwd);

  assert.deepEqual(paths, [
    path.join('D:', 'curalyta', 'backend', '.env'),
    path.join('D:', 'curalyta', '.env'),
  ]);
});

test('resolveEnvFilePaths avoids duplicate root candidates', async () => {
  const { resolveEnvFilePaths } = await loadEnvPathModule();
  const cwd = path.join('D:', 'curalyta');

  const paths = resolveEnvFilePaths(cwd);

  assert.deepEqual(paths, [path.join('D:', 'curalyta', '.env')]);
});
