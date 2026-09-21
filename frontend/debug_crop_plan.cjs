const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const payload = Buffer.from(JSON.stringify({ sub: 'demo', exp: 9999999999 })).toString('base64');
  const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.signature`;
  
  await page.goto('http://localhost:5173/');
  await page.evaluate(({fakeToken}) => {
    localStorage.setItem('token', fakeToken);
    localStorage.setItem('farmId', 'ee2fdcf4-80b5-490a-97cc-b61dce15d9e2');
  }, {fakeToken});
  
  await page.goto('http://localhost:5173/planning/crop-plan');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/prade/.gemini/antigravity-ide/brain/19889dd3-b0eb-451a-a839-801bf1d42087/debug_crop_plan.png' });
  await browser.close();
})();
