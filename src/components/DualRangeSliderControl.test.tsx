import { render, screen } from '@testing-library/react';
import DualRangeSliderControl from './DualRangeSliderControl';
import { vi } from 'vitest';

describe('DualRangeSliderControl', () => {
  const defaultProps = {
    title: 'Test Slider',
    minLabel: 'Min',
    maxLabel: 'Max',
    minValue: 20,
    maxValue: 80,
    sliderMin: 0,
    sliderMax: 100,
    step: 1,
    onInput: vi.fn(),
  };

  it('renders the title and labels correctly', () => {
    render(<DualRangeSliderControl {...defaultProps} />);

    expect(screen.getByText('Test Slider')).toBeInTheDocument();
    expect(screen.getByText(/Min: 20.00/)).toBeInTheDocument();
    expect(screen.getByText(/Max: 80.00/)).toBeInTheDocument();
  });

  it('renders the range slider with correct values', () => {
    render(<DualRangeSliderControl {...defaultProps} />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(2)
    expect(sliders[0]).toHaveAttribute('aria-valuenow', '20');
    expect(sliders[1]).toHaveAttribute('aria-valuenow', '80');
  });
});
