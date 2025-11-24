import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cache } from '~/server/cache';

import {
  convertCurrency,
  fetchExchangeRates,
  getAvailableCurrencies,
  getTimeseriesData,
} from './converter';

// Mock the cache module
vi.mock('~/server/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock the config module
vi.mock('~/server/config', () => ({
  config: {
    openExchangeRatesApiKey: 'test-api-key',
    openExchangeRatesBaseUrl: 'https://openexchangerates.org/api',
    ecbBaseUrl: 'https://data-api.ecb.europa.eu/service/data/EXR',
    apiTimeout: 10000,
    cache: {
      keys: {
        exchangeRates: 'exchange_rates',
        availableCurrencies: 'available_currencies',
        timeseriesPrefix: 'timeseries',
      },
      exchangeRatesTtl: 3600000,
      currenciesTtl: 86400000,
      timeseriesTtl: 86400000,
    },
  },
}));

// Mock the logger module
vi.mock('~/server/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('converter service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchExchangeRates', () => {
    it('should return cached exchange rates if available', async () => {
      const mockRates = { USD: 1, EUR: 0.85, GBP: 0.73 };
      vi.mocked(cache.get).mockResolvedValue(mockRates);

      const result = await fetchExchangeRates();

      expect(result).toEqual(mockRates);
      expect(cache.get).toHaveBeenCalledWith('exchange_rates');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch and cache exchange rates if not in cache', async () => {
      const mockRates = { USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110.5 };
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ rates: mockRates }),
      } as Response);

      const result = await fetchExchangeRates();

      expect(result).toEqual(mockRates);
      expect(cache.set).toHaveBeenCalledWith(
        'exchange_rates',
        mockRates,
        3600000,
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://openexchangerates.org/api/latest.json?app_id=test-api-key',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should throw error when API response is not ok', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      } as Response);

      await expect(fetchExchangeRates()).rejects.toThrow(
        'Failed to fetch exchange rates: 401 - Unauthorized',
      );
    });

    it('should throw error when API response has no rates', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      await expect(fetchExchangeRates()).rejects.toThrow(
        'Invalid response from exchange rate API',
      );
    });

    it('should handle network timeout error', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'AbortError';
      vi.mocked(global.fetch).mockRejectedValue(timeoutError);

      await expect(fetchExchangeRates()).rejects.toThrow(
        'Network error: Unable to connect to exchange rate service',
      );
    });

    it('should handle network fetch error', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      const networkError = new TypeError('Failed to fetch');
      vi.mocked(global.fetch).mockRejectedValue(networkError);

      await expect(fetchExchangeRates()).rejects.toThrow(
        'Network error: Unable to connect to exchange rate service',
      );
    });
  });

  describe('convertCurrency', () => {
    const mockRates = { USD: 1, EUR: 0.85, GBP: 0.73, CZK: 23.5, JPY: 110.5 };

    beforeEach(() => {
      vi.mocked(cache.get).mockResolvedValue(mockRates);
    });

    it('should convert currency correctly', async () => {
      const result = await convertCurrency(10000, 'USD', 'EUR');

      expect(result).toEqual({
        sourceAmount: 10000,
        sourceCurrency: 'USD',
        targetAmount: 8500, // 10000 * 0.85 = 8500
        targetCurrency: 'EUR',
      });
    });

    it('should convert between non-USD currencies', async () => {
      // EUR to GBP: 10000 / 0.85 = 11764.70 USD, then * 0.73 = 8588.24
      const result = await convertCurrency(10000, 'EUR', 'GBP');

      expect(result).toEqual({
        sourceAmount: 10000,
        sourceCurrency: 'EUR',
        targetAmount: 8588, // Rounded
        targetCurrency: 'GBP',
      });
    });

    it('should round target amount to nearest cent', async () => {
      const result = await convertCurrency(10050, 'USD', 'EUR');

      // 10050 * 0.85 = 8542.5, should round to 8543
      expect(result.targetAmount).toBe(8543);
    });

    it('should handle large amounts', async () => {
      const result = await convertCurrency(10000000000, 'USD', 'JPY');

      expect(result).toEqual({
        sourceAmount: 10000000000,
        sourceCurrency: 'USD',
        targetAmount: 1105000000000, // 10B * 110.5
        targetCurrency: 'JPY',
      });
    });

    it('should throw error for invalid source currency code', async () => {
      await expect(convertCurrency(10000, 'INVALID', 'EUR')).rejects.toThrow(
        'Invalid source currency code: INVALID',
      );
    });

    it('should throw error for invalid target currency code', async () => {
      await expect(convertCurrency(10000, 'USD', 'INVALID')).rejects.toThrow(
        'Invalid target currency code: INVALID',
      );
    });

    it('should throw error for source currency not in exchange rates', async () => {
      // Use AUD which is valid but not in our mock rates
      await expect(convertCurrency(10000, 'AUD', 'EUR')).rejects.toThrow(
        "Currency 'AUD' not found in exchange rates",
      );
    });

    it('should throw error for target currency not in exchange rates', async () => {
      // Use CAD which is valid but not in our mock rates
      await expect(convertCurrency(10000, 'USD', 'CAD')).rejects.toThrow(
        "Currency 'CAD' not found in exchange rates",
      );
    });

    it('should handle zero amount', async () => {
      const result = await convertCurrency(0, 'USD', 'EUR');

      expect(result).toEqual({
        sourceAmount: 0,
        sourceCurrency: 'USD',
        targetAmount: 0,
        targetCurrency: 'EUR',
      });
    });

    it('should handle small amounts (cents)', async () => {
      const result = await convertCurrency(1, 'USD', 'EUR');

      expect(result).toEqual({
        sourceAmount: 1,
        sourceCurrency: 'USD',
        targetAmount: 1, // 1 * 0.85 = 0.85, rounds to 1
        targetCurrency: 'EUR',
      });
    });
  });

  describe('getAvailableCurrencies', () => {
    it('should return cached currencies if available', async () => {
      const mockCurrencies = [
        { code: 'USD', name: 'United States Dollar' },
        { code: 'EUR', name: 'Euro' },
      ];
      vi.mocked(cache.get).mockResolvedValue(mockCurrencies);

      const result = await getAvailableCurrencies();

      expect(result).toEqual(mockCurrencies);
      expect(cache.get).toHaveBeenCalledWith('available_currencies');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch and cache currencies if not in cache', async () => {
      const mockApiResponse = {
        USD: 'United States Dollar',
        EUR: 'Euro',
        GBP: 'British Pound Sterling',
        JPY: 'Japanese Yen',
      };
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const result = await getAvailableCurrencies();

      expect(result).toHaveLength(4);
      expect(result).toContainEqual({
        code: 'USD',
        name: 'United States Dollar',
      });
      expect(result).toContainEqual({ code: 'EUR', name: 'Euro' });
      expect(cache.set).toHaveBeenCalledWith(
        'available_currencies',
        result,
        86400000,
      );
    });

    it('should filter out invalid currency codes', async () => {
      const mockApiResponse = {
        USD: 'United States Dollar',
        EUR: 'Euro',
        INVALID: 'Invalid Currency',
        '123': 'Numeric Code',
      };
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      const result = await getAvailableCurrencies();

      // Should only include valid 3-letter currency codes
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.code.length === 3)).toBe(true);
    });

    it('should throw error when API response is not ok', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      } as Response);

      await expect(getAvailableCurrencies()).rejects.toThrow(
        'Failed to fetch available currencies: 403 - Forbidden',
      );
    });

    it('should handle network timeout error', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      const timeoutError = new Error('The operation was aborted');
      timeoutError.name = 'AbortError';
      vi.mocked(global.fetch).mockRejectedValue(timeoutError);

      await expect(getAvailableCurrencies()).rejects.toThrow(
        'Network error: Unable to connect to currency service',
      );
    });

    it('should handle network fetch error', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      const networkError = new TypeError('Failed to fetch');
      vi.mocked(global.fetch).mockRejectedValue(networkError);

      await expect(getAvailableCurrencies()).rejects.toThrow(
        'Network error: Unable to connect to currency service',
      );
    });
  });

  describe('getTimeseriesData', () => {
    const mockECBResponse = `key,freq,currency,currency_denom,exr_type,exr_suffix,time_period,obs_value,obs_status,obs_conf,obs_pre_break,obs_com
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-01,1.15,,,,
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-02,1.16,,,,
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-03,1.17,,,,`;

    it('should fetch and cache timeseries data', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => mockECBResponse,
      } as Response);

      const result = await getTimeseriesData({
        sourceCurrency: 'GBP',
        targetCurrency: 'GBP',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
      });

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        rate: 1,
      });
    });

    it('should return cached timeseries if available', async () => {
      const mockCachedData = {
        '2024-01-01': 1.15,
        '2024-01-02': 1.16,
      };
      vi.mocked(cache.get).mockResolvedValue(mockCachedData);

      const result = await getTimeseriesData({
        sourceCurrency: 'GBP',
        targetCurrency: 'GBP',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
      });

      expect(result).toHaveLength(2);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle EUR to EUR conversion (always 1.0)', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);

      const result = await getTimeseriesData({
        sourceCurrency: 'EUR',
        targetCurrency: 'EUR',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
      });

      // Should generate rates of 1.0 for all days in the range
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((point) => point.rate === 1.0)).toBe(true);
    });

    it('should handle cross-currency conversions', async () => {
      const gbpEurResponse = `key,freq,currency,currency_denom,exr_type,exr_suffix,time_period,obs_value,obs_status,obs_conf,obs_pre_break,obs_com
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-01,1.15,,,,`;

      const usdEurResponse = `key,freq,currency,currency_denom,exr_type,exr_suffix,time_period,obs_value,obs_status,obs_conf,obs_pre_break,obs_com
D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2024-01-01,0.92,,,,`;

      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => gbpEurResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => usdEurResponse,
        } as Response);

      const result = await getTimeseriesData({
        sourceCurrency: 'GBP',
        targetCurrency: 'USD',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      });

      expect(result).toHaveLength(1);
      // Cross rate: USD/GBP = (USD/EUR) / (GBP/EUR) = 0.92 / 1.15 = 0.8
      expect(result[0].rate).toBeCloseTo(0.8, 4);
    });

    it('should handle multiple years in date range', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => mockECBResponse,
      } as Response);

      await getTimeseriesData({
        sourceCurrency: 'GBP',
        targetCurrency: 'USD',
        startDate: new Date('2023-12-31'),
        endDate: new Date('2024-01-02'),
      });

      // Should fetch data for both currencies (GBP, USD) for both years (2023, 2024)
      // That's 2 years * 2 currencies = 4 fetches
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should filter dates outside the requested range', async () => {
      const extendedECBResponse = `key,freq,currency,currency_denom,exr_type,exr_suffix,time_period,obs_value,obs_status,obs_conf,obs_pre_break,obs_com
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2023-12-31,1.14,,,,
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-01,1.15,,,,
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-02,1.16,,,,
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-04,1.18,,,,`;

      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => extendedECBResponse,
      } as Response);

      const result = await getTimeseriesData({
        sourceCurrency: 'GBP',
        targetCurrency: 'GBP',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
      });

      // Should only include dates 2024-01-01 and 2024-01-02
      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-01');
      expect(result[1].date).toBe('2024-01-02');
    });

    it('should handle currency not supported by ECB', async () => {
      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await getTimeseriesData({
        sourceCurrency: 'XXX',
        targetCurrency: 'EUR',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
      });

      // Should return empty array and cache the empty result
      expect(result).toEqual([]);
      expect(cache.set).toHaveBeenCalled();
    });

    it('should handle malformed CSV data gracefully', async () => {
      const malformedResponse = `key,freq,currency
invalid,data,here
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-01,not_a_number,,,,`;

      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        text: async () => malformedResponse,
      } as Response);

      const result = await getTimeseriesData({
        sourceCurrency: 'GBP',
        targetCurrency: 'GBP',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-02'),
      });

      // Should return empty array for malformed data
      expect(result).toEqual([]);
    });

    it('should round cross rates to 6 decimal places', async () => {
      const gbpEurResponse = `key,freq,currency,currency_denom,exr_type,exr_suffix,time_period,obs_value,obs_status,obs_conf,obs_pre_break,obs_com
D.GBP.EUR.SP00.A,D,GBP,EUR,SP00,A,2024-01-01,1.1234567,,,,`;

      const usdEurResponse = `key,freq,currency,currency_denom,exr_type,exr_suffix,time_period,obs_value,obs_status,obs_conf,obs_pre_break,obs_com
D.USD.EUR.SP00.A,D,USD,EUR,SP00,A,2024-01-01,0.9234567,,,,`;

      vi.mocked(cache.get).mockResolvedValue(null);
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => gbpEurResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: async () => usdEurResponse,
        } as Response);

      const result = await getTimeseriesData({
        sourceCurrency: 'GBP',
        targetCurrency: 'USD',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-01'),
      });

      // Should be rounded to 6 decimal places
      const rateStr = result[0].rate.toString();
      const decimalPlaces = rateStr.split('.')[1]?.length || 0;
      expect(decimalPlaces).toBeLessThanOrEqual(6);
    });
  });
});
