import { test, expect } from "@playwright/test";

test.describe("Vote card swipe (US3 — 002)", () => {
  test("voting in solo mode shows next card after a vote", async ({ page }) => {
    await page.goto("/solo");
    await page.waitForLoadState("networkidle");

    // Pick "Stem om kategori" so we get a deterministic, network-light flow.
    await page
      .getByRole("button", { name: /Stem om kategori/ })
      .click();

    await page.getByRole("button", { name: /Start afstemning/ }).click();

    // First card should appear.
    await expect(
      page.locator("text=/Du stemmer solo|Stem på/").first(),
    ).toBeVisible({ timeout: 10_000 });

    const yesButton = page.getByRole("button", { name: /^👍 Ja!/ });
    await expect(yesButton).toBeVisible();

    // Capture progress before the vote.
    const progress = page.getByLabel(/Fremgang/);
    const before = (await progress.textContent())?.trim() ?? "";

    await yesButton.click();

    // After the swipe animation completes, the counter should have moved.
    await expect
      .poll(async () => (await progress.textContent())?.trim() ?? "", {
        timeout: 4000,
      })
      .not.toBe(before);
  });

  test("arrow keys vote on the active card", async ({ page }) => {
    await page.goto("/solo");
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: /Stem om kategori/ })
      .click();
    await page.getByRole("button", { name: /Start afstemning/ }).click();

    const progress = page.getByLabel(/Fremgang/);
    await expect(progress).toBeVisible({ timeout: 10_000 });
    const before = (await progress.textContent())?.trim() ?? "";

    await page.keyboard.press("ArrowUp"); // = Ja

    await expect
      .poll(async () => (await progress.textContent())?.trim() ?? "", {
        timeout: 4000,
      })
      .not.toBe(before);
  });
});
