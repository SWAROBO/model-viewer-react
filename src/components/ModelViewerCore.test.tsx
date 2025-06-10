import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type ModelViewerCoreType from './ModelViewerCore';

// --- Mocks for PlayCanvas components ---
const mockEntity = vi.fn(({ children }) => <div data-test-id="mock-entity">{children}</div>);
const mockCamera = vi.fn((props) => <div data-test-id="mock-camera" data-fov={props.fov}>Mock Camera</div>);
const mockGSplat = vi.fn((props) => <div data-test-id="mock-gsplat" data-splat-present={!!props.asset}>Mock GSplat</div>);
const mockEnvAtlas = vi.fn((props) => <div data-test-id="mock-env-atlas" data-src={props.asset?.src}>Mock EnvAtlas</div>);
const mockOrbitControls = vi.fn((props) => <div data-test-id="mock-orbit-controls">Mock OrbitControls</div>);

vi.doMock('@playcanvas/react', () => ({
  Entity: mockEntity,
}));
vi.doMock('@playcanvas/react/components', () => ({
  Camera: mockCamera,
  GSplat: mockGSplat,
  EnvAtlas: mockEnvAtlas,
}));
vi.doMock('../lib/@playcanvas/react', () => ({
  OrbitControls: mockOrbitControls,
}));

// --- Mocks for PlayCanvas hooks ---
const mockUseEnvAtlas = vi.fn((src) => ({ asset: { src, id: 'mock-env-asset' } }));
vi.doMock('@playcanvas/react/hooks', () => ({
  useEnvAtlas: mockUseEnvAtlas,
}));

// --- Mocks for Next.js hooks ---
// Create a stable URLSearchParams instance to prevent infinite re-renders
const stableSearchParams = new URLSearchParams();
const mockUseSearchParams = vi.fn(() => stableSearchParams); // Always return the same instance
vi.doMock('next/navigation', () => ({
  useSearchParams: mockUseSearchParams,
}));

// --- Mocks for local components ---
const mockAutoRotate = vi.fn((props) => <div data-test-id="mock-auto-rotate">Mock AutoRotate</div>);
vi.doMock('./AutoRotate', () => ({ default: mockAutoRotate }));

const mockGrid = vi.fn((props) => <div data-test-id="mock-grid">Mock Grid</div>);
vi.doMock('./Grid', () => ({ default: mockGrid }));

const mockDualRangeSliderControl = vi.fn((props) => <div data-test-id="mock-dual-range-slider">Mock DualRangeSliderControl: {props.title}</div>);
vi.doMock('./DualRangeSliderControl', () => ({ default: mockDualRangeSliderControl }));

const mockSingleValueSliderControl = vi.fn((props) => <div data-test-id="mock-single-value-slider">Mock SingleValueSliderControl: {props.label}</div>);
vi.doMock('./SingleValueSliderControl', () => ({ default: mockSingleValueSliderControl }));


describe('ModelViewerCore Component', () => {
  let ModelViewerCore: typeof ModelViewerCoreType;

  beforeAll(async () => {
    const module = await import('./ModelViewerCore');
    ModelViewerCore = module.default;
  });

  beforeEach(() => {
    // Clear all mocks
    mockEntity.mockClear();
    mockCamera.mockClear();
    mockGSplat.mockClear();
    mockEnvAtlas.mockClear();
    mockOrbitControls.mockClear();
    mockUseEnvAtlas.mockClear();
    mockUseSearchParams.mockClear();
    mockAutoRotate.mockClear();
    mockGrid.mockClear();
    mockDualRangeSliderControl.mockClear();
    mockSingleValueSliderControl.mockClear();

    // Reset useSearchParams to default (no settings)
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it('should render core PlayCanvas entities and components with default props (no splat, no settings)', () => {
    render(<ModelViewerCore splat={null} />);

    // Verify main Entity wrapper
    // There are 4 Entity components: root, camera, splat, and EnvAtlasComponent's internal Entity.
    expect(mockEntity).toHaveBeenCalledTimes(4);

    // Verify Grid is rendered
    expect(mockGrid).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mock-grid')).toBeInTheDocument();

    // Verify EnvAtlasComponent is rendered (default showSettings is false)
    expect(mockUseEnvAtlas).toHaveBeenCalledTimes(1);
    expect(mockEnvAtlas).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mock-env-atlas')).toBeInTheDocument();

    // Verify Camera is rendered
    expect(mockCamera).toHaveBeenCalledTimes(1);
    expect(mockCamera).toHaveBeenCalledWith(expect.objectContaining({ fov: 60 }), undefined); // Default fov
    expect(screen.getByTestId('mock-camera')).toBeInTheDocument();

    // Verify AutoRotate is rendered (default showSettings is false)
    expect(mockAutoRotate).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mock-auto-rotate')).toBeInTheDocument();

    // Verify OrbitControls is NOT rendered if splat is null
    expect(mockOrbitControls).not.toHaveBeenCalled();

    // Verify GSplat is NOT rendered if splat is null
    expect(mockGSplat).not.toHaveBeenCalled();

    // Verify settings panel is NOT rendered by default
    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
    expect(mockDualRangeSliderControl).not.toHaveBeenCalled();
    expect(mockSingleValueSliderControl).not.toHaveBeenCalled();
  });

  it('should render GSplat and OrbitControls when splat prop is provided', () => {
    const dummySplat = { id: 'test-splat' };
    render(<ModelViewerCore splat={dummySplat} />);

    // Verify OrbitControls is rendered
    expect(mockOrbitControls).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('mock-orbit-controls')).toBeInTheDocument();

    // Verify GSplat is rendered
    expect(mockGSplat).toHaveBeenCalledTimes(1);
    expect(mockGSplat).toHaveBeenCalledWith(expect.objectContaining({ asset: dummySplat }), undefined);
    expect(screen.getByTestId('mock-gsplat')).toBeInTheDocument();
  });

  it('should render the settings panel and controls when searchParams has "settings=true"', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('settings=true'));
    render(<ModelViewerCore splat={null} />); // splat can be null for settings test

    // Verify settings panel is rendered
    const settingsPanel = screen.getByTestId('settings-panel');
    expect(settingsPanel).toBeInTheDocument();

    // Verify DualRangeSliderControls are rendered
    expect(mockDualRangeSliderControl).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/mock dualrangeslidercontrol: camera distance settings/i)).toBeInTheDocument();
    expect(screen.getByText(/mock dualrangeslidercontrol: camera pitch angle settings/i)).toBeInTheDocument();

    // Verify SingleValueSliderControls are rendered (6 of them for position and rotation)
    expect(mockSingleValueSliderControl).toHaveBeenCalledTimes(6);
    expect(screen.getByText(/mock singlevalueslidercontrol: position x/i)).toBeInTheDocument();
    expect(screen.getByText(/mock singlevalueslidercontrol: position y/i)).toBeInTheDocument();
    expect(screen.getByText(/mock singlevalueslidercontrol: position z/i)).toBeInTheDocument();
    expect(screen.getByText(/mock singlevalueslidercontrol: rotation x/i)).toBeInTheDocument();
    expect(screen.getByText(/mock singlevalueslidercontrol: rotation y/i)).toBeInTheDocument();
    expect(screen.getByText(/mock singlevalueslidercontrol: rotation z/i)).toBeInTheDocument();
  });
});
