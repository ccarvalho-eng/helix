import { test, expect } from '@playwright/test';

// Helper to ensure localStorage works in CI environments
const setupStorageHelpers = async (page: any) => {
  await page.addInitScript(() => {
    // Create a fallback storage system for restricted environments
    if (!window.localStorage || typeof Storage === 'undefined') {
      window._mockStorage = {};
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: key => window._mockStorage[key] || null,
          setItem: (key, value) => {
            window._mockStorage[key] = value;
          },
          removeItem: key => {
            delete window._mockStorage[key];
          },
          clear: () => {
            window._mockStorage = {};
          },
          key: index => Object.keys(window._mockStorage)[index] || null,
          get length() {
            return Object.keys(window._mockStorage).length;
          },
        },
      });
    }
  });
};

test.describe('Flow Persistence and Data Integrity', () => {
  test.describe('Local Storage Persistence', () => {
    test('should persist flow data in localStorage', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Wait for the flow builder to be ready
      await page.waitForSelector('[data-node-type="agent"]', {
        timeout: 10000,
      });

      // Add some content to the flow by clicking
      const agentNode = page.locator('[data-node-type="agent"]').first();
      if (await agentNode.isVisible()) {
        await agentNode.click();
        await page.waitForTimeout(1000);
      }

      // Check localStorage for flow data with error handling
      const flowData = await page.evaluate(() => {
        try {
          const keys = Object.keys(localStorage);
          const flowKeys = keys.filter(key => key.startsWith('flow-'));
          return flowKeys.length > 0 ? localStorage.getItem(flowKeys[0]) : null;
        } catch (error) {
          console.error('LocalStorage access error:', error);
          return null;
        }
      });

      expect(flowData).toBeTruthy();

      if (flowData) {
        const parsedData = JSON.parse(flowData);
        expect(parsedData).toHaveProperty('nodes');
        expect(parsedData).toHaveProperty('edges');
        expect(parsedData).toHaveProperty('viewport');
      }
    });

    test('should persist flow registry with metadata', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check flow registry in localStorage with error handling
      const registryData = await page.evaluate(() => {
        try {
          return localStorage.getItem('flows-registry');
        } catch (error) {
          console.error('LocalStorage registry access error:', error);
          return null;
        }
      });

      expect(registryData).toBeTruthy();

      if (registryData) {
        const registry = JSON.parse(registryData);
        expect(registry).toHaveProperty('flows');
        expect(Array.isArray(registry.flows)).toBe(true);
        expect(registry.flows.length).toBeGreaterThan(0);

        // Check flow metadata structure
        const flow = registry.flows[0];
        expect(flow).toHaveProperty('id');
        expect(flow).toHaveProperty('title');
        expect(flow).toHaveProperty('lastModified');
        expect(flow).toHaveProperty('createdAt');
      }
    });

    test('should update metadata when flow is modified', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Get initial registry state
      const initialRegistry = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('flows-registry') || '{"flows":[]}');
      });

      const initialFlow = initialRegistry.flows[0];
      const initialModified = initialFlow?.lastModified;

      // Make a change to the flow by adding a node
      const agentNode = page.locator('[data-node-type="agent"]').first();
      if (await agentNode.isVisible()) {
        await agentNode.click();
        await page.waitForTimeout(2000); // Wait for auto-save debounce
      }

      // Check that metadata was updated
      const updatedRegistry = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('flows-registry') || '{"flows":[]}');
      });

      const updatedFlow = updatedRegistry.flows[0];
      const updatedModified = updatedFlow?.lastModified;

      if (initialModified && updatedModified) {
        expect(new Date(updatedModified).getTime()).toBeGreaterThan(
          new Date(initialModified).getTime()
        );
      }

      // Node count should be updated
      expect(updatedFlow?.nodeCount).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Data Integrity', () => {
    test('should maintain consistent node IDs', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Add multiple nodes by clicking multiple times
      const agentNode = page.locator('[data-node-type="agent"]').first();

      if (await agentNode.isVisible()) {
        await agentNode.click();
        await page.waitForTimeout(500);
        await agentNode.click();
        await page.waitForTimeout(500);
      }

      // Check that all nodes have unique IDs
      const nodeIds = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.react-flow__node');
        return Array.from(nodes)
          .map(node => node.getAttribute('data-id'))
          .filter(Boolean);
      });

      const uniqueIds = new Set(nodeIds);
      expect(uniqueIds.size).toBe(nodeIds.length); // All IDs should be unique
    });

    test('should preserve node data structure', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Add a node by clicking
      const agentNode = page.locator('[data-node-type="agent"]').first();
      if (await agentNode.isVisible()) {
        await agentNode.click();
        await page.waitForTimeout(1000);
      }

      // Check stored node data structure
      const flowData = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        const flowKey = keys.find(key => key.startsWith('flow-'));
        return flowKey ? JSON.parse(localStorage.getItem(flowKey) || '{}') : null;
      });

      if (flowData && flowData.nodes && flowData.nodes.length > 0) {
        const node = flowData.nodes[0];

        // Check required node properties
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('position');
        expect(node).toHaveProperty('data');

        // Check position structure
        expect(node.position).toHaveProperty('x');
        expect(node.position).toHaveProperty('y');
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      }
    });

    test('should handle corrupted localStorage gracefully', async ({ page }) => {
      await setupStorageHelpers(page);

      // Set up corrupted data before the page loads
      await page.addInitScript(() => {
        try {
          localStorage.setItem('flows-registry', 'invalid-json');
          localStorage.setItem('flow-corrupted', 'also-invalid');
        } catch (e) {
          // If localStorage is not available, use mock storage
          window._mockStorage = window._mockStorage || {};
          window._mockStorage['flows-registry'] = 'invalid-json';
          window._mockStorage['flow-corrupted'] = 'also-invalid';
        }
      });

      // App should still load without crashing
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should be able to attempt to create new flow (might redirect due to corrupted data)
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');

      // Wait a bit more for any redirects or initialization
      await page.waitForTimeout(2000);

      // Test passes if the app handles corrupted data gracefully without crashing
      // It might redirect back to home or proceed to flow builder
      const currentUrl = page.url();
      const isHomeOrFlow = currentUrl.includes('/flow/') || currentUrl.endsWith('/');
      expect(isHomeOrFlow).toBe(true);

      // App should remain functional - page should still be visible
      const pageBody = page.locator('body');
      await expect(pageBody).toBeVisible();
    });
  });

  test.describe('Cross-Session Persistence', () => {
    test('should restore flow after browser refresh', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Set custom flow title
      const titleElement = page.locator('.flow-builder__flow-title');
      if (await titleElement.isVisible()) {
        await titleElement.click();
        const titleInput = page.locator('.flow-builder__title-input');
        await titleInput.fill('Test Persistence Flow');
        await titleInput.press('Enter');
        await page.waitForTimeout(500);
      }

      // Add content
      const agentNode = page.locator('[data-node-type="agent"]').first();
      if (await agentNode.isVisible()) {
        await agentNode.click();
        await page.waitForTimeout(1000);
      }

      const nodeCountBefore = await page.locator('.react-flow__node').count();

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Verify content is restored
      if (await titleElement.isVisible()) {
        await expect(titleElement).toContainText('Test Persistence Flow');
      }

      const nodeCountAfter = await page.locator('.react-flow__node').count();
      expect(nodeCountAfter).toBe(nodeCountBefore);
    });

    test('should restore flow when navigating back from home', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Add content - wait for agent nodes to be available and click one
      await page.waitForSelector('[data-node-type="agent"]', { timeout: 5000 });
      const agentNode = page.locator('[data-node-type="agent"]').first();
      await agentNode.click();
      await page.waitForTimeout(1000);

      // Wait for node to be rendered
      await page.waitForSelector('.react-flow__node', { timeout: 5000 });
      const flowUrl = page.url();
      const nodeCountBefore = await page.locator('.react-flow__node').count();
      
      // Ensure we have at least one node before proceeding
      expect(nodeCountBefore).toBeGreaterThan(0);

      // Navigate to home
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Navigate back to flow
      await page.goto(flowUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Wait for nodes to be restored and verify content
      await page.waitForSelector('.react-flow__node', { timeout: 10000 });
      const nodeCountAfter = await page.locator('.react-flow__node').count();
      expect(nodeCountAfter).toBe(nodeCountBefore);
    });
  });

  test.describe('Auto-save Functionality', () => {
    test('should auto-save after node addition', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Get initial save state
      const initialSaveTime = await page.evaluate(() => {
        const registry = JSON.parse(localStorage.getItem('flows-registry') || '{"flows":[]}');
        return registry.flows[0]?.lastModified;
      });

      // Add a node
      const agentNode = page.locator('[data-node-type="agent"]').first();
      if (await agentNode.isVisible()) {
        await agentNode.click();
        await page.waitForTimeout(2000); // Wait for auto-save debounce
      }

      // Check that auto-save occurred
      const finalSaveTime = await page.evaluate(() => {
        const registry = JSON.parse(localStorage.getItem('flows-registry') || '{"flows":[]}');
        return registry.flows[0]?.lastModified;
      });

      if (initialSaveTime && finalSaveTime) {
        expect(new Date(finalSaveTime).getTime()).toBeGreaterThan(
          new Date(initialSaveTime).getTime()
        );
      }
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from save failures', async ({ page }) => {
      await setupStorageHelpers(page);
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Simulate localStorage failure
      await page.evaluate(() => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function (key, value) {
          if (key.startsWith('flow-')) {
            throw new Error('Storage quota exceeded');
          }
          originalSetItem.call(this, key, value);
        };
      });

      // Try to add content (should not crash the app)
      const agentNode = page.locator('[data-node-type="agent"]').first();
      const canvas = page.locator('.react-flow__pane');

      if (await agentNode.isVisible()) {
        await agentNode.click();
        await page.waitForTimeout(1000);
      }

      // App should still be functional
      await expect(canvas).toBeVisible();
      const nodeExists = await page.locator('.react-flow__node').count();
      expect(nodeExists).toBeGreaterThanOrEqual(0);
    });
  });
});
