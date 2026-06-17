const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_OFF = path.join(__dirname, '../src/data/player-career-stats.csv');
const OUTPUT_DEF = path.join(__dirname, '../src/data/player-career-stats-def.csv');
const URL_OFF = 'https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats_season.csv';
const URL_DEF = 'https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats_def.csv';
const MIN_SEASON = 2013;
const SKILL = new Set(['QB', 'RB', 'WR', 'TE']);
const DEF_POS = new Set(['DE', 'DT', 'LB', 'MLB', 'OLB', 'ILB', 'CB', 'S', 'FS', 'SS', 'DB', 'DL']);

function get(url, hops = 0) {
  return new Promise((resolve, reject) => {
    if (hops > 6) return reject(new Error('Too many redirects'));
    https.get(url, { headers: { 'User-Agent': 'nfl-sim/1.0' } }, res => {
      if ([301,302,307,308].includes(res.statusCode))
        return resolve(get(res.headers.location, hops + 1));
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseLine(line) {
  const vals = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === ',' && !inQ) {
      vals.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  vals.push(cur.trim());
  return vals;
}

async function fetchOffense() {
  console.log('Downloading player_stats_season.csv (offense)...');
  const raw = await get(URL_OFF);
  console.log(`Downloaded ${(raw.length / 1024 / 1024).toFixed(1)} MB`);

  const lines = raw.split('\n').filter(l => l.trim());
  const headers = parseLine(lines[0]);

  const KEEP = [
    'player_display_name','position','season','games',
    'completions','attempts','passing_yards','passing_tds','interceptions',
    'carries','rushing_yards','rushing_tds',
    'receptions','targets','receiving_yards','receiving_tds',
  ];

  const out = [KEEP.join(',')];
  let kept = 0;

  for (const line of lines.slice(1)) {
    const vals = parseLine(line);
    const r = {};
    headers.forEach((h, i) => { r[h] = vals[i] ?? ''; });

    if (r.season_type !== 'REG') continue;
    if (parseInt(r.season) < MIN_SEASON) continue;
    if (!r.player_display_name) continue;
    if (!SKILL.has(r.position_group || r.position)) continue;
    if (!parseInt(r.games)) continue;

    out.push(KEEP.map(col => {
      const v = r[col] ?? '';
      return v.includes(',') ? `"${v}"` : v;
    }).join(','));
    kept++;
  }

  fs.writeFileSync(OUTPUT_OFF, out.join('\n'));
  console.log(`Offense: ${kept} rows → ${OUTPUT_OFF}`);
}

async function fetchDefense() {
  console.log('Downloading player_stats_def.csv (defense)...');
  const raw = await get(URL_DEF);
  console.log(`Downloaded ${(raw.length / 1024 / 1024).toFixed(1)} MB`);

  const lines = raw.split('\n').filter(l => l.trim());
  const headers = parseLine(lines[0]);
  console.log(`Defense columns: ${headers.slice(0, 15).join(', ')}`);

  // Per-week rows — aggregate to per-season totals
  const agg = {};

  for (const line of lines.slice(1)) {
    const vals = parseLine(line);
    const r = {};
    headers.forEach((h, i) => { r[h] = vals[i] ?? ''; });

    if (r.season_type !== 'REG') continue;
    const season = parseInt(r.season);
    if (!season || season < MIN_SEASON) continue;
    const name = (r.player_display_name ?? '').trim();
    if (!name) continue;
    const pos = (r.position_group || r.position || '').toUpperCase();
    if (!DEF_POS.has(pos)) continue;

    const key = `${name}|${season}`;
    if (!agg[key]) {
      agg[key] = {
        player_display_name: name, position: pos, season,
        games: 0, tackles: 0, assisted_tackles: 0,
        sacks: 0, tfl: 0, forced_fumbles: 0,
        def_interceptions: 0, pass_deflections: 0, def_tds: 0,
      };
    }
    const a = agg[key];
    a.games             += 1; // one row = one game week
    a.tackles           += parseFloat(r.def_tackles       ?? '0') || 0;
    a.assisted_tackles  += parseFloat(r.def_tackle_assists ?? r.def_tackles_with_assist ?? '0') || 0;
    a.sacks             += parseFloat(r.def_sacks         ?? '0') || 0;
    a.tfl               += parseFloat(r.def_tackles_for_loss ?? '0') || 0;
    a.forced_fumbles    += parseFloat(r.def_fumbles_forced ?? '0') || 0;
    a.def_interceptions += parseFloat(r.def_interceptions ?? '0') || 0;
    a.pass_deflections  += parseFloat(r.def_pass_defended ?? '0') || 0;
    a.def_tds           += parseFloat(r.def_tds           ?? '0') || 0;
  }

  const KEEP = ['player_display_name','position','season','games','tackles','assisted_tackles','sacks','tfl','forced_fumbles','def_interceptions','pass_deflections','def_tds'];
  const rows = Object.values(agg);
  const out = [KEEP.join(','), ...rows.map(row => KEEP.map(col => String(row[col] ?? 0)).join(','))];

  fs.writeFileSync(OUTPUT_DEF, out.join('\n'));
  console.log(`Defense: ${rows.length} player-seasons → ${OUTPUT_DEF}`);
}

async function main() {
  await fetchOffense();
  await fetchDefense();
}

main().catch(e => { console.error(e.message); process.exit(1); });
