test('form with action', async () => {
  await page.goto(`http://localhost:4000/form-with-action`);
  await page.click('#submit');
  await page.waitForEvent('response');
  expect(await page.textContent('#message')).toBe('success');
  expect(await page.$('#error')).toBe(null);
});

export {};
