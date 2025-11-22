import { env } from '../env';

// Cache configuration
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// In-memory cache for exchange rates
interface RatesCache {
  rates: Record<string, number>;
  timestamp: number;
}

let ratesCache: RatesCache | null = null;

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
  // Convert: sourceAmount -> USD -> targetAmount
  const amountInUSD = sourceAmount / rates[sourceCurrency];
  const targetAmount = amountInUSD * rates[targetCurrency];

  return {
    sourceAmount,
    sourceCurrency,
    targetAmount: Math.round(targetAmount * 100) / 100, // Round to 2 decimal places
    targetCurrency,
  };
};
