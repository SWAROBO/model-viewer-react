import { render, screen } from '@testing-library/react';
import ModelLoadingProgress from './ModelLoadingProgress';

describe('ModelLoadingProgress', () => {
  it('does not render when loading is false', () => {
    const { container } = render(<ModelLoadingProgress downloadProgress={0} loading={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders with 0% downloadProgress when loading is true', () => {
    render(<ModelLoadingProgress downloadProgress={0} loading={true} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders with 50% downloadProgress', () => {
    render(<ModelLoadingProgress downloadProgress={50} loading={true} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders with 100% downloadProgress', () => {
    render(<ModelLoadingProgress downloadProgress={100} loading={true} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('updates downloadProgress correctly', () => {
    const { rerender } = render(<ModelLoadingProgress downloadProgress={25} loading={true} />);
    expect(screen.getByText('25%')).toBeInTheDocument();

    rerender(<ModelLoadingProgress downloadProgress={75} loading={true} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides when downloadProgress reaches 100%', () => {
    const { container, rerender } = render(<ModelLoadingProgress downloadProgress={99} loading={true} />);
    expect(container.firstChild).toBeVisible();

    rerender(<ModelLoadingProgress downloadProgress={100} loading={true} />);
    // The component's style sets opacity to 0 when downloadProgress is 100.
    // React Testing Library's toBeVisible checks for display: none, visibility: hidden, opacity: 0.
    // So, it should not be visible.
    expect(container.firstChild).not.toBeVisible();
  });
});
