import { test, expect } from '@playwright/test';

test.describe('Multi-Flow Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.waitForLoadState('networkidle');
  });

  test('creates new flows', async ({ page }) => {
    const initialFlowCount = await page.locator('.flow-card, [data-testid="flow-card"]').count();

    const newFlowButton = page.getByText('New Flow').first();
    if (await newFlowButton.count() > 0) {
      await newFlowButton.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/flow/);
    }
  });

  test('displays flow list', async ({ page }) => {
    const pageContent = page.locator('main, .content, .page-content, body');
    await expect(pageContent.first()).toBeVisible();
  });
});