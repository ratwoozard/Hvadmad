import { test, expect } from "@playwright/test";

const ROUTES = ["/", "/opret", "/solo", "/join/TEST"];

test.describe("WeGoDigital.dk footer link (US4 — 002)", () => {
  for (const route of ROUTES) {
    test(`is present and correctly configured on ${route}`, async ({
      page,
    }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const link = page.getByRole("link", { name: /WeGoDigital\.dk/i });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute(
        "href",
        "https://www.WeGoDigital.dk",
      );
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute(
        "rel",
        expect.stringContaining("noopener"),
      );
    });
  }

  test("footer link has touch-target ≥44×44 px", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const link = page.getByRole("link", { name: /WeGoDigital\.dk/i });
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
