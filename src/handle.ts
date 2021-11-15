import accepts from 'accepts';
import { ServerResponse } from 'http';

import {
  HttpMethod,
  httpMethodsWithBody,
  HttpMethodWithBody,
} from './http-methods';
import { log } from './lib/log';
import { applyMiddlewares, MiddlewareFn } from './lib/middleware';
import { getResponseType, isTypedResponse } from './lib/response-utils';
import { notFound, TypedResponse } from './responses';
import { bodyparser, BodyParserOptions } from './runtime/body-parser';
import { bindCookieJar, CookieJar } from './runtime/cookies';
import { bindTypedHeaders, TypedHeaders } from './runtime/headers';
import { expandQueryParams } from './runtime/query-params';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from './types/next';
import { ParsedUrlQuery } from './types/querystring';

export type RuntimeContext<Q extends ParsedUrlQuery> =
  GetServerSidePropsContext<Q> &
    CookieJar &
    TypedHeaders & { req: { method: Uppercase<HttpMethod> } };

export type RuntimeResponse<P extends { [key: string]: any }> = MaybePromise<
  GetServerSidePropsResult<P> | TypedResponse<P>
>;

export type RequestBody<F> = { req: { body: F } };

export type MaybePromise<T> = Promise<T> | T;

type Handlers<
  P extends { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  F extends Record<string, unknown> = Record<string, unknown>,
> = {
  // Limits to be applied to the body parser for post requests
  limits?: BodyParserOptions['limits'];
  // The directory to upload files to if no `upload` handler is provided
  uploadDir?: BodyParserOptions['uploadDir'];
  // The upload handler, to pipe files to other places
  upload?: BodyParserOptions['onFile'];

  use?: MiddlewareFn<Q>[];

  // The GET request handler, this is the default getServerSideProps
  get?: (context: RuntimeContext<Q>) => RuntimeResponse<P>;

  // POST request handlers, awesome to submit forms to!
  post?: (context: RuntimeContext<Q> & RequestBody<F>) => RuntimeResponse<P>;
  put?: (context: RuntimeContext<Q> & RequestBody<F>) => RuntimeResponse<P>;
  delete?: (context: RuntimeContext<Q> & RequestBody<F>) => RuntimeResponse<P>;
  patch?: (context: RuntimeContext<Q> & RequestBody<F>) => RuntimeResponse<P>;
};

/**
 * Transfer the properties from the Response object to the response to
 * the response stream, and return a next compatible object.
 */
function applyResponse<T extends Record<string, unknown>>(
  response: TypedResponse<T> | GetServerSidePropsResult<T>,
  target: ServerResponse,
  accept: 'html' | 'json' | false,
): GetServerSidePropsResult<T> {
  if (!isTypedResponse(response)) {
    return response;
  }

  if (response.status) {
    target.statusCode = response.status;
  }
  if (response.statusText) {
    target.statusMessage = response.statusText;
  }

  if (response.headers) {
    for (const key of Object.keys(response.headers)) {
      target.setHeader(key, response.headers[key]);
    }

    switch (accept) {
      case 'html': {
        target.setHeader('Content-Type', 'text/html; charset=utf-8');
        break;
      }
      case 'json': {
        target.setHeader('Content-Type', 'application/json; charset=utf-8');
        break;
      }
    }
  }

  if ('notFound' in response.body) {
    return { notFound: response.body.notFound };
  }

  if ('redirect' in response.body) {
    return { redirect: response.body.redirect };
  }

  return { props: response.body.props || ({} as T) };
}

/**
 * sometimes we don't want to return real data, as next might use that to add
 * not-found or redirect headers. Which then cause `sorry, headers already sent`
 * errors
 */
const VOID_NEXT_RESPONSE = { props: { dummy: '' } } as any;

function assertRequestBody<T>(
  context: GetServerSidePropsContext,
): asserts context is GetServerSidePropsContext & { req: { body: T } } {
  // intentionally left blank, we don't care much about it
}

function assertRequestMethod(
  context: GetServerSidePropsContext,
): asserts context is GetServerSidePropsContext & {
  req: { method: Uppercase<HttpMethod> };
} {
  context.req.method = context.req.method?.toUpperCase() || 'GET';
}

type Accept = 'html' | 'json' | false;

export function handle<
  P extends { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  F extends Record<string, unknown> = Record<string, unknown>,
>(handlers: Handlers<P, Q, F>): GetServerSideProps<P, Q> {
  // wrap handlers with middlewares here, so we only do that during build time
  handlers.get = applyMiddlewares(handlers.use, handlers.get);
  handlers.post = applyMiddlewares(handlers.use, handlers.post);
  handlers.put = applyMiddlewares(handlers.use, handlers.put);
  handlers.delete = applyMiddlewares(handlers.use, handlers.delete);
  handlers.patch = applyMiddlewares(handlers.use, handlers.patch);

  return async (context) => {
    const accept = accepts(context.req).type(['html', 'json']) as Accept;
    const method = (context.req.method?.toLowerCase() || 'get') as HttpMethod;

    // also handle complex objects in query params
    context.query = expandQueryParams(context.query);

    // extend the context
    bindCookieJar(context);
    bindTypedHeaders(context);
    assertRequestBody<F>(context);
    assertRequestMethod(context);

    if (httpMethodsWithBody.includes(method as HttpMethodWithBody)) {
      await bodyparser<F>(context.req, context.res, {
        limits: handlers.limits,
        onFile: handlers.upload,
        uploadDir: handlers.uploadDir,
      });
    }

    let response: TypedResponse<any>;
    const handler = handlers[method];

    if (typeof handler === 'function') {
      try {
        response = (await handler(context)) as TypedResponse<P>;
      } catch (e: any) {
        // If an Response is thrown, (throw json(...)), we'll handle those as response
        // objects. This allows the user to break out api handlers in nested functions
        if (getResponseType(e) !== 'unknown') {
          response = e;
        } else {
          throw e;
        }
      }
    } else {
      response = notFound();
    }

    const propResult = applyResponse(response, context.res, accept);

    if ('redirect' in propResult) {
      return propResult;
    }

    // Note, we can't make this api first. That will break shallow rerender
    switch (accept) {
      case 'html': {
        return propResult as any;
      }
      case 'json': {
        // keep write and end separated for Next12 compatibility.
        context.res.write(
          JSON.stringify('props' in propResult ? propResult.props : {}),
        );
        context.res.end();
        return VOID_NEXT_RESPONSE;
      }
      default: {
        log.info('unsupported mime type requested');
        return VOID_NEXT_RESPONSE;
      }
    }
  };
}
