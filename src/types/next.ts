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

export type PropResult<P extends Record<string, unknown>> = { props: P };
export type NotFoundResult = { notFound: true };
export type RedirectResult = { redirect: Redirect };

export type GetServerSidePropsResult<P extends Record<string, unknown>> =
  | PropResult<P>
  | RedirectResult
  | NotFoundResult;

export type GetServerSideProps<
  P extends { [key: string]: any } = { [key: string]: any },
  Q extends ParsedUrlQuery = ParsedUrlQuery,
> = (
  context: GetServerSidePropsContext<Q>,
) => Promise<GetServerSidePropsResult<P>>;
