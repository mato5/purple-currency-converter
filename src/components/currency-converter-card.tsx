"use client"

import { useState, useEffect } from "react"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { CurrencySelector } from "./currency-selector"
import { Loader2, ArrowRightLeft } from "lucide-react"
import { CurrencyChart } from "./currency-chart"
import { formatNumber, parseLocaleNumber, getUserLocale } from "~/lib/i18n-number"
import { getCurrencySymbol } from "~/lib/currency-symbols"
import { trpc } from "~/utils/trpc-client"
import type { AppRouter } from "~/server/routers/_app"

export function CurrencyConverterCard() {
  const utils = trpc.useUtils()
  const [amount, setAmount] = useState("200")
  const [fromCurrency, setFromCurrency] = useState("EUR")
  const [toCurrency, setToCurrency] = useState("CZK")
  const [result, setResult] = useState<number | null>(null)
  const [locale] = useState(getUserLocale())

  // Fetch available currencies from API
  const currenciesQuery = trpc.conversion.listCurrencies.useQuery()

  // Get statistics
  const statsQuery = trpc.statistics.get.useQuery()

  // Conversion mutation
  const convertMutation = trpc.conversion.add.useMutation({
    async onSuccess(data) {
      setResult(data.targetAmount)
      // Refresh statistics
      await utils.statistics.get.invalidate()
    },
  })

  const handleConvert = async () => {
    const parsedAmount = parseLocaleNumber(amount, locale)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) return

    // Convert to smallest unit (cents) by multiplying by 100
    const amountInCents = Math.round(parsedAmount * 100)

    const input = {
      sourceAmount: amountInCents,
      sourceCurrency: fromCurrency,
      targetCurrency: toCurrency,
    }

    try {
      await convertMutation.mutateAsync(input)
    } catch (error) {
      console.error("Failed to convert currency:", error)
    }
  }

  const handleSwapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
  }

  // Auto-convert when amount, source, or target currency changes
  useEffect(() => {
    const parsedAmount = parseLocaleNumber(amount, locale)
    
    // Only convert if we have a valid amount and currencies
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return
    }

    if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
      return
    }

    // Debounce the conversion to avoid too many API calls while typing
    const timeoutId = setTimeout(() => {
      console.log("converting")
      handleConvert()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [amount, fromCurrency, toCurrency])

  return (
    <div className="flex flex-col items-center gap-8">
      <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Purple currency converter</h1>

      {/* Main Card */}
      <Card className="w-full bg-gradient-to-br from-purple-600 to-purple-700 border-0 p-6 md:p-8 rounded-2xl">
        <div className="space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Amount to convert</label>
            <Input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white text-slate-900 border-0 rounded-lg px-4 py-2.5 text-base"
              placeholder="0"
              disabled={convertMutation.isPending}
            />
          </div>

          {/* Currency Selectors */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">From</label>
              <CurrencySelector
                currencies={currenciesQuery.data || []}
                value={fromCurrency}
                onChange={setFromCurrency}
                disabled={convertMutation.isPending || currenciesQuery.isLoading}
              />
            </div>
            <button
              onClick={handleSwapCurrencies}
              disabled={convertMutation.isPending || currenciesQuery.isLoading}
              className="p-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Swap currencies"
              title="Swap currencies"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">To</label>
              <CurrencySelector
                currencies={currenciesQuery.data || []}
                value={toCurrency}
                onChange={setToCurrency}
                disabled={convertMutation.isPending || currenciesQuery.isLoading}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Convert Button */}
      <Button
        onClick={handleConvert}
        disabled={convertMutation.isPending || currenciesQuery.isLoading}
        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-lg font-medium transition-all disabled:opacity-70"
      >
        {convertMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Converting...
          </>
        ) : (
          "Convert currency"
        )}
      </Button>

      {/* Result Card */}
      <Card className="w-full bg-white border border-slate-200 p-6 rounded-xl">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">Result</p>
            {convertMutation.isPending ? (
              <p className="text-2xl md:text-3xl font-bold text-slate-600 flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Converting...</span>
              </p>
            ) : result !== null && convertMutation.isSuccess ? (
              <p className="text-2xl md:text-3xl font-bold text-slate-900">
                {formatNumber(result / 100, locale)} {toCurrency}
                {getCurrencySymbol(toCurrency) !== toCurrency && ` (${getCurrencySymbol(toCurrency)})`}
              </p>
            ) : (
              <p className="text-2xl md:text-3xl font-bold text-slate-400">
                X {toCurrency}
                {getCurrencySymbol(toCurrency) !== toCurrency && ` (${getCurrencySymbol(toCurrency)})`}
              </p>
            )}
          </div>
          {statsQuery.data && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">Number of calculations made</p>
                <p className="text-xl font-semibold text-slate-900">{statsQuery.data.totalConversions}</p>
              </div>
              {statsQuery.data.mostConvertedCurrency && (
                <>
                  <div>
                    <p className="text-sm text-slate-600">Most converted currency</p>
                    <p className="text-xl font-semibold text-slate-900">
                      {statsQuery.data.mostConvertedCurrency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">
                      Total amount converted to {statsQuery.data.mostConvertedCurrency}
                    </p>
                    <p className="text-xl font-semibold text-slate-900">
                      {formatNumber(statsQuery.data.mostConvertedCurrencyAmount / 100, locale)}{' '}
                      {statsQuery.data.mostConvertedCurrency}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      <CurrencyChart fromCurrency={fromCurrency} toCurrency={toCurrency} />
    </div>
  )
}
