import path from 'path';

export function resolveEnvFilePaths(cwd = process.cwd()): string[] {
  const candidates = [path.resolve(cwd, '.env')];

  if (path.basename(cwd) !== 'backend') {
    return candidates;
  }

  const parentEnv = path.resolve(cwd, '..', '.env');
  if (!candidates.includes(parentEnv)) {
    candidates.push(parentEnv);
  }

  return candidates;
}
