"use client";

import React, { useState, useCallback, useMemo } from "react"; // Added useMemo
import { useSplatWithProgress } from "../hooks/useSplatWithProgress";
import ModelLoadingProgress from "./ModelLoadingProgress";
import ModelViewerCore from "./ModelViewerCore";
import { usePlayCanvasSetup } from "../hooks/usePlayCanvasSetup";
import { ModelViewerProps, defaultModelViewerProps } from "../types/modelViewer";

const ModelViewer = (props: ModelViewerProps = defaultModelViewerProps) => {
    const {
        splatURL,
        fov,
        distanceMin,
        distanceMax,
        pitchAngleMin,
        pitchAngleMax,
        distance,
        rotation: propRotation, // Renamed to avoid conflict with memoized variable
        position: propPosition, // Renamed
        scale: propScale,       // Renamed
    } = { ...defaultModelViewerProps, ...props };

    // Memoize array props to ensure stable references if their values don't change
    const rotation = useMemo(() => propRotation, [propRotation[0], propRotation[1], propRotation[2]]);
    const position = useMemo(() => propPosition, [propPosition[0], propPosition[1], propPosition[2]]);
    const scale = useMemo(() => propScale, [propScale[0], propScale[1], propScale[2]]);

    const [downloadProgress, setDownloadProgress] = useState(0);

    const handleProgress = useCallback((progress: number) => {
        setDownloadProgress(progress);
    }, []);

    const { asset: splat, loading } = useSplatWithProgress(splatURL, handleProgress);

    usePlayCanvasSetup(); // Use the custom hook for PlayCanvas setup

    return (
        <>
            <ModelLoadingProgress downloadProgress={downloadProgress} loading={loading} />
            <ModelViewerCore
                splat={splat}
                fov={fov}
                distanceMin={distanceMin}
                distanceMax={distanceMax}
                distance={distance}
                pitchAngleMin={pitchAngleMin}
                pitchAngleMax={pitchAngleMax}
                rotation={rotation} // Use memoized rotation
                position={position} // Use memoized position
                scale={scale}       // Use memoized scale
            />
        </>
    );
};

export default ModelViewer;
