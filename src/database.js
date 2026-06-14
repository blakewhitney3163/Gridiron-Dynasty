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

const playerCols = db.prepare("PRAGMA table_info(players)").all();

// Migrate: add position_label column if it doesn't exist
if (!playerCols.find(c => c.name === 'position_label')) {
  db.prepare('ALTER TABLE players ADD COLUMN position_label TEXT').run();
}

// Migrate: add dev_trait column and assign traits if it doesn't exist
if (!playerCols.find(c => c.name === 'dev_trait')) {
  db.prepare("ALTER TABLE players ADD COLUMN dev_trait TEXT DEFAULT 'Normal'").run();

  const allPlayers = db.prepare('SELECT id, overall_rating FROM players').all();
  const assignTrait = db.prepare("UPDATE players SET dev_trait = ? WHERE id = ?");

  const assignTraits = db.transaction(() => {
    for (const player of allPlayers) {
      const ovr = player.overall_rating;
      const rand = Math.random();
      let trait;
      if (ovr >= 90) {
        trait = rand < 0.40 ? 'X-Factor' : rand < 0.80 ? 'Superstar' : rand < 0.98 ? 'Star' : 'Normal';
      } else if (ovr >= 80) {
        trait = rand < 0.05 ? 'X-Factor' : rand < 0.30 ? 'Superstar' : rand < 0.75 ? 'Star' : 'Normal';
      } else if (ovr >= 70) {
        trait = rand < 0.01 ? 'X-Factor' : rand < 0.09 ? 'Superstar' : rand < 0.44 ? 'Star' : 'Normal';
      } else {
        trait = rand < 0.002 ? 'X-Factor' : rand < 0.022 ? 'Superstar' : rand < 0.202 ? 'Star' : 'Normal';
      }
      assignTrait.run(trait, player.id);
    }
  });
  assignTraits();
  console.log('Dev traits assigned to all players');
}

// Migrate: generate contracts for all rostered players if contracts table is empty
const contractCount = (db.prepare('SELECT COUNT(*) as count FROM contracts').get()).count;
if (contractCount === 0) {
  const players = db.prepare(
    'SELECT id, overall_rating, age, position, dev_trait, team_id FROM players WHERE team_id IS NOT NULL AND is_free_agent = 0'
  ).all();

  const insertContract = db.prepare(`
    INSERT INTO contracts (player_id, team_id, years_total, years_remaining, annual_salary)
    VALUES (?, ?, ?, ?, ?)
  `);

  const salaryRanges = {
  QB:  [0.8, 20],
  WR:  [0.5, 12],
  DL:  [0.5, 10],
  LB:  [0.5,  9],
  CB:  [0.5,  9],
  TE:  [0.5,  8],
  OL:  [0.5,  8],
  S:   [0.5,  7],
  RB:  [0.4,  6],
  K:   [0.3,  3],
};

  const traitPremium = { Normal: 1.0, Star: 1.15, Superstar: 1.3, 'X-Factor': 1.5 };

  const generateContracts = db.transaction(() => {
    for (const player of players) {
      const [minSal, maxSal] = salaryRanges[player.position] ?? [0.5, 10];
      const ovrFactor = Math.max(0, (player.overall_rating - 50)) / 49;
      let salary = minSal + ovrFactor * (maxSal - minSal);
      salary *= (traitPremium[player.dev_trait] ?? 1.0);
      salary = Math.round(salary * 10) / 10;

      const yearsTotal =
        player.age <= 24 ? 5 :
        player.age <= 27 ? 4 :
        player.age <= 30 ? 3 :
        player.age <= 33 ? 2 : 1;

      const yearsRemaining = Math.ceil(Math.random() * yearsTotal);
      insertContract.run(player.id, player.team_id, yearsTotal, yearsRemaining, salary);
    }
  });
  generateContracts();
  console.log(`Contracts generated for ${players.length} players`);
}

const existingSeason = db.prepare("SELECT value FROM settings WHERE key = 'current_season'").get();
if (!existingSeason) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('current_season', '2025')").run();
}

console.log("Database and tables created successfully");
module.exports = db;