import type { Participant } from "@/types/room";
import type { Vote, VoteValue } from "@/types/voting";
import { VOTE_JA, VOTE_MAASKE, VOTE_NEJ } from "@/types/voting";

export interface AttributionGroup {
  ja: Participant[];
  maaske: Participant[];
  nej: Participant[];
}

function bucketForValue(value: VoteValue): keyof AttributionGroup | null {
  if (value === VOTE_JA) return "ja";
  if (value === VOTE_MAASKE) return "maaske";
  if (value === VOTE_NEJ) return "nej";
  return null;
}

/**
 * Group all votes by food option, attaching the participant who cast each
 * vote so the UI can render "Christian + Sofia sagde ja, Mads sagde nej".
 *
 * Returns a Map keyed by food option id. Missing participants (e.g. a
 * participant who left) are silently dropped — their vote still counts in
 * the algorithm but they no longer have a face to attach to it.
 */
export function groupVotesByOption(
  votes: readonly Vote[],
  participants: readonly Participant[],
): Map<string, AttributionGroup> {
  const byId = new Map<string, Participant>(
    participants.map((p) => [p.id, p]),
  );
  const result = new Map<string, AttributionGroup>();

  for (const vote of votes) {
    const participant = byId.get(vote.participant_id);
    if (!participant) continue;

    let group = result.get(vote.food_option_id);
    if (!group) {
      group = { ja: [], maaske: [], nej: [] };
      result.set(vote.food_option_id, group);
    }

    const bucket = bucketForValue(vote.value);
    if (bucket) {
      group[bucket].push(participant);
    }
  }

  return result;
}

export const EMPTY_GROUP: AttributionGroup = Object.freeze({
  ja: [],
  maaske: [],
  nej: [],
}) as AttributionGroup;
