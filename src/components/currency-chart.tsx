"use client"

import { useState } from "react"
import { useTranslations, useFormatter } from "next-intl"
import { Card } from "~/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { trpc } from "~/utils/trpc-client"
import { Loader2 } from "lucide-react"

interface CurrencyChartProps {
  fromCurrency: string
  toCurrency: string
}

type TimeFrame = "7" | "30" | "90" | "365"

export function CurrencyChart({ fromCurrency, toCurrency }: CurrencyChartProps) {
  const t = useTranslations()
  const format = useFormatter()
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("30")

  // Fetch timeseries data
  const timeseriesQuery = trpc.statistics.timeseries.useQuery({
    sourceCurrency: fromCurrency,
    targetCurrency: toCurrency,
    days: parseInt(timeFrame),
  })

  const aggregateData = (data: { date: string; rate: number }[], timeFrame: TimeFrame) => {
    if (timeFrame === "7" || timeFrame === "30") {
      return data
    }

    const interval = timeFrame === "90" ? 7 : 30 // Group by 7 days for 90D, 30 days for 1Y
    const aggregated = []

    for (let i = 0; i < data.length; i += interval) {
      const chunk = data.slice(i, i + interval)
      const avgRate = chunk.reduce((sum, item) => sum + item.rate, 0) / chunk.length
      aggregated.push({
        date: chunk[Math.floor(chunk.length / 2)].date, // Use middle date
        rate: Number(avgRate.toFixed(4)),
      })
    }

    return aggregated
  }

  // Prepare chart data with locale-aware date formatting
  const chartData =
    timeseriesQuery.data?.map((point: { date: string; rate: number }) => ({
      date: format.dateTime(new Date(point.date), { month: 'short', day: 'numeric' }),
      rate: point.rate,
    })) ?? []

  const data = aggregateData(chartData, timeFrame)

  const getTimeFrameLabel = () => {
    const labelKeys: Record<TimeFrame, string> = {
      "7": "converter.chart.timeframes.7d",
      "30": "converter.chart.timeframes.30d",
      "90": "converter.chart.timeframes.90d",
      "365": "converter.chart.timeframes.1y",
    }
    return t(labelKeys[timeFrame])
  }

  // Calculate Y-axis domain to show fluctuations better
  const getYAxisDomain = () => {
    if (data.length === 0) return ["auto", "auto"]
    
    const rates = data.map((d) => d.rate)
    const minRate = Math.min(...rates)
    const maxRate = Math.max(...rates)
    
    // Add 2% padding on each side to better show fluctuations
    const padding = (maxRate - minRate) * 0.02
    return [minRate - padding, maxRate + padding]
  }

  return (
    <Card className="w-full bg-white border border-slate-200 p-4 sm:p-6 rounded-xl">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4 mb-4">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900">
              {t('converter.chart.title', { from: fromCurrency, to: toCurrency, timeframe: getTimeFrameLabel() })}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{t('converter.chart.subtitle')}</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["7", "30", "90", "365"] as TimeFrame[]).map((period) => {
              const buttonKeys: Record<TimeFrame, string> = {
                "7": "converter.chart.buttons.7d",
                "30": "converter.chart.buttons.30d",
                "90": "converter.chart.buttons.90d",
                "365": "converter.chart.buttons.1y",
              }
              return (
                <button
                  key={period}
                  onClick={() => setTimeFrame(period)}
                  disabled={timeseriesQuery.isLoading}
                  className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    timeFrame === period ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {t(buttonKeys[period])}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="h-64 sm:h-80 w-full">
        {timeseriesQuery.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">{t('converter.chart.loading')}</p>
            </div>
          </div>
        ) : timeseriesQuery.error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-500">
              <p className="font-semibold">{t('converter.chart.loadError')}</p>
              <p className="text-sm text-slate-600 mt-1">{timeseriesQuery.error.message}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-600">
              <p className="font-semibold text-lg">{t('converter.chart.noData')}</p>
              <p className="text-sm mt-2">
                {t('converter.chart.noDataMessage')}
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                style={{ fontSize: "10px" }} 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#64748b" 
                style={{ fontSize: "10px" }} 
                domain={getYAxisDomain()}
                tickFormatter={(value: number) => value.toFixed(4)}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => value.toFixed(4)}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name={`${fromCurrency}/${toCurrency}`}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}
