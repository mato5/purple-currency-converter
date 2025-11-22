/**
 * Statistics router for currency conversion analytics
 * Statistics are automatically maintained by database triggers
 */
import { router, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { prisma } from '~/server/prisma';

const STATS_ID = 'default';

export const statisticsRouter = router({
  /**
   * Get current statistics
   * This is very fast as statistics are pre-calculated by triggers
   */
  get: publicProcedure.query(async () => {
    const stats = await prisma.statistic.findUnique({
      where: { id: STATS_ID },
      select: {
        totalConversions: true,
        mostConvertedCurrency: true,
        mostConvertedCurrencyAmount: true,
        updatedAt: true,
      },
    });

    if (!stats) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Statistics not available',
      });
    }

    return stats;
  }),

  /**
   * Get currency breakdown (aggregated on-demand)
   * Shows conversion count by currency
   */
  currencyBreakdown: publicProcedure.query(async () => {
    const breakdown = await prisma.conversion.groupBy({
      by: ['sourceCurrency'],
      _count: {
        sourceCurrency: true,
      },
      orderBy: {
        _count: {
          sourceCurrency: 'desc',
        },
      },
    });

    return breakdown.map((item) => ({
      currency: item.sourceCurrency,
      count: item._count.sourceCurrency,
    }));
  }),

  /**
   * Get conversion trends (by date)
   * Shows daily conversion volume
   */
  trends: publicProcedure.query(async () => {
    // Get conversions from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const conversions = await prisma.conversion.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
        sourceCurrency: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const dailyCounts: Record<string, number> = {};
    conversions.forEach((conversion) => {
      const date = conversion.createdAt.toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));
  }),
});
