import React from 'react';
import { render, screen, act } from '@testing-library/react'; // Import act
import { vi } from 'vitest';
import type ModelViewerType from './ModelViewer';
import { defaultModelViewerProps } from '../types/modelViewer'; // Import default props
import { useSplatWithProgress } from '../hooks/useSplatWithProgress'; // Import the actual hook for vi.mocked

// Mock ModelLoadingProgress
const mockModelLoadingProgress = vi.fn((props) => (
  <div data-test-id="mock-model-loading-progress">
    Loading: {String(props.loading)}, Progress: {props.downloadProgress}%
  </div>
));
vi.doMock('./ModelLoadingProgress', () => ({
  default: mockModelLoadingProgress,
}));

// Mock ModelViewerCore
const mockModelViewerCore = vi.fn((props) => (
  <div data-test-id="mock-model-viewer-core">
    ModelViewerCore rendered. Splat: {props.splat ? 'Present' : 'Absent'}
  </div>
));
vi.doMock('./ModelViewerCore', () => ({
  default: mockModelViewerCore,
}));

// Mock useSplatWithProgress hook
let capturedHandleProgress: (progress: number) => void = () => {}; // To capture the callback
let mockSplatAsset: any = null;
let mockSplatLoading: boolean = true;

// Define the mock once at the top level
vi.mock('../hooks/useSplatWithProgress', () => ({
  useSplatWithProgress: vi.fn((splatURL, handleProgress) => {
    capturedHandleProgress = handleProgress; // Capture the callback
    return {
      asset: mockSplatAsset,
      loading: mockSplatLoading,
    };
  }),
}));

// Mock usePlayCanvasSetup hook
const mockUsePlayCanvasSetup = vi.fn();
vi.doMock('../hooks/usePlayCanvasSetup', () => ({
  usePlayCanvasSetup: mockUsePlayCanvasSetup,
}));

describe('ModelViewer Component', () => {
  let ModelViewer: typeof ModelViewerType;

  beforeAll(async () => {
    const module = await import('./ModelViewer');
    ModelViewer = module.default;
  });

  beforeEach(async () => { // Make beforeEach async
    mockModelLoadingProgress.mockClear();
    mockModelViewerCore.mockClear();
    mockUsePlayCanvasSetup.mockClear(); // Clear this mock too

    // Reset mock values for useSplatWithProgress
    mockSplatAsset = null;
    mockSplatLoading = true;
    // capturedHandleProgress is reset by the vi.mock in the beforeEach
    // Clear calls on the mocked useSplatWithProgress function
    vi.mocked(useSplatWithProgress).mockClear();
  });

  it('should render ModelLoadingProgress and ModelViewerCore with default loading state and props', () => {
    render(<ModelViewer />);

    // Verify hooks were called
    expect(mockUsePlayCanvasSetup).toHaveBeenCalledTimes(1);
    expect(vi.mocked(useSplatWithProgress)).toHaveBeenCalledTimes(1);

    // Verify ModelLoadingProgress is rendered with initial state
    expect(mockModelLoadingProgress).toHaveBeenCalledTimes(1);
    expect(mockModelLoadingProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        downloadProgress: 0, // Initial state from ModelViewer's useState
        loading: true, // From mockUseSplatWithProgress
      }),
      undefined
    );
    expect(screen.getByTestId('mock-model-loading-progress')).toBeInTheDocument();
    expect(screen.getByText('Loading: true, Progress: 0%')).toBeInTheDocument();

    // Verify ModelViewerCore is rendered with default props and null splat
    expect(mockModelViewerCore).toHaveBeenCalledTimes(1);
    expect(mockModelViewerCore).toHaveBeenCalledWith(
      expect.objectContaining({
        splat: null, // From mockUseSplatWithProgress
        fov: defaultModelViewerProps.fov,
        distanceMin: defaultModelViewerProps.distanceMin,
        distanceMax: defaultModelViewerProps.distanceMax,
        distance: defaultModelViewerProps.distance,
        pitchAngleMin: defaultModelViewerProps.pitchAngleMin,
        pitchAngleMax: defaultModelViewerProps.pitchAngleMax,
        rotation: defaultModelViewerProps.rotation,
        position: defaultModelViewerProps.position,
        scale: defaultModelViewerProps.scale,
      }),
      undefined
    );
    expect(screen.getByTestId('mock-model-viewer-core')).toBeInTheDocument();
    expect(screen.getByText('ModelViewerCore rendered. Splat: Absent')).toBeInTheDocument();
  });

  it('should pass custom props to ModelViewerCore', () => {
    const customProps = {
      splatURL: 'http://example.com/custom.splat',
      fov: 60,
      distanceMin: 0.5,
      distanceMax: 50,
      distance: 10,
      pitchAngleMin: -45,
      pitchAngleMax: 45,
      rotation: [10, 20, 30] as [number, number, number],
      position: [1, 2, 3] as [number, number, number],
      scale: [0.5, 0.5, 0.5] as [number, number, number],
    };

    // Set mock values for useSplatWithProgress for this specific test
    mockSplatAsset = {} as any;
    mockSplatLoading = false;

    render(<ModelViewer {...customProps} />);

    // Verify ModelViewerCore is rendered with custom props
    expect(mockModelViewerCore).toHaveBeenCalledTimes(1);
    expect(mockModelViewerCore).toHaveBeenCalledWith(
      expect.objectContaining({
        splat: {}, // From useSplatWithProgress mock
        fov: customProps.fov,
        distanceMin: customProps.distanceMin,
        distanceMax: customProps.distanceMax,
        distance: customProps.distance,
        pitchAngleMin: customProps.pitchAngleMin,
        pitchAngleMax: customProps.pitchAngleMax,
        rotation: customProps.rotation,
        position: customProps.position,
        scale: customProps.scale,
      }),
      undefined
    );
    expect(screen.getByTestId('mock-model-viewer-core')).toBeInTheDocument();
    expect(screen.getByText('ModelViewerCore rendered. Splat: Present')).toBeInTheDocument();
  });

  it('should update download progress and pass it to ModelLoadingProgress', () => {
    render(<ModelViewer />);

    // Initial state check
    expect(screen.getByText('Loading: true, Progress: 0%')).toBeInTheDocument();

    // Simulate progress updates by calling the captured handleProgress callback
    act(() => {
      capturedHandleProgress(25);
    });
    expect(screen.getByText('Loading: true, Progress: 25%')).toBeInTheDocument();

    act(() => {
      capturedHandleProgress(75);
    });
    expect(screen.getByText('Loading: true, Progress: 75%')).toBeInTheDocument();

    act(() => {
      capturedHandleProgress(100);
    });
    expect(screen.getByText('Loading: true, Progress: 100%')).toBeInTheDocument();
  });
});
