import { useEffect, useState, useCallback } from "react";
import { useApp } from "@playcanvas/react/hooks";
import { Asset } from "playcanvas";

type UseSplatWithProgressResult = {
    asset: any; // PlayCanvas Asset object
    loading: boolean;
    error: string | null;
    progress: number; // Download progress (0-100)
};

declare global {
    interface Window {
        __MOCKED_USE_SPLAT_WITH_PROGRESS__?: (src: string, onProgress?: (progress: number) => void) => UseSplatWithProgressResult;
        __FORCE_SPLAT_ERROR__?: boolean; // Test-specific flag to force an error
    }
}

export const useSplatWithProgress = (
    src: string,
    onProgress?: (progress: number) => void
): UseSplatWithProgressResult => {
    // Determine initial state based on global flags
    const initialResult: UseSplatWithProgressResult = (() => {
        if (typeof window !== 'undefined') {
            if (window.__FORCE_SPLAT_ERROR__) {
                return {
                    asset: null,
                    loading: false,
                    error: `Forced error for: ${src}`,
                    progress: 0,
                };
            }
            if (window.__MOCKED_USE_SPLAT_WITH_PROGRESS__) {
                return window.__MOCKED_USE_SPLAT_WITH_PROGRESS__(src, onProgress);
            }
        }
        return {
            asset: null,
            loading: true,
            error: null,
            progress: 0,
        };
    })();

    const app = useApp();
    const [asset, setAsset] = useState<any>(initialResult.asset);
    const [loading, setLoading] = useState(initialResult.loading);
    const [error, setError] = useState<string | null>(initialResult.error);
    const [progress, setProgress] = useState(initialResult.progress);

    // If a test condition was met, we don't need to run the actual fetch logic
    const isTestConditionMet = initialResult.error !== null || initialResult.asset !== null;

    const fetchSplatData = useCallback(async () => {
        if (isTestConditionMet) {
            return; // Skip actual fetch if test condition already handled
        }

        if (!src || !app) {
            setError("Source URL or PlayCanvas app not available.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setProgress(0);
        setAsset(null);
        setError(null);

        // Create a PlayCanvas Asset. The custom handler will take over loading.
        const assetName = `splat-asset-${Date.now()}-${src.substring(src.lastIndexOf('/') + 1)}`;
        const newAsset = new Asset(assetName, 'gsplat', { url: src }); // Pass the original URL

        // Listen for progress and load/error events on the asset
        const handleProgressEvent = (receivedLength: number, total: number) => {
            let percentage = 0;
            if (total > 0) {
                percentage = Math.round((receivedLength / total) * 100);
            }
            setProgress(percentage);
            onProgress?.(percentage);
        };

        const handleLoad = () => {
            setAsset(newAsset);
            setProgress(100); // Ensure progress is 100%
            onProgress?.(100);

            // Add a small delay before setting loading to false to show 100%
            setTimeout(() => {
                setLoading(false);
            }, 500); // 500ms delay
        };

        const handleError = (err: any) => {
            console.error("useSplatWithProgress: Asset 'error' event fired. Full error object:", err);
            console.error("useSplatWithProgress: Asset 'error' message:", err?.message);
            console.error("useSplatWithProgress: Asset 'error' stringified:", JSON.stringify(err));
            setError(err?.message || `Failed to load splat asset: ${src}`);
            setLoading(false);
        };

        newAsset.on('progress', handleProgressEvent);
        newAsset.once('load', handleLoad);
        newAsset.once('error', handleError);

        // Add to registry and load
        app.assets.add(newAsset);
        app.assets.load(newAsset);

        return () => {
            newAsset.off('progress', handleProgressEvent);
            newAsset.off('load', handleLoad); // Use off, not once, for cleanup
            newAsset.off('error', handleError);
            // Optionally remove asset from registry if no longer needed
            // app.assets.remove(newAsset);
        };

    }, [src, app, onProgress, isTestConditionMet]); // isTestConditionMet is a dependency

    useEffect(() => {
        let cleanupFn: (() => void) | undefined;

        const setup = async () => {
            if (!isTestConditionMet) { // Only run if no test condition was met
                cleanupFn = await fetchSplatData();
            }
        };

        setup();

        return () => {
            cleanupFn?.();
        };
    }, [fetchSplatData, isTestConditionMet]); // isTestConditionMet is a dependency

    return { asset, loading, error, progress };
};
