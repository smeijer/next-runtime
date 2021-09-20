import { useRouter } from 'next/router';
import {
  FormEventHandler,
  FormHTMLAttributes,
  forwardRef,
  ReactNode,
  useEffect,
  useReducer,
  useRef,
} from 'react';

import {
  HttpMethod,
  httpMethodsWithBody,
  HttpMethodWithBody,
} from './http-methods';
import { useRefs } from './utils/useRefs';
import { useSafeState } from './utils/useSafeState';

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

type FetchDataOptions = {
  method: HttpMethod | Uppercase<HttpMethod>;
  url: string;
  data: FormData;
};

async function fetchData({
  method: methodArg,
  url,
  data,
}: FetchDataOptions): Promise<Response> {
  const method = methodArg.toLowerCase() as Lowercase<HttpMethod>;

  if (method === 'get') {
    const _url = new URL(url);

    for (const [field, value] of data.entries()) {
      if (typeof value === 'string') {
        _url.searchParams.set(field, value);
      } else {
        throw new Error('Cannot submit binary form data using GET');
      }
    }

    history.replaceState(null, null, url);

    return fetch(_url.toString(), {
      method: 'get',
      headers: { accept: 'application/json' },
    });
  }

  if (httpMethodsWithBody.includes(method as HttpMethodWithBody)) {
    return fetch(url, {
      // patch must be in all caps: https://github.com/github/fetch/issues/254
      method: method.toUpperCase(),
      headers: { accept: 'application/json' },
      body: data,
    });
  }

  throw Error('unsupported form method');
}

export type FormProps = {
  /**
   *  The method to use for form submissions. `get` appends the form-data to the
   *  URL in name/value pairs, while others send the form-data as an HTTP post
   *  transaction. Defaults to `post`.
   */
  method?: HttpMethod | Uppercase<HttpMethod>;
  /**
   * A callback that's invoked on form submission. Call `event.preventDefault()`
   * if you don't want Form to handle your submission. For example to abort in
   * case of validation errors.
   *
   * @param formData the data that was entered in the form
   */
  onSubmit?: FormEventHandler<HTMLFormElement>;
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
  onError?: (error: FormError) => void;
  /**
   * Submit the form without updating the current page. The form will still be reset, but the
   * `get` handler is not rerun. Defaults to `false`.
   */
  shallow?: boolean;
  /**
   * The fields & content of the form. Make something pretty :-)
   */
  children: ReactNode;
} & Omit<FormHTMLAttributes<HTMLFormElement>, 'onError' | 'onSubmit'>;

export type FormError = {
  code: string | number;
  message: string;
};

type ResponseData = Record<string, unknown>;

type FormState =
  | { state: 'idle'; data?: unknown; error?: FormError }
  | { state: 'pending'; data: FetchDataOptions }
  | { state: 'success'; data: ResponseData; redirect?: string }
  | { state: 'error'; data?: ResponseData; error: FormError };

/**
 * Replace your `form` with `Form` to submit it clientside using `fetch`, and get
 * access to the serialized form data in `usePendingSubmit()` to build a great
 * looking loading status.
 */
export const Form = forwardRef(function Form(
  {
    method = 'post',
    onSuccess,
    onError,
    onSubmit,
    shallow = false,
    ...props
  }: FormProps,
  forwardRef,
) {
  const [state, setState] = useSafeState<FormState>({ state: 'idle' });

  const router = useRouter();
  const ref = useRefs<HTMLFormElement>(forwardRef);

  const handlers = useRef({ onSuccess, onError });
  handlers.current.onError = onError;
  handlers.current.onSuccess = onSuccess;

  useEffect(() => {
    if (shallow || state.state !== 'success') return;

    if (state.redirect) {
      return void router.push(state.redirect, undefined, { scroll: true });
    }

    void router.replace(router.asPath, undefined, { scroll: false });
  }, [state.state, shallow]);

  useEffect(() => {
    async function transition() {
      switch (state.state) {
        case 'pending': {
          const submission = store.startSubmission({
            state: state.state,
            data: state.data.data,
          });

          try {
            const response = await fetchData(state.data);
            const isJson = response.headers
              .get('content-type')
              .startsWith('application/json');

            const data = isJson ? await response.json() : undefined;

            if (response.ok) {
              setState({
                ...state,
                state: 'success',
                data,
                redirect: response.redirected ? response.url : undefined,
              });
            } else {
              setState({
                ...state,
                state: 'error',
                error: {
                  code: response.status,
                  message: response.statusText,
                  ...data,
                },
              });
            }
          } catch (e) {
            setState({
              ...state,
              state: 'error',
              error: { code: e.name, message: e.message },
            });
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
  }, [state]);

  const handleSubmit = async (event) => {
    onSubmit?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    const form = event.currentTarget;

    if (state.state === 'pending') return;

    const data = new FormData(form);
    const url = props.action ?? form.action;

    setState({
      state: 'pending',
      data: { data, url, method },
    });
  };

  return <form ref={ref} method={method} onSubmit={handleSubmit} {...props} />;
});
