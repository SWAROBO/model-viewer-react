import { render, screen } from '@testing-library/react';
import ModelLoadingProgress from './ModelLoadingProgress';

describe('ModelLoadingProgress', () => {
  it('does not render when loading is false and no error', () => {
    const { container } = render(<ModelLoadingProgress downloadProgress={0} loading={false} error={null} />);
    expect(container.firstChild).toHaveStyle('display: none');
  });

  it('renders with 0% downloadProgress when loading is true', () => {
    render(<ModelLoadingProgress downloadProgress={0} loading={true} error={null} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders with 50% downloadProgress', () => {
    render(<ModelLoadingProgress downloadProgress={50} loading={true} error={null} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders with 100% downloadProgress when loading is true (still visible)', () => {
    render(<ModelLoadingProgress downloadProgress={100} loading={true} error={null} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByTestId('model-loading-progress-container')).toBeVisible(); // Should still be visible
    expect(screen.getByTestId('model-loading-progress-container')).toHaveStyle('display: flex');
  });

  it('updates downloadProgress correctly', () => {
    const { rerender } = render(<ModelLoadingProgress downloadProgress={25} loading={true} error={null} />);
    expect(screen.getByText('25%')).toBeInTheDocument();

    rerender(<ModelLoadingProgress downloadProgress={75} loading={true} error={null} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides when downloadProgress reaches 100% and loading is false (completed)', () => {
    const { container, rerender } = render(<ModelLoadingProgress downloadProgress={99} loading={true} error={null} />);
    expect(container.firstChild).toBeVisible();

    rerender(<ModelLoadingProgress downloadProgress={100} loading={false} error={null} />); // loading is false here
    expect(container.firstChild).toHaveStyle('display: none'); // Expect it to be hidden via display: none
  });

  it('displays an error message when error prop is present', () => {
    render(<ModelLoadingProgress downloadProgress={0} loading={false} error="Failed to load model" />);
    const errorMessage = screen.getByTestId('model-loading-error-message');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('Error: Failed to load model');
    expect(screen.queryByText('0%')).not.toBeInTheDocument(); // Progress bar should not be visible
  });

  it('remains visible with error message even if loading is false', () => {
    render(<ModelLoadingProgress downloadProgress={100} loading={false} error="Network error" />);
    const container = screen.getByTestId('model-loading-progress-container');
    expect(container).toBeVisible();
    expect(screen.getByTestId('model-loading-error-message')).toBeInTheDocument();
  });
});
