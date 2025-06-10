import React from 'react';
import { render, screen } from '@testing-library/react';
import DualRangeSliderControl from './DualRangeSliderControl';
import { vi } from 'vitest';
// No need for fireEvent if we directly call the mocked onInput

// Mock the react-range-slider-input component
vi.mock('react-range-slider-input', () => ({
  __esModule: true,
  default: vi.fn(({ onInput, value, ...props }) => {
    // Store the onInput function to be able to call it from the test
    (global as any).__mockRangeSliderOnInput = onInput;
    return (
      <div data-testid="mock-range-slider-container">
        <input
          type="range"
          role="slider"
          data-testid="mock-slider-min"
          value={String(value[0])} // Convert to string
          aria-valuenow={String(value[0])} // Explicitly set aria-valuenow
          readOnly // Make it read-only as we'll trigger onInput directly
          {...props}
        />
        <input
          type="range"
          role="slider"
          data-testid="mock-slider-max"
          value={String(value[1])} // Convert to string
          aria-valuenow={String(value[1])} // Explicitly set aria-valuenow
          readOnly // Make it read-only as we'll trigger onInput directly
          {...props}
        />
      </div>
    );
  }),
}));

const defaultProps = {
  title: "Test Range Slider",
  minLabel: "Minimum",
  maxLabel: "Maximum",
  minValue: 25,
  maxValue: 75,
  sliderMin: 0,
  sliderMax: 100,
  step: 1,
  onInput: vi.fn(),
};

describe('DualRangeSliderControl Component', () => {
  beforeEach(() => {
    defaultProps.onInput.mockClear();
  });

  it('should render the title, labels with initial values, and range sliders', () => {
    render(<DualRangeSliderControl {...defaultProps} />);

    // Check for the title
    expect(screen.getByRole('heading', { name: defaultProps.title, level: 3 })).toBeInTheDocument();

    // Check for labels and their initial values (uses toFixed(2))
    // Using a regex to be more flexible with whitespace around the text
    expect(screen.getByText((content, element) => content.startsWith(defaultProps.minLabel) && content.includes(defaultProps.minValue.toFixed(2)))).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.startsWith(defaultProps.maxLabel) && content.includes(defaultProps.maxValue.toFixed(2)))).toBeInTheDocument();
    
    // Check for the range sliders. react-range-slider-input renders two input elements with role="slider".
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(2);

    // Check initial aria-valuenow attributes which should correspond to minValue and maxValue
    // Note: The library might render them in a specific order or structure.
    // This assumes the first slider corresponds to the lower value and the second to the higher value.
    // We need to find which slider corresponds to which value if they are not ordered.
    // A safer check might be to see if one slider has value 25 and the other 75, regardless of order.
    const sliderValues = sliders.map(s => s.getAttribute('aria-valuenow'));
    expect(sliderValues).toContain(String(defaultProps.minValue));
    expect(sliderValues).toContain(String(defaultProps.maxValue));
  });

  it('should render with updated props', () => {
    const updatedProps = {
      title: "Updated Range",
      minLabel: "New Min",
      maxLabel: "New Max",
      minValue: 10,
      maxValue: 90,
      sliderMin: 5,
      sliderMax: 95,
      step: 5,
      onInput: vi.fn(),
    };

    render(<DualRangeSliderControl {...updatedProps} />);

    // Check for the updated title
    expect(screen.getByRole('heading', { name: updatedProps.title, level: 3 })).toBeInTheDocument();

    // Check for updated labels and their values
    expect(screen.getByText((content, element) => content.startsWith(updatedProps.minLabel) && content.includes(updatedProps.minValue.toFixed(2)))).toBeInTheDocument();
    expect(screen.getByText((content, element) => content.startsWith(updatedProps.maxLabel) && content.includes(updatedProps.maxValue.toFixed(2)))).toBeInTheDocument();

    // Check for updated slider values
    const sliders = screen.getAllByRole('slider');
    const sliderValues = sliders.map(s => s.getAttribute('aria-valuenow'));
    expect(sliderValues).toContain(String(updatedProps.minValue));
    expect(sliderValues).toContain(String(updatedProps.maxValue));

    // Check for updated slider min/max/step (these are attributes on the input elements)
  });

  it('should call onInput with the new values when the slider is interacted with', async () => {
    const handleInput = vi.fn();
    render(
      <DualRangeSliderControl
        {...defaultProps}
        onInput={handleInput}
      />
    );

    // Since we mocked RangeSlider, we can directly simulate its onInput being called.
    // In a real scenario, you might simulate a drag, but mocking allows direct testing of the callback.
    // We need to get the mocked component instance and call its onInput prop.
    // This requires a slightly different approach than fireEvent.change on the DOM element.

    // The mock is set up to allow us to directly call the onInput prop of the mocked component.
    // We need to find the instance of the mocked component.
    // A more direct way is to ensure the mock itself exposes a way to trigger the callback.
    // Let's adjust the mock to make it easier to trigger `onInput`.

    // Re-rendering with a new mock that exposes a way to trigger onInput
    // Or, we can just directly call the `handleInput` mock function,
    // assuming the `RangeSlider` would call it.
    // For a more realistic interaction, we'd need to simulate dragging.
    // However, given the complexity of simulating drag for a third-party component,
    // and the goal of testing DualRangeSliderControl's interaction with its onInput prop,
    // directly calling the mocked onInput is acceptable.

    // Let's simulate the onInput being called by the RangeSlider with new values
    const newValues = [30, 80];
    // We need to access the mock instance of RangeSlider and call its onInput prop.
    // This is tricky with `vi.mock` if the component itself isn't exposed.
    // A simpler approach for testing the `onInput` prop of `DualRangeSliderControl`
    // is to ensure that when the underlying `RangeSlider` (mocked) calls its `onInput`,
    // our `handleInput` is triggered.

    // The current mock for `react-range-slider-input` doesn't expose a way to trigger `onInput` easily.
    // Let's refine the mock to allow triggering `onInput` directly.

    // Instead of trying to interact with the mocked DOM element,
    // we can directly call the `onInput` function that `DualRangeSliderControl` passes to `RangeSlider`.
    // This is a unit test for `DualRangeSliderControl`, so we assume `RangeSlider` works correctly.

    // The `onInput` prop of `DualRangeSliderControl` is `handleInput`.
    // The `RangeSlider` component (mocked) receives this `handleInput` as its `onInput` prop.
    // So, we can directly call `handleInput` with new values and assert.
    // This tests that `DualRangeSliderControl` correctly uses the `onInput` prop.

    // This test is more about ensuring the `onInput` prop is correctly wired up.
    // The actual interaction with the slider itself is handled by `react-range-slider-input`.

    // Directly call the mocked onInput function
    (global as any).__mockRangeSliderOnInput([30, 80]);

    expect(handleInput).toHaveBeenCalledTimes(1);
    expect(handleInput).toHaveBeenCalledWith([30, 80]);
  });
});
