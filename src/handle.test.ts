import FormData from 'form-data';

import { next } from './__utils__/server';
import { handle } from './handle';
import { json, notFound, redirect } from './responses';
import { streamToBuffer } from './utils';

test('handles to get requests', async () => {
  const fetch = await next(
    handle({
      async get({ req: { method } }) {
        return json({ method });
      },
    }),
  );

  const standardResponse = await fetch('/', {
    method: 'GET',
    headers: { accept: 'text/html' },
  });
  expect(standardResponse.status).toEqual(200);
  expect(standardResponse.body).toEqual({ props: { method: 'GET' } });

  const jsonResponse = await fetch();
  expect(jsonResponse.status).toEqual(200);
  expect(jsonResponse.body).toEqual({ method: 'GET' });
});

test('expands get query params', async () => {
  const fetch = await next(
    handle({
      async get({ query }) {
        return json(query);
      },
    }),
  );

  const response = await fetch('?person.name=yoda');
  expect(response.body).toEqual({ person: { name: 'yoda' } });
});

test('handles post requests', async () => {
  const fetch = await next(
    handle({
      async post({ req: { method } }) {
        return json({ method });
      },
    }),
  );

  const standardResponse = await fetch('/', {
    method: 'POST',
    headers: { accept: 'text/html' },
  });
  expect(standardResponse.body).toEqual({ props: { method: 'POST' } });

  const jsonResponse = await fetch('/', { method: 'POST' });
  expect(jsonResponse.body).toEqual({ method: 'POST' });
});

test('handles file uploads', async () => {
  const fetch = await next(
    handle({
      async upload({ file, stream }) {
        file.buffer = (await streamToBuffer(stream)).toString('utf-8');
      },

      async post({ req: { body } }) {
        return json({ file: (body.file as any).buffer });
      },
    }),
  );

  const data = new FormData();
  data.append('file', Buffer.from('file contents'), { filename: 'test.txt' });

  const response = await fetch('/', {
    method: 'POST',
    headers: data.getHeaders(),
    body: data,
  });

  expect(response.body).toEqual({ file: 'file contents' });
});

test('ignores unsupported content-types', async () => {
  const fetch = await next(
    handle({
      async post({ req: { method } }) {
        return json({ method });
      },
    }),
  );

  const response = await fetch('/', {
    method: 'POST',
    headers: { 'content-type': 'unsupported' },
  });

  expect(response.body).toEqual({ method: 'POST' });
});

test('returns notFound when method handler is undefined', async () => {
  const fetch = await next(
    handle({
      async get({ req: { method } }) {
        return json({ method });
      },
    }),
  );

  const response = await fetch('/', {
    method: 'POST',
  });

  expect(response.body).toEqual({ notFound: true });
});

test('expands post body', async () => {
  const fetch = await next(
    handle({
      async post({ req: { body } }) {
        return json(body);
      },
    }),
  );

  const data = new FormData();
  data.append('numbers[]', '1');
  data.append('numbers[]', '2');
  data.append('numbers[]', '3');
  data.append('people[0].name', 'john');
  data.append('people[1].name', 'jane');
  data.append('letters', 'a');
  data.append('letters', 'b');
  data.append('letters', 'c');

  const response = await fetch('/', {
    method: 'POST',
    headers: data.getHeaders(),
    body: data,
  });

  expect(response.body).toEqual({
    numbers: ['1', '2', '3'],
    people: [{ name: 'john' }, { name: 'jane' }],
    letters: ['a', 'b', 'c'],
  });
});

test('handles field size limit', async () => {
  const fetch = await next(
    handle({
      limits: {
        fieldSize: 5,
      },
      async post({ req: { body } }) {
        return json(body);
      },
    }),
  );

  const data = new FormData();
  data.append('name', 'abcdef'); // longer than 5

  const response = await fetch('/', {
    method: 'POST',
    headers: data.getHeaders(),
    body: data,
  });

  expect(response.body).toEqual({
    errors: [
      { name: 'FIELD_SIZE_EXCEEDED', message: 'field "name" exceeds 5B' },
    ],
  });

  const jsonResponse = await fetch('/', {
    method: 'POST',
    body: { name: 'abcdef' },
  });

  expect(jsonResponse.body).toEqual({
    errors: [
      { name: 'FIELD_SIZE_EXCEEDED', message: 'field "name" exceeds 5B' },
    ],
  });
});

test('handles json size limit', async () => {
  const fetch = await next(
    handle({
      limits: {
        jsonSize: 5,
      },
      async post({ req: { body } }) {
        return json(body);
      },
    }),
  );

  const response = await fetch('/', {
    method: 'POST',
    body: { property: 'a', another: 'b' },
  });

  expect(response.body).toEqual({
    errors: [{ name: 'JSON_SIZE_EXCEEDED', message: 'json object exceeds 5B' }],
  });
});

test('handles file count limit', async () => {
  const fetch = await next(
    handle({
      limits: {
        fileCount: 2,
      },
      async post({ req: { body } }) {
        return json(body);
      },
    }),
  );

  const data = new FormData();
  data.append('file1', Buffer.from(''), { filename: 'test.txt' });
  data.append('file2', Buffer.from(''), { filename: 'test.txt' });
  data.append('file3', Buffer.from(''), { filename: 'test.txt' });

  const response = await fetch('/', {
    method: 'POST',
    headers: data.getHeaders(),
    body: data,
  });

  expect(response.body).toEqual({
    errors: [{ name: 'FILE_COUNT_EXCEEDED', message: 'file count exceeds 2' }],
  });
});

test('handles mime type limit', async () => {
  const fetch = await next(
    handle({
      limits: {
        fileCount: 1,
        mimeType: 'image/png',
      },
      async post({ req: { body } }) {
        return json(body);
      },
    }),
  );

  const data = new FormData();
  data.append('file1', Buffer.from(''), { filename: 'test.txt' });

  const response = await fetch('/', {
    method: 'POST',
    headers: data.getHeaders(),
    body: data,
  });

  expect(response.body).toEqual({
    errors: [
      {
        name: 'FILE_TYPE_REJECTED',
        message: 'file "test.txt" is not of type "image/png"',
      },
    ],
  });
});

test('handles file size limit', async () => {
  const fetch = await next(
    handle({
      limits: {
        fileCount: 1,
        fileSize: 5,
      },
      async post({ req: { body } }) {
        return json(body);
      },
    }),
  );

  const data = new FormData();
  data.append('file1', Buffer.from('abcdfg'), { filename: 'test.txt' });

  const response = await fetch('/', {
    method: 'POST',
    headers: data.getHeaders(),
    body: data,
  });

  expect(response.body).toEqual({
    errors: [
      {
        name: 'FILE_SIZE_EXCEEDED',
        message: 'file "test.txt" exceeds 5B',
      },
    ],
  });
});

test('handles redirects', async () => {
  const fetch = await next(
    handle({
      async get() {
        return redirect('/other-page', { permanent: true });
      },
    }),
  );

  const response = await fetch('/', {
    method: 'GET',
    headers: { accept: 'text/html' },
  });

  expect(response.body).toEqual({
    redirect: { destination: '/other-page', permanent: true },
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
        // note: this requires node > 16.4
        return json({ method }, { headers: { 'alt-syntax': 'two' } });
      },
    }),
  );

  const response = await fetch('/');
  expect(response.headers.get('session')).toEqual('one');
  expect(response.headers.get('alt-syntax')).toEqual('two');
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
