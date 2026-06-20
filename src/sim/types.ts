import type { PlayerStats } from '../types';

export type WeatherType = 'clear' | 'rain' | 'wind' | 'snow';

export interface PlayerRow {
  id: number;
  position: string;
  overall_rating: number;
  morale: number;
  depth_slot: number;
  speed: number | null; strength: number | null; awareness: number | null;
  throw_accuracy: number | null; throw_power: number | null;
  catching: number | null; route_running: number | null;
  tackle_rating: number | null; coverage: number | null; pass_rush: number | null;
}

export interface CoachRow { role: string; overall_rating: number; offense_rating: number; defense_rating: number; }
export interface SchemeRow { offense_scheme: string; defense_scheme: string; }

export interface TeamData {
  teamId: number;
  players: PlayerRow[];
  coaches: CoachRow[];
  scheme: SchemeRow | null;
}

export interface TeamRatings { offenseRating: number; defenseRating: number; }

export interface WeatherMultipliers {
  score: number; passYards: number; compPct: number;
  rushYards: number; rushAttempts: number;
}

export interface ScoringEvents { tds: number; fgs: number; }

export type GamePlayerStat = Omit<PlayerStats, 'game_id'>;

export interface SimResult {
  homeScore: number; awayScore: number;
  homeQuarters: number[]; awayQuarters: number[];
  weather: WeatherType;
  homePlayerStats: GamePlayerStat[];
  awayPlayerStats: GamePlayerStat[];
}
