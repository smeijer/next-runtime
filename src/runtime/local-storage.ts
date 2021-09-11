import { AsyncLocalStorage } from 'async_hooks';

import { GetServerSidePropsContext } from '../types/next';

export const asyncLocalStorage =
  new AsyncLocalStorage<GetServerSidePropsContext>();
