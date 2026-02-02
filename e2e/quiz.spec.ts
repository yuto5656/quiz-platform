import { test, expect } from "@playwright/test";

test.describe("Quiz Detail Page", () => {
  // Note: These tests require a quiz to exist in the database
  // In a real setup, you would seed the database before tests

  test("should redirect to 404 for non-existent quiz", async ({ page }) => {
    await page.goto("/quiz/non-existent-quiz-id");

    // Should show 404 or redirect
    await expect(
      page.locator("text=404").or(page.locator("text=ページが見つかりません"))
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Quiz Category Page", () => {
  test("should display category page structure", async ({ page }) => {
    await page.goto("/quiz/category/technology");

    // Page should load (may show empty state if no quizzes)
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
});

test.describe("Create Quiz Page (Auth Required)", () => {
  test("should redirect to login if not authenticated", async ({ page }) => {
    await page.goto("/create");

    // Should redirect to login
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Dashboard Page (Auth Required)", () => {
  test("should redirect to login if not authenticated", async ({ page }) => {
    await page.goto("/dashboard");

    // Should redirect to login
    await page.waitForURL("**/login**", { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
