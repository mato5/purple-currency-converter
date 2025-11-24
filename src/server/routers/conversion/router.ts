/**
 * Conversion router for currency conversion operations
 */
import { router } from '~/server/trpc';

import { addConversionProcedure } from './add-conversion.procedure';
import { listCurrenciesProcedure } from './list-currencies.procedure';

export const conversionRouter = router({
  listCurrencies: listCurrenciesProcedure,
  add: addConversionProcedure,
});
