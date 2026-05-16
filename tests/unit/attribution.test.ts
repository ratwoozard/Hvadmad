import { describe, it, expect } from "vitest";
import { groupVotesByOption } from "@/lib/avatars/attribution";
import type { Participant } from "@/types/room";
import type { Vote } from "@/types/voting";
import { VOTE_JA, VOTE_MAASKE, VOTE_NEJ } from "@/types/voting";

function p(id: string, nickname: string): Participant {
  return {
    id,
    room_id: "room-1",
    session_id: `sess-${id}`,
    nickname,
    is_host: false,
    status: "active",
    joined_at: "2026-01-01",
    last_seen: "2026-01-01",
    has_voted: true,
    avatar_id: "pizza",
    hat_ids: [],
  };
}

function v(participantId: string, foodId: string, value: Vote["value"]): Vote {
  return {
    id: `vote-${participantId}-${foodId}`,
    room_id: "room-1",
    participant_id: participantId,
    food_option_id: foodId,
    value,
    created_at: "2026-01-01",
  };
}

describe("groupVotesByOption", () => {
  it("returns an empty map when there are no votes", () => {
    expect(groupVotesByOption([], [p("a", "Anna")]).size).toBe(0);
  });

  it("groups one Ja, Måske and Nej vote across two options", () => {
    const participants = [p("a", "Anna"), p("b", "Ben"), p("c", "Cleo")];
    const votes = [
      v("a", "f1", VOTE_JA),
      v("b", "f1", VOTE_NEJ),
      v("c", "f1", VOTE_MAASKE),
      v("a", "f2", VOTE_NEJ),
    ];

    const result = groupVotesByOption(votes, participants);
    const f1 = result.get("f1")!;
    expect(f1.ja.map((p) => p.nickname)).toEqual(["Anna"]);
    expect(f1.nej.map((p) => p.nickname)).toEqual(["Ben"]);
    expect(f1.maaske.map((p) => p.nickname)).toEqual(["Cleo"]);

    const f2 = result.get("f2")!;
    expect(f2.ja).toEqual([]);
    expect(f2.maaske).toEqual([]);
    expect(f2.nej.map((p) => p.nickname)).toEqual(["Anna"]);
  });

  it("silently drops votes whose participant has been removed", () => {
    const result = groupVotesByOption(
      [v("ghost", "f1", VOTE_JA)],
      [p("a", "Anna")],
    );
    expect(result.size).toBe(0);
  });

  it("handles overflow group (more than 5 participants on Ja)", () => {
    const participants = Array.from({ length: 7 }, (_, i) =>
      p(`p${i}`, `User${i}`),
    );
    const votes = participants.map((part) => v(part.id, "f1", VOTE_JA));
    const result = groupVotesByOption(votes, participants);
    expect(result.get("f1")!.ja).toHaveLength(7);
    expect(result.get("f1")!.nej).toHaveLength(0);
  });

  it("creates an empty maaske / nej array when only Ja votes are cast", () => {
    const result = groupVotesByOption(
      [v("a", "f1", VOTE_JA)],
      [p("a", "Anna")],
    );
    const g = result.get("f1")!;
    expect(g.ja).toHaveLength(1);
    expect(g.maaske).toEqual([]);
    expect(g.nej).toEqual([]);
  });
});
