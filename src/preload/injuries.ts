import { ipcRenderer } from 'electron';

export const injuriesApi = {
  getTeamInjuries: (teamId?: number) =>
    ipcRenderer.invoke('get-team-injuries', teamId),

  placeOnIR: (playerId: number) =>
    ipcRenderer.invoke('place-on-ir', playerId),

  activateFromIR: (playerId: number) =>
    ipcRenderer.invoke('activate-from-ir', playerId),

  getInjuryHistory: (playerId: number) =>
    ipcRenderer.invoke('get-injury-history', playerId),
};
