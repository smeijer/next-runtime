import App, { AppProps } from 'next/app';
import * as React from 'react';
import { ReactElement } from 'react';

import { useFormSubmit } from './form';

export function withNextRuntime(BaseApp?: (props: AppProps) => ReactElement) {
  return function NextRuntime({ pageProps, ...rest }: AppProps) {
    const pending = useFormSubmit();

    const props = {
      pageProps: pending.data || pageProps,
      ...rest,
    };

    return BaseApp ? <BaseApp {...props} /> : <App {...props} />;
  };
}
