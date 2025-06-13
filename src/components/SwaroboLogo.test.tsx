import { render, screen } from '@testing-library/react';
import SwaroboLogo from './SwaroboLogo';

describe('SwaroboLogo', () => {
  it('renders the logo image', () => {
    render(<SwaroboLogo />);
    const logoImage = screen.getByRole('img', { name: /swarobo logo/i });
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', '/logo-swarobo.png');
  });
});
