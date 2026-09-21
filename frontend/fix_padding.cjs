const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.resolve(__dirname, 'src', 'pages');

const EXCLUDED_FILES = [
  'FieldMapping.jsx',
  'LeafDiseaseScanner.jsx',
  'VoiceAssistantPage.jsx',
  'MultimodalQuery.jsx',
  'SplashWelcomeScreen.jsx',
  'PhoneNumberLogin.jsx',
  'RoleSelection.jsx',
  'FarmSetupWizardStep1Of3.jsx'
];

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
      if (EXCLUDED_FILES.includes(entry.name)) {
        console.log(`Skipping full-bleed/auth screen: ${entry.name}`);
        continue;
      }
      fixPadding(fullPath, entry.name);
    }
  }
}

function fixPadding(filePath, fileName) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to match padding classes to remove
  // We want to remove: pt-*, pb-*, py-*, pt-safe, pb-safe, etc.
  // Including arbitrary values like pt-[80px]
  const paddingRegex = /\b(p[tb|y]-\d+|p[tb|y]-\[[^\]]+\]|pt-safe|pb-safe)\b/g;

  // We only want to remove padding from the top-most container.
  // Usually this is the first `<main ...>` or `<div ...>` inside the `return (` block.
  
  const returnMatch = content.match(/return\s*\(\s*<([a-zA-Z]+)([^>]+)>/);
  if (returnMatch) {
    const fullMatch = returnMatch[0];
    const tagName = returnMatch[1];
    let attributes = returnMatch[2];
    
    // Check if it has className
    if (attributes.includes('className=')) {
      const classMatch = attributes.match(/className=["']([^"']+)["']/);
      if (classMatch) {
        const oldClassStr = classMatch[1];
        const newClassStr = oldClassStr.replace(paddingRegex, '').replace(/\s+/g, ' ').trim();
        
        if (oldClassStr !== newClassStr) {
          const newAttributes = attributes.replace(classMatch[0], `className="${newClassStr}"`);
          const newFullMatch = fullMatch.replace(attributes, newAttributes);
          content = content.replace(fullMatch, newFullMatch);
          fs.writeFileSync(filePath, content);
          console.log(`Fixed double padding in: ${fileName}`);
        }
      }
    }
  }
}

processDirectory(PAGES_DIR);
console.log('Padding removal complete.');
