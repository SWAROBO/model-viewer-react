import { vi } from 'vitest';

export const mockAppInstance = {
  loader: {
    addHandler: vi.fn(),
    getHandler: vi.fn(),
  },
  on: vi.fn(),
  off: vi.fn(),
  assets: { // Add assets property
    add: vi.fn(),
    load: vi.fn(),
    remove: vi.fn(),
  },
};

export const useApp = vi.fn<() => typeof mockAppInstance | null>(() => mockAppInstance);
