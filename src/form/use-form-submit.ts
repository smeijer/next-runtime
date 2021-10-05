import { useMemo } from 'react';

import { useObservableValue } from '../utils/observable-hooks';
import { FormState, formStateStream, namedSubmitState } from './form-state';

export type FormStateWithHelpers<Data> = FormState<Data> & {
  isIdle: boolean;
  isSubmitting: boolean;
  isRouting: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

function withHelpers<Data>(state: FormState<Data>): FormStateWithHelpers<Data> {
  return {
    ...state,
    isIdle: state.status === 'idle',
    isSubmitting: state.status === 'submitting',
    isRouting: state.status === 'routing',
    isLoading: state.status === 'submitting' || state.status === 'routing',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
  };
}

export function useFormSubmit<Data extends Record<string, unknown>>(
  name?: string,
): FormStateWithHelpers<Data> {
  const stateStream = useMemo(
    () => (name ? namedSubmitState(name) : formStateStream),
    [name],
  );

  const state = useObservableValue(stateStream, { status: 'idle' as const });

  return withHelpers(state as FormState<Data>);
}
