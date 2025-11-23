/**
 * Conversion router for currency conversion operations
 */
import { router } from '~/server/trpc';
import { listCurrenciesProcedure } from './list-currencies.procedure';
import { addConversionProcedure } from './add-conversion.procedure';

export const conversionRouter = router({
  listCurrencies: listCurrenciesProcedure,
  add: addConversionProcedure,
});
