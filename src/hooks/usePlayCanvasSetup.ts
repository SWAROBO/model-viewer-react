import { useEffect } from "react";
import { useApp } from "@playcanvas/react/hooks";
import { CustomSplatHandler } from "../lib/playcanvas/CustomSplatHandler";

export const usePlayCanvasSetup = () => {
    const app = useApp();

    useEffect(() => {
        if (app) {
            // Register the custom gsplat asset handler
            // Check if it's already registered to avoid re-registering on hot reloads
            if (!(app.loader.getHandler('gsplat') instanceof CustomSplatHandler)) {
                app.loader.addHandler('gsplat', new CustomSplatHandler(app));
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
};
