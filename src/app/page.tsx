import { CurrencyConverterCard } from "~/components/currency-converter-card"

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-2xl">
        <CurrencyConverterCard />
      </div>
    </main>
  )
}
