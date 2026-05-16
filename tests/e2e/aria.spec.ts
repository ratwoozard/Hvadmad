import { test, expect } from "@playwright/test";

test.describe("ARIA & landmarks (US5 — 002 + 003)", () => {
  test("landing page has a main landmark and a skip link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main#main")).toBeVisible();
    const skip = page.getByRole("link", { name: /Spring til indhold/i });
    // skip link is sr-only until focused — just confirm it's in the DOM.
    expect(await skip.count()).toBe(1);
  });

  test("cursor SVG is marked aria-hidden so screen readers ignore it", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const svgs = page.locator('svg[aria-hidden="true"]');
    expect(await svgs.count()).toBeGreaterThanOrEqual(1);
  });

  test("opret avatar picker exposes dialog ARIA when opened", async ({
    page,
  }) => {
    await page.goto("/opret");
    await page.getByLabel(/Dit nickname/).fill("AriaTester");
    await page.getByRole("button", { name: /Vælg avatar/ }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  test("avatars in the picker have descriptive accessible names", async ({
    page,
  }) => {
    await page.goto("/opret");
    await page.getByLabel(/Dit nickname/).fill("AriaTester");
    await page.getByRole("button", { name: /Vælg avatar/ }).click();

    const firstAvatar = page
      .getByRole("button", { name: /Pizza-avatar/ })
      .first();
    await expect(firstAvatar).toBeVisible();
  });
});
