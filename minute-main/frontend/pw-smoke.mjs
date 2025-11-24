import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({
    channel: 'chrome',   // use system Chrome
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto('https://example.com');
  console.log('Title:', await page.title());
  await browser.close();
};

run().catch((err) => {
  console.error('Playwright smoke failed:', err);
  process.exit(1);
});
