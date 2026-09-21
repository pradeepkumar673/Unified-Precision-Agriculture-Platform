const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  let currentErrors = [];
  
  // Listen for console errors (like failed API requests)
  page.on('console', msg => {
    if (msg.type() === 'error') {
      currentErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    currentErrors.push(err.message);
  });
  page.on('response', resp => {
    if (resp.status() >= 400 && resp.url().includes('/api/v1/')) {
      currentErrors.push(`API Error: ${resp.status()} ${resp.url()}`);
    }
  });

  // Extract all routes from App.jsx
  const appJsxPath = path.join(__dirname, 'src', 'App.jsx');
  const code = fs.readFileSync(appJsxPath, 'utf8');
  const routeRegex = /<Route\s+path="([^"]+)"/g;
  const rawRoutes = [];
  let match;
  while ((match = routeRegex.exec(code)) !== null) {
    if (!['/login', '/splash', '/onboarding/phone', '/onboarding/role', '/onboarding/farm-setup'].includes(match[1])) {
      let r = match[1];
      if (r.includes(':')) {
        r = r.split('/:')[0]; // Remove param for organic nav, e.g. /marketplace/delivery
      }
      rawRoutes.push(r);
    }
  }
  const uniqueRoutes = [...new Set(rawRoutes)];

  console.log(`Discovered ${uniqueRoutes.length} protected routes to audit.`);

  try {
    // 1. Log in
    // 1. Log in via backend API bypass
    console.log("Authenticating against real backend...");
    await page.goto('http://localhost:5175');
    await page.evaluate(async () => {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@agri.test', password: 'demo1234' })
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        if (data.farms && data.farms.length > 0) {
          localStorage.setItem('farmId', data.farms[0].id);
        } else {
          localStorage.setItem('farmId', '00000000-0000-0000-0000-000000000000');
        }
      } else {
        throw new Error("Failed to get token from backend: " + JSON.stringify(data));
      }
    });

    // Go to root to mount the App shell and RouterHelper
    await page.goto('http://localhost:5175/');
    await page.waitForTimeout(2000);

    for (const route of uniqueRoutes) {
      console.log(`Navigating to ${route}...`);
      currentErrors = []; // Reset errors for this route
      
      // Navigate organically
      await page.evaluate((r) => {
        if (window.routerNavigate) {
          window.routerNavigate(r);
        } else {
          throw new Error("window.routerNavigate not found!");
        }
      }, route);

      await page.waitForTimeout(1500); // Wait for animations, API calls, and DOM updates

      // Evaluate the DOM
      const domStats = await page.evaluate(() => {
        return {
          headers: document.querySelectorAll('header').length,
          navs: document.querySelectorAll('nav').length,
          appShells: document.querySelectorAll('.app-shell-root, .min-h-screen').length,
          pageText: document.body.innerText.substring(0, 500)
        };
      });

      // Analyze
      let status = '✅ PASS';
      const issues = [];
      
      if (domStats.headers > 1) {
        status = '❌ FAIL';
        issues.push(`Double header detected (${domStats.headers} <header> tags)`);
      }
      
      // Bottom nav is 1 for detail views (hidden) or 1 for standard. If 2, it's double nav.
      if (domStats.navs > 1) {
        status = '❌ FAIL';
        issues.push(`Double nav detected (${domStats.navs} <nav> tags)`);
      }

      if (currentErrors.length > 0) {
        status = '❌ FAIL';
        issues.push(`Backend/Console Errors: ${currentErrors.join(' | ')}`);
      }

      if (domStats.pageText.includes('TypeError') || domStats.pageText.includes('Failed to load') || domStats.pageText.toLowerCase().includes('not found')) {
        status = '⚠️ WARN';
        issues.push('Possible empty state or UI crash text detected.');
      }

      results.push({ route, status, issues });
    }

  } catch (error) {
    console.error("Audit aborted:", error);
  } finally {
    await browser.close();
    
    // Generate Report
    let md = '# Organic Navigation Audit Report\\n\\n';
    md += '| Route | Status | Issues |\\n';
    md += '| :--- | :--- | :--- |\\n';
    results.forEach(r => {
      md += `| \`${r.route}\` | ${r.status} | ${r.issues.length ? r.issues.join('<br>') : '-'} |\\n`;
    });

    const reportPath = path.join(process.env.USERPROFILE || 'C:/Users/prade', '.gemini/antigravity-ide/brain/19889dd3-b0eb-451a-a839-801bf1d42087', 'ORGANIC_AUDIT.md');
    fs.writeFileSync(reportPath, md);
    console.log(`Audit complete. Report saved to ${reportPath}`);
  }
})();
