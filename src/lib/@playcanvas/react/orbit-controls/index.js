import {
    jsx as _jsx,
    Fragment as _Fragment,
    jsxs as _jsxs,
} from "react/jsx-runtime";
import { Vec3 } from "playcanvas";
import { Script } from "@playcanvas/react/components";
import {
    OrbitCamera,
    OrbitCameraInputMouse,
    OrbitCameraInputTouch,
} from "./orbit-camera";
export const OrbitControls = ({
    // Removed distanceMax and distanceMin from props to prevent re-application
    pitchAngleMax = 90,
    pitchAngleMin = 0,
    inertiaFactor = 0.0,
    focusEntity = null,
    pivotPoint = new Vec3(),
    frameOnStart = true,
    distance = 0,
    pitchAngle = 0,
    mouse = { orbitSensitivity: 0.3, distanceSensitivity: 0.15 },
    touch = { orbitSensitivity: 0.4, distanceSensitivity: 0.2 },
}) => {
    const orbitCameraProps = {
        // Removed distanceMax and distanceMin from orbitCameraProps
        pitchAngleMax,
        pitchAngleMin,
        inertiaFactor,
        focusEntity,
        pivotPoint,
        frameOnStart,
        distance,
        pitch: pitchAngle,
    };
    return _jsxs(_Fragment, {
        children: [
            _jsx(Script, { script: OrbitCamera, ...orbitCameraProps }),
            _jsx(Script, { script: OrbitCameraInputMouse, ...mouse }),
            _jsx(Script, { script: OrbitCameraInputTouch, ...touch }),
        ],
    });
};
//# sourceMappingURL=index.js.map
