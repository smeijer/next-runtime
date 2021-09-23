import { handle, json } from '../src';
import { Form, useFormSubmit } from '../src/form';

type PageProps = { message?: string };

export const getServerSideProps = handle<PageProps>({
  async get() {
    return json({});
  },

  async post() {
    return json({ message: 'success' });
  },
});

export default function FormWithAction() {
  const { data, error } = useFormSubmit<PageProps>();

  return (
    <>
      {error ? <p id="error">{error.message}</p> : null}
      <p id="message">{data?.message}</p>
      <Form action="/form-with-action" method="post">
        <button id="submit" type="submit">
          Submit
        </button>
      </Form>
    </>
  );
}
