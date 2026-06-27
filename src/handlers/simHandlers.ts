import type { IpcEvent } from '../types/ipc';
import type { InjuredPlayer } from '../types';
import type { GamePlayerStat } from '../sim/types';
import { ipcMain } from 'electron';
import { db, getDbPath } from '../database';
import { simulateGame, GamePlanOptions } from '../simulateGame';
import { getCurrentSeason } from '../helpers/getCurrentSeason';
import { getDifficultyFactor } from './settingsHandlers';
import { MAX_ACTIVE_ROSTER } from '../constants';
import { settingsRepo, playerRepo, contractRepo, gameRepo, draftRepo, scoutRepo } from '../repositories';
import { rollInjuries, processWaivers, processRosterAdjustments } from '../services/SimulationService';
import { progressPlayers } from '../services/ProgressionService';
import { logNewsEvent } from '../helpers/logNewsEvent';
import { runCpuTrades } from '../services/TradeService';
import { checkMilestones } from '../helpers/checkMilestones';
import { Worker } from 'worker_threads';
import { generateOwnerGoals } from '../services/OwnerGoalsService';
import { recordInjuryHistory } from '../services/InjuryService';
import { processGameResult } from '../services/ChemistryService';
import path from 'path';

interface GameSummary {
  week: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  stats: GamePlayerStat[];
}

function getTeamName(teamId: number): string {
  const t = db.prepare('SELECT city, name FROM teams WHERE id = ?').get(teamId) as { city: string; name: string } | undefined;
  return t ? `${t.city} ${t.name}` : 'Unknown Team';
}

function logGameNews(season: number, game: GameSummary, userTeamId: number): void {
  const homeTeamName = getTeamName(game.homeTeamId);
  const awayTeamName = getTeamName(game.awayTeamId);
  const margin = Math.abs(game.homeScore - game.awayScore);
  const winnerName = game.homeScore > game.awayScore ? homeTeamName : awayTeamName;
  const loserName = game.homeScore > game.awayScore ? awayTeamName : homeTeamName;
  const winnerScore = Math.max(game.homeScore, game.awayScore);
  const loserScore = Math.min(game.homeScore, game.awayScore);
  const involvesUser = game.homeTeamId === userTeamId || game.awayTeamId === userTeamId;

  if (involvesUser) {
    const isHome = game.homeTeamId === userTeamId;
    const userScore = isHome ? game.homeScore : game.awayScore;
    const oppScore = isHome ? game.awayScore : game.homeScore;
    const oppName = isHome ? awayTeamName : homeTeamName;
    logNewsEvent({
      season, category: 'game',
      title: `Week ${game.week}: ${winnerName} ${winnerScore}, ${loserName} ${loserScore}`,
      body: userScore > oppScore
        ? `Your team defeated ${oppName} ${userScore}–${oppScore}`
        : `Your team fell to ${oppName} ${oppScore}–${userScore}`,
    });
  } else if (margin >= 21) {
    logNewsEvent({
      season, category: 'game',
      title: `Blowout — ${winnerName} ${winnerScore}, ${loserName} ${loserScore}`,
      body: `Week ${game.week} | ${winnerName} win by ${margin}`,
    });
  }

  for (const stat of game.stats) {
    const isQBStar = stat.pass_yards >= 300 || stat.pass_tds >= 4;
    const isRBStar = stat.rush_yards >= 150;
    const isWRStar = stat.rec_yards >= 120 || stat.rec_tds >= 2;
    if (!isQBStar && !isRBStar && !isWRStar) continue;

    const p = db.prepare('SELECT first_name, last_name FROM players WHERE id = ?').get(stat.player_id) as { first_name: string; last_name: string } | undefined;
    if (!p) continue;
    const teamName = getTeamName(stat.team_id);

    if (isQBStar) {
      const parts: string[] = [];
      if (stat.pass_yards) parts.push(`${stat.pass_yards} pass yds`);
      if (stat.pass_tds) parts.push(`${stat.pass_tds} TD`);
      if (stat.interceptions) parts.push(`${stat.interceptions} INT`);
      logNewsEvent({ season, category: 'game', title: `${p.first_name} ${p.last_name} — standout QB performance`, body: `Week ${game.week} | ${parts.join(', ')} | ${teamName}` });
    } else if (isRBStar) {
      const parts = [`${stat.rush_yards} rush yds`];
      if (stat.rush_tds) parts.push(`${stat.rush_tds} TD`);
      logNewsEvent({ season, category: 'game', title: `${p.first_name} ${p.last_name} — standout rushing performance`, body: `Week ${game.week} | ${parts.join(', ')} | ${teamName}` });
    } else if (isWRStar) {
      const parts: string[] = [];
      if (stat.receptions) parts.push(`${stat.receptions} rec`);
      if (stat.rec_yards) parts.push(`${stat.rec_yards} yds`);
      if (stat.rec_tds) parts.push(`${stat.rec_tds} TD`);
      logNewsEvent({ season, category: 'game', title: `${p.first_name} ${p.last_name} — standout receiving performance`, body: `Week ${game.week} | ${parts.join(', ')} | ${teamName}` });
    }
  }
}

