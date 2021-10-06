import { useState } from 'react';

import { handle, json } from '../src';
import { Form, useFormSubmit } from '../src/form';

type PageProps = { message?: string };

export const getServerSideProps = handle<PageProps>({
  async get() {
    return json({});
  },

  async post({ req }) {
    if (req.body.error) {
      return json({ message: 'Error' }, 400);
    }
    return json({ message: 'success' });
  },
});

export default function FormCallbacks() {
  const { isLoading, isSuccess, isError } = useFormSubmit<PageProps>();
  const [formVisible, setFormVisible] = useState(false);

  return (
    <>
      <button id="show-form" onClick={() => setFormVisible(true)}>
        Show form
      </button>

      <p id="result">{isSuccess ? 'success' : isError ? 'error' : 'idle'}</p>

      {formVisible && (
        <Form
          method="post"
          onSuccess={() => setFormVisible(false)}
          onError={() => setFormVisible(false)}
        >
          <label>
            error?
            <input id="error-checkbox" type="checkbox" name="error" />
          </label>
          <button id="submit" type="submit" disabled={isLoading}>
            Submit
          </button>
        </Form>
      )}
    </>
  );
}
