const db = require('./database');

function randomNormal(mean, stdDev) {
    // Box-Muller transform — generates a normal distribution
    let u1 = Math.random();
    let u2 = Math.random();
    let z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * stdDev;
}

function getTeamRatings(teamId) {
    const players = db.prepare(`
        SELECT position, overall_rating FROM players WHERE team_id = ?
    `).all(teamId);

    const offense = players.filter(p => ["QB", "RB", "WR", "TE", "OL"].includes(p.position));
    const defense = players.filter(p => ["DL", "LB", "CB", "S"].includes(p.position));

    const offenseRating = offense.reduce((sum, p) => sum + p.overall_rating, 0) / offense.length;
    const defenseRating = defense.reduce((sum, p) => sum + p.overall_rating, 0) / defense.length;

    return { offenseRating, defenseRating };
}

function simulateGame(homeTeamId, awayTeamId) {
    const homeRatings = getTeamRatings(homeTeamId);
    const awayRatings = getTeamRatings(awayTeamId);

    const leagueAvg = 23;
    const homefieldAdvantage = 2.5;

    // Expected scores based on offense vs opponent defense
    let homeExpected = (homeRatings.offenseRating / awayRatings.defenseRating) * leagueAvg + homefieldAdvantage;
    let awayExpected = (awayRatings.offenseRating / homeRatings.defenseRating) * leagueAvg;

    // Add randomness — standard deviation of 7 points
    let homeScore = Math.round(randomNormal(homeExpected, 7));
    let awayScore = Math.round(randomNormal(awayExpected, 7));

    // No negative scores
    homeScore = Math.max(0, homeScore);
    awayScore = Math.max(0, awayScore);

    return { homeScore, awayScore };
}

module.exports = { simulateGame };