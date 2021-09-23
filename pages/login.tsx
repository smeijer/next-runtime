import { handle, json, redirect } from '../src';
import { Form } from '../src/form';
import { streamToBuffer } from '../src/utils';

type PageProps = any;

export const getServerSideProps = handle<PageProps>({
  async upload({ file, stream }) {
    file.contents = (await streamToBuffer(stream)).toString('utf-8');
  },

  async get({ query }) {
    return json(query);
  },

  async post() {
    return redirect('/form-component');
  },
});

export default function LoginPage(props: PageProps) {
  const Tag = typeof props.nojs === 'undefined' ? Form : 'form';

  return (
    <Tag method="post">
      <input name="username" type="text" />
      <input name="password" type="password" />
      <input type="submit" />
    </Tag>
  );
}
