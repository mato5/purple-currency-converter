/**
 * Fetch pre-calculated statistics from the statistic table
 * Statistics are automatically maintained by database triggers
 * Much faster than on-demand calculation for large datasets
 */
import { config } from '~/server/config';
import { createLogger } from '~/server/logger';
import { prisma } from '~/server/prisma';

const logger = createLogger({ module: 'fetch-statistics' });

export async function fetchStatistics() {
  // Fetch the singleton statistic row
  // This is maintained by triggers and always up-to-date
  const statistic = await prisma.statistic.findUnique({
    where: { id: config.database.statisticSingletonId },
  });

  // If no statistics exist yet, return defaults
  if (!statistic) {
    logger.warn('No statistics found, returning defaults');
    return {
      totalConversions: 0,
      mostConvertedCurrency: '',
      mostConvertedCurrencyAmount: 0,
      updatedAt: new Date(),
    };
  }

  // Convert stored values to appropriate types
  const totalConversions = Number(statistic.totalConversions);
  const mostConvertedCurrencyAmount = Number(
    statistic.mostConvertedCurrencyAmount,
  );

  logger.debug(
    {
      totalConversions,
      mostConvertedCurrency: statistic.mostConvertedCurrency,
      mostConvertedCurrencyAmount,
    },
    'Fetched statistics from database',
  );

  return {
    totalConversions,
    mostConvertedCurrency: statistic.mostConvertedCurrency,
    mostConvertedCurrencyAmount,
    updatedAt: statistic.createdAt,
  };
}
