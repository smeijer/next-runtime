import { useRouter } from 'next/router';
import {
  ComponentProps,
  FormEventHandler,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';

import { HttpMethod } from '../http-methods';
import { useLatestRef } from '../lib/use-latest-ref';
import {
  useObservableCallback,
  useObservableValue,
} from '../utils/observable-hooks';
import {
  formStateStream,
  formSubmissionSubject,
  namedSubmitState,
} from './form-state';

export type FormProps = Omit<
  ComponentProps<'form'>,
  'method' | 'onSubmit' | 'onError'
> & {
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
  onSuccess?: () => void;

  /**
   * Called if an error occured during form submission.
   * @param state The resulting form state
   */
  onError?: () => void;
};

export const Form = forwardRef(function Form(
  { method = 'post', onSubmit, onSuccess, onError, ...props }: FormProps,
  ref: React.Ref<HTMLFormElement>,
) {
  const router = useRouter();

  const onSuccessRef = useLatestRef(onSuccess);
  const onErrorRef = useLatestRef(onError);

  const stateStream = useMemo(
    () => (props.name ? namedSubmitState(props.name) : formStateStream),
    [props.name],
  );

  const state = useObservableValue(stateStream, { status: 'idle' as const });

  useObservableCallback(
    stateStream,
    useCallback(
      (state) => {
        if (state.status === 'success') onSuccessRef.current?.();
        if (state.status === 'error') onErrorRef.current?.();
      },
      [onErrorRef, onSuccessRef],
    ),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (state.status === 'submitting' || state.status === 'routing') {
      event.preventDefault();
      return;
    }

    onSubmit?.(event);
    if (event.defaultPrevented) return;

    formSubmissionSubject.next({
      name: props.name,
      formData: new FormData(event.currentTarget),
      method,
      router,
      formAction: props.action ?? router.pathname,
    });
  };

  return <form {...props} onSubmit={handleSubmit} method={method} ref={ref} />;
});
