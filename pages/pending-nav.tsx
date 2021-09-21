import { setTimeout } from 'node:timers/promises';

import { handle, json, redirect } from '../src';
import { Form, useFormSubmit } from '../src/form';

let toggle = false;

export const getServerSideProps = handle({
  async get() {
    await setTimeout(1000);
    return json({ toggle });
  },
  async post(context) {
    await setTimeout(1000);
    toggle = !toggle;
    console.log('POST', toggle);
    return redirect<never>(context.req.url!, 303);
  },
});

export default function Toggle({ toggle }: { toggle: boolean }) {
  const pending = useFormSubmit();

  return (
    <main>
      <p>
        {pending.status} {pending.isLoading ? '(loading)' : null}
      </p>
      <p>toggle: {String(toggle)}</p>
      <Form method="post">
        <button type="submit">toggle</button>
      </Form>
      <pre>{JSON.stringify(pending, null, 2)}</pre>
    </main>
  );
}
