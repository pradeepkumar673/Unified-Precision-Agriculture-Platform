const fs = require('fs');
const path = require('path');

const AUDIT_MD_PATH = path.resolve(__dirname, 'frontend/AUDIT.md');
const SCREEN_MAP_PATH = path.resolve(__dirname, 'SCREEN_MAP.md');
const ESCALATION_LIST_PATH = path.resolve(__dirname, 'ESCALATION_LIST.md');

const auditText = fs.readFileSync(AUDIT_MD_PATH, 'utf-8');
const screenMapText = fs.readFileSync(SCREEN_MAP_PATH, 'utf-8').split('\n');

const componentToPath = {};
const componentToFolder = {};
const componentToTitle = {};

for (let line of screenMapText) {
  if (!line.startsWith('|') || line.includes('Target Group') || line.includes(':---')) continue;
  
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 6) continue;
  
  const folderName = parts[1].replace(/`/g, '');
  const title = parts[2];
  let componentPath = parts[4].replace(/`/g, '');
  
  const componentName = componentPath.split('/').pop().replace('.jsx', '');
  componentToPath[componentName] = componentPath;
  componentToFolder[componentName] = folderName;
  componentToTitle[componentName] = title;
}

const scores = [];
const regex = /### (.*?)\n- Status: \*\*.*?\*\* \((.*?)% difference\)/g;
let match;
while ((match = regex.exec(auditText)) !== null) {
  const comp = match[1];
  const score = parseFloat(match[2]);
  scores.push({
    component: comp,
    score: score,
    path: componentToPath[comp],
    folder: componentToFolder[comp],
    title: componentToTitle[comp]
  });
}

scores.sort((a, b) => b.score - a.score);

let markdown = `# Visual Regression Escalation List\n\n`;
markdown += `The following screens have been structurally audited and ranked by their mismatch score against the baseline designs. A score over 5% typically indicates layout or structural drift.\n\n`;

scores.forEach((s, i) => {
  const status = s.score < 5.0 ? 'RESOLVED' : 'MISMATCH';
  markdown += `### ${i+1}. ${s.title}\n`;
  markdown += `* **File Path:** \`${s.path}\`\n`;
  markdown += `* **Source Folder:** \`${s.folder}\`\n`;
  markdown += `* **Status:** ${status}\n`;
  markdown += `* **Mismatch Score:** ${s.score.toFixed(2)}%\n\n`;
});

fs.writeFileSync(ESCALATION_LIST_PATH, markdown);
console.log('Successfully regenerated ESCALATION_LIST.md');
