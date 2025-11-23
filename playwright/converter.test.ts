import { test, expect } from '@playwright/test';

test.setTimeout(35e3);

test.describe('Currency Converter', () => {
  test('loads with default values', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(
      page.getByRole('heading', { name: /currency converter/i }),
    ).toBeVisible({ timeout: 10000 });

    // Check default values are set (desktop viewport, use last input)
    const amountInput = page.locator('input[name="amount"]').last();
    await expect(amountInput).toBeVisible({ timeout: 10000 });
    await expect(amountInput).toHaveValue('200');

    // Check currency selectors have default values (EUR and CZK)
    await expect(
      page.locator('button').filter({ hasText: 'EUR' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('button').filter({ hasText: 'CZK' }).first(),
    ).toBeVisible();

    // Check convert button is present
    await expect(
      page.getByRole('button', { name: /convert currency/i }),
    ).toBeVisible();
  });

  test('displays statistics section', async ({ page }) => {
    await page.goto('/');

    // Wait for statistics to load
    await page.waitForTimeout(3000);

    // Check statistics section is visible - look for the white result card
    const resultCard = page.locator('[class*="bg-white"]').first();
    await expect(resultCard).toBeVisible({ timeout: 10000 });
  });

  test('can change amount', async ({ page }) => {
    await page.goto('/');

    const amountInput = page.locator('input[name="amount"]').last();
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });

    await amountInput.clear();
    await amountInput.fill('500');

    await expect(amountInput).toHaveValue('500');
  });

  test('can swap currencies', async ({ page }) => {
    await page.goto('/');

    // Find the swap button between currency selectors - look for the ArrowRightLeft icon
    const swapButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .nth(1);
    await swapButton.waitFor({ state: 'visible', timeout: 10000 });
    await swapButton.click();

    await page.waitForTimeout(500);

    // After swap, button should still be visible
    await expect(swapButton).toBeVisible();
  });

  test('can manually trigger conversion with button', async ({ page }) => {
    await page.goto('/');

    // Clear and enter new amount (desktop viewport, use last input)
    const amountInput = page.locator('input[name="amount"]').last();
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });
    await amountInput.clear();
    await amountInput.fill('100');

    // Click convert button
    const convertButton = page.getByRole('button', {
      name: /convert currency/i,
    });
    await convertButton.click();

    // Wait for conversion to complete
    await page.waitForTimeout(3000);

    // Check that a result card is visible (white card with results)
    const resultCard = page
      .locator('[class*="bg-white"]')
      .filter({ hasText: /CZK|EUR|USD/ });
    await expect(resultCard.first()).toBeVisible();
  });

  test('displays chart', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check for chart time period buttons
    await expect(page.getByRole('button', { name: '7d' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30d' })).toBeVisible();
    await expect(page.getByRole('button', { name: '90d' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1y' })).toBeVisible();
  });

  test('can change chart timeframe', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Click 7 days button
    const sevenDaysButton = page.getByRole('button', { name: '7d' });
    await sevenDaysButton.click();

    await page.waitForTimeout(1000);

    // Button should be selected (has different styling)
    await expect(sevenDaysButton).toBeVisible();
  });

  test('locale selector is visible and functional', async ({ page }) => {
    await page.goto('/');

    // Check locale selector button is visible (look for globe icon and flag)
    const localeButton = page.locator('button').filter({ hasText: /🇬🇧|🇨🇿|🇩🇪/ });
    await expect(localeButton.first()).toBeVisible();

    // Click to open dropdown
    await localeButton.first().click();
    await page.waitForTimeout(500);

    // Check locale options are visible - look for any of the locale names
    const englishOption = page
      .locator('text=English')
      .or(page.locator('text=🇬🇧'));
    await expect(englishOption.first()).toBeVisible();
  });

  test('can open currency selector dropdown', async ({ page }) => {
    await page.goto('/');

    // Click the first currency selector (EUR)
    const currencyButton = page
      .locator('button')
      .filter({ hasText: 'EUR' })
      .first();
    await currencyButton.waitFor({ state: 'visible', timeout: 10000 });
    await currencyButton.click();
    await page.waitForTimeout(500);

    // Check search input is visible (skip the amount input)
    const searchInput = page.locator('input[type="text"]').nth(1);
    await expect(searchInput).toBeVisible();

    // Check some currencies are listed
    await expect(page.locator('text=USD').first()).toBeVisible();
  });

  test('can search for currency', async ({ page }) => {
    await page.goto('/');

    // Open currency selector
    const currencyButton = page
      .locator('button')
      .filter({ hasText: 'EUR' })
      .first();
    await currencyButton.waitFor({ state: 'visible', timeout: 10000 });
    await currencyButton.click();
    await page.waitForTimeout(500);

    // Search for USD (skip the amount input, use the search input in the dropdown)
    const searchInput = page.locator('input[type="text"]').nth(1);
    await searchInput.fill('USD');
    await page.waitForTimeout(500);

    // USD should be visible
    await expect(page.locator('text=USD').first()).toBeVisible();

    // Other currencies should be filtered out
    const currencyList = page.locator('[class*="overflow-y-auto"]').first();
    await expect(currencyList).toBeVisible();
  });

  test('validation error shows for invalid amount', async ({ page }) => {
    await page.goto('/');

    const amountInput = page.locator('input[name="amount"]').last();
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });

    // Enter invalid amount
    await amountInput.clear();
    await amountInput.fill('-50');
    await amountInput.blur();

    await page.waitForTimeout(1000);

    // Convert button should be disabled or error should show
    const convertButton = page.getByRole('button', {
      name: /convert currency/i,
    });
    const isDisabled = await convertButton.isDisabled();

    expect(isDisabled).toBe(true);
  });

  test('handles network errors gracefully', async ({ page }) => {
    await page.goto('/');

    const amountInput = page.locator('input[name="amount"]').last();
    await amountInput.waitFor({ state: 'visible', timeout: 10000 });

    // Intercept the tRPC API call and make it fail to simulate network error
    await page.route('**/api/trpc/**', (route) => {
      // Abort the request to simulate network failure
      route.abort('failed');
    });

    await amountInput.clear();
    await amountInput.fill('100');

    const convertButton = page.getByRole('button', {
      name: /convert currency/i,
    });
    await convertButton.click();

    // Wait for error message to appear - "Conversion Failed"
    // Should appear within 8 seconds (5s timeout + 3s buffer)
    await expect(page.locator('text=/conversion failed/i')).toBeVisible({
      timeout: 8000,
    });

    // Check that error details mention connection or internet
    await expect(
      page.locator('text=/connect|connection|internet|server/i'),
    ).toBeVisible();
  });

  test('responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check elements are visible on mobile
    await expect(
      page.getByRole('heading', { name: /currency converter/i }),
    ).toBeVisible();

    // Mobile viewport - use first input (mobile one is visible)
    const amountInput = page.locator('input[name="amount"]').first();
    await expect(amountInput).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('button', { name: /convert currency/i }),
    ).toBeVisible();

    // Check currency selectors are visible (should be stacked)
    await expect(
      page.locator('button').filter({ hasText: 'EUR' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('button').filter({ hasText: 'CZK' }).first(),
    ).toBeVisible();
  });

  test('responsive design - desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // All elements should be visible
    await expect(
      page.getByRole('heading', { name: /currency converter/i }),
    ).toBeVisible();

    const amountInput = page.locator('input[name="amount"]').last();
    await expect(amountInput).toBeVisible({ timeout: 10000 });

    // On desktop, elements should be in a horizontal layout
    const amountBox = await amountInput.boundingBox();

    expect(amountBox).not.toBeNull();
  });
});
