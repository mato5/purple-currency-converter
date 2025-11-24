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
  database: z.object({
    // ID for the singleton statistic row in the database
    statisticSingletonId: z.string().default('singleton'),
  }),

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
    // Cache keys
    keys: z.object({
      exchangeRates: z.string().default('exchange_rates'),
      availableCurrencies: z.string().default('available_currencies'),
      timeseriesPrefix: z.string().default('timeseries'),
    }),
    // TTL values
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

  // API timeout configuration (in milliseconds)
  apiTimeout: z.number().positive().default(10000), // 10 seconds

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
    database: {
      statisticSingletonId: process.env.STATISTIC_SINGLETON_ID,
    },
    openExchangeRatesApiKey: process.env.OPENEXCHANGERATES_API_KEY,
    openExchangeRatesBaseUrl: process.env.OPEN_EXCHANGE_RATES_BASE_URL,
    ecbBaseUrl: process.env.ECB_BASE_URL,
    cache: {
      keys: {
        exchangeRates: process.env.CACHE_KEY_EXCHANGE_RATES,
        availableCurrencies: process.env.CACHE_KEY_AVAILABLE_CURRENCIES,
        timeseriesPrefix: process.env.CACHE_KEY_TIMESERIES_PREFIX,
      },
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
    apiTimeout: process.env.API_TIMEOUT
      ? parseInt(process.env.API_TIMEOUT, 10)
      : undefined,
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
