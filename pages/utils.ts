export async function clear(page, selector) {
  await page.evaluate((selector) => {
    document.querySelector(selector).value = '';
  }, selector);
}
