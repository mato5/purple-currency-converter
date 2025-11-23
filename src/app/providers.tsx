'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { TRPCProvider } from '~/utils/trpc-client';
import { getUserLocale } from '~/lib/intl';
import { clientConfig } from '~/lib/config';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from '~/lib/locales';
import type { Messages } from 'next-intl';

// Locale context for managing user's preferred locale
interface LocaleContextType {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: DEFAULT_LOCALE,
  onLocaleChange: () => {
    // Default empty handler
  },
});

export const useLocale = () => useContext(LocaleContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Messages | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async (localeCode: SupportedLocale) => {
    try {
      const module = await import(`../../messages/${localeCode}.json`);
      setMessages(module.default);
      setLocale(localeCode);
    } catch {
      // Fallback to default locale if locale not found
      const module = await import(`../../messages/${DEFAULT_LOCALE}.json`);
      setMessages(module.default);
      setLocale(DEFAULT_LOCALE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check localStorage first, then browser locale
    const savedLocale = typeof window !== 'undefined' 
      ? localStorage.getItem(clientConfig.localeStorageKey)
      : null;
    
    // Validate saved locale
    const validatedLocale = savedLocale && SUPPORTED_LOCALES.includes(savedLocale as SupportedLocale)
      ? (savedLocale as SupportedLocale)
      : getUserLocale();
    
    loadMessages(validatedLocale);
  }, [loadMessages]);

  const handleLocaleChange = useCallback((newLocale: SupportedLocale) => {
    // Validate locale before changing
    if (!SUPPORTED_LOCALES.includes(newLocale)) {
      console.warn(`Invalid locale: ${newLocale}. Using default locale.`);
      newLocale = DEFAULT_LOCALE;
    }
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(clientConfig.localeStorageKey, newLocale);
    }
    
    // Reload messages for new locale
    setIsLoading(true);
    loadMessages(newLocale);
  }, [loadMessages]);

  if (isLoading || !messages) {
    // Return minimal loading UI
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, onLocaleChange: handleLocaleChange }}>
      <NextIntlClientProvider 
        locale={locale} 
        messages={messages}
        timeZone={typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'}
      >
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}


