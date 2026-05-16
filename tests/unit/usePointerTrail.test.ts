import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePointerTrail } from "@/hooks/usePointerTrail";

function firePointerMove(x: number, y: number) {
  const event = new Event("pointermove") as Event & {
    clientX: number;
    clientY: number;
  };
  Object.defineProperty(event, "clientX", { value: x });
  Object.defineProperty(event, "clientY", { value: y });
  window.dispatchEvent(event);
}

describe("usePointerTrail", () => {
  it("invokes callback with window coordinates when no target ref provided", () => {
    const onMove = vi.fn();
    renderHook(() => usePointerTrail(onMove));

    firePointerMove(120, 75);
    firePointerMove(200, 300);

    expect(onMove).toHaveBeenCalledTimes(2);
    expect(onMove).toHaveBeenNthCalledWith(1, { x: 120, y: 75 });
    expect(onMove).toHaveBeenNthCalledWith(2, { x: 200, y: 300 });
  });

  it("does not bind listeners when enabled is false", () => {
    const onMove = vi.fn();
    renderHook(() => usePointerTrail(onMove, { enabled: false }));

    firePointerMove(50, 50);
    expect(onMove).not.toHaveBeenCalled();
  });

  it("removes the pointermove listener on unmount", () => {
    const onMove = vi.fn();
    const { unmount } = renderHook(() => usePointerTrail(onMove));

    firePointerMove(10, 10);
    expect(onMove).toHaveBeenCalledTimes(1);

    unmount();
    firePointerMove(20, 20);
    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it("computes coordinates relative to target element", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    el.getBoundingClientRect = () =>
      ({
        left: 30,
        top: 40,
        right: 130,
        bottom: 140,
        width: 100,
        height: 100,
        x: 30,
        y: 40,
        toJSON: () => ({}),
      }) as DOMRect;

    const ref = { current: el };
    const onMove = vi.fn();
    renderHook(() => usePointerTrail(onMove, { targetRef: ref }));

    firePointerMove(80, 90);
    expect(onMove).toHaveBeenCalledWith({ x: 50, y: 50 });

    document.body.removeChild(el);
  });
});
