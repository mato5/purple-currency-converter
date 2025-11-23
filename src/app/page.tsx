import { CurrencyConverterCard } from "~/components/currency-converter-card"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <CurrencyConverterCard />
      </div>
    </main>
  )
}
