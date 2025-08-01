import React from 'react'; // Import React for JSX namespace
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Define the mock function instance for the Script component
interface MockScriptProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  script?: { name?: string; new? (...args: any[]): any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
const mockScriptComponent = vi.fn((props: MockScriptProps) => (
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
  let AutoRotate: React.ComponentType<Record<string, unknown>>;

  beforeAll(async () => {
    // Dynamically import the component *after* mocks are set up
    const { default: AutoRotateComponent } = await import('./AutoRotate');
    AutoRotate = AutoRotateComponent;
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
