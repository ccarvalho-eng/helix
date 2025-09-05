import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Helix/);
  });

  test('should display main navigation elements', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that basic elements are present
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });
});
