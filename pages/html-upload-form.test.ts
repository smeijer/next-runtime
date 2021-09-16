export {};

test('can upload files with html form', async () => {
  await page.goto('http://localhost:4000/html-upload-form');

  await expect(page).toHaveSelector('form');
  await page.setInputFiles('input[name="file"]', {
    name: 'file.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('file content'),
  });

  await page.click('input[type="submit"]');

  // wait for re-render
  await expect(page).toMatchText('pre', 'file content');
});
