import type { Participant } from "@/types/room";
import type { MatchResult, Vote } from "@/types/voting";

/**
 * Helpers that derive the secondary insights shown on the results page
 * (most/least voted, closest race, per-participant top pick, total votes).
 * Kept separate from `algorithm.ts` so the core scoring stays focused on
 * the ranked match list.
 */

/**
 * Number of *positive* votes (Ja + Måske) cast for a single option.
 * This is the "stemmer pr. ret" metric — intuitive for users because it
 * counts heads, not weighted scores.
 */
export function positiveVoteCount(result: MatchResult): number {
  return result.yes_count + result.maybe_count;
}

export interface VotedExtreme {
  result: MatchResult;
  count: number;
}

/**
 * Find the option with the most positive votes.
 * Ties are broken by match percentage. Returns null when no results exist.
 */
export function getMostVoted(results: MatchResult[]): VotedExtreme | null {
  const valid = results.filter((r) => !r.is_eliminated);
  if (valid.length === 0) return null;

  return valid.reduce<VotedExtreme>((acc, result) => {
    const count = positiveVoteCount(result);
    if (count > acc.count) return { result, count };
    if (count === acc.count && result.match_percentage > acc.result.match_percentage) {
      return { result, count };
    }
    return acc;
  }, { result: valid[0], count: positiveVoteCount(valid[0]) });
}

/**
 * Find the option with the *fewest* positive votes among the non-eliminated
 * results. We only consider non-eliminated entries so the "Mindst stemt"
 * card still highlights something the group considered, not a flat reject.
 */
export function getLeastVoted(results: MatchResult[]): VotedExtreme | null {
  const valid = results.filter((r) => !r.is_eliminated);
  if (valid.length === 0) return null;

  return valid.reduce<VotedExtreme>((acc, result) => {
    const count = positiveVoteCount(result);
    if (count < acc.count) return { result, count };
    if (count === acc.count && result.match_percentage < acc.result.match_percentage) {
      return { result, count };
    }
    return acc;
  }, { result: valid[0], count: positiveVoteCount(valid[0]) });
}

export interface ClosestMatchPair {
  first: MatchResult;
  second: MatchResult;
  /** Difference in positive vote count (always ≥ 0). */
  voteGap: number;
  /** Difference in match percentage (always ≥ 0). */
  percentGap: number;
}

/**
 * Returns the top two non-eliminated results, framed as a head-to-head.
 * Returns null when fewer than two valid results exist.
 */
export function getClosestMatch(results: MatchResult[]): ClosestMatchPair | null {
  const valid = results.filter((r) => !r.is_eliminated);
  if (valid.length < 2) return null;

  const sorted = [...valid].sort(
    (a, b) => b.match_percentage - a.match_percentage,
  );
  const [first, second] = sorted;

  return {
    first,
    second,
    voteGap: Math.abs(positiveVoteCount(first) - positiveVoteCount(second)),
    percentGap: Math.abs(first.match_percentage - second.match_percentage),
  };
}

export interface ParticipantPick {
  participant: Participant;
  /** The option this participant liked the most, or null if they only voted Nej (or didn't vote). */
  pick: MatchResult | null;
}

/**
 * For each participant, find the food option they personally rated highest.
 * Selection rules:
 *   1. Prefer Ja (+2) over Måske (+1); Nej and missing votes never win.
 *   2. Tie-break by the group's match percentage so the listed pick feels
 *      like the participant's *meaningful* favourite, not an arbitrary one.
 *   3. Participants with only Nej votes (or no votes at all) get `pick: null`.
 */
export function getParticipantTopPicks(
  participants: readonly Participant[],
  votes: readonly Vote[],
  results: readonly MatchResult[],
): ParticipantPick[] {
  const resultsById = new Map(results.map((r) => [r.food_option_id, r]));

  return participants.map((participant) => {
    const own = votes.filter(
      (v) => v.participant_id === participant.id && v.value > 0,
    );

    if (own.length === 0) return { participant, pick: null };

    const ranked = [...own].sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      const aPct = resultsById.get(a.food_option_id)?.match_percentage ?? 0;
      const bPct = resultsById.get(b.food_option_id)?.match_percentage ?? 0;
      return bPct - aPct;
    });

    const top = ranked[0];
    const pick = resultsById.get(top.food_option_id) ?? null;
    return { participant, pick };
  });
}
