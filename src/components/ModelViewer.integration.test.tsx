import { render, screen } from '@testing-library/react';
import ModelViewer from './ModelViewer';
import { vi } from 'vitest'; // Import vi
import { act } from '@testing-library/react'; // Import act for async updates
import { defaultModelViewerProps } from '../types/modelViewer'; // Import default props

// Mock the local PlayCanvas React library
vi.mock('../lib/@playcanvas/react', () => ({
  OrbitControls: vi.fn(() => null), // Mock OrbitControls
}));

// Mock useModelData
vi.mock('../hooks/useModelData', () => ({
  useModelData: vi.fn(() => ({
    modelData: [],
    loading: true,
    error: null,
    // Destructure splatURL from defaultModelViewerProps before returning
    defaultModelViewerProps: (({ splatURL, ...rest }) => rest)(defaultModelViewerProps),
  })),
}));

// Mock useSplatWithProgress
vi.mock('../hooks/useSplatWithProgress', () => ({
  useSplatWithProgress: vi.fn(() => ({
    asset: null,
    loading: true,
    error: null,
    progress: 0, // Add missing progress property
  })),
}));

// Mock ModelViewerCore to spy on its props and render children
vi.mock('./ModelViewerCore', () => ({
  default: vi.fn((props) => {
    // Render children to allow AutoRotate to be found
    return (
      <div data-testid="mock-model-viewer-core" data-splat={props.splat?.url}>
        Mock Core
        {props.children}
      </div>
    );
  }),
}));

// Import the mocked ModelViewerCore to assert on its calls
import ModelViewerCore from './ModelViewerCore';
// Import the mocked useModelData to control its return value
import { useModelData } from '../hooks/useModelData';
// Import useSplatWithProgress to mock it
import { useSplatWithProgress } from '../hooks/useSplatWithProgress';

describe('ModelViewer Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    vi.clearAllMocks();
    // Set default mock for useModelData for tests that don't explicitly mock it
    vi.mocked(useModelData).mockReturnValue({
      modelData: [],
      loading: true,
      error: null,
      defaultModelViewerProps: defaultModelViewerProps, // Use the actual default props
    });
    // Set default mock for useSplatWithProgress for tests that don't explicitly mock it
    vi.mocked(useSplatWithProgress).mockReturnValue({
      asset: null,
      loading: true,
      error: null,
      progress: 0,
    });
  });

  it('should render ModelViewer without crashing', () => {
    render(<ModelViewer splatURL="test.splat" />);

    // Verify that ModelViewerCore is rendered (it's mocked in this file now)
    expect(vi.mocked(ModelViewerCore)).toHaveBeenCalled();
  });

  it('should pass splat data from useModelData to ModelViewerCore', async () => {
    const mockSplatUrl = 'mock-splat.splat';
    const mockSplatAsset = { url: mockSplatUrl, type: 'gsplat' };

    // Configure useModelData mock to return specific data
    vi.mocked(useModelData).mockReturnValue({
      modelData: [{ ...defaultModelViewerProps, model: 'test', splatURL: mockSplatUrl }],
      loading: false,
      error: null,
      defaultModelViewerProps: defaultModelViewerProps,
    });

    // Configure useSplatWithProgress mock to return the mock asset
    vi.mocked(useSplatWithProgress).mockReturnValue({
      asset: mockSplatAsset,
      loading: false,
      error: null,
      progress: 100, // Assuming it's loaded
    });

    await act(async () => {
      render(<ModelViewer />); // Render ModelViewer without splatURL prop, as it should come from useModelData
    });

    // Assert that ModelViewerCore was called with the correct splat prop and other default props
    const { splatURL: _, ...restDefaultProps } = defaultModelViewerProps; // Exclude splatURL from default props

    const expectedPropsForCore = {
      ...restDefaultProps,
      splat: mockSplatAsset, // Add the expected splat object
    };

    // Get the props that ModelViewerCore was called with
    const receivedProps = vi.mocked(ModelViewerCore).mock.calls[0][0];

    // Assert that receivedProps matches the expected structure
    expect(receivedProps).toEqual(expect.objectContaining(expectedPropsForCore));

    // Optionally, verify the mock-model-viewer-core element reflects the the splat URL
    const mockCoreElement = screen.getByTestId('mock-model-viewer-core');
    expect(mockCoreElement).toHaveAttribute('data-splat', mockSplatUrl);
  });
});
