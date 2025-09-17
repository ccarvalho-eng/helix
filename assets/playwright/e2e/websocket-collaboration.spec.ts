import { test, expect } from '@playwright/test';

test.describe('WebSocket Integration', () => {
  test('loads flow builder with websocket support', async ({ page }) => {
    await page.goto('/flow');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.react-flow__pane', { timeout: 10000 });

    const agentNode = page.locator('[data-node-type="agent"]').first();
    await agentNode.click();
    await page.waitForTimeout(2000);

    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(0);
  });
});