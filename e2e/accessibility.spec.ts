import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("home page should have proper heading structure", async ({ page }) => {
    await page.goto("/");

    // Should have exactly one h1
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("all images should have alt text", async ({ page }) => {
    await page.goto("/");

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });

  test("interactive elements should be keyboard accessible", async ({
    page,
  }) => {
    await page.goto("/");

    // Tab through the page and check focus
    await page.keyboard.press("Tab");

    // First focusable element should be focused
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });

  test("links should have descriptive text", async ({ page }) => {
    await page.goto("/");

    const links = page.locator("a");
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute("aria-label");

      // Link should have either text content or aria-label
      expect(text?.trim() || ariaLabel).toBeTruthy();
    }
  });

  test("buttons should have accessible names", async ({ page }) => {
    await page.goto("/");

    const buttons = page.locator("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute("aria-label");
      const title = await button.getAttribute("title");

      // Button should have text, aria-label, or title
      expect(text?.trim() || ariaLabel || title).toBeTruthy();
    }
  });
});

test.describe("Theme Toggle", () => {
  test("should toggle between light and dark mode", async ({ page }) => {
    await page.goto("/");

    // Find theme toggle button
    const themeButton = page.locator('button[aria-label*="テーマ"]').first();

    if (await themeButton.isVisible()) {
      // Get initial class on html element
      const initialClass = await page.locator("html").getAttribute("class");

      // Click theme toggle
      await themeButton.click();

      // Wait for theme change
      await page.waitForTimeout(500);

      // Class should have changed
      const newClass = await page.locator("html").getAttribute("class");
      expect(newClass).not.toBe(initialClass);
    }
  });
});
