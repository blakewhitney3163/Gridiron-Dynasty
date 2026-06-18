export type NewsCategory = 'transactions' | 'injuries' | 'draft' | 'season' | 'milestones' | 'all';

export interface NewsEvent {
  id: number;
  season: number;
  week: number;
  event_type: string;
  category: NewsCategory;
  headline: string;
  detail?: string;
  player_id?: number;
  team_name?: string;
  created_at: number;
}
