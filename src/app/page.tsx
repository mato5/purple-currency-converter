'use client';

import { trpc } from '~/utils/trpc-client';
import type { inferProcedureInput } from '@trpc/server';
import { useState } from 'react';
import type { AppRouter } from '~/server/routers/_app';

// Common currencies for quick selection
const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

export default function CurrencyConverterPage() {
  const utils = trpc.useUtils();
  const [sourceAmount, setSourceAmount] = useState<string>('100');
  const [sourceCurrency, setSourceCurrency] = useState<string>('USD');
  const [targetCurrency, setTargetCurrency] = useState<string>('EUR');
  const [result, setResult] = useState<number | null>(null);

  const convertMutation = trpc.conversion.add.useMutation({
    async onSuccess(data) {
      setResult(data.targetAmount);
      // Optionally refresh conversion history
      await utils.conversion.list.invalidate();
    },
  });

  const conversionsQuery = trpc.conversion.list.useQuery({
    limit: 10,
  });

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(sourceAmount, 10);

    if (isNaN(amount) || amount <= 0) {
      return;
    }

    type Input = inferProcedureInput<AppRouter['conversion']['add']>;
    const input: Input = {
      sourceAmount: amount,
      sourceCurrency: sourceCurrency,
      targetCurrency: targetCurrency,
    };

    try {
      await convertMutation.mutateAsync(input);
    } catch (cause) {
      console.error({ cause }, 'Failed to convert currency');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            💱 Currency Converter
          </h1>
          <p className="text-gray-400 text-lg">
            Convert currencies with real-time exchange rates
          </p>
        </div>

        {/* Converter Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8">
          <form onSubmit={handleConvert} className="space-y-6">
            {/* Amount Input */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Amount
              </label>
              <input
                id="amount"
                type="number"
                value={sourceAmount}
                onChange={(e) => setSourceAmount(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter amount"
                min="1"
                required
                disabled={convertMutation.isPending}
              />
            </div>

            {/* Currency Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* From Currency */}
              <div>
                <label
                  htmlFor="fromCurrency"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  From
                </label>
                <select
                  id="fromCurrency"
                  value={sourceCurrency}
                  onChange={(e) => setSourceCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  disabled={convertMutation.isPending}
                >
                  {POPULAR_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Currency */}
              <div>
                <label
                  htmlFor="toCurrency"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  To
                </label>
                <select
                  id="toCurrency"
                  value={targetCurrency}
                  onChange={(e) => setTargetCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  disabled={convertMutation.isPending}
                >
                  {POPULAR_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Convert Button */}
            <button
              type="submit"
              disabled={convertMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
            >
              {convertMutation.isPending ? 'Converting...' : 'Convert'}
            </button>

            {/* Error Display */}
            {convertMutation.error && (
              <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
                <p className="font-semibold">Error:</p>
                <p>{convertMutation.error.message}</p>
              </div>
            )}

            {/* Result Display */}
            {result !== null && convertMutation.isSuccess && (
              <div className="bg-green-900/30 border border-green-500 text-green-300 px-6 py-4 rounded-lg text-center">
                <p className="text-sm text-gray-400 mb-1">Result</p>
                <p className="text-3xl font-bold">
                  {sourceAmount} {sourceCurrency} ={' '}
                  <span className="text-green-400">{result.toFixed(2)}</span>{' '}
                  {targetCurrency}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Recent Conversions */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Recent Conversions
          </h2>

          {conversionsQuery.isLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-900 rounded-lg h-16 animate-pulse"
                ></div>
              ))}
            </div>
          )}

          {conversionsQuery.error && (
            <p className="text-red-400">
              Failed to load conversions: {conversionsQuery.error.message}
            </p>
          )}

          {conversionsQuery.data?.items.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              No conversions yet. Make your first conversion above!
            </p>
          )}

          {conversionsQuery.data && conversionsQuery.data.items.length > 0 && (
            <div className="space-y-3">
              {conversionsQuery.data.items.map((conversion) => (
                <div
                  key={conversion.id}
                  className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex justify-between items-center hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white font-semibold text-lg">
                      {conversion.sourceAmount} {conversion.sourceCurrency}
                    </div>
                    <div className="text-gray-500">→</div>
                    <div className="text-blue-400 font-semibold text-lg">
                      {conversion.targetAmount.toFixed(2)}{' '}
                      {conversion.targetCurrency}
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">
                    {new Date(conversion.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

