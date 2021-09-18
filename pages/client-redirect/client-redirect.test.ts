export {};

test('client redirect', async () => {
  await page.goto('http://localhost:4000/client-redirect/start');

  expect(page.url()).toMatch('/client-redirect/start');
  await page.click('button[type=submit]');
  await page.waitForURL('http://localhost:4000/client-redirect/destination');
  expect(await page.textContent('p')).toBe('The redirect has landed. 🚀');
});
