import { renderHook, act, waitFor } from '@testing-library/react';
import { useSplatWithProgress } from './useSplatWithProgress';
import { vi } from 'vitest';
// Import the mocked useApp and mockAppInstance from the global mock file
import { useApp, mockAppInstance } from '../../__mocks__/@playcanvas/react/hooks';

// --- Mocks for PlayCanvas ---
// Use vi.hoisted to define mocks that need to be available to vi.mock factories
const { mockAssetConstructor, mockAssetOn, mockAssetOnce, mockAssetOff } = vi.hoisted(() => {
  const assetOn = vi.fn();
  const assetOnce = vi.fn();
  const assetOff = vi.fn();
  const assetConstructor = vi.fn(); // Declare it here
  assetConstructor.mockImplementation(function(this: any) { // Explicitly type 'this'
    this.on = assetOn;
    this.once = assetOnce;
    this.off = assetOff;
    this.name = 'mock-asset';
    this.file = { url: 'mock-url' };
    this.resource = null;
  });
  return {
    mockAssetConstructor: assetConstructor,
    mockAssetOn: assetOn,
    mockAssetOnce: assetOnce,
    mockAssetOff: assetOff,
  };
});

// Mock playcanvas module using the hoisted mockAssetConstructor
vi.mock('playcanvas', () => {
  // mockAssetConstructor is already defined via vi.hoisted and is a mock constructor.
  // It's set up to assign mockAssetOn, mockAssetOnce, mockAssetOff to its instances.
  return {
    default: {
      Asset: mockAssetConstructor,
    },
    Asset: mockAssetConstructor,
  };
});

// No need to mock @playcanvas/react/hooks here, as it's aliased globally in vite.config.mts

describe('useSplatWithProgress Hook', () => {
  const SRC_URL = 'http://test.com/splat.gsplat';
  const mockOnProgress = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers(); // Explicitly call useFakeTimers in beforeEach
    vi.clearAllMocks();
    
    // Reset hoisted mocks
    mockAssetConstructor.mockClear(); // Clear the mock constructor directly
    mockAssetOn.mockClear();
    mockAssetOnce.mockClear();
    mockAssetOff.mockClear();
    
    // Reset useApp mock and mockAppInstance from the global mock file
    useApp.mockClear().mockReturnValue(mockAppInstance); 
    mockAppInstance.loader.addHandler.mockClear();
    mockAppInstance.loader.getHandler.mockClear().mockReturnValue(null);
    mockAppInstance.on.mockClear();
    mockAppInstance.off.mockClear();
    mockAppInstance.assets.add.mockClear(); // Clear assets mocks
    mockAppInstance.assets.load.mockClear();
    mockAppInstance.assets.remove.mockClear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers(); // Ensure all timers are run
    vi.useRealTimers(); // Restore real timers
  });

  it('should return initial loading state', () => {
    const { result } = renderHook(() => useSplatWithProgress(SRC_URL, mockOnProgress));
    expect(result.current.asset).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it('should set error if src is not provided', () => {
    const { result } = renderHook(() => useSplatWithProgress('', mockOnProgress));
    expect(result.current.error).toBe("Source URL or PlayCanvas app not available.");
    expect(result.current.loading).toBe(false);
  });

  it('should set error if app is not available', () => {
    useApp.mockReturnValue(null); // Override default to return null
    const { result } = renderHook(() => useSplatWithProgress(SRC_URL, mockOnProgress));
    expect(result.current.error).toBe("Source URL or PlayCanvas app not available.");
    expect(result.current.loading).toBe(false);
  });

  it('should load asset successfully and report progress', async () => {
    const { result } = renderHook(() => useSplatWithProgress(SRC_URL, mockOnProgress));

    expect(mockAssetConstructor).toHaveBeenCalledTimes(1); // Use mockAssetConstructor directly
    // Capture the instance created by the mock constructor
    const createdAssetInstance = mockAssetConstructor.mock.instances[0];
    expect(mockAppInstance.assets.add).toHaveBeenCalledWith(createdAssetInstance); // Check instance
    expect(mockAppInstance.assets.load).toHaveBeenCalledWith(createdAssetInstance); // Check instance

    // Simulate progress event
    const progressCallback = mockAssetOn.mock.calls.find((call: any[]) => call[0] === 'progress')?.[1];
    expect(progressCallback).toBeDefined();
    act(() => {
      if (progressCallback) progressCallback(50, 100); 
    });
    expect(result.current.progress).toBe(50);
    expect(mockOnProgress).toHaveBeenCalledWith(50);

    // Simulate load event
    const loadCallback = mockAssetOnce.mock.calls.find((call: any[]) => call[0] === 'load')?.[1];
    expect(loadCallback).toBeDefined();
    act(() => {
      if (loadCallback) loadCallback();
    });
    expect(result.current.asset).toBe(createdAssetInstance); // Access the instance created by the constructor
    expect(result.current.progress).toBe(100);
    expect(mockOnProgress).toHaveBeenCalledWith(100);
    expect(result.current.loading).toBe(true); 

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle asset load error', async () => {
    const { result } = renderHook(() => useSplatWithProgress(SRC_URL, mockOnProgress));
    
    const errorCallback = mockAssetOnce.mock.calls.find((call: any[]) => call[0] === 'error')?.[1];
    expect(errorCallback).toBeDefined();
    const mockError = { message: 'Load failed' };
    act(() => {
      if (errorCallback) errorCallback(mockError);
    });

    expect(result.current.asset).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Load failed');
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useSplatWithProgress(SRC_URL, mockOnProgress));
    
    // Manually get the callbacks that were registered
    const progressCallback = mockAssetOn.mock.calls.find((call: any[]) => call[0] === 'progress')?.[1];
    const loadCallback = mockAssetOnce.mock.calls.find((call: any[]) => call[0] === 'load')?.[1];
    const errorCallback = mockAssetOnce.mock.calls.find((call: any[]) => call[0] === 'error')?.[1];

    unmount();

    expect(mockAssetOff).toHaveBeenCalledWith('progress', progressCallback);
    expect(mockAssetOff).toHaveBeenCalledWith('load', loadCallback);
    expect(mockAssetOff).toHaveBeenCalledWith('error', errorCallback);
  });
});
