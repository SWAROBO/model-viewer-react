import React, { useState, useEffect } from "react";
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
}) => {
    const searchParams = useSearchParams();
    const showSettings = searchParams.get("settings") === "true";
    
    const [minDistance, setMinDistance] = useState(distanceMin);
    const [maxDistance, setMaxDistance] = useState(distanceMax);
    const [currentDistance, setCurrentDistance] = useState(distance);

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

    useEffect(() => {
        // Ensure minDistance <= maxDistance
        if (minDistance > maxDistance) {
            setMinDistance(maxDistance);
        }
    }, [minDistance, maxDistance]);

    return (
        <Entity>
            {/* Create a camera entity */}
            <EnvAtlasComponent src="/autumn_field_puresky_16k-envAtlas.png" />

            <Entity rotation={rotation} position={position} scale={scale}>
                <Camera fov={fov} />
                {splat && (
                    <OrbitControls
                        distanceMin={minDistance}
                        distanceMax={maxDistance}
                        inertiaFactor={0.1}
                        distance={currentDistance}
                        mouse={{
                            distanceSensitivity: 0.05,
                            orbitSensitivity: 0.2,
                        }}
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
                </div>
            )}
        </Entity>
    );
};

export default ModelViewerCore;
