import { test, expect } from '@playwright/test';

test.describe('Page Loading', () => {
  test('loads home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Helix/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('loads flow builder page', async ({ page }) => {
    await page.goto('/flow');
    await expect(page).toHaveTitle(/Helix/);
    await expect(page.locator('body')).toBeVisible();
  });
});