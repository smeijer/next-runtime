import { NextRouter } from 'next/router';
import {
  catchError,
  filter,
  from,
  map,
  merge,
  mergeMap,
  Observable,
  of,
  Subject,
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

import { FetchError } from '../lib/fetch-error';
import { toError } from '../utils/to-error';

export type FormSubmission = {
  name?: string;
  formAction: string;
  method: string;
  formData: FormData;
  router: NextRouter;
};

export type FormState<Data = unknown> =
  | { status: 'idle'; data?: undefined; error?: undefined }
  | { status: 'submitting'; data?: undefined; error?: undefined }
  | { status: 'routing'; data?: undefined; error?: undefined }
  | { status: 'success'; data: Data; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

type NamedFormState = FormState & { name?: string };

export const formSubmissionSubject = new Subject<FormSubmission>();

export const formStateStream: Observable<NamedFormState> =
  formSubmissionSubject.pipe(mergeMap(createFormStateStream));

export function namedSubmitState(name: string): Observable<FormState> {
  return formStateStream.pipe(filter((state) => state.name === name));
}

function createFormStateStream(
  submission: FormSubmission,
): Observable<NamedFormState> {
  try {
    const fetchStream = createFetchStream(submission);

    const statusStream: Observable<FormState> = merge(
      [{ status: 'submitting' as const }],
      fetchStream.pipe(
        mergeMap((response) => handleFetchResponse(response, submission)),
        catchError((error) => [
          { status: 'error' as const, error: toError(error) },
        ]),
      ),
    );

    // add the submission name onto each status,
    // so it can be filtered out later
    return statusStream.pipe(
      map((status) => ({ ...status, name: submission.name })),
    );
  } catch (error) {
    // make sure we always resolve to an error status without failing
    return of({
      name: submission.name,
      status: 'error' as const,
      error: toError(error),
    });
  }
}

function createFetchStream(submission: FormSubmission): Observable<Response> {
  const url = new URL(submission.formAction, window.location.href);

  // patch must be in all caps: https://github.com/github/fetch/issues/254
  const method = submission.method.toUpperCase();

  if (method !== 'GET') {
    return fromFetch(url.toString(), {
      method,
      body: submission.formData,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  for (const [field, value] of submission.formData.entries()) {
    if (typeof value === 'string') {
      url.searchParams.set(field, value);
    } else {
      new Error('Cannot submit binary form data using GET');
    }
  }

  history.replaceState(null, '', url);

  return fromFetch(url.toString(), {
    method,
    headers: { accept: 'application/json' },
  });
}

function handleFetchResponse(
  response: Response,
  submission: FormSubmission,
): Observable<FormState> {
  if (response.ok) {
    return from(
      response.json().then((data) => ({
        status: 'success' as const,
        data,
      })),
    );
  }

  if (response.redirected) {
    const routingPromise = Promise.all([
      response.json(),
      submission.router.push(response.url),
    ]);

    return merge(
      [{ status: 'routing' as const }],
      routingPromise.then(([data]) => ({
        status: 'success' as const,
        data,
      })),
    );
  }

  return from(
    FetchError.create(response).then((error) => ({
      status: 'error' as const,
      error,
    })),
  );
}
