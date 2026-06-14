const db = require('./database');
const https = require('https');

// Sleeper uses 'LA' for Rams — map to our 'LAR'
const ABBR_MAP = {
  'LA': 'LAR',
  'JAC': 'JAX',
  'GNB': 'GB',
  'KAN': 'KC',
  'LVR': 'LV',
  'NOR': 'NO',
  'NWE': 'NE',
  'SFO': 'SF',
  'TAM': 'TB',
  'WAS': 'WAS',
};

function normalize(abbr) {
  return ABBR_MAP[abbr] || abbr;
}

// Generate a rating based on years of experience and position
function generateRating(yearsExp, position) {
  const base = 60;
  const expBoost = Math.min(yearsExp * 3, 30);
  const variance = Math.floor(Math.random() * 10) - 3;
  return Math.min(99, Math.max(55, base + expBoost + variance));
}

function fetchPlayers() {
  return new Promise((resolve, reject) => {
    https.get('https://api.sleeper.app/v1/players/nfl', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function importPlayers() {
  console.log('Fetching players from Sleeper API...');
  const allPlayers = await fetchPlayers();
  console.log(`Received ${Object.keys(allPlayers).length} total entries`);

  // Build team abbreviation → id map from our database
  const teams = db.prepare('SELECT id, abbreviation FROM teams').all();
  const teamMap = {};
  for (const t of teams) teamMap[t.abbreviation] = t.id;

  // Filter to active skill position players on NFL rosters
  const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K'];
  const active = Object.values(allPlayers).filter(p =>
    p.active &&
    p.position &&
    positions.includes(p.position) &&
    p.team &&
    teamMap[normalize(p.team)]
  );

  console.log(`Found ${active.length} active players on NFL rosters`);

  // Clear existing players and stats (stats reference players)
  db.prepare('DELETE FROM stats').run();
  db.prepare('DELETE FROM contracts').run();
  db.prepare('DELETE FROM players').run();
  console.log('Cleared existing players');

  const insert = db.prepare(`
    INSERT INTO players (first_name, last_name, position, age, overall_rating, speed, strength, awareness, team_id, is_free_agent)
    VALUES (@first_name, @last_name, @position, @age, @overall_rating, @speed, @strength, @awareness, @team_id, 0)
  `);

  const insertMany = db.transaction((players) => {
    for (const p of players) insert.run(p);
  });

  const yearsExpMap = { 'QB':3, 'RB':2, 'WR':2, 'TE':2, 'OL':3, 'DL':3, 'LB':3, 'CB':2, 'S':2, 'K':4 };

  const rows = active.map(p => {
    const yearsExp = p.years_exp ?? yearsExpMap[p.position] ?? 2;
    const ovr = generateRating(yearsExp, p.position);
    return {
      first_name: p.first_name || 'Unknown',
      last_name:  p.last_name  || 'Player',
      position:   p.position,
      age:        p.age || 25,
      overall_rating: ovr,
      speed:      Math.min(99, Math.max(55, ovr + Math.floor(Math.random() * 10) - 5)),
      strength:   Math.min(99, Math.max(55, ovr + Math.floor(Math.random() * 10) - 5)),
      awareness:  Math.min(99, Math.max(55, ovr + Math.floor(Math.random() * 10) - 5)),
      team_id:    teamMap[normalize(p.team)],
    };
  });

  insertMany(rows);
  console.log(`Imported ${rows.length} real NFL players successfully`);

  // Show counts per team
  const counts = db.prepare(`
    SELECT t.city || ' ' || t.name AS team, COUNT(*) AS players
    FROM players p JOIN teams t ON p.team_id = t.id
    GROUP BY t.id ORDER BY t.conference, t.name
  `).all();
  for (const row of counts) {
    console.log(`  ${row.team}: ${row.players} players`);
  }
}

importPlayers().catch(console.error);