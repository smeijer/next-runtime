import { handle, json } from '../../src';

export const getServerSideProps = handle({
  get: async () => {
    return json({
      message: 'The redirect has landed. 🚀',
    });
  },
});

export default function ClientRedirect({ message }: { message: string }) {
  return <p>{message}</p>;
}
