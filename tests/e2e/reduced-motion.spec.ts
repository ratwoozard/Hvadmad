import { test, expect } from "@playwright/test";

test.describe("Reduced motion (US5 — 002)", () => {
  test.use({ reducedMotion: "reduce" });

  test("cursor follower does not render its SVG when reduced motion is requested", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // CursorFollower returns plain <div>{children}</div> in reduced-motion mode.
    const svgs = page.locator('svg[aria-hidden="true"]');
    expect(await svgs.count()).toBe(0);

    // Page is still fully usable.
    await expect(
      page.getByRole("button", { name: /Opret madrum/ }),
    ).toBeVisible();
  });

  test("page navigation still works without animation jank", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Opret madrum/ }).click();
    await expect(page).toHaveURL(/\/opret$/);
    await expect(
      page.getByRole("heading", { name: /Opret madrum/ }),
    ).toBeVisible();
  });
});
