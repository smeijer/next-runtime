import withTwindDocument from '@twind/next/shim/document';
import Document, { Head, Html, Main, NextScript } from 'next/document';

import GoogleAnalytics from '../components/google-analytics';
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
          <GoogleAnalytics />
        </body>
      </Html>
    );
  }
}

export default withTwindDocument(twindConfig, MyDocument);
