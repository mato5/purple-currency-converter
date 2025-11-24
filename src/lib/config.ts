/**
 * Client-side configuration
 * These values are safe to expose to the browser
 */

export const clientConfig = {
  /**
   * LocalStorage key for storing user's preferred locale
   */
  localeStorageKey: 'preferred-locale',

  /**
   * TRPC request timeout in milliseconds
   */
  trpcTimeout: 5000, // 5 seconds
} as const;
