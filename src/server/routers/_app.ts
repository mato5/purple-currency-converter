/**
 * This file contains the root router of your tRPC-backend
 */
import { config } from '~/server/config';
import { createLogger } from '~/server/logger';
import { createCallerFactory, publicProcedure, router } from '~/server/trpc';

import { conversionRouter } from './conversion/router';
import { statisticsRouter } from './statistics/router';

const logger = createLogger({ module: 'app-router' });

export const appRouter = router({
  /**
   * Healthcheck endpoint
   * Returns service status and environment info
   */
  healthcheck: publicProcedure.query(() => {
    logger.debug('Healthcheck called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    };
  }),

  conversion: conversionRouter,
  statistics: statisticsRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
