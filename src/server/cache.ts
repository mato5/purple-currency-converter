import { createCache } from 'cache-manager';
import { Keyv } from 'keyv';

export const cache = createCache({
  stores: [new Keyv()],
});
