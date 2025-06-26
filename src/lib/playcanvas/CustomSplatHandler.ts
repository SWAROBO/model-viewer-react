import { Asset, Application, ResourceHandler } from 'playcanvas'; // Import ResourceHandler

export class CustomSplatHandler extends ResourceHandler { // Extend ResourceHandler
    private _defaultSplatHandler: ResourceHandler; // Use ResourceHandler

    constructor(app: Application) {
        super(app, 'gsplat'); // Pass app and handlerType to super
        // Get the default gsplat handler to delegate the actual parsing
        // Cast to ResourceHandler as getHandler can return undefined
        this._defaultSplatHandler = app.loader.getHandler('gsplat') as ResourceHandler;
        if (!this._defaultSplatHandler) {
            // console.warn("Default gsplat asset handler not found. Custom loader might not work correctly."); // Removed log
        }
    }

    // The load method is responsible for fetching the asset data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load(url: string, callback: (err: string | null, asset: any) => void, asset: Asset) {
        // console.log("CustomSplatHandler: Loading asset:", url); // Removed log

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const contentLength = response.headers.get('Content-Length');
                let total = 0;
                if (contentLength) {
                    total = parseInt(contentLength, 10);
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    throw new Error("Failed to get readable stream reader.");
                }

                const chunks: Uint8Array[] = [];
                let receivedLength = 0;

                const readStream = async () => {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            break;
                        }

                        chunks.push(value);
                        receivedLength += value.length;

                        if (total > 0) {
                            // const progress = receivedLength / total; // Removed log
                            // console.log("CustomSplatHandler: Firing asset progress: receivedLength:", receivedLength, "total:", total); // Removed log
                            // Fire progress event on the asset, passing both receivedLength and total
                            asset.fire('progress', receivedLength, total);
                        }
                    }
                    return new Blob(chunks);
                };

                return readStream();
            })
            .then(blob => blob.arrayBuffer()) // Convert blob to ArrayBuffer
            .then(arrayBuffer => {
                // console.log("CustomSplatHandler: Data fetched, delegating to default handler."); // Removed log
                // Delegate the actual parsing of the ArrayBuffer to the default gsplat handler
                // This is the crucial part: how to make the default handler process an ArrayBuffer?
                // The default handler's load method expects a URL.
                // They don't typically expose a direct 'parse' method for raw ArrayBuffer.

                // Let's try to create a Blob URL and pass it to the default handler's load method.
                // This might cause a re-download, but it's the only way to use the default parser.
                const blobUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: 'model/ply' }));

                // Create a temporary asset for the default handler to load from the blobUrl
                const tempAsset = new Asset(asset.name, asset.type, { url: blobUrl });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this._defaultSplatHandler.load(blobUrl, (err: string | null, resource: any) => {
                    URL.revokeObjectURL(blobUrl); // Clean up the blob URL
                    if (err) {
                        // console.error("CustomSplatHandler: Default handler error:", err); // Removed log
                        callback(err, null);
                    } else {
                        // console.log("CustomSplatHandler: Default handler loaded resource."); // Removed log
                        asset.resource = resource; // Set the resource on our original asset
                        callback(null, resource);
                    }
                }, tempAsset); // Pass the temporary asset

            })
            .catch(err => {
                // console.error("CustomSplatHandler: Fetch or processing error:", err); // Removed log
                callback(err.message || "Failed to load splat asset", null);
            });
    }

    // The open method is for synchronous processing (e.g., from cache)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    open(url: string, data: any, asset: Asset) {
        // This method is typically for assets loaded from cache or already available data.
        // For gsplat, it's unlikely to be used directly with raw data.
        // We'll delegate to the default handler if it has an open method.
        if (this._defaultSplatHandler && this._defaultSplatHandler.open) {
            return this._defaultSplatHandler.open(url, data, asset);
        }
        return null;
    }

    // The resolve method is for resolving asset dependencies (not needed for simple gsplat)
    resolve(url: string, asset: Asset, callback: (err: string | null) => void) {
        callback(null);
    }
}
