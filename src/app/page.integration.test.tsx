import { render, screen, waitFor } from '@testing-library/react';
import { Page } from './page'; // Import the named export
import { useModelData } from '@/hooks/useModelData';
import ModelViewerCore from '@/components/ModelViewerCore';
import { useSearchParams } from 'next/navigation';
import { useSplatWithProgress } from '@/hooks/useSplatWithProgress'; // Import for mocking

// Explicitly mock @playcanvas/react
vi.mock('@playcanvas/react', () => ({
  Application: vi.fn(({ children }) => {
    return <div data-testid="mock-playcanvas-application">{children}</div>;
  }),
}));

// Mock the useModelData hook
vi.mock('@/hooks/useModelData', () => ({
  useModelData: vi.fn(),
}));

// Mock useSplatWithProgress
vi.mock('@/hooks/useSplatWithProgress', () => ({
  useSplatWithProgress: vi.fn(() => ({
    asset: 'mock-splat-asset', // Return a dummy asset
    loading: false,
  })),
}));

// Mock ModelViewerCore to capture its props
vi.mock('@/components/ModelViewerCore', () => ({
  default: vi.fn((props) => {
    // Store the props passed to ModelViewerCore for assertion
    // This is a simplified way; in a real scenario, you might use a more robust mock
    // or a spy to capture calls. For now, we'll just render a div with data-testid
    // and potentially some data attributes for simple checks.
    return (
      <div data-test-id="mock-model-viewer-core" data-splat={props.splat} data-fov={props.fov}>
        Mock ModelViewerCore
      </div>
    );
  }),
}));

// Mock useSearchParams for controlling the 'model' query parameter
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

