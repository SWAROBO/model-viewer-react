import { render, screen, act } from "@testing-library/react";
import { vi } from "vitest";
import ModelViewerCore from "./ModelViewerCore";
import { useSearchParams } from "next/navigation"; // Import the hook to mock it directly
import { Entity } from "@playcanvas/react"; // Import Entity to use vi.mocked
import { Camera, GSplat } from "@playcanvas/react/components"; // Import components for mocking
import { OrbitControls } from "../lib/@playcanvas/react"; // Import OrbitControls for mocking
import { Asset } from "playcanvas"; // Import Asset
import { OrbitCamera } from "../lib/@playcanvas/react/orbit-controls/orbit-camera"; // Import OrbitCamera

// Store onInput functions from mocked components
const dualRangeOnInputs = new Map<string, (values: number[]) => void>();
const singleValueOnInputs = new Map<string, (value: number) => void>();

// Mock PlayCanvas components and hooks
// Mock the main @playcanvas/react package for Entity
// This mock needs to be outside describe/beforeEach due to hoisting
let mockOrbitCamera: OrbitCamera; // Declare mockOrbitCamera at the top level

vi.mock("@playcanvas/react", () => ({
    Entity: vi.fn(({ children, ref, ...props }) => {
        // Simulate the ref being set to an object with a script property
        if (ref) {
            ref.current = {
                script: {
                    orbitCamera: mockOrbitCamera, // Use the top-level mockOrbitCamera
                },
            };
        }
        return <div {...props}>{children}</div>;
    }),
    // Keep other exports if needed by other tests or components
    Application: vi.fn(({ children }) => <div>{children}</div>),
}));

vi.mock("@playcanvas/react/components", () => ({
    Camera: vi.fn(() => null),
    GSplat: vi.fn(() => null),
    EnvAtlas: vi.fn(() => null),
}));

vi.mock("@playcanvas/react/hooks", () => ({
    useEnvAtlas: vi.fn(() => ({ asset: {} })),
}));

vi.mock("../lib/@playcanvas/react", () => ({
    OrbitControls: vi.fn(() => null),
}));

// Mock Next.js useSearchParams at the top level
vi.mock("next/navigation", () => ({
    useSearchParams: vi.fn(), // Just mock the function itself
}));

// Mock child components to simplify testing ModelViewerCore in isolation
vi.mock("./AutoRotate", () => ({
    default: vi.fn(() => <div data-testid="mock-auto-rotate"></div>),
}));
vi.mock("./Grid", () => ({
    default: vi.fn(() => <div data-testid="mock-grid"></div>),
}));
vi.mock("./DualRangeSliderControl", () => ({
    default: vi.fn(
        ({
            onInput,
            title,
            minLabel,
            maxLabel,
            minValue,
            maxValue,
            sliderMin,
            sliderMax,
            step,
        }) => {
            dualRangeOnInputs.set(title, onInput); // Store the onInput function
            return (
                <div
                    data-testid="mock-dual-range-slider"
                    data-title={title}
                    data-min-label={minLabel}
                    data-max-label={maxLabel}
                    data-min-value={minValue}
                    data-max-value={maxValue}
                    data-slider-min={sliderMin}
                    data-slider-max={sliderMax}
                    data-step={step}
                ></div>
            );
        }
    ),
}));
vi.mock("./SingleValueSliderControl", () => ({
    default: vi.fn(({ onInput, label, value, sliderMin, sliderMax, step }) => {
        singleValueOnInputs.set(label, onInput); // Store the onInput function
        return (
            <div
                data-testid="mock-single-value-slider"
                data-label={label}
                data-value={value}
                data-slider-min={sliderMin}
                data-slider-max={sliderMax}
                data-step={step}
            ></div>
        );
    }),
}));

