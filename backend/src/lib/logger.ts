import { isDev } from '../config';

type Level = 'info' | 'warn' | 'error' | 'debug';

const colors: Record<Level, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[90m',
};
const reset = '\x1b[0m';

function format(level: Level, msg: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  const color = isDev ? colors[level] : '';
  const end = isDev ? reset : '';
  const base = `${color}[${ts}] ${level.toUpperCase()}${end}: ${msg}`;
  if (meta !== undefined) {
    const serialised =
      typeof meta === 'string' ? meta : JSON.stringify(meta, null, isDev ? 2 : 0);
    return `${base} ${serialised}`;
  }
  return base;
}

export const logger = {
  info: (msg: string, meta?: unknown) => console.log(format('info', msg, meta)),
  warn: (msg: string, meta?: unknown) => console.warn(format('warn', msg, meta)),
  error: (msg: string, meta?: unknown) => console.error(format('error', msg, meta)),
  debug: (msg: string, meta?: unknown) => {
    if (isDev) console.log(format('debug', msg, meta));
  },
};
