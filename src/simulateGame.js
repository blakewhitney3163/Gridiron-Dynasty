const { db } = require('./database');

function randomNormal(mean, stdDev) {
  let u1 = Math.random();
  let u2 = Math.random();
  let z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

// Returns depth-chart ordered healthy players for a position group (skips out/IR)
function getHealthyByGroup(teamId, positionGroup, limit) {
  const rows = db.prepare(`
    SELECT p.id, p.overall_rating
    FROM depth_chart dc
    JOIN players p ON dc.player_id = p.id
    WHERE dc.team_id = ? AND dc.position_group = ? AND p.roster_status = 'active'
      AND p.injury_status NOT IN ('out', 'ir')
    ORDER BY dc.slot LIMIT ?
  `).all(teamId, positionGroup, limit);
  if (rows.length > 0) return rows;
  // Fallback: OVR order (no depth chart yet)
  return db.prepare(`
    SELECT id, overall_rating FROM players
    WHERE team_id = ? AND position = ? AND roster_status = 'active'
      AND injury_status NOT IN ('out', 'ir')
    ORDER BY overall_rating DESC LIMIT ?
  `).all(teamId, positionGroup, limit);
}

function getTeamRatings(teamId) {
  // Only healthy/questionable players contribute to team rating
  const players = db.prepare(`
    SELECT position, overall_rating FROM players
    WHERE team_id = ? AND injury_status NOT IN ('out', 'ir')
  `).all(teamId);
  const offense = players.filter(p => ['QB', 'RB', 'WR', 'TE', 'OL'].includes(p.position));
  const defense = players.filter(p => ['DL', 'LB', 'CB', 'S'].includes(p.position));
  const offenseRating = offense.reduce((sum, p) => sum + p.overall_rating, 0) / (offense.length || 1);
  const defenseRating = defense.reduce((sum, p) => sum + p.overall_rating, 0) / (defense.length || 1);
  return { offenseRating, defenseRating };
}

function generatePlayerStats(teamId, score, offenseRating) {
  const stats = [];
  const teamRatingFactor = offenseRating / 75;

  const qbs  = getHealthyByGroup(teamId, 'QB', 1);
  const rbs  = getHealthyByGroup(teamId, 'RB', 2);
  const wrs  = getHealthyByGroup(teamId, 'WR', 4);
  const tes  = getHealthyByGroup(teamId, 'TE', 2);

  const qb = qbs[0] ?? null;

  const totalTDs = Math.max(0, Math.round(score / 7));
  const passTDs  = clamp(Math.round(totalTDs * 0.6), 0, totalTDs);
  const rushTDs  = totalTDs - passTDs;

  // QB
  let passYardsGenerated = 260 * teamRatingFactor;
  if (qb) {
    const qbRatingFactor  = qb.overall_rating / 75;
    const combinedFactor  = (teamRatingFactor + qbRatingFactor) / 2;
    passYardsGenerated    = clamp(randomNormal(260 * combinedFactor, 50), 60, 450);
    const passAttempts    = clamp(randomNormal(34, 5), 20, 50);
    const compPct         = Math.min(0.75, Math.max(0.42, 0.42 + (qb.overall_rating - 50) * 0.0033 + randomNormal(0, 0.04)));
    const completions     = clamp(passAttempts * compPct, 10, passAttempts);
    const intMean         = Math.max(0.3, 2.5 - (qb.overall_rating - 50) * 0.04);
    const ints            = clamp(randomNormal(intMean, 0.9), 0, 5);
    const qbCarries       = Math.random() > 0.6 ? clamp(randomNormal(4, 2), 0, 8) : 0;

    stats.push({
      player_id: qb.id, team_id: teamId,
      pass_attempts: passAttempts, completions, pass_yards: passYardsGenerated,
      pass_tds: passTDs, interceptions: ints,
      rush_attempts: qbCarries, rush_yards: clamp(randomNormal(qbCarries * 5, 8), 0, 50), rush_tds: 0,
      targets: 0, receptions: 0, rec_yards: 0, rec_tds: 0,
    });
  }

  // RBs
  const totalRushAttempts = clamp(randomNormal(22, 4), 12, 35);
  const rbRatingWeights   = rbs.map(rb => rb.overall_rating / 75);
  const rbWeightTotal     = rbRatingWeights.reduce((a, b) => a + b, 0) || 1;

  rbs.forEach((rb, i) => {
    const baseShare  = rbRatingWeights[i] / rbWeightTotal;
    const share      = clamp(randomNormal(baseShare * 100, 8), 20, 80) / 100;
    const carries    = clamp(totalRushAttempts * share, i === 0 ? 6 : 0, 28);
    const ypc        = Math.max(2.5, randomNormal(3.5 + (rb.overall_rating - 70) * 0.04, 0.8));
    const rushYards  = clamp(carries * ypc, 0, 200);
    const rbRushTDs  = i === 0 && rushTDs > 0 ? rushTDs : 0;

    stats.push({
      player_id: rb.id, team_id: teamId,
      pass_attempts: 0, completions: 0, pass_yards: 0, pass_tds: 0, interceptions: 0,
      rush_attempts: carries, rush_yards: rushYards, rush_tds: rbRushTDs,
      targets: clamp(randomNormal(4 - i * 1.5, 2), 0, 8),
      receptions: clamp(randomNormal(3 - i, 1), 0, 6),
      rec_yards: clamp(randomNormal(28 - i * 8, 12), 0, 65),
      rec_tds: 0,
    });
  });

  // WRs + TEs
  const receivers       = [...wrs, ...tes];
  const recRatingWeights = receivers.map(r => r.overall_rating / 75);
  const recWeightTotal  = recRatingWeights.reduce((a, b) => a + b, 0) || 1;
  let remainingRecTDs   = passTDs;

  receivers.forEach((rec, i) => {
    const baseShare  = recRatingWeights[i] / recWeightTotal;
    const recYards   = clamp(randomNormal(passYardsGenerated * baseShare, 18), 0, 180);
    const ratingFactor = rec.overall_rating / 75;
    const targets    = clamp(randomNormal((9 * ratingFactor) - i * 0.8, 2), 1, 14);
    const catchRate  = Math.min(0.82, Math.max(0.48, 0.55 + (rec.overall_rating - 70) * 0.004));
    const recs       = clamp(targets * randomNormal(catchRate, 0.06), 0, targets);
    const tdThreshold = 0.6 - (rec.overall_rating - 70) * 0.005;
    const recTDs     = remainingRecTDs > 0 && Math.random() > tdThreshold ? 1 : 0;
    if (recTDs) remainingRecTDs--;

    stats.push({
      player_id: rec.id, team_id: teamId,
      pass_attempts: 0, completions: 0, pass_yards: 0, pass_tds: 0, interceptions: 0,
      rush_attempts: 0, rush_yards: 0, rush_tds: 0,
      targets, receptions: recs, rec_yards: recYards, rec_tds: recTDs,
    });
  });

  return stats;
}

function simulateGame(homeTeamId, awayTeamId) {
  const homeRatings = getTeamRatings(homeTeamId);
  const awayRatings = getTeamRatings(awayTeamId);

  const leagueAvg         = 23;
  const homefieldAdvantage = 2.5;

  let homeScore = Math.round(randomNormal(
    (homeRatings.offenseRating / awayRatings.defenseRating) * leagueAvg + homefieldAdvantage, 7
  ));
  let awayScore = Math.round(randomNormal(
    (awayRatings.offenseRating / homeRatings.defenseRating) * leagueAvg, 7
  ));

  homeScore = Math.max(0, homeScore);
  awayScore = Math.max(0, awayScore);

  const homePlayerStats = generatePlayerStats(homeTeamId, homeScore, homeRatings.offenseRating);
  const awayPlayerStats = generatePlayerStats(awayTeamId, awayScore, awayRatings.offenseRating);

  return { homeScore, awayScore, homePlayerStats, awayPlayerStats };
}

module.exports = { simulateGame };