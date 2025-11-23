import { publicProcedure } from '~/server/trpc';
import { createLogger } from '~/server/logger';
import { fetchStatistics } from './fetch-statistics';

const logger = createLogger({ module: 'on-update-procedure' });

/**
 * Real-time statistics subscription procedure
 * Uses simple polling to yield current statistics every 3 seconds
 * Uses SSE (Server-Sent Events) for real-time updates
 *
 * Note: Most updates will come from the conversion mutation response,
 * this subscription is mainly for keeping multiple clients in sync
 */
export const onConversionAddedProcedure = publicProcedure.subscription(
  async function* (opts) {
    logger.info('Statistics subscription started');

    try {
      // Immediately yield initial statistics
      yield await fetchStatistics();

      // Simple polling loop - yield updated statistics every 3 seconds
      while (!opts.signal?.aborted) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        if (!opts.signal?.aborted) {
          const stats = await fetchStatistics();
          logger.debug(
            {
              totalConversions: stats.totalConversions,
              mostConvertedCurrency: stats.mostConvertedCurrency,
            },
            'Yielding statistics update',
          );
          yield stats;
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error in statistics subscription');
      throw error;
    } finally {
      logger.info('Statistics subscription ended');
    }
  },
);
