import { createLogger } from '~/server/logger';
import { getAvailableCurrencies } from '~/server/services/converter';
import { publicProcedure } from '~/server/trpc';
import { toTRPCError } from '~/server/utils/error-handler';

const logger = createLogger({ module: 'list-currencies-procedure' });

/**
 * List available currencies procedure
 * Only returns currencies that have exchange rates available
 */
export const listCurrenciesProcedure = publicProcedure.query(async () => {
  logger.debug('Fetching available currencies');
  try {
    const availableCurrencies = await getAvailableCurrencies();

    return availableCurrencies;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch available currencies');
    throw toTRPCError(
      error,
      'Failed to load available currencies. Please try again later.',
    );
  }
});
