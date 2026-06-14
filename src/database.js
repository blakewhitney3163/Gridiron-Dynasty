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
    annual_salary INTEGER NOT NULL,
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
        // 40% X-Factor, 40% Superstar, 18% Star, 2% Normal
        trait = rand < 0.40 ? 'X-Factor'
              : rand < 0.80 ? 'Superstar'
              : rand < 0.98 ? 'Star'
              : 'Normal';
      } else if (ovr >= 80) {
        // 5% X-Factor, 25% Superstar, 45% Star, 25% Normal
        trait = rand < 0.05 ? 'X-Factor'
              : rand < 0.30 ? 'Superstar'
              : rand < 0.75 ? 'Star'
              : 'Normal';
      } else if (ovr >= 70) {
        // 1% X-Factor, 8% Superstar, 35% Star, 56% Normal
        trait = rand < 0.01 ? 'X-Factor'
              : rand < 0.09 ? 'Superstar'
              : rand < 0.44 ? 'Star'
              : 'Normal';
      } else {
        // 0% X-Factor, 2% Superstar, 18% Star, 80% Normal
        trait = rand < 0.002 ? 'X-Factor'
              : rand < 0.022 ? 'Superstar'
              : rand < 0.202 ? 'Star'
              : 'Normal';
      }

      assignTrait.run(trait, player.id);
    }
  });
  assignTraits();
  console.log('Dev traits assigned to all players');
}

const existingSeason = db.prepare("SELECT value FROM settings WHERE key = 'current_season'").get();
if (!existingSeason) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('current_season', '2025')").run();
}

console.log("Database and tables created successfully");

module.exports = db;