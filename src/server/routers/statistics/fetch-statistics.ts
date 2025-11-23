/**
 * Calculate statistics on-demand from conversions table
 * With proper indexes, this is fast even with large datasets
 * Much more efficient than triggers that run full scans on every insert
 */
import { prisma } from '~/server/prisma';
import { createLogger } from '~/server/logger';

const logger = createLogger({ module: 'fetch-statistics' });

export async function fetchStatistics() {
  // Get total count and most converted currency in a single optimized query
  const [totalConversions, mostConverted] = await Promise.all([
    // Fast count using index
    prisma.conversion.count(),

    // Fast aggregation with index on target_currency
    prisma.conversion.groupBy({
      by: ['targetCurrency'],
      _count: {
        targetCurrency: true,
      },
      _sum: {
        targetAmount: true,
      },
      orderBy: {
        _count: {
          targetCurrency: 'desc',
        },
      },
      take: 1,
    }),
  ]);

  const mostConvertedCurrency = mostConverted[0]?.targetCurrency ?? '';
  const mostConvertedCurrencyAmount = mostConverted[0]?._sum.targetAmount
    ? Number(mostConverted[0]._sum.targetAmount)
    : 0;

  logger.debug(
    {
      totalConversions,
      mostConvertedCurrency,
      mostConvertedCurrencyAmount,
    },
    'Calculated statistics',
  );

  return {
    totalConversions,
    mostConvertedCurrency,
    mostConvertedCurrencyAmount,
    updatedAt: new Date(), // Always current
  };
}
