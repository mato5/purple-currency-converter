import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { createContext } from '~/server/context';
import { createLogger } from '~/server/logger';
import { appRouter } from '~/server/routers/_app';

const logger = createLogger({ module: 'trpc-handler' });

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(),
    onError({ error }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        logger.error({ error }, 'Unhandled tRPC error');
      }
    },
  });

export { handler as GET, handler as POST };