describe("ModelViewerCore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear the stored onInput functions before each test
        dualRangeOnInputs.clear();
        singleValueOnInputs.clear();

        // Reset and mock the orbitCamera properties and methods for each test
        mockOrbitCamera = {
            distanceMin: 0,
            distanceMax: 0,
            distance: 0,
            setDistanceImmediate: vi.fn(),
        } as unknown as OrbitCamera; // Cast to OrbitCamera

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "false";
                return null;
            }),
        });
    });

    it("renders without crashing", () => {
        render(<ModelViewerCore splat={null} />);
        expect(screen.getByTestId("mock-grid")).toBeInTheDocument();
    });

    // Removed tests that rely on `toHaveBeenCalled` for PlayCanvas components or check for their DOM presence when they render null.

    it("renders AutoRotate when showSettings is false", () => {
        render(<ModelViewerCore splat={null} />);
        expect(screen.getByTestId("mock-auto-rotate")).toBeInTheDocument();
    });

    it("does not render AutoRotate when showSettings is true", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });
        render(<ModelViewerCore splat={null} />);
        expect(
            screen.queryByTestId("mock-auto-rotate")
        ).not.toBeInTheDocument();
    });

    it("renders settings controls when showSettings is true", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });
        render(<ModelViewerCore splat={null} />);
        expect(screen.getAllByTestId("mock-dual-range-slider").length).toBe(2);
        expect(screen.getAllByTestId("mock-single-value-slider").length).toBe(
            7
        );
    });

    it("does not render settings controls when showSettings is false", () => {
        render(<ModelViewerCore splat={null} />);
        expect(
            screen.queryByTestId("mock-dual-range-slider")
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTestId("mock-single-value-slider")
        ).not.toBeInTheDocument();
    });

    it("renders GSplat and OrbitControls when splat prop is provided", () => {
        const mockSplat = new Asset("mockSplat", "gsplat", {
            url: "mock.splat",
        }); // Mock Asset object
        render(<ModelViewerCore splat={mockSplat} />);
        // Since GSplat is mocked to return null, we check if it was called
        const GSplatMock = vi.mocked(GSplat);
        expect(GSplatMock).toHaveBeenCalledWith(
            expect.objectContaining({ asset: mockSplat }),
            undefined
        );

        const OrbitControlsMock = vi.mocked(OrbitControls);
        expect(OrbitControlsMock).toHaveBeenCalledWith(
            expect.any(Object),
            undefined
        ); // Expect any object for props, and undefined for the second arg
    });

    it("passes fov prop to Camera component", () => {
        render(<ModelViewerCore splat={null} fov={90} />);
        const CameraMock = vi.mocked(Camera);
        expect(CameraMock).toHaveBeenCalledWith(
            expect.objectContaining({ fov: 90 }),
            undefined
        );
    });

    it("uses default fov when not provided", () => {
        render(<ModelViewerCore splat={null} />);
        const CameraMock = vi.mocked(Camera);
        expect(CameraMock).toHaveBeenCalledWith(
            expect.objectContaining({ fov: 60 }),
            undefined
        );
    });

    it("passes distance props to OrbitControls component", () => {
        const mockSplat = new Asset("mockSplat", "gsplat", {
            url: "mock.splat",
        }); // Mock Asset object
        render(
            <ModelViewerCore
                splat={mockSplat}
                distanceMin={1}
                distanceMax={10}
                distance={5}
            />
        );
        const OrbitControlsMock = vi.mocked(OrbitControls);
        // distanceMin, distanceMax, and distance are now updated imperatively
        expect(OrbitControlsMock).toHaveBeenCalledWith(
            expect.not.objectContaining({
                distanceMin: expect.any(Number),
                distanceMax: expect.any(Number),
                distance: expect.any(Number),
            }),
            undefined
        );
    });

    it("passes pitch angle props to OrbitControls component", () => {
        const mockSplat = new Asset("mockSplat", "gsplat", {
            url: "mock.splat",
        }); // Mock Asset object
        render(
            <ModelViewerCore
                splat={mockSplat}
                pitchAngleMin={-45}
                pitchAngleMax={45}
            />
        );
        const OrbitControlsMock = vi.mocked(OrbitControls);
        expect(OrbitControlsMock).toHaveBeenCalledWith(
            expect.objectContaining({
                pitchAngleMin: -45,
                pitchAngleMax: 45,
            }),
            undefined
        );
    });

    it("passes position prop to GSplat Entity", async () => {
        // Added async
        const mockSplat = new Asset("mockSplat", "gsplat", {
            url: "mock.splat",
        }); // Mock Asset object
        const testPosition: [number, number, number] = [1, 2, 3];
        await act(async () => {
            // Added await and async
            render(
                <ModelViewerCore splat={mockSplat} position={testPosition} />
            );
        });
        const mockedEntity = vi.mocked(Entity);
        const splatEntityCall = mockedEntity.mock.calls.find(
            (call) => call[0].position && call[0].rotation && call[0].scale
        );
        expect(splatEntityCall?.[0].position).toEqual(testPosition);
    });

    it("passes rotation prop to GSplat Entity", async () => {
        // Added async
        const mockSplat = new Asset("mockSplat", "gsplat", {
            url: "mock.splat",
        }); // Mock Asset object
        const testRotation: [number, number, number] = [90, 180, 270];
        await act(async () => {
            // Added await and async
            render(
                <ModelViewerCore splat={mockSplat} rotation={testRotation} />
            );
        });
        const mockedEntity = vi.mocked(Entity);
        const splatEntityCall = mockedEntity.mock.calls.find(
            (call) => call[0].position && call[0].rotation && call[0].scale
        );
        expect(splatEntityCall?.[0].rotation).toEqual(testRotation);
    });

    it("passes scale prop to GSplat Entity", async () => {
        // Added async
        const mockSplat = new Asset("mockSplat", "gsplat", {
            url: "mock.splat",
        }); // Mock Asset object
        const testScale: [number, number, number] = [2, 2, 2];
        await act(async () => {
            // Added await and async
            render(<ModelViewerCore splat={mockSplat} scale={testScale} />);
        });
        const mockedEntity = vi.mocked(Entity);
        const splatEntityCall = mockedEntity.mock.calls.find(
            (call) => call[0].position && call[0].rotation && call[0].scale
        );
        expect(splatEntityCall?.[0].scale).toEqual(testScale);
    });

    it("initializes DualRangeSliderControl for camera distance with correct props when settings are true", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });
        act(() => {
            render(
                <ModelViewerCore
                    splat={null}
                    distanceMin={0.5}
                    distanceMax={15}
                />
            );
        });
        const distanceSlider = screen.getAllByTestId(
            "mock-dual-range-slider"
        )[0];
        expect(distanceSlider).toHaveAttribute("data-min-value", "0.5");
        expect(distanceSlider).toHaveAttribute("data-max-value", "15");
    });

    it("initializes DualRangeSliderControl for camera pitch angle with correct props when settings are true", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });
        act(() => {
            render(
                <ModelViewerCore
                    splat={null}
                    pitchAngleMin={-30}
                    pitchAngleMax={60}
                />
            );
        });
        const pitchAngleSlider = screen.getAllByTestId(
            "mock-dual-range-slider"
        )[1];
        expect(pitchAngleSlider).toHaveAttribute("data-min-value", "-30");
        expect(pitchAngleSlider).toHaveAttribute("data-max-value", "60");
    });

    it("initializes SingleValueSliderControl for model position with correct props when settings are true", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });
        const testPosition: [number, number, number] = [1.1, 2.2, 3.3];
        act(() => {
            render(<ModelViewerCore splat={null} position={testPosition} />);
        });
        const positionSliders = screen
            .getAllByTestId("mock-single-value-slider")
            .slice(1, 4); // Skip the new distance slider
        expect(positionSliders[0]).toHaveAttribute("data-value", "1.1");
        expect(positionSliders[1]).toHaveAttribute("data-value", "2.2");
        expect(positionSliders[2]).toHaveAttribute("data-value", "3.3");
    });

    it("initializes SingleValueSliderControl for model rotation with correct props when settings are true", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });
        const testRotation: [number, number, number] = [10, 20, 30];
        act(() => {
            render(<ModelViewerCore splat={null} rotation={testRotation} />);
        });
        const rotationSliders = screen
            .getAllByTestId("mock-single-value-slider")
            .slice(4, 7); // Skip the new distance slider
        expect(rotationSliders[0]).toHaveAttribute("data-value", "10");
        expect(rotationSliders[1]).toHaveAttribute("data-value", "20");
        expect(rotationSliders[2]).toHaveAttribute("data-value", "30");
    });

    it("updates camera distance range and passes to OrbitControls when DualRangeSliderControl is interacted with", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });

        const initialDistanceMin = 0.1;
        const initialDistanceMax = 30;
        const newDistanceMin = 5;
        const newDistanceMax = 20;

        await act(async () => {
            // Wrap render in act
            const mockSplat = new Asset("mockSplat", "gsplat", {
                url: "mock.splat",
            }); // Mock Asset object
            render(
                <ModelViewerCore
                    splat={mockSplat}
                    distanceMin={initialDistanceMin}
                    distanceMax={initialDistanceMax}
                />
            );
        });

        const onInputDistance = dualRangeOnInputs.get(
            "Camera Distance Settings"
        );

        expect(onInputDistance).toBeDefined();

        await act(async () => {
            onInputDistance!([newDistanceMin, newDistanceMax]);
        });

        // Verify orbitCamera script received the updated distance range
        expect(mockOrbitCamera.distanceMin).toBe(newDistanceMin);
        expect(mockOrbitCamera.distanceMax).toBe(newDistanceMax);
    });

    it("updates camera pitch angle range and passes to OrbitControls when DualRangeSliderControl is interacted with", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });

        const initialPitchMin = -90;
        const initialPitchMax = 90;
        const newPitchMin = -45;
        const newPitchMax = 45;

        await act(async () => {
            // Wrap render in act
            const mockSplat = new Asset("mockSplat", "gsplat", {
                url: "mock.splat",
            }); // Mock Asset object
            render(
                <ModelViewerCore
                    splat={mockSplat}
                    pitchAngleMin={initialPitchMin}
                    pitchAngleMax={initialPitchMax}
                />
            );
        });

        const onInputPitchAngle = dualRangeOnInputs.get(
            "Camera Pitch Angle Settings"
        );

        expect(onInputPitchAngle).toBeDefined();

        await act(async () => {
            onInputPitchAngle!([newPitchMin, newPitchMax]);
        });

        // Verify OrbitControls received the updated pitch angle range
        const OrbitControlsMock = vi.mocked(OrbitControls);
        expect(OrbitControlsMock).toHaveBeenCalledWith(
            expect.objectContaining({
                pitchAngleMin: newPitchMin,
                pitchAngleMax: newPitchMax,
            }),
            undefined
        );
    });

    it("updates model position and passes to GSplat Entity when SingleValueSliderControl is interacted with", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });

        const initialPosition: [number, number, number] = [0, 0, 0];
        const newX = 1.5;
        const newY = -0.5;
        const newZ = 2.0;

        await act(async () => {
            // Wrap render in act
            const mockSplat = new Asset("mockSplat", "gsplat", {
                url: "mock.splat",
            }); // Mock Asset object
            render(
                <ModelViewerCore splat={mockSplat} position={initialPosition} />
            );
        });

        // Find the onInput for Position X
        const onInputPositionX = singleValueOnInputs.get("Position X");
        expect(onInputPositionX).toBeDefined();

        // Find the onInput for Position Y
        const onInputPositionY = singleValueOnInputs.get("Position Y");
        expect(onInputPositionY).toBeDefined();

        // Find the onInput for Position Z
        const onInputPositionZ = singleValueOnInputs.get("Position Z");
        expect(onInputPositionZ).toBeDefined();

        await act(async () => {
            onInputPositionX!(newX);
            onInputPositionY!(newY);
            onInputPositionZ!(newZ);
        });

        // Verify the Entity received the updated position
        const mockedEntity = vi.mocked(Entity);
        // Check the last call to Entity to get the most recent props
        const splatEntityCall = mockedEntity.mock.lastCall;
        expect(splatEntityCall?.[0].position).toEqual([newX, newY, newZ]);
    });

    it("updates model rotation and passes to GSplat Entity when SingleValueSliderControl is interacted with", async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (useSearchParams as any).mockReturnValue({
            get: vi.fn((param) => {
                if (param === "settings") return "true";
                return null;
            }),
        });

        const initialRotation: [number, number, number] = [0, 0, 0];
        const newX = 45;
        const newY = 90;
        const newZ = -30;

        await act(async () => {
            // Wrap render in act
            const mockSplat = new Asset("mockSplat", "gsplat", {
                url: "mock.splat",
            }); // Mock Asset object
            render(
                <ModelViewerCore splat={mockSplat} rotation={initialRotation} />
            );
        });

        // Find the onInput for Rotation X
        const onInputRotationX = singleValueOnInputs.get("Rotation X");
        expect(onInputRotationX).toBeDefined();

        // Find the onInput for Rotation Y
        const onInputRotationY = singleValueOnInputs.get("Rotation Y");
        expect(onInputRotationY).toBeDefined();

        // Find the onInput for Rotation Z
        const onInputRotationZ = singleValueOnInputs.get("Rotation Z");
        expect(onInputRotationZ).toBeDefined();

        await act(async () => {
            onInputRotationX!(newX);
            onInputRotationY!(newY);
            onInputRotationZ!(newZ);
        });

        // Verify the Entity received the updated rotation
        const mockedEntity = vi.mocked(Entity);
        // Check the last call to Entity to get the most recent props
        const splatEntityCall = mockedEntity.mock.lastCall;
        expect(splatEntityCall?.[0].rotation).toEqual([newX, newY, newZ]);
    });
});
