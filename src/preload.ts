import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
    getStandings: (season: number) => ipcRenderer.invoke('get-standings', season)
});