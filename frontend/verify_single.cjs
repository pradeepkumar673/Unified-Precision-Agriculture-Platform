const { chromium, devices } = require('playwright');

(async () => {
  const iPhone = devices['iPhone 14'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(iPhone);
  const page = await context.newPage();

  console.log("Authenticating...");
  await page.goto('http://localhost:5175');
  await page.evaluate(async () => {
    const res = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@agri.test', password: 'demo1234' })
    });
    const data = await res.json();
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('farmId', data.farms[0].id);
  });

  await page.goto('http://localhost:5175/');
  await page.waitForTimeout(1000);
  
  const targetRoute = process.argv[2] || '/';
  
  // Re-verify the route by organically navigating to it
  console.log(`Navigating to ${targetRoute} organically...`);
  await page.evaluate((route) => window.routerNavigate(route), targetRoute);
  await page.waitForTimeout(1500);

  const analysis = await page.evaluate((w) => {
    const issues = [];
    // We pass w (390) explicitly just to be safe, though window.innerWidth works
    const touchables = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
    
    for (const el of touchables) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') continue;
      if (rect.width < 44 || rect.height < 44) {
        if (el.tagName === 'A' && window.getComputedStyle(el).display === 'inline') continue;
        issues.push(`Touch Target: <${el.tagName.toLowerCase()} class="${el.className}"> is ${Math.round(rect.width)}x${Math.round(rect.height)}px (needs 44x44).`);
      }
    }
    return issues;
  }, 390);

  if (analysis.length === 0) {
    console.log(`✅ PASS: No touch target violations on ${targetRoute}`);
  } else {
    console.log(`❌ FAIL: Violations found on ${targetRoute}:`);
    analysis.forEach(a => console.log(a));
  }
  
  await browser.close();
})();
