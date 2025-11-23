import { z } from 'zod';
import currencyCodes from 'currency-codes';

/**
 * Validate currency code using currency-codes library
 */
function isValidCurrencyCode(code: string): boolean {
  return currencyCodes.code(code) !== undefined;
}

/**
 * Create form validation schema with i18n error messages
 * Pass t function from useTranslations for localized messages
 */
export function createConversionFormSchema(t: (key: string) => string) {
  return z.object({
    amount: z
      .string()
      .min(1, t('converter.errors.invalidAmount'))
      .refine(
        (val) => !isNaN(Number(val.replace(',', '.'))),
        t('converter.errors.invalidNumber'),
      )
      .refine(
        (val) => Number(val.replace(',', '.')) > 0,
        t('converter.errors.amountTooLow'),
      ),
    sourceCurrency: z
      .string()
      .length(3, t('converter.errors.invalidCurrencyCode'))
      .toUpperCase()
      .refine(isValidCurrencyCode, t('converter.errors.invalidCurrencyCode')),
    targetCurrency: z
      .string()
      .length(3, t('converter.errors.invalidCurrencyCode'))
      .toUpperCase()
      .refine(isValidCurrencyCode, t('converter.errors.invalidCurrencyCode')),
  });
}

// Default schema without translations (for server-side use)
export const conversionFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Please enter an amount')
    .refine(
      (val) => !isNaN(Number(val.replace(',', '.'))),
      'Please enter a valid number',
    )
    .refine(
      (val) => Number(val.replace(',', '.')) > 0,
      'Amount must be greater than zero',
    ),
  sourceCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .toUpperCase()
    .refine(isValidCurrencyCode, 'Invalid currency code'),
  targetCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .toUpperCase()
    .refine(isValidCurrencyCode, 'Invalid currency code'),
});

export type ConversionFormInput = z.infer<typeof conversionFormSchema>;
