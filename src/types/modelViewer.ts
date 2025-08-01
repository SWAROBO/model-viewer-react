export type ModelViewerProps = {
    splatURL?: string;
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
    model: string | undefined;
    resolutionPercentage?: number;
    setResolutionPercentage?: React.Dispatch<React.SetStateAction<number>>;
    showSettings?: boolean;
    dynamicResolution?: boolean;
    targetFps?: number;
    lowResScale?: number;
    movementDebounce?: number;
    disableDynamicResolution?: boolean;
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
    pitchAngleMin: 0, // Default value for pitchAngleMin
    pitchAngleMax: 90,  // Default value for pitchAngleMax
    pitchAngle: 10, // Default value for pitchAngle
    model: undefined,
    resolutionPercentage: 100,
    setResolutionPercentage: () => {},
    showSettings: false,
    dynamicResolution: false,
    targetFps: 30,
    lowResScale: 70,
    movementDebounce: 500,
    disableDynamicResolution: false,
};
