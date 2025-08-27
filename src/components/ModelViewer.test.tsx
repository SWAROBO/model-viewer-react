import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ModelViewerProps, defaultModelViewerProps } from '../types/modelViewer'; // Import ModelViewerProps and default props
import { ModelViewerCoreProps } from './ModelViewerCore'; // Import ModelViewerCoreProps

// Define mock functions for the modules
const MockModelViewerCore = vi.fn((props: ModelViewerCoreProps) => { // Corrected type here
  return (
    <div data-testid="mock-model-viewer-core" data-splat={props.splat ? 'true' : 'false'}>
      Mock Core
    </div>
  );
});

const MockUsePlayCanvasSetup = vi.fn();

const MockUseSplatWithProgress = vi.fn();

// Use vi.doMock for non-hoisted mocks
vi.doMock('./ModelViewerCore', () => ({
  default: MockModelViewerCore,
}));

vi.doMock('../hooks/usePlayCanvasSetup', () => ({
  usePlayCanvasSetup: MockUsePlayCanvasSetup,
}));

vi.doMock('../hooks/useSplatWithProgress', () => ({
  useSplatWithProgress: MockUseSplatWithProgress,
}));

describe('ModelViewer', () => {
  let ModelViewer: React.ComponentType<ModelViewerProps>; // Use ModelViewerProps

  beforeAll(async () => {
    // Dynamically import the component *after* mocks are set up
    const { default: ModelViewerComponent } = await import('./ModelViewer');
    ModelViewer = ModelViewerComponent;
  });

  beforeEach(() => {
    // Reset mocks before each test
    MockModelViewerCore.mockClear();
    MockUsePlayCanvasSetup.mockClear();
    MockUseSplatWithProgress.mockClear();

    // Set default mock return values for useSplatWithProgress
    MockUseSplatWithProgress.mockReturnValue({
      asset: null,
      loading: false,
    });
  });

  it('renders ModelViewerCore and ModelLoadingProgress', () => {
    render(<ModelViewer model={undefined} />); // Add model prop
    expect(screen.getByTestId('mock-model-viewer-core')).toBeInTheDocument();
    // ModelLoadingProgress renders null if not loading, so it might not be in the document by default
    // We'll test its visibility based on loading state in a separate test.
  });

  it('calls usePlayCanvasSetup hook', () => {
    render(<ModelViewer model={undefined} />); // Add model prop
    expect(MockUsePlayCanvasSetup).toHaveBeenCalledTimes(1);
  });

  it('calls useSplatWithProgress with splatURL and progress handler', () => {
    const testSplatURL = 'http://example.com/test.splat';
    render(<ModelViewer splatURL={testSplatURL} model={undefined} />); // Add model prop

    expect(MockUseSplatWithProgress).toHaveBeenCalledTimes(1);
    expect(MockUseSplatWithProgress).toHaveBeenCalledWith(
      testSplatURL,
      expect.any(Function) // Expecting the handleProgress callback
    );
  });

  it('passes correct props to ModelViewerCore', () => {
    const customProps: ModelViewerProps = {
      splatURL: 'custom.splat',
      fov: 60,
      distanceMin: 1,
      distanceMax: 10,
      distance: 5,
      pitchAngleMin: 0,
      pitchAngleMax: 90,
      rotation: [0, 90, 0],
      position: [1, 2, 3],
      scale: [2, 2, 2],
      model: 'test-model', // Added model property
      backgroundColor: '#ff0000',
    };

    const mockSplatAsset = { some: 'splat data' };
    MockUseSplatWithProgress.mockReturnValue({
      asset: mockSplatAsset,
      loading: false,
    });

    render(<ModelViewer {...customProps} />);

    expect(MockModelViewerCore).toHaveBeenCalledTimes(1);
    expect(MockModelViewerCore).toHaveBeenCalledWith(
      expect.objectContaining({
        splat: mockSplatAsset,
        fov: customProps.fov,
        distanceMin: customProps.distanceMin,
        distanceMax: customProps.distanceMax,
        distance: customProps.distance,
        pitchAngleMin: customProps.pitchAngleMin,
        pitchAngleMax: customProps.pitchAngleMax,
        rotation: customProps.rotation,
        position: customProps.position,
        scale: customProps.scale,
        model: customProps.model, // Added model property
        backgroundColor: customProps.backgroundColor,
      }),
      undefined
    );
  });

  it('uses default props when no props are provided', () => {
    MockUseSplatWithProgress.mockReturnValue({
      asset: null,
      loading: false,
    });
    render(<ModelViewer model={undefined} />); // Add model prop

    expect(MockModelViewerCore).toHaveBeenCalledTimes(1);
    expect(MockModelViewerCore).toHaveBeenCalledWith(
      expect.objectContaining({
        splat: null, // Default splat is null
        fov: defaultModelViewerProps.fov,
        distanceMin: defaultModelViewerProps.distanceMin,
        distanceMax: defaultModelViewerProps.distanceMax,
        distance: defaultModelViewerProps.distance,
        pitchAngleMin: defaultModelViewerProps.pitchAngleMin,
        pitchAngleMax: defaultModelViewerProps.pitchAngleMax,
        rotation: defaultModelViewerProps.rotation,
        position: defaultModelViewerProps.position,
        scale: defaultModelViewerProps.scale,
        model: defaultModelViewerProps.model, // Added model property
      }),
      undefined
    );
  });

  it('passes downloadProgress and loading state to ModelLoadingProgress', async () => {
    let capturedProgressHandler: (progress: number) => void = vi.fn();
    MockUseSplatWithProgress.mockImplementation((splatURL, progressHandler) => {
      capturedProgressHandler = progressHandler;
      return {
        asset: null,
        loading: true, // Initially loading
      };
    });

    const { rerender } = render(<ModelViewer splatURL="test.splat" model={undefined} />); // Add model prop

    // Initially loading, progress 0
    expect(screen.getByTestId('model-loading-progress-container')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Simulate progress update
    await act(async () => {
      capturedProgressHandler(50);
    });
    rerender(<ModelViewer splatURL="test.splat" model={undefined} />); // Rerender to reflect state change
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Simulate completion
    await act(async () => {
      capturedProgressHandler(100);
    });
    MockUseSplatWithProgress.mockReturnValue({ // Simulate useSplatWithProgress returning loading: false after completion
      asset: { some: 'splat data' },
      loading: false,
    });
    rerender(<ModelViewer splatURL="test.splat" model={undefined} />); // Rerender to reflect state change
    expect(screen.queryByTestId('model-loading-progress-container')).toHaveStyle('display: none');
  });
});
