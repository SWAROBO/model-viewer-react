import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

interface MockRangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: number[];
  onInput?: (values: number[]) => void;
}

// Mock the react-range-slider-input library
const MockRangeSlider = vi.fn((props: MockRangeSliderProps) => {
  // Render a simple div or input that reflects the props for testing purposes
  return (
    <div data-testid="mock-range-slider"
      data-min={props.min}
      data-max={props.max}
      data-step={props.step}
      data-value={JSON.stringify(props.value)}
      onClick={() => props.onInput && props.onInput([props.min + 10, props.max - 10])} // Simulate input
    >
      Mock Range Slider
    </div>
  );
});

import { DualRangeSliderControlProps } from './DualRangeSliderControl'; // Import the actual props type

vi.doMock('react-range-slider-input', () => ({
  __esModule: true,
  default: MockRangeSlider,
}));

describe('DualRangeSliderControl', () => {
  let DualRangeSliderControl: React.ComponentType<DualRangeSliderControlProps>;

  beforeAll(async () => {
    // Dynamically import the component *after* mocks are set up
    const { default: DualRangeSliderControlComponent } = await import('./DualRangeSliderControl');
    DualRangeSliderControl = DualRangeSliderControlComponent;
  });

  beforeEach(() => {
    // Clear mock call history before each test
    MockRangeSlider.mockClear();
  });
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

  it('passes correct props to the RangeSlider component', () => {
    render(<DualRangeSliderControl {...defaultProps} />);

    expect(MockRangeSlider).toHaveBeenCalledTimes(1);
    expect(MockRangeSlider).toHaveBeenCalledWith(
      expect.objectContaining({
        min: defaultProps.sliderMin,
        max: defaultProps.sliderMax,
        step: defaultProps.step,
        value: [defaultProps.minValue, defaultProps.maxValue],
        onInput: expect.anything(), // We'll test the function call separately
      }),
      undefined // Second argument is context/ref, usually undefined for functional components
    );

    const mockSlider = screen.getByTestId('mock-range-slider');
    expect(mockSlider).toHaveAttribute('data-min', defaultProps.sliderMin.toString());
    expect(mockSlider).toHaveAttribute('data-max', defaultProps.sliderMax.toString());
    expect(mockSlider).toHaveAttribute('data-step', defaultProps.step.toString());
    expect(mockSlider).toHaveAttribute('data-value', JSON.stringify([defaultProps.minValue, defaultProps.maxValue]));
  });

  it('calls onInput when the mocked RangeSlider triggers input', () => {
    const handleInput = vi.fn();
    render(<DualRangeSliderControl {...defaultProps} onInput={handleInput} />);

    const mockSlider = screen.getByTestId('mock-range-slider');
    fireEvent.click(mockSlider); // Simulate an interaction that triggers onInput

    expect(handleInput).toHaveBeenCalledTimes(1);
    // The mock's onClick passes [min + 10, max - 10]
    expect(handleInput).toHaveBeenCalledWith([defaultProps.sliderMin + 10, defaultProps.sliderMax - 10]);
  });

  it('updates displayed min/max labels when props change', () => {
    const { rerender } = render(<DualRangeSliderControl {...defaultProps} />);

    expect(screen.getByText(/Min: 20.00/)).toBeInTheDocument();
    expect(screen.getByText(/Max: 80.00/)).toBeInTheDocument();

    const newMinValue = 25;
    const newMaxValue = 75;
    rerender(<DualRangeSliderControl {...defaultProps} minValue={newMinValue} maxValue={newMaxValue} />);

    expect(screen.getByText(`Min: ${newMinValue.toFixed(2)}`)).toBeInTheDocument();
    expect(screen.getByText(`Max: ${newMaxValue.toFixed(2)}`)).toBeInTheDocument();
  });
});
