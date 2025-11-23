"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useFormatter } from "next-intl"
import { Card } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { CurrencySelector } from "./currency-selector"
import { LocaleSelector } from "./locale-selector"
import { Loader2, ArrowRightLeft } from "lucide-react"
import { CurrencyChart } from "./currency-chart"
import { createConversionFormSchema, type ConversionFormInput } from "~/lib/validation"
import { trpc } from "~/utils/trpc-client"
import { parseAmountToCents } from "~/lib/currency-utils"
import { useLocale } from "~/app/providers"

export function CurrencyConverterCard() {
  const t = useTranslations()
  const format = useFormatter()
  const { locale, onLocaleChange } = useLocale()
  
  const [result, setResult] = useState<number | null>(null)
  
  // Track if this is the first render to prevent auto-conversion on mount
  const isFirstRenderRef = useRef(true)
  
  // Track previous currency values to detect actual changes
  const prevCurrenciesRef = useRef({ source: '', target: '' })
  
  // Create validation schema with translations
  const validationSchema = useMemo(
    () => createConversionFormSchema(t),
    [t]
  )

  // React Hook Form with Zod validation
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConversionFormInput>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      amount: "200",
      sourceCurrency: "EUR",
      targetCurrency: "CZK",
    },
    mode: "onChange",
  })

  const amount = watch("amount")
  const sourceCurrency = watch("sourceCurrency")
  const targetCurrency = watch("targetCurrency")

  // Fetch available currencies from API
  const currenciesQuery = trpc.conversion.listCurrencies.useQuery()

  // Subscribe to real-time statistics updates (SSE)
  const [stats, setStats] = useState<{
    totalConversions: number
    mostConvertedCurrency: string
    mostConvertedCurrencyAmount: number
    updatedAt: Date
  } | null>(null)

  trpc.statistics.onConversionAdded.useSubscription(undefined, {
    onData: (data) => {
      setStats(data)
    },
    onError: (_error) => {
      // Error logged by tRPC logger
    },
  })

  // Conversion mutation
  const convertMutation = trpc.conversion.add.useMutation({
    async onSuccess(data) {
      setResult(data.conversion.targetAmount)
      // Update statistics immediately from the response (guaranteed fresh)
      setStats(data.statistics)
    },
  })

  // Manual conversion function - triggered by button click
  const performConversion = async () => {
    // Validate form first
    if (errors.amount || errors.sourceCurrency || errors.targetCurrency) {
      return
    }

    if (!amount || !sourceCurrency || !targetCurrency || sourceCurrency === targetCurrency) {
      return
    }

    const input = {
      sourceAmount: parseAmountToCents(amount),
      sourceCurrency: sourceCurrency,
      targetCurrency: targetCurrency,
    }

    try {
      await convertMutation.mutateAsync(input)
    } catch {
      // Error will be displayed via convertMutation.error
    }
  }

  const handleSwapCurrencies = () => {
    const temp = sourceCurrency
    setValue("sourceCurrency", targetCurrency)
    setValue("targetCurrency", temp)
  }

  // Auto-convert when source or target currency changes (not when amount or locale changes)
  useEffect(() => {
    // On first render, just initialize refs (no conversion)
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      prevCurrenciesRef.current = { source: sourceCurrency, target: targetCurrency }
      return
    }

    // Check if currencies actually changed (not just a re-render from locale change)
    const currenciesChanged = 
      prevCurrenciesRef.current.source !== sourceCurrency ||
      prevCurrenciesRef.current.target !== targetCurrency

    if (!currenciesChanged) {
      return
    }

    // Update previous currencies
    prevCurrenciesRef.current = { source: sourceCurrency, target: targetCurrency }

    // Only convert if form is valid (no errors)
    if (errors.amount || errors.sourceCurrency || errors.targetCurrency) {
      return
    }

    if (!amount || !sourceCurrency || !targetCurrency || sourceCurrency === targetCurrency) {
      return
    }

    // Immediately convert when currency changes
    const performAutoConversion = async () => {
      const input = {
        sourceAmount: parseAmountToCents(amount),
        sourceCurrency: sourceCurrency,
        targetCurrency: targetCurrency,
      }

      try {
        await convertMutation.mutateAsync(input)
      } catch {
        // Error logged by tRPC logger
      }
    }

    performAutoConversion()
    // Note: amount is used but NOT in dependency array - we only auto-convert on currency change
    // Note: convertMutation.mutateAsync is NOT in dependency array to prevent locale changes from triggering conversion
  }, [sourceCurrency, targetCurrency])

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8">
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">{t('app.title')}</h1>
        <LocaleSelector currentLocale={locale} onLocaleChange={onLocaleChange} />
      </div>

      {/* Main Card */}
      <Card className="w-full bg-linear-to-br from-purple-600 to-purple-700 border-0 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Amount Input - Full width on all screens */}
          <div className="md:hidden">
            <label className="block text-sm font-medium text-white mb-2">{t('converter.amountLabel')}</label>
            <Input
              type="text"
              {...register("amount")}
              className={`w-full bg-white text-slate-900 border border-white rounded-lg px-3 sm:px-4 py-2.5 text-base font-medium h-[42px] ${
                errors.amount ? "ring-2 ring-red-400" : ""
              }`}
              placeholder={t('converter.amountPlaceholder')}
              disabled={convertMutation.isPending}
            />
            {errors.amount && (
              <p className="mt-2 text-sm text-red-200 flex items-center gap-1">
                <span className="font-semibold">⚠</span>
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Currency Selectors - Horizontal on all screens */}
          <div className="flex gap-3 items-end">
            {/* Amount Input - Only on desktop */}
            <div className="hidden md:block flex-1">
              <label className="block text-sm font-medium text-white mb-2">{t('converter.amountLabel')}</label>
              <Input
                type="text"
                {...register("amount")}
                className={`w-full bg-white text-slate-900 border border-white rounded-lg px-3 sm:px-4 py-2.5 text-base font-medium h-[42px] ${
                  errors.amount ? "ring-2 ring-red-400" : ""
                }`}
                placeholder={t('converter.amountPlaceholder')}
                disabled={convertMutation.isPending}
              />
              {errors.amount && (
                <p className="mt-2 text-sm text-red-200 flex items-center gap-1">
                  <span className="font-semibold">⚠</span>
                  {errors.amount.message}
                </p>
              )}
            </div>

            {/* From Currency */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">{t('converter.fromLabel')}</label>
              <CurrencySelector
                currencies={currenciesQuery.data || []}
                value={sourceCurrency}
                onChange={(value) => setValue("sourceCurrency", value)}
                disabled={convertMutation.isPending || currenciesQuery.isLoading}
              />
            </div>

            {/* Swap Button */}
            <div>
              <button
                onClick={handleSwapCurrencies}
                disabled={convertMutation.isPending || currenciesQuery.isLoading}
                className="p-2.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t('converter.swapCurrencies')}
                title={t('converter.swapCurrencies')}
              >
                <ArrowRightLeft className="w-5 h-5" />
              </button>
            </div>

            {/* To Currency */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-white mb-2">{t('converter.toLabel')}</label>
              <CurrencySelector
                currencies={currenciesQuery.data || []}
                value={targetCurrency}
                onChange={(value) => setValue("targetCurrency", value)}
                disabled={convertMutation.isPending || currenciesQuery.isLoading}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Convert Button - Manually triggers conversion (auto-conversion only happens when currencies change) */}
      <Button
        onClick={performConversion}
        disabled={convertMutation.isPending || currenciesQuery.isLoading || !amount || errors.amount !== undefined}
        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium transition-all disabled:opacity-70 text-base sm:text-base"
      >
        {convertMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('converter.converting')}
          </>
        ) : (
          t('converter.convertButton')
        )}
      </Button>

      {/* Result Card */}
      <Card className="w-full bg-white border border-slate-200 p-4 sm:p-6 rounded-xl">
        <div className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-sm text-slate-600 mb-1">{t('converter.result')}</p>
            {convertMutation.isPending ? (
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-600 flex items-center gap-2">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                <span className="text-base sm:text-xl md:text-2xl">{t('converter.converting')}</span>
              </p>
            ) : convertMutation.isError ? (
              <div className="space-y-2">
                <p className="text-lg sm:text-xl font-bold text-red-600 flex items-center gap-2">
                  <span className="font-semibold">⚠</span>
                  {t('converter.error')}
                </p>
                <p className="text-sm text-red-500">
                  {convertMutation.error?.message || t('converter.unknownError')}
                </p>
              </div>
            ) : result !== null && convertMutation.isSuccess ? (
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 wrap-break-word">
                {format.number(result / 100, { style: 'currency', currency: targetCurrency })}
              </p>
            ) : (
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-400 wrap-break-word">
                {format.number(0, { style: 'currency', currency: targetCurrency })}
              </p>
            )}
          </div>
          {stats && (
            <>
              <div className="border-t border-slate-200 pt-3 sm:pt-4">
                <p className="text-xs sm:text-sm text-slate-600">{t('converter.statistics.totalConversions')}</p>
                <p className="text-lg sm:text-xl font-semibold text-slate-900">{stats.totalConversions}</p>
              </div>
              {stats.mostConvertedCurrency && (
                <>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600">{t('converter.statistics.mostConverted')}</p>
                    <p className="text-lg sm:text-xl font-semibold text-slate-900">
                      {stats.mostConvertedCurrency}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {t('converter.statistics.totalAmount', { currency: stats.mostConvertedCurrency })}
                    </p>
                    <p className="text-lg sm:text-xl font-semibold text-slate-900 wrap-break-word">
                      {format.number(stats.mostConvertedCurrencyAmount / 100, { 
                        style: 'currency', 
                        currency: stats.mostConvertedCurrency 
                      })}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      <CurrencyChart fromCurrency={sourceCurrency} toCurrency={targetCurrency} />
    </div>
  )
}
