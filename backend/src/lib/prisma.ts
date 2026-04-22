import { PrismaClient } from '@prisma/client';
import { isDev } from '../config';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isDev ? ['error', 'warn'] : ['error'],
  });

if (isDev) {
  global.__prisma = prisma;
}