describe('Page Integration: Data flow from useModelData to ModelViewerCore', () => {
  const mockDefaultProps = {
    splatURL: 'default.splat',
    fov: 50,
    distanceMin: 1,
    distanceMax: 10,
    pitchAngleMin: -90,
    pitchAngleMax: 90,
    distance: 5,
    rotation: [0, 0, 0],
    position: [0, 0, 0],
    scale: [1, 1, 1],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useSearchParams
    (useSearchParams as vi.Mock).mockReturnValue({
      get: vi.fn((param: string) => {
        if (param === 'model') return null; // No model param by default
        return null;
      }),
    });
  });

  it('should pass defaultModelViewerProps to ModelViewerCore when no model data is loaded', async () => {
    // Mock useModelData to return loading state initially, then empty data
    (useModelData as vi.Mock).mockReturnValue({
      modelData: [],
      loading: false,
      error: null,
      defaultModelViewerProps: mockDefaultProps,
    });

    render(<Page />);

    // Wait for the component to process the data (even if empty)
    await waitFor(() => {
      expect(ModelViewerCore).toHaveBeenCalledWith(
        expect.objectContaining({
          splat: 'mock-splat-asset', // Now splat should be the mocked asset
          fov: mockDefaultProps.fov,
          distanceMin: mockDefaultProps.distanceMin,
          distanceMax: mockDefaultProps.distanceMax,
          pitchAngleMin: mockDefaultProps.pitchAngleMin,
          pitchAngleMax: mockDefaultProps.pitchAngleMax,
          distance: mockDefaultProps.distance,
          rotation: mockDefaultProps.rotation,
          position: mockDefaultProps.position,
          scale: mockDefaultProps.scale,
        }),
        undefined // Explicitly expect undefined as the second argument
      );
    });
  });

  it('should pass selected model data to ModelViewerCore based on query param', async () => {
    const mockModelData = [
      {
        model: 'modelA',
        splatURL: 'modelA.splat',
        fov: 60,
        distance: 7,
        rotation: [10, 20, 30],
        position: [1, 2, 3],
        scale: [2, 2, 2],
        distanceMin: 1,
        distanceMax: 10,
        pitchAngleMin: -90,
        pitchAngleMax: 90,
      },
      {
        model: 'modelB',
        splatURL: 'modelB.splat',
        fov: 70,
        distance: 8,
        rotation: [40, 50, 60],
        position: [4, 5, 6],
        scale: [3, 3, 3],
        distanceMin: 1,
        distanceMax: 10,
        pitchAngleMin: -90,
        pitchAngleMax: 90,
      },
    ];

    // Mock useModelData to return the mock data
    (useModelData as vi.Mock).mockReturnValue({
      modelData: mockModelData,
      loading: false,
      error: null,
      defaultModelViewerProps: mockDefaultProps,
    });

    // Mock useSearchParams to return 'modelA'
    (useSearchParams as vi.Mock).mockReturnValue({
      get: vi.fn((param: string) => {
        if (param === 'model') return 'modelA';
        return null;
      }),
    });

    render(<Page />);

    await waitFor(() => {
      // Expect ModelViewerCore to be called with props from 'modelA'
      expect(ModelViewerCore).toHaveBeenLastCalledWith(
        expect.objectContaining({
          splat: 'mock-splat-asset', // Now splat should be the mocked asset
          fov: mockModelData[0].fov,
          distanceMin: mockModelData[0].distanceMin,
          distanceMax: mockModelData[0].distanceMax,
          pitchAngleMin: mockModelData[0].pitchAngleMin,
          pitchAngleMax: mockModelData[0].pitchAngleMax,
          distance: mockModelData[0].distance,
          rotation: mockModelData[0].rotation,
          position: mockModelData[0].position,
          scale: mockModelData[0].scale,
        }),
        undefined // Explicitly expect undefined as the second argument
      );
    });
  });

  it('should pass the first model data to ModelViewerCore when no query param is provided', async () => {
    const mockModelData = [
      {
        model: 'modelA',
        splatURL: 'modelA.splat',
        fov: 60,
        distance: 7,
        rotation: [10, 20, 30],
        position: [1, 2, 3],
        scale: [2, 2, 2],
        distanceMin: 1,
        distanceMax: 10,
        pitchAngleMin: -90,
        pitchAngleMax: 90,
      },
      {
        model: 'modelB',
        splatURL: 'modelB.splat',
        fov: 70,
        distance: 8,
        rotation: [40, 50, 60],
        position: [4, 5, 6],
        scale: [3, 3, 3],
        distanceMin: 1,
        distanceMax: 10,
        pitchAngleMin: -90,
        pitchAngleMax: 90,
      },
    ];

    // Mock useModelData to return the mock data
    (useModelData as vi.Mock).mockReturnValue({
      modelData: mockModelData,
      loading: false,
      error: null,
      defaultModelViewerProps: mockDefaultProps,
    });

    // useSearchParams is mocked to return null for 'model' by default (from beforeEach)

    render(<Page />);

    await waitFor(() => {
      // Expect ModelViewerCore to be called with props from the first model ('modelA')
      expect(ModelViewerCore).toHaveBeenLastCalledWith(
        expect.objectContaining({
          splat: 'mock-splat-asset', // Now splat should be the mocked asset
          fov: mockModelData[0].fov,
          distanceMin: mockModelData[0].distanceMin,
          distanceMax: mockModelData[0].distanceMax,
          pitchAngleMin: mockModelData[0].pitchAngleMin,
          pitchAngleMax: mockModelData[0].pitchAngleMax,
          distance: mockModelData[0].distance,
          rotation: mockModelData[0].rotation,
          position: mockModelData[0].position,
          scale: mockModelData[0].scale,
        }),
        undefined // Explicitly expect undefined as the second argument
      );
    });
  });

  it('should handle error state from useModelData and fall back to default props', async () => {
    (useModelData as vi.Mock).mockReturnValue({
      modelData: [],
      loading: false,
      error: 'Failed to fetch data',
      defaultModelViewerProps: mockDefaultProps,
    });

    render(<Page />);

    await waitFor(() => {
      expect(ModelViewerCore).toHaveBeenLastCalledWith(
        expect.objectContaining({
          splat: 'mock-splat-asset', // Now splat should be the mocked asset
          fov: mockDefaultProps.fov,
          distanceMin: mockDefaultProps.distanceMin,
          distanceMax: mockDefaultProps.distanceMax,
          pitchAngleMin: mockDefaultProps.pitchAngleMin,
          pitchAngleMax: mockDefaultProps.pitchAngleMax,
          distance: mockDefaultProps.distance,
          rotation: mockDefaultProps.rotation,
          position: mockDefaultProps.position,
          scale: mockDefaultProps.scale,
        }),
        undefined // Explicitly expect undefined as the second argument
      );
    });
  });

  it('should render ModelViewer and SwaroboLogo components', async () => {
    // Mock useModelData to return some data so ModelViewer renders
    (useModelData as vi.Mock).mockReturnValue({
      modelData: [{
        model: 'test',
        splatURL: 'test.splat',
        fov: 50,
        distance: 5,
        rotation: [0, 0, 0],
        position: [0, 0, 0],
        scale: [1, 1, 1],
        distanceMin: 1,
        distanceMax: 10,
        pitchAngleMin: -90,
        pitchAngleMax: 90,
      }],
      loading: false,
      error: null,
      defaultModelViewerProps: mockDefaultProps,
    });

    // Temporarily mock useSplatWithProgress to return loading: true for this test
    (useSplatWithProgress as vi.Mock).mockReturnValue({
      asset: null, // No asset yet
      loading: true, // Simulate loading state
    });

    render(<Page />);

    // Wait for ModelViewerCore to be rendered (it's a child of ModelViewer)
    await waitFor(() => {
      expect(screen.getByTestId('mock-model-viewer-core')).toBeInTheDocument();
    });

    // Check for SwaroboLogo
    expect(screen.getByRole('img', { name: /swarobo logo/i })).toBeInTheDocument();

    // Check for ModelLoadingProgress (it's also a child of ModelViewer)
    expect(screen.getByTestId('CircularProgressbar')).toBeInTheDocument();
  });
});
