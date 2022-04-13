import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  Redirect,
} from 'next';

export type RedirectStatusCode = Extract<
  Redirect,
  { statusCode: number }
>['statusCode'];

export type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  Redirect,
};

export type PropResult<P> = Extract<
  GetServerSidePropsResult<P>,
  { props: any }
>;

export type NotFoundResult = Extract<
  GetServerSidePropsResult<never>,
  { notFound: any }
>;

export type RedirectResult = Extract<
  GetServerSidePropsResult<never>,
  { redirect: any }
>;
