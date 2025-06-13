import { render, screen, fireEvent } from '@testing-library/react';
import SingleValueSliderControl from './SingleValueSliderControl';
import RangeSlider from 'react-range-slider-input';

// Mock the react-range-slider-input library
vi.mock('react-range-slider-input', () => ({
  default: vi.fn((props) => {
    // This mock component will render a native input range element
    // that we can interact with using fireEvent.
    return (
      <input
        type="range"
        aria-label={props['aria-label']}
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value[0]} // Use the first value for single slider
        aria-valuenow={props.value[0]} // Explicitly set aria-valuenow for testing
        onChange={(e) => {
          // When the mocked input changes, call the original onInput prop
          // that SingleValueSliderControl passed to RangeSlider.
          // The RangeSlider's onInput expects an array [value, value].
          props.onInput([parseFloat(e.target.value), parseFloat(e.target.value)]);
        }}
        data-testid="mock-range-slider"
      />
    );
  }),
}));

describe('SingleValueSliderControl', () => {
  it('renders with the correct label and value', () => {
    render(
      <SingleValueSliderControl
        label="Test Slider"
        sliderMin={0}
        sliderMax={100}
        step={1}
        value={50}
        onInput={() => {}}
      />
    );
    expect(screen.getByText(/Test Slider: 50\.00/i)).toBeInTheDocument();
    // We are now mocking RangeSlider to render an input with data-testid="mock-range-slider"
    const slider = screen.getByTestId('mock-range-slider');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('calls onChange with the new value when slider is moved', () => {
    const handleChange = vi.fn();
    render(
      <SingleValueSliderControl
        label="Brightness"
        sliderMin={0}
        sliderMax={100}
        step={1}
        value={50}
        onInput={handleChange}
      />
    );
    // Now we can get the mocked native input and fire a change event on it.
    const slider = screen.getByTestId('mock-range-slider');
    fireEvent.change(slider, { target: { value: '75' } });
    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('displays the current value next to the slider', () => {
    render(
      <SingleValueSliderControl
        label="Volume"
        sliderMin={0}
        sliderMax={10}
        step={1}
        value={7}
        onInput={() => {}}
      />
    );
    expect(screen.getByText(/Volume: 7\.00/i)).toBeInTheDocument();
  });

  it('applies the correct min, max, and step attributes', () => {
    render(
      <SingleValueSliderControl
        label="Range"
        sliderMin={10}
        sliderMax={90}
        step={5}
        value={50}
        onInput={() => {}}
      />
    );
    // Get the mocked native input.
    const slider = screen.getByTestId('mock-range-slider');
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '90');
    expect(slider).toHaveAttribute('step', '5');
  });
});
