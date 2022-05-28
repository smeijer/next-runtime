import { BaseSyntheticEvent, FormEvent } from 'react';

export function isHtmlElement(object: any): object is HTMLElement {
  return object != null && typeof object.tagName === 'string';
}

export function isButtonElement(object: any): object is HTMLButtonElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === 'button';
}

export function isFormElement(object: any): object is HTMLFormElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === 'form';
}

export function isInputElement(object: any): object is HTMLInputElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === 'input';
}

export type HTMLSubmitEvent = BaseSyntheticEvent<
  SubmitEvent,
  Event,
  HTMLFormElement
>;

export type HTMLFormSubmitter = HTMLButtonElement | HTMLInputElement;

export function getFormSubmitter(event: FormEvent<HTMLFormElement>) {
  return (event as unknown as HTMLSubmitEvent).nativeEvent.submitter as
    | HTMLButtonElement
    | HTMLInputElement
    | null;
}

export function isValidFormSubmitter(
  submitter: HTMLButtonElement | HTMLInputElement,
) {
  return (
    isButtonElement(submitter) ||
    (isInputElement(submitter) &&
      (submitter.type === 'submit' || submitter.type === 'image'))
  );
}
