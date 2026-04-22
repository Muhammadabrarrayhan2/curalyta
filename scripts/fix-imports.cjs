#!/usr/bin/env node
/**
 * Convert all `@/...` imports in backend/src to relative paths.
 * This removes runtime dependency on path alias resolution.
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'backend', 'src');

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) yield full;
  }
}

function toRelative(fromFile, aliasTargetFromSrc) {
  const fromDir = path.dirname(fromFile);
  const target = path.join(SRC_DIR, aliasTargetFromSrc);
  let rel = path.relative(fromDir, target).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

let totalFiles = 0;
let totalReplacements = 0;

// Matches:  from '@/foo/bar'  |  from "@/foo/bar"
// Also:  import('@/foo/bar')
const RE = /(from\s+|import\s*\(\s*)(['"])@\/([^'"]+)\2/g;

for (const file of walk(SRC_DIR)) {
  const original = fs.readFileSync(file, 'utf8');
  let count = 0;
  const updated = original.replace(RE, (match, prefix, quote, target) => {
    count++;
    const rel = toRelative(file, target);
    return `${prefix}${quote}${rel}${quote}`;
  });

  if (count > 0) {
    fs.writeFileSync(file, updated);
    totalFiles++;
    totalReplacements += count;
    console.log(`  ✓ ${path.relative(SRC_DIR, file)} — ${count} imports`);
  }
}

console.log(`\n✅ Done: ${totalReplacements} imports rewritten across ${totalFiles} files`);
