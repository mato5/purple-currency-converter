export type Locale = string

/**
 * Format a number with locale-specific formatting
 * Handles different decimal separators, thousands separators, and currency formatting
 */
export function formatNumber(value: number, locale: Locale = "en-US", options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(value)
  } catch (error) {
    // Fallback to en-US if locale is not supported
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(value)
  }
}

/**
 * Format currency with locale-specific formatting
 */
export function formatCurrency(value: number, currency: string, locale: Locale = "en-US"): string {
  return formatNumber(value, locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  })
}

/**
 * Parse a locale-specific number string to a number
 * Handles both "1,234.56" and "1.234,56" formats
 */
export function parseLocaleNumber(value: string, locale: Locale = "en-US"): number {
  // Remove whitespace
  value = value.trim()

  // Get locale-specific decimal and thousands separators
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.56)
  const decimalPart = parts.find((p) => p.type === "decimal")
  const groupPart = parts.find((p) => p.type === "group")

  const decimalSeparator = decimalPart?.value || "."
  const groupSeparator = groupPart?.value || ","

  // Normalize the input based on locale
  let normalized = value

  // If the locale uses comma as decimal separator
  if (decimalSeparator === ",") {
    // Replace the last occurrence of the group separator with nothing
    // Then replace decimal separator with .
    normalized = normalized.replace(new RegExp(groupSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "")
    normalized = normalized.replace(decimalSeparator, ".")
  } else {
    // Standard US format
    normalized = normalized.replace(/,/g, "")
  }

  const parsed = Number.parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Get the user's preferred locale (can be extended with user preferences)
 */
export function getUserLocale(): Locale {
  if (typeof window !== "undefined") {
    return navigator.language || "en-US"
  }
  return "en-US"
}
