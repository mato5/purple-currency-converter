/**
 * Statistics router for currency conversion analytics
 * Statistics are automatically maintained by database triggers
 */
import { router, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { prisma } from "~/server/prisma";
import { getTimeseriesData } from "~/server/services/converter";

const STATS_ID = "default";

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
        code: "NOT_FOUND",
        message: "Statistics not available",
      });
    }

    return stats;
  }),

  /**
   * Get timeseries data for a given source and target currency
   * Shows the exchange rate between the two currencies over time
   */
  getTimeseriesData: publicProcedure
    .input(
      z.object({
        sourceCurrency: z.string(),
        targetCurrency: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return getTimeseriesData(input);
    }),

  /**
   * Get currency breakdown (aggregated on-demand)
   * Shows conversion count by target currency
   */
  currencyBreakdown: publicProcedure.query(async () => {
    const breakdown = await prisma.conversion.groupBy({
      by: ["targetCurrency"],
      _count: {
        targetCurrency: true,
      },
      orderBy: {
        _count: {
          targetCurrency: "desc",
        },
      },
    });

    return breakdown.map((item) => ({
      currency: item.targetCurrency,
      count: item._count.targetCurrency,
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
        createdAt: "asc",
      },
    });

    // Group by date
    const dailyCounts: Record<string, number> = {};
    conversions.forEach((conversion) => {
      const date = conversion.createdAt.toISOString().split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    return Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));
  }),

  /**
   * Get historical exchange rate timeseries from ECB
   * Returns empty array if data is not available for the currency pair
   */
  timeseries: publicProcedure
    .input(
      z.object({
        sourceCurrency: z.string().length(3).toUpperCase(),
        targetCurrency: z.string().length(3).toUpperCase(),
        days: z.number().int().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      return await getTimeseriesData({
        sourceCurrency: input.sourceCurrency,
        targetCurrency: input.targetCurrency,
        startDate,
        endDate,
      });
    }),
});
