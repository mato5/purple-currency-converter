"use client"

import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useTranslations } from "next-intl"
import { ChevronDown } from "lucide-react"
import { getCurrencySymbol } from "~/lib/currency-utils"
import type { Currency } from "~/server/services/converter"

interface CurrencySelectorProps {
  currencies: Currency[]
  value: string
  onChange: (currency: string) => void
  disabled?: boolean
}

export function CurrencySelector({ currencies, value, onChange, disabled }: CurrencySelectorProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Calculate dropdown position based on available space
  // Using useLayoutEffect to calculate before paint, preventing flicker
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const dropdownWidth = window.innerWidth < 640 ? 280 : 320
      const spaceOnRight = window.innerWidth - rect.left
      const spaceOnLeft = rect.right
      
      // Position on the side with more space
      if (spaceOnRight >= dropdownWidth) {
        setDropdownPosition('left')
      } else if (spaceOnLeft >= dropdownWidth) {
        setDropdownPosition('right')
      } else {
        // If neither side has enough space, use left and let it be scrollable
        setDropdownPosition('left')
      }
    }
  }, [isOpen])

  const filteredCurrencies = search
    ? currencies.filter(
        (currency) =>
          currency.code.toLowerCase().includes(search.toLowerCase()) ||
          currency.name.toLowerCase().includes(search.toLowerCase())
      )
    : currencies

  // Sort currencies so the selected one appears first
  const sortedCurrencies = [...filteredCurrencies].sort((a, b) => {
    if (a.code === value) return -1
    if (b.code === value) return 1
    return 0
  })

  const handleSelect = (currencyCode: string) => {
    onChange(currencyCode)
    setIsOpen(false)
    setSearch("")
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full bg-white text-slate-900 border border-white rounded-lg px-3 sm:px-4 py-2.5 text-base font-medium flex items-center justify-between hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm font-normal">{getCurrencySymbol(value)}</span>
          <span className="text-sm sm:text-base">{value}</span>
        </span>
        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className={`absolute top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-[280px] sm:w-[320px] ${
          dropdownPosition === 'left' ? 'left-0' : 'right-0'
        }`}>
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('converter.search.placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Currency List */}
          <div className="max-h-64 overflow-y-auto">
            {sortedCurrencies.length > 0 ? (
              sortedCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleSelect(currency.code)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-purple-50 flex items-center justify-between ${
                    value === currency.code ? "bg-purple-100 text-purple-700" : "text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-8 text-center shrink-0">{getCurrencySymbol(currency.code)}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-xs text-slate-600 truncate">{currency.name}</span>
                    </div>
                  </div>
                  {value === currency.code && <span className="text-purple-600 font-bold">✓</span>}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">{t('converter.search.noResults')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
