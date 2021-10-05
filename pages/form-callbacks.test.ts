import { waitFor } from './utils';

test('form callbacks', async () => {
  await page.goto(`http://localhost:4000/form-callbacks`);

  await assertResult('idle');

  await page.click('#show-form');
  await page.click('#submit');

  await assertResult('success');

  await page.click('#show-form');
  await page.click('#error-checkbox');
  await page.click('#submit');

  await assertResult('error');

  await page.click('#show-form');

  await assertResult('idle');
});

async function assertResult(result: string) {
  await waitFor(async () => {
    expect(await page.textContent('#result')).toBe(result);
  });
}

export {};
