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

export function bindTypedHeaders({ req }: GetServerSidePropsContext) {
  (req as any).getHeader = (name) => req.headers[name];
}
