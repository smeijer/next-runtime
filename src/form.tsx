import { useRouter } from 'next/router';
import {
  FormEventHandler,
  FormHTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import create from 'zustand';

import { HttpMethod } from './http-methods';
import { FetchError } from './lib/fetch-error';
import { useLatestRef } from './lib/use-latest-ref';
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

export type FormSubmission<Data extends Record<string, unknown>> =
  FormState<Data> & {
    isIdle: boolean;
    isSubmitting: boolean;
    isRouting: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
  };

export function useFormSubmit<Data extends Record<string, unknown>>(
  name?: string,
): FormSubmission<Data> {
  const state = useStore(
    useCallback(
      (store) => store.get(name || UNNAMED_FORM) as FormState<Data>,
      [name],
    ),
  );

  return useMemo(
    () => ({
      ...state,
      isIdle: state.status === 'idle',
      isSubmitting: state.status === 'submitting',
      isRouting: state.status === 'routing',
      isLoading: state.status === 'submitting' || state.status === 'routing',
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
  const url = new URL(urlArg, window.location.href);

  if (method === 'GET') {
    for (const [field, value] of data.entries()) {
      if (typeof value === 'string') {
        url.searchParams.set(field, value);
      } else {
        throw new Error('Cannot submit binary form data using GET');
      }
    }

    history.replaceState(null, '', url);

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

  /**
   * Called when the form is successfully submitted.
   * @param state The resulting form state
   */
  onSuccess?: (state: FormState) => void;

  /**
   * Called if an error occured during form submission.
   * @param state The resulting form state
   */
  onError?: (state: FormState) => void;
} & Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'onError' | 'method'
>;

type FormStatus = FormState['status'];

type FormState<Data extends Record<string, unknown> = Record<string, unknown>> =

    | {
        status: 'idle';
        formData?: FormData;
        values?: undefined;
        data?: Data | null;
        error?: FetchError | Error;
      }
    | {
        status: 'submitting';
        formData: FormData;
        values: Record<string, unknown>;
        data?: Data | null;
        error?: FetchError | Error;
      }
    | {
        status: 'routing';
        data: Data | null;
        redirect: { from: string; to: string };
        formData: FormData;
        values: Record<string, unknown>;
        error?: FetchError | Error;
      }
    | {
        status: 'success';
        data: Data | null;
        formData: FormData;
        values: Record<string, unknown>;
        error?: FetchError | Error;
      }
    | {
        status: 'error';
        data?: Data | null;
        formData: FormData;
        values: Record<string, unknown>;
        error: FetchError | Error;
      };

/**
 * Replace your `form` with `Form` to submit it clientside using `fetch`, and get
 * access to the serialized form data in `usePendingSubmit()` to build a great
 * looking loading status.
 */
export const Form = forwardRef<HTMLFormElement, FormProps>(function Form(
  { method = 'post', onSubmit, onSuccess, onError, ...props },
  forwardRef,
) {
  const router = useRouter();
  const ref = useRefs<HTMLFormElement>(forwardRef);

  const name = props.name || UNNAMED_FORM;

  const set = useStore(useCallback((store) => store.set, []));
  const state = useStore(useCallback((store) => store.get(name), [name]));

  // this ref is needed to ensure success/error callbacks
  // aren't called immediately on mount
  const initializedRef = useRef(false);

  const onSuccessRef = useLatestRef(onSuccess);
  useEffect(() => {
    if (!initializedRef.current) return;
    if (state.status === 'success') {
      onSuccessRef.current?.(state);
    }
  }, [onSuccessRef, state]);

  const onErrorRef = useLatestRef(onError);
  useEffect(() => {
    if (!initializedRef.current) return;
    if (state.status === 'error') {
      onErrorRef.current?.(state);
    }
  }, [onErrorRef, state]);

  useEffect(() => {
    initializedRef.current = true;
  }, [name, set]);

  useEffect(() => {
    async function transition() {
      if (!ref.current) return;

      switch (state.status) {
        case 'submitting': {
          try {
            const response = await fetchData({
              url:
                ref.current.getAttribute('action') ||
                location.href.split('?')[0],
              method: ref.current.getAttribute('method') || 'POST',
              data: state.formData,
            });

            if (response.redirected) {
              set(name, {
                status: 'routing',
                data: await response.json(),
                redirect: { from: location.href, to: response.url },
                error: undefined,
              });
            } else if (response.ok) {
              set(name, {
                status: 'success',
                data: await response.json(),
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

        case 'routing': {
          await router.push(state.redirect.to, undefined, { scroll: true });
          set(name, {
            status: 'success',
          });
          break;
        }

        case 'success': {
          ref.current.reset();
          break;
        }
      }
    }

    void transition();
  }, [state.status]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    if (state.status === 'submitting' || state.status === 'routing') {
      event.preventDefault();
      return;
    }

    onSubmit?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const values = {};
    for (const [name, value] of formData.entries()) {
      setField(values, name, value);
    }

    set(name, {
      status: 'submitting',
      formData,
      values,
    });
  };

  return <form ref={ref} method={method} onSubmit={handleSubmit} {...props} />;
});
