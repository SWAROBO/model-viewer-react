/// <reference types="vitest/globals" />
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest'; // Explicitly import vi
import { usePlayCanvasSetup } from './usePlayCanvasSetup';

// Mock @playcanvas/react/hooks
const mockApp = {
  loader: {
    getHandler: vi.fn(),
    addHandler: vi.fn(),
  },
  on: vi.fn(),
  off: vi.fn(),
};

// Mock CustomSplatHandler
// Mock CustomSplatHandler
// Create a mock class that can be instantiated and exported directly from the mock factory
vi.mock('../lib/playcanvas/CustomSplatHandler', () => {
  const MockCustomSplatHandler = vi.fn(function(this: any) { // Removed 'app: any'
    // In a real scenario, you might set properties on 'this' based on 'app'
    // For now, just ensure 'this' is returned to satisfy 'expect.any(MockedCustomSplatHandler)'
    return this;
  });
  return {
    CustomSplatHandler: MockCustomSplatHandler,
  };
});

// Re-import the mocked CustomSplatHandler to get the mocked version
import { CustomSplatHandler as MockedCustomSplatHandler } from '../lib/playcanvas/CustomSplatHandler';

vi.mock('@playcanvas/react/hooks', () => ({
  useApp: vi.fn(() => mockApp),
}));

describe('usePlayCanvasSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockApp state for each test
    mockApp.loader.getHandler.mockReturnValue(undefined); // Assume handler not registered by default
    (MockedCustomSplatHandler as unknown as vi.Mock).mockClear(); // Clear calls to the mock constructor
  });

  it('should register CustomSplatHandler if not already registered', () => {
    renderHook(() => usePlayCanvasSetup());

    expect(mockApp.loader.getHandler).toHaveBeenCalledWith('gsplat');
    expect(MockedCustomSplatHandler).toHaveBeenCalledWith(mockApp as any); // Cast mockApp to any
    expect(mockApp.loader.addHandler).toHaveBeenCalledWith('gsplat', expect.any(MockedCustomSplatHandler));
  });

  it('should not re-register CustomSplatHandler if already registered', () => {
    // Simulate already registered by returning an object that passes instanceof check
    const alreadyRegisteredHandler = Object.create(MockedCustomSplatHandler.prototype);
    mockApp.loader.getHandler.mockReturnValue(alreadyRegisteredHandler);

    renderHook(() => usePlayCanvasSetup());

    expect(mockApp.loader.getHandler).toHaveBeenCalledWith('gsplat');
    // CustomSplatHandler constructor should NOT be called by the hook
    expect(MockedCustomSplatHandler).not.toHaveBeenCalled();
    expect(mockApp.loader.addHandler).not.toHaveBeenCalled();
  });

  it('should register and unregister the error handler', () => {
    const { unmount } = renderHook(() => usePlayCanvasSetup());

    expect(mockApp.on).toHaveBeenCalledWith('error', expect.any(Function));
    const errorHandler = mockApp.on.mock.calls[0][1]; // Get the registered handler function

    unmount();

    expect(mockApp.off).toHaveBeenCalledWith('error', errorHandler);
  });

  it('should log error details when an error occurs', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error output

    renderHook(() => usePlayCanvasSetup());

    const errorHandler = mockApp.on.mock.calls[0][1];
    const mockError = {
      message: 'Test error message',
      stack: 'Test stack trace',
      asset: { name: 'test-asset' },
    };

    // Simulate an error being emitted by the app
    errorHandler(mockError);

    expect(consoleErrorSpy).toHaveBeenCalledWith("PlayCanvas App Error:", mockError);
    expect(consoleErrorSpy).toHaveBeenCalledWith("PlayCanvas App Error Message:", mockError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith("PlayCanvas App Error Stack:", mockError.stack);
    expect(consoleErrorSpy).toHaveBeenCalledWith("PlayCanvas App Error Asset:", mockError.asset);

    consoleErrorSpy.mockRestore(); // Restore original console.error
  });
});
