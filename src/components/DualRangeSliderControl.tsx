import React from "react";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

type DualRangeSliderControlProps = {
    title: string;
    minLabel: string;
    maxLabel: string;
    minValue: number;
    maxValue: number;
    sliderMin: number;
    sliderMax: number;
    step: number;
    onInput: (values: number[]) => void;
};

const DualRangeSliderControl: React.FC<DualRangeSliderControlProps> = ({
    title,
    minLabel,
    maxLabel,
    minValue,
    maxValue,
    sliderMin,
    sliderMax,
    step,
    onInput,
}) => {
    return (
        <>
            <h3 style={{ marginTop: "20px" }}>{title}</h3>
            <div style={{ marginBottom: "10px" }}>
                <label>
                    {minLabel}: {minValue.toFixed(2)}
                </label>
                <br />
                <label>
                    {maxLabel}: {maxValue.toFixed(2)}
                </label>
            </div>
            <RangeSlider
                min={sliderMin}
                max={sliderMax}
                step={step}
                value={[minValue, maxValue]}
                onInput={onInput}
            />
        </>
    );
};

export default DualRangeSliderControl;
