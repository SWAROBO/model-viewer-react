import { render, screen } from '@testing-library/react';
import Grid from './Grid';

// Mock the entire @playcanvas/react module to prevent issues with PlayCanvas dependencies in JSDOM
vi.mock('@playcanvas/react/components', () => ({
  Script: vi.fn(({ script, ...props }) => <div data-testid="grid-script-component" data-script-name={script?.name} {...props}></div>),
}));

vi.mock('@playcanvas/react/scripts', () => ({
  Grid: { name: 'GridScript' }, // Provide a dummy object for GridScript
}));

describe('Grid', () => {
  it('renders the PlayCanvas Script component with GridScript', () => {
    render(<Grid />);
    const scriptComponent = screen.getByTestId('grid-script-component');
    expect(scriptComponent).toBeInTheDocument();
    expect(scriptComponent).toHaveAttribute('data-script-name', 'GridScript');
  });

  it('should correctly pass additional props to the Script component', () => {
    const testPropValue = 50;
    render(<Grid size={testPropValue} />);

    const scriptComponent = screen.getByTestId('grid-script-component');
    expect(scriptComponent).toHaveAttribute('size', testPropValue.toString());
  });
});
