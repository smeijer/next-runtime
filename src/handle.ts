import accepts from 'accepts';

import { USE_ASYNC_LOCAL_STORAGE } from './lib/flags';
import { log } from './lib/log';
import { notFound } from './responses';
import { bodyparser, BodyParserOptions } from './runtime/body-parser';
import { bindCookieJar, CookieJar } from './runtime/cookies';
import { bindTypedHeaders, TypedHeaders } from './runtime/headers';
import { asyncLocalStorage } from './runtime/local-storage';
import { expandQueryParams } from './runtime/query-params';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from './types/next';
import { ParsedUrlQuery } from './types/querystring';

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
  get: (
    context: GetServerSidePropsContext<Q> & CookieJar & TypedHeaders,
  ) => Promise<GetServerSidePropsResult<P>>;

  // The POST request handler, awesome to submit forms to!
  post: (
    context: GetServerSidePropsContext<Q> & { req: { body: F } } & CookieJar &
      TypedHeaders,
  ) => Promise<GetServerSidePropsResult<P>>;
};

export function handle<
  P extends { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery,
  F extends Record<string, unknown> = Record<string, unknown>,
>(handlers: Handlers<P, Q, F>): GetServerSideProps<P, Q> {
  return async (context) => {
    const { req, res } = context;
    const accept = accepts(req);

    const method = req.method.toLowerCase();
    if (typeof handlers[method] !== 'function') {
      return notFound();
    }

    // also handle complex objects in query params
    context.query = expandQueryParams(context.query);

    if (method === 'post') {
      await bodyparser<F>(req, {
        limits: handlers.limits,
        onFile: handlers.upload,
        uploadDir: handlers.uploadDir,
      });
    }

    async function handle() {
      bindCookieJar(context);
      bindTypedHeaders(context);

      const result = await handlers[method](context);

      switch (accept.type(['json', 'html'])) {
        case 'html': {
          res.setHeader('content-type', 'text/html');
          return result;
        }
        case 'json': {
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(result.props || {}));
          return result;
        }
        default: {
          log.info('unsupported mime type requested');
          return result;
        }
      }
    }

    if (USE_ASYNC_LOCAL_STORAGE) {
      return asyncLocalStorage.run(context, handle);
    }

    return handle();
  };
}
