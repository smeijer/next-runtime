import { sleep } from './utils';

test('reset form by using ref of form component', async () => {
  await page.goto('http://localhost:4000/form-ref');

  await expect(page).toHaveSelector('form');
  await page.type('input[name="name"]', 'test');
  await page.click('button[type="submit"]');
  await sleep(100);
  expect(await page.locator('input[name="name"]').inputValue()).toBe('');
});
