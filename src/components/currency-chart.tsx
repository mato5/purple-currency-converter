"use client"

import { useState } from "react"
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

  // Format date for display
  const formatDateForChart = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Prepare chart data
  const chartData =
    timeseriesQuery.data?.map((point: { date: string; rate: number }) => ({
      date: formatDateForChart(point.date),
      rate: point.rate,
    })) || []

  const data = aggregateData(chartData, timeFrame)

  const getTimeFrameLabel = () => {
    const labels = {
      "7": "7 Days",
      "30": "30 Days",
      "90": "90 Days",
      "365": "1 Year",
    }
    return labels[timeFrame]
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
    <Card className="w-full bg-white border border-slate-200 p-6 rounded-xl">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              {fromCurrency} to {toCurrency} - {getTimeFrameLabel()} Trend
            </h2>
            <p className="text-sm text-slate-600">Historical exchange rate</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["7", "30", "90", "365"] as TimeFrame[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFrame(period)}
                disabled={timeseriesQuery.isLoading}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  timeFrame === period ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {period === "7" ? "7D" : period === "30" ? "30D" : period === "90" ? "90D" : "1Y"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-80 w-full">
        {timeseriesQuery.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Loading chart data...</p>
            </div>
          </div>
        ) : timeseriesQuery.error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-500">
              <p className="font-semibold">Failed to load chart data</p>
              <p className="text-sm text-slate-600 mt-1">{timeseriesQuery.error.message}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-600">
              <p className="font-semibold text-lg">No data available</p>
              <p className="text-sm mt-2">
                Historical data is not available for this currency pair.
              </p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis 
                stroke="#64748b" 
                style={{ fontSize: "12px" }} 
                domain={getYAxisDomain()}
                tickFormatter={(value: number) => value.toFixed(4)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => value.toFixed(4)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
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
