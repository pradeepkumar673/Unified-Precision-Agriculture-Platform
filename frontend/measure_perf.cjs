const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // We test on the preview server which runs the production build
  // Login first
  await page.goto('http://localhost:4173');
  await page.evaluate(async () => {
    localStorage.setItem('token', 'fake-jwt-token-for-perf');
    localStorage.setItem('farmId', '00000000-0000-0000-0000-000000000000');
  });

  // Measure load time of dashboard
  const start = Date.now();
  await page.goto('http://localhost:4173/#/');
  await page.waitForSelector('h1:has-text("Welcome back")', { timeout: 10000 });
  const end = Date.now();
  
  const loadTimeMs = end - start;
  console.log(`DASHBOARD_LOAD_TIME_MS=${loadTimeMs}`);

  await browser.close();
})();
