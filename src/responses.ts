import { IncomingHttpHeaders } from 'http';

import { assertEnabled, USE_ASYNC_LOCAL_STORAGE } from './lib/flags';
import { asyncLocalStorage } from './runtime/local-storage';

function setHeaders(headers: IncomingHttpHeaders) {
  if (!headers) return;

  assertEnabled(
    USE_ASYNC_LOCAL_STORAGE,
    'this features requires node 16.4 or higher',
  );

  const { res } = asyncLocalStorage.getStore();

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

/**
 * Send the user a 404
 */
export function notFound(options: { headers?: IncomingHttpHeaders } = {}) {
  setHeaders(options.headers);

  return {
    notFound: true,
  };
}

/**
 * Redirect the user to another page. Defaults to temporary redirect.
 */
export function redirect(
  destination: string,
  options: { permanent?: boolean; headers?: IncomingHttpHeaders } = {},
) {
  setHeaders(options.headers);

  return {
    redirect: {
      destination,
      permanent: options?.permanent ?? false,
    },
  };
}

/**
 * Return the props used to render the page, or as api response
 */
export function json<
  TProps extends { [key: string]: any } = { [key: string]: any },
>(props: TProps, options: { headers?: IncomingHttpHeaders } = {}) {
  setHeaders(options.headers);

  return {
    props,
  };
}
