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
        distance,
        rotation,
        position,
        scale,
    } = { ...defaultModelViewerProps, ...props };

    const [downloadProgress, setDownloadProgress] = useState(0);

    const handleProgress = useCallback((progress: number) => {
        setDownloadProgress(progress);
    }, []);

    const { asset: splat, loading } = useSplatWithProgress(splatURL, handleProgress);

    usePlayCanvasSetup(); // Use the custom hook for PlayCanvas setup

    return (
        <div data-testid="model-viewer-container">
            <ModelLoadingProgress downloadProgress={downloadProgress} loading={loading} />
            <ModelViewerCore
                splat={splat}
                fov={fov}
                distanceMin={distanceMin}
                distanceMax={distanceMax}
                distance={distance}
                pitchAngleMin={pitchAngleMin}
                pitchAngleMax={pitchAngleMax}
                rotation={rotation}
                position={position}
                scale={scale}
            />
        </div>
    );
};

export default ModelViewer;
