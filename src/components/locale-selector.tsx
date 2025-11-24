"use client"

import { ChevronDown, Globe } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect,useRef, useState } from "react"

import { SUPPORTED_LOCALES, type SupportedLocale } from "~/lib/locales"

interface LocaleSelectorProps {
  currentLocale: SupportedLocale
  onLocaleChange: (locale: SupportedLocale) => void
}

const locales: { code: SupportedLocale; flag: string }[] = [
  { code: 'en', flag: '🇬🇧' },
  { code: 'cs', flag: '🇨🇿' },
  { code: 'de', flag: '🇩🇪' },
]

export function LocaleSelector({ currentLocale, onLocaleChange }: LocaleSelectorProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (localeCode: SupportedLocale) => {
    // Validate locale before changing
    if (SUPPORTED_LOCALES.includes(localeCode)) {
      onLocaleChange(localeCode)
      setIsOpen(false)
    }
  }

  const currentLocaleObj = locales.find((l) => l.code === currentLocale) || locales[0]

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-900 font-medium text-sm"
        aria-label={t('locale.label')}
      >
        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="text-base sm:text-lg">{currentLocaleObj.flag}</span>
        <span className="hidden sm:inline text-xs sm:text-sm">{t(`locale.${currentLocale}`)}</span>
        <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-max min-w-full sm:min-w-[160px]">
          <div className="py-1">
            {locales.map((locale) => (
              <button
                key={locale.code}
                onClick={() => handleSelect(locale.code)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-purple-50 flex items-center gap-3 whitespace-nowrap ${
                  currentLocale === locale.code ? "bg-purple-100 text-purple-700" : "text-slate-900"
                }`}
              >
                <span className="text-xl">{locale.flag}</span>
                <span className="font-medium">{t(`locale.${locale.code}`)}</span>
                {currentLocale === locale.code && <span className="ml-auto text-purple-600 font-bold">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

