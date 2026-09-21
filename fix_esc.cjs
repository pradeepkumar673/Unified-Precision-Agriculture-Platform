const fs = require('fs');
let list = fs.readFileSync('ESCALATION_LIST.md', 'utf-8');
const screenMap = fs.readFileSync('SCREEN_MAP.md', 'utf-8');

// Build lookup dictionary from SCREEN_MAP.md
const map = {};
for (const line of screenMap.split('\n')) {
  if (line.includes('.jsx')) {
    const parts = line.split('|').map(p => p.trim());
    const folder = parts[1].replace(/`/g, '');
    const title = parts[2];
    const path = parts[4].replace(/`/g, '');
    const comp = path.split('/').pop().replace('.jsx', '');
    map[comp] = { folder, title, path };
  }
}

// Fix ESCALATION_LIST.md
list = list.replace(/### \d+\. .*?\n\* \*\*File Path:\*\* .*?([A-Za-z0-9_]+)\.jsx\n\* \*\*Source Folder:\*\* (.*?)\n/gs, (match, comp, folder) => {
  const info = map[comp];
  if (info) {
    // Reconstruct the block
    const numMatch = match.match(/### (\d+)\./);
    const num = numMatch ? numMatch[1] : 'X';
    return `### ${num}. ${info.title}\n* **File Path:** ${info.path}\n* **Source Folder:** ${info.folder}\n`;
  }
  return match;
});

fs.writeFileSync('ESCALATION_LIST.md', list);
console.log('Fixed ESCALATION_LIST.md');
