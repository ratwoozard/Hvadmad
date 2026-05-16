import { describe, it, expect } from "vitest";
import { calculateResults, getTopResults, hasAnyValidResult } from "@/lib/match/algorithm";
import type { Vote } from "@/types/voting";
import type { FoodOption } from "@/types/food";

const mockOptions: FoodOption[] = [
  { id: "opt-1", name: "Pizza", category: "takeaway", emoji: "🍕", description: null, tags: [] },
  { id: "opt-2", name: "Sushi", category: "takeaway", emoji: "🍣", description: null, tags: [] },
  { id: "opt-3", name: "Burger", category: "takeaway", emoji: "🍔", description: null, tags: [] },
];

function createVote(participantId: string, foodOptionId: string, value: 2 | 1 | -3): Vote {
  return {
    id: `vote-${Math.random()}`,
    room_id: "room-1",
    participant_id: participantId,
    food_option_id: foodOptionId,
    value,
    created_at: new Date().toISOString(),
  };
}

describe("calculateResults", () => {
  it("should rank options by total score", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", 2),
      createVote("p2", "opt-1", 2),
      createVote("p1", "opt-2", 1),
      createVote("p2", "opt-2", 1),
      createVote("p1", "opt-3", -3),
      createVote("p2", "opt-3", 1),
    ];

    const results = calculateResults(votes, mockOptions, 2);

    expect(results[0].food_option_id).toBe("opt-1");
    expect(results[1].food_option_id).toBe("opt-2");
    expect(results[2].food_option_id).toBe("opt-3");
  });

  it("should give Ja=+2, Måske=+1, Nej=-3", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", 2),
      createVote("p1", "opt-2", 1),
      createVote("p1", "opt-3", -3),
    ];

    const results = calculateResults(votes, mockOptions, 1);

    const pizza = results.find((r) => r.food_option_id === "opt-1")!;
    const sushi = results.find((r) => r.food_option_id === "opt-2")!;
    const burger = results.find((r) => r.food_option_id === "opt-3")!;

    expect(pizza.total_score).toBe(2);
    expect(sushi.total_score).toBe(1);
    expect(burger.total_score).toBe(-3);
  });

  it("should eliminate options with >50% nej votes", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", -3),
      createVote("p2", "opt-1", -3),
      createVote("p3", "opt-1", 2),
      // 2 out of 3 said no -> eliminated
      createVote("p1", "opt-2", 2),
      createVote("p2", "opt-2", 2),
      createVote("p3", "opt-2", 2),
    ];

    const results = calculateResults(votes, mockOptions, 3);
    const pizza = results.find((r) => r.food_option_id === "opt-1")!;
    const sushi = results.find((r) => r.food_option_id === "opt-2")!;

    expect(pizza.is_eliminated).toBe(true);
    expect(pizza.match_percentage).toBe(0);
    expect(sushi.is_eliminated).toBe(false);
  });

  it("should not eliminate when exactly 50% say nej", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", -3),
      createVote("p2", "opt-1", 2),
      // 1 out of 2 = 50%, not >50%
    ];

    const results = calculateResults(votes, mockOptions, 2);
    const pizza = results.find((r) => r.food_option_id === "opt-1")!;

    expect(pizza.is_eliminated).toBe(false);
  });

  it("should calculate match percentage correctly", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", 2),
      createVote("p2", "opt-1", 2),
    ];

    const results = calculateResults(votes, mockOptions, 2);
    const pizza = results.find((r) => r.food_option_id === "opt-1")!;

    // score=4, max=4 -> 100%
    expect(pizza.match_percentage).toBe(100);
  });

  it("should clamp negative percentages to 0", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", -3),
      createVote("p2", "opt-1", -3),
    ];

    const results = calculateResults(votes, mockOptions, 2);
    const pizza = results.find((r) => r.food_option_id === "opt-1")!;

    expect(pizza.match_percentage).toBe(0);
  });

  it("should generate explanations for all results", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", 2),
      createVote("p2", "opt-1", 2),
    ];

    const results = calculateResults(votes, mockOptions, 2);
    results.forEach((r) => {
      expect(r.explanation).toBeTruthy();
      expect(typeof r.explanation).toBe("string");
    });
  });
});

describe("getTopResults", () => {
  it("should return only non-eliminated results", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", -3),
      createVote("p2", "opt-1", -3),
      createVote("p3", "opt-1", -3),
      createVote("p1", "opt-2", 2),
      createVote("p2", "opt-2", 2),
      createVote("p3", "opt-2", 2),
    ];

    const results = calculateResults(votes, mockOptions, 3);
    const top = getTopResults(results, 5);

    expect(top.every((r) => !r.is_eliminated)).toBe(true);
  });

  it("should limit results to specified count", () => {
    const votes: Vote[] = [
      createVote("p1", "opt-1", 2),
      createVote("p1", "opt-2", 2),
      createVote("p1", "opt-3", 2),
    ];

    const results = calculateResults(votes, mockOptions, 1);
    const top = getTopResults(results, 2);

    expect(top.length).toBeLessThanOrEqual(2);
  });
});

describe("hasAnyValidResult", () => {
  it("should return true when valid results exist", () => {
    const results = [
      { match_percentage: 50, is_eliminated: false } as any,
    ];
    expect(hasAnyValidResult(results)).toBe(true);
  });

  it("should return false when all results are eliminated or zero", () => {
    const results = [
      { match_percentage: 0, is_eliminated: true } as any,
      { match_percentage: 0, is_eliminated: false } as any,
    ];
    expect(hasAnyValidResult(results)).toBe(false);
  });
});
