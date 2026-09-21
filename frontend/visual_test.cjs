const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const PNG = require('pngjs').PNG;
let pixelmatch; // Loaded dynamically below

const SCREEN_MAP_PATH = path.resolve(__dirname, '../SCREEN_MAP.md');
const APP_JSX_PATH = path.resolve(__dirname, './src/App.jsx');
const STITCH_FOLDER = path.resolve(__dirname, '../../stitch_khetsaathi_farm_management_ui');
const DIFFS_DIR = path.resolve(__dirname, '../.visual_diffs_v2');

const HIDE_CONTENT_CSS = `
  * {
    color: transparent !important;
    text-shadow: none !important;
  }
  input::-webkit-input-placeholder, textarea::-webkit-input-placeholder {
    color: transparent !important;
  }
  img, svg, video, iframe, canvas {
    opacity: 0 !important;
  }
`;

async function run() {
  pixelmatch = (await import('pixelmatch')).default;

  if (!fs.existsSync(DIFFS_DIR)) {
    fs.mkdirSync(DIFFS_DIR, { recursive: true });
  }

  const appJsx = fs.readFileSync(APP_JSX_PATH, 'utf-8');
  const screenMap = fs.readFileSync(SCREEN_MAP_PATH, 'utf-8').split('\n');
  const tasks = [];

  for (let line of screenMap) {
    if (!line.startsWith('|') || line.includes('Target Group') || line.includes(':---')) continue;
    
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 6) continue;

    const folderName = parts[1].replace(/`/g, '');
    let componentPath = parts[4].replace(/`/g, '');
    
    if (!componentPath.endsWith('.jsx')) continue;

    const componentName = path.basename(componentPath, '.jsx');
    
    const routeRegex = new RegExp(`<Route[^>]+path="([^"]+)"[^>]+element={[\\s\\S]*?<${componentName}\\s*/>[\\s\\S]*?}`);
    const match = appJsx.match(routeRegex);
    let routePath = '';
    
    if (match) {
      routePath = match[1];
    } else {
      const indexRegex = new RegExp(`<Route[^>]+index[^>]+element={[\\s\\S]*?<${componentName}\\s*/>[\\s\\S]*?}`);
      if (indexRegex.test(appJsx)) {
        routePath = ''; 
      } else {
        console.warn(`[WARN] Route for ${componentName} not found in App.jsx`);
        continue;
      }
    }

    const codeHtmlPath = path.join(STITCH_FOLDER, folderName, 'code.html');
    if (!fs.existsSync(codeHtmlPath)) {
      console.warn(`[WARN] code.html not found for ${folderName}`);
      continue;
    }

    // Convert file path to file:// URL
    const fileUrl = 'file:///' + codeHtmlPath.replace(/\\/g, '/');

    tasks.push({
      folderName,
      componentName,
      routePath: `http://localhost:5173/${routePath.replace(/^\//, '')}`,
      codeHtmlUrl: fileUrl
    });
  }

  console.log(`Found ${tasks.length} screens to verify structurally.`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const task of tasks) {
    console.log(`Processing: ${task.folderName}`);
    
    // Fixed mobile viewport for testing
    const width = 375;
    const height = 812;
    
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    
    // Page 1: Baseline (code.html)
    const pageBaseline = await context.newPage();
    try {
      await pageBaseline.goto(task.codeHtmlUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await pageBaseline.addStyleTag({ content: HIDE_CONTENT_CSS });
      await pageBaseline.waitForTimeout(500); // Wait for styles to apply
    } catch (e) {
      console.error(`  -> Failed to load baseline ${task.codeHtmlUrl}: ${e.message}`);
      await context.close();
      continue;
    }
    
    const baselineBuffer = await pageBaseline.screenshot({ fullPage: false });
    const baselinePng = PNG.sync.read(baselineBuffer);

    // Page 2: Target (React App)
    const pageTarget = await context.newPage();
    try {
      await pageTarget.goto(task.routePath, { waitUntil: 'networkidle', timeout: 30000 });
      await pageTarget.addStyleTag({ content: HIDE_CONTENT_CSS });
      await pageTarget.waitForTimeout(2000); // Wait for API calls / animations to finish settling
    } catch (e) {
      console.error(`  -> Failed to load target ${task.routePath}: ${e.message}`);
      await context.close();
      continue;
    }
    
    const targetBuffer = await pageTarget.screenshot({ fullPage: false });
    const targetPng = PNG.sync.read(targetBuffer);
    
    // Ensure dimensions match
    const matchWidth = Math.min(baselinePng.width, targetPng.width);
    const matchHeight = Math.min(baselinePng.height, targetPng.height);
    
    const diffPng = new PNG({ width: matchWidth, height: matchHeight });
    
    const numDiffPixels = pixelmatch(
      baselinePng.data,
      targetPng.data,
      diffPng.data,
      matchWidth,
      matchHeight,
      { threshold: 0.1, alpha: 0.5 }
    );
    
    const diffPercentage = ((numDiffPixels / (matchWidth * matchHeight)) * 100).toFixed(2);
    
    if (parseFloat(diffPercentage) > 5.0) {
      const actualImgPath = path.join(DIFFS_DIR, `${task.componentName}_actual.png`);
      const baselineImgPath = path.join(DIFFS_DIR, `${task.componentName}_baseline.png`);
      const diffImgPath = path.join(DIFFS_DIR, `${task.componentName}_diff.png`);
      fs.writeFileSync(actualImgPath, targetBuffer);
      fs.writeFileSync(baselineImgPath, baselineBuffer);
      fs.writeFileSync(diffImgPath, PNG.sync.write(diffPng));
    }
    
    results.push({
      componentName: task.componentName,
      folderName: task.folderName,
      diffPercentage: parseFloat(diffPercentage)
    });
    console.log(`  -> Structural Diff: ${diffPercentage}%`);
    
    await context.close();
  }

  await browser.close();
  
  fs.writeFileSync(
    path.join(DIFFS_DIR, 'results.json'), 
    JSON.stringify(results.sort((a,b) => b.diffPercentage - a.diffPercentage), null, 2)
  );
  console.log('Done!');
}

run().catch(console.error);
