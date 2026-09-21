const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
let pixelmatch;
const { PNG } = require('pngjs');

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const DESIGN_DIR = path.join(__dirname, '..', '..', 'stitch_khetsaathi_farm_management_ui');

const folderToRoute = {
  '1._crop_plan_recommendation': '/planning/crop-plan',
  '1._digital_sakhi_support_farm_visit': '/community/digital-sakhi',
  '1._farm_alerts_feed': '/community/alerts',
  '1._government_scheme_matching': '/gov/schemes',
  '1._gps_field_mapping': '/farm/boundary',
  '1._inputs_marketplace_browse': '/marketplace/inputs',
  '1._irrigation_recommendation': '/water-soil/irrigation',
  '1._leaf_disease_camera_scanner': '/health/disease-scanner',
  '1._live_sensor_dashboard': '/iot/dashboard',
  '1._mandi_price_forecast': '/vision/price-forecast',
  '1._splash_welcome_screen': '/splash',
  '1._voice_assistant': '/ai/assistant',
  '1._wallet_transaction_ledger': '/finance/wallet',
  '2._crop_diagnosis_result': '/health/disease-result',
  '2._farmer_document_vault': '/gov/documents',
  '2._hydroponics_climate_control': '/iot/hydro-climate',
  '2._multimodal_query': '/ai/multimodal-query',
  '2._payment_checkout': '/finance/checkout',
  '2._phone_number_login': '/login',
  '2._product_detail_machinery_rental': '/marketplace/machinery',
  '2._season_performance_report': '/planning/season-performance',
  '2._season_timeline': '/planning/season-timeline',
  '2._shg_shared_bookings': '/community/shg-bookings',
  '2._water_demand_forecast': '/water-soil/demand-forecast',
  '2._yield_forecast': '/vision/yield-forecast',
  '2._zone_management_variable_rate': '/water-soil/zone-management',
  '3._community_disease_outbreak_map': '/community/disease-map',
  '3._counterfactual_what_if_simulator': '/ai/causal-lab',
  '3._credit_marketplace_insurance': '/finance/credit-insurance',
  '3._crop_rotation_suggestion': '/planning/rotation',
  '3._fpo_cooperative_suite': '/community/fpo-cooperative-suite',
  '3._harvest_sell_produce': '/marketplace/harvest',
  '3._role_selection': '/onboarding/role',
  '3._satellite_crop_stress': '/vision/satellite',
  '3._soil_health_heatmap': '/water-soil/soil-health',
  '3._vertical_farm_shelf_monitor': '/iot/shelves',
  '4._delivery_logistics_tracking': '/marketplace/delivery',
  '4._drone_plant_counting_climate_risk': '/vision/drone-climate',
  '4._farm_setup_wizard_step_1_of_3': '/onboarding/farm-setup',
  '4._produce_traceability_energy': '/gov/traceability',
  '4._variety_comparison': '/planning/variety-comparison',
  '5._farmer_profile_settings': '/farm/profile',
  '5._main_home_dashboard': '/',
  'the_more_menu_feature_hub': '/more',
  
  // Missing ones:
  'aerial_top_down_drone_inspection...': '/vision/drone-climate', // actually duplicate? Let's just skip non-main ones or map them if needed
};

