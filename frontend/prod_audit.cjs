const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  
  // Extract all routes from App.jsx
  const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
  const code = fs.readFileSync(appJsxPath, 'utf8');
  const routeRegex = /<Route\s+path="([^"]+)"/g;
  const rawRoutes = [];
  let match;
  while ((match = routeRegex.exec(code)) !== null) {
    if (!['/login', '/splash', '/onboarding/phone', '/onboarding/role', '/onboarding/farm-setup'].includes(match[1])) {
      let r = match[1];
      if (r.includes(':')) r = r.split('/:')[0];
      rawRoutes.push(r);
    }
  }
  const uniqueRoutes = [...new Set(rawRoutes)];

  console.log(`Discovered ${uniqueRoutes.length} protected routes to audit in PRODUCTION.`);

  try {
    // 1. Log in via backend API bypass
    console.log("Authenticating against real backend via Node...");
    const res = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@agri.test', password: 'demo1234' })
    });
    const data = await res.json();
    if (!data.access_token) {
       throw new Error("Failed to get token from backend.");
    }
    const token = data.access_token;
    const farmId = (data.farms && data.farms.length > 0) ? data.farms[0].id : '00000000-0000-0000-0000-000000000000';

    await page.goto('http://localhost:4173');
    await page.evaluate((auth) => {
      localStorage.setItem('token', auth.token);
      localStorage.setItem('farmId', auth.farmId);
    }, { token, farmId });

    // We will collect console messages across all navigations
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push({ type: msg.type(), text: msg.text() });
      }
    });

    // Go to root to mount the App shell
    await page.goto('http://localhost:4173/');
    await page.waitForTimeout(1000);

    for (const route of uniqueRoutes) {
      console.log(`Navigating to ${route}...`);
      
      // Clear logs before navigation
      consoleLogs.length = 0;

      await page.evaluate((r) => window.routerNavigate(r), route);
      await page.waitForTimeout(1000);

      const hasErrors = consoleLogs.some(log => log.type === 'error');
      const hasHydrationWarns = consoleLogs.some(log => log.text.includes('hydration') || log.text.includes('Minified React error'));

      let status = '✅ PASS';
      let notes = '-';
      if (hasErrors || hasHydrationWarns) {
        status = '❌ FAIL';
        notes = consoleLogs.map(l => `[${l.type.toUpperCase()}] ${l.text}`).join('<br>').substring(0, 500); // truncate for md
      }

      results.push({ route, status, issues: notes });
    }

  } catch (error) {
    console.error("Audit aborted:", error);
  } finally {
    await browser.close();
    
    // Generate Report
    let md = '# Production Environment Audit (Vite Preview)\\n\\n';
    md += '| Route | Status | Console Errors |\\n';
    md += '| :--- | :--- | :--- |\\n';
    results.forEach(r => {
      md += `| \`${r.route}\` | ${r.status} | ${r.issues} |\\n`;
    });

    const reportPath = path.join(process.env.USERPROFILE || 'C:/Users/prade', '.gemini/antigravity-ide/brain/19889dd3-b0eb-451a-a839-801bf1d42087', 'PROD_AUDIT.md');
    fs.writeFileSync(reportPath, md);
    console.log(`Audit complete. Report saved to ${reportPath}`);
  }
})();
