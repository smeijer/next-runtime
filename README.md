# next-runtime

```tsx
import { handle, json } from 'next-runtime';
import { Form, usePendingFormSubmit } from 'next-runtime/form';
import { streamToBuffer } from 'next-runtime/utils';

type PageProps = { name: string; image?: string };
type FormData = { name: string; file: File & { buffer: string } };
type UrlQuery = { id: string };

export const getServerSideProps = handle<PageProps, UrlQuery, FormData>({
  async upload(file, stream) {
    file.buffer = (await streamToBuffer(stream)).toString('base64');
  },

  async get({ params, query }) {
    return json({ name: 'smeijer', town: 'leeuwarden' });
  },

  async post({ req: { body } }) {
    return json({
      name: body.name,
      image: body.file?.buffer || '',
    });
  },
});

export default function Home({ name, town, age, image }) {
  const pending = usePendingFormSubmit();

  return (
    <Form method="post">
      <input name="name" defaultValue={name} />
      <input name="age" defaultValue={age} />
      <input type="file" name="file" />
      <button type="submit" disabled={!!pending}>
        {pending ? 'submitting' : 'submit'}
      </button>
    </Form>
  );
}
```
