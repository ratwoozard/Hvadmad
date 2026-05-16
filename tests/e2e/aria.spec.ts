import { test, expect } from "@playwright/test";

test.describe("ARIA & landmarks (US5 — 002 + 003)", () => {
  test("landing page has a main landmark and a skip link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main#main")).toBeVisible();
    const skip = page.getByRole("link", { name: /Spring til indhold/i });
    // skip link is sr-only until focused — just confirm it's in the DOM.
    expect(await skip.count()).toBe(1);
  });

  test("opret character picker exposes radiogroup ARIA", async ({
    page,
  }) => {
    await page.goto("/opret");

    const picker = page.getByRole("radiogroup", { name: /Vælg en karakter/ });
    await expect(picker).toBeVisible();
  });

  test("characters in the picker have descriptive accessible names", async ({
    page,
  }) => {
    await page.goto("/opret");

    const firstAvatar = page
      .getByRole("radio", { name: /Pizza-karakter/ })
      .first();
    await expect(firstAvatar).toBeVisible();
  });
});
