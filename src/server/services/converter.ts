import { env } from '../env';

// Cache configuration
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const CURRENCIES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const TIMESERIES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// In-memory cache for exchange rates
interface RatesCache {
  rates: Record<string, number>;
  timestamp: number;
}

// In-memory cache for available currencies
interface CurrenciesCache {
  currencies: Currency[];
  timestamp: number;
}

// In-memory cache for timeseries data (per year per currency)
interface TimeseriesCache {
  data: Record<string, number>; // date -> rate
  timestamp: number;
}

export interface Currency {
  code: string;
  name: string;
}

export interface TimeseriesDataPoint {
  date: string;
  rate: number;
}

let ratesCache: RatesCache | null = null;
let currenciesCache: CurrenciesCache | null = null;
// Cache key: "YEAR-CURRENCY" -> TimeseriesCache
const timeseriesCache = new Map<string, TimeseriesCache>();

/**
 * Fetch exchange rates from OpenExchangeRates API
 * Uses in-memory cache to minimize API calls
 */
const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  const now = Date.now();

  // Return cached rates if still valid
  if (ratesCache && now - ratesCache.timestamp < CACHE_TTL) {
    console.log('Using cached exchange rates');
    return ratesCache.rates;
  }

  console.log('Fetching fresh exchange rates from API');

  // Fetch fresh rates from API
  const response = await fetch(
    `https://openexchangerates.org/api/latest.json?app_id=${env.OPENEXCHANGERATES_API_KEY}`,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to fetch exchange rates: ${response.status} - ${error}`,
    );
  }

  const data = await response.json();

  if (!data.rates) {
    throw new Error('Invalid response from exchange rate API');
  }

  // Update cache
  ratesCache = {
    rates: data.rates,
    timestamp: now,
  };

  return data.rates;
};

/**
 * Convert currency from source to target
 * Fetches exchange rates with caching mechanism
 */
export const convertCurrency = async (
  sourceAmount: number,
  sourceCurrency: string,
  targetCurrency: string,
): Promise<{
  targetAmount: number;
  targetCurrency: string;
  sourceCurrency: string;
  sourceAmount: number;
}> => {
  const rates = await fetchExchangeRates();

  // Validate currencies exist in rates
  if (!rates[sourceCurrency]) {
    throw new Error(`Currency '${sourceCurrency}' not found in exchange rates`);
  }

  if (!rates[targetCurrency]) {
    throw new Error(`Currency '${targetCurrency}' not found in exchange rates`);
  }

  // OpenExchangeRates uses USD as base currency
  // Convert: sourceAmount (in cents) -> USD -> targetAmount (in cents)
  const amountInUSD = sourceAmount / rates[sourceCurrency];
  const targetAmount = amountInUSD * rates[targetCurrency];

  return {
    sourceAmount,
    sourceCurrency,
    targetAmount: Math.round(targetAmount), // Round to nearest integer (cents)
    targetCurrency,
  };
};

/**
 * Get available currencies from OpenExchangeRates API
 * Uses in-memory cache with 24-hour TTL
 */
export const getAvailableCurrencies = async (): Promise<Currency[]> => {
  const now = Date.now();

  // Return cached currencies if still valid
  if (
    currenciesCache &&
    now - currenciesCache.timestamp < CURRENCIES_CACHE_TTL
  ) {
    console.log('Using cached currencies list');
    return currenciesCache.currencies;
  }

  console.log('Fetching fresh currencies list from API');

  const response = await fetch(
    `https://openexchangerates.org/api/currencies.json?app_id=${env.OPENEXCHANGERATES_API_KEY}`,
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to fetch available currencies: ${response.status} - ${error}`,
    );
  }

  const data = await response.json();

  // Update cache
  currenciesCache = {
    currencies: Object.entries(data).map(([code, name]) => ({
      code,
      name: name as string,
    })),
    timestamp: now,
  };

  return currenciesCache.currencies;
};

/**
 * Fetch ECB timeseries data for a specific currency and year
 * ECB provides rates with EUR as base currency
 */
const fetchECBTimeseries = async (
  currency: string,
  year: number,
): Promise<Record<string, number>> => {
  const cacheKey = `${year}-${currency}`;
  const now = Date.now();

  // Check cache
  const cached = timeseriesCache.get(cacheKey);
  if (cached && now - cached.timestamp < TIMESERIES_CACHE_TTL) {
    console.log(`Using cached timeseries for ${cacheKey}`);
    return cached.data;
  }

  console.log(`Fetching ECB timeseries for ${cacheKey}`);

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

    timeseriesCache.set(cacheKey, {
      data,
      timestamp: now,
    });

    return data;
  }

  // Fetch from ECB API
  const startPeriod = `${year}-01-01`;
  const endPeriod = `${year}-12-31`;
  const url = `https://data-api.ecb.europa.eu/service/data/EXR/D.${currency}.EUR.SP00.A?startPeriod=${startPeriod}&endPeriod=${endPeriod}&format=csvdata`;

  const response = await fetch(url);

  // If currency not supported or not found, return empty data
  if (!response.ok) {
    console.log(
      `Currency '${currency}' not supported by ECB or request failed: ${response.status}`,
    );
    const emptyData = {};
    // Cache the empty result to avoid repeated API calls
    timeseriesCache.set(cacheKey, {
      data: emptyData,
      timestamp: now,
    });
    return emptyData;
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

  // Cache the data (even if empty)
  timeseriesCache.set(cacheKey, {
    data,
    timestamp: now,
  });

  return data;
};

/**
 * Get timeseries exchange rate data from ECB
 * Fetches data for the entire year(s), caches it, and returns filtered results
 */
export const getTimeseriesData = async ({
  sourceCurrency,
  targetCurrency,
  startDate,
  endDate,
}: {
  sourceCurrency: string;
  targetCurrency: string;
  startDate: Date;
  endDate: Date;
}): Promise<TimeseriesDataPoint[]> => {
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

  for (const [_year, data] of sourceDataByYear) {
    Object.assign(allSourceData, data);
  }

  for (const [_year, data] of targetDataByYear) {
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

  // Return empty array if no data available (currency not supported or no data for date range)
  return result;
};
