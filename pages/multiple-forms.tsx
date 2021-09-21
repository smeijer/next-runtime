import { handle, json } from '../src';
import { Form, useFormSubmit } from '../src/form';
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
  const forms = [
    useFormSubmit('form0'),
    useFormSubmit('form1'),
    useFormSubmit('form2'),
    useFormSubmit('form3'),
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        padding: 16,
      }}
    >
      {Array.from({ length: forms.length }).map((_, idx) => (
        <div key={idx} style={{ background: '#eee', padding: 8 }}>
          <p>Form {idx}</p>
          <Form name={`form${idx}`} method="post">
            <input name="name" type="text" />
            <input name="file" type="file" />
            <input type="submit" />
          </Form>
          <p>status: {forms[idx].status}</p>
        </div>
      ))}
    </div>
  );
}
