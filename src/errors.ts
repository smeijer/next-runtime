import { FetchError } from './lib/fetch-error';

export function isFetchError(error: any): error is FetchError {
  return error instanceof FetchError;
}

export { FetchError };
