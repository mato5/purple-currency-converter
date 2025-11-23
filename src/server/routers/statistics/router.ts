/**
 * Statistics router for currency conversion analytics
 * Statistics are calculated on-demand with indexed queries for optimal performance
 */
import { router } from '~/server/trpc';
import { getStatisticsProcedure } from './get-statistics.procedure';
import { getTimeseriesProcedure } from './get-timeseries.procedure';
import { onConversionAddedProcedure } from './on-conversion-added.procedure';

export const statisticsRouter = router({
  get: getStatisticsProcedure,
  timeseries: getTimeseriesProcedure,
  onConversionAdded: onConversionAddedProcedure,
});
