import type { MatchResult } from "@/types/voting";

export function normalizePercentage(
  score: number,
  maxScore: number
): number {
  if (maxScore <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((score / maxScore) * 100)));
}

export function getMatchLevel(
  percentage: number
): "excellent" | "good" | "okay" | "poor" {
  if (percentage >= 80) return "excellent";
  if (percentage >= 60) return "good";
  if (percentage >= 40) return "okay";
  return "poor";
}

export function getMatchColor(level: ReturnType<typeof getMatchLevel>): string {
  switch (level) {
    case "excellent":
      return "text-green-600";
    case "good":
      return "text-emerald-500";
    case "okay":
      return "text-amber-500";
    case "poor":
      return "text-red-500";
  }
}
