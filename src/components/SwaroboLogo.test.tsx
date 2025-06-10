import React from 'react';
import { render, screen } from '@testing-library/react';
import SwaroboLogo from './SwaroboLogo';

describe('SwaroboLogo Component', () => {
  it('should render the logo image with correct attributes and link', () => {
    render(<SwaroboLogo />);

    // Check for the image element
    const logoImage = screen.getByRole('img', { name: /swarobo logo/i });
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', '/logo-swarobo.png');
    expect(logoImage).toHaveAttribute('alt', 'SWAROBO Logo');

    // Check for the link element
    const logoLink = screen.getByRole('link', { name: /swarobo logo/i }); // Link should have the image as accessible name
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', 'https://swarobo.ai/');
    expect(logoLink).toHaveAttribute('target', '_blank');
    expect(logoLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
