import { test, expect } from "@playwright/test";

test.describe("Cursor follower (US1 — 002)", () => {
  test("mousemove on the landing page renders SVG <path> elements", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The CursorFollower mounts an <svg> with aria-hidden="true" wrapping the hero.
    const svg = page.locator('svg[aria-hidden="true"]').first();
    await expect(svg).toBeVisible({ timeout: 5000 });

    // No paths until pointer moves.
    expect(await svg.locator("path").count()).toBe(0);

    // Move the mouse across the hero to trigger trail point creation.
    const box = await svg.boundingBox();
    if (!box) test.fail(true, "SVG bounding box not available");
    if (box) {
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const x = box.x + (box.width * (i + 1)) / steps;
        const y = box.y + box.height / 2 + Math.sin(i) * 30;
        await page.mouse.move(x, y, { steps: 3 });
      }
    }

    // 5 colours × N points should produce >=5 path elements quickly.
    await expect
      .poll(async () => svg.locator("path").count(), { timeout: 3000 })
      .toBeGreaterThanOrEqual(5);
  });

  test("clicks pass through the cursor layer to the underlying button", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The Opret-button sits underneath the cursor SVG; pointer-events: none
    // on the SVG ensures the click reaches the button.
    await page.getByRole("button", { name: /Opret madrum/ }).click();
    await expect(page).toHaveURL(/\/opret$/);
  });
});
