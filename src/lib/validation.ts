import currencyCodes from 'currency-codes';
import { z } from 'zod';

/**
 * Validate currency code using currency-codes library
 */
export function isValidCurrencyCode(code: string): boolean {
  return currencyCodes.code(code) !== undefined;
}

/**
 * Maximum amount in standard units (for display)
 */
export const MAX_AMOUNT_DISPLAY = 100_000_000_000;

/**
 * Maximum amount in cents (smallest currency unit)
 */
export const MAX_AMOUNT_CENTS = MAX_AMOUNT_DISPLAY * 100;

/**
 * Create form validation schema with i18n error messages
 * Pass t function from useTranslations for localized messages
 * Coerces string input to number for validation
 */
export function createConversionFormSchema(t: (key: string) => string) {
  return z.object({
    amount: z.coerce
      .number({ invalid_type_error: t('converter.errors.invalidAmount') })
      .positive(t('converter.errors.amountTooLow'))
      .max(MAX_AMOUNT_DISPLAY, t('converter.errors.amountTooHigh')),
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

/**
 * Server-side conversion schema
 * Validates conversion requests with amount in cents
 */
export const conversionInputSchema = z.object({
  sourceAmount: z
    .number()
    .int('Amount must be an integer (cents)')
    .positive('Amount must be positive')
    .max(
      MAX_AMOUNT_CENTS,
      `Amount too large. Maximum is $${MAX_AMOUNT_DISPLAY.toLocaleString()}`,
    ),
  sourceCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .toUpperCase()
    .refine(isValidCurrencyCode, 'Invalid source currency code'),
  targetCurrency: z
    .string()
    .length(3, 'Currency code must be 3 characters')
    .toUpperCase()
    .refine(isValidCurrencyCode, 'Invalid target currency code'),
});

/**
 * Timeseries request schema
 * Validates historical exchange rate data requests
 */
export const timeseriesInputSchema = z.object({
  sourceCurrency: z
    .string()
    .toUpperCase()
    .refine(isValidCurrencyCode, 'Invalid source currency code'),
  targetCurrency: z
    .string()
    .toUpperCase()
    .refine(isValidCurrencyCode, 'Invalid target currency code'),
  days: z.number().int().min(1).max(365).default(30),
});

// Type exports
export type ConversionInput = z.infer<typeof conversionInputSchema>;
export type TimeseriesInput = z.infer<typeof timeseriesInputSchema>;
export type ConversionFormInput = z.infer<
  ReturnType<typeof createConversionFormSchema>
>;
