/**
 * Get historical exchange rate timeseries procedure
 * Returns empty array if data is not available for the currency pair
 */
import { publicProcedure } from '~/server/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  getTimeseriesData,
  isValidCurrencyCode,
} from '~/server/services/converter';
import { createLogger } from '~/server/logger';

const logger = createLogger({ module: 'get-timeseries-procedure' });

export const getTimeseriesProcedure = publicProcedure
  .input(
    z.object({
      sourceCurrency: z
        .string()
        .toUpperCase()
        .refine(isValidCurrencyCode, 'Invalid source currency code'),
      targetCurrency: z
        .string()
        .toUpperCase()
        .refine(isValidCurrencyCode, 'Invalid target currency code'),
      days: z.number().int().min(1).max(365).default(30),
    }),
  )
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
