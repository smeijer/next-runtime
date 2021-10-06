import { RuntimeResponse } from '../handle';
import { TypedResponse } from '../responses';

type Dict = Record<string, string>;

function isPlainObject(obj: unknown): obj is Record<string, unknown> {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

export function mergeResponse(
  left?: RuntimeResponse<any> | void,
  right?: RuntimeResponse<any> | void,
): TypedResponse<any> {
  const leftType = getResponseType(left as any);
  const rightType = getResponseType(right as any);

  // right over left, so left should already have been applied before
  if (leftType === 'not-found') {
    throw left;
  }

  if (rightType === 'not-found') {
    throw right;
  }

  if (leftType === 'redirect') {
    throw left;
  }

  if (rightType === 'redirect') {
    throw right;
  }

  const l = left as any;
  const r = right as any;

  // right over left
  return {
    status: r?.status || l?.status,
    statusText: r?.statusText || l?.statusText,
    headers: mergeHeaders(l?.headers, r?.headers),
    body: {
      props: {
        ...(l?.body || l)?.props,
        ...(r?.body || r)?.props,
      },
    },
  };
}

export function mergeHeaders(left?: Dict, right?: Dict): Dict {
  const headers: Dict = {};

  for (const side of [left, right]) {
    if (typeof side === 'object') {
      for (const key of Object.keys(side)) {
        headers[key.toLowerCase()] = side[key];
      }
    }
  }

  return headers;
}

export function getResponseType(
  response: RuntimeResponse<any>,
): 'not-found' | 'redirect' | 'json' | 'unknown' {
  if (!isPlainObject(response)) {
    return 'unknown';
  }

  const root = 'body' in response ? response.body : response;

  if ('notFound' in root) {
    return 'not-found';
  }

  if ('redirect' in root) {
    return 'redirect';
  }

  if ('props' in root) {
    return 'json';
  }

  return 'unknown';
}

const propResultKeys = new Set(['props', 'notFound', 'redirect']);

export function isTypedResponse(
  response: unknown,
): response is TypedResponse<any> {
  if (!isPlainObject(response)) return false;

  const keys = Object.keys(response);
  return keys.length !== 1 && !propResultKeys.has(keys[0]);
}
