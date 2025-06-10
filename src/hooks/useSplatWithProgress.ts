import { useEffect, useState } from "react";
import { useApp } from "@playcanvas/react/hooks";
import { Asset } from "playcanvas";

type UseSplatWithProgressResult = {
    asset: Asset | null; // PlayCanvas Asset object
    loading: boolean;
    error: string | null;
    progress: number; // Download progress (0-100)
};

export const useSplatWithProgress = (
    src: string,
    onProgress?: (progress: number) => void
): UseSplatWithProgressResult => {
    const app = useApp();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let assetInstance: Asset | null = null;
        // Define handlers in a scope accessible by the cleanup function
        let currentHandleProgressEvent: ((receivedLength: number, total: number) => void) | null = null;
        let currentHandleLoad: (() => void) | null = null;
        let currentHandleError: ((err: any) => void) | null = null;

        const loadSplatData = async () => {
            if (!src || !app) {
                setError("Source URL or PlayCanvas app not available.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setProgress(0);
            setAsset(null);
            setError(null);

            const assetName = `splat-asset-${Date.now()}-${src.substring(src.lastIndexOf('/') + 1)}`;
            // Assign to the outer scope variable
            assetInstance = new Asset(assetName, 'gsplat', { url: src });

            currentHandleProgressEvent = (receivedLength: number, total: number) => {
                let percentage = 0;
                if (total > 0) {
                    percentage = Math.round((receivedLength / total) * 100);
                }
                setProgress(percentage);
                onProgress?.(percentage);
            };

            currentHandleLoad = () => {
                if (assetInstance) {
                    setAsset(assetInstance);
                }
                setProgress(100);
                onProgress?.(100);
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            };

            currentHandleError = (err: any) => {
                console.error("useSplatWithProgress: Asset 'error' event fired. Full error object:", err);
                console.error("useSplatWithProgress: Asset 'error' message:", err?.message);
                console.error("useSplatWithProgress: Asset 'error' stringified:", JSON.stringify(err));
                setError(err?.message || `Failed to load splat asset: ${src}`);
                setLoading(false);
            };

            assetInstance.on('progress', currentHandleProgressEvent);
            assetInstance.once('load', currentHandleLoad);
            assetInstance.once('error', currentHandleError);

            app.assets.add(assetInstance);
            app.assets.load(assetInstance);
        };

        loadSplatData();

        // Cleanup function directly returned by useEffect
        return () => {
            if (assetInstance) {
                if (currentHandleProgressEvent) {
                    assetInstance.off('progress', currentHandleProgressEvent);
                }
                if (currentHandleLoad) {
                    assetInstance.off('load', currentHandleLoad);
                }
                if (currentHandleError) {
                    assetInstance.off('error', currentHandleError);
                }
                // Optionally remove asset from registry
                // if (app && app.assets.get(assetInstance.id)) {
                //     app.assets.remove(assetInstance);
                // }
            }
        };
    }, [src, app, onProgress]);

    return { asset, loading, error, progress };
};
