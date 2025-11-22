import type { Metadata } from 'next';
import { Providers } from './providers';
import '~/styles/globals.css';

export const metadata: Metadata = {
  title: 'Prisma Starter',
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

