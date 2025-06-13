import { render, screen } from '@testing-library/react';
import Grid from './Grid';

// Mock the entire @playcanvas/react module to prevent issues with PlayCanvas dependencies in JSDOM
vi.mock('@playcanvas/react/components', () => ({
  Script: vi.fn(({ script, ...props }) => <div data-testid="mock-playcanvas-script" data-script-name={script?.name} {...props}></div>),
}));

vi.mock('@playcanvas/react/scripts', () => ({
  Grid: { name: 'GridScript' }, // Provide a dummy object for GridScript
}));

describe('Grid', () => {
  it('renders the PlayCanvas Script component with GridScript', () => {
    render(<Grid />);
    const scriptComponent = screen.getByTestId('mock-playcanvas-script');
    expect(scriptComponent).toBeInTheDocument();
    expect(scriptComponent).toHaveAttribute('data-script-name', 'GridScript');
  });
});
