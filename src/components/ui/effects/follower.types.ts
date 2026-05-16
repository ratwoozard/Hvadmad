export interface Position {
  x: number;
  y: number;
}

export interface Point {
  position: Position;
  time: number;
  drift: Position;
  age: number;
  direction: Position;
}

export type ShapeKind = "circle" | "square" | "triangle";

export interface EngineOptions {
  colors: readonly string[];
  removeDelay: number;
  maxShapes: number;
  shapeChance: number;
  /** Optional clock for deterministic tests. Defaults to Date.now. */
  now?: () => number;
  /** Optional RNG for deterministic tests. Defaults to Math.random. */
  random?: () => number;
}

export const DEFAULT_ENGINE_OPTIONS: Readonly<
  Omit<EngineOptions, "now" | "random">
> = {
  colors: ["#f9a825", "#22c55e", "#f59e0b", "#ef4444", "#fab63d"],
  removeDelay: 400,
  maxShapes: 20,
  shapeChance: 0.1,
};
