import { handle, json, redirect } from '../../src';
import { Form } from '../../src/form';

export const getServerSideProps = handle({
  get: () => {
    return json({});
  },
  patch: async () => {
    return redirect('/client-redirect/destination', { status: 303 });
  },
});

export default function ClientRedirect() {
  return (
    <Form method="patch">
      <input type="hidden" name="redirectStatus" value="303" />
      <button type="submit">Submit</button>
    </Form>
  );
}