function logInjuryNews(season: number, newlyInjured: InjuredPlayer[], userTeamId: number): void {
  for (const p of newlyInjured) {
    if (p.team_id !== userTeamId) continue;
    const weeksOut = p.weeks_out
      ? `Out ${p.weeks_out} week${p.weeks_out > 1 ? 's' : ''}`
      : (p.injury_status?.toUpperCase() ?? 'Injured');
    logNewsEvent({
      season, category: 'injury',
      title: `Injury: ${p.first_name} ${p.last_name} (${p.position})`,
      body: `${p.injury_type ?? 'Injury'} | ${weeksOut} | OVR ${p.overall_rating}`,
    });
  }
}

function runSimWorker(data: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'simWorker.js'), { workerData: data });
    worker.once('message', (result) => {
      if (result?.__workerError) reject(new Error(result.__workerError));
      else resolve(result);
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Sim worker exited with code ${code}`));
    });
  });
}

const DRAFT_FIRST = ['James','John','Robert','Michael','David','William','Joseph','Thomas','Charles','Christopher','Daniel','Matthew','Anthony','Mark','Steven','Paul','Andrew','Joshua','Kenneth','Kevin','Brian','Timothy','Jason','Jeffrey','Ryan','Jacob','Gary','Nicholas','Eric','Jonathan','Justin','Scott','Brandon','Benjamin','Samuel','Nathan','Zachary','Peter','Kyle','Noah','Ethan','Jeremy','Austin','Sean','Dylan','Jordan','Jesse','Bryan','Gabriel','Logan','Marcus','Malik','Darius','Terrell','Jamal','Xavier','Darnell','Lamar','Kendall','Jaylen','Jalen','Devonte','Trey','Kameron','Zion','Isaiah','Damien','Dominic','Julian','Elijah','Tyrese','DeAndre','Rashad','Corey','Marquise','Deon','Alonzo','Deshawn','Marquez','Keanu','Trevon','Devin','Javon','Treylon','Brock','Bryce','Drake','Garrett','Caleb','Quinton','Jaylon','Dontae','Tariq','Amon','Romeo','Tyjae'];
const DRAFT_LAST = ['Smith','Johnson','Williams','Jones','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Robinson','Clark','Lewis','Lee','Walker','Hall','Allen','Young','King','Wright','Hill','Scott','Green','Adams','Baker','Nelson','Carter','Mitchell','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey','Cooper','Richardson','Cox','Howard','Ward','Peterson','Gray','James','Watson','Brooks','Kelly','Sanders','Price','Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell','Long','Patterson','Hughes','Washington','Butler','Simmons','Foster','Bryant','Alexander','Russell','Griffin','Hayes','Ford','Hamilton','Graham','Sullivan','Wallace','Woods','Cole','West','Jordan','Owens','Reynolds','Fisher','Harrison','Gibson','McDonald','Marshall','Murray','Freeman','Wells','Tucker','Porter','Hunter','Hicks','Henry','Boyd','Mason','Kennedy','Warren','Burns','Gordon','Shaw','Holmes','Rice','Robertson','Hunt','Daniels','Palmer','Nichols','Grant','Knight','Ferguson','Stone','Hawkins','Perkins','Hudson','Spencer','Gardner','Payne','Pierce','Berry','Matthews','Willis','Ray','Watkins','Carroll','Duncan','Hart','Cunningham','Bradley','Andrews','Harper','Fox','Riley','Armstrong','Greene','Lawrence','Elliott','Sims','Morrow','Ingram','Bates','Flowers','Moss','Lamb'];
const DRAFT_POS_POOL = ['QB','RB','WR','WR','WR','TE','OL','OL','OL','DL','DL','DL','LB','LB','CB','CB','S','K','P'];

function generateDraftClass(season: number): void {
  if (draftRepo.countBySeason(season) > 0) return;
  const getDevTrait = (ovr: number): string => {
    const r = Math.random();
    if (ovr >= 78) return r < 0.02 ? 'X-Factor' : r < 0.08 ? 'Superstar' : r < 0.40 ? 'Star' : 'Normal';
    if (ovr >= 74) return r < 0.01 ? 'X-Factor' : r < 0.05 ? 'Superstar' : r < 0.25 ? 'Star' : 'Normal';
    if (ovr >= 70) return r < 0.005 ? 'Superstar' : r < 0.12 ? 'Star' : 'Normal';
    return r < 0.05 ? 'Star' : 'Normal';
  };
  const prospects: any[] = [];
  for (let i = 0; i < 280; i++) {
    let ovr: number;
    if (i < 10)       ovr = Math.floor(Math.random() * 7) + 76;
    else if (i < 32)  ovr = Math.floor(Math.random() * 7) + 71;
    else if (i < 64)  ovr = Math.floor(Math.random() * 6) + 67;
    else if (i < 96)  ovr = Math.floor(Math.random() * 6) + 64;
    else if (i < 128) ovr = Math.floor(Math.random() * 5) + 61;
    else if (i < 160) ovr = Math.floor(Math.random() * 5) + 59;
    else if (i < 224) ovr = Math.floor(Math.random() * 5) + 57;
    else              ovr = Math.floor(Math.random() * 6) + 52;
    prospects.push({
      season,
      first_name: DRAFT_FIRST[Math.floor(Math.random() * DRAFT_FIRST.length)],
      last_name:  DRAFT_LAST[Math.floor(Math.random() * DRAFT_LAST.length)],
      position:   DRAFT_POS_POOL[Math.floor(Math.random() * DRAFT_POS_POOL.length)],
      overall_rating: ovr,
      dev_trait: getDevTrait(ovr),
      age: Math.random() < 0.6 ? 21 : Math.random() < 0.6 ? 22 : 23,
    });
  }
  draftRepo.insertClass(prospects);
  console.log(`Draft class generated for season ${season}: ${prospects.length} prospects`);
}

export function registerSimHandlers(): void {

  ipcMain.handle('get-waiver-wire', () =>
    playerRepo.getOnWaivers(settingsRepo.getUserTeamId() ?? -1));

  ipcMain.handle('claim-waiver', (_event: IpcEvent, playerId: number) => {
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

  ipcMain.handle('simulate-playoffs', (_event: IpcEvent, season?: number) => {
    const s = season ?? getCurrentSeason();
    db.prepare(`DELETE FROM stats WHERE game_id IN (SELECT id FROM games WHERE season = ? AND is_playoff = 1)`).run(s);
    db.prepare(`DELETE FROM games WHERE season = ? AND is_playoff = 1`).run(s);

    const allRecords = gameRepo.getAllRecords(s);
    const seedTeams = (conf: string) =>
      (db.prepare(`SELECT id, city, name FROM teams WHERE conference = ?`).all(conf) as any[])
        .map((t: any) => ({ ...t, wins: allRecords[t.id]?.wins ?? 0 }))
        .sort((a: any, b: any) => b.wins - a.wins).slice(0, 7);

    const insertGame = db.prepare(`
      INSERT INTO games
      (season, week, home_team_id, away_team_id, home_score, away_score,
       home_q1, home_q2, home_q3, home_q4, away_q1, away_q2, away_q3, away_q4,
       weather, is_playoff, is_simulated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `);

    const simGame = (home: any, away: any, week: number, roundLabel: string) => {
      const r = simulateGame(home.id, away.id);
      insertGame.run(
        s, week, home.id, away.id, r.homeScore, r.awayScore,
        r.homeQuarters[0], r.homeQuarters[1], r.homeQuarters[2], r.homeQuarters[3],
        r.awayQuarters[0], r.awayQuarters[1], r.awayQuarters[2], r.awayQuarters[3],
        r.weather ?? 'clear'
      );
      const winner = r.homeScore > r.awayScore ? home : away;
      const loser = r.homeScore > r.awayScore ? away : home;
      const winnerScore = Math.max(r.homeScore, r.awayScore);
      const loserScore = Math.min(r.homeScore, r.awayScore);
      logNewsEvent({
        season: s, category: 'game',
        title: `${roundLabel}: ${winner.city} ${winner.name} ${winnerScore}, ${loser.city} ${loser.name} ${loserScore}`,
        body: `${winner.city} ${winner.name} advance`,
      });
      return { home, away, homeScore: r.homeScore, awayScore: r.awayScore, winner };
    };

    const afcTeams = seedTeams('AFC');
    const nfcTeams = seedTeams('NFC');

    const afcWC = [simGame(afcTeams[1], afcTeams[6], 18, 'AFC Wild Card'), simGame(afcTeams[2], afcTeams[5], 18, 'AFC Wild Card'), simGame(afcTeams[3], afcTeams[4], 18, 'AFC Wild Card')];
    const nfcWC = [simGame(nfcTeams[1], nfcTeams[6], 18, 'NFC Wild Card'), simGame(nfcTeams[2], nfcTeams[5], 18, 'NFC Wild Card'), simGame(nfcTeams[3], nfcTeams[4], 18, 'NFC Wild Card')];
    const afcDiv = [simGame(afcTeams[0], afcWC[2].winner, 19, 'AFC Divisional'), simGame(afcWC[0].winner, afcWC[1].winner, 19, 'AFC Divisional')];
    const nfcDiv = [simGame(nfcTeams[0], nfcWC[2].winner, 19, 'NFC Divisional'), simGame(nfcWC[0].winner, nfcWC[1].winner, 19, 'NFC Divisional')];
    const afcChamp = simGame(afcDiv[0].winner, afcDiv[1].winner, 20, 'AFC Championship');
    const nfcChamp = simGame(nfcDiv[0].winner, nfcDiv[1].winner, 20, 'NFC Championship');
    const gridironCup = simGame(afcChamp.winner, nfcChamp.winner, 21, 'Gridiron Cup');

    db.prepare('INSERT OR REPLACE INTO champions (season, team_id) VALUES (?, ?)').run(s, gridironCup.winner.id);

    const champ = gridironCup.winner;
    const runnerUp = gridironCup.winner.id === afcChamp.winner.id ? nfcChamp.winner : afcChamp.winner;
    const champScore = gridironCup.homeScore > gridironCup.awayScore ? gridironCup.homeScore : gridironCup.awayScore;
    const ruScore = gridironCup.homeScore > gridironCup.awayScore ? gridironCup.awayScore : gridironCup.homeScore;
    logNewsEvent({
      season: s, category: 'game',
      title: `🏆 ${champ.city} ${champ.name} are Gridiron Cup Champions!`,
      body: `Defeated ${runnerUp.city} ${runnerUp.name} ${champScore}–${ruScore} in the Gridiron Cup`,
    });

    return {
      afc: { seeds: afcTeams, wildCard: afcWC, divisional: afcDiv, championship: afcChamp },
      nfc: { seeds: nfcTeams, wildCard: nfcWC, divisional: nfcDiv, championship: nfcChamp },
      gridironCup,
    };
  });

  ipcMain.handle('generate-schedule', () => {
    const season = getCurrentSeason();
    if (gameRepo.countBySeason(season) > 0) return { alreadyExists: true, season };

    interface TeamRow { id: number; conference: string; division: string; }
    const teamRows = db.prepare(
      'SELECT id, conference, division FROM teams ORDER BY conference, division, id'
    ).all() as TeamRow[];

    const divMap: Record<string, number[]> = {};
    for (const t of teamRows) {
      const key = `${t.conference}-${t.division}`;
      if (!divMap[key]) divMap[key] = [];
      divMap[key].push(t.id);
    }

    const afcDivs = ['AFC-North', 'AFC-South', 'AFC-East', 'AFC-West'];
    const nfcDivs = ['NFC-North', 'NFC-South', 'NFC-East', 'NFC-West'];

    const k44Round = (a: number[], b: number[], r: number, offset: number): { home: number; away: number }[] =>
      Array.from({ length: 4 }, (_, i) => {
        const j = (i + r) % 4;
        return (i + j + offset) % 2 === 0 ? { home: a[i], away: b[j] } : { home: b[j], away: a[i] };
      });

    const nearK44Round = (a: number[], b: number[], r: number, offset: number): { home: number; away: number }[] => {
      const skipShift = ((offset % 4) + 4) % 4;
      const validShifts = [0, 1, 2, 3].filter(s => s !== skipShift);
      const shift = validShifts[r];
      return Array.from({ length: 4 }, (_, i) => {
        const j = (i + shift) % 4;
        return (i + j + offset) % 2 === 0 ? { home: a[i], away: b[j] } : { home: b[j], away: a[i] };
      });
    };

    const weeks: { home: number; away: number }[][] = [];

    const divisionRounds: { home: number; away: number }[][][] = [];
    for (const divKey of [...afcDivs, ...nfcDivs]) {
      const [t0, t1, t2, t3] = divMap[divKey] ?? [];
      divisionRounds.push([
        [{ home: t0, away: t1 }, { home: t2, away: t3 }],
        [{ home: t0, away: t2 }, { home: t1, away: t3 }],
        [{ home: t0, away: t3 }, { home: t1, away: t2 }],
        [{ home: t1, away: t0 }, { home: t3, away: t2 }],
        [{ home: t2, away: t0 }, { home: t3, away: t1 }],
        [{ home: t3, away: t0 }, { home: t2, away: t1 }],
      ]);
    }
    for (let r = 0; r < 6; r++) {
      const week: { home: number; away: number }[] = [];
      for (const div of divisionRounds) week.push(...div[r]);
      weeks.push(week);
    }

    const intraPairings: [number, number][][] = [
      [[0,1],[2,3],[0,2],[1,3]],
      [[0,2],[1,3],[0,3],[1,2]],
      [[0,3],[1,2],[0,1],[2,3]],
    ];
    const confPairs = intraPairings[season % 3];

    for (let stack = 0; stack < 2; stack++) {
      const [pA, pB] = [confPairs[stack * 2], confPairs[stack * 2 + 1]];
      const [afcA, afcB] = [divMap[afcDivs[pA[0]]] ?? [], divMap[afcDivs[pA[1]]] ?? []];
      const [afcC, afcD] = [divMap[afcDivs[pB[0]]] ?? [], divMap[afcDivs[pB[1]]] ?? []];
      const [nfcA, nfcB] = [divMap[nfcDivs[pA[0]]] ?? [], divMap[nfcDivs[pA[1]]] ?? []];
      const [nfcC, nfcD] = [divMap[nfcDivs[pB[0]]] ?? [], divMap[nfcDivs[pB[1]]] ?? []];

      for (let r = 0; r < 4; r++) {
        weeks.push([
          ...k44Round(afcA, afcB, r, season),
          ...k44Round(afcC, afcD, r, season),
          ...k44Round(nfcA, nfcB, r, season),
          ...k44Round(nfcC, nfcD, r, season),
        ]);
      }
    }

    for (let r = 0; r < 3; r++) {
      const week: { home: number; away: number }[] = [];
      for (let i = 0; i < 4; i++) {
        const afcTeams = divMap[afcDivs[i]] ?? [];
        const nfcTeams = divMap[nfcDivs[(i + season) % 4]] ?? [];
        week.push(...nearK44Round(afcTeams, nfcTeams, r, season + 1));
      }
      weeks.push(week);
    }

    const insertGame = db.prepare(
      'INSERT INTO games (season, week, home_team_id, away_team_id, is_simulated) VALUES (?, ?, ?, ?, 0)'
    );
    db.transaction(() => {
      for (let w = 0; w < 17; w++) {
        for (const g of weeks[w]) {
          insertGame.run(season, w + 1, g.home, g.away);
        }
      }
    })();

        // Auto-generate draft class for this season if not already present
    const draftCheck = db.prepare(
      'SELECT COUNT(*) as cnt FROM draft_prospects WHERE season = ?'
    ).get(season) as any;
    if ((draftCheck?.cnt ?? 0) === 0) {
      generateDraftClass(season);
    }

    // Initialize scouting budget for this season
    const budgetKey = `scouting_budget_${season}`;
    if (!settingsRepo.get(budgetKey)) {
      settingsRepo.set(budgetKey, '3');
    }

    // Generate owner goals for this season
    const userTeamId = settingsRepo.getUserTeamId() ?? -1;
    if (userTeamId > 0) generateOwnerGoals(season, userTeamId);

    return { season, created: true, alreadyExists: false };
  });

  ipcMain.handle('get-current-week', () => {
    const season = getCurrentSeason();
    if (gameRepo.countBySeason(season) === 0) return { hasSchedule: false, currentWeek: null };
    return { hasSchedule: true, currentWeek: gameRepo.getCurrentWeek(season) };
  });

  ipcMain.handle('get-week-matchups', (_event: IpcEvent, week: number) => {
    const season = getCurrentSeason();
    return db.prepare(`
      SELECT g.id, g.week, g.home_score, g.away_score, g.is_simulated,
             ht.id as home_team_id, ht.city || ' ' || ht.name AS home_team,
             at.id as away_team_id, at.city || ' ' || at.name AS away_team
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE g.season = ? AND g.week = ? AND g.is_playoff = 0
      ORDER BY g.id
    `).all(season, week);
  });

  ipcMain.handle('simulate-week', async (_event: IpcEvent, week: number) => {
    const season = getCurrentSeason();
    const userTeamId = settingsRepo.getUserTeamId() ?? -1;
    const games = gameRepo.getPendingByWeek(season, week)
      .filter((g: any) => g.home_team_id !== userTeamId && g.away_team_id !== userTeamId);
    if (games.length === 0) return { week, season, gamesSimulated: 0 };

    const result = await runSimWorker({
      type: 'simulate-week',
      week,
      season,
      games,
      userTeamId,
      difficultyFactor: getDifficultyFactor(),
      dbPath: getDbPath(),
    });

    // Run progression for all CPU games just simulated
    if (games.length > 0) {
      const gameIds = games.map((g: any) => g.id);
      const ph = gameIds.map(() => '?').join(',');
      const weekStats = db.prepare(
        `SELECT * FROM stats WHERE game_id IN (${ph})`
      ).all(...gameIds) as any[];
      progressPlayers(weekStats, season, week);
    }

        // Accumulate weekly scouting budget based on scout quality
    const swSeason = getCurrentSeason();
    const swKey = `scouting_budget_${swSeason}`;
    const swBudget = parseInt(settingsRepo.get(swKey) ?? '0');
    const swPts = scoutRepo.getWeeklyPoints(userTeamId);
    if (swBudget < 70) settingsRepo.set(swKey, String(Math.min(70, swBudget + swPts)));

    return result;
  });

    ipcMain.handle('simulate-game', async (_event: IpcEvent, gameId: number) => {
    const game = db.prepare(`SELECT * FROM games WHERE id = ?`).get(gameId) as any;
    if (!game) return { success: false, reason: 'Game not found.' };
    if (game.is_simulated) return { success: false, reason: 'Game already simulated.' };

    const insertStat = db.prepare(`
      INSERT INTO stats
      (game_id, season, week, is_playoff, player_id, team_id,
       pass_attempts, completions, pass_yards, pass_tds,
       interceptions, rush_attempts, rush_yards, rush_tds, targets, receptions, rec_yards,
       rec_tds, tackles, assisted_tackles, sacks, tfl, forced_fumbles, fumble_recoveries,
       def_interceptions, pass_deflections, def_tds, fg_made, fg_att, xp_made, xp_att)
      VALUES
      (@game_id, @season, @week, @is_playoff, @player_id, @team_id,
       @pass_attempts, @completions, @pass_yards, @pass_tds,
       @interceptions, @rush_attempts, @rush_yards, @rush_tds, @targets, @receptions, @rec_yards,
       @rec_tds, @tackles, @assisted_tackles, @sacks, @tfl, @forced_fumbles, @fumble_recoveries,
       @def_interceptions, @pass_deflections, @def_tds, @fg_made, @fg_att, @xp_made, @xp_att)
    `);

    let gameResult: any;
    const allStats: any[] = [];
    const userTeamId = settingsRepo.getUserTeamId() ?? -1;

    // Read user's game plan for this week
    const gpRaw = settingsRepo.get(`gameplan_${game.season}_${game.week}`);
    const gamePlan: GamePlanOptions | undefined = gpRaw ? JSON.parse(gpRaw) : undefined;

    db.transaction(() => {
      gameResult = simulateGame(game.home_team_id, game.away_team_id, game.week ?? 1, userTeamId, getDifficultyFactor(), gamePlan);
      gameRepo.updateResult(game.id, gameResult.homeScore, gameResult.awayScore, gameResult.homeQuarters, gameResult.awayQuarters, gameResult.weather ?? 'clear');
      for (const stat of [...gameResult.homePlayerStats, ...gameResult.awayPlayerStats]) {
        insertStat.run({ game_id: game.id, season: game.season, week: game.week ?? 1, is_playoff: game.is_playoff ?? 0, ...stat });
        allStats.push(stat);
      }
    })();

    logGameNews(getCurrentSeason(), {
      week: game.week ?? 1,
      homeTeamId: game.home_team_id,
      awayTeamId: game.away_team_id,
      homeScore: gameResult.homeScore,
      awayScore: gameResult.awayScore,
      stats: allStats,
    }, userTeamId);

    const weekComplete = gameRepo.countPendingInWeek(game.season, game.week) === 0;
    const newlyInjured = rollInjuries(allStats);
    recordInjuryHistory(newlyInjured as any[], game.week ?? 1, game.season);
      const homeDiff = gameResult.homeScore - gameResult.awayScore;
processGameResult(game.home_team_id, homeDiff > 0, homeDiff, game.season, game.week ?? 1);
processGameResult(game.away_team_id, homeDiff < 0, -homeDiff, game.season, game.week ?? 1);
    logInjuryNews(getCurrentSeason(), newlyInjured, userTeamId);
    const milestonePlayerIds = [...new Set(allStats.map((s: any) => s.player_id as number))];
    checkMilestones(getCurrentSeason(), game.week ?? 1, milestonePlayerIds);

    progressPlayers(allStats, game.season, game.week ?? 1);

    const rosterResult = processRosterAdjustments(newlyInjured, userTeamId);
    if (weekComplete) { playerRepo.advanceInjuryTimers(); processWaivers(userTeamId, game.week); }
        // Accumulate scouting budget based on scout quality
    const sgKey = `scouting_budget_${game.season}`;
    const sgBudget = parseInt(settingsRepo.get(sgKey) ?? '0');
    const sgPts = scoutRepo.getWeeklyPoints(userTeamId);
    if (sgBudget < 70) settingsRepo.set(sgKey, String(Math.min(70, sgBudget + sgPts)));

    return {
      success: true, gameId, weekComplete,
      homeScore: gameResult.homeScore, awayScore: gameResult.awayScore,
      callups: rosterResult.callups, userPSOpenSpots: rosterResult.userPSOpenSpots,

  ipcMain.handle('generate-preseason', (_event: any, season: number) => {
    const { generatePreseasonSchedule } = require('../services/PreseasonService');
    return generatePreseasonSchedule(season ?? getCurrentSeason());
  });

  ipcMain.handle('get-game-play-log', (_event: IpcEvent, gameId: number) => {
    const raw = settingsRepo.get(`game_play_log_${gameId}`);
    return raw ? JSON.parse(raw) : [];
  });

  ipcMain.handle('get-playoff-state', (_event: IpcEvent, season?: number) => {
    const s = season ?? getCurrentSeason();

    const playoffCount = (db.prepare('SELECT COUNT(*) as cnt FROM games WHERE season = ? AND is_playoff = 1').get(s) as any).cnt;
    if (playoffCount === 0) return { initialized: false };

    const { afcSeeds, nfcSeeds } = getOrDerivePlayoffSeeds(s);
    const afcIdSet = new Set(afcSeeds.map((t: any) => t.id));

    const games = db.prepare(`
      SELECT g.*,
        ht.city as home_city, ht.name as home_name,
        at.city as away_city, at.name as away_name
      FROM games g
      JOIN teams ht ON ht.id = g.home_team_id
      JOIN teams at ON at.id = g.away_team_id
      WHERE g.season = ? AND g.is_playoff = 1
      ORDER BY g.week, g.id
    `).all(s) as any[];

    const fmtTeam = (id: number, city: string, name: string) => ({ id, city, name });
    const fmtGame = (g: any) => ({
      id: g.id,
      week: g.week,
      homeTeam: fmtTeam(g.home_team_id, g.home_city, g.home_name),
      awayTeam: fmtTeam(g.away_team_id, g.away_city, g.away_name),
      homeScore: g.home_score,
      awayScore: g.away_score,
      isSimulated: g.is_simulated === 1,
      winner: g.is_simulated === 1
        ? (g.home_score > g.away_score
          ? fmtTeam(g.home_team_id, g.home_city, g.home_name)
          : fmtTeam(g.away_team_id, g.away_city, g.away_name))
        : null,
    });

    const sortBySeedIdx = (list: any[], seeds: any[]) => {
      const idxOf = (teamId: number) => seeds.findIndex((t: any) => t.id === teamId);
      return [...list].sort((a, b) => idxOf(a.home_team_id) - idxOf(b.home_team_id));
    };

    const wcGames    = games.filter(g => g.week === 18);
    const divGames   = games.filter(g => g.week === 19);
    const champGames = games.filter(g => g.week === 20);
    const cupGame    = games.find(g => g.week === 21) ?? null;

    const afcWC  = sortBySeedIdx(wcGames.filter(g => afcIdSet.has(g.home_team_id)), afcSeeds);
    const nfcWC  = sortBySeedIdx(wcGames.filter(g => !afcIdSet.has(g.home_team_id)), nfcSeeds);
    const afcDiv = sortBySeedIdx(divGames.filter(g => afcIdSet.has(g.home_team_id)), afcSeeds);
    const nfcDiv = sortBySeedIdx(divGames.filter(g => !afcIdSet.has(g.home_team_id)), nfcSeeds);

    // Championship: classify by home team conference
    const afcChampGame = champGames.find(g => afcIdSet.has(g.home_team_id)) ?? null;
    const nfcChampGame = champGames.find(g => !afcIdSet.has(g.home_team_id)) ?? null;

    const champRow = db.prepare(`
      SELECT t.id, t.city, t.name FROM champions c
      JOIN teams t ON t.id = c.team_id WHERE c.season = ?
    `).get(s) as any;

    return {
      initialized: true,
      complete: !!champRow,
      champion: champRow ? fmtTeam(champRow.id, champRow.city, champRow.name) : null,
      afcSeeds,
      nfcSeeds,
      afc: {
        wildCard:     afcWC.map(fmtGame),
        divisional:   afcDiv.map(fmtGame),
        championship: afcChampGame ? fmtGame(afcChampGame) : null,
      },
      nfc: {
        wildCard:     nfcWC.map(fmtGame),
        divisional:   nfcDiv.map(fmtGame),
        championship: nfcChampGame ? fmtGame(nfcChampGame) : null,
      },
      gridironCup: cupGame ? fmtGame(cupGame) : null,
    };
  });

  ipcMain.handle('get-playoffs', (_event: IpcEvent, season: number) => {
    const s = season ?? getCurrentSeason();
    return db.prepare(`
      SELECT g.week, g.home_score, g.away_score,
        ht.city || ' ' || ht.name as home_team,
        at.city || ' ' || at.name as away_team
      FROM games g
      JOIN teams ht ON ht.id = g.home_team_id
      JOIN teams at ON at.id = g.away_team_id
      WHERE g.season = ? AND g.is_playoff = 1 AND g.is_simulated = 1
      ORDER BY g.week, g.id
    `).all(s);
  });

  ipcMain.handle('get-preseason-status', (_event: any, season: number) => {
    const { getPreseasonStatus } = require('../services/PreseasonService');
    return getPreseasonStatus(season ?? getCurrentSeason());
  });

  ipcMain.handle('init-playoffs', (_event: IpcEvent, season?: number) => {
    const s = season ?? getCurrentSeason();
    db.prepare(`DELETE FROM stats WHERE game_id IN (SELECT id FROM games WHERE season = ? AND is_playoff = 1)`).run(s);
    db.prepare(`DELETE FROM games WHERE season = ? AND is_playoff = 1`).run(s);

    const allRecords = gameRepo.getAllRecords(s);
    const afcSeeds = (db.prepare(`SELECT id, city, name FROM teams WHERE conference = 'AFC'`).all() as any[])
      .map((t: any) => ({ ...t, wins: allRecords[t.id]?.wins ?? 0 }))
      .sort((a: any, b: any) => b.wins - a.wins).slice(0, 7);
    const nfcSeeds = (db.prepare(`SELECT id, city, name FROM teams WHERE conference = 'NFC'`).all() as any[])
      .map((t: any) => ({ ...t, wins: allRecords[t.id]?.wins ?? 0 }))
      .sort((a: any, b: any) => b.wins - a.wins).slice(0, 7);

    settingsRepo.set(`playoff_seeds_AFC_${s}`, JSON.stringify(afcSeeds));
    settingsRepo.set(`playoff_seeds_NFC_${s}`, JSON.stringify(nfcSeeds));

    const insertPending = db.prepare(`
      INSERT INTO games
      (season, week, home_team_id, away_team_id, home_score, away_score,
       home_q1, home_q2, home_q3, home_q4, away_q1, away_q2, away_q3, away_q4,
       weather, is_playoff, is_simulated)
      VALUES (?, 18, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'clear', 1, 0)
    `);

    db.transaction(() => {
      insertPending.run(s, afcSeeds[1].id, afcSeeds[6].id);
      insertPending.run(s, afcSeeds[2].id, afcSeeds[5].id);
      insertPending.run(s, afcSeeds[3].id, afcSeeds[4].id);
      insertPending.run(s, nfcSeeds[1].id, nfcSeeds[6].id);
      insertPending.run(s, nfcSeeds[2].id, nfcSeeds[5].id);
      insertPending.run(s, nfcSeeds[3].id, nfcSeeds[4].id);
    })();

    return { initialized: true };
  });

  ipcMain.handle('simulate-playoff-game', (_event: IpcEvent, gameId: number) => {
    const s = getCurrentSeason();

    const game = db.prepare(`
      SELECT g.*,
        ht.city as home_city, ht.name as home_name,
        at.city as away_city, at.name as away_name
      FROM games g
      JOIN teams ht ON ht.id = g.home_team_id
      JOIN teams at ON at.id = g.away_team_id
      WHERE g.id = ? AND g.season = ? AND g.is_playoff = 1
    `).get(gameId, s) as any;

    if (!game)             return { error: 'Game not found.' };
    if (game.is_simulated) return { error: 'Game already simulated.' };

    const home = { id: game.home_team_id, city: game.home_city, name: game.home_name };
    const away = { id: game.away_team_id, city: game.away_city, name: game.away_name };

    const result = simulateGame(home.id, away.id, game.week, -1, 0,
      undefined, getCpuGamePlan(home.id), getCpuGamePlan(away.id));

    db.prepare(`
      UPDATE games SET
        home_score = ?, away_score = ?,
        home_q1 = ?, home_q2 = ?, home_q3 = ?, home_q4 = ?,
        away_q1 = ?, away_q2 = ?, away_q3 = ?, away_q4 = ?,
        weather = ?, is_simulated = 1
      WHERE id = ?
    `).run(
      result.homeScore, result.awayScore,
      result.homeQuarters[0], result.homeQuarters[1], result.homeQuarters[2], result.homeQuarters[3],
      result.awayQuarters[0], result.awayQuarters[1], result.awayQuarters[2], result.awayQuarters[3],
      result.weather ?? 'clear', gameId,
    );

    const winner = result.homeScore > result.awayScore ? home : away;
    const loser  = result.homeScore > result.awayScore ? away  : home;
    const ws = Math.max(result.homeScore, result.awayScore);
    const ls = Math.min(result.homeScore, result.awayScore);

    const ROUND_LABELS: Record<number, string> = {
      18: 'Wild Card', 19: 'Divisional', 20: 'Conference Championship', 21: 'Gridiron Cup',
    };
    logNewsEvent({
      season: s, category: 'game',
      headline: `${ROUND_LABELS[game.week] ?? 'Playoff'}: ${winner.city} ${winner.name} ${ws}, ${loser.city} ${loser.name} ${ls}`,
      detail: `${winner.city} ${winner.name} advance`,
    });

    const roundGames = db.prepare(
      'SELECT id, is_simulated, home_team_id, away_team_id, home_score, away_score FROM games WHERE season = ? AND week = ? AND is_playoff = 1'
    ).all(s, game.week) as any[];

    const roundComplete = roundGames.every(g => g.is_simulated);

    if (roundComplete) {
      const { afcSeeds, nfcSeeds } = getOrDerivePlayoffSeeds(s);
      const afcIdSet = new Set(afcSeeds.map((t: any) => t.id));

      const getWinnerId = (g: any): number =>
        g.home_score > g.away_score ? g.home_team_id : g.away_team_id;

      const insertPending = db.prepare(`
        INSERT INTO games
        (season, week, home_team_id, away_team_id, home_score, away_score,
         home_q1, home_q2, home_q3, home_q4, away_q1, away_q2, away_q3, away_q4,
         weather, is_playoff, is_simulated)
        VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 'clear', 1, 0)
      `);

      const seedIdx = (teamId: number, seeds: any[]): number =>
        seeds.findIndex((t: any) => t.id === teamId);

      if (game.week === 18) {
        // Wild Card done → create Divisional games
        const afcWC = roundGames
          .filter(g => afcIdSet.has(g.home_team_id))
          .sort((a, b) => seedIdx(a.home_team_id, afcSeeds) - seedIdx(b.home_team_id, afcSeeds));
        const nfcWC = roundGames
          .filter(g => !afcIdSet.has(g.home_team_id))
          .sort((a, b) => seedIdx(a.home_team_id, nfcSeeds) - seedIdx(b.home_team_id, nfcSeeds));

        const makeDiv = (seeds: any[], wc: any[], insertFn: typeof insertPending) => {
          const wc0w = getWinnerId(wc[0]);
          const wc1w = getWinnerId(wc[1]);
          const wc2w = getWinnerId(wc[2]);
          // Seed1 vs WC2w (Seed1 always home)
          insertFn.run(s, 19, seeds[0].id, wc2w);
          // WC0w vs WC1w (better original seed = home)
          const homeD1 = seedIdx(wc0w, seeds) < seedIdx(wc1w, seeds) ? wc0w : wc1w;
          const awayD1 = homeD1 === wc0w ? wc1w : wc0w;
          insertFn.run(s, 19, homeD1, awayD1);
        };

        db.transaction(() => {
          makeDiv(afcSeeds, afcWC, insertPending);
          makeDiv(nfcSeeds, nfcWC, insertPending);
        })();

      } else if (game.week === 19) {
        // Divisional done → create Championships
        const afcDiv = roundGames.filter(g => afcIdSet.has(g.home_team_id));
        const nfcDiv = roundGames.filter(g => !afcIdSet.has(g.home_team_id));

        const makeChamp = (seeds: any[], divGms: any[], conf: string) => {
          const winnerIds = divGms.map(getWinnerId);
          const homeC = seedIdx(winnerIds[0], seeds) < seedIdx(winnerIds[1], seeds) ? winnerIds[0] : winnerIds[1];
          const awayC = homeC === winnerIds[0] ? winnerIds[1] : winnerIds[0];
          insertPending.run(s, 20, homeC, awayC);
        };

        db.transaction(() => {
          makeChamp(afcSeeds, afcDiv, 'AFC');
          makeChamp(nfcSeeds, nfcDiv, 'NFC');
        })();

      } else if (game.week === 20) {
        // Championships done → create Gridiron Cup (AFC winner is home)
        const afcChamp = roundGames.find(g => afcIdSet.has(g.home_team_id))!;
        const nfcChamp = roundGames.find(g => !afcIdSet.has(g.home_team_id))!;
        const afcW = getWinnerId(afcChamp);
        const nfcW = getWinnerId(nfcChamp);
        insertPending.run(s, 21, afcW, nfcW);

      } else if (game.week === 21) {
        // Gridiron Cup done → record champion
        db.prepare('INSERT OR REPLACE INTO champions (season, team_id) VALUES (?, ?)').run(s, winner.id);
        logNewsEvent({
          season: s, category: 'game',
          headline: `🏆 ${winner.city} ${winner.name} are Gridiron Cup Champions!`,
          detail: `Defeated ${loser.city} ${loser.name} ${ws}–${ls} in the Gridiron Cup`,
        });
      }
    }

    return {
      gameId,
      winner,
      loser,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      roundComplete,
      playoffsComplete: game.week === 21 && roundComplete,
    };
  });

  ipcMain.handle('simulate-preseason-game', (_event: any, gameId: number) => {
    const { simulatePreseasonGame } = require('../services/PreseasonService');
    return simulatePreseasonGame(gameId);
  });

  ipcMain.handle('simulate-preseason-week', (_event: any, week: number, season?: number) => {
    const { simulatePreseasonWeek } = require('../services/PreseasonService');
    return simulatePreseasonWeek(week, season ?? getCurrentSeason());
  });

};
