const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'nfl-simulator.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    conference TEXT NOT NULL,
    division TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT NOT NULL,
    age INTEGER NOT NULL,
    overall_rating INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    strength INTEGER NOT NULL,
    awareness INTEGER NOT NULL,
    team_id INTEGER,
    is_free_agent INTEGER DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    home_score INTEGER,
    away_score INTEGER,
    is_playoff INTEGER DEFAULT 0,
    is_simulated INTEGER DEFAULT 0,
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    pass_attempts INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    pass_yards INTEGER DEFAULT 0,
    pass_tds INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    rush_attempts INTEGER DEFAULT 0,
    rush_yards INTEGER DEFAULT 0,
    rush_tds INTEGER DEFAULT 0,
    targets INTEGER DEFAULT 0,
    receptions INTEGER DEFAULT 0,
    rec_yards INTEGER DEFAULT 0,
    rec_tds INTEGER DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    years_total INTEGER NOT NULL,
    years_remaining INTEGER NOT NULL,
    annual_salary REAL NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS champions (
    season INTEGER PRIMARY KEY,
    team_id INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  );
`);

// ─── Player Column Migrations ─────────────────────────────────────────────────

const playerCols = db.prepare('PRAGMA table_info(players)').all();

if (!playerCols.find(c => c.name === 'position_label')) {
  db.prepare('ALTER TABLE players ADD COLUMN position_label TEXT').run();
}

if (!playerCols.find(c => c.name === 'dev_trait')) {
  db.prepare("ALTER TABLE players ADD COLUMN dev_trait TEXT DEFAULT 'Normal'").run();
  const allPlayers = db.prepare('SELECT id, overall_rating FROM players').all();
  const assignTrait = db.prepare('UPDATE players SET dev_trait = ? WHERE id = ?');
  const assignTraits = db.transaction(() => {
    for (const p of allPlayers) {
      const r = Math.random();
      const ovr = p.overall_rating;
      let trait;
      if (ovr >= 90)      trait = r < 0.40 ? 'X-Factor' : r < 0.80 ? 'Superstar' : r < 0.98 ? 'Star' : 'Normal';
      else if (ovr >= 80) trait = r < 0.05 ? 'X-Factor' : r < 0.30 ? 'Superstar' : r < 0.75 ? 'Star' : 'Normal';
      else if (ovr >= 70) trait = r < 0.01 ? 'X-Factor' : r < 0.09 ? 'Superstar' : r < 0.44 ? 'Star' : 'Normal';
      else                trait = r < 0.002 ? 'X-Factor' : r < 0.022 ? 'Superstar' : r < 0.202 ? 'Star' : 'Normal';
      assignTrait.run(trait, p.id);
    }
  });
  assignTraits();
  console.log('Dev traits assigned');
}

// ─── roster_status Migration ──────────────────────────────────────────────────
// Adds roster_status column and trims every team to exactly 53 active + 16 PS.
// Everyone else becomes a free agent. Runs once.

if (!playerCols.find(c => c.name === 'roster_status')) {
  db.prepare("ALTER TABLE players ADD COLUMN roster_status TEXT DEFAULT 'active'").run();

  // Positional minimums for the 53-man active roster
  const POS_SLOTS = { QB: 3, RB: 4, WR: 6, TE: 3, OL: 9, DL: 7, LB: 5, CB: 5, S: 4, K: 1 };
  const ROSTER_SIZE = 53;
  const PS_SIZE     = 16;

  const teams = db.prepare('SELECT id FROM teams').all();
  const setStatus = db.prepare('UPDATE players SET roster_status = ? WHERE id = ?');
  const cutPlayer = db.prepare("UPDATE players SET team_id = NULL, is_free_agent = 1, roster_status = 'free_agent' WHERE id = ?");

  const trimRosters = db.transaction(() => {
    for (const team of teams) {
      const players = db.prepare(
        "SELECT id, position, overall_rating FROM players WHERE team_id = ? AND is_free_agent = 0 ORDER BY overall_rating DESC"
      ).all(team.id);

      const activeIds = new Set();
      const posUsed   = {};

      // Pass 1 — fill positional minimums (best player at each spot)
      for (const p of players) {
        const max = POS_SLOTS[p.position] ?? 2;
        if ((posUsed[p.position] ?? 0) < max && activeIds.size < ROSTER_SIZE) {
          activeIds.add(p.id);
          posUsed[p.position] = (posUsed[p.position] ?? 0) + 1;
        }
      }

      // Pass 2 — fill remaining active spots by OVR regardless of position
      for (const p of players) {
        if (!activeIds.has(p.id) && activeIds.size < ROSTER_SIZE) {
          activeIds.add(p.id);
        }
      }

      // Pass 3 — next PS_SIZE players go to practice squad (still on team)
      const psIds = new Set();
      for (const p of players) {
        if (!activeIds.has(p.id) && psIds.size < PS_SIZE) {
          psIds.add(p.id);
        }
      }

      // Apply statuses
      for (const p of players) {
        if (activeIds.has(p.id)) {
          setStatus.run('active', p.id);
        } else if (psIds.has(p.id)) {
          setStatus.run('practice_squad', p.id);
        } else {
          cutPlayer.run(p.id);
        }
      }
    }
  });
  trimRosters();
  console.log('Rosters trimmed to 53 active + 16 PS per team');
}

// ─── Contract Column Migrations ───────────────────────────────────────────────

const contractCols = db.prepare('PRAGMA table_info(contracts)').all();

if (!contractCols.find(c => c.name === 'guaranteed_amount')) {
  db.prepare('ALTER TABLE contracts ADD COLUMN guaranteed_amount REAL DEFAULT 0').run();
}
if (!contractCols.find(c => c.name === 'guaranteed_pct')) {
  db.prepare('ALTER TABLE contracts ADD COLUMN guaranteed_pct REAL DEFAULT 0').run();
}

// ─── Contract Generation ──────────────────────────────────────────────────────
// Fires only when contracts table is empty (fresh start or after reset-dynasty).

const contractCount = (db.prepare('SELECT COUNT(*) as count FROM contracts').get()).count;

if (contractCount === 0) {
  // Active roster: full contracts based on OVR / age / dev trait
  const activePlayers = db.prepare(
    "SELECT id, overall_rating, age, position, dev_trait, team_id FROM players WHERE team_id IS NOT NULL AND roster_status = 'active'"
  ).all();

  // Practice squad: league minimum ($1.165M), 1-year deal, minimal guarantee
  const psPlayers = db.prepare(
    "SELECT id, team_id FROM players WHERE team_id IS NOT NULL AND roster_status = 'practice_squad'"
  ).all();

  const insertContract = db.prepare(`
    INSERT INTO contracts (player_id, team_id, years_total, years_remaining, annual_salary, guaranteed_amount, guaranteed_pct)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Salary ceilings ($/yr in millions). X-Factor 1.5× multiplier pushes elite players to real-world tops.
  const SAL = { QB: [0.9,42], WR: [0.9,28], DL: [0.9,32], LB: [0.9,18], CB: [0.9,22], TE: [0.9,16], OL: [0.9,22], S: [0.9,18], RB: [0.9,16], K: [0.9,4] };
  const TRAIT_MUL = { Normal: 1.0, Star: 1.15, Superstar: 1.3, 'X-Factor': 1.5 };
  const TRAIT_GTD = { Normal: [10,35], Star: [25,50], Superstar: [40,65], 'X-Factor': [55,85] };

  const gen = db.transaction(() => {
    // Active roster contracts
    for (const p of activePlayers) {
      const [minS, maxS] = SAL[p.position] ?? [0.9, 15];
      // Quadratic OVR curve: only elite OVRs earn elite money
      const ovrF = Math.pow(Math.max(0, (p.overall_rating - 50)) / 49, 2);
      let salary = minS + ovrF * (maxS - minS);
      salary *= (TRAIT_MUL[p.dev_trait] ?? 1.0);
      salary = Math.round(salary * 10) / 10;

      const yearsTotal =
        p.age <= 24 ? (Math.random() < 0.5 ? 5 : 4) :
        p.age <= 27 ? (Math.random() < 0.4 ? 5 : Math.random() < 0.6 ? 4 : 3) :
        p.age <= 30 ? (Math.random() < 0.4 ? 4 : Math.random() < 0.6 ? 3 : 2) :
        p.age <= 33 ? (Math.random() < 0.4 ? 3 : Math.random() < 0.5 ? 2 : 1) :
        (Math.random() < 0.3 ? 2 : 1);

      // Uniform spread so not everyone expires simultaneously
      const yearsRemaining = Math.floor(Math.random() * yearsTotal) + 1;

      const [gMin, gMax] = TRAIT_GTD[p.dev_trait] ?? [10, 35];
      const guaranteedPct = Math.round(gMin + Math.random() * (gMax - gMin));
      const guaranteedAmount = Math.round(salary * yearsTotal * (guaranteedPct / 100) * 10) / 10;

      insertContract.run(p.id, p.team_id, yearsTotal, yearsRemaining, salary, guaranteedAmount, guaranteedPct);
    }

    // Practice squad: league minimum, 1-year deal, no guarantee
    for (const p of psPlayers) {
      insertContract.run(p.id, p.team_id, 1, 1, 1.165, 0, 0);
    }
  });
  gen();
  console.log(`Contracts: ${activePlayers.length} active + ${psPlayers.length} PS`);
}

// ─── Settings Defaults ────────────────────────────────────────────────────────

if (!db.prepare("SELECT value FROM settings WHERE key = 'current_season'").get()) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('current_season', '2025')").run();
}

console.log('Database ready');
module.exports = db;