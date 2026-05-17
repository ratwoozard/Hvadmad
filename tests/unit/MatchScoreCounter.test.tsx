import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MatchScoreCounter } from "@/components/results/MatchScoreCounter";

describe("MatchScoreCounter", () => {
  it("renders an element with a percentage suffix", () => {
    render(<MatchScoreCounter target={42} />);
    const el = screen.getByLabelText(/Match: 42%/);
    expect(el).toBeInTheDocument();
    expect(el.textContent ?? "").toMatch(/%$/);
  });

  it("uses aria-live=polite so screen readers announce the final value", () => {
    render(<MatchScoreCounter target={88} />);
    const el = screen.getByLabelText(/Match: 88%/);
    expect(el.getAttribute("aria-live")).toBe("polite");
  });

  it("renders the target value when reduced motion is active", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    render(<MatchScoreCounter target={73} />);
    const el = screen.getByLabelText(/Match: 73%/);
    expect(el.textContent).toBe("73%");
  });

  it("supports custom suffix", () => {
    render(<MatchScoreCounter target={50} suffix=" point" />);
    expect(screen.getByLabelText(/Match: 50 point/)).toBeInTheDocument();
  });
});
