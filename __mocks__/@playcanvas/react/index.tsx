import React from 'react';

export const Application = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-playcanvas-application">{children}</div>;
};