// Map exact names from SCREEN_MAP.md
const lines = fs.readFileSync(path.join(__dirname, '..', 'SCREEN_MAP.md'), 'utf8').split('\n');
const screensToAudit = [];
for (const line of lines) {
  if (line.includes('| `')) {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 5) {
      const folderStr = parts[1];
      const folderName = folderStr.replace(/`/g, '');
      const route = folderToRoute[folderName];
      if (route) {
        screensToAudit.push({ folder: folderName, route });
      }
    }
  }
}

async function runAudit() {
  pixelmatch = (await import('pixelmatch')).default;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  
  // Set Auth
  const payload = Buffer.from(JSON.stringify({ sub: 'demo', exp: 9999999999 })).toString('base64');
  const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.signature`;

  await page.goto(BASE_URL + '/splash');
  await page.evaluate((token) => localStorage.setItem('token', token), fakeToken);
  
  // Go to Home to start the SPA session
  await page.goto(BASE_URL + '/');
  await page.waitForTimeout(1000);

  const results = [];
  console.log(`Auditing ${screensToAudit.length} screens...`);

  for (const screen of screensToAudit) {
    try {
      console.log(`Testing ${screen.folder} at ${screen.route}...`);
      
      // Navigate via SPA (mimics actual UI click instead of direct URL load)
      await page.evaluate((url) => {
        if (window.routerNavigate) {
          window.routerNavigate(url);
        } else {
          window.location.pathname = url;
        }
      }, screen.route);
      
      await page.waitForTimeout(2500); // Wait for transition and lazy loading
      
      // Ensure all images are loaded (including mock map images)
      await page.evaluate(async () => {
        const imgs = Array.from(document.images);
        await Promise.all(imgs.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(r => { img.onload = r; img.onerror = r; });
        }));
      });
      await page.waitForTimeout(500);

      const actualPath = path.join(__dirname, `${screen.folder}_actual.png`);
      await page.screenshot({ path: actualPath, fullPage: true, animations: 'disabled' });

      // Compare
      const designImgPath = path.join(DESIGN_DIR, screen.folder, 'screen.png');
      if (fs.existsSync(designImgPath)) {
        const img1 = PNG.sync.read(fs.readFileSync(designImgPath));
        const img2 = PNG.sync.read(fs.readFileSync(actualPath));
        const matchWidth = Math.min(img1.width, img2.width);
        const matchHeight = Math.min(img1.height, img2.height);
        const diff = new PNG({ width: matchWidth, height: matchHeight });

        // Mask out images, maps, SVGs
        const ignoreAreas = await page.evaluate(() => {
          const areas = [];
          const els = document.querySelectorAll('img, svg, video, iframe, [class*="map"], [class*="chart"], [style*="background-image"]');
          els.forEach(el => {
            const rect = el.getBoundingClientRect();
            areas.push({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
          });
          return areas;
        });

        // Mask baseline
        for (const area of ignoreAreas) {
          const startY = Math.max(0, Math.floor(area.y * 2));
          const endY = Math.min(matchHeight, Math.floor((area.y + area.h) * 2));
          const startX = Math.max(0, Math.floor(area.x * 2));
          const endX = Math.min(matchWidth, Math.floor((area.x + area.w) * 2));
          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const idx1 = (img1.width * y + x) << 2;
              const idx2 = (img2.width * y + x) << 2;
              if (idx1 < img1.data.length) {
                img1.data[idx1] = 255; img1.data[idx1+1] = 0; img1.data[idx1+2] = 255; img1.data[idx1+3] = 255;
              }
              if (idx2 < img2.data.length) {
                img2.data[idx2] = 255; img2.data[idx2+1] = 0; img2.data[idx2+2] = 255; img2.data[idx2+3] = 255;
              }
            }
          }
        }

        let numDiffPixels = 0;
        try {
          numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, matchWidth, matchHeight, { threshold: 0.15, alpha: 0.5 });
        } catch (e) {
          console.error(`Error during pixelmatch for ${screen.folder}:`, e);
          numDiffPixels = matchWidth * matchHeight;
        }
        
        const mismatchPercent = (numDiffPixels / (matchWidth * matchHeight)) * 100;
        results.push({ folder: screen.folder, route: screen.route, score: mismatchPercent });
        
        if (mismatchPercent > 20) {
          fs.writeFileSync(path.join(__dirname, `${screen.folder}_diff.png`), PNG.sync.write(diff));
        }
      } else {
        results.push({ folder: screen.folder, route: screen.route, score: 'Missing Baseline' });
      }

    } catch (e) {
      console.error(`Error on ${screen.folder}:`, e.message);
      results.push({ folder: screen.folder, route: screen.route, score: 'ERROR' });
    }
  }

  await browser.close();

  // Sort and write report
  results.sort((a, b) => {
    if (typeof a.score === 'number' && typeof b.score === 'number') return b.score - a.score;
    return 0;
  });

  let report = '# SPA UI Audit Report (AppShell Layout Check)\n\n';
  report += 'Navigating using `window.routerNavigate()` to mimic UI interactions and verify AppShell persists without double headers.\n\n';
  
  for (const r of results) {
    if (typeof r.score === 'number') {
      const status = r.score < 8.0 ? 'MATCH' : 'MISMATCH';
      report += `## ${r.folder}\n`;
      report += `- Route: \`${r.route}\`\n`;
      report += `- Status: **${status}** (${r.score.toFixed(2)}% difference)\n`;
      if (status === 'MISMATCH') {
        report += `- **Differences / Visual Conflicts:**\n`;
        report += `  - (Check ${r.folder}_diff.png for overlaps, double padding, or double headers)\n`;
      }
      report += '\n';
    } else {
      report += `## ${r.folder}\n- Route: \`${r.route}\`\n- Status: **${r.score}**\n\n`;
    }
  }

  fs.writeFileSync(path.join(__dirname, 'AUDIT.md'), report);
  console.log('Audit complete! Wrote AUDIT.md');
}

runAudit().catch(console.error);
