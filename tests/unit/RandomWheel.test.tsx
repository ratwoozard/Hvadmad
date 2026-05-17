import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { RandomWheel, type WheelOption } from "@/components/results/RandomWheel";

const OPTIONS: WheelOption[] = [
  { id: "a", name: "Pizza", emoji: "🍕" },
  { id: "b", name: "Sushi", emoji: "🍣" },
  { id: "c", name: "Burger", emoji: "🍔" },
  { id: "d", name: "Salat", emoji: "🥗" },
];

describe("RandomWheel", () => {
  it("renders an SVG with one slice per option", () => {
    const { container } = render(
      <RandomWheel options={OPTIONS} onResult={() => {}} random={() => 0} />,
    );
    const paths = container.querySelectorAll("svg path");
    expect(paths.length).toBe(OPTIONS.length);
  });

  it("calls onResult with the option pointed to by the injected RNG", async () => {
    const onResult = vi.fn();
    render(
      <RandomWheel
        options={OPTIONS}
        onResult={onResult}
        random={() => 0.5}
        duration={0.05}
      />,
    );

    await waitFor(() => expect(onResult).toHaveBeenCalled(), {
      timeout: 3000,
    });

    const expectedIndex = Math.floor(0.5 * OPTIONS.length);
    expect(onResult).toHaveBeenCalledWith(OPTIONS[expectedIndex]);
  });

  it("returns null when no options are provided", () => {
    const { container } = render(
      <RandomWheel options={[]} onResult={() => {}} />,
    );
    expect(container.querySelector("svg")).toBeNull();
  });

  it("includes an accessible <title> describing the widget", () => {
    const { container } = render(
      <RandomWheel options={OPTIONS} onResult={() => {}} />,
    );
    const title = container.querySelector("svg title");
    expect(title?.textContent).toMatch(/tilfældig vælger/i);
  });
});
