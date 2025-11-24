import { isValidCurrencyCode } from '~/lib/validation';
import { cache } from '~/server/cache';
import { config } from '~/server/config';
import { createLogger } from '~/server/logger';

const logger = createLogger({ module: 'converter' });

export interface Currency {
  code: string;
  name: string;
}

export interface TimeseriesDataPoint {
  date: string;
  rate: number;
}

/**
 * Fetch exchange rates from OpenExchangeRates API
 * Uses filesystem cache to minimize API calls
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  const cacheKey = config.cache.keys.exchangeRates;

  // Try to get from cache
  const cached = await cache.get<Record<string, number>>(cacheKey);
  if (cached) {
    logger.debug('Using cached exchange rates');
    return cached;
  }

  logger.info('Fetching fresh exchange rates from API');

  try {
    const url = `${config.openExchangeRatesBaseUrl}/latest.json?app_id=${config.openExchangeRatesApiKey}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(config.apiTimeout),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(
        { status: response.status, error },
        'Failed to fetch exchange rates',
      );
      throw new Error(
        `Failed to fetch exchange rates: ${response.status} - ${error}`,
      );
    }

    const data = await response.json();

    if (!data.rates) {
      logger.error('Invalid response from exchange rate API');
      throw new Error('Invalid response from exchange rate API');
    }

    // Cache the rates
    await cache.set(cacheKey, data.rates, config.cache.exchangeRatesTtl);

    return data.rates;
  } catch (error) {
    // Check if it's a timeout (AbortError)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error({ error }, 'Request timeout while fetching exchange rates');
      throw new Error(
        'Network error: Unable to connect to exchange rate service',
      );
    }
    // Check if it's a network error (fetch failed)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error({ error }, 'Network error while fetching exchange rates');
      throw new Error(
        'Network error: Unable to connect to exchange rate service',
      );
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Convert currency from source to target
 * Fetches exchange rates with caching mechanism
 */
export async function convertCurrency(
  sourceAmount: number,
  sourceCurrency: string,
  targetCurrency: string,
): Promise<{
  targetAmount: number;
  targetCurrency: string;
  sourceCurrency: string;
  sourceAmount: number;
}> {
  logger.debug(
    { sourceAmount, sourceCurrency, targetCurrency },
    'Converting currency',
  );

  // Validate currency codes
  if (!isValidCurrencyCode(sourceCurrency)) {
    logger.warn({ currency: sourceCurrency }, 'Invalid source currency code');
    throw new Error(`Invalid source currency code: ${sourceCurrency}`);
  }

  if (!isValidCurrencyCode(targetCurrency)) {
    logger.warn({ currency: targetCurrency }, 'Invalid target currency code');
    throw new Error(`Invalid target currency code: ${targetCurrency}`);
  }

  const rates = await fetchExchangeRates();

  // Validate currencies exist in rates
  if (!rates[sourceCurrency]) {
    logger.warn(
      { currency: sourceCurrency },
      'Currency not found in exchange rates',
    );
    throw new Error(`Currency '${sourceCurrency}' not found in exchange rates`);
  }

  if (!rates[targetCurrency]) {
    logger.warn(
      { currency: targetCurrency },
      'Currency not found in exchange rates',
    );
    throw new Error(`Currency '${targetCurrency}' not found in exchange rates`);
  }

  // OpenExchangeRates uses USD as base currency
  // Convert: sourceAmount (in cents) -> USD -> targetAmount (in cents)
  const amountInUSD = sourceAmount / rates[sourceCurrency];
  const targetAmount = amountInUSD * rates[targetCurrency];

  // Round to nearest cent using standard rounding (rounds 0.5 up)
  const roundedTargetAmount = Math.round(targetAmount);

  logger.debug(
    {
      sourceAmount,
      targetAmount: roundedTargetAmount,
      sourceCurrency,
      targetCurrency,
    },
    'Currency converted successfully',
  );

  return {
    sourceAmount,
    sourceCurrency,
    targetAmount: roundedTargetAmount,
    targetCurrency,
  };
}

/**
 * Get available currencies from OpenExchangeRates API
 * Uses filesystem cache with 24-hour TTL
 */
