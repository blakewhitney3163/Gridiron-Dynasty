const { simulateGame } = require('./simulateGame');
const { getPlayoffSeeds } = require('./getStandings');

function simulateSingleGame(team1, team2) {
    const result = simulateGame(team1.id, team2.id);
    const winner = result.homeScore > result.awayScore ? team1 : team2;
    console.log(`  ${team1.city} ${team1.name} ${result.homeScore} - ${result.awayScore} ${team2.city} ${team2.name} → ${winner.city} ${winner.name} advance`);
    return winner;
}

function simulatePlayoffs(season = 2024) {
    const seeds = getPlayoffSeeds(season);

    for (let conf of ["AFC", "NFC"]) {
        console.log(`\n=== ${conf} PLAYOFFS ===`);
        const s = seeds[conf];

        // Wild Card round: 2v7, 3v6, 4v5 (1 gets bye)
        console.log("\n--- Wild Card ---");
        const wc1 = simulateSingleGame(s[1], s[6]);
        const wc2 = simulateSingleGame(s[2], s[5]);
        const wc3 = simulateSingleGame(s[3], s[4]);

        // Divisional round: 1 vs lowest seed, others play
        console.log("\n--- Divisional ---");
        const div1 = simulateSingleGame(s[0], wc3);
        const div2 = simulateSingleGame(wc1, wc2);

        // Conference Championship
        console.log("\n--- Conference Championship ---");
        const champion = simulateSingleGame(div1, div2);
        console.log(`\n  ${conf} CHAMPION: ${champion.city} ${champion.name}`);

        seeds[conf].champion = champion;
    }

    // Super Bowl
    console.log("\n=== SUPER BOWL ===");
    const superBowlWinner = simulateSingleGame(
        seeds["AFC"].champion,
        seeds["NFC"].champion
    );
    console.log(`\n🏆 SUPER BOWL CHAMPION: ${superBowlWinner.city} ${superBowlWinner.name}`);
}

simulatePlayoffs(2024);