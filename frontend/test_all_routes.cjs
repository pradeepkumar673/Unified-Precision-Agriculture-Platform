const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const ROUTES_TO_TEST = [
  '/',
  '/more',
  '/farm/profile',
  '/planning/crop-plan',
  '/planning/season-timeline',
  '/planning/season-performance',
  '/planning/rotation',
  '/planning/variety-comparison',
  '/planning/variable-rate',
  '/health/disease-result',
  '/health/pest-risk',
  '/health/livestock',
  '/water-soil/irrigation',
  '/water-soil/demand-forecast',
  '/water-soil/zone-management',
  '/water-soil/soil-health',
  '/vision/satellite',
  '/vision/price-forecast',
  '/vision/yield-forecast',
  '/vision/drone-climate',
  '/marketplace/inputs',
  '/marketplace/rentals',
  '/marketplace/exchange',
  '/marketplace/machinery',
  '/marketplace/harvest',
  '/marketplace/delivery',
  '/finance/wallet',
  '/finance/checkout',
  '/finance/credit-insurance',
  '/gov/schemes',
  '/gov/documents',
  '/gov/traceability',
  '/community/season-report',
  '/community/grower-score',
  '/community/fpo',
  '/community/digital-sakhi',
  '/community/alerts',
  '/community/shg-bookings',
  '/community/disease-map',
  '/community/fpo-cooperative-suite',
  '/ai/causal-lab',
  '/ai/federated-learning',
  '/iot/dashboard',
  '/iot/hydro-climate',
  '/iot/shelves',
  '/iot/traceability',
  
  // Full-bleed ones
  '/farm/boundary',
  '/health/disease-scanner',
  '/ai/assistant',
  '/ai/multimodal-query'
];

async function runTests() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const report = [];
  
  // Fake JWT Token (Header.Payload.Signature)
  // Payload: {"sub": "demo", "exp": 9999999999}
  const payload = Buffer.from(JSON.stringify({ sub: "demo", exp: 9999999999 })).toString('base64');
  const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.signature`;

  // Go to root to set localStorage
  await page.goto(BASE_URL + '/splash');
  await page.evaluate((token) => {
    localStorage.setItem('token', token);
  }, fakeToken);

  console.log('Testing ' + ROUTES_TO_TEST.length + ' routes...');

  for (const route of ROUTES_TO_TEST) {
    const url = BASE_URL + route;
    let errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 5000 });
      if (response && !response.ok()) {
        errors.push(`HTTP ${response.status()}`);
      }

      // Check if screen is completely blank (e.g. only contains AppShell or nothing)
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      if (bodyHTML.length < 500) {
        errors.push('Screen renders blank (HTML length < 500)');
      }
      
      const currentUrl = page.url();
      if (!currentUrl.includes(route) && currentUrl !== url) {
         if (currentUrl.includes('/splash')) {
            errors.push('Redirected to /splash (Auth Failed?)');
         } else {
            errors.push(`Redirected to ${currentUrl}`);
         }
      }

    } catch (e) {
      errors.push(e.message);
    }
    
    if (errors.length > 0) {
      report.push({ route, status: 'ERROR', errors });
      console.log(`[ERROR] ${route} -> ${errors[0]}`);
    } else {
      console.log(`[OK] ${route}`);
    }
  }

  await browser.close();

  fs.writeFileSync('ROUTE_REPORT.md', '# Route Verification Report\n\n');
  if (report.length === 0) {
    fs.appendFileSync('ROUTE_REPORT.md', 'All screens loaded successfully with no errors or blank renders!\n');
    console.log('All clear!');
  } else {
    for (const r of report) {
      fs.appendFileSync('ROUTE_REPORT.md', `## ${r.route}\n- ${r.errors.join('\n- ')}\n\n`);
    }
  }
}

runTests().catch(console.error);
