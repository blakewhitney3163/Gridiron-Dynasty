import { ipcRenderer } from 'electron';

export const coachingApi = {
  getCoachingStaff: (teamId: number) =>
    ipcRenderer.invoke('get-coaching-staff', teamId),

  getAvailableCoaches: (role?: string) =>
    ipcRenderer.invoke('get-available-coaches', role),

  hireCoach: (payload: { teamId: number; coachId: number }) =>
    ipcRenderer.invoke('hire-coach', payload),

  fireCoach: (coachId: number) =>
    ipcRenderer.invoke('fire-coach', coachId),

  getTeamScheme: (teamId: number) =>
    ipcRenderer.invoke('get-team-scheme', teamId),

  getSchemeOptions: (teamId: number) =>
    ipcRenderer.invoke('get-scheme-options', teamId),

  setTeamScheme: (payload: { teamId: number; offenseScheme?: string; defenseScheme?: string }) =>
    ipcRenderer.invoke('set-team-scheme', payload),
};
