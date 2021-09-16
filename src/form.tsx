import { useRouter } from 'next/router';
import {
  FormHTMLAttributes,
  forwardRef,
  ReactNode,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { useRefs } from './utils/useRefs';

type Store = {
  pending: number;
  lastState: { state: 'pending'; data: FormData } | null;
  listeners: Set<() => void>;
  startSubmission: (state: { state: 'pending'; data: FormData }) => {
    done: () => void;
  };
  signal: () => void;
  subscribe: (fn: () => void) => () => void;
};

const store: Store = {
  pending: 0,
  lastState: null,
  listeners: new Set<() => void>(),

  // I know that submission data will get mixed up when submitting multiple
  // forms at once. At this moment, I'd say this just isn't meant for that
  // kind of usage.
  startSubmission(state) {
    this.pending++;
    this.lastState = state;
    let stopped = false;
    this.signal();

    return {
      done: () => {
        if (stopped) return;
        stopped = true;

        this.pending--;
        this.signal();
      },
    };
  },

  signal() {
    for (const listener of this.listeners) {
      listener();
    }
  },

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },
};

export function usePendingFormSubmit() {
  const [, forceUpdate] = useReducer((c) => c + 1, 0);
  useEffect(() => store.subscribe(forceUpdate), [forceUpdate]);
  return store.pending ? store.lastState : null;
}

type FetchDataOptions = { method: 'get' | 'post'; url: string; data: FormData };
async function fetchData({ method, url, data }: FetchDataOptions) {
  let response: Response;

  switch (method) {
    case 'get': {
      const _url = new URL(url);

      for (const [field, value] of data.entries()) {
        if (typeof value === 'string') {
          _url.searchParams.set(field, value);
        } else {
          throw new Error('Cannot submit binary form data using GET');
        }
      }

      history.replaceState(null, null, url);
      response = await fetch(_url.toString(), {
        method: 'get',
        headers: { accept: 'application/json' },
      });

      break;
    }

    case 'post': {
      response = await fetch(url, {
        method: 'post',
        headers: { accept: 'application/json' },
        body: data,
      });

      break;
    }

    default: {
      throw Error('unsupported form method');
    }
  }

  if (response.status >= 300) {
    throw new Error(`[${response.status}]: ${response.statusText}`);
  }

  return response.json();
}

export type FormProps = {
  /**
   *  The method to use for form submissions. `get` appends the form-data to the
   *  URL in name/value pairs, while `post` sends the form-data as an HTTP post
   *  transaction. Defaults to `post`.
   */
  method?: 'get' | 'post';
  /**
   * A callback that's invoked before form submission. Return `false` when the
   * form data isn't valid, and the form should not be submitted.
   *
   * @param formData the data that was entered in the form
   */
  validate?: (formData: FormData) => boolean;
  /**
   * A callback that's invoked upon successful submission. Can be used to update
   * the page or invoke a redirect.
   *
   * @param response the props that were returned from getServerSideProps
   */
  onSuccess?: (response: Record<string, unknown>) => void;
  /**
   * A callback that's invoked when the form errors on the server side. Can be
   * used to show an error message.
   *
   * @param error a string holding the statusCode & statusText that were returned
   */
  onError?: (error: string) => void;
  /**
   * Submit the form without updating the current page. The form will still be reset, but the
   * `get` handler is not rerun. Defaults to `false`.
   */
  shallow?: boolean;
  /**
   * The fields & content of the form. Make something pretty :-)
   */
  children: ReactNode;
} & FormHTMLAttributes<HTMLFormElement>;

/**
 * Replace your `form` with `Form` to submit it clientside using `fetch`, and get
 * access to the serialized form data in `usePendingSubmit()` to build a great
 * looking loading status.
 */
export const Form = forwardRef(function Form(
  {
    method = 'post',
    validate,
    onSuccess,
    onError,
    onSubmit,
    shallow = false,
    ...props
  }: FormProps,
  forwardRef,
) {
  const [state, setState] = useState<
    | { state: 'idle'; error?: string; data?: unknown }
    | { state: 'pending'; data: FetchDataOptions }
    | { state: 'success'; data: Record<string, unknown> }
    | { state: 'error'; data?: unknown; error: string }
  >({ state: 'idle' });

  const router = useRouter();
  const ref = useRefs<HTMLFormElement>(forwardRef);

  const handlers = useRef({ onSuccess, onError });
  handlers.current.onError = onError;
  handlers.current.onSuccess = onSuccess;

  useEffect(() => {
    if (!shallow && state.state === 'success') {
      // router is undefined in tests
      void router?.replace(router.asPath, undefined, { scroll: false });
    }
  }, [state.state, shallow]);

  useEffect(() => {
    let mounted = true;

    async function transition() {
      switch (state.state) {
        case 'pending': {
          const submission = store.startSubmission({
            state: state.state,
            data: state.data.data,
          });

          try {
            const result = await fetchData(state.data);
            if (!mounted) return;
            setState({ ...state, state: 'success', data: result });
          } catch (e) {
            if (!mounted) return;
            setState({ ...state, state: 'error', error: e.message });
          } finally {
            submission.done();
          }

          break;
        }

        case 'error': {
          setTimeout(() => {
            setState({ ...state, state: 'idle' });
          }, 2000);

          handlers.current.onError?.(state.error);
          break;
        }

        case 'success': {
          handlers.current.onSuccess?.(state.data);
          ref.current.reset();
          break;
        }
      }
    }

    void transition();

    return () => {
      mounted = false;
    };
  }, [state]);

  const handleSubmit = async (event) => {
    onSubmit?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    const form = event.currentTarget;

    if (state.state === 'pending') {
      return;
    }

    const data = new FormData(form);
    const url = form.action;
    const method = form.method;

    if (typeof validate === 'function' && validate(data) === false) {
      return;
    }

    setState({
      state: 'pending',
      data: { data, url, method },
    });
  };

  return <form ref={ref} method={method} onSubmit={handleSubmit} {...props} />;
});
