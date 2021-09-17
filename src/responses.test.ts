import { next } from './__utils__/server';
import { handle } from './handle';
import { json, notFound, redirect } from './responses';

test('handles redirects', async () => {
  const fetch = await next(
    handle({
      async get({ req: { method, url } }) {
        return json({ method, url });
      },

      async post({ req: { method } }) {
        return redirect('/other-page');
      },
    }),
  );

  const response = await fetch('/', {
    method: 'POST',
  });

  expect(response.body).toEqual({
    url: '/other-page',
    method: 'GET',
  });
});

test('handles notFound', async () => {
  const fetch = await next(
    handle({
      async get() {
        return notFound();
      },
    }),
  );

  const response = await fetch('/', {
    method: 'GET',
    headers: { accept: 'text/html' },
  });

  expect(response.body).toEqual({ notFound: true });
});

test('can read request headers', async () => {
  const fetch = await next(
    handle({
      async get({ req }) {
        return json({ header: req.getHeader('x-custom') });
      },
    }),
  );

  const response = await fetch('/', {
    headers: { 'x-custom': 'one' },
  });

  expect(response.body).toEqual({ header: 'one' });
});

test('can set response headers', async () => {
  const fetch = await next(
    handle({
      async get({ req: { method }, res }) {
        res.setHeader('session', 'one');
        return json({ method }, { headers: { 'alt-syntax': 'two' } });
      },
    }),
  );

  const response = await fetch('/');
  expect(response.headers.get('session')).toEqual('one');
  expect(response.headers.get('alt-syntax')).toEqual('two');
});

test('can set response code and status message', async () => {
  const fetch = await next(
    handle({
      async get({ req: { method }, res }) {
        return json({ method }, { status: 418, statusText: `I\'m a teapot` });
      },
    }),
  );

  const response = await fetch('/');
  expect(response.status).toEqual(418);
  expect(response.statusText).toEqual(`I'm a teapot`);
});

test('can get request cookies', async () => {
  const fetch = await next(
    handle({
      async get({ req }) {
        return json({ cookie: req.getCookie('session') });
      },
    }),
  );

  const response = await fetch('/', {
    cookies: {
      session: 'one',
    },
  });

  expect(response.body).toEqual({ cookie: 'one' });
});

test('can set response cookies', async () => {
  const fetch = await next(
    handle({
      async get({ req: { method }, res }) {
        res.setCookie('session', 'two');
        return json({ method });
      },
    }),
  );

  const response = await fetch('/');
  expect(response.headers.get('set-cookie')).toEqual(
    'session=two; path=/; httponly',
  );
});
