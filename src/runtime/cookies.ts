import Cookies from 'cookies';

import { GetServerSidePropsContext } from '../types/next';

export type CookieJar = {
  req: { getCookie: InstanceType<typeof Cookies>['get'] };
  res: { setCookie: InstanceType<typeof Cookies>['set'] };
};

export function bindCookieJar({ req, res }: GetServerSidePropsContext) {
  const cookies = new Cookies(req, res);
  (req as any).getCookie = cookies.get.bind(cookies);
  (res as any).setCookie = cookies.set.bind(cookies);
}
