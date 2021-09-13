import * as React from 'react';

let printedWarning = false;
function GoogleAnalytics() {
  const ga = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

  if (!ga) {
    if (!printedWarning) {
      printedWarning = true;
      console.warn('google analytics is not enabled due to missing env key');
    }
    return null;
  }

  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga}');
          `,
        }}
      />
    </>
  );
}

export default GoogleAnalytics;
