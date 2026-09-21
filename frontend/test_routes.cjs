const { chromium } = require('playwright');

const routesToTest = [
  '/', 
  '/planning/crop-plan',
  '/marketplace/inputs',
  '/community/alerts',
  '/farm/profile',
  '/more',
  '/health/disease-scanner',
  '/vision/satellite',
  '/gov/schemes'
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Important: we need to set localStorage token so we don't get redirected to /login
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:5173',
          localStorage: [
            {
              name: 'token',
              value: 'fake-token-for-testing' // Bypass ProtectedRoute
            },
            {
              name: 'farmId',
              value: 'ee2fdcf4-80b5-490a-97cc-b61dce15d9e2'
            }
          ]
        }
      ]
    }
  });
  
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`PAGE ERROR: ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`PAGE EXCEPTION: ${error.message}`);
  });

  let hasErrors = false;

  for (const route of routesToTest) {
    const url = `http://localhost:5173${route}`;
    try {
      console.log(`Testing ${url}...`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      
      // Wait a moment for any client-side redirects (e.g., to /login if token validation fails)
      await page.waitForTimeout(1000);
      
      if (page.url().includes('/login') && route !== '/login') {
         console.error(`❌ ${route} redirected to login! Auth issue?`);
         hasErrors = true;
         continue;
      }
      
      // Check if root has content (not blank)
      const rootHtml = await page.innerHTML('#root');
      if (!rootHtml || rootHtml.trim() === '') {
        console.error(`❌ ${route} rendered BLANK (#root is empty)!`);
        hasErrors = true;
        continue;
      }
      
      // Look for the AppShell header (should be present on all these routes)
      const hasHeader = await page.locator('header').count() > 0;
      if (!hasHeader) {
        console.error(`❌ ${route} did not render the AppShell <header>!`);
        hasErrors = true;
      } else {
        console.log(`✅ ${route} rendered successfully with AppShell.`);
      }
      
    } catch (e) {
      console.error(`❌ Error navigating to ${route}: ${e.message}`);
      hasErrors = true;
    }
  }

  await browser.close();
  
  if (hasErrors) {
    process.exit(1);
  } else {
    console.log('All routes verified successfully.');
    process.exit(0);
  }
}

run().catch(console.error);
