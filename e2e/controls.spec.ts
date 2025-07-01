import { test, expect, type Locator, type Page } from '@playwright/test'; // Import Locator and Page

test.beforeEach(async ({ page }) => {
  // Inject CSS to disable animations and transitions
  await page.addStyleTag({
    content: `
      * {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
        -webkit-animation: none !important;
        -moz-animation: none !important;
        -o-animation: none !important;
        -ms-animation: none !important;
        animation: none !important;
      }
    `,
  });

  await page.goto('/?settings=true'); // Navigate to settings page to show controls

  // Wait for the loading progress indicator to disappear
  const loadingProgress = page.getByTestId('model-loading-progress-container');
  await expect(loadingProgress).toBeHidden({ timeout: 20000 });

  // Check for the canvas element within the container, which indicates PlayCanvas has rendered.
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 20000 });
});

// Helper function to get the X coordinate on the slider track for a given value
async function getValueXCoordinate(sliderTrack: Locator, value: number, min: number, max: number) {
  const box = await sliderTrack.boundingBox();
  if (!box) throw new Error('Slider track bounding box not found');
  const percentage = (value - min) / (max - min);
  return box.x + box.width * percentage;
}

test('should interact with Position X slider', async ({ page }) => {
  // Locate the settings panel first
  const settingsPanel = page.getByTestId('model-viewer-settings-panel');
  await expect(settingsPanel).toBeVisible({ timeout: 10000 });

  // Locate the label for "Position X" within the settings panel
  const labelLocator = settingsPanel.locator('label', { hasText: 'Position X' });
  await expect(labelLocator).toBeVisible({ timeout: 10000 });

  // Find the RangeSlider component (which has class 'range-slider') that is a sibling of the label's parent div
  const sliderTrack = labelLocator.locator('xpath=./following-sibling::div[contains(@class, "range-slider")]');
  await expect(sliderTrack).toBeVisible({ timeout: 10000 });

  // Get the bounding box of the slider track to calculate click coordinates
  const trackBoundingBox = await sliderTrack.boundingBox();
  expect(trackBoundingBox).not.toBeNull();

  // Get the current value from the label
  const labelText = await labelLocator.textContent();
  const currentValueMatch = labelText?.match(/Position X: (-?\d+\.\d+)/);
  const initialValue = currentValueMatch ? parseFloat(currentValueMatch[1]) : 0;

  // Calculate a target X coordinate on the track to change the value
  // Click slightly to the right of the current thumb position
  const targetX = trackBoundingBox!.x + trackBoundingBox!.width * 0.75; // Click at 75% of the track

  // Click on the slider track to change the value
  await page.mouse.click(targetX, trackBoundingBox!.y + trackBoundingBox!.height / 2);

  // Assert that the value displayed in the label has changed
  const updatedLabelText = await labelLocator.textContent();
  const updatedValueMatch = updatedLabelText?.match(/Position X: (-?\d+\.\d+)/);
  const updatedValue = updatedValueMatch ? parseFloat(updatedValueMatch[1]) : initialValue;

  expect(updatedValue).toBeGreaterThan(initialValue);
});

