import Head from 'next/head';
import * as React from 'react';

import { absoluteUrl } from '../lib/absolute-url';

interface SocialProps {
  color?: string;
  keywords?: string[];
  name?: string;
  title?: string;
  socialTitle?: string;
  description?: string;
  image?: string;
  icons?: string[];
  url?: string;
}

const extMimeMap = {
  png: 'image/png',
  jpg: 'image/jpg',
};

function SocialHead({
  color = '#1f2937',
  keywords = [],
  name = 'next-runtime',
  title = 'next-runtime',
  socialTitle = title,
  description = 'All you need to handle POST requests, file uploads, and api requests, in Next.js getServerSideProps.',
  image = absoluteUrl('/social.png'),
  icons = [
    absoluteUrl('/logo-24.png'),
    absoluteUrl('/logo-48.png'),
    absoluteUrl('/logo-96.png'),
    absoluteUrl('/logo-128.png'),
    absoluteUrl('/logo-256.png'),
  ],
  url = absoluteUrl('/'),
}: SocialProps) {
  const sortedIcons = icons
    .map((href) => {
      const [ext, size] = href.split(/[\/\-.]/).reverse();
      return { ext, size: ~~size, href };
    })
    .sort((a, b) => b.size - a.size);

  return (
    <Head>
      <meta charSet="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />

      {title ? <title>{title}</title> : null}

      <meta name="description" content={description} />
      <meta name="msapplication-TileColor" content={color} />
      <meta name="theme-color" content={color} />
      <meta name="keywords" content={keywords.join(', ')} />

      {/*<!-- icons -->*/}
      {sortedIcons?.flatMap(({ href, size, ext }) =>
        ['icon', 'apple-touch-icon'].map((rel) => (
          <link
            key={rel + href}
            rel={rel}
            type={extMimeMap[ext] || extMimeMap.png}
            sizes={`${size}x${size}`}
            href={href}
          />
        )),
      )}

      {/*<!-- Schema.org -->*/}
      <meta itemProp="name" content={socialTitle} />
      <meta itemProp="description" content={description} />
      <meta itemProp="image" content={image} />
      <meta property="image:alt" content={description} />

      {/*<!-- Facebook OpenGraph -->*/}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={socialTitle} />
      <meta property="og:site_name" content={name} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={description} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="670" />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content="en_US" />

      {/*<!-- Twitter OpenGraph -->*/}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={socialTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={description} />
    </Head>
  );
}

export default SocialHead;
