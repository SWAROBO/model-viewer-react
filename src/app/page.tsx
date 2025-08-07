"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Application } from "@playcanvas/react";
import { useApp } from "@playcanvas/react/hooks";
import * as pc from "playcanvas";
import SwaroboLogo from "@/components/SwaroboLogo";
import ModelViewer from "@/components/ModelViewer"; // Import the new ModelViewer component
import { useModelData } from "@/hooks/useModelData";
import { ModelViewerProps } from "@/types/modelViewer";

const Page = () => {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhgeGSlSB4Mcs_lxRjIgFBqOEv5n0gpMnP71-Ef_5ykDd_aIzTFA-khURX3-sE6OTFttJE56ZHOpZ/pub?gid=0&single=true&output=csv";
    const { modelData, defaultModelViewerProps } = useModelData(csvUrl);
    const [currentModelProps, setCurrentModelProps] = useState<ModelViewerProps | undefined>(undefined);
    const searchParams = useSearchParams();
    const modelName = searchParams.get('model');
    const showSettings = searchParams.get("settings") === "true";

    const [resolutionPercentage, setResolutionPercentage] = useState(100); // New state for resolution

    const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
    const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);

    useEffect(() => {
        const handleResize = () => {
            setCanvasWidth(window.innerWidth);
            setCanvasHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (modelData.length > 0) {
            const selectedModel = modelData.find((row: ModelViewerProps) => row.model?.toLowerCase() === modelName?.toLowerCase());
            if (selectedModel) {
                const { ...rest } = selectedModel; // Removed 'model'
                setCurrentModelProps(rest);
            } else {
                const { ...rest } = modelData[0]; // Removed 'model'
                setCurrentModelProps(modelData[0] ? rest : defaultModelViewerProps);
            }
        }
    }, [modelData, modelName, defaultModelViewerProps]);

    return (
        <Application
            resolutionMode={pc.RESOLUTION_AUTO} // Start with AUTO to ensure proper canvas initialization
        >
            <ResolutionHandler
                resolutionPercentage={resolutionPercentage}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
            />
            {currentModelProps && <ModelViewer {...currentModelProps} resolutionPercentage={resolutionPercentage} setResolutionPercentage={setResolutionPercentage} showSettings={showSettings} dynamicResolution={false} targetFps={30} lowResScale={20} movementDebounce={500} />}
            <SwaroboLogo />
        </Application>
    );
};

const ResolutionHandler: React.FC<{
    resolutionPercentage: number;
    canvasWidth: number;
    canvasHeight: number;
}> = ({ resolutionPercentage, canvasWidth, canvasHeight }) => {
    const app = useApp();

    useEffect(() => {
        const calculatedWidth = Math.round(canvasWidth * (resolutionPercentage / 100));
        const calculatedHeight = Math.round(canvasHeight * (resolutionPercentage / 100));
        app.setCanvasResolution(pc.RESOLUTION_FIXED, calculatedWidth, calculatedHeight);
    }, [app, resolutionPercentage, canvasWidth, canvasHeight]);

    return null;
};

const DynamicPage = dynamic(() => Promise.resolve(Page), { ssr: false });

export default DynamicPage;
