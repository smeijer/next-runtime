import { handle, json } from '../src';

type PageProps = { name: string } | { message: string };

export const getServerSideProps = handle<PageProps>({
  async get() {
    return json({ name: 'initial name' });
  },

  async post({ req: { body } }) {
    return json({ message: `submitted ${body.name}` });
  },
});

export default function HtmlForm(props: PageProps) {
  if ('message' in props) {
    return <p>{props.message}</p>;
  }

  return (
    <form method="post">
      <input name="name" defaultValue={props.name} />
      <input type="submit" />
    </form>
  );
}
