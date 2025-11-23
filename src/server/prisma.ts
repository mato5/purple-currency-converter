import { config } from './config';
import { PrismaClient } from '@prisma/client';

export const prisma: PrismaClient = new PrismaClient({
  log:
    config.logging.level === 'debug' ? ['query', 'error', 'warn'] : ['error'],
});
