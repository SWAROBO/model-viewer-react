import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Entity } from "@playcanvas/react";
import { Camera, GSplat, EnvAtlas } from "@playcanvas/react/components";
import { OrbitControls } from "../lib/@playcanvas/react";
import { useEnvAtlas } from "@playcanvas/react/hooks";
import { Asset, Entity as PcEntity, ScriptComponent } from "playcanvas"; // Import Asset and pc.Entity
import AutoRotate from "./AutoRotate";
import Grid from "./Grid";
import DualRangeSliderControl from "./DualRangeSliderControl";
import SingleValueSliderControl from "./SingleValueSliderControl";
import { useSyncedState } from "../hooks/useSyncedState"; // New import
import { OrbitCamera } from "../lib/@playcanvas/react/orbit-controls/orbit-camera";

// Define an interface for the script component that includes the orbitCamera property
interface OrbitCameraScript extends ScriptComponent {
    orbitCamera: OrbitCamera;
}

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
    pitchAngle?: number;
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
    pitchAngle = 10,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    model, // Destructure model prop
}) => {
    const searchParams = useSearchParams();
    const showSettings = searchParams.get("settings") === "true";

    const [distanceRange, setDistanceRange] = useState<[number, number]>([
        distanceMin,
        distanceMax,
    ]);
    const [pitchAngleRange, setPitchAngleRange] = useState<[number, number]>([
        pitchAngleMin,
        pitchAngleMax,
    ]);
    const [currentPitchAngle, setCurrentPitchAngle] = useSyncedState(pitchAngle);

    // State for UI controls, now using useSyncedState
    const [currentDistance, setCurrentDistance] = useSyncedState(distance);
    const [controlPosition, setControlPosition] = useSyncedState(position);
    const [controlRotation, setControlRotation] = useSyncedState(rotation);

    const cameraEntityRef = React.useRef<PcEntity>(null); // Ref for the camera entity

    // Set initial distance and min/max immediately on mount
    React.useEffect(() => {
        const script = cameraEntityRef.current?.script as OrbitCameraScript | undefined;
        if (script?.orbitCamera) {
            script.orbitCamera.setDistanceImmediate(currentDistance);
            // Also set initial min/max distances
            script.orbitCamera.distanceMin = distanceRange[0];
            script.orbitCamera.distanceMax = distanceRange[1];
            // Set initial pitch angle min/max
            script.orbitCamera.pitchAngleMin = pitchAngleRange[0];
            script.orbitCamera.pitchAngleMax = pitchAngleRange[1];
        }
    }, [currentDistance, distanceRange, pitchAngleRange]); // Add missing dependencies

    // Effect to update orbitCamera's distanceMin and distanceMax when distanceRange changes
    React.useEffect(() => {
        const script = cameraEntityRef.current?.script as OrbitCameraScript | undefined;
        if (script?.orbitCamera) {
            script.orbitCamera.distanceMin = distanceRange[0];
            script.orbitCamera.distanceMax = distanceRange[1];
        }
    }, [distanceRange]); // Re-run when distanceRange changes

    // Effect to update orbitCamera's distance when currentDistance changes
    React.useEffect(() => {
        const script = cameraEntityRef.current?.script as OrbitCameraScript | undefined;
        if (script?.orbitCamera) {
            script.orbitCamera.distance = currentDistance;
        }
    }, [currentDistance]);

    // Effect to update orbitCamera's pitch when currentPitchAngle changes
    React.useEffect(() => {
        const script = cameraEntityRef.current?.script as OrbitCameraScript | undefined;
        if (script?.orbitCamera) {
            script.orbitCamera.pitch = -currentPitchAngle;
        }
    }, [currentPitchAngle]);

    // Removed gSplatEntityPosition and gSplatEntityRotation states
    // Removed useEffect that updated gSplatEntityPosition and gSplatEntityRotation

    const [isSliderActive, setIsSliderActive] = useState(false);
    const [showGrid, setShowGrid] = useState(false); // New state for grid visibility

    // The useEffects for syncing controlPosition and controlRotation are now handled by useSyncedState
    // Removed the useEffect that applied controlPosition/Rotation to entity transform

    const updateDistanceRangeInternal = ([newMin, newMax]: [
        number,
        number
    ]) => {
        newMin = Math.min(newMin, newMax);
        if (newMin !== distanceRange[0] || newMax !== distanceRange[1]) {
            setDistanceRange([newMin, newMax]);

            let updatedCurrentDistance = currentDistance;

            // If newMin has changed, set currentDistance to newMin
            if (newMin !== distanceRange[0]) {
                updatedCurrentDistance = newMin;
            }
            // If newMax has changed, set currentDistance to newMax
            else if (newMax !== distanceRange[1]) {
                updatedCurrentDistance = newMax;
            }

            // Ensure currentDistance is within the new range [newMin, newMax]
            updatedCurrentDistance = Math.max(
                newMin,
                Math.min(updatedCurrentDistance, newMax)
            );

            if (updatedCurrentDistance !== currentDistance) {
                setCurrentDistance(updatedCurrentDistance);
                // Use the inertial setter for smooth movement
                const script = cameraEntityRef.current?.script as OrbitCameraScript | undefined;
                if (script?.orbitCamera) {
                    script.orbitCamera.distance =
                        updatedCurrentDistance;
                }
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

            let updatedCurrentPitchAngle = currentPitchAngle;

            // If newMin has changed, set currentPitchAngle to newMin
            if (newMin !== pitchAngleRange[0]) {
                updatedCurrentPitchAngle = newMin;
            }
            // If newMax has changed, set currentPitchAngle to newMax
            else if (newMax !== pitchAngleRange[1]) {
                updatedCurrentPitchAngle = newMax;
            }

            // Ensure currentPitchAngle is within the new range [newMin, newMax]
            updatedCurrentPitchAngle = Math.max(
                newMin,
                Math.min(updatedCurrentPitchAngle, newMax)
            );

            if (updatedCurrentPitchAngle !== currentPitchAngle) {
                setCurrentPitchAngle(updatedCurrentPitchAngle);
                // Use the immediate setter for instant snapping
                const script = cameraEntityRef.current?.script as OrbitCameraScript | undefined;
                if (script?.orbitCamera) {
                    script.orbitCamera.setPitchImmediate(
                        -updatedCurrentPitchAngle
                    );
                }
            }
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
            <Entity ref={cameraEntityRef}>
                <Camera clearColor="#090707" fov={fov} />
                <OrbitControls
                    // distanceMin and distanceMax are now updated imperatively
                    inertiaFactor={0.1} // Revert inertiaFactor to 0.1 for smooth movement
                    // Removed distance prop to prevent re-evaluation based on currentDistance
                    pitchAngle={currentPitchAngle}
                    // pitchAngleMin and pitchAngleMax are now updated imperatively
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

                    <SingleValueSliderControl
                        label="Distance"
                        value={currentDistance}
                        sliderMin={distanceRange[0]}
                        sliderMax={distanceRange[1]}
                        step={0.1}
                        onInput={(value: number) => {
                            setCurrentDistance(value);
                            const script = cameraEntityRef.current?.script as OrbitCameraScript | undefined;
                            if (script?.orbitCamera) {
                                script.orbitCamera.distance =
                                    value; // Use inertial setter for smooth movement
                            }
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

                    <SingleValueSliderControl
                        label="Pitch Angle"
                        value={currentPitchAngle}
                        sliderMin={pitchAngleRange[0]}
                        sliderMax={pitchAngleRange[1]}
                        step={1}
                        onInput={(value: number) => {
                            setCurrentPitchAngle(value);
                            const script = cameraEntityRef.current?.script as OrbitCameraScript | undefined;
                            if (script?.orbitCamera) {
                                script.orbitCamera.pitch =
                                    -value; // Use inertial setter for smooth movement
                            }
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
