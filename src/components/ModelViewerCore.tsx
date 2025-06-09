import React from "react";
import { Entity } from "@playcanvas/react";
import { Camera, GSplat, EnvAtlas } from "@playcanvas/react/components";
import { OrbitControls } from "../lib/@playcanvas/react";
import { useEnvAtlas } from "@playcanvas/react/hooks";
import AutoRotate from "./AutoRotate";

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
    return (
        <Entity>
            {/* Create a camera entity */}
            <EnvAtlasComponent src="/autumn_field_puresky_16k-envAtlas.png" />

            <Entity rotation={rotation} position={position} scale={scale}>
                <Camera fov={fov} />
                {splat && (
                    <OrbitControls
                        distanceMin={distanceMin}
                        distanceMax={distanceMax}
                        inertiaFactor={0.1}
                        distance={distance}
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
        </Entity>
    );
};

export default ModelViewerCore;
