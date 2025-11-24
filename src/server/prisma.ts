import { PrismaClient } from '@prisma/client';

import { config } from './config';

export const prisma: PrismaClient = new PrismaClient({
  log:
    config.logging.level === 'debug' ? ['query', 'error', 'warn'] : ['error'],
});
