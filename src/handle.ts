import accepts from 'accepts';
import { ServerResponse } from 'http';
import { Response } from 'node-fetch';

import {
  HttpMethod,
  httpMethodsWithBody,
  HttpMethodWithBody,
} from './http-methods';
import { log } from './lib/log';
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

type MaybePromise<T> = Promise<T> | T;

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
function applyResponse<T>(
  response: TypedResponse<T> | GetServerSidePropsResult<T>,
  target: ServerResponse,
  accept: 'html' | 'json' | false,
): GetServerSidePropsResult<T> {
  if (!(response instanceof Response)) {
    return response;
  }

  target.statusCode = response.status;
  target.statusMessage = response.statusText;

  for (const [key, value] of response.headers) {
    if (key === 'x-next-runtime-type') continue;
    target.setHeader(key, value);
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

  switch (response.headers.get('x-next-runtime-type')) {
    case 'json': {
      return { props: JSON.parse(response.body.toString()) };
    }

    case 'redirect': {
      return {
        redirect: {
          destination: response.headers.get('Location') as string,
          permanent: response.status === 301,
        },
      };
    }

    case 'not-found': {
      return {
        notFound: true,
      };
    }
  }

  return { notFound: true };
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

function assertRequestMethod<T>(
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

    let response: Response;
    const handler = handlers[method];

    if (typeof handler === 'function') {
      try {
        response = (await handler(context)) as TypedResponse<P>;
      } catch (e) {
        // If an Response is thrown, (throw json(...)), we'll handle those as response
        // objects. This allows the user to break out api handlers in nested functions
        if (e instanceof Response) {
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
      context.res.end();
      return VOID_NEXT_RESPONSE;
    }

    // Note, we can't make this api first. That will break shallow rerender
    switch (accept) {
      case 'html': {
        return propResult as any;
      }
      case 'json': {
        context.res.end(
          JSON.stringify('props' in propResult ? propResult.props : {}),
        );
        return VOID_NEXT_RESPONSE;
      }
      default: {
        log.info('unsupported mime type requested');
        return VOID_NEXT_RESPONSE;
      }
    }
  };
}
