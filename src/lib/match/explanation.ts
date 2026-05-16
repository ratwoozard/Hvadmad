import type { MatchResult } from "@/types/voting";

export function generateExplanation(
  result: MatchResult,
  totalParticipants: number
): string {
  if (result.is_eliminated) {
    return `${result.no_count} ud af ${totalParticipants} sagde nej — det er for mange.`;
  }

  if (result.yes_count === totalParticipants) {
    return "Alle sagde ja! Perfekt match for gruppen.";
  }

  if (result.no_count === 0 && result.yes_count > result.maybe_count) {
    return `${result.yes_count} ud af ${totalParticipants} sagde ja, og ingen sagde nej!`;
  }

  if (result.no_count === 0) {
    return `Ingen sagde nej — ${result.yes_count} sagde ja og ${result.maybe_count} sagde måske.`;
  }

  if (result.yes_count > result.no_count * 2) {
    return `${result.yes_count} sagde ja — det opvejer de ${result.no_count} der sagde nej.`;
  }

  if (result.maybe_count >= totalParticipants / 2) {
    return `Godt kompromis: de fleste var positive eller neutrale.`;
  }

  return `${result.yes_count} ja, ${result.maybe_count} måske, ${result.no_count} nej — samlet en OK match.`;
}
