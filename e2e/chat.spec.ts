import { test, expect } from '@playwright/test';

test('has title and login elements', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Orbit/i);
    await expect(page.getByText(/Login/i)).toBeVisible();
});
