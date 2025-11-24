import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from './locales';

/**
 * Get the user's preferred locale from browser
 * Falls back to DEFAULT_LOCALE if detection fails
 */
export function getUserLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const browserLocale =
    navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE;

  // Extract the language code (e.g., 'en-US' -> 'en')
  const languageCode = browserLocale.split('-')[0].toLowerCase();

  // Return the language code if supported, otherwise default to DEFAULT_LOCALE
  return SUPPORTED_LOCALES.includes(languageCode as SupportedLocale)
    ? (languageCode as SupportedLocale)
    : DEFAULT_LOCALE;
}
