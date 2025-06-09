export type ModelViewerProps = {
    splatURL?: string;
    fov?: number;
    distanceMin?: number;
    distanceMax?: number;
    distance?: number;
    rotation?: [number, number, number];
    position?: [number, number, number];
    scale?: [number, number, number];
};

export const defaultModelViewerProps: Required<ModelViewerProps> = {
    splatURL:
        "https://artifact.swarobo.ai/250326_incheon_car_5drones/250326_realitycapture_splatfacto_mcmc/260325_incheon_car_only_processed.compressed.ply",
    fov: 60,
    distanceMin: 3,
    distanceMax: 6,
    distance: 5,
    rotation: [0, 0, 0],
    position: [0, 0, 0],
    scale: [1, 1, 1],
};
