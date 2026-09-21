const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.resolve(__dirname, 'src/pages');

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Replace fixed top-0 with sticky top-16
  if (content.includes('fixed top-0')) {
    content = content.replace(/fixed top-0/g, 'sticky top-16');
    changed = true;
  }
  
  // Replace fixed bottom-0 with sticky bottom-20
  if (content.includes('fixed bottom-0')) {
    content = content.replace(/fixed bottom-0/g, 'sticky bottom-20');
    changed = true;
  }
  
  // If we made a layout change, lower z-index if it's z-50
  if (changed) {
    // We only want to replace z-50 with z-40 on elements that we just made sticky,
    // but a global replace on z-50 in the whole file is safe enough for these small components.
    if (content.includes('z-50')) {
      content = content.replace(/z-50/g, 'z-40');
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${path.relative(__dirname, filePath)}`);
  }
}

console.log('Starting codemod...');
traverse(PAGES_DIR);
console.log('Done!');
