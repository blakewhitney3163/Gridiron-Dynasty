import { ipcMain } from 'electron';
import { db } from '../database';
import { getCurrentSeason } from '../helpers/getCurrentSeason';
import { TradeResult } from '../types';
import { settingsRepo, playerRepo, contractRepo, pickRepo } from '../repositories';
import {
  calcPlayerTradeValue, calcPickTradeValue,
  getTeamTradeProfile, proposeTrade, getCpuTradeOffer,
} from '../services/TradeService';

export { calcPlayerTradeValue, calcPickTradeValue, getTeamTradeProfile };

export function registerTradeHandlers(): void {

  ipcMain.handle('get-team-status', (_event: any, teamId: number) =>
    getTeamTradeProfile(teamId));

  ipcMain.handle('set-team-trade-status', (_event: any, { teamId, status }: { teamId: number; status: string | null }) => {
    if (!status || status === 'auto') db.prepare('DELETE FROM team_trade_overrides WHERE team_id = ?').run(teamId);
    else db.prepare('INSERT OR REPLACE INTO team_trade_overrides (team_id, status) VALUES (?, ?)').run(teamId, status);
    return { success: true };
  });

  ipcMain.handle('propose-trade', (_event: any, { myPlayerIds, theirPlayerIds, theirTeamId, myPickIds = [], theirPickIds = [] }: {
    myPlayerIds: number[]; theirPlayerIds: number[]; theirTeamId: number;
    myPickIds?: number[]; theirPickIds?: number[];
  }): Promise<TradeResult> => {
    const myTeamId = settingsRepo.getUserTeamId();
    if (!myTeamId) return { accepted: false, reason: 'No franchise selected.' } as any;
    return proposeTrade({ myTeamId, theirTeamId, myPlayerIds, theirPlayerIds, myPickIds, theirPickIds }) as any;
  });

  ipcMain.handle('get-tradeable-picks', (_event: any, teamId: number) =>
    pickRepo.getByTeam(teamId, getCurrentSeason()));

  ipcMain.handle('get-cpu-trade-offer', () => {
    const userTeamId = settingsRepo.getUserTeamId();
    if (!userTeamId) return null;
    return getCpuTradeOffer(userTeamId);
  });

  ipcMain.handle('accept-cpu-trade-offer', (_event: any, { myPlayerId, theirPlayerId, theirTeamId, theirPickId }: {
    myPlayerId: number; theirPlayerId: number; theirTeamId: number; theirPickId: number | null;
  }) => {
    const myTeamId = settingsRepo.getUserTeamId();
    if (!myTeamId) return { success: false };
    db.transaction(() => {
      playerRepo.updateTeam(myPlayerId, theirTeamId);
      contractRepo.updateTeam(myPlayerId, theirTeamId);
      playerRepo.updateTeam(theirPlayerId, myTeamId);
      contractRepo.updateTeam(theirPlayerId, myTeamId);
      if (theirPickId) pickRepo.transfer(theirPickId, myTeamId);
    })();
    return { success: true };
  });

  ipcMain.handle('get-team-needs', (_: any, teamId: number) => {
    const TARGETS: Record<string, { min: number; ideal: number; topN: number; minOvr: number }> = {
      QB: { min: 2, ideal: 3, topN: 1, minOvr: 72 }, RB: { min: 3, ideal: 4, topN: 2, minOvr: 70 },
      WR: { min: 4, ideal: 5, topN: 3, minOvr: 70 }, TE: { min: 2, ideal: 3, topN: 1, minOvr: 68 },
      OL: { min: 6, ideal: 8, topN: 5, minOvr: 68 }, DL: { min: 4, ideal: 6, topN: 4, minOvr: 68 },
      LB: { min: 3, ideal: 5, topN: 3, minOvr: 68 }, CB: { min: 3, ideal: 5, topN: 2, minOvr: 68 },
      S:  { min: 2, ideal: 3, topN: 2, minOvr: 68 }, K:  { min: 1, ideal: 1, topN: 1, minOvr: 60 },
    };
    const roster = playerRepo.getByTeam(teamId, 'active');
    const needs: { position: string; severity: 'critical' | 'depth' }[] = [];
    for (const [pos, t] of Object.entries(TARGETS)) {
      const posPlayers = roster.filter((p: any) => p.position === pos);
      if (posPlayers.length < t.min) { needs.push({ position: pos, severity: 'critical' }); continue; }
      const topAvg = posPlayers.slice(0, t.topN).reduce((s: number, p: any) => s + p.overall_rating, 0) / posPlayers.slice(0, t.topN).length;
      if (posPlayers.length < t.ideal || topAvg < t.minOvr) needs.push({ position: pos, severity: 'depth' });
    }
    return needs;
  });
}
