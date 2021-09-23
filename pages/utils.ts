import { Page } from 'playwright';

export async function clear(page: Page, selector: string) {
  await page.evaluate((selector: string) => {
    document.querySelector(selector)?.setAttribute('value', '');
  }, selector);
}

export async function sleep(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
