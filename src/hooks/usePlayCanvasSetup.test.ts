import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

// Use vi.hoisted to define mocks that need to be available to vi.mock factories
const { useAppMock, mockCustomSplatHandlerConstructor, mockAppInstance } = vi.hoisted(() => {
  const appInstance = {
    loader: {
      addHandler: vi.fn(),
      getHandler: vi.fn(),
    },
    on: vi.fn(),
    off: vi.fn(),
  };
  return {
    // Define the mock for useApp
    useAppMock: vi.fn<() => typeof appInstance | null>(),
    // Define the mock constructor for CustomSplatHandler
    mockCustomSplatHandlerConstructor: vi.fn(),
    // Expose the appInstance for use in tests and beforeEach
    mockAppInstance: appInstance,
  };
});

// Mock the @playcanvas/react/hooks module using the hoisted useAppMock
vi.mock('@playcanvas/react/hooks', () => ({
  useApp: useAppMock,
}));

// Mock the CustomSplatHandler module using the hoisted mock constructor
vi.mock('../lib/playcanvas/CustomSplatHandler', () => ({
  CustomSplatHandler: mockCustomSplatHandlerConstructor,
}));

// Now import the hook (it will get the mocked dependencies)
import { usePlayCanvasSetup } from './usePlayCanvasSetup';

describe('usePlayCanvasSetup Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    // Set default return value for the hoisted useAppMock
    useAppMock.mockClear().mockReturnValue(mockAppInstance); 
    
    // Reset methods on the hoisted mockAppInstance
    mockAppInstance.loader.addHandler.mockClear();
    mockAppInstance.loader.getHandler.mockClear().mockReturnValue(null); // Default: handler not registered
    mockAppInstance.on.mockClear();
    mockAppInstance.off.mockClear();
    
    // Reset the hoisted mock constructor
    mockCustomSplatHandlerConstructor.mockClear();
  });

  it('should register CustomSplatHandler and set up error handling on mount', () => {
    const { unmount } = renderHook(() => usePlayCanvasSetup());

    expect(useAppMock).toHaveBeenCalledTimes(1);

    expect(mockCustomSplatHandlerConstructor).toHaveBeenCalledTimes(1);
    expect(mockCustomSplatHandlerConstructor).toHaveBeenCalledWith(mockAppInstance);
    expect(mockAppInstance.loader.addHandler).toHaveBeenCalledTimes(1);
    // The instance passed to addHandler will be an instance of the mock constructor
    expect(mockAppInstance.loader.addHandler).toHaveBeenCalledWith('gsplat', expect.any(Object)); 

    expect(mockAppInstance.on).toHaveBeenCalledTimes(1);
    expect(mockAppInstance.on).toHaveBeenCalledWith('error', expect.any(Function));

    unmount();
    expect(mockAppInstance.off).toHaveBeenCalledTimes(1);
    expect(mockAppInstance.off).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should NOT re-register CustomSplatHandler if already registered', () => {
    // Simulate CustomSplatHandler already being registered
    // Create an instance using the hoisted mock constructor
    const existingHandlerInstance = new (mockCustomSplatHandlerConstructor as any)(mockAppInstance);
    mockAppInstance.loader.getHandler.mockReturnValue(existingHandlerInstance);
    // Clear calls from creating existingHandlerInstance if it was counted by the mock constructor
    mockCustomSplatHandlerConstructor.mockClear(); 

    renderHook(() => usePlayCanvasSetup());

    expect(mockCustomSplatHandlerConstructor).not.toHaveBeenCalled();
    expect(mockAppInstance.loader.addHandler).not.toHaveBeenCalled();
  });

  it('should not do anything if app is null', () => {
    useAppMock.mockReturnValue(null); // Override default to return null
    renderHook(() => usePlayCanvasSetup());

    expect(mockCustomSplatHandlerConstructor).not.toHaveBeenCalled();
    expect(mockAppInstance.loader.addHandler).not.toHaveBeenCalled();
    expect(mockAppInstance.on).not.toHaveBeenCalled();
    expect(mockAppInstance.off).not.toHaveBeenCalled();
  });
});
