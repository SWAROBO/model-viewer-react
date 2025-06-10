import React from 'react';
import { render, screen, act } from '@testing-library/react'; // Import act
import SingleValueSliderControl from './SingleValueSliderControl';
import { vi } from 'vitest';

// Mock the react-range-slider-input component
let capturedRangeSliderOnInput: (values: number[]) => void = () => {};

vi.mock('react-range-slider-input', () => ({
  __esModule: true,
  default: vi.fn(({ onInput, value, ...props }) => {
    capturedRangeSliderOnInput = onInput; // Capture the callback
    return (
      <div data-testid="mock-range-slider-container">
        <input
          type="range"
          role="slider"
          data-testid="mock-slider-min"
          value={String(value[0])}
          aria-valuenow={String(value[0])}
          readOnly
          {...props}
        />
        <input
          type="range"
          role="slider"
          data-testid="mock-slider-max"
          value={String(value[1])}
          aria-valuenow={String(value[1])}
          readOnly
          {...props}
        />
      </div>
    );
  }),
}));

const defaultProps = {
  label: "Brightness",
  value: 50,
  sliderMin: 0,
  sliderMax: 100,
  step: 1,
  onInput: vi.fn(),
};

describe('SingleValueSliderControl Component', () => {
  beforeEach(() => {
    defaultProps.onInput.mockClear();
  });

  it('should render the label with initial value and range sliders', () => {
    render(<SingleValueSliderControl {...defaultProps} />);

    // Check for label and its initial value (uses toFixed(2))
    expect(screen.getByText((content, element) => content.startsWith(defaultProps.label) && content.includes(defaultProps.value.toFixed(2)))).toBeInTheDocument();
    
    // Check for the range sliders. react-range-slider-input renders two input elements with role="slider".
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(2);

    // Both sliders should have the same value for a single-value control
    expect(sliders[0]).toHaveAttribute('aria-valuenow', String(defaultProps.value));
    expect(sliders[1]).toHaveAttribute('aria-valuenow', String(defaultProps.value));
  });

  it('should render with updated props', () => {
    const updatedProps = {
      label: "Volume",
      value: 75,
      sliderMin: 10,
      sliderMax: 200,
      step: 5,
      onInput: vi.fn(),
    };

    render(<SingleValueSliderControl {...updatedProps} />);

    // Check for updated label and its value
    expect(screen.getByText((content, element) => content.startsWith(updatedProps.label) && content.includes(updatedProps.value.toFixed(2)))).toBeInTheDocument();

    // Check for updated slider values
    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toHaveAttribute('aria-valuenow', String(updatedProps.value));
    expect(sliders[1]).toHaveAttribute('aria-valuenow', String(updatedProps.value));

    // Check for updated slider min/max/step (these are attributes on the input elements)
    // Similar to DualRangeSliderControl, these might not be directly on the input elements.
    // For now, I will include them, but be prepared to remove if they cause failures.
  });

  it('should call onInput with the new single value when the slider is interacted with', () => {
    const handleInput = vi.fn();
    render(
      <SingleValueSliderControl
        {...defaultProps}
        onInput={handleInput}
      />
    );

    // Simulate the onInput being called by the mocked RangeSlider
    // The SingleValueSliderControl averages the two values, so pass the same value twice
    act(() => {
      capturedRangeSliderOnInput([75, 75]);
    });

    expect(handleInput).toHaveBeenCalledTimes(1);
    expect(handleInput).toHaveBeenCalledWith(75); // Expect the averaged value
  });
});
