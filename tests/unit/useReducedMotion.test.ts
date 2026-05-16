import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Listener = (e: { matches: boolean }) => void;

interface FakeMql {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: (cb: Listener) => void;
  removeListener: (cb: Listener) => void;
  addEventListener: (type: string, cb: Listener) => void;
  removeEventListener: (type: string, cb: Listener) => void;
  dispatchEvent: () => boolean;
  __fire: (matches: boolean) => void;
}

function makeFakeMql(initial: boolean): FakeMql {
  const listeners = new Set<Listener>();
  return {
    matches: initial,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: (cb) => listeners.add(cb),
    removeListener: (cb) => listeners.delete(cb),
    addEventListener: (_type, cb) => listeners.add(cb),
    removeEventListener: (_type, cb) => listeners.delete(cb),
    dispatchEvent: () => false,
    __fire(matches: boolean) {
      this.matches = matches;
      for (const cb of listeners) cb({ matches });
    },
  };
}

describe("useReducedMotion", () => {
  let mql: FakeMql;

  beforeEach(() => {
    mql = makeFakeMql(false);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => mql),
    );
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: window.matchMedia ?? (() => mql),
    });
    window.matchMedia = (() => mql) as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when reduced-motion is not requested", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when reduced-motion is requested at mount time", () => {
    mql = makeFakeMql(true);
    window.matchMedia = (() => mql) as typeof window.matchMedia;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the media query value changes", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      mql.__fire(true);
    });

    expect(result.current).toBe(true);
  });
});
