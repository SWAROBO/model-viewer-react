import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Model Loading', () => {
  test('should load the main page and display the model viewer with a loaded model successfully', async ({ page }) => {
    let consoleErrorDetected = false;
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes("useSplatWithProgress: Asset 'error' event fired")) {
        consoleErrorDetected = true;
      }
    });

    // Mock the useSplatWithProgress hook to simulate a successful load
    await page.addInitScript(() => {
      // This script runs in the browser context before the page loads
      // We need to find the module that exports useSplatWithProgress and override it.
      // This is a heuristic and might break if Next.js bundling changes.
      Object.defineProperty(window, '__MOCKED_USE_SPLAT_WITH_PROGRESS__', {
        value: (src: string, onProgress?: (progress: number) => void) => {
          // Simulate progress
          if (onProgress) {
            onProgress(0);
            setTimeout(() => onProgress(50), 50);
            setTimeout(() => onProgress(100), 100);
          }
          return {
            asset: { name: 'mock-splat-asset', resource: 'mock-resource' }, // Mock a loaded asset
            loading: false,
            error: null,
            progress: 100,
          };
        },
        writable: true,
        configurable: true,
      });

      // Override the actual import if possible (this is highly dependent on bundler output)
      // This part is tricky and might require more specific knowledge of Next.js internals.
      // For now, we'll rely on the component checking for a global mock.
      // A more robust solution might involve a custom Playwright fixture or a babel plugin.
    });

    // Intercept the CSV data request and provide mock data for a successful load
    await page.route('https://docs.google.com/sheets/d/e/2PACX-1vQfhgeGSlSB4Mcs_lxRjIgFBqOEv5n0gpMnP71-Ef_5ykDd_aIzTFA-khURX3-sE6OTFttJE56ZHOpZ/pub?gid=0&single=true&output=csv', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: `model,splatURL,fov,distanceMin,distanceMax,pitchAngleMin,pitchAngleMax,distance,rotation,position,scale
test-model,/test.splat,50,1,10,10,90,5,0,0,0,0,0,0,0,0,1,1,1`, // splatURL here doesn't matter as hook is mocked
      });
    });

    await page.goto('/?model=test-model'); // Load the page with the mocked model

    await expect(page).toHaveTitle(/Model Viewer/); // Adjust title as per your app

    // Wait for the loading progress indicator to disappear
    const loadingProgress = page.getByTestId('model-loading-progress-container');
    await expect(loadingProgress).toBeHidden({ timeout: 20000 });

    // Check for the canvas element within the container, which indicates PlayCanvas has rendered.
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 20000 }); // Increased timeout for canvas visibility
    await expect(canvas).toBeInViewport(); // Ensure it's actually visible

    // Optionally, check the dimensions of the canvas to ensure it's not 0x0
    const canvasBoundingBox = await canvas.boundingBox();
    expect(canvasBoundingBox?.width).toBeGreaterThan(0);
    expect(canvasBoundingBox?.height).toBeGreaterThan(0);

    // Assert that no relevant console errors were detected during loading
    expect(consoleErrorDetected).toBe(false);
    // Assert that no error message is displayed
    const errorMessage = page.getByTestId('model-loading-error-message');
    await expect(errorMessage).not.toBeVisible();
  });

  test('should display an error message when a model fails to load', async ({ page }) => {
    // Force useSplatWithProgress to return an error and mock useModelData
    await page.addInitScript(() => {
      window.__FORCE_SPLAT_ERROR__ = true;

      // Mock useModelData to return specific data for the test
      Object.defineProperty(window, '__MOCKED_USE_MODEL_DATA__', {
        value: (csvUrl: string) => {
          return {
            modelData: [{
              model: 'test-model',
              splatURL: '/test.splat', // This is the URL that will be passed to useSplatWithProgress
              fov: 50,
              distanceMin: 1,
              distanceMax: 10,
              pitchAngleMin: 10,
              pitchAngleMax: 90,
              distance: 5,
              rotation: [0, 0, 0],
              position: [0, 0, 0],
              scale: [1, 1, 1],
            }],
            defaultModelViewerProps: {
              splatURL: '/test.splat',
              fov: 50,
              distanceMin: 1,
              distanceMax: 10,
              pitchAngleMin: 10,
              pitchAngleMax: 90,
              distance: 5,
              rotation: [0, 0, 0],
              position: [0, 0, 0],
              scale: [1, 1, 1],
            },
          };
        },
        writable: true,
        configurable: true,
      });
    });

    // Intercept the CSV data request (though it will be bypassed by the mock)
    await page.route('https://docs.google.com/sheets/d/e/2PACX-1vQfhgeGSlSB4Mcs_lxRjIgFBqOEv5n0gpMnP71-Ef_5ykDd_aIzTFA-khURX3-sE6OTFttJE56ZHOpZ/pub?gid=0&single=true&output=csv', route => {
      route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: `model,splatURL,fov,distanceMin,distanceMax,pitchAngleMin,pitchAngleMax,distance,rotation,position,scale
test-model,/test.splat,50,1,10,10,90,5,0,0,0,0,0,0,0,0,1,1,1`,
      });
    });

    await page.goto('/?model=test-model'); // Load the page with the mocked model

    await expect(page).toHaveTitle(/Model Viewer/); // Adjust title as per your app

    // Expect the error message to be visible
    const errorMessage = page.getByTestId('model-loading-error-message');
    await errorMessage.waitFor({ state: 'visible', timeout: 20000 }); // Wait for it to be visible
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/Forced error for: \/test.splat/); // Check for the forced error text
  });
});
