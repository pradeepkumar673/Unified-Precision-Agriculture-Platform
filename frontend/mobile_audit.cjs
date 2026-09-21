const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '.mobile_audit');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({
    ...iPhone,
    viewport: { width: 390, height: 844 }
  });

  const page = await context.newPage();
  
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', 'farmer');
    localStorage.setItem('farmId', 'farm-123');
  });

  const takeScreenshot = async (name) => {
    await page.waitForTimeout(1000); // Allow render
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${name}.png`) });
    console.log(`Saved screenshot: ${name}.png`);
  };

  const routes = [
    { url: '/', name: '01_Home' },
    { url: '/planning/crop-plan', name: '02_Plan' },
    { url: '/marketplace/inputs', name: '03_Market' },
    { url: '/community/alerts', name: '04_Alerts' },
    { url: '/farm/profile', name: '05_Profile' },
    { url: '/more', name: '06_MoreMenu' },
    { url: '/iot/hydro-climate', name: '07_Hydroponics' },
    { url: '/water-soil/irrigation', name: '08_Irrigation' },
    { url: '/vision/price-forecast', name: '09_MandiPrice' },
  ];

  for (const route of routes) {
    console.log(`Navigating to ${route.url}...`);
    await page.goto(`http://localhost:5173${route.url}`, { waitUntil: 'networkidle' });
    await takeScreenshot(route.name);
  }

  await browser.close();
  console.log('Mobile audit complete.');
}

runAudit().catch(console.error);
