# next-runtime

![banner](docs/banner.png)

Just for a moment, forget everything you know about [`api-routes`](https://nextjs.org/docs/api-routes/introduction), [`static-site-generation`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation) and [`incremental-static-regeneration`](https://nextjs.org/docs/basic-features/data-fetching#incremental-static-regeneration). Next.js [`getServerSideProps`](https://nextjs.org/docs/basic-features/data-fetching#getserversideprops-server-side-rendering) is already an API handler, and with proper cache headers, every server is an (incremental) static site generator.

## Usage

Let's start with the default `getServerSideProps` method that you already know:

```js
export const getServerSideProps = async () => {
  return { props: { name: 'smeijer' } };
};
```

And wrap the function with our `handle` util:

```js
import { handle } from 'next-runtime';

export const getServerSideProps = handle({
  async get() {
    return { props: { name: 'smeijer' } };
  },
});
```

That's it, your page works as before, accept it also serves as `json` api for `GET` requests. We'll come back to that.

Just for convenience, we ship a `json` util that removes the need to wrap props in `props`. I mean, do we ever _not_ return props?

```js
import { handle, json } from 'next-runtime';

export const getServerSideProps = handle({
  async get() {
    return json({ name: 'smeijer' });
  },
});
```

How's that? As already briefly mentioned, by defining the handler inside our `handle` method, we not only serve the page component it's initial props, but this route now also supports `json` request. Give it a shot and request this same page with the browser, and curl or postman. 🤯, right?

Now here's the thing that I'm most excited about. `POST` requests 😱!

```js
export const getServerSideProps = handle({
  async get({ params, query }) {
    return json({ name: 'smeijer' });
  },

  async post({ req: { body } }) {
    await db.comments.insert({
      message: body.message,
    });

    return json({
      message: 'thanks for your comment!',
    });
  },
});
```

I mean, how cool is that? By adding the `post` handler, we'll be able to submit forms, and post data to the same route. No context switching between page, serverSideProps, and api-routes. And here as well it comes with an free api route. Post form-data to it, or json. It doesn't matter.

File uploads are supported as well. More about that in the docs below.

Probably unnecessary, but here's a form that could be submitting data to this `getServerSideProps`.

```jsx
export default function MyPage({ name, message }) {
  if (message) {
    return <p>{message}</p>
  }

  return (
    <form method="post">
      <input name="name" defaultValue={name} />
      <input name="message" />
      <button type="submit">submit</button>
    </Form>
  );
}
```

That's right. Just a standard HTML form.

---

_Sorry, that's it for today. Please come back later for more docs, or be adventurous and give it a shot._ In the mean while, [follow me on twitter](https://twitter.com/meijer_s) for updates.
