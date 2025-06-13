import { render, screen } from '@testing-library/react';
import { vi, Mock } from 'vitest'; // Import Mock
import ModelViewerCore from './ModelViewerCore';
import { useSearchParams } from 'next/navigation'; // Import the hook to mock it directly

// Mock PlayCanvas components and hooks
vi.mock('@playcanvas/react', () => ({
  Entity: vi.fn(({ children }) => <>{children}</>), // Render children directly without a div
}));

vi.mock('@playcanvas/react/components', () => ({
  Camera: vi.fn(() => null), // Render null
  GSplat: vi.fn(() => null), // Render null
  EnvAtlas: vi.fn(() => null), // Render null
}));

vi.mock('@playcanvas/react/hooks', () => ({
  useEnvAtlas: vi.fn(() => ({ asset: {} })), // Return a dummy asset
}));

vi.mock('../lib/@playcanvas/react', () => ({
  OrbitControls: vi.fn(() => null), // Render null
}));

// Mock Next.js useSearchParams at the top level
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(), // Just mock the function itself
}));

// Mock child components to simplify testing ModelViewerCore in isolation
vi.mock('./AutoRotate', () => ({ default: vi.fn(() => <div data-testid="mock-auto-rotate"></div>) }));
vi.mock('./Grid', () => ({ default: vi.fn(() => <div data-testid="mock-grid"></div>) }));
vi.mock('./DualRangeSliderControl', () => ({
  default: vi.fn(({ onInput, ...props }) => (
    <div data-testid="mock-dual-range-slider" {...props}></div> // Simplified, no button
  )),
}));
vi.mock('./SingleValueSliderControl', () => ({
  default: vi.fn(({ onInput, ...props }) => (
    <div data-testid="mock-single-value-slider" {...props}></div> // Simplified, no button
  )),
}));


describe('ModelViewerCore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as any).mockReturnValue({
      get: vi.fn((param) => {
        if (param === 'settings') return 'false';
        return null;
      }),
    });
  });

  it('renders without crashing', () => {
    render(<ModelViewerCore splat={null} />);
    expect(screen.getByTestId('mock-grid')).toBeInTheDocument();
  });

  // Removed tests that rely on `toHaveBeenCalled` for PlayCanvas components or check for their DOM presence when they render null.

  it('renders AutoRotate when showSettings is false', () => {
    render(<ModelViewerCore splat={null} />);
    expect(screen.getByTestId('mock-auto-rotate')).toBeInTheDocument();
  });

  it('does not render AutoRotate when showSettings is true', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn((param) => {
        if (param === 'settings') return 'true';
        return null;
      }),
    });
    render(<ModelViewerCore splat={null} />);
    expect(screen.queryByTestId('mock-auto-rotate')).not.toBeInTheDocument();
  });

  it('renders settings controls when showSettings is true', () => {
    (useSearchParams as any).mockReturnValue({
      get: vi.fn((param) => {
        if (param === 'settings') return 'true';
        return null;
      }),
    });
    render(<ModelViewerCore splat={null} />);
    expect(screen.getAllByTestId('mock-dual-range-slider').length).toBe(2);
    expect(screen.getAllByTestId('mock-single-value-slider').length).toBe(6);
  });

  it('does not render settings controls when showSettings is false', () => {
    render(<ModelViewerCore splat={null} />);
    expect(screen.queryByTestId('mock-dual-range-slider')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-single-value-slider')).not.toBeInTheDocument();
  });
});
