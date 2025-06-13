import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/'); // Assumes baseURL is http://localhost:3000
});

test('should load the main page and display the model viewer', async ({ page }) => {
  await expect(page).toHaveTitle(/Model Viewer/); // Adjust title as per your app

  // Wait for the loading progress indicator to disappear
  const loadingProgress = page.getByTestId('model-loading-progress-container');
  await expect(loadingProgress).toBeHidden();

  // Check for the canvas element within the container, which indicates PlayCanvas has rendered.
  // PlayCanvas typically creates a canvas element directly.
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 20000 }); // Increased timeout for canvas visibility
  await expect(canvas).toBeInViewport(); // Ensure it's actually visible

  // Optionally, check the dimensions of the canvas to ensure it's not 0x0
  const canvasBoundingBox = await canvas.boundingBox();
  expect(canvasBoundingBox?.width).toBeGreaterThan(0);
  expect(canvasBoundingBox?.height).toBeGreaterThan(0);
});
