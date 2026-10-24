const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Absolute, platform-neutral root (D:\ on Windows, / on Linux CI)
const ROOT = path.resolve(path.parse(process.cwd()).root, 'curalyta');

async function loadEnvPathModule() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '../src/config/env-path.ts')).href;
  return import(moduleUrl);
}

test('resolveEnvFilePaths prefers backend .env and falls back to repo root .env', async () => {
  const { resolveEnvFilePaths } = await loadEnvPathModule();
  const cwd = path.join(ROOT, 'backend');

  const paths = resolveEnvFilePaths(cwd);

  assert.deepEqual(paths, [
    path.join(ROOT, 'backend', '.env'),
    path.join(ROOT, '.env'),
  ]);
});

test('resolveEnvFilePaths avoids duplicate root candidates', async () => {
  const { resolveEnvFilePaths } = await loadEnvPathModule();
  const cwd = path.join(ROOT);

  const paths = resolveEnvFilePaths(cwd);

  assert.deepEqual(paths, [path.join(ROOT, '.env')]);
});
