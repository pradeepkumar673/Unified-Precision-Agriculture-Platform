const { chromium, devices } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(devices['Desktop Chrome']);
  const page = await context.newPage();
  
  const results = [];
  
  try {
    console.log("Authenticating by fetching a real token from the backend...");
    await page.goto('http://localhost:5173/');
    
    // Fetch real JWT token from backend directly via page.evaluate
    await page.evaluate(async () => {
      const formData = new URLSearchParams();
      formData.append('username', 'demo@agri.test');
      formData.append('password', 'demo1234');
      
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('farmId', data.farms[0].id);
    });
    
    // Reload to apply token and pass ProtectedRoute
    await page.goto('http://localhost:5173/#/dashboard');
    await page.waitForTimeout(2000); // give it time to load the dashboard

    const features = [
      { name: "Hydroponics Climate", route: "/iot/hydro-climate", checkStr: "Temperature" },
      { name: "Leaf Disease Scanner", route: "/health/disease-scanner", checkStr: "Disease" },
      { name: "Mandi Price Forecast", route: "/vision/price-forecast", checkStr: "Price" }
    ];
    
    for (const feature of features) {
      console.log(`Testing ${feature.name}...`);
      await page.goto(`http://localhost:5173/#${feature.route}`, { waitUntil: 'networkidle' });
      
      // Wait for any potential loading spinners to disappear
      try {
        await page.waitForFunction(() => {
          return !document.body.innerText.toLowerCase().includes('loading');
        }, { timeout: 4000 });
      } catch (e) {}
      
      await page.waitForTimeout(2000); // Give it extra time to render DOM
      
      const content = await page.evaluate(() => document.body.innerText);
      
      if (content.includes("Something went wrong") || content.includes("Failed to load") || content.includes("404")) {
        results.push(`[FAILED] ${feature.name}: Crashed or failed to load data.`);
      } else if (content.includes("KhetSaathi  Your Digital Krishi Mitra")) {
         results.push(`[FAILED] ${feature.name}: Redirected to login page. Token may be invalid.`);
      } else if (content.includes(feature.checkStr)) {
        results.push(`[PASSED] ${feature.name}: Loaded successfully. Extracted text snippet: "${content.substring(0, 150).replace(/\n/g, ' ')}..."`);
      } else {
        results.push(`[WARNING] ${feature.name}: Loaded but might be missing data. Text: "${content.substring(0, 100).replace(/\n/g, ' ')}..."`);
      }
    }
    
  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    await browser.close();
  }
  
  console.log("\n--- TEST RESULTS ---");
  console.log(results.join("\n"));
})();
