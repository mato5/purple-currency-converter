/**
 * Supported locales configuration
 * Centralized locale definitions to avoid duplication
 */

export const SUPPORTED_LOCALES = ['en', 'cs', 'de'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Default locale used as fallback
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/**
 * Locale display names
 */
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  cs: 'Čeština',
  de: 'Deutsch',
} as const;
