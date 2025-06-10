import React from 'react';
import { render, screen } from '@testing-library/react';
import DualRangeSliderControl from './DualRangeSliderControl';
import { vi } from 'vitest';

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
});
