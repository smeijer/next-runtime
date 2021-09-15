/** @jest-environment jsdom */
import '@testing-library/jest-dom';

import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { Form, FormProps, usePendingFormSubmit } from './form';

(global as any).fetch = async () => ({
  json: async () => null,
});

async function waitForElementCreation(text) {
  if (screen.queryByText(text)) return;
  return waitFor(() => screen.getByText(text));
}

export function waitForElementRemoval(text) {
  if (!screen.queryByText(text)) return;
  return waitForElementToBeRemoved(() => screen.queryByText(text));
}

function TestForm(props: Omit<FormProps, 'children'>) {
  const pending = usePendingFormSubmit();

  if (pending) {
    return <p>{`submitting ${pending.data.get('name')}`}</p>;
  }

  return (
    <Form method="post" {...props}>
      <input name="name" />
      <button type="submit" />
    </Form>
  );
}

test('Form shows pending state', async () => {
  render(<TestForm />);

  const input = screen.getByRole('textbox');
  const button = screen.getByRole('button');

  userEvent.type(input, 'person');
  userEvent.click(button);

  await waitForElementCreation(/submitting person/i);
  await waitForElementRemoval(/submitting person/i);
});

test('Form calls onSuccess handler', async () => {
  const onSuccess = jest.fn();

  render(
    <Form method="post" onSuccess={onSuccess}>
      <input name="name" />
      <button type="submit" />
    </Form>,
  );

  const input = screen.getByRole('textbox');
  const button = screen.getByRole('button');

  userEvent.type(input, 'person');
  userEvent.click(button);

  await waitFor(() => expect(onSuccess).toHaveBeenCalled());
});

test('Form calls validate handler', async () => {
  const validate = jest.fn();

  render(
    <Form method="post" validate={validate}>
      <input name="name" />
      <button type="submit" />
    </Form>,
  );

  const input = screen.getByRole('textbox');
  const button = screen.getByRole('button');

  userEvent.type(input, 'person');
  userEvent.click(button);

  await waitFor(() => expect(validate).toHaveBeenCalled());
});
