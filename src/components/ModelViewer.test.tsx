import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type ModelViewerType from './ModelViewer';
import { defaultModelViewerProps } from '../types/modelViewer'; // Import default props

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
const mockUseSplatWithProgress = vi.fn(() => ({
  asset: null, // No splat asset yet
  loading: true, // Still loading
}));
vi.doMock('../hooks/useSplatWithProgress', () => ({
  useSplatWithProgress: mockUseSplatWithProgress,
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

  beforeEach(() => {
    mockModelLoadingProgress.mockClear();
    mockModelViewerCore.mockClear();
    mockUseSplatWithProgress.mockClear();
    mockUsePlayCanvasSetup.mockClear();
    // Reset mock return values if they were changed in previous tests
    mockUseSplatWithProgress.mockReturnValue({ asset: null, loading: true });
  });

  it('should render ModelLoadingProgress and ModelViewerCore with default loading state and props', () => {
    render(<ModelViewer />);

    // Verify hooks were called
    expect(mockUsePlayCanvasSetup).toHaveBeenCalledTimes(1);
    expect(mockUseSplatWithProgress).toHaveBeenCalledTimes(1);

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
});
