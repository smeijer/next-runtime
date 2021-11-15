import fetchCookie from 'fetch-cookie';
import FormData from 'form-data';
import http from 'http';
import { GetServerSideProps } from 'next';
import nodeFetch from 'node-fetch';
import listen from 'test-listen';
import { parse as parseUrl } from 'url';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  body?: FormData | Record<string, unknown> | string;
};

async function request(
  url: string,
  {
    method = 'GET',
    headers = {},
    cookies = {},
    body = undefined,
  }: RequestOptions = {},
) {
  const cookie = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join(';');

  const fetcher = fetchCookie(nodeFetch);
  const response = await fetcher(url, {
    method,
    headers: {
      // default to json, as that works easiest in tests
      'content-type': 'application/json',
      accept: 'application/json',
      cookie,
      ...headers,
    },
    body:
      body instanceof FormData
        ? body
        : typeof body === 'string'
        ? body
        : JSON.stringify(body),
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    body: await response.json(),
  };
}

export async function next(getServerSideProps: GetServerSideProps) {
  let lastRequest: number;

  const server = http.createServer((req, res) => {
    lastRequest = Date.now();

    getServerSideProps({
      req,
      res,
      // https://github.com/vercel/next.js/blob/07fe406bd5c25e69f3c62dabf200c8488f97d7d2/packages/next/server/next-server.ts#L1645
      query: parseUrl(req.url || '', true).query,
    } as any)
      .then((result) => {
        if (!res.writableEnded) {
          res.write(JSON.stringify(result));
          res.end();
        }
      })
      // We only do this in the test server, so we can validate the handle function
      // maybe we should do this in real as well? I mean, return errors in the
      // response, instead of just throwing and leaving it up to the user to handle?
      .catch((e) => {
        res.statusCode = 500;
        res.write(JSON.stringify(e));
        res.end();
      });
  });

  const interval = setInterval(() => {
    if (!lastRequest || Date.now() - lastRequest < 250) return;
    clearInterval(interval);
    server.close();
  }, 25);

  const url = await listen(server);

  const fetch = async (path = '/', options?: RequestOptions) =>
    request(`${url}${path}`, options);

  fetch.url = url;
  return fetch;
}
