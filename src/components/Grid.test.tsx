import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type GridComponentType from './Grid'; // Import type for dynamic import

// Define the mock function instance for the Script component
const mockScriptComponent = vi.fn((props: { script?: { name?: string }, [key: string]: any }) => (
  <div data-test-id="mock-script" data-script-name={props.script?.name} />
));

// Define the mock for GridScript
function MockGridScript() { /* Mock constructor/function */ }
Object.defineProperty(MockGridScript, 'name', { value: 'Grid', configurable: true }); // Original script is named 'Grid'

// Use vi.doMock for non-hoisted mocks.
vi.doMock('@playcanvas/react/components', () => ({
  Script: mockScriptComponent,
}));

vi.doMock('@playcanvas/react/scripts', () => ({
  Grid: MockGridScript, // Note: The import in Grid.tsx is `import { Grid as GridScript }`. So the actual export name is 'Grid'.
}));

describe('Grid Component', () => {
  let Grid: typeof GridComponentType;

  beforeAll(async () => {
    // Dynamically import the component *after* mocks are set up
    const module = await import('./Grid');
    Grid = module.default;
  });

  beforeEach(() => {
    // Clear mock call history before each test
    mockScriptComponent.mockClear();
  });

  it('should render without crashing and correctly pass GridScript to the Script component with default props', () => {
    render(<Grid />); // Grid component takes no explicit props in its definition other than {...props}
    
    expect(mockScriptComponent).toHaveBeenCalledTimes(1);
    expect(mockScriptComponent).toHaveBeenCalledWith(
      { script: MockGridScript }, // The props object
      undefined // The second argument (context/ref)
    );

    const mockScriptElement = screen.getByTestId('mock-script');
    expect(mockScriptElement).toBeInTheDocument();
    expect(mockScriptElement).toHaveAttribute('data-script-name', 'Grid');
  });

  it('should pass additional props to the Script component', () => {
    const testProps = { size: 100, divisions: 10 };
    render(<Grid {...testProps} />);

    expect(mockScriptComponent).toHaveBeenCalledTimes(1);
    expect(mockScriptComponent).toHaveBeenCalledWith(
      { script: MockGridScript, ...testProps },
      undefined
    );
  });
});
