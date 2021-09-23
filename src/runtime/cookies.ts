import Cookies from 'cookies';

import { GetServerSidePropsContext } from '../types/next';

export type CookieJar = {
  req: { getCookie: InstanceType<typeof Cookies>['get'] };
  res: { setCookie: InstanceType<typeof Cookies>['set'] };
};

export function bindCookieJar(
  context: GetServerSidePropsContext,
): asserts context is GetServerSidePropsContext & CookieJar {
  const cookies = new Cookies(context.req, context.res);
  (context.req as any).getCookie = cookies.get.bind(cookies);
  (context.res as any).setCookie = cookies.set.bind(cookies);
}
