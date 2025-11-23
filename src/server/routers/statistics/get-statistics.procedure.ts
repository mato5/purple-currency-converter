/**
 * Get current statistics procedure
 * This is very fast as statistics are calculated on-demand with indexed queries
 */
import { publicProcedure } from '~/server/trpc';
import { TRPCError } from '@trpc/server';
import { createLogger } from '~/server/logger';
import { fetchStatistics } from './fetch-statistics';

const logger = createLogger({ module: 'get-statistics-procedure' });

export const getStatisticsProcedure = publicProcedure.query(async () => {
  logger.debug('Fetching statistics');
  try {
    return await fetchStatistics();
  } catch (error) {
    logger.error({ error }, 'Failed to fetch statistics');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to load statistics. Please try again later.',
      cause: error,
    });
  }
});
