/**
 * Get currency symbol using Intl.NumberFormat
 * Falls back to currency code if symbol can't be determined
 */
export const getCurrencySymbol = (currencyCode: string): string => {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
    });

    // Format a small number and extract the symbol
    const parts = formatter.formatToParts(1);
    const symbolPart = parts.find((part) => part.type === 'currency');

    return symbolPart?.value || currencyCode;
  } catch {
    // If currency code is not supported, return the code itself
    return currencyCode;
  }
};

