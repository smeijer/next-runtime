import { useRef } from 'react';

import { handle, json } from '../src';
import { Form } from '../src/form';
import { FormStateWithHelpers } from '../src/form/helpers';

export const getServerSideProps = handle({
  async get() {
    return json({});
  },
  async post() {
    return json({ message: 'success' });
  },
});

export default function FormRef() {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <Form
      method="POST"
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onSuccess={(_state: FormStateWithHelpers<{ foo: number }>) => {
        // reset the form after submission.
        ref.current?.reset();
      }}
      onError={(state) => {
        // verify that generics is working properly.
        state.data?.foo;
      }}
    >
      <input name="name" />
      <button type="submit">Submit</button>
    </Form>
  );
}
