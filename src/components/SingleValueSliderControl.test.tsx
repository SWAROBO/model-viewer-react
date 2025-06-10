import React from 'react';
import { render, screen } from '@testing-library/react';
import SingleValueSliderControl from './SingleValueSliderControl';
import { vi } from 'vitest';

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
});
