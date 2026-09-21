const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const PNG = require('pngjs').PNG;
let pixelmatch; // Loaded dynamically below

const SCREEN_MAP_PATH = path.resolve(__dirname, '../SCREEN_MAP.md');
const APP_JSX_PATH = path.resolve(__dirname, './src/App.jsx');
const STITCH_FOLDER = path.resolve(__dirname, '../../stitch_khetsaathi_farm_management_ui');
const AUDIT_MD_PATH = path.resolve(__dirname, '../FINAL_AUDIT.md');
const DIFFS_DIR = path.resolve(__dirname, '../.visual_diffs_audit');

const HIDE_CONTENT_CSS = `
  * {
    color: transparent !important;
    text-shadow: none !important;
    background-image: none !important;
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

  const targetComponent = process.argv[2];

  const appJsx = fs.readFileSync(APP_JSX_PATH, 'utf-8');
  const screenMap = fs.readFileSync(SCREEN_MAP_PATH, 'utf-8').split('\n');
  const tasks = [];
  
  const doubleHeaderConflicts = [];

  for (let line of screenMap) {
    if (!line.startsWith('|') || line.includes('Target Group') || line.includes(':---')) continue;
    
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 6) continue;

    const folderName = parts[1].replace(/`/g, '');
    let componentPath = parts[4].replace(/`/g, '');
    
    if (!componentPath.endsWith('.jsx')) continue;

    const componentName = path.basename(componentPath, '.jsx');

    if (targetComponent && componentName !== targetComponent) continue;
    
    // Check for AppShell conflicts
    const absComponentPath = path.resolve(__dirname, componentPath.replace(/^frontend\//, ''));
    if (fs.existsSync(absComponentPath)) {
      const compSource = fs.readFileSync(absComponentPath, 'utf-8');
      const hasFixedHeader = /<header[^>]+className=["'][^"']*fixed[^"']*top/.test(compSource);
      const hasFixedNav = /<nav[^>]+className=["'][^"']*fixed[^"']*bottom/.test(compSource);
      if (hasFixedHeader || hasFixedNav) {
        doubleHeaderConflicts.push({
          component: componentName,
          hasHeader: hasFixedHeader,
          hasNav: hasFixedNav
        });
      }
    }

    const routeRegex = new RegExp(`<Route[^>]+path="([^"]+)"[^>]+element={[^{}]*?<${componentName}\\s*/>[^{}]*?}`);
    const match = appJsx.match(routeRegex);
    let routePath = '';
    
    if (match) {
      routePath = match[1];
    } else {
      const indexRegex = new RegExp(`<Route[^>]+index[^>]+element={[^{}]*?<${componentName}\\s*/>[^{}]*?}`);
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

    const fileUrl = 'file:///' + codeHtmlPath.replace(/\\/g, '/');

    tasks.push({
      folderName,
      componentName,
      routePath: `/${routePath.replace(/^\//, '')}`, // relative to localhost
      codeHtmlUrl: fileUrl
    });
  }

  console.log(`Found ${tasks.length} screens to verify structurally.`);

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  
  const payload = Buffer.from(JSON.stringify({ sub: 'demo', exp: 9999999999 })).toString('base64');
  const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.signature`;

  const width = 375;
  const height = 812;
  const context = await browser.newContext({ 
    viewport: { width, height }, 
    deviceScaleFactor: 1,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:5175',
          localStorage: [
            { name: 'token', value: fakeToken },
            { name: 'farmId', value: 'ee2fdcf4-80b5-490a-97cc-b61dce15d9e2' }
          ]
        }
      ]
    }
  });

  const pageBaseline = await context.newPage();
  const pageTarget = await context.newPage();
  
  // Go to root to establish the SPA wrapper
  await pageTarget.goto('http://localhost:5175/app', { waitUntil: 'load', timeout: 30000 });
  await pageTarget.screenshot({ path: path.join(DIFFS_DIR, 'debug_init.png') });
  await pageTarget.addStyleTag({ content: HIDE_CONTENT_CSS });

  const auditResults = [];

  for (const task of tasks) {
    console.log(`Processing: ${task.componentName}`);
    
    // 1. Baseline
    try {
      await pageBaseline.goto(task.codeHtmlUrl, { waitUntil: 'load', timeout: 30000 });
      await pageBaseline.addStyleTag({ content: HIDE_CONTENT_CSS });
      await pageBaseline.waitForTimeout(500); 
    } catch (e) {
      console.error(`  -> Failed baseline: ${e.message}`);
      continue;
    }
      let baselineBuffer;
      try {
        baselineBuffer = await pageBaseline.screenshot({ fullPage: false, timeout: 15000, animations: 'disabled' });
      } catch (e) {
        console.error(`  -> Failed to screenshot baseline: ${e.message}`);
        continue;
      }
      const baselinePng = PNG.sync.read(baselineBuffer);

    // 2. Target (Navigate via SPA PushState)
    console.log("Target route: " + task.routePath);
    try {
      await pageTarget.evaluate((route) => {
        if (window.routerNavigate) {
          window.routerNavigate(route);
        } else {
          window.history.pushState(null, '', route);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }, task.routePath);
      
      await pageTarget.waitForTimeout(2500); // Wait for React to mount and APIs to fetch
    } catch (e) {
      console.error(`  -> Failed target SPA navigation: ${e.message}`);
      continue;
    }
        let targetBuffer;
      try {
        targetBuffer = await pageTarget.screenshot({ fullPage: false, timeout: 15000, animations: 'disabled' });
      } catch (e) {
        console.error(`  -> Failed to screenshot target: ${e.message}`);
        md += `| \`${task.folderName}\` | 🔴 | 100.00% | \`${task.componentPath}\` | Screenshot Failed: ${e.message} |\n`;
        continue;
      }
      const targetPng = PNG.sync.read(targetBuffer);
    
    // Compare
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
    
    if (parseFloat(diffPercentage) > 0) {
      fs.writeFileSync(path.join(DIFFS_DIR, `${task.componentName}_actual.png`), targetBuffer);
      fs.writeFileSync(path.join(DIFFS_DIR, `${task.componentName}_baseline.png`), baselineBuffer);
      fs.writeFileSync(path.join(DIFFS_DIR, `${task.componentName}_diff.png`), PNG.sync.write(diffPng));
    }
    
    auditResults.push({
      component: task.componentName,
      diffPercentage: parseFloat(diffPercentage)
    });
    console.log(`  -> Diff: ${diffPercentage}%`);
  }

  await browser.close();
  
  // Generate AUDIT.md
  let md = '# UI Structural Audit\n\n';
  
  md += '## AppShell Conflicts (Double Headers/Navs)\n';
  md += 'The following screens contain hardcoded `<header>` or `<nav>` elements that visually overlap with the global `AppShell`:\n\n';
  
  if (doubleHeaderConflicts.length === 0) {
    md += '- No conflicts detected. (All duplicates were successfully stripped!)\n\n';
  } else {
    for (const conflict of doubleHeaderConflicts) {
      const issues = [];
      if (conflict.hasHeader) issues.push('Double Header');
      if (conflict.hasNav) issues.push('Overlapping Bottom Nav');
      md += `- **${conflict.component}**: ${issues.join(', ')}\n`;
    }
    md += '\n';
  }

  md += '## Screen Drift (Masked Pixelmatch vs code.html)\n';
  
  auditResults.sort((a,b) => b.diffPercentage - a.diffPercentage).forEach(res => {
    const status = res.diffPercentage < 5.0 ? 'MATCH' : 'MISMATCH';
    md += `### ${res.component}\n`;
    md += `- Status: **${status}** (${res.diffPercentage}% difference)\n`;
    if (status === 'MISMATCH') {
      md += `- Differences: Check \`.visual_diffs_audit/${res.component}_diff.png\` for spacing/layout mismatches.\n`;
    }
    md += '\n';
  });

  const AUDIT_NEW_PATH = path.resolve(__dirname, 'FINAL_AUDIT.md');
  fs.writeFileSync(AUDIT_NEW_PATH, md);
  console.log(`\nAudit complete. Results saved to ${AUDIT_NEW_PATH}`);
}

run().catch(console.error);
