import { ipcMain } from 'electron';
import { db } from '../database';
import { simulateGame } from '../simulateGame';
import { getCurrentSeason } from '../helpers/getCurrentSeason';
import { getDifficultyFactor } from './settingsHandlers';
import { MAX_ACTIVE_ROSTER } from '../constants';
import { settingsRepo, playerRepo, contractRepo, gameRepo } from '../repositories';
import { rollInjuries, processWaivers, processRosterAdjustments } from '../services/SimulationService';

export function registerSimHandlers(): void {

  ipcMain.handle('get-waiver-wire', () =>
    playerRepo.getOnWaivers(settingsRepo.getUserTeamId() ?? -1));

  ipcMain.handle('claim-waiver', (_event: any, playerId: number) => {
    const teamId = settingsRepo.getUserTeamId();
    if (!teamId) return { success: false, reason: 'No franchise selected.' };
    if (playerRepo.getActiveCount(teamId) >= MAX_ACTIVE_ROSTER)
      return { success: false, reason: `Active roster is full (${MAX_ACTIVE_ROSTER}/${MAX_ACTIVE_ROSTER}). Release a player first.` };
    const player = playerRepo.getById(playerId);
    if (!player || player.roster_status !== 'waivers') return { success: false, reason: 'Player no longer on waivers.' };
    if (player.waived_by_team_id === teamId) return { success: false, reason: 'You cannot re-claim a player you just released to waivers.' };
    db.prepare("UPDATE players SET team_id = ?, roster_status = 'active', is_free_agent = 0, waived_by_team_id = NULL WHERE id = ?").run(teamId, playerId);
    const existing = contractRepo.getByPlayer(playerId);
    if (existing) contractRepo.updateTeam(playerId, teamId);
    else contractRepo.create(playerId, teamId, 1, 1.0, 0, 0);
    return { success: true, name: `${player.first_name} ${player.last_name}` };
  });

  ipcMain.handle('simulate-playoffs', (_event: any, season?: number) => {
    const s = season ?? getCurrentSeason();
    db.prepare(`DELETE FROM stats WHERE game_id IN (SELECT id FROM games WHERE season = ? AND is_playoff = 1)`).run(s);
    db.prepare(`DELETE FROM games WHERE season = ? AND is_playoff = 1`).run(s);

    const seedTeams = (conf: string) =>
      (db.prepare(`SELECT id, city, name FROM teams WHERE conference = ?`).all(conf) as any[])
        .map((t: any) => ({ ...t, wins: (db.prepare(`SELECT COUNT(*) as count FROM games WHERE season = ? AND is_simulated = 1 AND is_playoff = 0 AND ((home_team_id = ? AND home_score > away_score) OR (away_team_id = ? AND away_score > home_score))`).get(s, t.id, t.id) as any).count }))
        .sort((a: any, b: any) => b.wins - a.wins).slice(0, 7);

    const insertGame = db.prepare(`INSERT INTO games (season, week, home_team_id, away_team_id, home_score, away_score, home_q1, home_q2, home_q3, home_q4, away_q1, away_q2, away_q3, away_q4, weather, is_playoff, is_simulated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`);
    const simGame = (home: any, away: any, week: number) => {
      const r = simulateGame(home.id, away.id);
      insertGame.run(s, week, home.id, away.id, r.homeScore, r.awayScore, r.homeQuarters[0], r.homeQuarters[1], r.homeQuarters[2], r.homeQuarters[3], r.awayQuarters[0], r.awayQuarters[1], r.awayQuarters[2], r.awayQuarters[3], r.weather ?? 'clear');
      return { home, away, homeScore: r.homeScore, awayScore: r.awayScore, winner: r.homeScore > r.awayScore ? home : away };
    };

    const afcTeams = seedTeams('AFC'), nfcTeams = seedTeams('NFC');
    const afcWC = [simGame(afcTeams[1], afcTeams[6], 18), simGame(afcTeams[2], afcTeams[5], 18), simGame(afcTeams[3], afcTeams[4], 18)];
    const nfcWC = [simGame(nfcTeams[1], nfcTeams[6], 18), simGame(nfcTeams[2], nfcTeams[5], 18), simGame(nfcTeams[3], nfcTeams[4], 18)];
    const afcDiv = [simGame(afcTeams[0], afcWC[2].winner, 19), simGame(afcWC[0].winner, afcWC[1].winner, 19)];
    const nfcDiv = [simGame(nfcTeams[0], nfcWC[2].winner, 19), simGame(nfcWC[0].winner, nfcWC[1].winner, 19)];
    const afcChamp = simGame(afcDiv[0].winner, afcDiv[1].winner, 20);
    const nfcChamp = simGame(nfcDiv[0].winner, nfcDiv[1].winner, 20);
    const superBowl = simGame(afcChamp.winner, nfcChamp.winner, 21);
    db.prepare('INSERT OR REPLACE INTO champions (season, team_id) VALUES (?, ?)').run(s, superBowl.winner.id);
    return { afc: { seeds: afcTeams, wildCard: afcWC, divisional: afcDiv, championship: afcChamp }, nfc: { seeds: nfcTeams, wildCard: nfcWC, divisional: nfcDiv, championship: nfcChamp }, superBowl };
  });

  ipcMain.handle('generate-schedule', () => {
    const season = getCurrentSeason();
    if (gameRepo.countBySeason(season) > 0) return { alreadyExists: true, season };
    const teams = (db.prepare('SELECT id FROM teams').all() as any[]).map((t: any) => t.id);
    const insertGame = db.prepare('INSERT INTO games (season, week, home_team_id, away_team_id, is_simulated) VALUES (?, ?, ?, ?, 0)');
    const shuffledForByes = [...teams].sort(() => Math.random() - 0.5);
    const byeWeekMap: Record<number, number> = {};
    for (let i = 0; i < shuffledForByes.length; i++) byeWeekMap[shuffledForByes[i]] = 5 + Math.floor(i / 4);
    db.transaction(() => {
      for (let week = 1; week <= 18; week++) {
        const playing = teams.filter((id: number) => byeWeekMap[id] !== week).sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.floor(playing.length / 2); i++) insertGame.run(season, week, playing[i * 2], playing[i * 2 + 1]);
      }
    })();
    return { season, created: true, alreadyExists: false };
  });

  ipcMain.handle('get-current-week', () => {
    const season = getCurrentSeason();
    if (gameRepo.countBySeason(season) === 0) return { hasSchedule: false, currentWeek: null };
    return { hasSchedule: true, currentWeek: gameRepo.getCurrentWeek(season) };
  });

  ipcMain.handle('get-week-matchups', (_event: any, week: number) => {
    const season = getCurrentSeason();
    return db.prepare(`SELECT g.id, g.week, g.home_score, g.away_score, g.is_simulated, ht.id as home_team_id, ht.city || ' ' || ht.name AS home_team, at.id as away_team_id, at.city || ' ' || at.name AS away_team FROM games g JOIN teams ht ON g.home_team_id = ht.id JOIN teams at ON g.away_team_id = at.id WHERE g.season = ? AND g.week = ? AND g.is_playoff = 0 ORDER BY g.id`).all(season, week);
  });

  ipcMain.handle('simulate-week', (_event: any, week: number) => {
    const season = getCurrentSeason();
    const games = gameRepo.getPendingByWeek(season, week);
    if (games.length === 0) return { week, season, gamesSimulated: 0 };
    playerRepo.advanceInjuryTimers();

    const insertStat = db.prepare(`INSERT INTO stats (game_id, player_id, team_id, pass_attempts, completions, pass_yards, pass_tds, interceptions, rush_attempts, rush_yards, rush_tds, targets, receptions, rec_yards, rec_tds, tackles, assisted_tackles, sacks, tfl, forced_fumbles, fumble_recoveries, def_interceptions, pass_deflections, def_tds) VALUES (@game_id, @player_id, @team_id, @pass_attempts, @completions, @pass_yards, @pass_tds, @interceptions, @rush_attempts, @rush_yards, @rush_tds, @targets, @receptions, @rec_yards, @rec_tds, @tackles, @assisted_tackles, @sacks, @tfl, @forced_fumbles, @fumble_recoveries, @def_interceptions, @pass_deflections, @def_tds)`);
    const allStats: any[] = [];
    const userTeamId = settingsRepo.getUserTeamId() ?? -1;

    db.transaction(() => {
      for (const game of games) {
        const result = simulateGame(game.home_team_id, game.away_team_id, game.week ?? 1, userTeamId, getDifficultyFactor());
        gameRepo.updateResult(game.id, result.homeScore, result.awayScore, result.homeQuarters, result.awayQuarters, result.weather ?? 'clear');
        for (const stat of [...result.homePlayerStats, ...result.awayPlayerStats]) { insertStat.run({ game_id: game.id, ...stat }); allStats.push(stat); }
      }
    })();

    const newlyInjured = rollInjuries(allStats);
    const rosterResult = processRosterAdjustments(newlyInjured, userTeamId);
    processWaivers(userTeamId, week);
    return { week, season, gamesSimulated: games.length, callups: rosterResult.callups, userPSOpenSpots: rosterResult.userPSOpenSpots };
  });

  ipcMain.handle('simulate-game', (_event: any, gameId: number) => {
    const game = db.prepare(`SELECT * FROM games WHERE id = ?`).get(gameId) as any;
    if (!game) return { success: false, reason: 'Game not found.' };
    if (game.is_simulated) return { success: false, reason: 'Game already simulated.' };

    const insertStat = db.prepare(`INSERT INTO stats (game_id, player_id, team_id, pass_attempts, completions, pass_yards, pass_tds, interceptions, rush_attempts, rush_yards, rush_tds, targets, receptions, rec_yards, rec_tds, tackles, assisted_tackles, sacks, tfl, forced_fumbles, fumble_recoveries, def_interceptions, pass_deflections, def_tds) VALUES (@game_id, @player_id, @team_id, @pass_attempts, @completions, @pass_yards, @pass_tds, @interceptions, @rush_attempts, @rush_yards, @rush_tds, @targets, @receptions, @rec_yards, @rec_tds, @tackles, @assisted_tackles, @sacks, @tfl, @forced_fumbles, @fumble_recoveries, @def_interceptions, @pass_deflections, @def_tds)`);
    let gameResult: any;
    const allStats: any[] = [];
    const userTeamId = settingsRepo.getUserTeamId() ?? -1;

    db.transaction(() => {
      gameResult = simulateGame(game.home_team_id, game.away_team_id, game.week ?? 1, userTeamId, getDifficultyFactor());
      gameRepo.updateResult(game.id, gameResult.homeScore, gameResult.awayScore, gameResult.homeQuarters, gameResult.awayQuarters, gameResult.weather ?? 'clear');
      for (const stat of [...gameResult.homePlayerStats, ...gameResult.awayPlayerStats]) { insertStat.run({ game_id: game.id, ...stat }); allStats.push(stat); }
    })();

    const weekComplete = gameRepo.countPendingInWeek(game.season, game.week) === 0;
    const newlyInjured = rollInjuries(allStats);
    const rosterResult = processRosterAdjustments(newlyInjured, userTeamId);
    if (weekComplete) { playerRepo.advanceInjuryTimers(); processWaivers(userTeamId, game.week); }
    return { success: true, gameId, weekComplete, homeScore: gameResult.homeScore, awayScore: gameResult.awayScore, callups: rosterResult.callups, userPSOpenSpots: rosterResult.userPSOpenSpots };
  });

  ipcMain.handle('get-injury-report', (_event: any, teamId: number) =>
    db.prepare(`SELECT p.id, p.first_name, p.last_name, p.position, p.position_label, p.overall_rating, p.age, p.dev_trait, p.injury_status, p.weeks_out, p.injury_type FROM players p WHERE p.team_id = ? AND p.injury_status != 'healthy' ORDER BY CASE p.injury_status WHEN 'ir' THEN 1 WHEN 'out' THEN 2 ELSE 3 END, p.overall_rating DESC`).all(teamId));

  ipcMain.handle('get-game-box-score', (_event: any, gameId: number) => {
    const game = db.prepare(`SELECT g.id, g.week, g.home_score, g.away_score, g.home_q1, g.home_q2, g.home_q3, g.home_q4, g.away_q1, g.away_q2, g.away_q3, g.away_q4, ht.id as home_team_id, ht.city || ' ' || ht.name AS home_team, at.id as away_team_id, at.city || ' ' || at.name AS away_team FROM games g JOIN teams ht ON g.home_team_id = ht.id JOIN teams at ON g.away_team_id = at.id WHERE g.id = ?`).get(gameId) as any;
    if (!game) return null;
    const players = db.prepare(`SELECT p.first_name || ' ' || p.last_name as player_name, p.position, s.team_id, s.pass_attempts, s.completions, s.pass_yards, s.pass_tds, s.interceptions, s.rush_attempts, s.rush_yards, s.rush_tds, s.targets, s.receptions, s.rec_yards, s.rec_tds, s.tackles, s.assisted_tackles, s.sacks, s.tfl, s.def_interceptions, s.pass_deflections FROM stats s JOIN players p ON s.player_id = p.id WHERE s.game_id = ? AND (s.pass_yards > 0 OR s.rush_yards > 0 OR s.rec_yards > 0 OR s.tackles > 2 OR s.sacks > 0) ORDER BY s.team_id, s.pass_yards DESC, s.rush_yards DESC, s.rec_yards DESC`).all(gameId);
    return { game, players };
  });

  ipcMain.handle('get-playoff-seeds', () => {
    const season = getCurrentSeason();
    const getSeeds = (conference: string) =>
      (db.prepare('SELECT id, city, name FROM teams WHERE conference = ?').all(conference) as any[])
        .map((t: any) => { const { wins, losses } = gameRepo.getTeamRecord(t.id, season); return { ...t, wins, losses, team_name: `${t.city} ${t.name}` }; })
        .sort((a: any, b: any) => b.wins - a.wins).slice(0, 7);
    return { afc: getSeeds('AFC'), nfc: getSeeds('NFC') };
  });
}
