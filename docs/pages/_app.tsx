import withTwindApp from '@twind/next/shim/app';
import * as React from 'react';

import twindConfig from '../twind.config';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default withTwindApp(twindConfig, MyApp);
