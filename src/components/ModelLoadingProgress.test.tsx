import React from 'react';
import { render, screen } from '@testing-library/react';
import ModelLoadingProgress from './ModelLoadingProgress';

describe('ModelLoadingProgress Component', () => {
  it('should render null if loading is false', () => {
    const { container } = render(<ModelLoadingProgress loading={false} downloadProgress={50} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the progress bar with correct text and opacity if loading is true and progress < 100', () => {
    const progress = 60;
    render(<ModelLoadingProgress loading={true} downloadProgress={progress} />);

    // Check for the CircularProgressbar SVG element by its data-test-id
    const progressBarSvg = screen.getByTestId('CircularProgressbar');
    expect(progressBarSvg).toBeInTheDocument();

    // Check for the text content (e.g., "60%") within the SVG
    // The text is a <text> element inside the SVG.
    expect(screen.getByText(`${progress}%`)).toBeInTheDocument();
    
    // The CircularProgressbar component itself doesn't add aria-valuenow to the root SVG.
    // Verifying the text content serves a similar purpose for a basic rendering test.

    // The wrapper div contains the CircularProgressbar.
    // Its opacity is determined by `downloadProgress < 100 ? 1 : 0`.
    // For progress = 60, opacity should be 1.
    // The progressbar is the first child of the styled div.
    const wrapperDiv = progressBarSvg.parentElement; 
    expect(wrapperDiv).toHaveStyle('opacity: 1');
  });

  it('should render the progress bar with opacity 0 if loading is true and progress is 100', () => {
    const progress = 100;
    render(<ModelLoadingProgress loading={true} downloadProgress={progress} />);

    // Check for the CircularProgressbar SVG element by its data-test-id
    const progressBarSvg = screen.getByTestId('CircularProgressbar');
    expect(progressBarSvg).toBeInTheDocument();

    // Check for the text content
    expect(screen.getByText(`${progress}%`)).toBeInTheDocument();

    // For progress = 100, opacity should be 0.
    const wrapperDiv = progressBarSvg.parentElement;
    expect(wrapperDiv).toHaveStyle('opacity: 0');
  });
});
