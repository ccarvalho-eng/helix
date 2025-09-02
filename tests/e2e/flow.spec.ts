import { test, expect } from '@playwright/test';

test.describe('Flow Builder Page', () => {
  test('should load the flow builder page', async ({ page }) => {
    await page.goto('/flow');
    
    await expect(page).toHaveTitle(/Helix/);
    await page.waitForLoadState('networkidle');
  });

  test('should display flow builder interface', async ({ page }) => {
    await page.goto('/flow');
    await page.waitForLoadState('networkidle');
    
    // Check that the page loads without errors
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for React components to be mounted
    await page.waitForTimeout(1000);
  });
});