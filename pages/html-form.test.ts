export async function clear(page, selector) {
  await page.evaluate((selector) => {
    document.querySelector(selector).value = '';
  }, selector);
}

test('can submit html form', async () => {
  await page.goto('http://localhost:4000/html-form');

  await expect(page).toHaveSelector('form');
  await clear(page, 'input[name="name"]');
  await page.type('input[name="name"]', 'modified person');
  await page.click('input[type="submit"]');

  // wait for re-render
  await expect(page).toMatchText('p', 'submitted modified person');
});
