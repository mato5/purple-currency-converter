'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  httpBatchStreamLink,
  httpSubscriptionLink,
  loggerLink,
  splitLink,
} from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';

import { clientConfig } from '~/lib/config';
import type { AppRouter } from '~/server/routers/_app';

import { transformer } from './transformer';

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  // reference for vercel.com
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // // reference for render.com
  if (process.env.RENDER_INTERNAL_HOSTNAME) {
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  }

  // assume localhost
  return `http://127.0.0.1:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ 
  children,
}: { 
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache timeseries data for 1 hour (client-side)
            staleTime: 60 * 60 * 1000,
            // Keep data in cache for 24 hours
            gcTime: 24 * 60 * 60 * 1000,
            // Don't refetch on window focus for cached data
            refetchOnWindowFocus: false,
            // Retry failed requests
            retry: 2,
          },
          mutations: {
            // Don't retry mutations on failure
            retry: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        splitLink({
          // Use httpSubscriptionLink for subscriptions
          condition: (op) => op.type === 'subscription',
          true: httpSubscriptionLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer,
          }),
          // Use httpBatchStreamLink for queries and mutations
          false: httpBatchStreamLink({
            url: `${getBaseUrl()}/api/trpc`,
            transformer,
            // Add timeout and better error handling
            async fetch(url, options) {
              try {
                const response = await fetch(url, {
                  ...options,
                  signal: AbortSignal.timeout(clientConfig.trpcTimeout),
                });
                return response;
              } catch (error) {
                // Convert all network errors to a consistent error type
                if (error instanceof Error) {
                  if (error.name === 'AbortError') {
                    throw new TypeError('Network error: Request timeout');
                  }
                  if (
                    error.message.includes('Failed to fetch') ||
                    error.message.includes('NetworkError')
                  ) {
                    throw new TypeError('Network error: Unable to connect');
                  }
                }
                throw error;
              }
            },
          }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

