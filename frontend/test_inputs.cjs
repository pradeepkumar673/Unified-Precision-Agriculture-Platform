
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext()).newPage();
  
  const payload = Buffer.from(JSON.stringify({ sub: 'demo', exp: 9999999999 })).toString('base64');
  const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + payload + '.signature';

  await page.goto('http://localhost:5173/splash');
  await page.evaluate((token) => localStorage.setItem('token', token), fakeToken);

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:5173/marketplace/inputs', { waitUntil: 'networkidle' });
  await browser.close();
})();