export async function getAvailableCurrencies(): Promise<Currency[]> {
  const cacheKey = config.cache.keys.availableCurrencies;

  // Try to get from cache
  const cached = await cache.get<Currency[]>(cacheKey);
  if (cached) {
    logger.debug('Using cached currencies list');
    return cached;
  }

  logger.info('Fetching fresh currencies list from API');

  try {
    const url = `${config.openExchangeRatesBaseUrl}/currencies.json?app_id=${config.openExchangeRatesApiKey}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(config.apiTimeout),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(
        { status: response.status, error },
        'Failed to fetch available currencies',
      );
      throw new Error(
        `Failed to fetch available currencies: ${response.status} - ${error}`,
      );
    }

    const data = await response.json();

    const currencies: Currency[] = Object.entries(data)
      .map(([code, name]) => ({
        code,
        name: name as string,
      }))
      .filter((currency) => isValidCurrencyCode(currency.code));

    // Cache the currencies
    await cache.set(cacheKey, currencies, config.cache.currenciesTtl);

    logger.debug(
      { count: currencies.length },
      'Currencies fetched successfully',
    );

    return currencies;
  } catch (error) {
    // Check if it's a timeout (AbortError)
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error({ error }, 'Request timeout while fetching currencies');
      throw new Error('Network error: Unable to connect to currency service');
    }
    // Check if it's a network error (fetch failed)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logger.error({ error }, 'Network error while fetching currencies');
      throw new Error('Network error: Unable to connect to currency service');
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Fetch ECB timeseries data for a specific currency and year
 * ECB provides rates with EUR as base currency
 */
async function fetchECBTimeseries(
  currency: string,
  year: number,
): Promise<Record<string, number>> {
  const cacheKey = `${config.cache.keys.timeseriesPrefix}_${year}_${currency}`;

  // Try to get from cache
  const cached = await cache.get<Record<string, number>>(cacheKey);
  if (cached) {
    logger.debug({ currency, year }, 'Using cached timeseries');
    return cached;
  }

  logger.info({ currency, year }, 'Fetching ECB timeseries');

  // Special case: EUR to EUR is always 1
  if (currency === 'EUR') {
    const data: Record<string, number> = {};
    // Generate daily rates of 1.0 for the entire year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    for (
      let d = new Date(startOfYear);
      d <= endOfYear;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = 1.0;
    }

    await cache.set(cacheKey, data, config.cache.timeseriesTtl);
    return data;
  }

  // Fetch from ECB API
  const startPeriod = `${year}-01-01`;
  const endPeriod = `${year}-12-31`;
  const url = `${config.ecbBaseUrl}/D.${currency}.EUR.SP00.A?startPeriod=${startPeriod}&endPeriod=${endPeriod}&format=csvdata`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(config.apiTimeout),
  });

  if (!response.ok) {
    logger.warn(
      { currency, year, status: response.status },
      'Currency not supported by ECB or request failed',
    );
    // Cache empty result
    await cache.set(cacheKey, {}, config.cache.timeseriesTtl);
    return {};
  }

  const csvText = await response.text();
  const lines = csvText.trim().split('\n');

  // Parse CSV (skip header)
  const data: Record<string, number> = {};
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(',');
    // ECB CSV format: [key, freq, currency, base, series, unit, date, value, ...]
    // We need the date (index 6) and value (index 7)
    if (columns.length >= 8) {
      const date = columns[6]?.trim();
      const value = columns[7]?.trim();

      if (date && value && value !== '') {
        const rate = parseFloat(value);
        if (!isNaN(rate)) {
          data[date] = rate;
        }
      }
    }
  }

  // Cache the data
  await cache.set(cacheKey, data, config.cache.timeseriesTtl);

  logger.debug(
    { currency, year, dataPoints: Object.keys(data).length },
    'Timeseries fetched successfully',
  );

  return data;
}

/**
 * Get timeseries exchange rate data from ECB
 * Fetches data for the entire year(s), caches it, and returns filtered results
 */
export async function getTimeseriesData({
  sourceCurrency,
  targetCurrency,
  startDate,
  endDate,
}: {
  sourceCurrency: string;
  targetCurrency: string;
  startDate: Date;
  endDate: Date;
}): Promise<TimeseriesDataPoint[]> {
  logger.debug(
    { sourceCurrency, targetCurrency, startDate, endDate },
    'Getting timeseries data',
  );

  // Determine which years we need to fetch
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const years = new Set<number>();
  for (let year = startYear; year <= endYear; year++) {
    years.add(year);
  }

  // Fetch timeseries for both currencies for all required years
  const sourceDataByYear = new Map<number, Record<string, number>>();
  const targetDataByYear = new Map<number, Record<string, number>>();

  for (const year of years) {
    const [sourceData, targetData] = await Promise.all([
      fetchECBTimeseries(sourceCurrency, year),
      fetchECBTimeseries(targetCurrency, year),
    ]);
    sourceDataByYear.set(year, sourceData);
    targetDataByYear.set(year, targetData);
  }

  // Combine all data
  const allSourceData: Record<string, number> = {};
  const allTargetData: Record<string, number> = {};

  for (const [, data] of sourceDataByYear) {
    Object.assign(allSourceData, data);
  }

  for (const [, data] of targetDataByYear) {
    Object.assign(allTargetData, data);
  }

  // Calculate cross rates and filter by date range
  const result: TimeseriesDataPoint[] = [];
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Get all dates that are in both datasets
  const commonDates = Object.keys(allSourceData).filter(
    (date) => date >= startDateStr && date <= endDateStr && allTargetData[date],
  );

  for (const date of commonDates.sort()) {
    const sourceRate = allSourceData[date];
    const targetRate = allTargetData[date];

    if (sourceRate && targetRate) {
      // Both rates are against EUR
      // To convert from source to target: (1 / sourceRate) * targetRate
      // Or simplified: targetRate / sourceRate
      const crossRate = targetRate / sourceRate;

      result.push({
        date,
        rate: Math.round(crossRate * 1000000) / 1000000, // Round to 6 decimal places
      });
    }
  }

  logger.debug(
    { sourceCurrency, targetCurrency, dataPoints: result.length },
    'Timeseries data retrieved successfully',
  );

  return result;
}
