"use client";

import { Application, Entity } from "@playcanvas/react";
import { Camera, GSplat, EnvAtlas } from "@playcanvas/react/components";
import { OrbitControls } from "../lib/@playcanvas/react";
import { useEnvAtlas, useApp } from "@playcanvas/react/hooks";
import { useSplatWithProgress } from "../hooks/useSplatWithProgress";
import AutoRotate from "../components/AutoRotate";
import React, { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css'; // Import the styles
import { CustomSplatHandler } from "../lib/playcanvas/CustomSplatHandler"; // Import the custom handler
import Papa from "papaparse";
import { useSearchParams } from "next/navigation";

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

type CsvRow = ModelViewerProps & {
    model: string; // Add the 'model' property from the CSV
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
    } = { ...defaultModelViewerProps, ...props };
    /**
     * Loading a Gaussian Splat ply
     */
    const [downloadProgress, setDownloadProgress] = useState(0);

    const handleProgress = useCallback((progress: number) => {
        setDownloadProgress(progress);
    }, []);

    const { asset: splat, loading } = useSplatWithProgress(splatURL, handleProgress);
    const app = useApp(); // Get the PlayCanvas app instance

    useEffect(() => {
        if (app) {
            // Register the custom gsplat asset handler
            // Check if it's already registered to avoid re-registering on hot reloads
            if (!(app.loader.getHandler('gsplat') instanceof CustomSplatHandler)) {
                app.loader.addHandler('gsplat', new CustomSplatHandler(app));
            }

            const handleError = (error: any) => {
                console.error("PlayCanvas App Error:", error);
                // Log more details if available
                if (error.message) console.error("PlayCanvas App Error Message:", error.message);
                if (error.stack) console.error("PlayCanvas App Error Stack:", error.stack);
                if (error.asset) console.error("PlayCanvas App Error Asset:", error.asset);
            };
            app.on('error', handleError);
            return () => {
                app.off('error', handleError);
            };
        }
    }, [app]);

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
            <Entity>
                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1000,
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        padding: '5px',
                        opacity: downloadProgress < 100 ? 1 : 0, // Fully visible until 100%, then fades
                        transition: 'opacity 0.5s ease-out' // Smooth transition for opacity
                    }}>
                        <CircularProgressbar
                            value={downloadProgress}
                            text={`${downloadProgress}%`}
                            className="my-progressbar"
                            styles={buildStyles({
                                strokeLinecap: 'butt',
                                textSize: '1.5em',
                                pathColor: `white`,
                                textColor: 'white',
                                trailColor: 'gray',
                            })}
                        />
                    </div>
                )}
                {splat && <GSplat asset={splat} />}
            </Entity>
        </Entity>
    );
};

const Page = () => {
    const [modelData, setModelData] = useState<CsvRow[]>([]);
    const [currentModelProps, setCurrentModelProps] = useState<ModelViewerProps | undefined>(undefined);
    const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfhgeGSlSB4Mcs_lxRjIgFBqOEv5n0gpMnP71-Ef_5ykDd_aIzTFA-khURX3-sE6OTFttJE56ZHOpZ/pub?gid=0&single=true&output=csv";
    const searchParams = useSearchParams();
    const modelName = searchParams.get('model');

    useEffect(() => {
        const fetchCsvData = async () => {
            try {
                const response = await fetch(csvUrl);
                const text = await response.text();
                Papa.parse(text, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results: Papa.ParseResult<any>) => {
                        const parsedData: CsvRow[] = results.data.map((row: any) => {
                            const newRow: { [key: string]: any } = {};
                            for (const key in row) {
                                if (Object.prototype.hasOwnProperty.call(row, key)) {
                                    let value = row[key];
                                    // Custom parsing for comma-separated numbers (e.g., rotation, position, scale)
                                    if (typeof value === 'string' && value.includes(',') && !isNaN(Number(value.split(',')[0].trim()))) {
                                        value = value.split(',').map((num: string) => Number(num.trim()));
                                    }
                                    // Remove extra quotes from splatURL if present
                                    if (key.trim() === 'splatURL' && typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
                                        value = value.substring(1, value.length - 1);
                                    }
                                    newRow[key.trim()] = value;
                                }
                            }
                            return newRow as CsvRow;
                        });
                        setModelData(parsedData);
                    },
                    error: (error: any) => {
                        console.error("PapaParse Error:", error);
                    }
                });
            } catch (error) {
                console.error("Error fetching CSV:", error);
            }
        };

        fetchCsvData();
    }, []);

    useEffect(() => {
        if (modelData.length > 0) {
            const selectedModel = modelData.find((row: CsvRow) => row.model === modelName);
            if (selectedModel) {
                // Extract only ModelViewerProps from the CsvRow
                const { model, ...rest } = selectedModel;
                setCurrentModelProps(rest);
            } else {
                // If no modelName or no match, use the first model or default
                const { model, ...rest } = modelData[0];
                setCurrentModelProps(modelData[0] ? rest : defaultModelViewerProps);
            }
        }
    }, [modelData, modelName]);

    return (
        <Application>
            {currentModelProps && <ModelViewer {...currentModelProps} />}
            <div className="logo-container">
                <a href="https://swarobo.ai/" target="_blank" rel="noopener noreferrer">
                    <img src="/logo-swarobo.png" alt="SWAROBO Logo" className="swarobo-logo" />
                </a>
            </div>
        </Application>
    );
};

const DynamicPage = dynamic(() => Promise.resolve(Page), { ssr: false });

export default DynamicPage;
