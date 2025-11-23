import { publicProcedure } from '~/server/trpc';
import {
  getAvailableCurrencies,
  fetchExchangeRates,
} from '~/server/services/converter';
import { createLogger } from '~/server/logger';
import { toTRPCError } from '~/server/utils/error-handler';

const logger = createLogger({ module: 'list-currencies-procedure' });

/**
 * List available currencies procedure
 * Only returns currencies that have exchange rates available
 */
export const listCurrenciesProcedure = publicProcedure.query(async () => {
  logger.debug('Fetching available currencies');
  try {
    const [currencies, rates] = await Promise.all([
      getAvailableCurrencies(),
      fetchExchangeRates(),
    ]);

    // Only return currencies that have exchange rates
    const availableCurrencies = currencies.filter(
      (c) => rates[c.code] !== undefined,
    );

    logger.debug(
      {
        total: currencies.length,
        available: availableCurrencies.length,
      },
      'Filtered currencies with exchange rates',
    );

    return availableCurrencies;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch available currencies');
    throw toTRPCError(
      error,
      'Failed to load available currencies. Please try again later.',
    );
  }
});
