import { describe, it, expect, beforeEach } from "vitest";
import { mountFollowerEngine } from "@/components/ui/effects/follower-engine";

function createStage(): SVGSVGElement {
  const stage = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  ) as SVGSVGElement;
  document.body.appendChild(stage);
  return stage;
}

describe("follower-engine", () => {
  let stage: SVGSVGElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    stage = createStage();
  });

  describe("point trimming", () => {
    it("trims a point when its age exceeds removeDelay", () => {
      let clock = 1000;
      const engine = mountFollowerEngine(stage, {
        colors: ["#000"],
        removeDelay: 100,
        now: () => clock,
        random: () => 0.5,
      });

      engine.addPoint({ x: 10, y: 10 });
      expect(engine.totalPoints).toBe(1);

      clock = 1050;
      engine.tick();
      expect(engine.totalPoints).toBe(1);

      clock = 1200;
      engine.tick();
      expect(engine.totalPoints).toBe(0);
    });

    it("trims one point per tick, in oldest-first order", () => {
      let clock = 0;
      const engine = mountFollowerEngine(stage, {
        colors: ["#000"],
        removeDelay: 50,
        now: () => clock,
        random: () => 0.5,
      });

      engine.addPoint({ x: 0, y: 0 });
      clock = 20;
      engine.addPoint({ x: 1, y: 1 });
      clock = 40;
      engine.addPoint({ x: 2, y: 2 });

      expect(engine.totalPoints).toBe(3);

      clock = 100;
      engine.tick();
      expect(engine.totalPoints).toBe(2);

      engine.tick();
      expect(engine.totalPoints).toBe(1);

      engine.tick();
      expect(engine.totalPoints).toBe(0);
    });
  });

  describe("shape cap", () => {
    it("never spawns more shapes than maxShapes at the same time", () => {
      const engine = mountFollowerEngine(stage, {
        colors: ["#000"],
        removeDelay: 60_000,
        maxShapes: 3,
        shapeChance: 1,
        now: () => 0,
        random: () => 0,
      });

      for (let i = 0; i < 20; i++) {
        engine.addPoint({ x: i, y: i });
      }

      expect(engine.totalShapes).toBeLessThanOrEqual(3);
    });

    it("does not spawn shapes when shapeChance is zero", () => {
      const engine = mountFollowerEngine(stage, {
        colors: ["#000"],
        shapeChance: 0,
        now: () => 0,
        random: () => 0,
      });

      for (let i = 0; i < 10; i++) {
        engine.addPoint({ x: i, y: i });
      }

      expect(engine.totalShapes).toBe(0);
    });
  });

  describe("colour rotation", () => {
    it("creates one follower per provided colour", () => {
      const engine = mountFollowerEngine(stage, {
        colors: ["#f00", "#0f0", "#00f", "#ff0", "#fff"],
      });
      expect(engine.followerCount).toBe(5);
    });

    it("adds the point to every follower", () => {
      const engine = mountFollowerEngine(stage, {
        colors: ["#a", "#b", "#c"],
        now: () => 0,
        random: () => 0.5,
      });
      engine.addPoint({ x: 1, y: 1 });
      expect(engine.totalPoints).toBe(3);
    });

    it("renders one <path> per follower in the SVG", () => {
      mountFollowerEngine(stage, {
        colors: ["#a", "#b", "#c"],
      });
      const paths = stage.querySelectorAll("path");
      expect(paths.length).toBe(3);
    });
  });

  describe("destroy", () => {
    it("removes its <path> elements from the SVG on destroy", () => {
      const engine = mountFollowerEngine(stage, {
        colors: ["#a", "#b"],
      });
      expect(stage.querySelectorAll("path").length).toBe(2);

      engine.destroy();
      expect(stage.querySelectorAll("path").length).toBe(0);
      expect(engine.totalPoints).toBe(0);
    });
  });
});
