const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const iPhone = devices['iPhone 14'];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    // Add some permissions to avoid prompts if any
    permissions: ['geolocation']
  });
  
  const page = await context.newPage();
  
  const results = [];
  const artifactsDir = path.join(process.env.USERPROFILE || 'C:/Users/prade', '.gemini/antigravity-ide/brain/19889dd3-b0eb-451a-a839-801bf1d42087', 'mobile_audit_screens');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

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
        r = r.split('/:')[0];
      }
      rawRoutes.push(r);
    }
  }
  const uniqueRoutes = [...new Set(rawRoutes)];

  console.log(`Discovered ${uniqueRoutes.length} protected routes to audit for mobile responsiveness.`);

  try {
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
        throw new Error("Failed to get token from backend.");
      }
    });

    // Go to root to mount the App shell and RouterHelper
    await page.goto('http://localhost:5175/');
    await page.waitForTimeout(2000);

    for (const route of uniqueRoutes) {
      console.log(`Navigating to ${route}...`);
      
      // Navigate organically
      await page.evaluate((r) => {
        if (window.routerNavigate) {
          window.routerNavigate(r);
        } else {
          throw new Error("window.routerNavigate not found!");
        }
      }, route);

      await page.waitForTimeout(1500); // Wait for animations and DOM updates

      // Perform Heuristic Analysis
      const analysis = await page.evaluate(() => {
        const issues = [];
        const w = window.innerWidth; // iPhone 14 = 390
        
        // 1. Horizontal Overflow
        // Exclude elements that have overflow-x: auto (scrollable containers)
        const allEls = document.querySelectorAll('body *');
        for (const el of allEls) {
          if (el.scrollWidth > w) {
            const style = window.getComputedStyle(el);
            if (style.overflowX !== 'auto' && style.overflowX !== 'scroll') {
               // Verify its actual bounding rect is wider
               const rect = el.getBoundingClientRect();
               if (rect.width > w) {
                 issues.push(`Overflow: Element <${el.tagName.toLowerCase()} class="${el.className}"> width ${Math.round(rect.width)}px exceeds viewport ${w}px.`);
               }
            }
          }
        }

        // 2. Touch Targets (Min 44x44)
        const touchables = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
        for (const el of touchables) {
          const rect = el.getBoundingClientRect();
          // Exclude invisible elements
          if (rect.width === 0 || rect.height === 0 || window.getComputedStyle(el).display === 'none') continue;
          
          if (rect.width < 44 || rect.height < 44) {
            // Some inline links (e.g. "Terms of Service") are naturally small in height, we can optionally skip them,
            // but let's flag them for strictness. We will ignore standard <a> tags inside paragraphs for height.
            if (el.tagName === 'A' && window.getComputedStyle(el).display === 'inline') continue;
            
            issues.push(`Touch Target: <${el.tagName.toLowerCase()} class="${el.className}"> is ${Math.round(rect.width)}x${Math.round(rect.height)}px (needs 44x44).`);
          }
        }
        
        // 3. Safe Area Violations
        // Top 47px, Bottom 34px. 
        // We only care if interactive elements are rendered directly in these zones, or text is cut off.
        // This is hard to evaluate programmatically without lots of false positives (e.g. fixed headers are supposed to be there but they have internal padding).
        // Let's just check if any interactive elements are in the top 40px or bottom 20px without being part of a nav/header.
        // We'll skip this for now and rely on manual screenshot verification if needed, or implement a basic check.
        for (const el of touchables) {
           const rect = el.getBoundingClientRect();
           if (rect.top > 0 && rect.top < 47) {
             const style = window.getComputedStyle(el);
             // If it's not inside a header...
             if (!el.closest('header')) {
                issues.push(`Safe Area (Top): <${el.tagName.toLowerCase()}> is at y=${Math.round(rect.top)}px (overlaps notch).`);
             }
           }
        }
        
        // Return unique issues
        return [...new Set(issues)];
      });

      // Save screenshot
      const safeName = route.replace(/[^a-zA-Z0-9]/g, '_') || 'home';
      const screenshotPath = path.join(artifactsDir, `${safeName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      let status = analysis.length === 0 ? '✅ PASS' : '❌ FAIL';
      results.push({ route, status, issues: analysis, screenshot: screenshotPath });
    }

  } catch (error) {
    console.error("Audit aborted:", error);
  } finally {
    await browser.close();
    
    // Generate Report
    let md = '# Mobile Interaction Audit Report (iPhone 14)\\n\\n';
    md += '| Route | Status | Issues |\\n';
    md += '| :--- | :--- | :--- |\\n';
    results.forEach(r => {
      const issueText = r.issues.length ? r.issues.join('<br>') : '-';
      md += `| \`${r.route}\` | ${r.status} | ${issueText} |\\n`;
    });

    const reportPath = path.join(process.env.USERPROFILE || 'C:/Users/prade', '.gemini/antigravity-ide/brain/19889dd3-b0eb-451a-a839-801bf1d42087', 'MOBILE_AUDIT.md');
    fs.writeFileSync(reportPath, md);
    console.log(`Audit complete. Report saved to ${reportPath}`);
  }
})();
