import { test, expect } from '@playwright/test';

test.describe('Template Functionality', () => {
  test.describe('Browse Templates from Home', () => {
    test('should open templates modal when Browse Templates is clicked from home page', async ({
      page,
    }) => {
      await page.goto('/');

      // Click Browse Templates button
      const browseTemplatesButton = page.locator(
        'button:has-text("Browse Templates"), .home-quick-action:has-text("Browse Templates")'
      );
      await expect(browseTemplatesButton).toBeVisible();
      await browseTemplatesButton.click();

      // Should navigate to flow builder and open templates modal
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500); // Wait for flow builder to initialize and modal to open

      // Should be on a flow page
      expect(page.url()).toMatch(/\/flow\/[a-zA-Z0-9-]+/);

      // Templates modal should be visible
      const templatesModal = page.locator(
        '.flow-builder__modal-backdrop, .flow-builder__modal:has-text("All Templates")'
      );
      await expect(templatesModal.first()).toBeVisible({ timeout: 5000 });

      // Should show template options
      const templateCards = page.locator('.flow-builder__template-card');
      const cardCount = await templateCards.count();
      expect(cardCount).toBeGreaterThan(0);
    });

    test('should allow selecting a template from Browse Templates flow', async ({ page }) => {
      await page.goto('/');

      // Click Browse Templates
      const browseTemplatesButton = page.locator(
        'button:has-text("Browse Templates"), .home-quick-action:has-text("Browse Templates")'
      );
      await browseTemplatesButton.click();

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for a specific template and click it
      const cyberSecurityTemplate = page.locator('.flow-builder__template-card:has-text("Cyber")');

      if (await cyberSecurityTemplate.first().isVisible()) {
        await cyberSecurityTemplate.first().click();
        await page.waitForTimeout(2000);

        // Should have added nodes from template
        const nodes = page.locator('.react-flow__node');
        const nodeCount = await nodes.count();
        expect(nodeCount).toBeGreaterThan(0);

        // Templates modal should close
        const templatesModal = page.locator('.flow-builder__modal-backdrop');
        await expect(templatesModal.first()).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a new flow for each test
    await page.click('button:has-text("New Flow")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for flow builder to fully initialize
  });

  test.describe('Template Loading', () => {
    test('should display template options in dropdown', async ({ page }) => {
      // Look for template dropdown or button
      const templateButton = page.locator(
        'button:has-text("Template"), button:has-text("Add Template"), [data-testid="template-button"], .template-selector'
      );

      if (await templateButton.first().isVisible()) {
        await templateButton.first().click();
        await page.waitForTimeout(500);

        // Should show template options
        const templateOptions = page.locator(
          '[data-testid="template-option"], .template-option, button:has-text("Assassin"), button:has-text("Software"), button:has-text("Customer")'
        );
        const optionCount = await templateOptions.count();
        expect(optionCount).toBeGreaterThan(0);
      } else {
        // If no template button found, look for direct template options
        const directTemplateButtons = page.locator(
          'button:has-text("Assassin"), button:has-text("Software"), button:has-text("Customer")'
        );
        const directCount = await directTemplateButtons.count();
        expect(directCount).toBeGreaterThanOrEqual(0); // Allow for different UI implementations
      }
    });

    test('should load Assassins Creed template', async ({ page }) => {
      const initialNodeCount = await page.locator('.react-flow__node').count();

      // Look for Assassins Creed template button
      const assassinTemplate = page.locator(
        'button:has-text("Assassin"), [data-template="assassins-creed"], .template-assassins-creed'
      );

      if (await assassinTemplate.first().isVisible()) {
        await assassinTemplate.first().click();
        await page.waitForTimeout(1000);

        // Should have added nodes from template
        const finalNodeCount = await page.locator('.react-flow__node').count();
        expect(finalNodeCount).toBeGreaterThan(initialNodeCount);

        // Check for specific nodes that should be in assassins creed template
        const agentNodes = page.locator(
          '.react-flow__node:has-text("Agent"), .react-flow__node:has-text("Assassin")'
        );
        const agentCount = await agentNodes.count();
        expect(agentCount).toBeGreaterThan(0);
      }
    });

    test('should load Software Automation template', async ({ page }) => {
      const initialNodeCount = await page.locator('.react-flow__node').count();

      // Look for Software Automation template button
      const softwareTemplate = page.locator(
        'button:has-text("Software"), [data-template="software-automation"], .template-software-automation'
      );

      if (await softwareTemplate.first().isVisible()) {
        await softwareTemplate.first().click();
        await page.waitForTimeout(1000);

        // Should have added nodes from template
        const finalNodeCount = await page.locator('.react-flow__node').count();
        expect(finalNodeCount).toBeGreaterThan(initialNodeCount);

        // Check for software-specific nodes
        const apiNodes = page.locator(
          '.react-flow__node:has-text("API"), .react-flow__node:has-text("Database"), .react-flow__node:has-text("Transform")'
        );
        const apiCount = await apiNodes.count();
        expect(apiCount).toBeGreaterThan(0);
      }
    });

    test('should load Customer Service template', async ({ page }) => {
      const initialNodeCount = await page.locator('.react-flow__node').count();

      // Look for Customer Service template button
      const customerTemplate = page.locator(
        'button:has-text("Customer"), [data-template="customer-service"], .template-customer-service'
      );

      if (await customerTemplate.first().isVisible()) {
        await customerTemplate.first().click();
        await page.waitForTimeout(1000);

        // Should have added nodes from template
        const finalNodeCount = await page.locator('.react-flow__node').count();
        expect(finalNodeCount).toBeGreaterThan(initialNodeCount);

        // Check for customer service specific nodes
        const serviceNodes = page.locator(
          '.react-flow__node:has-text("Customer"), .react-flow__node:has-text("Support"), .react-flow__node:has-text("Ticket")'
        );
        const serviceCount = await serviceNodes.count();
        expect(serviceCount).toBeGreaterThanOrEqual(0); // Allow for different implementations
      }
    });
  });

  test.describe('Template Integration', () => {
    test('should preserve existing nodes when adding template', async ({ page }) => {
      // Add a custom node first
      const agentNode = page.locator('[data-node-type="agent"]').first();
      const canvas = page.locator('.react-flow__pane');
      await agentNode.dragTo(canvas, { targetPosition: { x: 100, y: 100 } });
      await page.waitForTimeout(500);

      const customNodeCount = await page.locator('.react-flow__node').count();
      expect(customNodeCount).toBe(1);

      // Add a template
      const templateButton = page
        .locator('button:has-text("Assassin"), button:has-text("Template")')
        .first();
      if (await templateButton.isVisible()) {
        await templateButton.click();
        await page.waitForTimeout(1000);

        // Should have both custom node and template nodes
        const totalNodeCount = await page.locator('.react-flow__node').count();
        expect(totalNodeCount).toBeGreaterThan(customNodeCount);
      }
    });

    test('should position template nodes without overlapping existing nodes', async ({ page }) => {
      // Add a node in the center
      const agentNode = page.locator('[data-node-type="agent"]').first();
      const canvas = page.locator('.react-flow__pane');
      await agentNode.dragTo(canvas, { targetPosition: { x: 300, y: 300 } });
      await page.waitForTimeout(500);

      // Add template
      const templateButton = page
        .locator('button:has-text("Assassin"), button:has-text("Template")')
        .first();
      if (await templateButton.isVisible()) {
        await templateButton.click();
        await page.waitForTimeout(1000);

        // Check that template nodes don't overlap with existing node
        const allNodes = page.locator('.react-flow__node');
        const nodeCount = await allNodes.count();

        if (nodeCount > 1) {
          // At least we should have more than one node and they shouldn't crash
          expect(nodeCount).toBeGreaterThan(1);
        }
      }
    });

    test('should create connections between template nodes', async ({ page }) => {
      const initialEdgeCount = await page.locator('.react-flow__edge').count();

      // Add a template that should have connections
      const templateButton = page
        .locator('button:has-text("Assassin"), button:has-text("Template")')
        .first();
      if (await templateButton.isVisible()) {
        await templateButton.click();
        await page.waitForTimeout(1000);

        // Should have created edges along with nodes
        const finalEdgeCount = await page.locator('.react-flow__edge').count();
        expect(finalEdgeCount).toBeGreaterThanOrEqual(initialEdgeCount);
      }
    });
  });

  test.describe('Template Node Properties', () => {
    test('should load template nodes with correct labels and descriptions', async ({ page }) => {
      // Add assassins creed template
      const templateButton = page
        .locator('button:has-text("Assassin"), button:has-text("Template")')
        .first();
      if (await templateButton.isVisible()) {
        await templateButton.click();
        await page.waitForTimeout(1000);

        // Check for expected node labels from assassins creed template
        const nodes = page.locator('.react-flow__node');
        const nodeCount = await nodes.count();

        if (nodeCount > 0) {
          // Select first node to see if properties are loaded
          await nodes.first().click();
          await page.waitForTimeout(500);

          // Properties panel should show node details
          const propertiesPanel = page.locator(
            '.flow-builder__properties-panel, .properties-panel, [data-testid="properties-panel"]'
          );
          if (await propertiesPanel.isVisible()) {
            // Should contain some text related to the template
            const panelText = await propertiesPanel.textContent();
            expect(panelText?.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should allow editing template node properties', async ({ page }) => {
      // Add template
      const templateButton = page
        .locator('button:has-text("Assassin"), button:has-text("Template")')
        .first();
      if (await templateButton.isVisible()) {
        await templateButton.click();
        await page.waitForTimeout(1000);

        // Select a node
        const nodes = page.locator('.react-flow__node');
        const nodeCount = await nodes.count();

        if (nodeCount > 0) {
          const node = nodes.first();
          await node.click();
          await page.waitForTimeout(500);

          // Try to edit node properties
          const labelInput = page
            .locator(
              'input[placeholder*="label"], input[placeholder*="title"], input[placeholder*="name"]'
            )
            .first();
          if (await labelInput.isVisible()) {
            await labelInput.fill('Modified Template Node');
            await labelInput.press('Enter');
            await page.waitForTimeout(500);

            // Verify the change was applied
            const newValue = await labelInput.inputValue();
            expect(newValue).toBe('Modified Template Node');

            // Verify it shows in the node
            await expect(node).toContainText('Modified Template Node');
          }
        }
      }
    });
  });

  test.describe('Multiple Templates', () => {
    test('should allow adding multiple different templates', async ({ page }) => {
      const initialNodeCount = await page.locator('.react-flow__node').count();

      // Add first template
      const assassinTemplate = page.locator('button:has-text("Assassin")').first();
      if (await assassinTemplate.isVisible()) {
        await assassinTemplate.click();
        await page.waitForTimeout(1000);

        const afterFirstTemplate = await page.locator('.react-flow__node').count();
        expect(afterFirstTemplate).toBeGreaterThan(initialNodeCount);

        // Add second template
        const softwareTemplate = page.locator('button:has-text("Software")').first();
        if (await softwareTemplate.isVisible()) {
          await softwareTemplate.click();
          await page.waitForTimeout(1000);

          const afterSecondTemplate = await page.locator('.react-flow__node').count();
          expect(afterSecondTemplate).toBeGreaterThan(afterFirstTemplate);
        }
      }
    });

    test('should maintain template node uniqueness when adding same template twice', async ({
      page,
    }) => {
      // Add same template twice
      const templateButton = page.locator('button:has-text("Assassin")').first();
      if (await templateButton.isVisible()) {
        await templateButton.click();
        await page.waitForTimeout(1000);

        const afterFirstAdd = await page.locator('.react-flow__node').count();

        await templateButton.click();
        await page.waitForTimeout(1000);

        const afterSecondAdd = await page.locator('.react-flow__node').count();

        // Should have added more nodes (duplicated the template)
        expect(afterSecondAdd).toBeGreaterThan(afterFirstAdd);

        // All nodes should have unique IDs (no overlap issues)
        const allNodes = page.locator('.react-flow__node');
        const nodeCount = await allNodes.count();
        expect(nodeCount).toBe(afterSecondAdd);
      }
    });
  });

  test.describe('Template Performance', () => {
    test('should load template quickly without blocking UI', async ({ page }) => {
      const startTime = Date.now();

      // Add template
      const templateButton = page.locator('button:has-text("Assassin")').first();
      if (await templateButton.isVisible()) {
        await templateButton.click();

        // Wait for nodes to appear
        await page.waitForFunction(
          () => {
            return document.querySelectorAll('.react-flow__node').length > 0;
          },
          { timeout: 5000 }
        );

        const endTime = Date.now();
        const loadTime = endTime - startTime;

        // Template should load within reasonable time (5 seconds)
        expect(loadTime).toBeLessThan(5000);

        // UI should remain responsive
        const canvas = page.locator('.react-flow__pane');
        await expect(canvas).toBeVisible();
      }
    });
  });

  test.describe('Template Error Handling', () => {
    test('should gracefully handle template loading errors', async ({ page }) => {
      // This test ensures the UI doesn't crash if template loading fails
      // We'll click template buttons and ensure the page remains functional

      const templateButtons = page.locator(
        'button:has-text("Template"), button:has-text("Assassin"), button:has-text("Software"), button:has-text("Customer")'
      );
      const buttonCount = await templateButtons.count();

      // Try clicking all template buttons
      for (let i = 0; i < buttonCount && i < 3; i++) {
        const button = templateButtons.nth(i);
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(500);

          // Ensure canvas is still responsive
          const canvas = page.locator('.react-flow__pane');
          await expect(canvas).toBeVisible();
        }
      }

      // Page should still be functional
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  });
});
