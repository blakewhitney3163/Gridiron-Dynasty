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
  // Expanded Madden-style attrs (v27)
  acceleration: number | null; agility: number | null;
  throw_under_pressure: number | null; play_action: number | null;
  elusiveness: number | null; trucking: number | null; break_tackle: number | null;
  spectacular_catch: number | null; catch_in_traffic: number | null; release_rating: number | null;
  hit_power: number | null; pursuit: number | null;
  block_shedding: number | null; power_moves: number | null; finesse_moves: number | null;
  play_recognition: number | null; man_coverage: number | null;
}

export interface CoachRow { role: string; overall_rating: number; offense_rating: number; defense_rating: number; }
export interface SchemeRow { offense_scheme: string; defense_scheme: string; }

export interface TeamData {
  teamId: number;
  players: PlayerRow[];
  coaches: CoachRow[];
  scheme: SchemeRow | null;
  chemistry: number;
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
