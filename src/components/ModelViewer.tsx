"use client";

import React, { useState, useCallback } from "react";
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
        pitchAngle,
        distance,
        rotation,
        position,
        scale,
        model, // Destructure model prop
    } = { ...defaultModelViewerProps, ...props };

    const [downloadProgress, setDownloadProgress] = useState(0);

    const handleProgress = useCallback((progress: number) => {
        setDownloadProgress(progress);
    }, []);

    const { asset: splat, loading, error } = useSplatWithProgress(splatURL, handleProgress); // Destructure error

    usePlayCanvasSetup(); // Use the custom hook for PlayCanvas setup

    return (
        <div data-testid="model-viewer-container">
            <ModelLoadingProgress downloadProgress={downloadProgress} loading={loading} error={error} /> {/* Pass error prop */}
            <ModelViewerCore
                splat={splat}
                fov={fov}
                distanceMin={distanceMin}
                distanceMax={distanceMax}
                distance={distance}
                pitchAngleMin={pitchAngleMin}
                pitchAngleMax={pitchAngleMax}
                pitchAngle={pitchAngle}
                rotation={rotation}
                position={position}
                scale={scale}
                model={model} // Pass model prop
            />
        </div>
    );
};

export default ModelViewer;
