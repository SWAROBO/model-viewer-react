import { render } from '@testing-library/react';
import ServiceWorkerRegistrar from './ServiceWorkerRegistrar';

describe('ServiceWorkerRegistrar', () => {
  const mockRegister = vi.fn(() => Promise.resolve({ scope: '/' }));
  const originalServiceWorker = navigator.serviceWorker;
  const originalWindowSelf = window.self;
  const originalWindowTop = window.top;

  beforeAll(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: mockRegister,
      },
    });
    Object.defineProperty(window, 'self', {
      configurable: true,
      value: window,
    });
    Object.defineProperty(window, 'top', {
      configurable: true,
      value: window,
    });
  });

  afterEach(() => {
    mockRegister.mockClear();
  });

  afterAll(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });
    Object.defineProperty(window, 'self', {
      configurable: true,
      value: originalWindowSelf,
    });
    Object.defineProperty(window, 'top', {
      configurable: true,
      value: originalWindowTop,
    });
  });

  it('should attempt to register a service worker if supported and not in an iframe', () => {
    render(<ServiceWorkerRegistrar />);
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('should not attempt to register a service worker if not supported', () => {
    const originalServiceWorker = navigator.serviceWorker;
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: undefined,
    });

    render(<ServiceWorkerRegistrar />);
    expect(mockRegister).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: originalServiceWorker,
    });
  });

  it('should not attempt to register a service worker if in an iframe', () => {
    const originalWindowTop = window.top;
    Object.defineProperty(window, 'top', {
      configurable: true,
      value: {}, // Simulate being in an iframe
    });

    render(<ServiceWorkerRegistrar />);
    expect(mockRegister).not.toHaveBeenCalled();

    Object.defineProperty(window, 'top', {
      configurable: true,
      value: originalWindowTop,
    });
  });
});
