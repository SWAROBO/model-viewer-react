import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Page as ActualPage } from './page'; // Import the named Page component for testing

// --- Mocks for Next.js ---
// Mock next/dynamic to directly return the ModelViewer mock component function
vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: vi.fn(() => mockModelViewerComponent),
}));

// Mock next/navigation's useSearchParams
const { mockUseSearchParams } = vi.hoisted(() => {
  const useSearchParams = vi.fn(() => new URLSearchParams());
  return { mockUseSearchParams: useSearchParams };
});
vi.mock('next/navigation', () => ({
  useSearchParams: mockUseSearchParams,
}));

// --- Mocks for PlayCanvas ---
// Mock @playcanvas/react's Application component
const { mockApplicationComponent } = vi.hoisted(() => {
  // This is the actual mock function for the Application component
  const AppFn = vi.fn(({ children }) => <div data-test-id="mock-application">{children}</div>);
  return { mockApplicationComponent: AppFn };
});

// Revert to a simpler mock for @playcanvas/react, ensuring __esModule is set.
vi.mock('@playcanvas/react', () => ({
  __esModule: true, // Add this to help with module interop
  Application: mockApplicationComponent, // This should be the vi.fn() itself
}));

// --- Mocks for local components/hooks ---
// Mock ModelViewer using vi.hoisted
const { mockModelViewerComponent } = vi.hoisted(() => { // Renamed
  const ModelViewerComponent = vi.fn((props) => <div data-test-id="mock-model-viewer">Mock ModelViewer</div>);
  return { mockModelViewerComponent: ModelViewerComponent };
});
vi.mock('@/components/ModelViewer', () => ({
  __esModule: true,
  default: mockModelViewerComponent, // Use the actual mock function
}));

// Mock SwaroboLogo
const { mockSwaroboLogoComponent } = vi.hoisted(() => { // Renamed
  const SwaroboLogoComponent = vi.fn(() => <div data-test-id="mock-swarobo-logo">Mock SwaroboLogo</div>);
  return { mockSwaroboLogoComponent: SwaroboLogoComponent };
});
vi.mock('@/components/SwaroboLogo', () => ({
  default: mockSwaroboLogoComponent, // Use the actual mock function
}));

// Mock useModelData hook using vi.hoisted
const { mockUseModelData, mockModelData, mockDefaultModelViewerProps } = vi.hoisted(() => {
  const modelData = [
    { model: 'model1', splatURL: 'url1', fov: 60 },
    { model: 'model2', splatURL: 'url2', fov: 70 },
  ];
  const defaultProps = { splatURL: 'default_url', fov: 50 };
  const useModelDataFn = vi.fn(() => ({
    modelData: modelData,
    loading: false,
    error: null,
    defaultModelViewerProps: defaultProps,
  }));
  return { 
    mockUseModelData: useModelDataFn,
    mockModelData: modelData, 
    mockDefaultModelViewerProps: defaultProps 
  };
});
vi.mock('@/hooks/useModelData', () => ({
  useModelData: mockUseModelData,
}));


describe('ActualPage Component', () => { // Changed describe to reflect component being tested
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams()); // Reset search params
    // Reset the hoisted mockUseModelData to its default behavior
    mockUseModelData.mockReturnValue({ 
      modelData: mockModelData, // Use hoisted mockModelData
      loading: false,
      error: null,
      defaultModelViewerProps: mockDefaultModelViewerProps, // Use hoisted mockDefaultModelViewerProps
    });
    // Also clear the component mocks if they are stateful or you need to check call counts per test
    mockApplicationComponent.mockClear();
    mockModelViewerComponent.mockClear();
    mockSwaroboLogoComponent.mockClear();
  });

  it('should render Application, ModelViewer, and SwaroboLogo', async () => {
    render(<ActualPage />);

    // Wait for async operations (useEffect in Page and useModelData)
    await waitFor(() => {
      expect(mockApplicationComponent).toHaveBeenCalled(); // Called at least once
      expect(screen.getByTestId('mock-application')).toBeInTheDocument();
      // ModelViewer might be called twice: once with initial/default props, once after effect
      expect(mockModelViewerComponent).toHaveBeenCalled(); 
      expect(screen.getByTestId('mock-model-viewer')).toBeInTheDocument();
      expect(mockSwaroboLogoComponent).toHaveBeenCalled(); // Called at least once
      expect(screen.getByTestId('mock-swarobo-logo')).toBeInTheDocument();
    });
  });

  it('should select model based on search param', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('model=model2'));
    render(<ActualPage />);

    await waitFor(() => {
      // Expect it to be called with the correct props eventually
      const lastCallArgs = mockModelViewerComponent.mock.calls[mockModelViewerComponent.mock.calls.length - 1];
      expect(lastCallArgs[0]).toEqual(
        expect.objectContaining({ splatURL: 'url2', fov: 70 })
      );
    });
  });

  it('should use default model if search param does not match', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('model=nonexistent'));
    render(<ActualPage />);

    await waitFor(() => {
      // Page logic: if modelName doesn't match, it uses modelData[0]
      const lastCallArgs = mockModelViewerComponent.mock.calls[mockModelViewerComponent.mock.calls.length - 1];
      expect(lastCallArgs[0]).toEqual(
        expect.objectContaining({ splatURL: 'url1', fov: 60 }) // modelData[0]
      );
    });
  });

  it('should use first model if no search param and modelData is available', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams()); // No model param
    render(<ActualPage />);

    await waitFor(() => {
      const lastCallArgs = mockModelViewerComponent.mock.calls[mockModelViewerComponent.mock.calls.length - 1];
      expect(lastCallArgs[0]).toEqual(
        expect.objectContaining({ splatURL: 'url1', fov: 60 }) // First model in mockModelData
      );
    });
  });

  it('should use defaultModelViewerProps if modelData is empty', async () => {
    const specificDefaultProps = { splatURL: 'specific_default_url', fov: 99 };
    mockUseModelData.mockReturnValue({
      modelData: [], // Empty model data
      loading: false,
      error: null,
      defaultModelViewerProps: specificDefaultProps, // Use a very specific object for this test
    });
    mockUseSearchParams.mockReturnValue(new URLSearchParams()); // No model param
    render(<ActualPage />);

    await waitFor(() => {
      // Initial render uses useState(specificDefaultProps)
      // Effect runs, modelData is empty, calls setCurrentModelProps(specificDefaultProps)
      // If state was already specificDefaultProps, no re-render. If it changed, it re-renders.
      // We expect it to be called with these props.
      const lastCallArgs = mockModelViewerComponent.mock.calls[mockModelViewerComponent.mock.calls.length - 1];
      expect(lastCallArgs[0]).toEqual(
        expect.objectContaining(specificDefaultProps)
      );
    });
  });
});
