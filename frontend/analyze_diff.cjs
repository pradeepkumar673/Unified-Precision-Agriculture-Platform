const fs = require('fs');
const PNG = require('pngjs').PNG;

async function analyzeDiff() {
  const pixelmatch = (await import('pixelmatch')).default;
  const actualBuffer = fs.readFileSync('.visual_diffs_audit/CropPlanRecommendation_actual.png');
  const baselineBuffer = fs.readFileSync('.visual_diffs_audit/CropPlanRecommendation_baseline.png');
  
  const actual = PNG.sync.read(actualBuffer);
  const baseline = PNG.sync.read(baselineBuffer);
  
  const width = actual.width;
  const height = actual.height;
  
  const diff = new PNG({ width, height });
  
  pixelmatch(actual.data, baseline.data, diff.data, width, height, { threshold: 0.1 });
  
  // Find where the differences are
  let firstY = -1;
  let lastY = -1;
  let diffPixels = 0;
  
  for (let y = 0; y < height; y++) {
    let rowHasDiff = false;
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) * 4;
      // Diff pixels are red in the output of pixelmatch, but wait, pixelmatch just sets diff.data
      if (diff.data[idx] === 255 && diff.data[idx+1] === 0 && diff.data[idx+2] === 0) {
        rowHasDiff = true;
        diffPixels++;
      }
    }
    if (rowHasDiff) {
      if (firstY === -1) firstY = y;
      lastY = y;
    }
  }
  
  console.log(`Diff Pixels: ${diffPixels} out of ${width * height} (${((diffPixels / (width * height)) * 100).toFixed(2)}%)`);
  console.log(`Differences found from Y = ${firstY} to Y = ${lastY}`);
  
  // Profile the top 10 rows with the most diffs
  const rowDiffs = [];
  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) * 4;
      if (diff.data[idx] === 255 && diff.data[idx+1] === 0) count++;
    }
    if (count > 0) rowDiffs.push({ y, count });
  }
  
  rowDiffs.sort((a, b) => b.count - a.count);
  console.log('Rows with most differences:');
  for (let i = 0; i < Math.min(10, rowDiffs.length); i++) {
    console.log(`Y: ${rowDiffs[i].y}, Count: ${rowDiffs[i].count}`);
  }
}

analyzeDiff();
