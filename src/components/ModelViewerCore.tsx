import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Entity } from "@playcanvas/react";
import { Camera, GSplat, EnvAtlas } from "@playcanvas/react/components";
import { OrbitControls } from "../lib/@playcanvas/react";
import { useEnvAtlas } from "@playcanvas/react/hooks";
import AutoRotate from "./AutoRotate";
import RangeSlider from "react-range-slider-input";
import "react-range-slider-input/dist/style.css";

// Load the environment atlas asset
const EnvAtlasComponent = ({ src }: { src: string }) => {
    const { asset } = useEnvAtlas(src);

    if (!asset) return null;

    return (
        <Entity>
            <EnvAtlas asset={asset} skyboxIntensity={0.5} />
        </Entity>
    );
};

type ModelViewerCoreProps = {
    splat: any | null; // Using 'any' temporarily for PlayCanvas Asset type
    fov?: number;
    distanceMin?: number;
    distanceMax?: number;
    distance?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
    scale?: [number, number, number];
    pitchAngleMin?: number;
    pitchAngleMax?: number;
};

const ModelViewerCore: React.FC<ModelViewerCoreProps> = ({
    splat,
    fov = 60,
    distanceMin = 3,
    distanceMax = 6,
    distance = 5,
    rotation = [0, 0, 0],
    position = [0, 0, 0],
    scale = [1, 1, 1],
    pitchAngleMin = 0, // Default from types/modelViewer.ts
    pitchAngleMax = 90, // Default from types/modelViewer.ts
}) => {
    const searchParams = useSearchParams();
    const showSettings = searchParams.get("settings") === "true";

    const [minDistance, setMinDistance] = useState(distanceMin);
    const [maxDistance, setMaxDistance] = useState(distanceMax);
    const [currentDistance, setCurrentDistance] = useState(distance);

    const [minPitchAngle, setMinPitchAngle] = useState(pitchAngleMin);
    const [maxPitchAngle, setMaxPitchAngle] = useState(pitchAngleMax);

    const [currentPosition, setCurrentPosition] = useState(position);
    const [currentRotation, setCurrentRotation] = useState(rotation);

    const [isSliderActive, setIsSliderActive] = useState(false);

    const updateMinDistance = (value: number) => {
        if (value != minDistance) {
            setMinDistance(value);
            setCurrentDistance(value);
        }
    };
    const updateMaxDistance = (value: number) => {
        if (value != maxDistance) {
            setMaxDistance(value);
            setCurrentDistance(value);
        }
    };

    const updateMinPitchAngle = (value: number) => {
        if (value != minPitchAngle) {
            setMinPitchAngle(value);
        }
    };

    const updateMaxPitchAngle = (value: number) => {
        if (value != maxPitchAngle) {
            setMaxPitchAngle(value);
        }
    };

    useEffect(() => {
        // Ensure minDistance <= maxDistance
        if (minDistance > maxDistance) {
            setMinDistance(maxDistance);
        }
    }, [minDistance, maxDistance]);

    const updatePosition = (index: number, value: number) => {
        setCurrentPosition((prev) => {
            const newPos = [...prev];
            newPos[index] = value;
            return newPos as [number, number, number];
        });
    };

    const updateRotation = (index: number, value: number) => {
        setCurrentRotation((prev) => {
            const newRot = [...prev];
            newRot[index] = value;
            return newRot as [number, number, number];
        });
    };

    useEffect(() => {
        // Ensure minDistance <= maxDistance
        if (minDistance > maxDistance) {
            setMinDistance(maxDistance);
        }
    }, [minDistance, maxDistance]);

    useEffect(() => {
        // Ensure minPitchAngle <= maxPitchAngle
        if (minPitchAngle > maxPitchAngle) {
            setMinPitchAngle(maxPitchAngle);
        }
    }, [minPitchAngle, maxPitchAngle]);

    return (
        <Entity>
            {/* Create a camera entity */}
            <EnvAtlasComponent src="/autumn_field_puresky_16k-envAtlas.png" />

            <Entity
                rotation={currentRotation}
                position={currentPosition}
                scale={scale}
            >
                <Camera fov={fov} />
                {splat && (
                    <OrbitControls
                        distanceMin={minDistance}
                        distanceMax={maxDistance}
                        inertiaFactor={0.1}
                        distance={currentDistance}
                        pitchAngleMin={minPitchAngle}
                        pitchAngleMax={maxPitchAngle}
                        mouse={isSliderActive ? { distanceSensitivity: 0, orbitSensitivity: 0 } : { distanceSensitivity: 0.05, orbitSensitivity: 0.2 }}
                        touch={isSliderActive ? { distanceSensitivity: 0, orbitSensitivity: 0 } : { distanceSensitivity: 0.05, orbitSensitivity: 0.2 }}
                    />
                )}
                <AutoRotate startDelay={1} startFadeInTime={2} />
            </Entity>
            {/* Create the splat entity */}
            <Entity>{splat && <GSplat asset={splat} />}</Entity>

            {showSettings && (
                <div
                    style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        background: "rgba(0,0,0,0.7)",
                        padding: "15px",
                        borderRadius: "8px",
                        color: "white",
                        fontFamily: "Arial, sans-serif",
                        zIndex: 1000,
                    }}
                    onMouseDown={() => setIsSliderActive(true)}
                    onMouseUp={() => setIsSliderActive(false)}
                    onTouchStart={() => setIsSliderActive(true)}
                    onTouchEnd={() => setIsSliderActive(false)}
                >
                    <h3>Camera Distance Settings</h3>
                    <div style={{ marginBottom: "10px" }}>
                        <label>Min Distance: {minDistance.toFixed(2)}</label>
                        <br />
                        <label>Max Distance: {maxDistance.toFixed(2)}</label>
                    </div>
                    <RangeSlider
                        min={0.1}
                        max={30}
                        step={0.1}
                        value={[minDistance, maxDistance]}
                        onInput={(value: number[]) => {
                            updateMinDistance(value[0]);
                            updateMaxDistance(value[1]);
                        }}
                    />

                    <h3 style={{ marginTop: "20px" }}>
                        Camera Pitch Angle Settings
                    </h3>
                    <div style={{ marginBottom: "10px" }}>
                        <label>
                            Min Pitch Angle: {minPitchAngle.toFixed(2)}
                        </label>
                        <br />
                        <label>
                            Max Pitch Angle: {maxPitchAngle.toFixed(2)}
                        </label>
                    </div>
                    <RangeSlider
                        min={-90}
                        max={90}
                        step={1}
                        value={[minPitchAngle, maxPitchAngle]}
                        onInput={(value: number[]) => {
                            updateMinPitchAngle(value[0]);
                            updateMaxPitchAngle(value[1]);
                        }}
                    />

                    <h3 style={{ marginTop: "20px" }}>
                        Model Position Settings
                    </h3>
                    {["X", "Y", "Z"].map((axis, index) => (
                        <div
                            key={`position-${axis}`}
                            style={{ marginBottom: "10px" }}
                        >
                            <label>
                                Position {axis}:{" "}
                                {currentPosition[index].toFixed(2)}
                            </label>
                            <RangeSlider
                                min={-10}
                                max={10}
                                step={0.1}
                                value={[
                                    currentPosition[index],
                                    currentPosition[index],
                                ]}
                                onInput={(value: number[]) =>
                                    updatePosition(index, value[0])
                                }
                            />
                        </div>
                    ))}

                    <h3 style={{ marginTop: "20px" }}>
                        Model Rotation Settings
                    </h3>
                    {["X", "Y", "Z"].map((axis, index) => (
                        <div
                            key={`rotation-${axis}`}
                            style={{ marginBottom: "10px" }}
                        >
                            <label>
                                Rotation {axis}:{" "}
                                {currentRotation[index].toFixed(2)}
                            </label>
                            <RangeSlider
                                min={-180}
                                max={180}
                                step={0.1}
                                value={[
                                    currentRotation[index],
                                    currentRotation[index],
                                ]}
                                onInput={(value: number[]) =>
                                    updateRotation(index, value[0])
                                }
                            />
                        </div>
                    ))}
                </div>
            )}
        </Entity>
    );
};

export default ModelViewerCore;
