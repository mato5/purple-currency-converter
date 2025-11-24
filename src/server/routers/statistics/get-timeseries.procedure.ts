/**
 * Get historical exchange rate timeseries procedure
 * Returns empty array if data is not available for the currency pair
 */
import { TRPCError } from '@trpc/server';

import { timeseriesInputSchema } from '~/lib/validation';
import { createLogger } from '~/server/logger';
import { getTimeseriesData } from '~/server/services/converter';
import { publicProcedure } from '~/server/trpc';

const logger = createLogger({ module: 'get-timeseries-procedure' });

export const getTimeseriesProcedure = publicProcedure
  .input(timeseriesInputSchema)
  .query(async ({ input }) => {
    logger.debug(
      {
        sourceCurrency: input.sourceCurrency,
        targetCurrency: input.targetCurrency,
        days: input.days,
      },
      'Fetching timeseries data',
    );

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      return await getTimeseriesData({
        sourceCurrency: input.sourceCurrency,
        targetCurrency: input.targetCurrency,
        startDate,
        endDate,
      });
    } catch (error) {
      logger.error({ error, input }, 'Failed to fetch timeseries data');
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load chart data. Please try again later.',
        cause: error,
      });
    }
  });
