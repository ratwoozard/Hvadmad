import { test, expect } from "@playwright/test";

test.describe("Reduced motion (US5 — 002)", () => {
  test.use({ reducedMotion: "reduce" });

  test("landing page remains usable when reduced motion is requested", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

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
