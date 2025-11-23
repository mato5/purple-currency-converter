// @ts-check

import { NextConfig } from 'next';
import { env } from './src/server/env';

/**
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
export default {
  /** We run typechecking as a separate task in CI */
  typescript: {
    ignoreBuildErrors: true,
  },
} satisfies NextConfig;
