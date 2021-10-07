import { useRouter } from 'next/router';
import { FormEventHandler, FormHTMLAttributes, forwardRef } from 'react';

import { HttpMethod } from '../http-methods';
import { useLatestRef } from '../lib/use-latest-ref';
import { useFormStoreSubmit } from './store';

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
   */
  onSuccess?: () => void;

  /**
   * Called if an error occured during form submission.
   */
  onError?: () => void;
} & Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'onError' | 'method'
>;

/**
 * Replace your `form` with `Form` to submit it clientside using `fetch`, and get
 * access to the serialized form data in `usePendingSubmit()` to build a great
 * looking loading status.
 */
export const Form = forwardRef<HTMLFormElement, FormProps>(function Form(
  { method = 'post', onSubmit, onSuccess, onError, ...props },
  ref,
) {
  const submit = useFormStoreSubmit();
  const router = useRouter();
  const onSuccessRef = useLatestRef(onSuccess);
  const onErrorRef = useLatestRef(onError);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    onSubmit?.(event);
    if (event.defaultPrevented) return;

    event.preventDefault();

    submit({
      name: props.name,
      router,
      formData: new FormData(event.currentTarget),
      formAction: props.action || location.href.split('?')[0],
      method,
      // need to wrap the callbacks like this so the latest ref value is accessed
      // at the time the callbacks are invoked,
      // otherwise we could pass in a stale callback
      onError: () => onErrorRef.current?.(),
      onSuccess: () => onSuccessRef.current?.(),
    });
  };

  return <form {...props} ref={ref} method={method} onSubmit={handleSubmit} />;
});
