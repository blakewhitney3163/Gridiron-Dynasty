const path = require('path');
const { execSync } = require('child_process');

// Use the app's own database module by running sqlite3 CLI commands
// Instead, let's just use better-sqlite3 from the right location
let Database;
try {
  Database = require(path.join(__dirname, '..', 'node_modules', 'better-sqlite3'));
} catch (e) {
  // Try the .webpack compiled version location
  Database = require(path.join(__dirname, '..', '.webpack', 'main', 'node_modules', 'better-sqlite3'));
}

const dbPath = path.join(__dirname, '..', 'nfl-simulator.db');
const db = new Database(dbPath);

function setTrait(firstName, lastName, trait) {
  const player = db.prepare(
    'SELECT id, first_name, last_name, overall_rating, age FROM players WHERE first_name = ? AND last_name = ?'
  ).get(firstName, lastName);

  if (!player) {
    console.log(`Not found: ${firstName} ${lastName}`);
    return;
  }

  db.prepare('UPDATE players SET dev_trait = ? WHERE id = ?').run(trait, player.id);
  console.log(`Set ${firstName} ${lastName} (${player.overall_rating} OVR, Age ${player.age}) → ${trait}`);
}

setTrait('Drake',    'Maye',       'X-Factor');
setTrait('Caleb',    'Williams',   'X-Factor');
setTrait('Jayden',   'Daniels',    'Superstar');
setTrait('Bo',       'Nix',        'Star');
setTrait('Lamar',    'Jackson',    'X-Factor');
setTrait('Patrick',  'Mahomes',    'X-Factor');
setTrait('Josh',     'Allen',      'X-Factor');
setTrait('Joe',      'Burrow',     'Superstar');
setTrait('Jalen',    'Hurts',      'Superstar');
setTrait('Dak',      'Prescott',   'Star');
setTrait('Justin',   'Jefferson',  'X-Factor');
setTrait('CeeDee',   'Lamb',       'X-Factor');
setTrait('Tyreek',   'Hill',       'X-Factor');
setTrait('Brock',    'Bowers',     'Superstar');
setTrait('Micah',    'Parsons',    'X-Factor');
setTrait('Myles',    'Garrett',    'X-Factor');
setTrait('T.J.',     'Watt',       'X-Factor');

console.log('\nDone.');
db.close();