import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { conversionInputSchema } from '~/lib/validation';
import { createLogger } from '~/server/logger';
import { prisma } from '~/server/prisma';
import { convertCurrency } from '~/server/services/converter';
import { publicProcedure } from '~/server/trpc';
import { toTRPCError } from '~/server/utils/error-handler';

import { fetchStatistics } from '../statistics/fetch-statistics';

const logger = createLogger({ module: 'add-conversion-procedure' });

const defaultConversionSelect = {
  id: true,
  sourceAmount: true,
  sourceCurrency: true,
  targetAmount: true,
  targetCurrency: true,
  createdAt: true,
} satisfies Prisma.ConversionSelect;

/**
 * Add conversion procedure
 * Creates a new currency conversion and returns the result with updated statistics
 */
export const addConversionProcedure = publicProcedure
  .input(conversionInputSchema)
  .mutation(async ({ input }) => {
    try {
      if (input.sourceCurrency === input.targetCurrency) {
        logger.warn(
          { sourceCurrency: input.sourceCurrency },
          'Attempted conversion with same source and target currency',
        );
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Source and target currencies must be different',
        });
      }

      logger.info(
        {
          sourceAmount: input.sourceAmount,
          sourceCurrency: input.sourceCurrency,
          targetCurrency: input.targetCurrency,
        },
        'Creating conversion',
      );

      // Perform currency conversion using external API
      const conversionResult = await convertCurrency(
        input.sourceAmount,
        input.sourceCurrency,
        input.targetCurrency,
      );

      // Save conversion to database
      // Convert numbers to strings for storage to prevent overflow
      // SQLite triggers run synchronously within the transaction
      const conversion = await prisma.conversion.create({
        data: {
          sourceAmount: conversionResult.sourceAmount.toString(),
          sourceCurrency: conversionResult.sourceCurrency,
          targetAmount: conversionResult.targetAmount.toString(),
          targetCurrency: conversionResult.targetCurrency,
        },
        select: defaultConversionSelect,
      });

      logger.info(
        { conversionId: conversion.id },
        'Conversion created successfully',
      );

      const statistics = await fetchStatistics();

      logger.debug(
        { totalConversions: statistics.totalConversions },
        'Fetched updated statistics',
      );

      return {
        conversion: {
          ...conversion,
          sourceAmount: Number(conversion.sourceAmount),
          targetAmount: Number(conversion.targetAmount),
        },
        statistics,
      };
    } catch (error) {
      // Log and wrap errors
      logger.error({ error, input }, 'Conversion failed');
      throw toTRPCError(error, 'Conversion failed. Please try again later.');
    }
  });
