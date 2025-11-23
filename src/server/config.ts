import { z } from 'zod';

/**
 * Server configuration schema
 * All configuration values should be defined here
 */
const configSchema = z.object({
  // Environment
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  databaseUrl: z.string().min(1),

  // External APIs
  openExchangeRatesApiKey: z.string().min(1),
  openExchangeRatesBaseUrl: z
    .string()
    .url()
    .default('https://openexchangerates.org/api'),
  ecbBaseUrl: z
    .string()
    .url()
    .default('https://data-api.ecb.europa.eu/service/data/EXR'),

  // Cache configuration
  cache: z.object({
    exchangeRatesTtl: z
      .number()
      .positive()
      .default(60 * 60 * 1000), // 1 hour
    currenciesTtl: z
      .number()
      .positive()
      .default(24 * 60 * 60 * 1000), // 24 hours
    timeseriesTtl: z
      .number()
      .positive()
      .default(24 * 60 * 60 * 1000), // 24 hours
  }),

  // Client configuration
  client: z.object({
    debounceDelay: z.number().positive().default(800), // ms
    localeStorageKey: z.string().default('preferred-locale'),
  }),

  // Logging
  logging: z.object({
    level: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
      .default('info'),
    pretty: z.boolean().default(false),
  }),
});

export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const raw = {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    openExchangeRatesApiKey: process.env.OPENEXCHANGERATES_API_KEY,
    openExchangeRatesBaseUrl: process.env.OPEN_EXCHANGE_RATES_BASE_URL,
    ecbBaseUrl: process.env.ECB_BASE_URL,
    cache: {
      exchangeRatesTtl: process.env.CACHE_EXCHANGE_RATES_TTL
        ? parseInt(process.env.CACHE_EXCHANGE_RATES_TTL, 10)
        : undefined,
      currenciesTtl: process.env.CACHE_CURRENCIES_TTL
        ? parseInt(process.env.CACHE_CURRENCIES_TTL, 10)
        : undefined,
      timeseriesTtl: process.env.CACHE_TIMESERIES_TTL
        ? parseInt(process.env.CACHE_TIMESERIES_TTL, 10)
        : undefined,
    },
    client: {
      debounceDelay: process.env.NEXT_PUBLIC_DEBOUNCE_DELAY
        ? parseInt(process.env.NEXT_PUBLIC_DEBOUNCE_DELAY, 10)
        : undefined,
    },
    logging: {
      level: process.env.LOG_LEVEL,
      pretty: process.env.LOG_PRETTY === 'true',
    },
  };

  const result = configSchema.safeParse(raw);

  if (!result.success) {
    // Use process.stderr directly since logger isn't available yet during config load
    process.stderr.write('Configuration validation failed:\n');
    process.stderr.write(JSON.stringify(result.error.format(), null, 2) + '\n');
    throw new Error('Invalid configuration');
  }

  return result.data;
}

// Export singleton instance
export const config = loadConfig();
