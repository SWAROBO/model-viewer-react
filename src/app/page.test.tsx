import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import Page from "./page";

// Mock PlayCanvas components as they rely on a browser environment (WebGL context)
// that isn't fully available in a Node.js-based test runner like Vitest.
// This prevents errors related to WebGL context creation during testing.
vi.mock("@playcanvas/react", () => ({
    Application: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    Entity: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

vi.mock("@playcanvas/react/components", () => ({
    Camera: () => <div>Camera</div>,
    Render: () => <div>Render</div>,
    Light: () => <div>Light</div>,
}));

vi.mock("@playcanvas/react/scripts", () => ({
    OrbitControls: () => <div>OrbitControls</div>,
}));

describe("Page Component", () => {
    it("should render without crashing", () => {
        const { container } = render(<Page />);
        expect(container).not.toBeNull();
        expect(container.innerHTML).toContain("Camera");
        expect(container.innerHTML).toContain("Render");
        expect(container.innerHTML).toContain("Light");
        expect(container.innerHTML).toContain("OrbitControls");
    });
});
