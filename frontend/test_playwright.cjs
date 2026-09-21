const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('Launching Playwright Chrome...');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 1,
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:5173',
        localStorage: [
          { name: 'token', value: 'fake' },
          { name: 'farmId', value: 'ee2fdcf4-80b5-490a-97cc-b61dce15d9e2' }
        ]
      }]
    }
  });

  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:5173/health/disease-scanner ...');
  try {
    await page.goto('http://localhost:5173/health/disease-scanner', { waitUntil: 'networkidle', timeout: 15000 });
  } catch(e) {
    console.error('Navigation failed:', e);
  }
  
  // Wait a bit for React to render
  await page.waitForTimeout(2000);
  
  console.log('Taking screenshot...');
  const screenshotBuffer = await page.screenshot({ fullPage: false });
  
  const outputPath = 'C:\\Users\\prade\\.gemini\\antigravity-ide\\brain\\19889dd3-b0eb-451a-a839-801bf1d42087\\scratch\\proof.png';
  fs.writeFileSync(outputPath, screenshotBuffer);
  
  console.log(`Saved screenshot to ${outputPath}`);
  
  await browser.close();
  console.log('Done.');
})();
