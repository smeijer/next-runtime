export {};

test('thrown response helpers are caught and used as response', async () => {
  await page.goto('http://localhost:4000/response-throwing');

  expect(page.url()).toMatch('/response-throwing');
  await page.click('button[type=submit]');
  await page.waitForURL('http://localhost:4000/login');
});
