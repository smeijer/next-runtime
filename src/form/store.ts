import { NextRouter } from 'next/router';
import { useCallback } from 'react';
import create from 'zustand';

import { FetchError } from '../lib/fetch-error';
import { setField } from '../runtime/set-field';
import { FormStateWithHelpers, formStateWithHelpers } from './helpers';

type FormName = string | symbol;

type FormStore = {
  forms: Record<FormName, FormState>;
  setForm(name: FormName, newState: FormState): void;
  getForm(name: FormName): FormState;
  submit: (options: FormSubmitOptions) => Promise<void>;
};

type FormSubmitOptions = {
  name?: string;
  router: NextRouter;
  method: string;
  formData: FormData;
  formAction: string;
  onSuccess: (state: FormStateWithHelpers<unknown>) => void;
  onError: (state: FormStateWithHelpers<unknown>) => void;
};

export type FormState<Data = Record<string, unknown>> =
  | {
      status: 'idle';
      formData?: undefined;
      values?: undefined;
      data?: undefined;
      error?: undefined;
    }
  | {
      status: 'submitting';
      formData: FormData;
      values: Record<string, unknown>;
      data?: Data;
      error?: undefined;
    }
  | {
      status: 'routing';
      formData: FormData;
      values: Record<string, unknown>;
      data?: Data;
      error?: undefined;
    }
  | {
      status: 'success';
      formData: FormData;
      values: Record<string, unknown>;
      data: Data;
      error?: undefined;
    }
  | {
      status: 'error';
      formData: FormData;
      values: Record<string, unknown>;
      data?: Data;
      error: FetchError | Error;
    };

const DEFAULT_STATE: FormState = { status: 'idle' };
const UNNAMED_FORM = Symbol('unnamed-form');

const useFormStore = create<FormStore>((set, get) => ({
  forms: {},

  setForm: (name, newState) => {
    set((state) => ({
      ...state,
      forms: {
        ...state.forms,
        [name]: newState,
      },
    }));
  },

  getForm: (name) => {
    return get()?.forms[name] || DEFAULT_STATE;
  },

  submit: async (options) => {
    const name = options.name ?? UNNAMED_FORM;
    const { setForm, getForm } = get();

    const { status, data } = getForm(name);
    const loading = status === 'submitting' || status === 'routing';
    if (loading) return;

    const values = {};
    for (const [name, value] of options.formData.entries()) {
      setField(values, name, value);
    }

    const baseState = {
      formData: options.formData,
      values,
    };

    try {
      setForm(name, {
        ...baseState,
        status: 'submitting',
        data,
      });

      const response = await fetchData({
        data: options.formData,
        method: options.method,
        formAction: options.formAction,
      });

      if (response.redirected) {
        const data = await response.json();

        setForm(name, {
          ...baseState,
          status: 'routing',
          data,
        });

        await options.router.push(response.url, undefined, { scroll: true });

        const newState: FormState = {
          ...baseState,
          status: 'success',
          data,
        };
        setForm(name, newState);
        options.onSuccess(formStateWithHelpers(newState));
        return;
      }

      if (response.ok) {
        const newState: FormState = {
          ...baseState,
          status: 'success',
          data: await response.json(),
        };
        setForm(name, newState);
        options.onSuccess(formStateWithHelpers(newState));
        return;
      }

      const newState: FormState = {
        ...baseState,
        status: 'error',
        data,
        error: await FetchError.create(response),
      };
      setForm(name, newState);
      options.onError(formStateWithHelpers(newState));
      return;
    } catch (error) {
      const newState: FormState = {
        ...baseState,
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        data: getForm(name).data,
      };
      setForm(name, newState);
      options.onError(formStateWithHelpers(newState));
    }
  },
}));

export function useFormStoreState(name?: FormName): FormState {
  return useFormStore(
    useCallback(
      (state) => state.forms[name ?? UNNAMED_FORM] || DEFAULT_STATE,
      [name],
    ),
  );
}

const getFormStoreSubmit = (store: FormStore) => store.submit;
export function useFormStoreSubmit() {
  return useFormStore(getFormStoreSubmit);
}

async function fetchData({
  method: methodArg,
  formAction,
  data,
}: {
  method: string;
  formAction: string;
  data: FormData;
}): Promise<Response> {
  // patch must be in all caps: https://github.com/github/fetch/issues/254
  const method = methodArg.toUpperCase();
  const url = new URL(formAction, window.location.href);

  if (method !== 'GET') {
    return fetch(url.toString(), {
      method,
      headers: { accept: 'application/json' },
      body: data,
    });
  }

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
