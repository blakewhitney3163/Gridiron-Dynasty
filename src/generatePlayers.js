const db = require('./database');

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRating() {
    return randomInt(60, 95);
}

function generateName(position) {
    const firstNames = ["James", "Marcus", "Tyler", "Jordan", "Derek", "Chris", "Mike", "Ryan", "Jake", "Aaron", "Kevin", "Brandon", "Justin", "Travis", "Logan"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris"];
    return {
        first_name: firstNames[randomInt(0, firstNames.length - 1)],
        last_name: lastNames[randomInt(0, lastNames.length - 1)]
    };
}

const positionGroups = [
    { position: "QB", count: 2 },
    { position: "RB", count: 4 },
    { position: "WR", count: 6 },
    { position: "TE", count: 2 },
    { position: "OL", count: 8 },
    { position: "DL", count: 6 },
    { position: "LB", count: 6 },
    { position: "CB", count: 6 },
    { position: "S", count: 4 },
    { position: "K", count: 1 }
];

const insert = db.prepare(`
    INSERT INTO players (first_name, last_name, position, age, overall_rating, speed, strength, awareness, team_id, is_free_agent)
    VALUES (@first_name, @last_name, @position, @age, @overall_rating, @speed, @strength, @awareness, @team_id, 0)
`);

const teams = db.prepare('SELECT id FROM teams').all();

let totalPlayers = 0;

for (let team of teams) {
    for (let group of positionGroups) {
        for (let i = 0; i < group.count; i++) {
            const name = generateName(group.position);
            insert.run({
                first_name: name.first_name,
                last_name: name.last_name,
                position: group.position,
                age: randomInt(21, 35),
                overall_rating: randomRating(),
                speed: randomRating(),
                strength: randomRating(),
                awareness: randomRating(),
                team_id: team.id
            });
            totalPlayers++;
        }
    }
}

console.log(`${totalPlayers} players generated successfully`);