/**
 * Conversion router for managing currency conversions
 */
import { router, publicProcedure } from '../trpc';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import {
  convertCurrency,
  getAvailableCurrencies,
} from '~/server/services/converter';

const defaultConversionSelect = {
  id: true,
  sourceAmount: true,
  sourceCurrency: true,
  targetAmount: true,
  targetCurrency: true,
  createdAt: true,
} satisfies Prisma.ConversionSelect;

export const conversionRouter = router({
  /**
   * List conversions with pagination
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const limit = input.limit ?? 20;
      const { cursor } = input;

      const items = await prisma.conversion.findMany({
        select: defaultConversionSelect,
        take: limit + 1,
        where: {},
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop()!;
        nextCursor = nextItem.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  /**
   * Get a conversion by ID
   */
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const conversion = await prisma.conversion.findUnique({
        where: { id: input.id },
        select: defaultConversionSelect,
      });

      if (!conversion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Conversion with id '${input.id}' not found`,
        });
      }

      return conversion;
    }),

  /**
   * List available currencies
   */
  listCurrencies: publicProcedure.query(async () => {
    return getAvailableCurrencies();
  }),

  /**
   * Create a new conversion
   * Statistics are automatically updated by database trigger
   */
  add: publicProcedure
    .input(
      z.object({
        sourceAmount: z.number().int().positive(),
        sourceCurrency: z.string().length(3).toUpperCase(),
        targetCurrency: z.string().length(3).toUpperCase(),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.sourceCurrency === input.targetCurrency) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Source and target currencies must be different',
        });
      }

      // Perform currency conversion using external API
      const conversionResult = await convertCurrency(
        input.sourceAmount,
        input.sourceCurrency,
        input.targetCurrency,
      );

      // Save conversion to database
      const conversion = await prisma.conversion.create({
        data: {
          sourceAmount: conversionResult.sourceAmount,
          sourceCurrency: conversionResult.sourceCurrency,
          targetAmount: conversionResult.targetAmount,
          targetCurrency: conversionResult.targetCurrency,
        },
        select: defaultConversionSelect,
      });

      return conversion;
    }),

  /**
   * Delete a conversion
   * Statistics are automatically updated by database trigger
   */
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const conversion = await prisma.conversion.delete({
        where: { id: input.id },
        select: defaultConversionSelect,
      });

      return conversion;
    }),

  /**
   * Get conversions by currency
   */
  byCurrency: publicProcedure
    .input(
      z.object({
        currency: z.string().length(3).toUpperCase(),
        type: z.enum(['source', 'target']).default('source'),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
      const where =
        input.type === 'source'
          ? { sourceCurrency: input.currency }
          : { targetCurrency: input.currency };

      const conversions = await prisma.conversion.findMany({
        where,
        select: defaultConversionSelect,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      });

      return conversions;
    }),
});
