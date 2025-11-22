import type { Metadata } from 'next';
import { Providers } from './providers';
import '~/styles/globals.css';

export const metadata: Metadata = {
  title: 'Currency Converter - Real-time Exchange Rates',
  description:
    'Convert currencies with live exchange rates powered by OpenExchangeRates',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}

