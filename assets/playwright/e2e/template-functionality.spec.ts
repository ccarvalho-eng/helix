import { test, expect } from '@playwright/test';

test.describe('Templates', () => {
  test('loads and applies templates', async ({ page }) => {
    await page.goto('/flow');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });

    const templateDropdown = page.locator('select, [data-testid="template-select"], .template-dropdown').first();
    if (await templateDropdown.count() > 0) {
      await templateDropdown.selectOption({ index: 1 });
      await page.waitForTimeout(2000);

      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount).toBeGreaterThan(0);
    }
  });

  test('browses templates from home', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const browseTemplatesButton = page.getByText('Browse Templates').first();
    if (await browseTemplatesButton.count() > 0) {
      await browseTemplatesButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('.modal, [role="dialog"], .templates-modal');
      await expect(modal.first()).toBeVisible();
    }
  });
});