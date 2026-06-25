import { ipcMain } from 'electron';
import { db } from '../database';
import { getCurrentSeason } from '../helpers/getCurrentSeason';
import { AdvanceSeasonResult } from '../types';
import { settingsRepo, gameRepo } from '../repositories';
import { advanceSeason, openFreeAgency } from '../services/SeasonService';
import { getLeagueStats, getTeamSeasonStats, getTeamPlayerStats } from '../services/StatsService';
import { logNewsEvent } from '../helpers/logNewsEvent';

export function registerSeasonHandlers(): void {

  ipcMain.handle('get-standings', (_event: any, season?: number) => {
    const s = season ?? getCurrentSeason();
    const records = gameRepo.getAllRecords(s);
    return (db.prepare('SELECT id, city, name, conference, division FROM teams').all() as any[])
      .map((team: any) => {
        const { wins = 0, losses = 0, ties = 0 } = records[team.id] ?? {};
        return { ...team, wins, losses, ties };
      });
  });

  ipcMain.handle('get-teams', () =>
    db.prepare('SELECT * FROM teams ORDER BY conference, division, name').all());

  ipcMain.handle('get-roster', (_event: any, teamId: number) =>
    db.prepare(`
      SELECT id, first_name, last_name, position, position_label, overall_rating, age,
             speed, strength, awareness, dev_trait,
             throw_accuracy, throw_power, catching, route_running,
             tackle_rating, coverage, pass_rush, kickpower, kickaccuracy,
             runblocking, passblocking
      FROM players WHERE team_id = ?
      ORDER BY
        CASE position
          WHEN 'QB' THEN 1 WHEN 'RB' THEN 2 WHEN 'WR' THEN 3 WHEN 'TE' THEN 4
          WHEN 'OL' THEN 5 WHEN 'DL' THEN 6 WHEN 'LB' THEN 7
          WHEN 'CB' THEN 8 WHEN 'S' THEN 9 WHEN 'K' THEN 10 ELSE 11
        END, overall_rating DESC
    `).all(teamId));

  ipcMain.handle('get-player-stats', (_event: any, playerId: number) => {
    const season = getCurrentSeason();
    return db.prepare(`
      SELECT COUNT(DISTINCT s.game_id) as games,
             SUM(s.pass_attempts) as pass_attempts, SUM(s.completions) as completions,
             SUM(s.pass_yards) as pass_yards, SUM(s.pass_tds) as pass_tds,
             SUM(s.interceptions) as interceptions, SUM(s.rush_attempts) as rush_attempts,
             SUM(s.rush_yards) as rush_yards, SUM(s.rush_tds) as rush_tds,
             SUM(s.targets) as targets, SUM(s.receptions) as receptions,
             SUM(s.rec_yards) as rec_yards, SUM(s.rec_tds) as rec_tds,
             SUM(s.tackles) as tackles, SUM(s.assisted_tackles) as assisted_tackles,
             SUM(s.sacks) as sacks, SUM(s.tfl) as tfl,
             SUM(s.def_interceptions) as def_interceptions,
             SUM(s.pass_deflections) as pass_deflections
      FROM stats s
      WHERE s.player_id = ? AND s.season = ?
    `).get(playerId, season);
  });

  ipcMain.handle('get-player-career-stats', (_event: any, playerId: number) => {
    const live = db.prepare(`
      SELECT s.season, COUNT(DISTINCT s.game_id) as games,
             SUM(s.completions) as completions, SUM(s.pass_attempts) as pass_attempts,
             SUM(s.pass_yards) as pass_yards, SUM(s.pass_tds) as pass_tds,
             SUM(s.interceptions) as interceptions, SUM(s.rush_attempts) as rush_attempts,
             SUM(s.rush_yards) as rush_yards, SUM(s.rush_tds) as rush_tds,
             SUM(s.targets) as targets, SUM(s.receptions) as receptions,
             SUM(s.rec_yards) as rec_yards, SUM(s.rec_tds) as rec_tds,
             SUM(s.tackles) as tackles, SUM(s.assisted_tackles) as assisted_tackles,
             SUM(s.sacks) as sacks, SUM(s.tfl) as tfl,
             SUM(s.def_interceptions) as def_interceptions,
             SUM(s.pass_deflections) as pass_deflections
      FROM stats s WHERE s.player_id = ?
      GROUP BY s.season
    `).all(playerId) as any[];
    const history = db.prepare(`
      SELECT season, games, completions, pass_attempts, pass_yards, pass_tds, interceptions,
             rush_attempts, rush_yards, rush_tds, targets, receptions, rec_yards, rec_tds,
             tackles, assisted_tackles, sacks, tfl, def_interceptions, pass_deflections
      FROM career_stats_history WHERE player_id = ?
    `).all(playerId) as any[];
    const liveSeasons = new Set(live.map((r: any) => r.season));
    return [...live, ...history.filter((r: any) => !liveSeasons.has(r.season))]
      .sort((a: any, b: any) => b.season - a.season);
  });

  ipcMain.handle('get-schedule', (_event: any, season?: number) => {
    const s = season ?? getCurrentSeason();
    return db.prepare(`
      SELECT g.id, g.week, g.home_score, g.away_score,
             ht.city || ' ' || ht.name AS home_team,
             at.city || ' ' || at.name AS away_team
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE g.season = ? AND g.is_simulated = 1
      ORDER BY g.week, g.id
    `).all(s);
  });

  ipcMain.handle('get-dashboard', (_event: any, season?: number) => {
    const s = season ?? getCurrentSeason();
    const topAFC = db.prepare(`
      SELECT t.city || ' ' || t.name AS team_name,
             SUM(CASE WHEN (g.home_team_id = t.id AND g.home_score > g.away_score)
                       OR (g.away_team_id = t.id AND g.away_score > g.home_score)
                  THEN 1 ELSE 0 END) AS wins,
             SUM(CASE WHEN (g.home_team_id = t.id AND g.home_score < g.away_score)
                       OR (g.away_team_id = t.id AND g.away_score < g.home_score)
                  THEN 1 ELSE 0 END) AS losses
      FROM teams t
      JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
      WHERE g.season = ? AND g.is_simulated = 1 AND t.conference = 'AFC'
      GROUP BY t.id ORDER BY wins DESC LIMIT 5
    `).all(s);
    const topNFC = db.prepare(`
      SELECT t.city || ' ' || t.name AS team_name,
             SUM(CASE WHEN (g.home_team_id = t.id AND g.home_score > g.away_score)
                       OR (g.away_team_id = t.id AND g.away_score > g.home_score)
                  THEN 1 ELSE 0 END) AS wins,
             SUM(CASE WHEN (g.home_team_id = t.id AND g.home_score < g.away_score)
                       OR (g.away_team_id = t.id AND g.away_score < g.home_score)
                  THEN 1 ELSE 0 END) AS losses
      FROM teams t
      JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id)
      WHERE g.season = ? AND g.is_simulated = 1 AND t.conference = 'NFC'
      GROUP BY t.id ORDER BY wins DESC LIMIT 5
    `).all(s);
    const recentGames = db.prepare(`
      SELECT g.week, g.home_score, g.away_score,
             ht.city || ' ' || ht.name AS home_team,
             at.city || ' ' || at.name AS away_team
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE g.season = ? AND g.is_simulated = 1
      ORDER BY g.week DESC, g.id DESC LIMIT 8
    `).all(s);
    return { topAFC, topNFC, recentGames };
  });

  ipcMain.handle('get-stats', (_event: any, season?: number) => {
    const s = season ?? getCurrentSeason();
    return getLeagueStats(s);
  });

  ipcMain.handle('get-hall-of-fame', () =>
    db.prepare('SELECT * FROM hall_of_fame ORDER BY inducted_season DESC, name ASC').all());

  ipcMain.handle('get-team-season-stats', (_event: any, season?: number) => {
    const s = season ?? getCurrentSeason();
    return getTeamSeasonStats(s);
  });

  ipcMain.handle('get-team-stats', (_event: any, teamId: number, season?: number) => {
    const s = season ?? getCurrentSeason();
    return getTeamPlayerStats(teamId, s);
  });

  ipcMain.handle('get-playoffs', (_event: any, season?: number) => {
    const s = season ?? getCurrentSeason();
    return db.prepare(`
      SELECT g.week, g.home_score, g.away_score,
             ht.city || ' ' || ht.name AS home_team,
             at.city || ' ' || at.name AS away_team
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE g.season = ? AND g.is_playoff = 1
      ORDER BY g.week, g.id
    `).all(s);
  });

  ipcMain.handle('get-announcing-retirements', () => {
  const userTeamId = settingsRepo.getUserTeamId() ?? -1;
  return db.prepare(`
    SELECT p.id, p.first_name, p.last_name, p.position, p.position_label,
           p.age, p.overall_rating, c.annual_salary
    FROM players p
    LEFT JOIN contracts c ON c.player_id = p.id
    WHERE p.team_id = ? AND p.roster_status = 'announcing_retirement'
    ORDER BY p.overall_rating DESC
  `).all(userTeamId);
});

ipcMain.handle('make-retention-offer', (_event: any, playerId: number) => {
  const player = db.prepare(`
    SELECT id, first_name, last_name, position, age, overall_rating
    FROM players WHERE id = ? AND roster_status = 'announcing_retirement'
  `).get(playerId) as any;
  if (!player) return { success: false, reason: 'Player not found.' };

  let acceptChance = 0.50;
  if (player.age <= 33) acceptChance += 0.15;
  else if (player.age <= 35) acceptChance += 0.00;
  else if (player.age <= 37) acceptChance -= 0.15;
  else acceptChance -= 0.30;
  if (player.overall_rating >= 80) acceptChance += 0.10;
  if (player.overall_rating < 70) acceptChance -= 0.15;
  acceptChance = Math.max(0.10, Math.min(0.85, acceptChance));

  const accepted = Math.random() < acceptChance;
  const name = `${player.first_name} ${player.last_name}`;
  const season = getCurrentSeason();

  if (accepted) {
    const contract = db.prepare('SELECT annual_salary FROM contracts WHERE player_id = ?').get(playerId) as any;
    const currentSalary = contract?.annual_salary ?? 2.0;
    const offerSalary = Math.max(1.0, Math.round(currentSalary * 0.75 * 10) / 10);
    db.prepare("UPDATE players SET roster_status = 'active' WHERE id = ?").run(playerId);
    if (contract) {
      db.prepare("UPDATE contracts SET years_remaining = 1, annual_salary = ? WHERE player_id = ?").run(offerSalary, playerId);
    } else {
      db.prepare("INSERT INTO contracts (player_id, team_id, years_remaining, annual_salary) VALUES (?, ?, 1, ?)").run(playerId, settingsRepo.getUserTeamId(), offerSalary);
    }
    logNewsEvent({
      eventType: 'contract', category: 'transactions',
      headline: `${name} Returns for One More Year`,
      detail: `${player.position} · Age ${player.age} · signed a 1-year deal worth $${offerSalary.toFixed(1)}M.`,
      playerId: player.id, season,
    });
    return { accepted: true, name, salary: offerSalary };
  } else {
    db.prepare("UPDATE players SET roster_status = 'retired', team_id = NULL, is_free_agent = 0 WHERE id = ?").run(playerId);
    db.prepare('DELETE FROM contracts WHERE player_id = ?').run(playerId);
    logNewsEvent({
      eventType: 'retirement', category: 'season',
      headline: `${name} Retires`,
      detail: `${player.position} · Age ${player.age} · ${player.overall_rating} OVR — declined to return for another season.`,
      playerId: player.id, season,
    });
    return { accepted: false, name };
  }
});

ipcMain.handle('dismiss-retirement', (_event: any, playerId: number) => {
  const player = db.prepare(`
    SELECT id, first_name, last_name, position, age, overall_rating
    FROM players WHERE id = ? AND roster_status = 'announcing_retirement'
  `).get(playerId) as any;
  if (!player) return { success: false };
  db.prepare("UPDATE players SET roster_status = 'retired', team_id = NULL, is_free_agent = 0 WHERE id = ?").run(playerId);
  db.prepare('DELETE FROM contracts WHERE player_id = ?').run(playerId);
  const season = getCurrentSeason();
  logNewsEvent({
    eventType: 'retirement', category: 'season',
    headline: `${player.first_name} ${player.last_name} Retires`,
    detail: `${player.position} · Age ${player.age} · ${player.overall_rating} OVR — a career comes to an end.`,
    playerId: player.id, season,
  });
  return { success: true };
});

  ipcMain.handle('get-champions', () =>
    db.prepare(`
      SELECT c.season, t.city || ' ' || t.name AS team_name, t.conference
      FROM champions c JOIN teams t ON c.team_id = t.id
      ORDER BY c.season DESC
    `).all());

  ipcMain.handle('get-seasons', () =>
    (db.prepare(`SELECT DISTINCT season FROM games WHERE is_simulated = 1 ORDER BY season DESC`)
      .all() as any[]).map((r: any) => r.season));

  ipcMain.handle('get-current-season', () => getCurrentSeason());

  ipcMain.handle('advance-season', async (): Promise<AdvanceSeasonResult> =>
    advanceSeason() as any);

  ipcMain.handle('open-free-agency', () =>
    openFreeAgency(settingsRepo.getUserTeamId() ?? -1));

    ipcMain.handle('get-owner-goals', (_event: any, season: number) => {
    const { getOwnerGoalsForSeason } = require('../services/OwnerGoalsService');
    return getOwnerGoalsForSeason(season);
  });

  ipcMain.handle('get-team-finances', (_event: any, teamId: number) => {
  let row = db.prepare('SELECT * FROM team_finances WHERE team_id = ?').get(teamId) as any;
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO team_finances (team_id) VALUES (?)').run(teamId);
    row = db.prepare('SELECT * FROM team_finances WHERE team_id = ?').get(teamId);
  }
  return row ?? null;
});

ipcMain.handle('get-all-team-finances', () =>
  db.prepare(`
    SELECT tf.*, t.city, t.name
    FROM team_finances tf
    JOIN teams t ON t.id = tf.team_id
    ORDER BY tf.season_revenue DESC
  `).all()
);

  ipcMain.handle('get-owner-patience', () => {
    const { getOwnerPatience } = require('../services/OwnerGoalsService');
    return getOwnerPatience();
  });

  ipcMain.handle('generate-owner-goals', () => {
    const { generateOwnerGoals } = require('../services/OwnerGoalsService');
    const season = getCurrentSeason();
    const userTeamId = settingsRepo.getUserTeamId() ?? -1;
    if (userTeamId > 0) generateOwnerGoals(season, userTeamId);
    return { success: true };
  });
}
