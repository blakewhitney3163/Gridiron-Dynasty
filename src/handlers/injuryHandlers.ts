import { ipcMain } from 'electron';
import type { IpcEvent } from '../types/ipc';
import { settingsRepo } from '../repositories';
import {
  placeOnIR,
  activateFromIR,
  getInjuryHistory,
  getTeamInjuries,
} from '../services/InjuryService';
import { logNewsEvent } from '../helpers/logNewsEvent';
import { getCurrentSeason } from '../helpers/getCurrentSeason';
import { db } from '../database';

export function registerInjuryHandlers(): void {

  ipcMain.handle('get-team-injuries', (_event: IpcEvent, teamId?: number) => {
    const id = teamId ?? settingsRepo.getUserTeamId() ?? -1;
    return getTeamInjuries(id);
  });

  ipcMain.handle('place-on-ir', (_event: IpcEvent, playerId: number) => {
    const result = placeOnIR(playerId);
    if (result.success) {
      const player = db.prepare(
        `SELECT first_name, last_name, position, overall_rating, team_id FROM players WHERE id = ?`
      ).get(playerId) as any;
      const userTeamId = settingsRepo.getUserTeamId() ?? -1;
      if (player && player.team_id === userTeamId) {
        logNewsEvent({
          season: getCurrentSeason(),
          category: 'injury',
          headline: `${player.first_name} ${player.last_name} Placed on IR`,
          detail: `${player.position} · ${player.overall_rating} OVR — moved to injured reserve.`,
          playerId,
        });
      }
    }
    return result;
  });

  ipcMain.handle('activate-from-ir', (_event: IpcEvent, playerId: number) => {
    const result = activateFromIR(playerId);
    if (result.success) {
      const player = db.prepare(
        `SELECT first_name, last_name, position, overall_rating, team_id FROM players WHERE id = ?`
      ).get(playerId) as any;
      const userTeamId = settingsRepo.getUserTeamId() ?? -1;
      if (player && player.team_id === userTeamId) {
        logNewsEvent({
          season: getCurrentSeason(),
          category: 'injury',
          headline: `${player.first_name} ${player.last_name} Activated from IR`,
          detail: `${player.position} · ${player.overall_rating} OVR — returned to active roster.`,
          playerId,
        });
      }
    }
    return result;
  });

  ipcMain.handle('get-injury-history', (_event: IpcEvent, playerId: number) =>
    getInjuryHistory(playerId)
  );
}
