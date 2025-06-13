import React from 'react'; // Import React for JSX namespace
import { render, screen } from '@testing-library/react';
import { vi, MockInstance } from 'vitest';
import type AutoRotateType from './AutoRotate'; // Import type for dynamic import

// Define the mock function instance for the Script component
const mockScriptComponent = vi.fn((props: { script?: { name?: string }, [key: string]: any }) => (
  <div data-testid="mock-script" data-script-name={props.script?.name} />
));

// Define the mock for AutoRotator script
function MockAutoRotatorScriptFn() { /* Mock constructor/function */ }
Object.defineProperty(MockAutoRotatorScriptFn, 'name', { value: 'AutoRotator', configurable: true });

// Use vi.doMock for non-hoisted mocks.
// These mocks will be applied before the dynamic import of AutoRotate.
vi.doMock('@playcanvas/react/components', () => ({
  Script: mockScriptComponent,
}));

vi.doMock('@playcanvas/react/scripts', () => ({
  AutoRotator: MockAutoRotatorScriptFn,
}));

describe('AutoRotate Component', () => {
  let AutoRotate: typeof AutoRotateType;

  beforeAll(async () => {
    // Dynamically import the component *after* mocks are set up
    const module = await import('./AutoRotate');
    AutoRotate = module.default;
  });

  beforeEach(() => {
    // Clear mock call history before each test
    mockScriptComponent.mockClear();
  });

  it('should render without crashing and correctly pass AutoRotator to the Script component with default props', () => {
    render(<AutoRotate />);
    
    expect(mockScriptComponent).toHaveBeenCalledTimes(1);
    expect(mockScriptComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        script: MockAutoRotatorScriptFn,
        'data-testid': 'auto-rotate-script', // Expect the data-testid prop
      }),
      undefined // The second argument (context/ref) for a simple functional component
    );

    const mockScriptElement = screen.getByTestId('mock-script');
    expect(mockScriptElement).toBeInTheDocument();
    expect(mockScriptElement).toHaveAttribute('data-script-name', 'AutoRotator');
  });

  it('should correctly pass additional props to the Script component', () => {
    const testPropValue = 10;
    render(<AutoRotate speed={testPropValue} />);

    expect(mockScriptComponent).toHaveBeenCalledTimes(1);
    expect(mockScriptComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        script: MockAutoRotatorScriptFn,
        speed: testPropValue,
      }),
      undefined
    );
  });

  it('should correctly pass the enabled prop to the Script component', () => {
    // Test with enabled = false
    render(<AutoRotate enabled={false} />);
    expect(mockScriptComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        script: MockAutoRotatorScriptFn,
        enabled: false,
      }),
      undefined
    );
    mockScriptComponent.mockClear(); // Clear calls for the next render

    // Test with enabled = true
    render(<AutoRotate enabled={true} />);
    expect(mockScriptComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        script: MockAutoRotatorScriptFn,
        enabled: true,
      }),
      undefined
    );
  });
});
