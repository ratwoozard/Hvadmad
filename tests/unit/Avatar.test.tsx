import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/avatar/Avatar";
import { AVATARS } from "@/lib/avatars/catalog";

describe("<Avatar>", () => {
  it("renders a placeholder when no avatar is configured", () => {
    const { container } = render(<Avatar config={null} />);
    expect(container.querySelector('[role="img"]')).toBeInTheDocument();
    expect(container.textContent).toContain("👤");
  });

  it("renders the character image when avatar_id is provided", () => {
    const pizza = AVATARS.find((a) => a.id === "pizza")!;
    const { container } = render(
      <Avatar config={{ avatar_id: pizza.id, hat_ids: [] }} />,
    );
    const el = screen.getByRole("img");
    expect(el).toHaveAttribute("aria-label", pizza.altText);
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      encodeURIComponent(pizza.imageSrc),
    );
  });

  it("keeps the character label even if legacy hats are present", () => {
    const pizza = AVATARS.find((a) => a.id === "pizza")!;
    render(
      <Avatar
        config={{
          avatar_id: pizza.id,
          hat_ids: ["tophat", "glasses"],
        }}
      />,
    );
    const el = screen.getByRole("img");
    expect(el).toHaveAttribute("aria-label", pizza.altText);
  });

  it("respects size prop via inline width/height", () => {
    const { rerender, container } = render(
      <Avatar config={null} size="sm" />,
    );
    const sm = container.querySelector('[role="img"]') as HTMLElement;
    expect(sm.style.width).toBe("32px");
    expect(sm.style.height).toBe("32px");

    rerender(<Avatar config={null} size="lg" />);
    const lg = container.querySelector('[role="img"]') as HTMLElement;
    expect(lg.style.width).toBe("96px");
  });

  it("applies muted styling for inactive participants", () => {
    const { container } = render(<Avatar config={null} muted />);
    const el = container.querySelector('[role="img"]') as HTMLElement;
    expect(el.className).toContain("opacity-50");
    expect(el.className).toContain("grayscale");
  });

  it("falls back to a generic label for an unknown avatar id", () => {
    render(<Avatar config={{ avatar_id: "does-not-exist", hat_ids: [] }} />);
    const el = screen.getByRole("img");
    expect(el).toHaveAttribute("aria-label", "Ukendt avatar");
  });

  it("uses custom altText when provided", () => {
    render(
      <Avatar
        config={{ avatar_id: "pizza", hat_ids: [] }}
        altText="Christian (dig)"
      />,
    );
    expect(
      screen.getByRole("img").getAttribute("aria-label"),
    ).toBe("Christian (dig)");
  });
});
