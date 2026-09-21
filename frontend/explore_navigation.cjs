const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runExploration() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });
  
  const page = await context.newPage();
  const report = [];

  const logIssue = (type, url, message) => {
    report.push(`[${type}] ${url} - ${message}`);
    console.log(`[${type}] ${url} - ${message}`);
  };

  page.on('console', msg => {
    if (msg.type() === 'error') {
      logIssue('ERROR', page.url(), `Console error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => {
    logIssue('ERROR', page.url(), `Page error: ${err.message}`);
  });

  try {
    console.log('Navigating to root...');
    await page.goto('http://localhost:5173');
    
    // Inject fake JWT token to bypass ProtectedRoute
    console.log('Injecting mock JWT token...');
    await page.evaluate(() => {
       const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjI1MzQwMjMwMDc5OSwiaWF0IjoxNjAwMDAwMDAwfQ.sig';
       localStorage.setItem('token', fakeJwt);
    });
    
    // Reload to apply token
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // We should be on Home Dashboard
    const currentUrl = page.url();
    console.log(`Currently on: ${currentUrl}`);

    async function checkPageHealth(stepName) {
      const url = page.url();
      // Check 404/blank
      const html = await page.content();
      if (html.includes('404') || html.includes('Not Found') || html.includes('Route not found')) {
         logIssue('404', url, `404 Not Found at step ${stepName}`);
      }
      
      // Check double nav
      const navs = await page.$$('nav');
      if (navs.length > 1) {
         logIssue('CONFLICT', url, `Double bottom nav found (${navs.length} <nav> elements) at step ${stepName}`);
      }
      
      // Check double header
      const headers = await page.$$('header');
      if (headers.length > 1) {
         logIssue('CONFLICT', url, `Double header found (${headers.length} <header> elements) at step ${stepName}`);
      }
      
      // Check blank
      const bodyBox = await page.evaluate(() => {
        const body = document.querySelector('body');
        return body ? body.innerText.trim().length : 0;
      });
      if (bodyBox === 0) {
        logIssue('BLANK', url, `Page renders blank (no text in body) at step ${stepName}`);
      }
      await page.waitForTimeout(500);
    }

    await checkPageHealth('Initial Dashboard Load');

    // 1. Click bottom nav items
    console.log('Testing Bottom Nav...');
    const bottomNavItems = ['Plan', 'Marketplace', 'Alerts', 'Profile', 'Home'];
    for (const item of bottomNavItems) {
      console.log(`Clicking nav item: ${item}`);
      const clicked = await page.evaluate((text) => {
         const buttons = Array.from(document.querySelectorAll('nav a, nav button'));
         const target = buttons.find(b => b.innerText.includes(text));
         if (target) { target.click(); return true; }
         return false;
      }, item);
      
      if (clicked) {
        await page.waitForTimeout(1500); 
        await checkPageHealth(`Bottom Nav: ${item}`);
      } else {
        logIssue('MISSING', page.url(), `Could not find bottom nav button for '${item}'`);
      }
    }

    // 2. Open More menu
    console.log('Testing More Menu...');
    await page.goto('http://localhost:5173/more', { waitUntil: 'networkidle' });
    await checkPageHealth('More Menu Home');
    
    // Click items in more menu
    const moreItems = await page.evaluate(() => {
      // Find all clickable cards or links in the more menu main area
      return Array.from(document.querySelectorAll('main a')).map(el => el.href).filter(Boolean);
    });
    
    const uniqueMoreLinks = [...new Set(moreItems)];
    for (let i = 0; i < Math.min(5, uniqueMoreLinks.length); i++) {
       const target = uniqueMoreLinks[i];
       console.log(`Clicking more menu link: ${target}`);
       await page.goto(target, { waitUntil: 'networkidle' });
       await checkPageHealth(`More Menu Link: ${target}`);
       await page.goBack({ waitUntil: 'networkidle' });
    }

    // Return to home
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // 3. Test Feature Groups (Clicking random cards/links on Home)
    console.log('Testing Feature Groups from Home...');
    const featureLinks = await page.evaluate(() => {
       return Array.from(document.querySelectorAll('a[href^="/"]')).map(a => a.href);
    });
    
    // Dedup and select a subset
    const uniqueLinks = [...new Set(featureLinks)].filter(l => !l.endsWith('/') && !l.endsWith('/more'));
    for (let i = 0; i < Math.min(6, uniqueLinks.length); i++) {
       const target = uniqueLinks[i];
       console.log(`Navigating to feature link: ${target}`);
       await page.goto(target, { waitUntil: 'networkidle' });
       await checkPageHealth(`Feature Link: ${target}`);
    }

  } catch (err) {
    console.error('Fatal Script Error:', err);
  } finally {
    await browser.close();
    fs.writeFileSync('navigation_report.txt', report.join('\n') || 'No issues found.');
    console.log('Navigation test complete. Report saved.');
  }
}

runExploration();
