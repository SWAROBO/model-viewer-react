// src/test-setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mocks for @playcanvas/react and its sub-modules
// This ensures that all imports from these paths are intercepted and mocked.

// Mock @playcanvas/react
vi.mock('@playcanvas/react', () => ({
  Entity: vi.fn((props) => {
    // A simple mock that renders its children and passes through props
    return <div data-testid="mock-entity" {...props}>{props.children}</div>;
  }),
}));

// Mock @playcanvas/react/components
vi.mock('@playcanvas/react/components', () => ({
  Camera: vi.fn(() => null),
  GSplat: vi.fn(() => null),
  EnvAtlas: vi.fn(() => null),
  Script: vi.fn((props) => { // Mocking Script component
    return <div data-testid="mock-script" {...props}>{props.children}</div>;
  }),
}));

// Mock @playcanvas/react/hooks
vi.mock('@playcanvas/react/hooks', () => ({
  useEnvAtlas: vi.fn(() => ({ asset: {} })),
  useComponent: vi.fn(() => ({})), // Mocking useComponent
  useApp: vi.fn(() => ({ // Mocking useApp
    fire: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    loader: { // Mock app.loader
      getHandler: vi.fn(() => null), // Return null or a mock handler
      addHandler: vi.fn(),
    },
    assets: { // Mock app.assets
      add: vi.fn(),
      load: vi.fn(),
    },
  })),
}));

// Mock the local PlayCanvas React library (../lib/@playcanvas/react)
// This is important because ModelViewerCore imports OrbitControls from here.
vi.mock('../lib/@playcanvas/react', () => ({
  OrbitControls: vi.fn(() => null),
}));

// Mock @playcanvas/react/scripts
vi.mock('@playcanvas/react/scripts', () => ({
  Grid: vi.fn(() => ({})), // Mock the Grid script
  AutoRotator: vi.fn(() => ({})), // Mock the AutoRotator script
}));

// Mock CustomSplatHandler
vi.mock('../lib/playcanvas/CustomSplatHandler', () => ({
  default: vi.fn(() => ({ // Mock the constructor
    // Mock any methods or properties that are accessed on CustomSplatHandler instances
    // For example, if it has a 'test' method: test: vi.fn(),
  })),
}));

// Mock next/navigation for useSearchParams
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn((param) => {
      // Provide a default mock behavior for 'get'
      if (param === 'settings') {
        return 'false'; // Default to false for settings in tests
      }
      return null;
    }),
  })),
}));

// Add any other global setup for tests here
