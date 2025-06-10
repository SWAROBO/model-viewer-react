// src/test-setup.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-test-id',
});

// Add any other global setup for tests here
