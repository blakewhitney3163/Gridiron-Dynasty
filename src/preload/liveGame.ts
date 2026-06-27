import { ipcRenderer } from 'electron';

export const liveGameApi = {
  startLiveGame: (gameId: number) =>
    ipcRenderer.invoke('start-live-game', gameId),

  simLivePlay: (gameId: number, decision?: any) =>
    ipcRenderer.invoke('sim-live-play', gameId, decision ?? null),

  simLiveToEnd: (gameId: number) =>
    ipcRenderer.invoke('sim-live-to-end', gameId),

  finalizeLiveGame: (gameId: number) =>
    ipcRenderer.invoke('finalize-live-game', gameId),

  abortLiveGame: (gameId: number) =>
    ipcRenderer.invoke('abort-live-game', gameId),
};
