import { render, screen, act, fireEvent } from '@testing-library/react'; // Import act and fireEvent
import { vi } from 'vitest';
import type ModelViewerCoreType from './ModelViewerCore';

// --- Mocks for PlayCanvas components ---
let latestGSplatEntityPosition: [number, number, number] = [0, 0, 0];
let latestGSplatEntityRotation: [number, number, number] = [0, 0, 0];

const mockEntity = vi.fn(({ children, position, rotation, ...props }) => {
  // If this Entity is wrapping a GSplat, capture its position and rotation
  if (children && children.type === mockGSplat) {
    latestGSplatEntityPosition = position;
    latestGSplatEntityRotation = rotation;
  }
  return <div data-test-id="mock-entity">{children}</div>;
});
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

const dualRangeSliderControlMocks: { [key: string]: (values: number[]) => void } = {};
const mockDualRangeSliderControl = vi.fn((props) => {
  dualRangeSliderControlMocks[props.title] = props.onInput; // Store by title
  return <div data-test-id={`mock-dual-range-slider-${props.title.replace(/\s/g, '-')}`}>Mock DualRangeSliderControl: {props.title}</div>;
});
vi.doMock('./DualRangeSliderControl', () => ({ default: mockDualRangeSliderControl }));

const singleValueSliderControlMocks: { [key: string]: (value: number) => void } = {};
const mockSingleValueSliderControl = vi.fn((props) => {
  singleValueSliderControlMocks[props.label] = props.onInput; // Store by label
  return <div data-test-id={`mock-single-value-slider-${props.label.replace(/\s/g, '-')}`}>Mock SingleValueSliderControl: {props.label}</div>;
});
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
    // Clear the stored callbacks
    for (const key in dualRangeSliderControlMocks) {
      delete dualRangeSliderControlMocks[key];
    }
    for (const key in singleValueSliderControlMocks) {
      delete singleValueSliderControlMocks[key];
    }

    // Reset captured GSplat entity transform
    latestGSplatEntityPosition = [0, 0, 0];
    latestGSplatEntityRotation = [0, 0, 0];

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
    render(<ModelViewerCore splat={{}} />); // splat can be null for settings test

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

  it('should pass custom props to Camera, OrbitControls, and GSplat Entity', () => {
    const customSplat = { id: 'custom-splat-asset' };
    const customProps = {
      splat: customSplat,
      fov: 75,
      distanceMin: 1,
      distanceMax: 10,
      distance: 5,
      pitchAngleMin: -45,
      pitchAngleMax: 45,
      rotation: [10, 20, 30] as [number, number, number],
      position: [1, 2, 3] as [number, number, number],
      scale: [0.5, 0.5, 0.5] as [number, number, number],
    };

    render(<ModelViewerCore {...customProps} />);

    // Verify Camera receives custom fov
    expect(mockCamera).toHaveBeenCalledWith(expect.objectContaining({ fov: customProps.fov }), undefined);

    // Verify OrbitControls receives custom distance and pitch angle props
    expect(mockOrbitControls).toHaveBeenCalledWith(
      expect.objectContaining({
        distanceMin: customProps.distanceMin,
        distanceMax: customProps.distanceMax,
        distance: customProps.distance,
        pitchAngleMin: customProps.pitchAngleMin,
        pitchAngleMax: customProps.pitchAngleMax,
      }),
      undefined
    );

  });

  it('should update camera distance settings when DualRangeSliderControl is interacted with', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('settings=true'));
    render(<ModelViewerCore splat={{}} />); // Need splat for OrbitControls to render

    act(() => {
      dualRangeSliderControlMocks['Camera Distance Settings']([1.0, 10.0]);
    });

    // Assert that OrbitControls received the updated distanceMin and distanceMax
    expect(mockOrbitControls).toHaveBeenCalledWith(
      expect.objectContaining({
        distanceMin: 1.0,
        distanceMax: 10.0,
      }),
      undefined
    );
  });

  it('should update camera pitch angle settings when DualRangeSliderControl is interacted with', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('settings=true'));
    render(<ModelViewerCore splat={{}} />);

    act(() => {
      dualRangeSliderControlMocks['Camera Pitch Angle Settings']([-30, 60]);
    });

    expect(mockOrbitControls).toHaveBeenCalledWith(
      expect.objectContaining({
        pitchAngleMin: -30,
        pitchAngleMax: 60,
      }),
      undefined
    );
  });

  it('should update model position settings when SingleValueSliderControl is interacted with', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('settings=true'));
    render(<ModelViewerCore splat={{}} />);

    act(() => {
      singleValueSliderControlMocks['Position X'](5.0);
    });
    expect(latestGSplatEntityPosition[0]).toBe(5.0);

    act(() => {
      singleValueSliderControlMocks['Position Y'](2.0);
    });
    expect(latestGSplatEntityPosition[1]).toBe(2.0);

    act(() => {
      singleValueSliderControlMocks['Position Z'](-1.0);
    });
    expect(latestGSplatEntityPosition[2]).toBe(-1.0);
  });

  it('should update model rotation settings when SingleValueSliderControl is interacted with', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('settings=true'));
    render(<ModelViewerCore splat={{}} />);

    act(() => {
      singleValueSliderControlMocks['Rotation X'](90.0);
    });
    expect(latestGSplatEntityRotation[0]).toBe(90.0);

    act(() => {
      singleValueSliderControlMocks['Rotation Y'](45.0);
    });
    expect(latestGSplatEntityRotation[1]).toBe(45.0);

    act(() => {
      singleValueSliderControlMocks['Rotation Z'](180.0);
    });
    expect(latestGSplatEntityRotation[2]).toBe(180.0);
  });

  it('should update orbit control sensitivity based on isSliderActive state', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('settings=true'));
    render(<ModelViewerCore splat={{}} />);

    // Initial state: OrbitControls should have default sensitivity
    expect(mockOrbitControls).toHaveBeenCalledWith(
      expect.objectContaining({
        mouse: { distanceSensitivity: 0.05, orbitSensitivity: 0.2 },
        touch: { distanceSensitivity: 0.05, orbitSensitivity: 0.2 },
      }),
      undefined
    );

    // Simulate mouse down on settings panel
    const settingsPanel = screen.getByTestId('settings-panel');
    act(() => {
      fireEvent.mouseDown(settingsPanel);
    });

    // Assert OrbitControls sensitivity is 0
    expect(mockOrbitControls).toHaveBeenCalledWith(
      expect.objectContaining({
        mouse: { distanceSensitivity: 0, orbitSensitivity: 0 },
        touch: { distanceSensitivity: 0, orbitSensitivity: 0 },
      }),
      undefined
    );

    // Simulate mouse up on settings panel
    act(() => {
      fireEvent.mouseUp(settingsPanel);
    });

    // Assert OrbitControls sensitivity is back to default
    expect(mockOrbitControls).toHaveBeenCalledWith(
      expect.objectContaining({
        mouse: { distanceSensitivity: 0.05, orbitSensitivity: 0.2 },
        touch: { distanceSensitivity: 0.05, orbitSensitivity: 0.2 },
      }),
      undefined
    );
  });
});
