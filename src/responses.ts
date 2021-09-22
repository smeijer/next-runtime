import {
  Headers,
  Response,
  ResponseInit as FullResponseInit,
} from 'node-fetch';

import { RuntimeResponse } from './handle';

export type TypedResponse<T extends { [key: string]: any }> = Response;

export type ResponseInit = Pick<
  FullResponseInit,
  'status' | 'statusText' | 'headers'
>;
export type ResponseType = 'not-found' | 'redirect' | 'json';

function createResponse<T>({
  body = {} as T,
  init,
  type,
}: {
  body?: T;
  init: ResponseInit;
  type: ResponseType;
}): TypedResponse<T> {
  const response = new Response(JSON.stringify(body), init) as TypedResponse<T>;
  response.headers.set('x-next-runtime-type', type);
  return response;
}

/**
 * Send the user a 404
 */
export function notFound(
  init: number | ResponseInit = 404,
): TypedResponse<never> {
  let responseInit: ResponseInit;

  if (typeof init === 'number') {
    responseInit = { status: init };
  } else {
    responseInit = { status: 404, ...init };
  }

  return createResponse<never>({ init: responseInit, type: 'not-found' });
}

/**
 * Redirect the user to another page. Defaults to temporary redirect.
 */
export function redirect(
  destination: string,
  init: number | ResponseInit | { permanent: boolean } = 302,
): RuntimeResponse<never> {
  let responseInit: ResponseInit;

  if (typeof init === 'number') {
    responseInit = { status: init };
  } else if ('permanent' in init) {
    responseInit = { status: init.permanent ? 301 : 302 };
  } else {
    responseInit = { status: 302, ...init };
  }

  const headers = new Headers(responseInit.headers);
  headers.set('Location', destination);

  return createResponse<never>({
    init: { ...responseInit, headers },
    type: 'redirect',
  });
}

/**
 * Return the props used to render the page, or as api response
 */
export function json<TProps>(
  props: TProps,
  init: number | ResponseInit = {},
): RuntimeResponse<TProps> {
  let responseInit: ResponseInit;

  if (typeof init === 'number') {
    responseInit = { status: init };
  } else {
    responseInit = { ...init };
  }

  const headers = new Headers(responseInit.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }

  return createResponse({
    body: props,
    init: { ...responseInit, headers },
    type: 'json',
  });
}
