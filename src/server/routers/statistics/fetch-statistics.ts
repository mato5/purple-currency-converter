/**
 * Calculate statistics on-demand from conversions table
 * With proper indexes, this is fast even with large datasets
 * Much more efficient than triggers that run full scans on every insert
 */
import { Prisma } from '@prisma/client';

import { createLogger } from '~/server/logger';
import { prisma } from '~/server/prisma';

const logger = createLogger({ module: 'fetch-statistics' });

/**
 * Type for raw SQL query result
 */
type MostConvertedCurrencyRow = {
  targetCurrency: string;
  count: bigint;
  total: number; // REAL from SQLite (floating-point)
};

export async function fetchStatistics() {
  // Get total count and most converted currency in a single optimized query
  const [totalConversions, mostConvertedRaw] = await Promise.all([
    // Fast count using index
    prisma.conversion.count(),

    // Use raw SQL with CAST to REAL for large sum aggregation
    // This prevents integer overflow by using floating-point arithmetic
    // IMPORTANT: Cast BEFORE summing to avoid BigInt overflow
    // Can handle sums up to ~10^308 (vs BigInt's 2^63-1 = ~10^18)
    prisma.$queryRaw<MostConvertedCurrencyRow[]>(
      Prisma.sql`
        SELECT 
          target_currency as targetCurrency,
          COUNT(*) as count,
          SUM(CAST(target_amount as REAL)) as total
        FROM conversion
        GROUP BY target_currency
        ORDER BY count DESC
        LIMIT 1
      `,
    ),
  ]);

  const mostConvertedCurrency = mostConvertedRaw[0]?.targetCurrency ?? '';
  // Round back to integer for display (acceptable precision loss at extreme values)
  const mostConvertedCurrencyAmount = mostConvertedRaw[0]?.total
    ? Math.round(mostConvertedRaw[0].total)
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
