import { IncomingMessage, ServerResponse } from 'http';

import { ParsedUrlQuery } from './querystring';

export type Redirect =
  | {
      statusCode: 301 | 302 | 303 | 307 | 308;
      destination: string;
      basePath?: false;
    }
  | {
      permanent: boolean;
      destination: string;
      basePath?: false;
    };

export type GetServerSidePropsContext<
  Q extends ParsedUrlQuery = ParsedUrlQuery,
> = {
  req: IncomingMessage & {
    cookies: Record<string, string>;
  };
  res: ServerResponse;
  params?: Q;
  query: ParsedUrlQuery;
};

export type GetServerSidePropsResult<P> =
  | { props: P }
  | { redirect: Redirect }
  | { notFound: true };

export type GetServerSideProps<
  P extends { [key: string]: any } = { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery,
> = (
  context: GetServerSidePropsContext<Q>,
) => Promise<GetServerSidePropsResult<P>>;
