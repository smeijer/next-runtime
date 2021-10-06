import Cookies from 'cookies';

import { GetServerSidePropsContext } from '../types/next';

export type CookieJar = {
  cookies: InstanceType<typeof Cookies>;
  req: { getCookie: InstanceType<typeof Cookies>['get'] };
  res: { setCookie: InstanceType<typeof Cookies>['set'] };
};

export function bindCookieJar(
  context: GetServerSidePropsContext,
): asserts context is GetServerSidePropsContext & CookieJar {
  const ctx = context as GetServerSidePropsContext & CookieJar;
  ctx.cookies = new Cookies(ctx.req, ctx.res);
  ctx.req.getCookie = ctx.cookies.get.bind(ctx.cookies);
  ctx.res.setCookie = ctx.cookies.set.bind(ctx.cookies);
}
