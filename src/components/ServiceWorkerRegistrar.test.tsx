import { render } from '@testing-library/react';
import ServiceWorkerRegistrar from './ServiceWorkerRegistrar';
import { vi, Mock } from 'vitest'; // Import Mock type for vi.Mock

describe('ServiceWorkerRegistrar Component', () => {
  // Store original global objects to restore them after tests
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  // Mock navigator.serviceWorker and window properties
  let mockServiceWorkerRegister: vi.Mock;
  let mockServiceWorker: any;

  beforeEach(() => {
    // Create a fresh mock for register function for each test
    mockServiceWorkerRegister = vi.fn(() => Promise.resolve({ scope: '/mock-scope' }));
    mockServiceWorker = {
      register: mockServiceWorkerRegister,
    };

    // Stub global navigator and window objects
    // We spread originalNavigator/originalWindow to keep other properties intact
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      serviceWorker: mockServiceWorker, // Override serviceWorker property
    });
    vi.stubGlobal('window', {
      ...originalWindow,
      self: originalWindow.self, // Default to self === top for most tests
      top: originalWindow.top,
    });
  });

  afterEach(() => {
    // Restore original global objects after each test to prevent side effects
    vi.unstubAllGlobals();
  });

  it('should render null', () => {
    const { container } = render(<ServiceWorkerRegistrar />);
    expect(container.firstChild).toBeNull();
  });

  it('should register service worker when conditions are met (serviceWorker in navigator and self === top)', () => {
    // Conditions are met by default in beforeEach setup
    render(<ServiceWorkerRegistrar />);
    expect(mockServiceWorkerRegister).toHaveBeenCalledTimes(1);
    expect(mockServiceWorkerRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('should NOT register service worker if serviceWorker is not in navigator', () => {
    // Simulate 'serviceWorker' not being available in navigator
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      serviceWorker: undefined,
    });
    render(<ServiceWorkerRegistrar />);
    expect(mockServiceWorkerRegister).not.toHaveBeenCalled();
  });

  it('should NOT register service worker if window.self !== window.top (e.g., in an iframe)', () => {
    // Simulate being in an iframe by making window.self different from window.top
    vi.stubGlobal('window', {
      ...originalWindow,
      self: {}, // A new object, so it's not strictly equal to originalWindow.top
      top: originalWindow.top,
    });
    render(<ServiceWorkerRegistrar />);
    expect(mockServiceWorkerRegister).not.toHaveBeenCalled();
  });
});
