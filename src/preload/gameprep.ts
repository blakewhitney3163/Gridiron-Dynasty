import { ipcRenderer } from 'electron';

export const gameprepApi = {
  setGameplan:        (p: { season: number; week: number; offense: string; defense: string }) =>
                        ipcRenderer.invoke('set-gameplan', p),
  getGameplan:        (p: { season: number; week: number }) =>
                        ipcRenderer.invoke('get-gameplan', p),
  scoutOpponent:      (p: { opponentTeamId: number; season: number; week: number }) =>
                        ipcRenderer.invoke('scout-opponent', p),
  isOpponentScouted:  (p: { season: number; week: number }) =>
                        ipcRenderer.invoke('is-opponent-scouted', p),
  getScouts:          (teamId: number) => ipcRenderer.invoke('get-scouts', teamId),
  getAvailableScouts: () => ipcRenderer.invoke('get-available-scouts'),
  hireScout:          (p: { teamId: number; scoutId: number }) => ipcRenderer.invoke('hire-scout', p),
  fireScout:          (id: number) => ipcRenderer.invoke('fire-scout', id),
  getWeeklyScoutPts:  (teamId: number) => ipcRenderer.invoke('get-weekly-scout-pts', teamId),
  getGamePlayLog:     (gameId: number) => ipcRenderer.invoke('get-game-play-log', gameId),
  getNewsUnseenCount: (season: number) => ipcRenderer.invoke('get-news-unseen-count', season),
  markNewsSeen:       (season: number) => ipcRenderer.invoke('mark-news-seen', season),
};
