import { useMemo } from 'react';

import { FormStateWithHelpers, formStateWithHelpers } from './helpers';
import { FormState, useFormStoreState } from './store';

export function useFormSubmit<Data>(name?: string): FormStateWithHelpers<Data> {
  const state = useFormStoreState(name);
  return useMemo(() => formStateWithHelpers(state as FormState<Data>), [state]);
}
