// @ts-check

import { NextConfig } from 'next';

/**
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
export default {
  /**
   * Server-only packages that should not be bundled by webpack/turbopack
   * This prevents Next.js from trying to bundle server-only dependencies like pino
   */
  serverExternalPackages: [
    'pino',
    'pino-http',
    'pino-pretty',
    'thread-stream',
    '@prisma/client',
    'prisma',
  ],
} satisfies NextConfig;
