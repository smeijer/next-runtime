import { RuntimeResponse } from './handle';
import { mergeHeaders } from './lib/response-utils';
import {
  GetServerSidePropsResult,
  NotFoundResult,
  PropResult,
  RedirectResult,
} from './types/next';

export type ResponseInit = {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
};

export type TypedResponse<P extends { [key: string]: any }> = {
  body: GetServerSidePropsResult<P>;
} & ResponseInit;

/**
 * Send the user a 404
 */
export function notFound(
  init: number | ResponseInit = 404,
): TypedResponse<never> {
  const body: NotFoundResult = { notFound: true };

  if (typeof init === 'number') {
    return { status: init, body };
  }

  return { status: 404, ...init, body };
}

/**
 * Redirect the user to another page. Defaults to temporary redirect.
 */
export function redirect(
  destination: string,
  init: number | ResponseInit | { permanent: boolean } = 302,
): TypedResponse<never> {
  let responseInit: ResponseInit;

  if (typeof init === 'number') {
    responseInit = { status: init };
  } else if ('permanent' in init) {
    responseInit = { status: init.permanent ? 301 : 302 };
  } else {
    responseInit = { status: 302, ...init };
  }

  const permanent = responseInit.status === 301 || responseInit.status === 308;
  const body: RedirectResult = { redirect: { destination, permanent } };

  const headers = mergeHeaders(responseInit.headers, {
    location: destination,
  });

  return {
    ...responseInit,
    headers,
    body,
  };
}

/**
 * Return the props used to render the page, or as api response
 */
export function json<TProps extends Record<string, unknown>>(
  props: TProps,
  init: number | ResponseInit = {},
): TypedResponse<TProps> {
  let responseInit: ResponseInit;

  if (typeof init === 'number') {
    responseInit = { status: init };
  } else {
    responseInit = { ...init };
  }

  const headers = mergeHeaders(responseInit.headers, {
    'content-type': 'application/json; charset=utf-8',
  });

  return {
    ...responseInit,
    headers,
    body: { props },
  };
}
