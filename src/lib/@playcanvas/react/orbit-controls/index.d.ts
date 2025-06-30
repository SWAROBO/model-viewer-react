import { Entity, Vec3 } from "playcanvas";
type OrbitCameraProps = {
    distanceMax?: number;
    distanceMin?: number;
    pitchAngleMax?: number;
    pitchAngleMin?: number;
    inertiaFactor?: number;
    focusEntity?: Entity | null;
    frameOnStart?: boolean;
    distance?: number;
    pitchAngle?: number;
    pivotPoint?: Vec3 | null;
};
type OrbitCameraInputProps = {
    orbitSensitivity?: number;
    distanceSensitivity?: number;
};
type OrbitControls = OrbitCameraProps & {
    mouse?: OrbitCameraInputProps;
    touch?: OrbitCameraInputProps;
};
export declare const OrbitControls: ({ distanceMax, distanceMin, pitchAngleMax, pitchAngleMin, inertiaFactor, focusEntity, pivotPoint, frameOnStart, distance, pitchAngle, mouse, touch, }: OrbitControls) => import("react/jsx-runtime").JSX.Element;
export {};
