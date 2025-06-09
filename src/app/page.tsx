"use client";

import { Application, Entity } from "@playcanvas/react";
import { Camera, GSplat, EnvAtlas } from "@playcanvas/react/components";
import { OrbitControls } from "../lib/@playcanvas/react";
import { useSplat, useEnvAtlas } from "@playcanvas/react/hooks";
import AutoRotate from "../components/AutoRotate";

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

type ModelViewerProps = {
    splatURL?: string;
    fov?: number;
    distanceMin?: number;
    distanceMax?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
    scale?: [number, number, number];
};

const defaultModelViewerProps: Required<ModelViewerProps> = {
    splatURL:
        "https://artifact.swarobo.ai/250326_incheon_car_5drones/250326_realitycapture_splatfacto_mcmc/260325_incheon_car_only_processed.compressed.ply",
    fov: 60,
    distanceMin: 3,
    distanceMax: 6,
    rotation: [0, 0, 0],
    position: [0, 0, 0],
    scale: [1, 1, 1],
};

const ModelViewer = (props: ModelViewerProps = defaultModelViewerProps) => {
    const {
        splatURL,
        fov,
        distanceMin,
        distanceMax,
        rotation,
        position,
        scale,
    } = { ...props, ...defaultModelViewerProps };
    /**
     * Loading a Gaussian Splat ply
     */

    const { asset: splat } = useSplat(splatURL);

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
                        // mouse={{
                        //     orbitSensitivity: 0.1,
                        //     distanceSensitivity: 0.05,
                        // }}
                        inertiaFactor={0.1}
                    />
                )}
                <AutoRotate startDelay={1} startFadeInTime={2} />
            </Entity>
            {/* Create the splat entity */}
            <Entity>{splat && <GSplat asset={splat} />}</Entity>
        </Entity>
    );
};

<ModelViewer />;

const Page = () => (
    <Application>
        <ModelViewer />
        <div className="logo-container">
            <a href="https://swarobo.ai/" target="_blank" rel="noopener noreferrer">
                <img src="/logo-swarobo.png" alt="SWAROBO Logo" className="swarobo-logo" />
            </a>
        </div>
    </Application>
);
export default Page;
