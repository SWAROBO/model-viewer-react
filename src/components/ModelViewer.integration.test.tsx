import { render, screen, fireEvent, act } from '@testing-library/react'; // Added act
import { vi } from 'vitest';
import { useSearchParams } from 'next/navigation';

// Import original modules for type inference, even though they are mocked
import { Entity } from '@playcanvas/react';
import { OrbitControls } from '../lib/@playcanvas/react';

// Mock useSearchParams
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

// Mock specific components from @playcanvas/react/components
const mockScript = vi.fn(({ children, script, ...props }) => {
  console.log('mockScript called with script:', script); // Debugging
  return <div /* no data-testid here */ {...props}>{children}</div>; // Removed data-testid
});

vi.mock('@playcanvas/react/components', () => ({
  Camera: vi.fn(() => <div data-testid="mock-playcanvas-camera">Mock Camera</div>),
  GSplat: vi.fn(() => <div data-testid="mock-playcanvas-gsplat">Mock GSplat</div>),
  EnvAtlas: vi.fn(() => <div data-testid="mock-playcanvas-envatlas">Mock EnvAtlas</div>),
  Script: mockScript, // Use the spy here
}));

// Mock the main @playcanvas/react module for Application and Entity
vi.mock('@playcanvas/react', () => ({
  Application: vi.fn(({ children }) => <div data-testid="mock-playcanvas-application">{children}</div>),
  Entity: vi.fn(({ children, ...props }) => <div data-testid="mock-playcanvas-entity" {...props}>{children}</div>),
}));

// Mock the hooks from @playcanvas/react/hooks
vi.mock('@playcanvas/react/hooks', () => ({
  useEnvAtlas: vi.fn(() => ({ asset: {} })),
}));

// Mock @playcanvas/react/scripts
const mockGridScript = vi.fn(() => ({})); // Make it a spy
const mockAutoRotator = {}; // Simple mock for AutoRotator
vi.mock('@playcanvas/react/scripts', () => ({
  Grid: mockGridScript, // Provide the mocked GridScript
  AutoRotator: mockAutoRotator, // Provide the mocked AutoRotator
}));

// Mock DualRangeSliderControl
let capturedDualRangeOnInput: ((value: number[]) => void)[] = []; // Array for multiple instances
const mockDualRangeSliderControl = vi.fn(({ onInput, ...props }) => {
  capturedDualRangeOnInput.push(onInput); // Capture the onInput function
  return <div /* no data-testid */ {...props}></div>;
});
vi.mock('./DualRangeSliderControl', () => ({ default: mockDualRangeSliderControl }));

// Mock SingleValueSliderControl
let capturedSingleValueOnInput: ((value: number) => void)[] = []; // Array for multiple instances
const mockSingleValueSliderControl = vi.fn(({ onInput, ...props }) => {
  capturedSingleValueOnInput.push(onInput); // Capture the onInput function
  return <div /* no data-testid */ {...props}></div>;
});
vi.mock('./SingleValueSliderControl', () => ({ default: mockSingleValueSliderControl }));

// Mock the local @playcanvas/react/orbit-controls
vi.mock('../lib/@playcanvas/react', () => ({
  OrbitControls: vi.fn((props) => {
    // console.log('Mock OrbitControls called with props:', props); // Debugging
    return <div data-testid="mock-orbit-controls" {...props}>Mock OrbitControls</div>;
  }),
}));


describe('ModelViewerCore Integration Tests', () => {
  let ModelViewerCore: any;

  beforeAll(async () => {
    const module = await import('./ModelViewerCore');
    ModelViewerCore = module.default;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockScript.mockClear();
    mockDualRangeSliderControl.mockClear();
    mockSingleValueSliderControl.mockClear();
    capturedDualRangeOnInput = []; // Reset captured array
    capturedSingleValueOnInput = []; // Reset captured array
  });

  // Test for AutoRotate conditional rendering
  it('should render AutoRotate (via Script) when settings parameter is not "true"', () => {
    (useSearchParams as vi.Mock).mockReturnValue({
      get: vi.fn((param) => (param === 'settings' ? 'false' : null)),
    });

    render(<ModelViewerCore splat={null} />);

    expect(mockScript).toHaveBeenCalledTimes(2); // Once for Grid, once for AutoRotate
    expect(mockScript).toHaveBeenCalledWith(
      expect.objectContaining({ script: mockAutoRotator, startDelay: 1, startFadeInTime: 2 }),
      undefined
    );
  });

  it('should not render AutoRotate (via Script) when settings parameter is "true"', () => {
    (useSearchParams as vi.Mock).mockReturnValue({
      get: vi.fn((param) => (param === 'settings' ? 'true' : null)),
    });

    render(<ModelViewerCore splat={null} />);

    expect(mockScript).toHaveBeenCalledTimes(1); // Only for Grid
    expect(mockScript).toHaveBeenCalledWith(
      expect.objectContaining({ script: mockGridScript }),
      undefined
    );
    expect(mockScript).not.toHaveBeenCalledWith(
      expect.objectContaining({ script: mockAutoRotator }),
      undefined
    );
  });

  // Test for DualRangeSliderControl interaction
  it('should update camera distance settings when DualRangeSliderControl is interacted with', async () => { // Made async
    (useSearchParams as vi.Mock).mockReturnValue({
      get: vi.fn((param) => (param === 'settings' ? 'true' : null)), // Show settings panel
    });

    render(<ModelViewerCore splat={{}} />); // Pass splat to render OrbitControls

    // Directly call the captured onInput function for the distance slider (index 0)
    expect(capturedDualRangeOnInput[0]).toBeDefined();
    await act(async () => { // Wrap in act
      capturedDualRangeOnInput[0]([10, 20]); // Simulate input
    });

    // Assert that OrbitControls received updated distanceMin/Max
    const orbitControlCalls = vi.mocked(OrbitControls).mock.calls;
    // Find the call where distanceMin is 10 (this should be the updated call)
    const updatedOrbitControlCall = orbitControlCalls.find(call => call[0].distanceMin === 10);

    expect(updatedOrbitControlCall).toBeDefined(); // Ensure such a call exists
    expect(updatedOrbitControlCall![0]).toEqual(
      expect.objectContaining({
        distanceMin: 10,
        distanceMax: 20,
        distance: 10,
      })
    );
  });

  // Test for SingleValueSliderControl interaction (e.g., Model Position X)
  it('should update model position X when SingleValueSliderControl is interacted with', async () => { // Made async
    (useSearchParams as vi.Mock).mockReturnValue({
      get: vi.fn((param) => (param === 'settings' ? 'true' : null)), // Show settings panel
    });

    render(<ModelViewerCore splat={{}} />); // Pass splat to render GSplat Entity

    // Directly call the captured onInput function for the first instance (Position X)
    expect(capturedSingleValueOnInput[0]).toBeDefined();
    await act(async () => { // Wrap in act
      capturedSingleValueOnInput[0](5); // Simulate input
    });

    // Assert that the GSplat Entity received updated position prop
    // Check the last call to Entity, which should be the splat entity
    const lastEntityCall = vi.mocked(Entity).mock.calls[vi.mocked(Entity).mock.calls.length - 1];
    expect(lastEntityCall[0]).toEqual(
      expect.objectContaining({
        position: [5, 0, 0], // Assuming initial position is [0,0,0] and onInput sets to 5
      })
    );
  });
});
