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
    distanceMax = 20,
    distanceMin = 18,
    pitchAngleMax = 90,
    pitchAngleMin = 0,
    inertiaFactor = 0.0,
    focusEntity = null,
    pivotPoint = new Vec3(),
    frameOnStart = true,
    distance = 0,
    mouse = { orbitSensitivity: 0.3, distanceSensitivity: 0.15 },
    touch = { orbitSensitivity: 0.4, distanceSensitivity: 0.2 },
}) => {
    const orbitCameraProps = {
        distanceMax,
        distanceMin,
        pitchAngleMax,
        pitchAngleMin,
        inertiaFactor,
        focusEntity,
        pivotPoint,
        frameOnStart,
        distance,
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
