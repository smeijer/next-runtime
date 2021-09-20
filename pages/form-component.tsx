import { useState } from 'react';

import { handle, json } from '../src';
import { Form, FormError, usePendingFormSubmit } from '../src/form';
import { streamToBuffer } from '../src/utils';

type PageProps = any;
const sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export const getServerSideProps = handle<PageProps>({
  async upload({ file, stream }) {
    file.contents = (await streamToBuffer(stream)).toString('utf-8');
  },

  async get({ query }) {
    return json({
      shallow: typeof query.shallow !== 'undefined',
      message: 'hi from get!',
      time: Date.now(),
    });
  },

  async post({ req: { body } }) {
    await sleep(50); // fake work

    if (body.name === 'error') {
      return json({ message: 'error from server' }, 422);
    }

    return json({ ...body, message: 'hi from post' });
  },
});

export default function FormComponent(props: PageProps) {
  const pending = usePendingFormSubmit();
  const [error, setError] = useState<FormError>();

  if ('file' in props) {
    return <pre>{props.file.contents}</pre>;
  }

  return (
    <>
      {error ? <p id="error">{(error as any)?.message}</p> : null}

      <p id="message">
        {props.message} <span id="time">{props.time}</span>
      </p>
      <Form method="post" shallow={props.shallow} onError={setError}>
        <input name="name" type="text" />
        <input name="file" type="file" />
        <input type="submit" />
      </Form>
      {pending ? (
        <p id="status">{`submitting ${pending.data.get('name')}`}</p>
      ) : null}
    </>
  );
}
