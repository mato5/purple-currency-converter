/**
 * Currency utility functions
 * Handles currency formatting, parsing, and symbol lookup
 */

/**
 * Parse amount string to cents (smallest currency unit)
 * Handles various locales by normalizing comma/period separators
 *
 * @param amount - String representation of amount (e.g., "100.50" or "100,50")
 * @returns Amount in cents (e.g., 10050)
 */
export function parseAmountToCents(amount: string): number {
  // Normalize separators: replace comma with period, remove non-numeric characters except period
  const normalized = amount.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const parsed = Number(normalized);

  // Convert to cents by multiplying by 100 and rounding
  return Math.round(parsed * 100);
}

/**
 * Get currency symbol using native Intl API
 * Falls back to currency code if symbol cannot be determined
 *
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "EUR")
 * @returns Currency symbol (e.g., "$", "€") or code as fallback
 */
export function getCurrencySymbol(currencyCode: string): string {
  try {
    // Use Intl.NumberFormat to get the native currency symbol
    const formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Format a small number and extract the symbol
    const parts = formatter.formatToParts(1);
    const symbolPart = parts.find((part) => part.type === 'currency');

    return symbolPart?.value ?? currencyCode;
  } catch {
    // Fallback to code if currency is not supported
    return currencyCode;
  }
}
