import { handle, json } from '../src';
import { streamToBuffer } from '../src/utils';

type PageProps = any;

export const getServerSideProps = handle<PageProps>({
  async upload({ file, stream }) {
    file.contents = (await streamToBuffer(stream)).toString('utf-8');
  },

  async get() {
    return json({});
  },

  async post({ req: { body } }) {
    return json({ file: body.file });
  },
});

export default function HtmlForm(props: PageProps) {
  if ('file' in props) {
    return <pre>{props.file.contents}</pre>;
  }

  return (
    <form method="post" encType="multipart/form-data">
      <input name="file" type="file" />
      <input type="submit" />
    </form>
  );
}
