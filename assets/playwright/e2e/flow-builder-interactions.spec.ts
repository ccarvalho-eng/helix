import { test, expect } from '@playwright/test';

test.describe('Flow Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/flow');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });
  });

  test('adds nodes to canvas', async ({ page }) => {
    const initialNodeCount = await page.locator('.react-flow__node').count();

    const agentNode = page.locator('[data-node-type="agent"]').first();
    await agentNode.click();
    await page.waitForTimeout(1000);

    const finalNodeCount = await page.locator('.react-flow__node').count();
    expect(finalNodeCount).toBe(initialNodeCount + 1);
  });

  test('selects and configures nodes', async ({ page }) => {
    const agentNode = page.locator('[data-node-type="agent"]').first();
    await agentNode.click();
    await page.waitForTimeout(1000);

    const node = page.locator('.react-flow__node').last();
    await node.click();
    await page.waitForTimeout(500);

    await expect(node).toHaveClass(/selected/);
  });
});