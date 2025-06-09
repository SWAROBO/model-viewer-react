"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Application } from "@playcanvas/react";
import SwaroboLogo from "../components/SwaroboLogo";
import ModelViewer from "../components/ModelViewer"; // Import the new ModelViewer component
import { useModelData } from "../hooks/useModelData";
import { ModelViewerProps } from "../types/modelViewer";

const Page = () => {
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhgeGSlSB4Mcs_lxRjIgFBqOEv5n0gpMnP71-Ef_5ykDd_aIzTFA-khURX3-sE6OTFttJE56ZHOpZ/pub?gid=0&single=true&output=csv";
    const { modelData, defaultModelViewerProps } = useModelData(csvUrl);
    const [currentModelProps, setCurrentModelProps] = useState<ModelViewerProps | undefined>(undefined);
    const searchParams = useSearchParams();
    const modelName = searchParams.get('model');

    useEffect(() => {
        if (modelData.length > 0) {
            const selectedModel = modelData.find((row: any) => row.model === modelName);
            if (selectedModel) {
                const { model, ...rest } = selectedModel;
                setCurrentModelProps(rest);
            } else {
                const { model, ...rest } = modelData[0];
                setCurrentModelProps(modelData[0] ? rest : defaultModelViewerProps);
            }
        }
    }, [modelData, modelName, defaultModelViewerProps]);

    return (
        <Application>
            {currentModelProps && <ModelViewer {...currentModelProps} />}
            <SwaroboLogo />
        </Application>
    );
};

const DynamicPage = dynamic(() => Promise.resolve(Page), { ssr: false });

export default DynamicPage;
