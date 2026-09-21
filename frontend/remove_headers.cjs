const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.resolve(__dirname, 'src', 'pages');

// Screens that are full-bleed or auth (NOT in AppShell)
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
      stripHeadersAndNavs(fullPath, entry.name);
    }
  }
}

function stripHeadersAndNavs(filePath, fileName) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Regex to remove the entire <header> element (including nested elements)
  const headerRegex = /{\/\*[^]*?Fixed header[^]*?\*\/}\s*<header[\s\S]*?<\/header>/g;
  const headerRegexFallback = /<header[\s\S]*?<\/header>/g;
  
  if (headerRegex.test(content)) {
    content = content.replace(headerRegex, '');
    modified = true;
  } else if (headerRegexFallback.test(content)) {
    content = content.replace(headerRegexFallback, '');
    modified = true;
  }

  // Regex to remove the entire <nav> element
  const navRegex = /{\/\*[^]*?Bottom nav[^]*?\*\/}\s*<nav[\s\S]*?<\/nav>/gi;
  const navRegexFallback = /<nav[\s\S]*?<\/nav>/g;

  if (navRegex.test(content)) {
    content = content.replace(navRegex, '');
    modified = true;
  } else if (navRegexFallback.test(content)) {
    content = content.replace(navRegexFallback, '');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Stripped header/nav from: ${fileName}`);
  }
}

processDirectory(PAGES_DIR);
console.log('Header/nav stripping complete.');
