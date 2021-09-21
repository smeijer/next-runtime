export async function clear(page, selector) {
  await page.evaluate((selector) => {
    document.querySelector(selector).value = '';
  }, selector);
}

const sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));

// we don't do this any more, find a way to test this using withNextRuntime
test.skip('form component re-renders page on submit', async () => {
  await page.goto('http://localhost:4000/form-component');

  await expect(page).toHaveSelector('form');
  const firstRequestTime = await page.$('#time').then((x) => x.innerText());

  await clear(page, 'input[name="name"]');
  await page.type('input[name="name"]', 'person');
  await page.setInputFiles('input[name="file"]', {
    name: 'file.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('file content'),
  });

  const response = page
    .waitForResponse(
      (resp) => resp.url() === page.url() && resp.status() === 200,
    )
    .then((r) => r.json());

  await page.click('input[type="submit"]');

  // a pending state should be rendered
  await expect(page).toMatchText('p#status', 'submitting person');

  // wait for loader to be gone
  await expect(page).not.toMatchText('p#status', 'submitting person', {
    state: 'detached',
  });

  // verify json response
  expect(await response).toEqual({
    name: 'person',
    file: {
      contents: 'file content',
      name: 'file.txt',
      type: 'text/plain',
      size: 12,
    },
    message: 'hi from post',
  });

  await sleep(100);

  // page should update with a new time from the get handler
  await expect(page).not.toMatchText('#time', firstRequestTime);

  // because this is a Form, we'll never get the post data
  await expect(page).not.toHaveSelector('pre', { timeout: 5000 });
});

test('useFormSubmit provides access to errors', async () => {
  await page.goto('http://localhost:4000/form-component');

  await expect(page).toHaveSelector('form');

  await clear(page, 'input[name="name"]');
  await page.type('input[name="name"]', 'error');

  const response = page
    .waitForResponse(
      (resp) => resp.url() === page.url() && resp.status() === 422,
    )
    .then((r) => r.json());

  await page.click('input[type="submit"]');

  // verify json response
  expect(await response).toEqual({
    message: 'error from server',
  });

  // page should show the same request time as before
  await expect(page).toMatchText('#error', '[422]: Unprocessable Entity');
});
