import { renderHook, act, waitFor } from '@testing-library/react';
import { useSplatWithProgress } from './useSplatWithProgress';
import { useApp } from '@playcanvas/react/hooks';
import { Asset } from 'playcanvas';

// Mock PlayCanvas dependencies
vi.mock('playcanvas');
vi.mock('@playcanvas/react/hooks', () => ({
    useApp: vi.fn(),
}));

describe('useSplatWithProgress', () => {
    let mockApp: any;
    let mockAsset: any;

    beforeEach(() => {
        // Reset all mocks before each test
        vi.resetAllMocks();

        // This will store the actual callback functions passed to asset.on/once
        const registeredListeners: { [key: string]: Function[] } = {
            progress: [],
            load: [],
            error: []
        };

        mockAsset = {
            on: vi.fn((event: string, callback: Function) => {
                registeredListeners[event]?.push(callback);
            }),
            once: vi.fn((event: string, callback: Function) => {
                registeredListeners[event]?.push(callback);
            }),
            off: vi.fn((event: string, callback: Function) => {
                if (registeredListeners[event]) {
                    registeredListeners[event] = registeredListeners[event].filter(cb => cb !== callback);
                }
            }),
            // Custom emit function to trigger the stored callbacks
            emit: vi.fn((event: string, ...args: any[]) => {
                registeredListeners[event]?.forEach(cb => cb(...args));
                // For 'once' events, remove them after emission
                if (event === 'load' || event === 'error') {
                    registeredListeners[event] = [];
                }
            }),
            destroy: vi.fn()
        };

        // Mock the Asset constructor to return our mockAsset
        (Asset as vi.Mock).mockImplementation(() => mockAsset);

        // Mock PlayCanvas app and app.assets
        mockApp = {
            assets: {
                add: vi.fn(),
                load: vi.fn(),
                remove: vi.fn()
            }
        };
        (useApp as vi.Mock).mockReturnValue(mockApp);

        // Mock setTimeout to control its execution
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should return initial loading state', () => {
        const { result } = renderHook(() => useSplatWithProgress('test.splat'));

        expect(result.current.loading).toBe(true);
        expect(result.current.asset).toBe(null);
        expect(result.current.error).toBe(null);
        expect(result.current.progress).toBe(0);
    });

    it('should set error if src is not provided', () => {
        const { result } = renderHook(() => useSplatWithProgress(''));

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Source URL or PlayCanvas app not available.");
    });

    it('should set error if app is not available', () => {
        (useApp as vi.Mock).mockReturnValue(null); // Simulate app not available
        const { result } = renderHook(() => useSplatWithProgress('test.splat'));

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Source URL or PlayCanvas app not available.");
    });

    it('should add and load asset with PlayCanvas', () => {
        const src = 'test.splat';
        renderHook(() => useSplatWithProgress(src));

        expect(Asset).toHaveBeenCalledWith(expect.any(String), 'gsplat', { url: src });
        expect(mockApp.assets.add).toHaveBeenCalledWith(mockAsset);
        expect(mockApp.assets.load).toHaveBeenCalledWith(mockAsset);
    });

    it('should update progress during loading', async () => {
        const onProgressMock = vi.fn();
        const { result } = renderHook(() => useSplatWithProgress('test.splat', onProgressMock));

        // Simulate progress events
        act(() => {
            mockAsset.emit('progress', 500, 1000); // 50%
        });
        expect(result.current.progress).toBe(50);
        expect(onProgressMock).toHaveBeenCalledWith(50);

        act(() => {
            mockAsset.emit('progress', 750, 1000); // 75%
        });
        expect(result.current.progress).toBe(75);
        expect(onProgressMock).toHaveBeenCalledWith(75);
    });

    it('should set asset and complete loading on "load" event', async () => {
        const onProgressMock = vi.fn();
        const { result } = renderHook(() => useSplatWithProgress('test.splat', onProgressMock));

        act(() => {
            mockAsset.emit('load');
        });

        // After load, progress should be 100
        expect(result.current.progress).toBe(100);
        expect(onProgressMock).toHaveBeenCalledWith(100);
        expect(result.current.asset).toBe(mockAsset);
        expect(result.current.loading).toBe(true); // Still true due to setTimeout

        // Advance timers to clear the setTimeout
        act(() => {
            vi.advanceTimersByTime(500);
        });

        // After delay, loading should be false
        expect(result.current.loading).toBe(false);
    });

    it('should set error on "error" event', async () => {
        const { result } = renderHook(() => useSplatWithProgress('test.splat'));
        const errorMessage = 'Network error';

        act(() => {
            mockAsset.emit('error', { message: errorMessage });
        });

        expect(result.current.error).toBe(errorMessage);
        expect(result.current.loading).toBe(false);
    });

    it('should clean up event listeners on unmount', async () => { // Make test async
        const { unmount } = renderHook(() => useSplatWithProgress('test.splat'));

        // Ensure the effect has fully run and registered listeners
        // Advance timers by 0 to resolve immediate promises and microtasks
        await act(async () => {
            vi.advanceTimersByTime(0);
        });

        // Verify listeners were set up
        expect(mockAsset.on).toHaveBeenCalledWith('progress', expect.any(Function));
        expect(mockAsset.once).toHaveBeenCalledWith('load', expect.any(Function));
        expect(mockAsset.once).toHaveBeenCalledWith('error', expect.any(Function));

        // Now unmount, wrapped in act to ensure cleanup is processed
        act(() => {
            unmount();
        });

        // Expect off to be called for each listener
        expect(mockAsset.off).toHaveBeenCalled(); // Check if called at all
        expect(mockAsset.off).toHaveBeenCalledTimes(3); // Expect 3 calls
        expect(mockAsset.off).toHaveBeenCalledWith('progress', expect.any(Function));
        expect(mockAsset.off).toHaveBeenCalledWith('load', expect.any(Function));
        expect(mockAsset.off).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should re-fetch data when src changes', async () => {
        const { result, rerender } = renderHook(({ src }) => useSplatWithProgress(src), {
            initialProps: { src: 'initial.splat' },
        });

        // Initial load
        expect(mockApp.assets.load).toHaveBeenCalledTimes(1);
        expect(Asset).toHaveBeenCalledTimes(1);

        // Change src prop
        rerender({ src: 'new.splat' });

        // Expect a new asset to be created and loaded
        expect(mockApp.assets.load).toHaveBeenCalledTimes(2);
        expect(Asset).toHaveBeenCalledTimes(2);

        // Simulate load for the new asset
        act(() => {
            mockAsset.emit('load');
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });
        expect(result.current.loading).toBe(false);
        expect(result.current.asset).toBe(mockAsset); // Should be the new mockAsset instance
    });
});
