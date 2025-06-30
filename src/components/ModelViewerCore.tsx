import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Entity } from "@playcanvas/react";
import { Camera, GSplat, EnvAtlas } from "@playcanvas/react/components";
import { OrbitControls } from "../lib/@playcanvas/react";
import { useEnvAtlas } from "@playcanvas/react/hooks";
import { Asset } from "playcanvas"; // Import Asset
import AutoRotate from "./AutoRotate";
import Grid from "./Grid";
import DualRangeSliderControl from "./DualRangeSliderControl";
import SingleValueSliderControl from "./SingleValueSliderControl";
import { useSyncedState } from "../hooks/useSyncedState"; // New import

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

export type ModelViewerCoreProps = {
    // Added export keyword
    splat: Asset | null; // PlayCanvas Asset type
    fov?: number;
    distanceMin?: number;
    distanceMax?: number;
    distance?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
    scale?: [number, number, number];
    pitchAngleMin?: number;
    pitchAngleMax?: number;
    model?: string; // Added model property
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
    pitchAngleMin = 0,
    pitchAngleMax = 90,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    model, // Destructure model prop
}) => {
    const searchParams = useSearchParams();
    const showSettings = searchParams.get("settings") === "true";

    const [distanceRange, setDistanceRange] = useState<[number, number]>([
        distanceMin,
        distanceMax,
    ]);
    const [currentDistance, setCurrentDistance] = useState(distance);

    const [pitchAngleRange, setPitchAngleRange] = useState<[number, number]>([
        pitchAngleMin,
        pitchAngleMax,
    ]);

    // State for UI controls, now using useSyncedState
    const [controlPosition, setControlPosition] = useSyncedState(position);
    const [controlRotation, setControlRotation] = useSyncedState(rotation);

    // Removed gSplatEntityPosition and gSplatEntityRotation states
    // Removed useEffect that updated gSplatEntityPosition and gSplatEntityRotation

    const [isSliderActive, setIsSliderActive] = useState(false);
    const [showGrid, setShowGrid] = useState(true); // New state for grid visibility

    // The useEffects for syncing controlPosition and controlRotation are now handled by useSyncedState
    // Removed the useEffect that applied controlPosition/Rotation to entity transform

    const updateDistanceRangeInternal = ([newMin, newMax]: [
        number,
        number
    ]) => {
        newMin = Math.min(newMin, newMax);
        if (newMin !== distanceRange[0] || newMax !== distanceRange[1]) {
            setDistanceRange([newMin, newMax]);
            // Optionally, adjust currentDistance if it falls outside the new range
            // For now, we'll keep its update logic separate or tied to min change
            if (newMin !== distanceRange[0]) {
                setCurrentDistance(newMin);
            } else if (
                newMax !== distanceRange[1] &&
                currentDistance > newMax
            ) {
                setCurrentDistance(newMax);
            }
        }
    };

    const updatePitchAngleRangeInternal = ([newMin, newMax]: [
        number,
        number
    ]) => {
        newMin = Math.min(newMin, newMax);
        if (newMin !== pitchAngleRange[0] || newMax !== pitchAngleRange[1]) {
            setPitchAngleRange([newMin, newMax]);
        }
    };

    const updatePosition = (index: number, value: number) => {
        setControlPosition((prev) => {
            const newPos = [...prev];
            newPos[index] = value;
            return newPos as [number, number, number];
        });
    };

    const updateRotation = (index: number, value: number) => {
        setControlRotation((prev) => {
            const newRot = [...prev];
            newRot[index] = value;
            return newRot as [number, number, number];
        });
    };

    const orbitControlSensitivity = isSliderActive
        ? { distanceSensitivity: 0, orbitSensitivity: 0 }
        : { distanceSensitivity: 0.05, orbitSensitivity: 0.2 };

    return (
        <Entity>
            {showGrid && <Grid />} {/* Conditionally render Grid */}
            {!showSettings && (
                <EnvAtlasComponent src="/autumn_field_puresky_16k-envAtlas.png" />
            )}
            {/* Create a camera entity */}
            <Entity>
                <Camera clearColor="#090707" fov={fov} />
                <OrbitControls
                    distanceMin={distanceRange[0]}
                    distanceMax={distanceRange[1]}
                    inertiaFactor={0.1}
                    distance={currentDistance}
                    pitchAngleMin={pitchAngleRange[0]}
                    pitchAngleMax={pitchAngleRange[1]}
                    mouse={orbitControlSensitivity}
                    touch={orbitControlSensitivity}
                />

                {!showSettings && (
                    <AutoRotate startDelay={1} startFadeInTime={2} />
                )}
            </Entity>
            {/* Create the splat entity - now directly uses props */}
            <Entity
                position={controlPosition} // Use controlPosition state
                rotation={controlRotation} // Use controlRotation state
                scale={scale}
            >
                {splat && <GSplat asset={splat} />}
            </Entity>
            {showSettings && (
                <div
                    data-testid="model-viewer-settings-panel" // Add data-testid to the settings panel
                    data-grid-visible={showGrid} // Add attribute to reflect grid visibility
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
                    <DualRangeSliderControl
                        title="Camera Distance Settings"
                        minLabel="Min Distance"
                        maxLabel="Max Distance"
                        minValue={distanceRange[0]}
                        maxValue={distanceRange[1]}
                        sliderMin={0.1}
                        sliderMax={30}
                        step={0.1}
                        onInput={(value: number[]) => {
                            updateDistanceRangeInternal([value[0], value[1]]);
                        }}
                    />

                    <DualRangeSliderControl
                        title="Camera Pitch Angle Settings"
                        minLabel="Min Pitch Angle"
                        maxLabel="Max Pitch Angle"
                        minValue={pitchAngleRange[0]}
                        maxValue={pitchAngleRange[1]}
                        sliderMin={-90}
                        sliderMax={90}
                        step={1}
                        onInput={(value: number[]) => {
                            updatePitchAngleRangeInternal([value[0], value[1]]);
                        }}
                    />

                    <h3 style={{ marginTop: "20px" }}>
                        Model Position Settings
                    </h3>
                    {["X", "Y", "Z"].map((axis, index) => (
                        <SingleValueSliderControl
                            key={`position-${axis}`}
                            label={`Position ${axis}`}
                            value={controlPosition[index]}
                            sliderMin={-10}
                            sliderMax={10}
                            step={0.1}
                            onInput={(value: number) =>
                                updatePosition(index, value)
                            }
                        />
                    ))}

                    <h3 style={{ marginTop: "20px" }}>
                        Model Rotation Settings
                    </h3>
                    {["X", "Y", "Z"].map((axis, index) => (
                        <SingleValueSliderControl
                            key={`rotation-${axis}`}
                            label={`Rotation ${axis}`}
                            value={controlRotation[index]}
                            sliderMin={-180}
                            sliderMax={180}
                            step={0.1}
                            onInput={(value: number) =>
                                updateRotation(index, value)
                            }
                        />
                    ))}

                    <h3 style={{ marginTop: "20px" }}>Display Settings</h3>
                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "10px",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={(e) => setShowGrid(e.target.checked)}
                            data-testid="grid-visibility-toggle"
                            style={{ marginRight: "8px" }}
                        />
                        Show Grid
                    </label>
                </div>
            )}
        </Entity>
    );
};

export default ModelViewerCore;
