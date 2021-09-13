import withTwindDocument from '@twind/next/shim/document';
import Document, { Head, Html, Main, NextScript } from 'next/document';

import twindConfig from '../twind.config';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head />

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default withTwindDocument(twindConfig, MyDocument);
