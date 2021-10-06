import Cors from 'cors';

import { handle, json, redirect } from '../src';
import { MiddlewareFn } from '../src/lib/middleware';

const cors: MiddlewareFn = (context, next) =>
  Cors({
    methods: ['GET', 'HEAD'],
  })(context.req, context.res, next);

const responseTime: MiddlewareFn = async (context, next) => {
  const start = performance.now();
  await next();
  const end = performance.now();
  context.res.setHeader('x-request-time', `${(end - start).toFixed(2)} ms`);
};

export const getServerSideProps = handle<any>({
  use: [
    responseTime,
    cors,
    (context) =>
      json({ layout: 'one' }, { headers: { 'x-type-1': 'middleware' } }),
    (context) =>
      json({ layout: 'one' }, { headers: { 'x-type': 'middleware' } }),
  ],

  async get({ query }) {
    return json({ get: 'two' });
  },

  async post() {
    return redirect('/form-component');
  },
});

const Page = () => {
  return <div>middleware page</div>;
};

export default Page;
