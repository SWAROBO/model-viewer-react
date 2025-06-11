import React from 'react';

export const Application = ({ children }: { children: React.ReactNode }) => {
  return <div data-test-id="mock-playcanvas-application">{children}</div>;
};
