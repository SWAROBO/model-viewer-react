"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Application } from "@playcanvas/react";
import SwaroboLogo from "@/components/SwaroboLogo";
import ModelViewer from "@/components/ModelViewer"; // Import the new ModelViewer component
import { useModelData } from "@/hooks/useModelData";
import { ModelViewerProps } from "@/types/modelViewer";

// Export Page as a named export for testing
export const Page = () => {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhgeGSlSB4Mcs_lxRjIgFBqOEv5n0gpMnP71-Ef_5ykDd_aIzTFA-khURX3-sE6OTFttJE56ZHOpZ/pub?gid=0&single=true&output=csv";
    const { modelData, loading: modelDataLoading, error: modelDataError, defaultModelViewerProps } = useModelData(csvUrl);
    // Initialize currentModelProps with defaultModelViewerProps to ensure it's defined.
    const [currentModelProps, setCurrentModelProps] = useState<ModelViewerProps | undefined>(defaultModelViewerProps);
    const searchParams = useSearchParams();
    const modelName = searchParams.get('model');

    useEffect(() => {
        if (modelDataLoading) {
            // Optionally, set to undefined or a specific loading state if ModelViewer should not render
            // For now, we keep the existing (or default) props while data loads.
            // If you want a "loading" state for ModelViewer props, set to undefined:
            // setCurrentModelProps(undefined); 
            return;
        }
        if (modelDataError) {
            setCurrentModelProps(defaultModelViewerProps); // Fallback on error
            return;
        }

        if (modelData.length > 0) {
            const selectedModel = modelData.find((row: any) => row.model?.toLowerCase() === modelName?.toLowerCase());
            if (selectedModel) {
                const { model, ...rest } = selectedModel;
                setCurrentModelProps(rest);
            } else { // No specific model found by name, or no modelName provided
                const firstModel = modelData[0];
                if (firstModel) { // Use first model if available
                    const { model, ...rest } = firstModel;
                    setCurrentModelProps(rest);
                } else { // Should not happen if modelData.length > 0, but as a safeguard
                    setCurrentModelProps(defaultModelViewerProps);
                }
            }
        } else { // modelData is empty (and not loading, no error)
            setCurrentModelProps(defaultModelViewerProps);
        }
    }, [modelData, modelName, defaultModelViewerProps, modelDataLoading, modelDataError]);

    return (
        <Application>
            {currentModelProps && <ModelViewer {...currentModelProps} />}
            <SwaroboLogo />
        </Application>
    );
};

const DynamicPage = dynamic(() => Promise.resolve(Page), { ssr: false });

export default DynamicPage;
