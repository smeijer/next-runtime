import { Request } from 'playwright';

const methodPredicate = (method: string) => {
  return (req: Request) =>
    req.url() === page.url() &&
    req.method().toLowerCase() === method.toLowerCase();
};

test('submit buttons can override form method', async () => {
  await page.goto(`http://localhost:4000/form-with-named-buttons`);

  // click create button
  await page.click('button[value="create"]');
  await page.waitForEvent('response');
  expect(await page.textContent('#message')).toBe('created via post request');
  expect(await page.$('#error')).toBe(null);

  // click delete button
  await page.click('button[value="delete"]');
  await page.waitForEvent('response');
  expect(await page.textContent('#message')).toBe('deleted via delete request');
  expect(await page.$('#error')).toBe(null);
});

test('submit buttons name is added to form data', async () => {
  await page.goto(`http://localhost:4000/form-with-named-buttons`);

  const postRequest = page.waitForEvent('request', methodPredicate('post'));
  await page.click(`button[value="create"]`);

  const postResponse = await postRequest
    .then((req) => req.response())
    .then((x) => x?.json());

  expect(postResponse).toEqual({
    message: `created via post request`,
    values: {
      id: 'abc',
      action: 'create',
    },
  });

  const deleteRequest = page.waitForEvent('request', methodPredicate('delete'));
  await page.click(`button[value="delete"]`);

  const deleteResponse = await deleteRequest
    .then((req) => req.response())
    .then((x) => x?.json());

  expect(deleteResponse).toEqual({
    message: `deleted via delete request`,
    values: {
      id: 'abc',
      action: 'delete',
    },
  });
});

export {};
