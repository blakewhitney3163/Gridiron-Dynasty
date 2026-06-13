const db = require('./database');

function getStandings(season = 2024) {
    const teams = db.prepare('SELECT id, city, name, conference, division FROM teams').all();

    const standings = teams.map(team => {
        const wins = db.prepare(`
            SELECT COUNT(*) as count FROM games
            WHERE season = ? AND is_simulated = 1
            AND ((home_team_id = ? AND home_score > away_score)
            OR (away_team_id = ? AND away_score > home_score))
        `).get(season, team.id, team.id).count;

        const losses = db.prepare(`
            SELECT COUNT(*) as count FROM games
            WHERE season = ? AND is_simulated = 1
            AND ((home_team_id = ? AND home_score < away_score)
            OR (away_team_id = ? AND away_score < home_score))
        `).get(season, team.id, team.id).count;

        const totalGames = wins + losses;
        const pct = totalGames > 0 ? (wins / totalGames).toFixed(3) : '.000';

        return { ...team, wins, losses, pct };
    });

    return standings;
}

function getPlayoffSeeds(season = 2024) {
    const standings = getStandings(season);
    const conferences = ["AFC", "NFC"];
    const seeds = {};

    for (let conf of conferences) {
        const confTeams = standings
            .filter(t => t.conference === conf)
            .sort((a, b) => b.wins - a.wins);

        // Top 7 teams make playoffs (4 division winners + 3 wild cards)
        // Simplified: just take top 7 by wins for now
        seeds[conf] = confTeams.slice(0, 7);
    }

    return seeds;
}

module.exports = { getStandings, getPlayoffSeeds };

// Print if run directly
const { getStandings: standings, getPlayoffSeeds: seeds } = require('./getStandings');
const playoffTeams = getPlayoffSeeds(2024);

console.log("\n=== 2024 NFL PLAYOFF SEEDS ===");
for (let conf of ["AFC", "NFC"]) {
    console.log(`\n${conf}`);
    playoffTeams[conf].forEach((team, i) => {
        console.log(`  ${i + 1}. ${team.city} ${team.name} (${team.wins}-${team.losses})`);
    });
}