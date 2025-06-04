"use client";

import { Application, Entity } from "@playcanvas/react";
import { Camera, GSplat, EnvAtlas } from "@playcanvas/react/components";
import { OrbitControls } from "@playcanvas/react/scripts";
import { useSplat, useEnvAtlas } from "@playcanvas/react/hooks";

// Load the environment atlas asset
export const EnvAtlasComponent = ({ src }: { src: string }) => {
    const { asset } = useEnvAtlas(src);

    if (!asset) return null;

    return (
        <Entity>
            <EnvAtlas asset={asset} skyboxIntensity={0.1} />
        </Entity>
    );
};

export const Example = () => {
    /**
     * Loading a Gaussian Splat ply
     */

    const splatURL =
        "https://artifact.swarobo.ai/250326_incheon_car_5drones/250326_realitycapture_splatfacto_mcmc/260325_incheon_car_only_processed.compressed.ply";
    const { asset: splat } = useSplat(splatURL);

    return (
        <Entity>
            {/* Create a camera entity */}
            <EnvAtlasComponent src="/mirrored_hall_4k-envAtlas.png" />

            <Entity>
                <Camera fov={30} />
                {splat && <OrbitControls distanceMin={3} distanceMax={6} />}
            </Entity>
            {/* Create the splat entity */}
            <Entity rotation={[0, -40, 0]} position={[0.2, -1.7, -6]}>
                {splat && <GSplat asset={splat} />}
            </Entity>
        </Entity>
    );
};

<Example />;

const Page = () => (
    <Application>
        <Example />
    </Application>
);
export default Page;
