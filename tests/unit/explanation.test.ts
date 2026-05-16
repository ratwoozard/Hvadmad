import { describe, it, expect } from "vitest";
import { generateExplanation } from "@/lib/match/explanation";
import type { MatchResult } from "@/types/voting";

function mockResult(overrides: Partial<MatchResult>): MatchResult {
  return {
    food_option_id: "opt-1",
    name: "Pizza",
    emoji: "🍕",
    total_score: 4,
    max_possible_score: 4,
    match_percentage: 100,
    yes_count: 2,
    maybe_count: 0,
    no_count: 0,
    is_eliminated: false,
    explanation: "",
    ...overrides,
  };
}

describe("generateExplanation", () => {
  it("should explain unanimous yes", () => {
    const result = mockResult({ yes_count: 3, maybe_count: 0, no_count: 0 });
    const explanation = generateExplanation(result, 3);
    expect(explanation).toContain("Alle sagde ja");
  });

  it("should explain elimination", () => {
    const result = mockResult({ is_eliminated: true, no_count: 3 });
    const explanation = generateExplanation(result, 4);
    expect(explanation).toContain("nej");
    expect(explanation).toContain("for mange");
  });

  it("should explain no-nej scenario", () => {
    const result = mockResult({ yes_count: 2, maybe_count: 1, no_count: 0 });
    const explanation = generateExplanation(result, 3);
    expect(explanation).toContain("ingen sagde nej");
  });

  it("should explain mixed votes", () => {
    const result = mockResult({ yes_count: 2, maybe_count: 1, no_count: 1 });
    const explanation = generateExplanation(result, 4);
    expect(explanation.length).toBeGreaterThan(0);
  });

  it("should return Danish text", () => {
    const result = mockResult({ yes_count: 1, maybe_count: 3, no_count: 0 });
    const explanation = generateExplanation(result, 4);
    // Check for Danish words
    expect(
      explanation.includes("sagde") ||
      explanation.includes("ja") ||
      explanation.includes("måske") ||
      explanation.includes("kompromis") ||
      explanation.includes("positive")
    ).toBe(true);
  });
});
