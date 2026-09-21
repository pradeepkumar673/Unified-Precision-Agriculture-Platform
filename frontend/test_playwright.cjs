const { chromium } = require('playwright');
(async () => {
  try {
    console.log("Launching default playwright chromium...");
    const browser = await chromium.launch();
    console.log("Browser launched successfully!");
    const page = await browser.newPage();
    await page.goto('http://localhost:5175');
    await page.screenshot({ path: 'playwright_test.png' });
    console.log("Screenshot saved to playwright_test.png");
    await browser.close();
  } catch (error) {
    console.error("Playwright default failed:", error);
    try {
      console.log("Attempting fallback to local Chrome channel...");
      const browser = await chromium.launch({ channel: 'chrome' });
      console.log("Browser launched successfully with channel: chrome!");
      const page = await browser.newPage();
      await page.goto('http://localhost:5175');
      await page.screenshot({ path: 'playwright_test.png' });
      console.log("Screenshot saved to playwright_test.png");
      await browser.close();
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      process.exit(1);
    }
  }
})();
