import { createCaller } from '~/server/routers/_app';
import { createContextInner } from '~/server/context';

/**
 * This is a helper for server-side tRPC calls
 * Use this in server components and server actions
 */
export async function createServerSideHelpers() {
  const ctx = await createContextInner();
  return createCaller(ctx);
}