test('should interact with Camera Distance dual slider', async ({ page }) => {
  // Locate the h3 for "Camera Distance Settings"
  const h3Locator = page.locator('h3', { hasText: 'Camera Distance Settings' });
  await expect(h3Locator).toBeVisible({ timeout: 10000 });

  // Find the RangeSlider component's track
  const sliderTrack = page.locator('h3:has-text("Camera Distance Settings") + div + div.range-slider');
  await expect(sliderTrack).toBeVisible({ timeout: 10000 });

  const trackBoundingBox = await sliderTrack.boundingBox();
  expect(trackBoundingBox).not.toBeNull();

  // Locate the two thumbs.
  const thumbs = sliderTrack.locator('.range-slider__thumb');
  await expect(thumbs).toHaveCount(2);

  // Get current values from labels
  const labelsContainer = h3Locator.locator('xpath=./following-sibling::div[1]');
  const labelText = await labelsContainer.textContent();
  const minMatch = labelText?.match(/Min Distance: (-?\d+\.\d+)/);
  const maxMatch = labelText?.match(/Max Distance: (-?\d+\.\d+)/);
  const initialMinValue = minMatch ? parseFloat(minMatch[1]) : 0;
  const initialMaxValue = maxMatch ? parseFloat(maxMatch[1]) : 0;

  console.log(`Initial Min Value: ${initialMinValue}, Initial Max Value: ${initialMaxValue}`);

  // Define the slider's min and max range based on the UI (from screenshot)
  const sliderMinRange = 3.00;
  const sliderMaxRange = 6.00;

  // Interact with the min thumb using keyboard
  const minThumb = thumbs.first();
  await minThumb.focus();
  await page.keyboard.press('ArrowRight'); // Move right
  await page.waitForTimeout(200); // Small delay for UI update

  // Interact with the max thumb using keyboard
  const maxThumb = thumbs.last();
  await maxThumb.focus();
  await page.keyboard.press('ArrowLeft'); // Move left
  await page.waitForTimeout(200); // Small delay for UI update

  // Assert that the values displayed in the labels have changed and are within bounds
  const updatedLabelText = await labelsContainer.textContent();
  const updatedMinMatch = updatedLabelText?.match(/Min Distance: (-?\d+\.\d+)/);
  const updatedMaxMatch = updatedLabelText?.match(/Max Distance: (-?\d+\.\d+)/);
  const updatedMinValue = updatedMinMatch ? parseFloat(updatedMinMatch[1]) : initialMinValue;
  const updatedMaxValue = updatedMaxMatch ? parseFloat(updatedMaxMatch[1]) : initialMaxValue;

  console.log(`Updated Min Value: ${updatedMinValue}, Updated Max Value: ${updatedMaxValue}`);

  // Assert that values have changed from initial and are within the expected range
  expect(updatedMinValue).not.toEqual(initialMinValue);
  expect(updatedMaxValue).not.toEqual(initialMaxValue);

  expect(updatedMinValue).toBeGreaterThanOrEqual(sliderMinRange);
  expect(updatedMinValue).toBeLessThanOrEqual(sliderMaxRange);
  expect(updatedMaxValue).toBeGreaterThanOrEqual(sliderMinRange);
  expect(updatedMaxValue).toBeLessThanOrEqual(sliderMaxRange);

  // Also assert that min is less than max
  expect(updatedMinValue).toBeLessThan(updatedMaxValue);
});

test('should toggle grid visibility', async ({ page }) => {
  // The beforeEach hook already navigates to /?settings=true and waits for the model to load.
  // No need for page.goto or page.reload here.

  // Locate the grid visibility toggle checkbox
  const gridToggle = page.getByTestId('grid-visibility-toggle');
  await expect(gridToggle).toBeVisible({ timeout: 20000 });

  // Locate the settings panel to check the data-grid-visible attribute
  const settingsPanel = page.getByTestId('model-viewer-settings-panel');
  await expect(settingsPanel).toBeVisible({ timeout: 20000 });

  // Initially, the grid should be visible (checkbox is checked by default)
  await expect(gridToggle).toBeChecked({ timeout: 15000 });
  await expect(settingsPanel).toHaveAttribute('data-grid-visible', 'true', { timeout: 15000 });

  // Dispatch a click event to hide the grid
  await gridToggle.dispatchEvent('click');
  await expect(gridToggle).not.toBeChecked();
  await expect(settingsPanel).toHaveAttribute('data-grid-visible', 'false');

  // Dispatch a click event again to show the grid
  await gridToggle.dispatchEvent('click');
  await expect(gridToggle).toBeChecked();
  await expect(settingsPanel).toHaveAttribute('data-grid-visible', 'true');
});
