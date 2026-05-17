import { describe, it, expect } from "vitest";
import {
  AVATARS,
  HATS,
  addHat,
  getHat,
  getHatsForSlot,
  isValidConfig,
  removeHat,
} from "@/lib/avatars/catalog";
import { pickRandomDefault } from "@/lib/avatars/default";
import { MAX_HATS } from "@/types/avatar";

describe("avatar catalog", () => {
  it("provides at least 12 avatars (spec FR-002)", () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(12);
  });

  it("provides at least 15 hats (spec FR-003)", () => {
    expect(HATS.length).toBeGreaterThanOrEqual(15);
  });

  it("groups hats across all 4 slots", () => {
    const slots = new Set(HATS.map((h) => h.slot));
    expect(slots).toContain("head");
    expect(slots).toContain("eyes");
    expect(slots).toContain("mouth");
    expect(slots).toContain("neck");
  });

  it("has unique avatar and hat ids", () => {
    const avatarIds = new Set(AVATARS.map((a) => a.id));
    const hatIds = new Set(HATS.map((h) => h.id));
    expect(avatarIds.size).toBe(AVATARS.length);
    expect(hatIds.size).toBe(HATS.length);
  });
});

describe("addHat", () => {
  const headHat = HATS.find((h) => h.slot === "head")!;
  const anotherHeadHat = HATS.filter((h) => h.slot === "head")[1]!;
  const eyeHat = HATS.find((h) => h.slot === "eyes")!;
  const mouthHat = HATS.find((h) => h.slot === "mouth")!;
  const neckHat = HATS.find((h) => h.slot === "neck")!;

  it("adds a hat to an empty config", () => {
    const r = addHat([], headHat.id);
    expect(r.next).toEqual([headHat.id]);
    expect(r.replacedSlot).toBe(false);
    expect(r.rejectedMaxHats).toBe(false);
  });

  it("replaces an existing hat in the same slot (slot conflict)", () => {
    const r = addHat([headHat.id], anotherHeadHat.id);
    expect(r.next).toEqual([anotherHeadHat.id]);
    expect(r.replacedSlot).toBe(true);
  });

  it("toggles off when the same hat id is added again", () => {
    const r = addHat([headHat.id], headHat.id);
    expect(r.next).toEqual([]);
  });

  it("rejects a 4th hat when 3 different slots are full", () => {
    const start = [headHat.id, eyeHat.id, mouthHat.id];
    const r = addHat(start, neckHat.id);
    expect(r.rejectedMaxHats).toBe(true);
    expect(r.next).toEqual(start);
  });

  it("allows replacing a slot even when MAX_HATS is reached", () => {
    const start = [headHat.id, eyeHat.id, mouthHat.id];
    const r = addHat(start, anotherHeadHat.id);
    expect(r.rejectedMaxHats).toBe(false);
    expect(r.replacedSlot).toBe(true);
    expect(r.next).toHaveLength(MAX_HATS);
    expect(r.next).toContain(anotherHeadHat.id);
    expect(r.next).not.toContain(headHat.id);
  });

  it("ignores unknown hat ids", () => {
    const r = addHat([], "does-not-exist");
    expect(r.next).toEqual([]);
  });
});

describe("removeHat", () => {
  it("removes a hat by id, leaving others", () => {
    expect(removeHat(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });
  it("is a no-op when the id is absent", () => {
    expect(removeHat(["a", "b"], "z")).toEqual(["a", "b"]);
  });
});

describe("isValidConfig", () => {
  it("accepts an empty config", () => {
    expect(isValidConfig({ avatar_id: null, hat_ids: [] })).toBe(true);
  });
  it("rejects configs with more than MAX_HATS", () => {
    const ids = HATS.slice(0, MAX_HATS + 1).map((h) => h.id);
    expect(isValidConfig({ avatar_id: null, hat_ids: ids })).toBe(false);
  });
  it("rejects two hats in the same slot", () => {
    const head = HATS.filter((h) => h.slot === "head");
    expect(
      isValidConfig({
        avatar_id: null,
        hat_ids: [head[0].id, head[1].id],
      }),
    ).toBe(false);
  });
  it("accepts hats across 3 different slots", () => {
    const head = HATS.find((h) => h.slot === "head")!;
    const eyes = HATS.find((h) => h.slot === "eyes")!;
    const neck = HATS.find((h) => h.slot === "neck")!;
    expect(
      isValidConfig({
        avatar_id: null,
        hat_ids: [head.id, eyes.id, neck.id],
      }),
    ).toBe(true);
  });
});

describe("getHatsForSlot", () => {
  it("returns only hats matching the requested slot", () => {
    const headHats = getHatsForSlot("head");
    expect(headHats.length).toBeGreaterThan(0);
    expect(headHats.every((h) => h.slot === "head")).toBe(true);
  });
});

describe("getHat", () => {
  it("returns null for unknown ids", () => {
    expect(getHat("nope")).toBeNull();
  });
  it("returns the hat for known ids", () => {
    const known = HATS[0];
    expect(getHat(known.id)).toEqual(known);
  });
});

describe("pickRandomDefault", () => {
  it("returns a valid avatar id with no hats", () => {
    const cfg = pickRandomDefault(() => 0);
    expect(cfg.hat_ids).toEqual([]);
    expect(cfg.avatar_id).toBe(AVATARS[0].id);
  });
  it("uses the injected RNG", () => {
    const cfg = pickRandomDefault(() => 0.9999);
    expect(cfg.avatar_id).toBe(AVATARS[AVATARS.length - 1].id);
  });
});
