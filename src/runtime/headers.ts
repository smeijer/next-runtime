import { IncomingHttpHeaders } from 'http';

import { GetServerSidePropsContext } from '../types/next';

export type TypedHeaders = {
  req: {
    getHeader: (name: keyof IncomingHttpHeaders) => string | undefined;
  };
  res: {
    setHeader: (
      name: keyof IncomingHttpHeaders,
      value: string | number | ReadonlyArray<string>,
    ) => void;
  };
};

export function bindTypedHeaders(
  context: GetServerSidePropsContext,
): asserts context is GetServerSidePropsContext & TypedHeaders {
  (context.req as any).getHeader = (name: string) => context.req.headers[name];
}
