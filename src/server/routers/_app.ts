/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { conversionRouter } from './conversion';
import { statisticsRouter } from './statistics';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  conversion: conversionRouter,
  statistics: statisticsRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
