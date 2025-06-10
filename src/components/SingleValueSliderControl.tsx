import React from "react";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

type SingleValueSliderControlProps = {
    label: string;
    value: number;
    sliderMin: number;
    sliderMax: number;
    step: number;
    onInput: (value: number) => void;
};

const SingleValueSliderControl: React.FC<SingleValueSliderControlProps> = ({
    label,
    value,
    sliderMin,
    sliderMax,
    step,
    onInput,
}) => {
    return (
        <div style={{ marginBottom: "10px" }}>
            <label>
                {label}: {value.toFixed(2)}
            </label>
            <RangeSlider
                min={sliderMin}
                max={sliderMax}
                step={step}
                value={[value, value]} // Represent single value as a range where min === max
                onInput={(values: number[]) => onInput((values[0] + values[1]) / 2)} // Average to get single value
            />
        </div>
    );
};

export default SingleValueSliderControl;
