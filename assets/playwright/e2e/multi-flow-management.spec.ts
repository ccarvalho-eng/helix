import { test, expect, Page } from '@playwright/test';

test.describe('Multi-Flow Management System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test.describe('Flow Creation and Navigation', () => {
    test('should create a new flow from home page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click "Create New Flow" button
      await page.click('button:has-text("New Flow")');

      // Should navigate to flow builder with new flow ID
      await expect(page).toHaveURL(/\/flow\/flow-\d+-\w+/);
      await page.waitForLoadState('networkidle');

      // Should show flow builder interface
      await expect(page.locator('.flow-builder')).toBeVisible();
      await expect(page.locator('.flow-builder__flow-title')).toContainText('Untitled Flow');
    });

    test('should create flow from empty state card', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click the "Create New Workflow" card
      await page.click('.home-empty-card');

      // Should navigate to flow builder
      await expect(page).toHaveURL(/\/flow\/flow-\d+-\w+/);
      await page.waitForLoadState('networkidle');

      // Should show flow builder with default title
      await expect(page.locator('.flow-builder__flow-title')).toContainText('Untitled Flow');
    });

    test('should navigate back to home from flow', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');

      // Click the home link in the logo
      await page.click('.flow-builder__brand a');

      // Should return to home page
      await expect(page).toHaveURL('/');
      await expect(page.locator('.home-page')).toBeVisible();
    });
  });

  test.describe('Flow Title Management', () => {
    test('should edit flow title inline', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');

      // Click on the flow title to edit
      await page.click('.flow-builder__flow-title');

      // Should show input field
      await expect(page.locator('.flow-builder__title-input')).toBeVisible();

      // Type new title
      await page.fill('.flow-builder__title-input', 'My Test Flow');
      await page.press('.flow-builder__title-input', 'Enter');

      // Should update title
      await expect(page.locator('.flow-builder__flow-title')).toContainText('My Test Flow');
    });

    test('should cancel title editing with Escape', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');

      const originalTitle = await page.locator('.flow-builder__flow-title').textContent();

      // Start editing
      await page.click('.flow-builder__flow-title');
      await page.fill('.flow-builder__title-input', 'Changed Title');
      await page.press('.flow-builder__title-input', 'Escape');

      // Should revert to original title
      await expect(page.locator('.flow-builder__flow-title')).toContainText(
        originalTitle || 'Untitled Flow'
      );
    });

    test('should save title on blur', async ({ page }) => {
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');

      // Start editing
      await page.click('.flow-builder__flow-title');
      await page.fill('.flow-builder__title-input', 'Blur Test Flow');

      // Click elsewhere to blur
      await page.click('.flow-builder__header-controls');

      // Should save title
      await expect(page.locator('.flow-builder__flow-title')).toContainText('Blur Test Flow');
    });
  });

  test.describe('Flow CRUD Operations from Home Page', () => {
    test('should display flows in grid format', async ({ page }) => {
      // Create multiple flows first
      await createTestFlows(page, ['Flow 1', 'Flow 2', 'Flow 3']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show flow cards
      const flowCards = page.locator('.home-workflow-card');
      await expect(flowCards).toHaveCount(3);

      // Should show flow count
      await expect(page.locator('.home-workflows__count')).toContainText('3 flows');
    });

    test('should open flow when clicking on card', async ({ page }) => {
      const [flowId] = await createTestFlows(page, ['Test Flow']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click on flow card body (not the gear menu)
      await page.click('.home-workflow-card__body');

      // Should navigate to specific flow
      await expect(page).toHaveURL(`/flow/${flowId}`);
      await expect(page.locator('.flow-builder__flow-title')).toContainText('Test Flow');
    });

    test('should show gear menu on hover/click', async ({ page }) => {
      await createTestFlows(page, ['Test Flow']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Gear should be visible (always visible now)
      await expect(page.locator('.home-workflow-card__gear')).toBeVisible();

      // Click gear to show dropdown
      await page.click('.home-workflow-card__gear');
      await expect(page.locator('.home-workflow-card__dropdown')).toHaveClass(/show/);

      // Should show menu items
      await expect(
        page.locator('.home-workflow-card__dropdown-item:has-text("Rename")')
      ).toBeVisible();
      await expect(
        page.locator('.home-workflow-card__dropdown-item:has-text("Duplicate")')
      ).toBeVisible();
      await expect(
        page.locator('.home-workflow-card__dropdown-item:has-text("Delete")')
      ).toBeVisible();
    });

    test('should rename flow from gear menu', async ({ page }) => {
      await createTestFlows(page, ['Original Name']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open gear menu and click rename
      await page.click('.home-workflow-card__gear');
      await page.click('.home-workflow-card__dropdown-item:has-text("Rename")');

      // Should show inline edit
      await expect(page.locator('.home-workflow-card__title-input')).toBeVisible();

      // Edit title
      await page.fill('.home-workflow-card__title-input', 'Renamed Flow');
      await page.press('.home-workflow-card__title-input', 'Enter');

      // Should update title
      await expect(page.locator('.home-workflow-card__title')).toContainText('Renamed Flow');
    });

    test('should duplicate flow from gear menu', async ({ page }) => {
      await createTestFlows(page, ['Original Flow']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open gear menu and click duplicate
      await page.click('.home-workflow-card__gear');
      await page.click('.home-workflow-card__dropdown-item:has-text("Duplicate")');

      // Should create duplicate with "(Copy)" suffix
      await expect(page.locator('.home-workflows__count')).toContainText('2 flows');
      await expect(
        page.locator('.home-workflow-card__title:has-text("Original Flow (Copy)")')
      ).toBeVisible();
    });

    test('should delete flow with confirmation', async ({ page }) => {
      await createTestFlows(page, ['Flow to Delete']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open gear menu and click delete
      await page.click('.home-workflow-card__gear');
      await page.click('.home-workflow-card__dropdown-item:has-text("Delete")');

      // Should show confirmation modal
      await expect(page.locator('.home-modal')).toBeVisible();
      await expect(page.locator('.home-modal__title')).toContainText('Delete Workflow');

      // Cancel first
      await page.click('.home-modal__button--secondary');
      await expect(page.locator('.home-modal')).toBeHidden();
      await expect(page.locator('.home-workflows__count')).toContainText('1 flows');

      // Try again and confirm
      await page.click('.home-workflow-card__gear');
      await page.click('.home-workflow-card__dropdown-item:has-text("Delete")');
      await page.click('.home-modal__button--danger');

      // Should delete flow
      await expect(page.locator('.home-workflows__count')).toContainText('0 flows');
    });

    test('should close dropdown when clicking outside', async ({ page }) => {
      await createTestFlows(page, ['Test Flow']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Open dropdown
      await page.click('.home-workflow-card__gear');
      await expect(page.locator('.home-workflow-card__dropdown')).toHaveClass(/show/);

      // Click outside
      await page.click('body', { position: { x: 50, y: 50 } });

      // Should close dropdown - wait a moment for the event to process
      await page.waitForTimeout(100);
      const dropdown = page.locator('.home-workflow-card__dropdown.show');
      await expect(dropdown).toHaveCount(0);
    });
  });

  test.describe('Search and Filter', () => {
    test('should filter flows by search query', async ({ page }) => {
      await createTestFlows(page, ['Customer Support', 'Data Pipeline', 'User Onboarding']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Search for specific flow
      await page.fill('.home-workflows__search-input', 'Customer');

      // Should show only matching flow
      await expect(page.locator('.home-workflow-card')).toHaveCount(1);
      await expect(page.locator('.home-workflow-card__title')).toContainText('Customer Support');

      // Clear search
      await page.fill('.home-workflows__search-input', '');

      // Should show all flows again
      await expect(page.locator('.home-workflow-card')).toHaveCount(3);
    });

    test('should show no results for non-matching search', async ({ page }) => {
      await createTestFlows(page, ['Flow 1', 'Flow 2']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Search for non-existent flow
      await page.fill('.home-workflows__search-input', 'NonExistent');

      // Should show no workflow cards, and empty card should be hidden during search with no results
      const workflowCards = page.locator('.home-workflow-card');
      await expect(workflowCards).toHaveCount(0);

      // The "Create New Workflow" card is hidden when filtering with no results
      const emptyCard = page.locator('.home-empty-card');
      await expect(emptyCard).toBeHidden();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      await createTestFlows(page, ['Mobile Test Flow']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show mobile-optimized layout
      await expect(page.locator('.home-workflow-card')).toBeVisible();
      await expect(page.locator('.home-workflows__grid')).toBeVisible();

      // Gear menu should still work
      await page.click('.home-workflow-card__gear');
      await expect(page.locator('.home-workflow-card__dropdown')).toHaveClass(/show/);
    });

    test('should adapt search controls on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await createTestFlows(page, ['Test Flow']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Search should be full width on mobile
      const searchInput = page.locator('.home-workflows__search-input');
      await expect(searchInput).toBeVisible();

      // Should be able to search on mobile
      await searchInput.fill('Test');
      await expect(page.locator('.home-workflow-card')).toHaveCount(1);
    });
  });

  test.describe('URL Persistence', () => {
    test('should persist flow ID in URL', async ({ page }) => {
      const [flowId] = await createTestFlows(page, ['URL Test Flow']);

      await page.goto(`/flow/${flowId}`);
      await page.waitForLoadState('networkidle');

      // Should load specific flow
      await expect(page.locator('.flow-builder__flow-title')).toContainText('URL Test Flow');

      // URL should remain consistent
      expect(page.url()).toContain(`/flow/${flowId}`);
    });

    test('should redirect to home for non-existent flow', async ({ page }) => {
      await page.goto('/flow/non-existent-flow-id');
      await page.waitForLoadState('networkidle');

      // Should redirect to home page
      await expect(page).toHaveURL('/');
    });

    test('should update URL when creating new flow', async ({ page }) => {
      await page.goto('/flow');
      await page.waitForLoadState('networkidle');

      // URL should be updated with new flow ID
      await expect(page).toHaveURL(/\/flow\/flow-\d+-\w+/);
    });
  });

  test.describe('Flow State Persistence', () => {
    test('should preserve flow state when navigating away and back', async ({ page }) => {
      // Create a flow and navigate to it
      await page.goto('/');
      await page.click('button:has-text("New Flow")');
      await page.waitForLoadState('networkidle');

      // Get the flow URL to return to later
      const flowUrl = page.url();

      // Set a custom title
      await page.click('.flow-builder__flow-title');
      await page.fill('.flow-builder__title-input', 'Persistence Test Flow');
      await page.press('.flow-builder__title-input', 'Enter');
      await page.waitForTimeout(500); // Wait for save

      // Simulate adding some content to the flow (if the UI supports it)
      // This tests that any flow builder state is preserved

      // Navigate away to home
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Verify flow appears in list with correct title
      await expect(page.locator('.home-workflow-card__title')).toContainText(
        'Persistence Test Flow'
      );

      // Navigate back to the specific flow
      await page.goto(flowUrl);
      await page.waitForLoadState('networkidle');

      // Verify flow state is preserved
      await expect(page.locator('.flow-builder__flow-title')).toContainText(
        'Persistence Test Flow'
      );

      // Test that we can continue editing
      await page.click('.flow-builder__flow-title');
      await expect(page.locator('.flow-builder__title-input')).toHaveValue('Persistence Test Flow');
      await page.press('.flow-builder__title-input', 'Escape'); // Cancel edit

      // Navigate away again using browser back/forward
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/');

      // Navigate forward again
      await page.goForward();
      await page.waitForLoadState('networkidle');

      // State should still be preserved
      await expect(page.locator('.flow-builder__flow-title')).toContainText(
        'Persistence Test Flow'
      );
    });

    test('should maintain separate state for different flows', async ({ page }) => {
      // Create first flow
      const [flowId1] = await createTestFlows(page, ['Flow One']);

      // Create second flow
      const [flowId2] = await createTestFlows(page, ['Flow Two']);

      // Navigate to first flow and modify title
      await page.goto(`/flow/${flowId1}`);
      await page.waitForLoadState('networkidle');
      await page.click('.flow-builder__flow-title');
      await page.fill('.flow-builder__title-input', 'Modified Flow One');
      await page.press('.flow-builder__title-input', 'Enter');
      await page.waitForTimeout(500);

      // Navigate to second flow and verify it's unchanged
      await page.goto(`/flow/${flowId2}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.flow-builder__flow-title')).toContainText('Flow Two');

      // Modify second flow title
      await page.click('.flow-builder__flow-title');
      await page.fill('.flow-builder__title-input', 'Modified Flow Two');
      await page.press('.flow-builder__title-input', 'Enter');
      await page.waitForTimeout(500);

      // Go back to first flow and verify its state is preserved
      await page.goto(`/flow/${flowId1}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.flow-builder__flow-title')).toContainText('Modified Flow One');

      // Verify both flows have correct state in home page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const flowTitles = await page.locator('.home-workflow-card__title').allTextContents();
      expect(flowTitles).toContain('Modified Flow One');
      expect(flowTitles).toContain('Modified Flow Two');
    });
  });

  test.describe('Flow Statistics', () => {
    test('should display node and connection counts', async ({ page }) => {
      await createTestFlows(page, ['Test Flow']);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show initial counts - be specific about which stats
      await expect(
        page.locator('.home-workflow-card__stat').filter({ hasText: 'nodes' })
      ).toContainText('0 nodes');
      await expect(
        page.locator('.home-workflow-card__stat').filter({ hasText: 'connections' })
      ).toContainText('0 connections');
    });
  });
});

/**
 * Helper function to create test flows
 */
async function createTestFlows(page: Page, titles: string[]): Promise<string[]> {
  const flowIds: string[] = [];

  for (const title of titles) {
    await page.goto('/');
    await page.click('button:has-text("New Flow")');
    await page.waitForLoadState('networkidle');

    // Get flow ID from URL
    const url = page.url();
    const flowId = url.split('/flow/')[1];
    flowIds.push(flowId);

    // Set title
    await page.click('.flow-builder__flow-title');
    await page.fill('.flow-builder__title-input', title);
    await page.press('.flow-builder__title-input', 'Enter');
    await page.waitForTimeout(500); // Wait for save
  }

  return flowIds;
}
