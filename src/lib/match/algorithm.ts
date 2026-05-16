import type { Vote, VoteValue, MatchResult } from "@/types/voting";
import type { FoodOption } from "@/types/food";
import { generateExplanation } from "./explanation";

const VOTE_JA: VoteValue = 2;
const VOTE_NEJ: VoteValue = -3;

export function calculateResults(
  votes: Vote[],
  foodOptions: FoodOption[],
  totalParticipants: number
): MatchResult[] {
  const maxPossibleScore = totalParticipants * VOTE_JA;

  const results: MatchResult[] = foodOptions.map((option) => {
    const optionVotes = votes.filter(
      (v) => v.food_option_id === option.id
    );

    const yesCount = optionVotes.filter((v) => v.value === 2).length;
    const maybeCount = optionVotes.filter((v) => v.value === 1).length;
    const noCount = optionVotes.filter((v) => v.value === -3).length;

    const totalScore = optionVotes.reduce((sum, v) => sum + v.value, 0);
    const isEliminated = noCount > totalParticipants / 2;

    const matchPercentage = Math.max(
      0,
      Math.round((totalScore / maxPossibleScore) * 100)
    );

    return {
      food_option_id: option.id,
      name: option.name,
      emoji: option.emoji,
      total_score: totalScore,
      max_possible_score: maxPossibleScore,
      match_percentage: isEliminated ? 0 : matchPercentage,
      yes_count: yesCount,
      maybe_count: maybeCount,
      no_count: noCount,
      is_eliminated: isEliminated,
      explanation: "",
    };
  });

  const ranked = results
    .sort((a, b) => {
      if (a.is_eliminated && !b.is_eliminated) return 1;
      if (!a.is_eliminated && b.is_eliminated) return -1;
      return b.match_percentage - a.match_percentage;
    });

  return ranked.map((result) => ({
    ...result,
    explanation: generateExplanation(result, totalParticipants),
  }));
}

export function getTopResults(
  results: MatchResult[],
  count: number = 5
): MatchResult[] {
  return results.filter((r) => !r.is_eliminated).slice(0, count);
}

export function hasAnyValidResult(results: MatchResult[]): boolean {
  return results.some((r) => !r.is_eliminated && r.match_percentage > 0);
}
