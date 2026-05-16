export type VoteValue = 2 | 1 | -3;

export const VOTE_JA: VoteValue = 2;
export const VOTE_MAASKE: VoteValue = 1;
export const VOTE_NEJ: VoteValue = -3;

export interface Vote {
  id: string;
  room_id: string;
  participant_id: string;
  food_option_id: string;
  value: VoteValue;
  created_at: string;
}

export interface VotingSession {
  room_id: string;
  options: string[];
  current_index: number;
  votes: Record<string, VoteValue>;
  is_complete: boolean;
}

export interface MatchResult {
  food_option_id: string;
  name: string;
  emoji: string | null;
  total_score: number;
  max_possible_score: number;
  match_percentage: number;
  yes_count: number;
  maybe_count: number;
  no_count: number;
  is_eliminated: boolean;
  explanation: string;
}
