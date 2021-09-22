import { setTimeout } from 'node:timers/promises';

import { handle, json, redirect } from '../src';
import { Form, useFormSubmit } from '../src/form';

const toggle = false;

function isAuthenticated<T>(
  request: T,
): asserts request is T & { user: Record<string, string> } {
  if (!('user' in request)) {
    throw redirect('/login', 303);
  }
}

export const getServerSideProps = handle({
  async get() {
    await setTimeout(1000);
    return json({ toggle });
  },

  async post({ req }) {
    isAuthenticated(req);

    return json(req.user, 303) as any;
  },
});

export default function Toggle({ toggle }: { toggle: boolean }) {
  return (
    <main>
      <p>submitting this form should result in a redirect</p>
      <Form method="post">
        <button type="submit">submit</button>
      </Form>
    </main>
  );
}
