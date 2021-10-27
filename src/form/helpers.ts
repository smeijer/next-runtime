import { FormState } from './store';

export type FormStateWithHelpers<Data> = FormState<Data> & {
  isIdle: boolean;
  isSubmitting: boolean;
  isRouting: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

export function formStateWithHelpers<Data>(
  state: FormState<Data>,
): FormStateWithHelpers<Data> {
  return {
    ...state,
    isIdle: state.status === 'idle',
    isSubmitting: state.status === 'submitting',
    isRouting: state.status === 'routing',
    isLoading: state.status === 'routing' || state.status === 'submitting',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
  };
}
