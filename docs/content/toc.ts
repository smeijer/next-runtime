export type TocCaption = { caption: string };
export type TocLink = { slug: string; title: string };

export type TocEntry = TocCaption | TocLink;

const toc: TocEntry[] = [
  { caption: 'Getting Started' },
  { title: 'Introduction', slug: 'getting-started/1-introduction' },
  { title: 'Installation', slug: 'getting-started/2-installation' },
  { title: 'Loading Data', slug: 'getting-started/3-loading-data' },
  { title: 'Data Updates', slug: 'getting-started/4-data-updates' },
  { title: 'File Uploads', slug: 'getting-started/5-file-uploads' },

  { caption: 'Server API' },
  { title: 'Handle Requests', slug: 'api/handle-requests' },
  { title: 'Response Helpers', slug: 'api/response-helpers' },
  { title: 'Cookies', slug: 'api/cookies' },
  { title: 'Headers', slug: 'api/headers' },

  { caption: 'Client API' },
  { title: 'Form', slug: 'api/form' },
  { title: 'useFormSubmit', slug: 'api/use-form-submit' },
];

export default toc;
