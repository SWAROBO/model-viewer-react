import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Entity } from "@playcanvas/react";
import { Camera, GSplat, EnvAtlas } from "@playcanvas/react/components";
import { OrbitControls } from "../lib/@playcanvas/react";
import { useEnvAtlas, useApp } from "@playcanvas/react/hooks";
import { Asset, Entity as PcEntity, ScriptComponent, Mat4, EVENT_MOUSEDOWN, EVENT_TOUCHSTART } from "playcanvas"; // Import Asset, pc.Entity, and event constants
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
    resolutionPercentage?: number;
    setResolutionPercentage?: React.Dispatch<React.SetStateAction<number>>;
    showSettings?: boolean;
    dynamicResolution?: boolean;
    targetFps?: number;
    lowResScale?: number;
    movementDebounce?: number;
    disableDynamicResolution?: boolean;
    backgroundColor?: string;
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
    resolutionPercentage = 100,
    setResolutionPercentage = () => {},
    showSettings = false,
    dynamicResolution = false,
    targetFps = 30,
    lowResScale = 10,
    movementDebounce = 500,
    disableDynamicResolution: initialDisableDynamicResolution = false,
    backgroundColor = "",
}) => {
    const [disableDynamicResolution, setDisableDynamicResolution] = useState(initialDisableDynamicResolution);
    const searchParams = useSearchParams();
    // The showSettings prop is now passed from the parent, so we don't need to derive it from searchParams here.
    // However, the original code had a local showSettings state derived from searchParams.
    // To maintain the original behavior where showSettings is also controlled by the URL parameter,
    // we will keep the useSearchParams and update the local showSettings state if the prop is not provided.
    // If the prop is provided, it will override the URL parameter.
    const urlShowSettings = searchParams.get("settings") === "true";
    const effectiveShowSettings = showSettings || urlShowSettings;

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
    const [controlRotation, setControlRotation] = useSyncedState([rotation[0] + 180, rotation[1] + 180, rotation[2]] as [number, number, number]);
    const [frameRate, setFrameRate] = useState(60);
    const app = useApp();
    const lastMoveTimeRef = React.useRef(0);
    const lastCameraMatrix = React.useRef(new Mat4());
    const cameraEntityRef = React.useRef<PcEntity>(null); // Ref for the camera entity

    const resolutionPercentageRef = React.useRef(resolutionPercentage);
    const setResolutionPercentageRef = React.useRef(setResolutionPercentage);
    
    // Update refs when props change
    React.useEffect(() => {
        resolutionPercentageRef.current = resolutionPercentage;
        setResolutionPercentageRef.current = setResolutionPercentage;
    }, [resolutionPercentage, setResolutionPercentage]);

    useEffect(() => {
        let animationFrameId: number;
        
        const updateFrameRate = () => {
            if (app) {
                setFrameRate(Math.round(app.stats.frame.fps));

                if (dynamicResolution && !disableDynamicResolution && cameraEntityRef.current) {
                    const camera = cameraEntityRef.current.camera;
                    if (camera) {
                        const currentMatrix = camera.viewMatrix;
                        if (!currentMatrix.equals(lastCameraMatrix.current)) {
                            lastMoveTimeRef.current = Date.now();
                            lastCameraMatrix.current.copy(currentMatrix);
                        }

                        const isMoving = (Date.now() - lastMoveTimeRef.current) < movementDebounce;

                        if (isMoving && app.stats.frame.fps < targetFps) {
                            if (resolutionPercentageRef.current !== lowResScale) {
                                setResolutionPercentageRef.current(lowResScale);
                            }
                        } else if (!isMoving) {
                            if (resolutionPercentageRef.current !== 100) {
                                setResolutionPercentageRef.current(100);
                            }
                        }
                    }
                }
            }
            animationFrameId = requestAnimationFrame(updateFrameRate);
        };

        animationFrameId = requestAnimationFrame(updateFrameRate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [app, dynamicResolution, targetFps, lowResScale, movementDebounce, disableDynamicResolution]);

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

    const [isSliderActive, setIsSliderActive] = useState(false);
    const [showGrid, setShowGrid] = useState(false); // New state for grid visibility
    const [isInteracting, setIsInteracting] = useState(false);

    const handleInteractionStart = useCallback(() => setIsInteracting(true), []);
    const handleInteractionEnd = useCallback(() => setIsInteracting(false), []);

    // Effect to handle user interaction with OrbitControls
    React.useEffect(() => {
        if (app) {
            // Listen for mouse down on the app's canvas
            if (app.mouse) {
                app.mouse.on(EVENT_MOUSEDOWN, handleInteractionStart);
            }

            // Listen for mouse up globally
            window.addEventListener("mouseup", handleInteractionEnd);

            // Listen for touch start on the app's canvas
            if (app.touch) {
                app.touch.on(EVENT_TOUCHSTART, handleInteractionStart);
            }

            // Listen for touch end/cancel globally
            window.addEventListener("touchend", handleInteractionEnd);
            window.addEventListener("touchcancel", handleInteractionEnd);

            return () => {
                // Clean up event listeners
                if (app.mouse) {
                    app.mouse.off(EVENT_MOUSEDOWN, handleInteractionStart);
                }
                window.removeEventListener("mouseup", handleInteractionEnd);

                if (app.touch) {
                    app.touch.off(EVENT_TOUCHSTART, handleInteractionStart);
                }
                window.removeEventListener("touchend", handleInteractionEnd);
                window.removeEventListener("touchcancel", handleInteractionEnd);
            };
        }
    }, [app, handleInteractionStart, handleInteractionEnd]); // Depend on app and memoized handlers

    // Removed gSplatEntityPosition and gSplatEntityRotation states
    // Removed useEffect that updated gSplatEntityPosition and gSplatEntityRotation

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

    const MemoizedGSplat = useMemo(() => {
        // Memoize GSplat to prevent re-renders from triggering the warning
        const Memoized = React.memo(({ asset }: { asset: Asset }) => <GSplat asset={asset} />);
        Memoized.displayName = "MemoizedGSplat";
        return Memoized;
    }, []);

    return (
        <Entity>
            {showGrid && <Grid />} {/* Conditionally render Grid */}
            {!showSettings && !backgroundColor && (
                <EnvAtlasComponent src="/autumn_field_puresky_16k-envAtlas.png" />
            )}
            {/* Create a camera entity */}
            <Entity ref={cameraEntityRef}>
                <Camera
                    clearColor={backgroundColor ? backgroundColor : "#090707"}
                    fov={fov}
                />
                <OrbitControls
                    // distanceMin and distanceMax are now updated imperatively
                    inertiaFactor={0.1} // Revert inertiaFactor to 0.1 for smooth movement
                    // Removed distance prop to prevent re-evaluation based on currentDistance
                    pitchAngle={currentPitchAngle}
                    // pitchAngleMin and pitchAngleMax are now updated imperatively
                    mouse={orbitControlSensitivity}
                    touch={orbitControlSensitivity}
                />
                {!showSettings && !isInteracting && (
                    <AutoRotate startDelay={1} startFadeInTime={2} />
                )}
            </Entity>
            {/* Create the splat entity - now directly uses props */}
            {splat && (
                <Entity
                    key={splat.id}
                    position={controlPosition} // Use controlPosition state
                    rotation={controlRotation} // Use controlRotation state
                    scale={scale}
                >
                    <MemoizedGSplat asset={splat} />
                </Entity>
            )}
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

                    <label
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "10px",
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={disableDynamicResolution}
                            onChange={(e) => setDisableDynamicResolution(e.target.checked)}
                            style={{ marginRight: "8px" }}
                        />
                        Turn off dynamic resolution
                    </label>

                    {effectiveShowSettings && (
                        <SingleValueSliderControl
                            label="Resolution"
                            value={resolutionPercentage}
                            sliderMin={1}
                            sliderMax={100}
                            step={1}
                            onInput={(value: number) => {
                                setResolutionPercentage(value);
                            }}
                        />
                    )}
                    <div style={{ marginTop: "10px" }}>
                        <span>Frame Rate: {frameRate} FPS</span>
                    </div>
                </div>
            )}
        </Entity>
    );
};

export default ModelViewerCore;
