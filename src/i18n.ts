import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SUPPORTED_LOCALES, type SupportedLocale } from '~/lib/locales';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validatedLocale = locale as SupportedLocale;
  if (!SUPPORTED_LOCALES.includes(validatedLocale)) notFound();

  return {
    locale: validatedLocale,
    messages: (await import(`../messages/${validatedLocale}.json`)).default,
    timeZone: 'UTC',
  };
});
