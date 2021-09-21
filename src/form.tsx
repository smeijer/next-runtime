import { useRouter } from 'next/router';
import {
  FormEventHandler,
  FormHTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import create from 'zustand';

import { HttpMethod } from './http-methods';
import { FetchError } from './lib/fetch-error';
import { useRefs } from './lib/use-refs';
import { setField } from './runtime/set-field';

const UNNAMED_FORM = Symbol('unnamed-form');

type Store = {
  states: Record<string | symbol, FormState>;

  set(
    name: string | symbol,
    state: { status: FormStatus } & Partial<FormState>,
  ): void;
  get(name: string | symbol): FormState;
};

const DEFAULT_STATE: FormState = { status: 'idle' };

const useStore = create<Store>((set, get) => ({
  states: {},

  set(name, state) {
    const states = get().states;
    const slice = { ...(states[name] || DEFAULT_STATE), ...state } as FormState;
    set({ states: { ...states, [name]: slice } });
  },

  get(name) {
    return get().states[name] || DEFAULT_STATE;
  },
}));

export type FormSubmission = FormState & {
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

export function useFormSubmit(name?: string): FormSubmission {
  const state = useStore(
    useCallback(
      (store) => store.get(name || UNNAMED_FORM),
      [name, UNNAMED_FORM],
    ),
  );

  return useMemo(
    () => ({
      ...state,
      isIdle: state.status === 'idle',
      isLoading: state.status === 'loading',
      isSuccess: state.status === 'success',
      isError: state.status === 'error',
    }),
    [state],
  );
}

type FetchDataOptions = {
  method: string;
  url: string;
  data: FormData;
};

async function fetchData({
  method: methodArg,
  url: urlArg,
  data,
}: FetchDataOptions): Promise<Response> {
  // patch must be in all caps: https://github.com/github/fetch/issues/254
  const method = methodArg.toUpperCase();
  const url = new URL(urlArg);

  if (method === 'GET') {
    for (const [field, value] of data.entries()) {
      if (typeof value === 'string') {
        url.searchParams.set(field, value);
      } else {
        throw new Error('Cannot submit binary form data using GET');
      }
    }

    history.replaceState(null, null, url);

    return fetch(url.toString(), {
      method,
      headers: { accept: 'application/json' },
    });
  }

  return fetch(url.toString(), {
    method,
    headers: { accept: 'application/json' },
    body: data,
  });
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
} & Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'method'>;

type FormStatus = 'idle' | 'loading' | 'success' | 'error';
type FormState =
  | {
      status: 'idle';
      formData?: FormData;
      values?: undefined;
      data?: Record<string, unknown> | null;
      error?: FetchError | Error;
    }
  | {
      status: 'loading';
      formData: FormData;
      values: Record<string, unknown>;
      data?: Record<string, unknown> | null;
      error?: FetchError | Error;
    }
  | {
      status: 'success';
      data: Record<string, unknown> | null;
      redirect?: string;
      formData: FormData;
      values: Record<string, unknown>;
      error?: FetchError | Error;
    }
  | {
      status: 'error';
      data?: Record<string, unknown> | null;
      formData: FormData;
      values: Record<string, unknown>;
      error: FetchError | Error;
    };

/**
 * Replace your `form` with `Form` to submit it clientside using `fetch`, and get
 * access to the serialized form data in `usePendingSubmit()` to build a great
 * looking loading status.
 */
export const Form = forwardRef(function Form(
  { method = 'post', onSubmit, ...props }: FormProps,
  forwardRef,
) {
  const router = useRouter();
  const ref = useRefs<HTMLFormElement>(forwardRef);

  const name = props.name || UNNAMED_FORM;
  const set = useStore(useCallback((store) => store.set, []));
  const state = useStore(useCallback((store) => store.get(name), [name]));

  useEffect(() => {
    async function transition() {
      switch (state.status) {
        case 'loading': {
          try {
            const response = await fetchData({
              url:
                ref.current.getAttribute('action') ||
                location.href.split('?')[0],
              method: ref.current.getAttribute('method') || 'POST',
              data: state.formData,
            });

            const redirect = response.redirected ? response.url : undefined;

            if (response.ok || redirect) {
              set(name, {
                status: 'success',
                data: await response.json(),
                redirect,
                error: undefined,
              });
            } else {
              set(name, {
                status: 'error',
                error: await FetchError.create(response),
              });
            }
          } catch (error) {
            set(name, {
              status: 'error',
              error: error as Error,
            });
          }

          break;
        }

        case 'success': {
          ref.current.reset();

          if (state.redirect) {
            await router.push(state.redirect, undefined, { scroll: true });
          }
          break;
        }
      }
    }

    void transition();
  }, [state.status]);

  const handleSubmit = async (event) => {
    if (state.status === 'loading') return;

    onSubmit?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const values = {};
    for (const [name, value] of formData.entries()) {
      setField(values, name, value);
    }

    set(name, {
      status: 'loading',
      formData,
      values,
    });
  };

  return <form ref={ref} method={method} onSubmit={handleSubmit} {...props} />;
});
