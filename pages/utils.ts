import { setTimeout } from 'node:timers/promises';
import { Page } from 'playwright';

export async function clear(page: Page, selector: string) {
  await page.evaluate((selector: string) => {
    document.querySelector(selector)?.setAttribute('value', '');
  }, selector);
}

export async function sleep(duration: number) {
  return setTimeout(duration);
}

/**
 * Runs and reruns a function until it runs without errors,
 * up until a timeout. Good for async assertions
 */
export async function waitFor(fn: () => void | Promise<unknown>) {
  const time = Date.now();
  while (true) {
    try {
      await fn();
      return;
    } catch (error) {
      if (Date.now() - time > 3000) {
        throw error;
      }
      await setTimeout(100);
    }
  }
}
