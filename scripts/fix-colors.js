const fs = require('fs');

const files = {
  'src/theme.ts': [
    ["bgDeep: '#333'", "bgDeep: '#3c3c3c'"],
    ["borderFaint: '#444'", "borderFaint: '#5a5a5a'"],
    ["borderMid: '#505050'", "borderMid: '#686868'"],
    ["borderStrong: '#5e5e5e'", "borderStrong: '#787878'"],
    ["bgGreen: '#1a3020'", "bgGreen: '#2d4a35'"],
    ["bgBlue: '#1c2a40'", "bgBlue: '#2d4870'"],
    ["bgOrange: '#3a2010'", "bgOrange: '#4a3820'"],
    ["bgGold: '#3a3010'", "bgGold: '#4a4220'"],
    ["bgRed: '#3a1515'", "bgRed: '#4a2222'"],
    ["bgSelected: '#1e3055'", "bgSelected: '#2d4870'"],
  ],
  'src/App.tsx': [
    ["background: '#060606'", 'background: T.bgPage'],
    ["background: '#080808'", 'background: T.bgPage'],
    ["borderBottom: '1px solid #111'", 'borderBottom: `1px solid ${T.borderMid}`'],
  ],
  'src/Teams.tsx': [
    ["background: '#12122a'", 'background: T.bgCard'],
    ["background: '#0f0f23'", 'background: T.bgPanel'],
    ["background: '#0a0a1a'", 'background: T.bgCard'],
    ["? '#4FC3F7' : T.bgBlue,", '? \'#4FC3F7\' : T.bgCard,'],
  ],
  'src/Schedule.tsx': [
    ["background: '#0f0f23'", 'background: T.bgPanel'],
  ],
  'src/Playoffs.tsx': [
    ["background: '#12122a'", 'background: T.bgCard'],
    ["background: '#0f0f23'", 'background: T.bgPanel'],
  ],
  'src/Stats.tsx': [
    ["background: '#0a0a0a'", 'background: T.bgPanel'],
    ["borderBottom: '1px solid #111'", 'borderBottom: `1px solid ${T.borderMid}`'],
  ],
  'src/Home.tsx': [
    ["background: '#110a0a'", 'background: T.bgRed'],
  ],
  'src/Franchise.tsx': [
    ["background: '#0a2a0a'", 'background: T.bgGreen'],
  ],
  'src/Trades.tsx': [
    ["'#1a0505'", 'T.bgRed'],
    ["background: '#0a0a0a'", 'background: T.bgDeep'],
  ],
};

let totalChanges = 0;
for (const [filepath, replacements] of Object.entries(files)) {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = 0;
  for (const [from, to] of replacements) {
    const before = content;
    content = content.split(from).join(to);
    if (content !== before) changed++;
  }
  fs.writeFileSync(filepath, content);
  console.log(`✓ ${filepath} — ${changed}/${replacements.length} replacements made`);
  totalChanges += changed;
}
console.log(`\nDone — ${totalChanges} total changes.`);