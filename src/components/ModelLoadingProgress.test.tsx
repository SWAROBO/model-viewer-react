import React from 'react';
import { render, screen } from '@testing-library/react';
import ModelLoadingProgress from './ModelLoadingProgress';
import { vi } from 'vitest';

// Mock the react-circular-progressbar component
vi.mock('react-circular-progressbar', () => ({
  CircularProgressbar: vi.fn(({ text }) => (
    <div data-testid="mock-circular-progressbar">{text}</div>
  )),
  buildStyles: vi.fn(() => ({})),
}));

describe('ModelLoadingProgress Component', () => {
  it('should render null if loading is false', () => {
    const { container } = render(<ModelLoadingProgress loading={false} downloadProgress={50} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the progress bar with correct text and opacity if loading is true and progress < 100', () => {
    const progress = 60;
    render(<ModelLoadingProgress loading={true} downloadProgress={progress} />);

    // Find the mocked CircularProgressbar element directly by its text content
    // This element *is* the one with data-testid="mock-circular-progressbar"
    const progressBar = screen.getByText(`${progress}%`);
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('data-testid', 'mock-circular-progressbar');

    // The wrapper div is its parent
    const wrapperDiv = progressBar.parentElement;
    expect(wrapperDiv).toHaveStyle('opacity: 1');
  });

  it('should render the progress bar with opacity 0 if loading is true and progress is 100', () => {
    const progress = 100;
    render(<ModelLoadingProgress loading={true} downloadProgress={progress} />);

    const progressBar = screen.getByText(`${progress}%`);
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('data-testid', 'mock-circular-progressbar');

    const wrapperDiv = progressBar.parentElement;
    expect(wrapperDiv).toHaveStyle('opacity: 0');
  });
});
