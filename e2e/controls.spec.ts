import { test, expect, type Locator, type Page } from '@playwright/test'; // Import Locator and Page

test.beforeEach(async ({ page }) => {
  await page.goto('/?settings=true'); // Navigate to settings page to show controls
});

// Helper function to get the X coordinate on the slider track for a given value
async function getValueXCoordinate(sliderTrack: Locator, value: number, min: number, max: number) {
  const box = await sliderTrack.boundingBox();
  if (!box) throw new Error('Slider track bounding box not found');
  const percentage = (value - min) / (max - min);
  return box.x + box.width * percentage;
}

test('should interact with Position X slider', async ({ page }) => {
  // Locate the label for "Position X"
  const labelLocator = page.locator('label', { hasText: 'Position X' });
  await expect(labelLocator).toBeVisible();

  // Find the RangeSlider component (which has class 'range-slider') that is a sibling of the label's parent div
  // The structure is: div > label, div > RangeSlider (which is a div with class 'range-slider')
  const sliderTrack = labelLocator.locator('xpath=./following-sibling::div[contains(@class, "range-slider")]');
  await expect(sliderTrack).toBeVisible();

  // Get the bounding box of the slider track to calculate drag coordinates
  const trackBoundingBox = await sliderTrack.boundingBox();
  expect(trackBoundingBox).not.toBeNull();

  // Locate the thumb (handle) of the slider.
  const thumb = sliderTrack.locator('.range-slider__thumb').first();
  await expect(thumb).toBeVisible();

  // Get the current value from the label
  const labelText = await labelLocator.textContent();
  const currentValueMatch = labelText?.match(/Position X: (-?\d+\.\d+)/);
  const initialValue = currentValueMatch ? parseFloat(currentValueMatch[1]) : 0;

  // Calculate target X coordinate for the drag.
  // Move the thumb to the right by a fixed pixel amount (e.g., 50 pixels)
  const startX = thumb.boundingBox().then(box => box!.x + box!.width / 2);
  const startY = thumb.boundingBox().then(box => box!.y + box!.height / 2);
  const targetX = (await startX) + 50;

  await page.mouse.move(await startX, await startY);
  await page.mouse.down();
  await page.mouse.move(targetX, await startY, { steps: 10 }); // Smooth drag
  await page.mouse.up();

  // Wait for the value to update in the UI
  await page.waitForTimeout(200);

  // Assert that the value displayed in the label has changed
  const updatedLabelText = await labelLocator.textContent();
  const updatedValueMatch = updatedLabelText?.match(/Position X: (-?\d+\.\d+)/);
  const updatedValue = updatedValueMatch ? parseFloat(updatedValueMatch[1]) : initialValue;

  expect(updatedValue).toBeGreaterThan(initialValue);
});

test('should interact with Camera Distance dual slider', async ({ page }) => {
  // Locate the h3 for "Camera Distance Settings"
  const h3Locator = page.locator('h3', { hasText: 'Camera Distance Settings' });
  await expect(h3Locator).toBeVisible();

  // Find the RangeSlider component (which has class 'range-slider') that is a sibling of the h3's parent div
  // The structure is: h3, div > label, label, RangeSlider (which is a div with class 'range-slider')
  // Locate the RangeSlider component's track (the visible bar) by being a direct sibling of the labels container
  const sliderTrack = page.locator('h3:has-text("Camera Distance Settings") + div + div.range-slider');
  await expect(sliderTrack).toBeVisible();

  const trackBoundingBox = await sliderTrack.boundingBox();
  expect(trackBoundingBox).not.toBeNull();

  // Locate the two thumbs.
  const thumbs = sliderTrack.locator('.range-slider__thumb');
  await expect(thumbs).toHaveCount(2);

  // Get current values from labels (these labels are siblings of the h3)
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

  // Drag the min thumb slightly to the right
  const minThumb = thumbs.first();
  const minThumbBoundingBox = await minThumb.boundingBox();
  expect(minThumbBoundingBox).not.toBeNull();
  const minStartX = minThumbBoundingBox!.x + minThumbBoundingBox!.width / 2;
  const minStartY = minThumbBoundingBox!.y + minThumbBoundingBox!.height / 2;
  const minTargetX = minStartX + 5; // Move right by 5 pixels

  await page.mouse.move(minStartX, minStartY);
  await page.mouse.down();
  await page.mouse.move(minTargetX, minStartY, { steps: 2 });
  await page.mouse.up();

  // Drag the max thumb slightly to the left
  const maxThumb = thumbs.last();
  const maxThumbBoundingBox = await maxThumb.boundingBox();
  expect(maxThumbBoundingBox).not.toBeNull();
  const maxStartX = maxThumbBoundingBox!.x + maxThumbBoundingBox!.width / 2;
  const maxStartY = maxThumbBoundingBox!.y + maxThumbBoundingBox!.height / 2;
  const maxTargetX = maxStartX - 5; // Move left by 5 pixels

  await page.mouse.move(maxStartX, maxStartY);
  await page.mouse.down();
  await page.mouse.move(maxTargetX, maxStartY, { steps: 2 });
  await page.mouse.up();

  // Wait for the values to update in the UI
  await page.waitForTimeout(200);

  // Assert that the values displayed in the labels have changed and are within bounds
  const updatedLabelText = await labelsContainer.textContent();
  const updatedMinMatch = updatedLabelText?.match(/Min Distance: (-?\d+\.\d+)/);
  const updatedMaxMatch = updatedLabelText?.match(/Max Distance: (-?\d+\.\d+)/);
  const updatedMinValue = updatedMinMatch ? parseFloat(updatedMinMatch[1]) : initialMinValue;
  const updatedMaxValue = updatedMaxMatch ? parseFloat(updatedMaxMatch[1]) : initialMaxValue;

  console.log(`Updated Min Value: ${updatedMinValue}, Updated Max Value: ${updatedMaxValue}`);

  // Assert that values have changed from initial and are within the expected range
  // We expect them to change, but not necessarily be strictly greater/less than initial if at extremes
  expect(updatedMinValue).not.toEqual(initialMinValue);
  expect(updatedMaxValue).not.toEqual(initialMaxValue);

  expect(updatedMinValue).toBeGreaterThanOrEqual(sliderMinRange);
  expect(updatedMinValue).toBeLessThanOrEqual(sliderMaxRange);
  expect(updatedMaxValue).toBeGreaterThanOrEqual(sliderMinRange);
  expect(updatedMaxValue).toBeLessThanOrEqual(sliderMaxRange);

  // Also assert that min is less than max
  expect(updatedMinValue).toBeLessThan(updatedMaxValue);
});
