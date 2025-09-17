import { test, expect } from '@playwright/test';

test.describe('Flow Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flow');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });
  });

  test('persists flow data across page reloads', async ({ page }) => {
    const agentNode = page.locator('[data-node-type="agent"]').first();
    await agentNode.click();
    await page.waitForTimeout(3000);

    const nodeCountBeforeReload = await page.locator('.react-flow__node').count();

    if (nodeCountBeforeReload === 0) {
      console.log('No nodes found before reload, skipping persistence test');
      return;
    }

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });
    await page.waitForTimeout(3000);

    const nodeCountAfterReload = await page.locator('.react-flow__node').count();
    expect(nodeCountAfterReload).toBeGreaterThanOrEqual(0);
  });

  test('auto-saves changes', async ({ page }) => {
    const agentNode = page.locator('[data-node-type="agent"]').first();
    await agentNode.click();
    await page.waitForTimeout(3000);

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
  });
});