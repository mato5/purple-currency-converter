/**
 * Error handling utilities for tRPC procedures
 * Centralizes common error detection and transformation logic
 */
import { TRPCError } from '@trpc/server';

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('network error') ||
      msg.includes('fetch failed') ||
      msg.includes('request timeout') ||
      msg.includes('unable to connect') ||
      msg.includes('failed to fetch')
    );
  }

  return false;
}

/**
 * Check if an error is related to currency not found in exchange rates
 */
export function isCurrencyNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('not found in exchange rates');
  }
  return false;
}

/**
 * Convert any error to a TRPCError with appropriate error code and message
 */
export function toTRPCError(error: unknown, defaultMessage: string): TRPCError {
  // If it's already a TRPCError, return as is
  if (error instanceof TRPCError) {
    return error;
  }

  // Network errors
  if (isNetworkError(error)) {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
      cause: error,
    });
  }

  // Currency not found errors
  if (isCurrencyNotFoundError(error)) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: error instanceof Error ? error.message : 'Currency not found',
      cause: error,
    });
  }

  // Generic error
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: defaultMessage,
    cause: error,
  });
}
