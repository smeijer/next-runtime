import { Request } from 'playwright';

const methodPredicate = (method: string) => {
  return (req: Request) =>
    req.url() === page.url() &&
    req.method().toLowerCase() === method.toLowerCase();
};

const interceptRequest = async (
  requestPredicate: (req: Request) => boolean,
  actionFn: Promise<void>,
) => {
  const request = page.waitForEvent('request', requestPredicate);
  await actionFn;
  return request.then((req) => req.response()).then((x) => x?.json());
};

test('submit buttons can override form method', async () => {
  await page.goto(`http://localhost:4000/form-with-named-buttons`);

  // click create button
  await interceptRequest(
    methodPredicate('post'),
    page.click('button[value="create"]'),
  );

  expect(await page.textContent('#message')).toBe('created via post request');
  expect(await page.$('#error')).toBe(null);

  // click delete button
  await interceptRequest(
    methodPredicate('delete'),
    page.click('button[value="delete"]'),
  );

  expect(await page.textContent('#message')).toBe('deleted via delete request');
  expect(await page.$('#error')).toBe(null);
});

test('submit buttons name is added to form data', async () => {
  await page.goto(`http://localhost:4000/form-with-named-buttons`);

  const postResponse = await interceptRequest(
    methodPredicate('post'),
    page.click(`button[value="create"]`),
  );

  expect(postResponse).toEqual({
    message: `created via post request`,
    values: {
      id: 'abc',
      action: 'create',
    },
  });

  const deleteResponse = await interceptRequest(
    methodPredicate('delete'),
    page.click(`button[value="delete"]`),
  );

  expect(deleteResponse).toEqual({
    message: `deleted via delete request`,
    values: {
      id: 'abc',
      action: 'delete',
    },
  });
});

export {};
