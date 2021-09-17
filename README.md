![banner](docs/public/banner.png)

All you need to handle `POST` requests and file uploads in [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering).

## Documentation

All documentation and guides can be found at [next-runtime.meijer.ws](https://next-runtime.meijer.ws/).

## Features

next-runtime aims to move more logic to the "runtime part" of your Next.js server, and less static site generation. With proper cache headers, every server is an (incremental) static site generator.

To achieve that, we provide you a convenient API to:

- Handle POST requests in `getServerSideProps`.
- Handle file uploads in `getServerSideProps`.
- Easily manage headers and cookies.
- Reuse `getServerSideProps` as zero-config JSON api.

## Usage

In case you're not the documentation type of person, here's a quick example to get you up and running. Please consult [the docs](https://next-runtime.meijer.ws/) if this leaves you with questions.

```js
import fs from 'fs';
import { handle, json } from 'next-runtime';
import { Form, usePendingFormSubmit } from 'next-runtime/form';

export const getServerSideProps = handle({
  async upload({ file, stream }) {
    stream.pipe(fs.createWriteStream(`/uploads/${file.name}`));
  },

  async get({ params, query }) {
    return json({ name: 'Stephan Meijer' });
  },

  async post({ req: { body } }) {
    return json({ message: 'Thanks for your submission!' });
  },
});

export default function Home({ name, message }) {
  const pending = usePendingFormSubmit();

  if (message) {
    return <p>{message}</p>;
  }

  return (
    <Form method="post" encType="multipart/form-data">
      <input name="name" defaultValue={name} />
      <input type="file" name="file" />
      <button type="submit">{pending ? 'submitting' : 'submit'}</button>
    </Form>
  );
}
```

## Contributing

There are a few surprising things going on in this repo. We have two test runners, as well as two tsconfig files. Let me explain why;

**npm run test:unit**

This is a basic ts-jest runner that runs tests located in `./src`. The tests will use a fake next server to test our functionality, without depending on a next build.

**npm run test:e2e**

These are tests run by playwright, against a real next instance. Running next means that we need a `/pages` directory. Hence, the test files are located in `/pages`. That directory now serves as place for e2e tests, which can also serve as "examples".

**tsconfig.build.json**

`test:e2e` is also the reason why we need two tsconfigs. `tsconfig.build.json` is used to build the lib. Because the spawning of next for e2e tests, automatically create or adjusts the main `tsconfig.json`. Which breaks our build.

**/src**

That's where you find all the source files for `next-runtime`.

**/docs**

Is where you'll find the documentation. Run `npm run dev` in that directory to start the documentation webserver. All documentation content files can be found in `/docs/content`.

## Sponsor

Are you, or your employer, a satisfied user of this, or any of [my other projects](https://meijer.ws/open-source). Then please [consider sponsoring](https://github.com/sponsors/smeijer) my work so I can dedicate more time to maintaining this kind of projects.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/smeijer"><img src="https://avatars.githubusercontent.com/u/1196524?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Stephan Meijer</b></sub></a><br /><a href="https://github.com/smeijer/next-runtime/commits?author=smeijer" title="Code">💻</a> <a href="https://github.com/smeijer/next-runtime/commits?author=smeijer" title="Documentation">📖</a> <a href="#ideas-smeijer" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-smeijer" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-smeijer" title="Maintenance">🚧</a></td>
    <td align="center"><a href="https://gal.hagever.com"><img src="https://avatars.githubusercontent.com/u/2054772?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gal Schlezinger</b></sub></a><br /><a href="https://github.com/smeijer/next-runtime/commits?author=schniz" title="Documentation">📖</a></td>
    <td align="center"><a href="http://mapleleaf.dev"><img src="https://avatars.githubusercontent.com/u/19603573?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Darius</b></sub></a><br /><a href="https://github.com/smeijer/next-runtime/commits?author=itsMapleLeaf" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
