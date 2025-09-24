import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('displays login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('displays register page', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await expect(page.getByLabel('First name')).toBeVisible();
    await expect(page.getByLabel('Last name')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });

  test('completes user registration', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    await page.goto('/register');
    await page.getByLabel('First name').fill('Test');
    await page.getByLabel('Last name').fill('User');
    await page.getByLabel('Email address').fill(testEmail);
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('automatically logs in after registration', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `auto${timestamp}@example.com`;

    await page.goto('/register');
    await page.getByLabel('First name').fill('Auto');
    await page.getByLabel('Last name').fill('Login');
    await page.getByLabel('Email address').fill(testEmail);
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
  });

  test('persists authentication across page reloads', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `persist${timestamp}@example.com`;

    await page.goto('/register');
    await page.getByLabel('First name').fill('Persist');
    await page.getByLabel('Last name').fill('Test');
    await page.getByLabel('Email address').fill(testEmail);
    await page.locator('input[type="password"]').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.reload();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});