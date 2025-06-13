import { render, screen, fireEvent } from '@testing-library/react';
import ModelViewer from './ModelViewer';
import { vi } from 'vitest'; // Import vi

// Mock the local PlayCanvas React library
vi.mock('../lib/@playcanvas/react', () => ({
  OrbitControls: vi.fn(() => null), // Mock OrbitControls
}));

describe('ModelViewer Integration', () => {
  it('should render ModelViewer without crashing and ensure AutoRotate is present', () => {
    render(<ModelViewer splatURL="test.splat" />);

    // Verify that ModelViewerCore renders at least one Entity (from global Entity mock)
    expect(screen.getAllByTestId('mock-entity').length).toBeGreaterThan(0);

    // Verify that AutoRotate is rendered (it renders a Script component with data-testid="auto-rotate-script")
    expect(screen.getByTestId('auto-rotate-script')).toBeInTheDocument();
  });
});
