import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the home page with header", async ({ page }) => {
    await page.goto("/");

    // Check header
    await expect(page.locator("text=Quiz Platform")).toBeVisible();

    // Check hero section
    await expect(
      page.locator("h1:has-text('クイズを作って')")
    ).toBeVisible();

    // Check CTA buttons
    await expect(page.locator("text=クイズを作成する")).toBeVisible();
    await expect(page.locator("text=クイズを探す")).toBeVisible();
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");

    // Click search link
    await page.click("text=検索");
    await expect(page).toHaveURL("/search");

    // Go back and click login
    await page.goto("/");
    await page.click("text=ログイン");
    await expect(page).toHaveURL("/login");
  });

  test("should display categories section", async ({ page }) => {
    await page.goto("/");

    // Check categories section exists
    await expect(page.locator("text=カテゴリから探す")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Header should still be visible
    await expect(page.locator("text=Quiz Platform")).toBeVisible();

    // Hero text should be visible
    await expect(
      page.locator("h1:has-text('クイズを作って')")
    ).toBeVisible();
  });
});

test.describe("Search Page", () => {
  test("should display search page", async ({ page }) => {
    await page.goto("/search");

    await expect(page.locator("h1:has-text('クイズを検索')")).toBeVisible();
  });

  test("should have search input", async ({ page }) => {
    await page.goto("/search");

    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();
  });
});

test.describe("Login Page", () => {
  test("should display login page with OAuth options", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1:has-text('ログイン')")).toBeVisible();

    // Check OAuth buttons
    await expect(page.locator("text=Googleでログイン")).toBeVisible();
    await expect(page.locator("text=GitHubでログイン")).toBeVisible();
  });
});

test.describe("404 Page", () => {
  test("should display 404 page for non-existent routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    await expect(page.locator("text=404")).toBeVisible();
    await expect(page.locator("text=ページが見つかりません")).toBeVisible();
    await expect(page.locator("text=トップページ")).toBeVisible();
  });
});
