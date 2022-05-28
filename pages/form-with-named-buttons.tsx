import { handle, json } from '../src';
import { Form, useFormSubmit } from '../src/form';

type PageProps = { message?: string };

export const getServerSideProps = handle<PageProps>({
  async get() {
    return json({});
  },

  async post({ req: { body } }) {
    return json({ message: 'created via post request', values: body });
  },

  async delete({ req: { body } }) {
    return json({ message: 'deleted via delete request', values: body });
  },
});

export default function FormWithAction() {
  const { data, error } = useFormSubmit<PageProps>();

  return (
    <>
      {error ? <p id="error">{error.message}</p> : null}
      <p id="message">{data?.message}</p>
      <Form method="post">
        <input type="hidden" name="id" value="abc" />

        <button name="action" value="create" type="submit" formMethod="post">
          Create
        </button>

        <button name="action" value="delete" type="submit" formMethod="delete">
          Delete
        </button>
      </Form>
    </>
  );
}
